"""Administration > Health: is everything the site depends on working?"""

from __future__ import annotations

import platform
import time
from datetime import timedelta

import django
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.db.models import Count
from django.utils import timezone
from ninja import Router

from conduit import __version__
from conduit.permissions import require_perm

from .checks import security_warnings
from .tasks import HEARTBEAT_KEY

router = Router(tags=["admin"])


def _timed(fn):
    started = time.monotonic()
    try:
        detail = fn()
        return {"ok": True, "ms": round((time.monotonic() - started) * 1000, 1), "detail": detail}
    except Exception as exc:
        return {"ok": False, "ms": round((time.monotonic() - started) * 1000, 1), "detail": str(exc)[:200]}


def _database():
    with connection.cursor() as cur:
        cur.execute("SELECT 1")
    return connection.vendor


def _cache():
    key = "conduit:health-probe"
    cache.set(key, 1, 10)
    if cache.get(key) != 1:
        raise RuntimeError("value written to the cache could not be read back")
    return "redis" if settings.REDIS_URL else "in-memory (development)"


def _celery() -> dict:
    if settings.CELERY_TASK_ALWAYS_EAGER:
        return {"mode": "inline", "ok": True, "workers": [], "queue_length": 0, "heartbeat_age": None,
                "detail": "No REDIS_URL: background jobs run inline and there is no scheduler"}
    from conduit.celery import app

    out = {"mode": "workers", "workers": [], "queue_length": None, "heartbeat_age": None, "detail": ""}
    try:
        replies = app.control.inspect(timeout=1.0).ping() or {}
        out["workers"] = sorted(replies)
    except Exception as exc:
        out["detail"] = f"Could not reach workers: {exc}"[:200]
    try:
        with app.connection_for_read() as conn:
            out["queue_length"] = conn.default_channel.client.llen(settings.CELERY_TASK_DEFAULT_QUEUE)
    except Exception:
        pass
    beat = cache.get(HEARTBEAT_KEY)
    if beat:
        out["heartbeat_age"] = round(time.time() - beat)
    out["ok"] = bool(out["workers"]) and out["heartbeat_age"] is not None and out["heartbeat_age"] < 300
    if not out["detail"]:
        if not out["workers"]:
            out["detail"] = "No worker answered"
        elif out["heartbeat_age"] is None or out["heartbeat_age"] >= 300:
            out["detail"] = "The scheduler (beat) hasn't run a heartbeat in the last 5 minutes"
    return out


def _esi() -> dict:
    from conduit.esi.calllog import LAST_LIMIT_KEY
    from conduit.esi.client import ERROR_PAUSE_KEY
    from conduit.esi.models import EsiCall
    from conduit.esi.tokens import sso_configured

    since = timezone.now() - timedelta(hours=1)
    recent = EsiCall.objects.filter(at__gte=since)
    failed = recent.filter(outcome__in=[EsiCall.Outcome.ERROR, EsiCall.Outcome.RATE_LIMITED, EsiCall.Outcome.NETWORK]).count()
    total = recent.count()
    limit = cache.get(LAST_LIMIT_KEY)
    paused = cache.get(ERROR_PAUSE_KEY)
    paused = paused if paused and paused > time.time() else None
    return {
        "sso_configured": sso_configured(),
        "calls_last_hour": total,
        "failed_last_hour": failed,
        "error_limit_remain": limit["remain"] if limit else None,
        "error_limit_threshold": settings.ESI_ERROR_LIMIT_THRESHOLD,
        "paused_for": round(paused - time.time()) if paused else None,
        "ok": sso_configured() and not paused and (total == 0 or failed / total < 0.2),
    }


def _sync() -> dict:
    from conduit.accounts.models import Token
    from conduit.sheet.models import SyncStatus

    now = timezone.now()
    by_result = dict(SyncStatus.objects.values_list("result").annotate(n=Count("id")).values_list("result", "n"))
    overdue = SyncStatus.objects.filter(character__token__valid=True, next_due__lt=now - timedelta(minutes=15)).count()
    return {
        "by_result": by_result,
        "overdue": overdue,
        "tokens_total": Token.objects.count(),
        "tokens_invalid": Token.objects.filter(valid=False).count(),
        "ok": overdue < 50,
    }


def _data() -> dict:
    from conduit.eve.models import MarketPrice
    from conduit.sde.models import SdeVersion

    sde = SdeVersion.objects.first()
    newest_price = MarketPrice.objects.order_by("-updated_at").values_list("updated_at", flat=True).first()
    return {
        "sde_build": sde.build_number if sde else None,
        "sde_imported_at": sde.imported_at.isoformat() if sde else None,
        "prices_updated_at": newest_price.isoformat() if newest_price else None,
        "ok": sde is not None,
    }


def _problems() -> dict:
    from conduit.audit.models import ServiceLog
    from conduit.events.models import Webhook

    since = timezone.now() - timedelta(hours=24)
    return {
        "errors_24h": ServiceLog.objects.filter(at__gte=since, level__in=["ERROR", "CRITICAL"]).count(),
        "warnings_24h": ServiceLog.objects.filter(at__gte=since, level="WARNING").count(),
        "failing_webhooks": list(Webhook.objects.filter(enabled=True, failures__gt=0).values("id", "name", "failures", "last_error")),
    }


@router.get("/health")
@require_perm("site.view_health")
def health(request):
    from conduit.accounts.models import User
    from conduit.plugins.services import enabled_ids

    checks = {
        "database": _timed(_database),
        "cache": _timed(_cache),
    }
    celery = _celery()
    esi_state = _esi()
    sync = _sync()
    data = _data()
    status = "ok"
    if not (checks["database"]["ok"] and checks["cache"]["ok"]):
        status = "down"
    elif not (celery["ok"] and esi_state["ok"] and sync["ok"] and data["ok"]):
        status = "degraded"
    return {
        "status": status,
        "checked_at": timezone.now().isoformat(),
        "checks": checks,
        "celery": celery,
        "esi": esi_state,
        "sync": sync,
        "data": data,
        "problems": _problems(),
        "security": security_warnings(),
        "about": {
            "version": __version__,
            "python": platform.python_version(),
            "django": django.get_version(),
            "debug": settings.DEBUG,
            "database": connection.vendor,
            "users": User.objects.count(),
            "modules_enabled": len(enabled_ids()),
        },
    }
