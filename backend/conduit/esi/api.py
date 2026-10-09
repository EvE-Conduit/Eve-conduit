"""Administration > Logs > ESI: what EvE Conduit asked ESI, how it went, and how close the error limit is."""

import time
from datetime import UTC, datetime, timedelta

from django.conf import settings
from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from conduit.paging import page
from conduit.permissions import require_perm

from .calllog import LAST_LIMIT_KEY, counts, hourly_counts, rate_limit_stats
from .client import ERROR_PAUSE_KEY
from .models import EsiCall
from .rate_groups import GROUP_LIMITS

router = Router(tags=["admin"])
FAILED = Q(outcome__in=[EsiCall.Outcome.ERROR, EsiCall.Outcome.RATE_LIMITED, EsiCall.Outcome.NETWORK])


def call_out(c: EsiCall, names: dict | None = None) -> dict:
    return {
        "id": c.pk,
        "at": c.at.isoformat(),
        "method": c.method,
        "route": c.route,
        "path": c.path,
        "query": c.query,
        "character": {"id": c.character_id, "name": (names or {}).get(c.character_id, "")} if c.character_id else None,
        "source": c.source,
        "outcome": c.outcome,
        "status": c.status,
        "duration_ms": c.duration_ms,
        "error": c.error,
        "error_limit_remain": c.error_limit_remain,
        "ratelimit_group": c.ratelimit_group,
        "ratelimit_remaining": c.ratelimit_remaining,
    }


def character_names(calls) -> dict:
    return character_names_by_id({c.character_id for c in calls})


def character_names_by_id(ids) -> dict:
    from conduit.accounts.models import Character

    return dict(Character.objects.filter(pk__in={i for i in ids if i}).values_list("pk", "name"))


def filter_calls(qs, outcome: str = "", route: str = "", source: str = "", character: int | None = None, status: int | None = None):
    if outcome == "failed":
        qs = qs.filter(FAILED)
    elif outcome:
        if outcome not in EsiCall.Outcome.values:
            raise HttpError(400, f"outcome must be failed or one of {', '.join(EsiCall.Outcome.values)}")
        qs = qs.filter(outcome=outcome)
    if route:
        qs = qs.filter(route__icontains=route)
    if source:
        qs = qs.filter(source__startswith=source)
    if character:
        qs = qs.filter(character_id=character)
    if status:
        qs = qs.filter(status=status)
    return qs


@router.get("/esi/calls")
@require_perm("site.view_logs")
def esi_calls(request, outcome: str = "", route: str = "", source: str = "", character: int | None = None,
              status: int | None = None, limit: int = 50, offset: int = 0):
    qs = filter_calls(EsiCall.objects.all(), outcome, route, source, character, status)
    result = page(qs, lambda c: c, limit, offset)
    names = character_names(result["items"])
    result["items"] = [call_out(c, names) for c in result["items"]]
    return result


@router.get("/esi/summary")
@require_perm("site.view_logs")
def esi_summary(request, hours: int = 24):
    hours = max(1, min(hours, 24 * 30))
    since = timezone.now() - timedelta(hours=hours)
    qs = EsiCall.objects.filter(at__gte=since)
    # Totals come from the hourly counters, which see every call whatever CONDUIT_ESI_LOG records.
    by_hour = hourly_counts(hours)
    by_outcome = counts(hours)
    failed_outcomes = (EsiCall.Outcome.ERROR, EsiCall.Outcome.RATE_LIMITED, EsiCall.Outcome.NETWORK)
    limit = cache.get(LAST_LIMIT_KEY)
    paused_until = cache.get(ERROR_PAUSE_KEY)

    def grouped(field):
        rows = (
            qs.values(field)
            .annotate(calls=Count("id"), errors=Count("id", filter=FAILED), avg_ms=Avg("duration_ms"))
            .order_by("-calls")[:15]
        )
        return [{field: r[field], "calls": r["calls"], "errors": r["errors"], "avg_ms": round(r["avg_ms"] or 0)} for r in rows]

    timeline = [
        {"hour": datetime.fromtimestamp(at, tz=UTC).isoformat(), "calls": sum(n.values()), "errors": sum(n[o] for o in failed_outcomes)}
        for at, n in by_hour
        if any(n.values())
    ]
    groups = rate_limit_stats(hours)
    names = character_names_by_id({g["lowest_character"] for g in groups})
    rate_limits = [
        {
            "group": g["group"],
            "limit": g["limit"] or GROUP_LIMITS.get(g["group"], ""),
            "calls": g["calls"],
            "lowest": g["lowest"],
            "lowest_character": {"id": g["lowest_character"], "name": names.get(g["lowest_character"], "")}
            if g["lowest_character"] else None,
            "rate_limited": g["limited"],
        }
        for g in groups
    ]
    return {
        "hours": hours,
        "mode": settings.CONDUIT_ESI_LOG,
        "retention_days": settings.CONDUIT_ESI_LOG_DAYS,
        "total": sum(by_outcome.values()),
        "by_outcome": {o: by_outcome.get(o, 0) for o in EsiCall.Outcome.values},
        "avg_ms": round(qs.exclude(outcome="paused").aggregate(a=Avg("duration_ms"))["a"] or 0),
        "error_limit": {
            "remain": limit["remain"],
            "reset": limit["reset"],
            "seen_at": datetime.fromtimestamp(limit["at"], tz=UTC).isoformat(),
        } if limit else None,
        "error_limit_threshold": settings.ESI_ERROR_LIMIT_THRESHOLD,
        "paused_until": datetime.fromtimestamp(paused_until, tz=UTC).isoformat()
        if paused_until and paused_until > time.time() else None,
        "routes": grouped("route"),
        "sources": grouped("source"),
        "timeline": timeline,
        "rate_limits": rate_limits,
    }
