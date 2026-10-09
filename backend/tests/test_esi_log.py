import httpx
import pytest

from conduit.esi.calllog import counts, esi_source
from conduit.esi.client import EsiClient
from conduit.esi.exceptions import EsiBackoff, EsiError
from conduit.esi.models import EsiCall
from conduit.external import areas
from conduit.external.models import ApiKey


def client_with(handler):
    return EsiClient(transport=httpx.MockTransport(handler))


@pytest.fixture(autouse=True)
def record_everything(settings):
    settings.CONDUIT_ESI_LOG = "all"  # the default is errors only; most of these tests look at successful calls


@pytest.mark.django_db
def test_records_each_call_with_outcome_and_limits():
    responses = iter([
        httpx.Response(200, json=[1], headers={"ETag": '"a"', "X-ESI-Error-Limit-Remain": "99", "X-ESI-Error-Limit-Reset": "30"}),
        httpx.Response(404, json={"error": "Character not found"}),
    ])
    esi = client_with(lambda r: next(responses))
    with esi_source("sheet:wallet"):
        esi.get("/characters/123/wallet")
    with pytest.raises(EsiError):
        esi.get("/characters/456/wallet")
    first, second = EsiCall.objects.order_by("id")
    assert (first.outcome, first.status, first.route, first.source, first.error_limit_remain) == ("ok", 200, "/characters/{n}/wallet", "sheet:wallet", 99)
    assert (second.outcome, second.status, second.error, second.source) == ("error", 404, "Character not found", "web")


@pytest.mark.django_db
def test_paused_calls_are_recorded_but_not_sent(settings):
    sent = []
    esi = client_with(lambda r: sent.append(r) or httpx.Response(420, headers={"X-ESI-Error-Limit-Remain": "1", "X-ESI-Error-Limit-Reset": "60"}))
    with pytest.raises(EsiError):
        esi.get("/status")
    with pytest.raises(EsiBackoff):
        esi.get("/status")
    assert len(sent) == 1
    assert list(EsiCall.objects.order_by("id").values_list("outcome", flat=True)) == ["error", "paused"]


@pytest.mark.django_db
def test_errors_only_mode(settings):
    settings.CONDUIT_ESI_LOG = "errors"
    esi = client_with(lambda r: httpx.Response(200, json={}))
    esi.get("/status")
    assert EsiCall.objects.count() == 0
    assert counts()["ok"] == 1  # still counted for Health and the summary


@pytest.mark.django_db
def test_summary_shows_how_close_each_rate_limit_group_came(api_client, admin_user, user):
    remaining = iter([140, 7])
    esi = client_with(lambda r: httpx.Response(
        200, json={}, headers={"X-Ratelimit-Group": "char-wallet", "X-Ratelimit-Limit": "150/15m", "X-Ratelimit-Remaining": str(next(remaining))}
    ))
    esi.get("/characters/1/wallet")
    esi.get(f"/characters/{user.main_character_id}/wallet", character=user.main_character)
    api_client.force_login(admin_user)
    (wallet,) = api_client.call("get", "/api/admin/esi/summary").json()["rate_limits"]
    assert wallet == {"group": "char-wallet", "limit": "150/15m", "calls": 2, "lowest": 7, "rate_limited": 0,
                      "lowest_character": {"id": user.main_character_id, "name": user.main_character.name}}


@pytest.mark.django_db
def test_admin_summary_and_calls(api_client, admin_user, user):
    esi = client_with(lambda r: httpx.Response(500 if "bad" in r.url.path else 200, json={"error": "boom"}))
    esi.get("/ok/1")
    with pytest.raises(EsiError):
        esi.get(f"/characters/{user.main_character_id}/bad")
    api_client.force_login(admin_user)
    summary = api_client.call("get", "/api/admin/esi/summary").json()
    assert summary["total"] == 2 and summary["by_outcome"]["error"] == 1 and summary["timeline"][0]["errors"] == 1
    failed = api_client.call("get", "/api/admin/esi/calls?outcome=failed").json()
    assert failed["count"] == 1 and failed["items"][0]["character"] is None  # no character object passed
    assert api_client.call("get", "/api/admin/esi/calls?outcome=nope").status_code == 400


@pytest.mark.django_db
def test_admin_esi_log_needs_permission(api_client, user):
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/esi/summary").status_code == 403
    assert api_client.call("get", "/api/admin/esi/calls").status_code == 403


@pytest.mark.django_db
def test_external_logs_esi(client):
    areas.set_enabled("logs", True)
    _, secret = ApiKey.issue(name="SIEM", scopes=["logs:esi"])
    client_with(lambda r: httpx.Response(200, json={})).get("/status")
    data = client.get("/api/v1/logs/esi", HTTP_AUTHORIZATION=f"Bearer {secret}").json()
    assert [c["route"] for c in data["items"]] == ["/status"] and data["next_after_id"] == data["items"][0]["id"]
