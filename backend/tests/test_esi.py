import json
import time
from email.utils import formatdate

import httpx
import pytest

from conduit.esi.client import EsiClient
from conduit.esi.exceptions import EsiBackoff, EsiError, EsiRateLimited


def client_with(handler):
    calls = []

    def wrapped(request):
        calls.append(request)
        return handler(request, len(calls))

    return EsiClient(transport=httpx.MockTransport(wrapped)), calls


def test_sends_compatibility_date_and_user_agent(settings):
    settings.ESI_USER_AGENT_CONTACT = "admin@example.com"
    esi, calls = client_with(lambda r, n: httpx.Response(200, json={"players": 1}))
    assert esi.get("/status").data == {"players": 1}
    assert calls[0].headers["X-Compatibility-Date"] == settings.ESI_COMPATIBILITY_DATE
    assert "admin@example.com" in calls[0].headers["User-Agent"]


def test_respects_expires_then_uses_etag():
    expires = formatdate(time.time() + 60, usegmt=True)

    def handler(request, n):
        if n == 1:
            return httpx.Response(200, json=[1, 2], headers={"ETag": '"v1"', "Expires": expires})
        assert request.headers["If-None-Match"] == '"v1"'
        return httpx.Response(304, headers={"Expires": expires})

    esi, calls = client_with(handler)
    assert esi.get("/x").data == [1, 2]
    assert esi.get("/x").from_cache  # still fresh: no request at all
    assert len(calls) == 1

    # Pretend the cache expired: the client revalidates with the ETag.
    from django.core.cache import cache

    key = next(k for k in cache._cache if "esi:resp:" in k).split(":", 2)[-1]
    entry = cache.get(key)
    entry["fresh_until"] = 0
    cache.set(key, entry)
    resp = esi.get("/x")
    assert resp.data == [1, 2] and len(calls) == 2


def test_pauses_when_error_limit_low():
    esi, calls = client_with(
        lambda r, n: httpx.Response(
            404, json={"error": "nope"}, headers={"X-ESI-Error-Limit-Remain": "5", "X-ESI-Error-Limit-Reset": "30"}
        )
    )
    with pytest.raises(EsiError):
        esi.get("/a")
    with pytest.raises(EsiBackoff):
        esi.get("/b")
    assert len(calls) == 1


def test_rate_limit_pauses_that_route_group():
    def handler(request, n):
        return httpx.Response(429, headers={"Retry-After": "12", "X-Ratelimit-Group": "char-wallet"})

    esi, calls = client_with(handler)
    with pytest.raises(EsiRateLimited) as exc:
        esi.get("/characters/1/wallet")
    assert exc.value.retry_after == 12
    with pytest.raises(EsiRateLimited):
        esi.get("/characters/1/wallet")
    assert len(calls) == 1


def test_rate_limit_without_headers_pauses_that_route():
    """Limiters inside the game server answer 429 with only Retry-After."""
    esi, calls = client_with(lambda r, n: httpx.Response(429, headers={"Retry-After": "20"}))
    with pytest.raises(EsiRateLimited):
        esi.get("/characters/1/search")
    with pytest.raises(EsiRateLimited):
        esi.get("/characters/1/search")
    assert len(calls) == 1


def test_rate_limit_pause_covers_group_routes_not_called_yet():
    """The spec's route groups apply a pause to routes no response has told us about, e.g. after a restart."""
    esi, calls = client_with(lambda r, n: httpx.Response(429, headers={"Retry-After": "12", "X-Ratelimit-Group": "char-wallet"}))
    with pytest.raises(EsiRateLimited):
        esi.get("/characters/1/wallet")
    with pytest.raises(EsiRateLimited):
        esi.get("/characters/1/wallet/journal")
    assert len(calls) == 1


def test_get_all_pages():
    def handler(request, n):
        page = int(request.url.params.get("page", 1))
        return httpx.Response(200, json=[page], headers={"X-Pages": "3"})

    esi, _ = client_with(handler)
    assert esi.get_all_pages("/markets/1/orders") == [1, 2, 3]


@pytest.mark.django_db
def test_authenticated_call_uses_character_token(user):
    esi, calls = client_with(lambda r, n: httpx.Response(200, json=json.loads("1000.5")))
    assert esi.get(f"/characters/{user.main_character_id}/wallet", character=user.main_character).data == 1000.5
    assert calls[0].headers["Authorization"] == "Bearer access"


def test_big_one_off_reads_can_stay_out_of_the_cache():
    """A region's order book is hundreds of pages read once: kept out of the cache, they're asked for every time."""
    from django.core.cache import cache

    esi, calls = client_with(lambda r, n: httpx.Response(200, json=[n], headers={"Cache-Control": "max-age=300"}))
    assert esi.get("/markets/1/orders", cache_response=False).data == [1]
    assert esi.get("/markets/1/orders", cache_response=False).data == [2]
    assert not [k for k in cache._cache if "esi:resp:" in k]


def test_cache_control_max_age_is_respected():
    esi, calls = client_with(lambda r, n: httpx.Response(200, json=[n], headers={"Cache-Control": "public, max-age=300"}))
    assert esi.get("/y").data == [1]
    assert esi.get("/y").data == [1]
    assert len(calls) == 1


def test_low_rate_limit_bucket_pauses_group():
    esi, calls = client_with(
        lambda r, n: httpx.Response(200, json=[], headers={"X-Ratelimit-Group": "char-asset", "X-Ratelimit-Remaining": "3"})
    )
    esi.get("/characters/5/assets", params={"page": 1})
    with pytest.raises(EsiRateLimited):
        esi.get("/characters/5/assets", params={"page": 2})
    assert len(calls) == 1


def test_low_bucket_pause_is_worked_out_from_the_limit():
    from conduit.esi.client import refill_wait

    assert refill_wait("150/15m", 4) == 24  # 6 s per token
    assert refill_wait("3600/15m", 4) == 1
    assert refill_wait("15/15m", 4) == 240
    assert refill_wait("15/15m", 100) == 900  # never longer than the window
    assert refill_wait(None, 4) == refill_wait("nonsense", 4) == 60


def test_low_bucket_pause_ends_once_tokens_are_back(monkeypatch):
    import conduit.esi.client as client

    now = [1000.0]
    monkeypatch.setattr(client.time, "time", lambda: now[0])
    esi, calls = client_with(lambda r, n: httpx.Response(
        200, json=[], headers={"X-Ratelimit-Group": "char-wallet", "X-Ratelimit-Limit": "150/15m", "X-Ratelimit-Remaining": "4"}
    ))
    esi.get("/characters/5/wallet/journal", params={"page": 1})
    with pytest.raises(EsiRateLimited) as exc:
        esi.get("/characters/5/wallet/journal", params={"page": 2})
    assert exc.value.retry_after == 24  # (6 reserve + 2 - 4 left) tokens at 6 s each, not a flat minute
    now[0] += 25
    esi.get("/characters/5/wallet/journal", params={"page": 2})
    assert len(calls) == 2
