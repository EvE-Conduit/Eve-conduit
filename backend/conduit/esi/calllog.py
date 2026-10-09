"""Recording ESI calls for Administration > Logs > ESI.

``CONDUIT_ESI_LOG``: ``errors`` (default; anything but ok/304), ``all`` or ``off``. Whatever it says, every
call is also counted per hour in the cache, and so is how close each rate-limit group came to its limit, so
Health and the ESI summary see the whole picture without a database row per call.
Sync code can say what a call was for; otherwise the Celery task's name is used::

    with esi_source("sheet:wallet"):
        esi().get(...)
"""

from __future__ import annotations

import contextlib
import contextvars
import logging
import time

from django.conf import settings
from django.core.cache import cache

log = logging.getLogger(__name__)
_source: contextvars.ContextVar[str] = contextvars.ContextVar("esi_source", default="")
LAST_LIMIT_KEY = "esi:last-error-limit"
COUNT_KEY = "esi:count:{hour}:{outcome}"
GROUP_KEY = "esi:rl:{hour}:{group}"
GROUPS_KEY = "esi:rl-groups:{hour}"
STATS_TTL = 8 * 24 * 3600  # the ESI summary goes back 7 days


def _hour(at: float | None = None) -> int:
    return int((at or time.time()) // 3600)


def _count(outcome: str):
    key = COUNT_KEY.format(hour=_hour(), outcome=outcome)
    try:
        cache.add(key, 0, STATS_TTL)
        cache.incr(key)
    except Exception:  # counting must never break the call
        log.debug("Could not count ESI call", exc_info=True)


def hourly_counts(hours: int = 1) -> list[tuple[int, dict[str, int]]]:
    """(hour start as a Unix time, calls per outcome) for the last ``hours`` clock hours, this one included."""
    from .models import EsiCall

    now = _hour()
    span = range(now - hours + 1, now + 1)
    keys = {COUNT_KEY.format(hour=h, outcome=o): (h, o) for h in span for o in EsiCall.Outcome.values}
    out = {h: dict.fromkeys(EsiCall.Outcome.values, 0) for h in span}
    for key, n in cache.get_many(list(keys)).items():
        h, o = keys[key]
        out[h][o] = n
    return [(h * 3600, out[h]) for h in span]


def counts(hours: int = 1) -> dict[str, int]:
    """Calls per outcome over the last ``hours`` clock hours, this one included."""
    total: dict[str, int] = {}
    for _, by_outcome in hourly_counts(hours):
        for o, n in by_outcome.items():
            total[o] = total.get(o, 0) + n
    return total


def note_rate_limit(group: str, limit: str | None, remaining: int | None, character_id: int | None, limited: bool):
    """Keep, per rate-limit group and hour, the fewest tokens any bucket had left and the 429s.
    Read-modify-write without a lock: under heavy load a few updates can be lost, which is fine for a
    display of how close things get."""
    hour = _hour()
    key = GROUP_KEY.format(hour=hour, group=group)
    try:
        stats = cache.get(key) or {"group": group, "limit": "", "calls": 0, "lowest": None, "lowest_character": None, "limited": 0}
        stats["calls"] += 1
        stats["limit"] = limit or stats["limit"]
        if remaining is not None and (stats["lowest"] is None or remaining < stats["lowest"]):
            stats["lowest"], stats["lowest_character"] = remaining, character_id
        stats["limited"] += int(limited)
        cache.set(key, stats, STATS_TTL)
        groups_key = GROUPS_KEY.format(hour=hour)
        groups = cache.get(groups_key) or []
        if group not in groups:
            cache.set(groups_key, [*groups, group], STATS_TTL)
    except Exception:
        log.debug("Could not record rate-limit stats", exc_info=True)


def rate_limit_stats(hours: int = 1) -> list[dict]:
    """Per group over the last ``hours`` clock hours: limit, calls, fewest tokens left (and whose bucket), 429s."""
    now = _hour()
    merged: dict[str, dict] = {}
    for h in range(now - hours + 1, now + 1):
        groups = cache.get(GROUPS_KEY.format(hour=h)) or []
        for stats in cache.get_many([GROUP_KEY.format(hour=h, group=g) for g in groups]).values():
            m = merged.setdefault(stats["group"], {**stats, "calls": 0, "limited": 0, "lowest": None, "lowest_character": None})
            m["limit"] = stats["limit"] or m["limit"]
            m["calls"] += stats["calls"]
            m["limited"] += stats["limited"]
            if stats["lowest"] is not None and (m["lowest"] is None or stats["lowest"] < m["lowest"]):
                m["lowest"], m["lowest_character"] = stats["lowest"], stats["lowest_character"]
    return sorted(merged.values(), key=lambda m: (-m["limited"], m["lowest"] if m["lowest"] is not None else 1e9, m["group"]))


@contextlib.contextmanager
def esi_source(name: str):
    token = _source.set(name)
    try:
        yield
    finally:
        _source.reset(token)


def current_source() -> str:
    if _source.get():
        return _source.get()
    try:
        from celery import current_task

        if current_task and current_task.name:
            return current_task.name.removeprefix("conduit.").replace(".tasks.", ".")
    except Exception:
        pass
    return "web"


def record_call(*, method: str, route: str, path: str, params: dict | None, character_id: int | None,
                outcome: str, started: float, status: int | None = None, error: str = "", headers=None):
    headers = headers or {}
    remain = _int(headers.get("x-esi-error-limit-remain"))
    if remain is not None:
        cache.set(LAST_LIMIT_KEY, {"remain": remain, "reset": _int(headers.get("x-esi-error-limit-reset")), "at": time.time()}, 3600)
    _count(outcome)
    mode = settings.CONDUIT_ESI_LOG
    if mode == "off" or (mode == "errors" and outcome in ("ok", "not_modified")):
        return
    try:
        from .models import EsiCall

        EsiCall.objects.create(
            method=method,
            route=route[:200],
            path=path[:300],
            query="&".join(f"{k}={v}" for k, v in sorted((params or {}).items()))[:300],
            character_id=character_id,
            source=current_source()[:80],
            outcome=outcome,
            status=status,
            duration_ms=int((time.monotonic() - started) * 1000),
            error=error[:300],
            error_limit_remain=remain,
            ratelimit_group=(headers.get("x-ratelimit-group") or "")[:80],
            ratelimit_remaining=_int(headers.get("x-ratelimit-remaining")),
        )
    except Exception:  # the log must never break the call
        log.debug("Could not record ESI call", exc_info=True)


def _int(value) -> int | None:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None
