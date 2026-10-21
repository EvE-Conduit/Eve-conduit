"""zKillboard's all-time statistics for a character, corporation or alliance.

Our own killmails only go back as far as ESI and our syncing do; zKillboard has the whole history. Its API asks for a
descriptive User-Agent, gzip and a gentle rate, so answers are cached for an hour and a failure for a few minutes,
which keeps a slow zKillboard from slowing every sheet.
"""

import logging

import httpx
from django.core.cache import cache

log = logging.getLogger(__name__)

STATS_API = "https://zkillboard.com/api/stats/{kind}ID/{id}/"
PAGE = "https://zkillboard.com/{kind}/{id}/"
KINDS = ("character", "corporation", "alliance")
CACHE_KEY = "zkill:stats:{kind}:{id}"
CACHE_TTL = 3600
FAILURE_TTL = 300


def page_url(kind: str, entity_id: int) -> str:
    return PAGE.format(kind=kind, id=entity_id)


def stats(kind: str, entity_id: int) -> dict:
    """A short summary of zKillboard's stats, or ``{"available": False}`` when zKillboard has none or didn't answer."""
    if kind not in KINDS:
        raise ValueError(f"unknown zKillboard kind {kind!r}")
    key = CACHE_KEY.format(kind=kind, id=entity_id)
    cached = cache.get(key)
    if cached is not None:
        return cached
    raw = _fetch(kind, entity_id)
    out = summarize(raw) if raw else {"available": False}
    out["url"] = page_url(kind, entity_id)
    cache.set(key, out, CACHE_TTL if raw is not None else FAILURE_TTL)
    return out


def _fetch(kind: str, entity_id: int) -> dict | None:
    """zKillboard's stats document; {} when it knows nothing about the entity, None when it didn't answer."""
    from conduit.esi.client import user_agent

    try:
        resp = httpx.get(STATS_API.format(kind=kind, id=entity_id), headers={"User-Agent": user_agent(), "Accept-Encoding": "gzip"},
                         timeout=10, follow_redirects=False)
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError) as e:
        log.info("zKillboard stats for %s %s failed: %s", kind, entity_id, e)
        return None
    # zKillboard answers an unknown id with an empty list or a document without counts.
    return data if isinstance(data, dict) else {}


def _int(value) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def summarize(data: dict) -> dict:
    kills, losses = _int(data.get("shipsDestroyed")), _int(data.get("shipsLost"))
    if not kills and not losses:
        return {"available": False}
    destroyed, lost = _int(data.get("iskDestroyed")), _int(data.get("iskLost"))
    top_ships = []
    for group in data.get("topAllTime") or []:
        if isinstance(group, dict) and group.get("type") == "ship":
            top_ships = [{"type_id": _int(r.get("shipTypeID")), "kills": _int(r.get("kills"))}
                         for r in (group.get("data") or [])[:5] if isinstance(r, dict) and r.get("shipTypeID")]
    active = data.get("activepvp") or {}
    return {
        "available": True,
        "kills": kills,
        "losses": losses,
        "solo_kills": _int(data.get("soloKills")),
        "isk_destroyed": destroyed,
        "isk_lost": lost,
        "efficiency": round(destroyed / (destroyed + lost) * 100, 1) if destroyed + lost else None,
        "danger_ratio": _int(data.get("dangerRatio")),
        "gang_ratio": _int(data.get("gangRatio")),
        # Kills in the last week, zKillboard's "active PvP".
        "recent_kills": _int((active.get("kills") or {}).get("count")) if isinstance(active, dict) else 0,
        "top_ships": top_ships,
    }
