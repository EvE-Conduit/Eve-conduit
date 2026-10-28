"""Mounted at /api/p/tracking/. Only reachable while the plugin is enabled, and every route needs
tracking.track_members: the tracked member never sees it.

Sessions are narrowed to members whose characters the viewer's sheet permissions reach, never the viewer themselves.
"""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.paging import page
from conduit.permissions import require_perm

from . import services
from .models import Session
from .services import PERM, TrackingError

router = Router(tags=["tracking"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except TrackingError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _session(request, session_id: int) -> Session:
    return get_object_or_404(services.visible(request.user).select_related(
        "target__main_character__corporation", "started_by__main_character", "stopped_by__main_character"), pk=session_id)


@router.get("/sessions")
@require_perm(PERM)
def sessions(request, state: str = "", limit: int = 50, offset: int = 0):
    """Tracking sessions, newest first: ``state`` is "running", "finished" or empty for both."""
    return page(services.sessions_qs(request.user, state), services.session_out, limit, offset)


@router.get("/members")
@require_perm(PERM)
def members(request, q: str = ""):
    """Members to pick from, by any of their characters' names."""
    items = services.find_members(request.user, q)
    return {"items": items, "reason": "" if items or len(q.strip()) < 2 else services.why_nothing(request.user, q)}


class StartIn(Schema):
    user_id: int
    days: int
    reason: str = ""


@router.post("/sessions")
@require_perm(PERM)
def start(request, payload: StartIn):
    s = _run(services.start, request.user, payload.user_id, payload.days, payload.reason, request=request)
    return services.session_out(s)


@router.get("/new-members")
@require_perm(PERM)
def new_members(request, days: int = 7):
    """Who joined a corporation in the last ``days`` days (1 to 60), to start tracking them."""
    if not 1 <= days <= 60:
        raise HttpError(400, "Look back 1 to 60 days")
    return services.new_joiners(request.user, days)


class StartManyIn(Schema):
    user_ids: list[int]
    days: int
    reason: str = ""


@router.post("/sessions/many")
@require_perm(PERM)
def start_many(request, payload: StartManyIn):
    if not payload.user_ids or len(payload.user_ids) > 100:
        raise HttpError(400, "Pick 1 to 100 members")
    if not services.MIN_DAYS <= payload.days <= services.MAX_DAYS:
        raise HttpError(400, f"Track for {services.MIN_DAYS} to {services.MAX_DAYS} days")
    return services.start_many(request.user, payload.user_ids, payload.days, payload.reason, request=request)


@router.get("/sessions/{session_id}")
@require_perm(PERM)
def report(request, session_id: int):
    """The report (snooped and audited)."""
    return services.report(_session(request, session_id), request)


@router.post("/sessions/{session_id}/stop")
@require_perm(PERM)
def stop(request, session_id: int):
    return services.session_out(_run(services.stop, _session(request, session_id), request.user, request=request))


@router.delete("/sessions/{session_id}")
@require_perm(PERM)
def delete(request, session_id: int):
    services.delete(_session(request, session_id), request.user, request=request)
    return {"ok": True}
