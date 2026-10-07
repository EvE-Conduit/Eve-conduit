"""Recording ESI calls for Administration > Logs > ESI.

``EVECSM_ESI_LOG``: ``all`` (default), ``errors`` (anything but ok/304) or ``off``.
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
            return current_task.name.removeprefix("evecsm.").replace(".tasks.", ".")
    except Exception:
        pass
    return "web"


def record_call(*, method: str, route: str, path: str, params: dict | None, character_id: int | None,
                outcome: str, started: float, status: int | None = None, error: str = "", headers=None):
    headers = headers or {}
    remain = _int(headers.get("x-esi-error-limit-remain"))
    if remain is not None:
        cache.set(LAST_LIMIT_KEY, {"remain": remain, "reset": _int(headers.get("x-esi-error-limit-reset")), "at": time.time()}, 3600)
    mode = settings.EVECSM_ESI_LOG
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
