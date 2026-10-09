"""The one way EvE Conduit talks to ESI.

Plugins must go through this client rather than calling ESI themselves. It
respects ESI caching (``Expires``/``ETag``), tracks the shared error limit and
the per-route rate limits, and refreshes character tokens, so one plugin can't
get the whole install banned.
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import re
import time
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from typing import Any

import httpx
from django.conf import settings
from django.core.cache import cache

from conduit import __version__

from .calllog import note_rate_limit, record_call
from .exceptions import EsiBackoff, EsiError, EsiRateLimited
from .rate_groups import GROUP_LIMITS, ROUTE_GROUPS
from .tokens import get_access_token

log = logging.getLogger(__name__)

ERROR_PAUSE_KEY = "esi:error-pause-until"
RATE_PAUSE_KEY = "esi:rate-pause:{group}:{character}"
ROUTE_GROUP_KEY = "esi:route-group:{route}"
RATE_LIMIT_RESERVE = 6  # tokens; a 4xx costs 5


def user_agent() -> str:
    contact = settings.ESI_USER_AGENT_CONTACT
    return f"EvE-Conduit/{__version__} (+https://github.com/EvE-Conduit/Eve-conduit{'; ' + contact if contact else ''})"


@dataclass
class EsiResponse:
    data: Any
    status: int
    headers: dict
    from_cache: bool = False

    @property
    def pages(self) -> int:
        return int(self.headers.get("x-pages", 1))


def _cache_key(method: str, path: str, params: dict | None, character_id: int | None) -> str:
    raw = json.dumps([method, path, sorted((params or {}).items()), character_id], default=str)
    return "esi:resp:" + hashlib.sha256(raw.encode()).hexdigest()


MAX_AGE_RE = re.compile(r"max-age=(\d+)")


def _fresh_for(headers: dict) -> int:
    """Seconds ESI says the response stays fresh: Cache-Control max-age, else Expires."""
    match = MAX_AGE_RE.search(headers.get("cache-control", ""))
    if match:
        return int(match[1])
    expires = headers.get("expires")
    if not expires:
        return 0
    try:
        return max(0, int(parsedate_to_datetime(expires).timestamp() - time.time()))
    except (TypeError, ValueError):
        return 0


class EsiClient:
    def __init__(self, transport: httpx.BaseTransport | None = None, timeout: float = 20.0):
        self._http = httpx.Client(
            base_url=settings.ESI_BASE_URL,
            transport=transport,
            timeout=timeout,
            headers={
                "User-Agent": user_agent(),
                "X-Compatibility-Date": settings.ESI_COMPATIBILITY_DATE,
                "Accept": "application/json",
            },
        )

    # -- public API ---------------------------------------------------------

    def get(self, path: str, *, character=None, params: dict | None = None) -> EsiResponse:
        """GET a route, e.g. ``client.get("/characters/{id}/wallet", character=c)``."""
        return self._request("GET", path, character=character, params=params)

    def get_all_pages(self, path: str, *, character=None, params: dict | None = None) -> list:
        first = self.get(path, character=character, params=params)
        items = list(first.data)
        for page in range(2, first.pages + 1):
            items += self.get(path, character=character, params={**(params or {}), "page": page}).data
        return items

    def post(self, path: str, body: Any, *, character=None) -> EsiResponse:
        """POST routes (e.g. ``/universe/names``) are not cached."""
        return self._request("POST", path, character=character, body=body)

    # -- internals ----------------------------------------------------------

    def _check_pauses(self, path: str, character_id: int | None):
        now = time.time()
        until = cache.get(ERROR_PAUSE_KEY)
        if until and until > now:
            raise EsiBackoff(until - now, "ESI error limit nearly reached")
        bucket = _bucket(path)
        until = cache.get(RATE_PAUSE_KEY.format(group=bucket, character=character_id))
        if until and until > now:
            raise EsiRateLimited(until - now, bucket)

    def _record_limits(self, path: str, character_id: int | None, resp: httpx.Response):
        remain = resp.headers.get("x-esi-error-limit-remain")
        reset = resp.headers.get("x-esi-error-limit-reset")
        if remain is not None and reset is not None and int(remain) < settings.ESI_ERROR_LIMIT_THRESHOLD:
            log.warning("ESI error limit low (%s left), pausing for %ss", remain, reset)
            cache.set(ERROR_PAUSE_KEY, time.time() + int(reset), int(reset) + 1)

        group = resp.headers.get("x-ratelimit-group")
        remaining = _int(resp.headers.get("x-ratelimit-remaining"))
        limit = resp.headers.get("x-ratelimit-limit") or GROUP_LIMITS.get(group or ROUTE_GROUPS.get(_route(path), ""))
        if group:
            cache.set(ROUTE_GROUP_KEY.format(route=_route(path)), group, 24 * 3600)
            if remaining is not None and remaining < RATE_LIMIT_RESERVE and resp.status_code != 429:
                # Leave the bucket a little headroom instead of running it dry: wait about as long as the
                # window takes to hand back enough tokens for the next request.
                wait = refill_wait(limit, RATE_LIMIT_RESERVE + 2 - remaining)
                cache.set(RATE_PAUSE_KEY.format(group=group, character=character_id), time.time() + wait, wait + 1)
        bucket = group or _bucket(path)
        if group or resp.status_code == 429:
            note_rate_limit(bucket, limit, remaining, character_id, limited=resp.status_code == 429)
        if resp.status_code == 429:
            # Some routes are limited inside the game server and answer 429 without rate-limit headers;
            # pause them under the same key _check_pauses looks at.
            retry = int(resp.headers.get("retry-after", 60))
            cache.set(RATE_PAUSE_KEY.format(group=bucket, character=character_id), time.time() + retry, retry + 1)
            raise EsiRateLimited(retry, bucket)

    def _request(self, method, path, *, character=None, params=None, body=None) -> EsiResponse:
        character_id = character.pk if character is not None else None
        key = _cache_key(method, path, params, character_id) if method == "GET" else None
        cached = cache.get(key) if key else None
        # Never ask ESI again before its cache expires; doing so can get an app banned.
        if cached and cached["fresh_until"] > time.time():
            return EsiResponse(cached["data"], 200, cached["headers"], from_cache=True)

        started = time.monotonic()
        call = {"method": method, "route": _route(path), "path": path, "params": params, "character_id": character_id}
        try:
            self._check_pauses(path, character_id)
        except EsiBackoff as exc:
            record_call(**call, outcome="paused", started=started, error=str(exc))
            raise
        headers = {}
        if character is not None:
            headers["Authorization"] = f"Bearer {get_access_token(character)}"
        if cached and cached.get("etag"):
            headers["If-None-Match"] = cached["etag"]

        try:
            resp = self._http.request(method, path, params=params, json=body, headers=headers)
        except httpx.HTTPError as exc:
            record_call(**call, outcome="network", started=started, error=str(exc))
            raise EsiError(0, f"ESI request failed: {exc}") from exc
        resp_headers = {k.lower(): v for k, v in resp.headers.items()}
        try:
            self._record_limits(path, character_id, resp)
        except EsiRateLimited:
            record_call(**call, outcome="rate_limited", started=started, status=429, error=_error_text(resp), headers=resp_headers)
            raise

        if resp.status_code == 304 and cached:
            data = cached["data"]
            record_call(**call, outcome="not_modified", started=started, status=304, headers=resp_headers)
        elif resp.is_success:
            data = resp.json() if resp.content else None
            record_call(**call, outcome="ok", started=started, status=resp.status_code, headers=resp_headers)
        else:
            record_call(**call, outcome="error", started=started, status=resp.status_code, error=_error_text(resp), headers=resp_headers)
            raise EsiError(resp.status_code, _error_text(resp))

        if key:
            ttl = _fresh_for(resp_headers)
            cache.set(
                key,
                {
                    "data": data,
                    "headers": resp_headers,
                    "etag": resp_headers.get("etag"),
                    "fresh_until": time.time() + ttl,
                },
                ttl + 24 * 3600,  # keep the ETag around after expiry
            )
        return EsiResponse(data, resp.status_code, resp_headers, from_cache=resp.status_code == 304)


def _route(path: str) -> str:
    """``/characters/123/wallet`` -> ``/characters/{n}/wallet``, for rate-limit bookkeeping."""
    return "/".join("{n}" if part.isdigit() else part for part in path.split("/"))


def _bucket(path: str) -> str:
    """The rate-limit group a route's pauses are kept under: what ESI last said, else the spec's group
    (rate_groups.py), else the route itself for routes ESI hasn't put in a group."""
    route = _route(path)
    return cache.get(ROUTE_GROUP_KEY.format(route=route)) or ROUTE_GROUPS.get(route) or route


LIMIT_RE = re.compile(r"^\s*(\d+)\s*/\s*(\d+)\s*([smhd])\s*$")
UNIT_SECONDS = {"s": 1, "m": 60, "h": 3600, "d": 86400}


def refill_wait(limit: str | None, tokens: int) -> int:
    """Seconds for a floating window like ``150/15m`` to hand back ``tokens``, assuming steady use
    (ESI doesn't say when the tokens in a bucket were spent). 60 when the limit is unknown."""
    match = LIMIT_RE.match(limit or "")
    if not match or not int(match[1]):
        return 60
    window = int(match[2]) * UNIT_SECONDS[match[3]]
    return max(1, min(window, math.ceil(max(tokens, 1) * window / int(match[1]))))


def _int(value) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _error_text(resp: httpx.Response) -> str:
    try:
        return resp.json().get("error", resp.text)
    except ValueError:
        return resp.text[:200]


_default: EsiClient | None = None


def esi() -> EsiClient:
    """Shared client for the current process."""
    global _default
    if _default is None:
        _default = EsiClient()
    return _default
