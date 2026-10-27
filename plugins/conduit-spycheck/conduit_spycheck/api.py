"""Mounted at /api/p/spycheck/. Only reachable while the plugin is enabled, and every route needs
spycheck.view_findings (or spycheck.manage_spycheck): members never see it.

Reviewers see the findings, open their evidence (which goes in the snooper and audit logs) and acknowledge or dismiss
them. The watch list, the settings and starting a scan need spycheck.manage_spycheck.
"""

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.paging import page
from conduit.permissions import require_perm

from . import services
from .models import Finding, WatchEntry
from .services import MANAGE_PERM, SpyCheckError

router = Router(tags=["spycheck"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except SpyCheckError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _view(request):
    if not services.can_view(request.user):
        raise HttpError(403, "You don't have permission to do that")


def _finding(request, finding_id: int) -> Finding:
    return get_object_or_404(services.visible(request.user).select_related("user__main_character__corporation", "decided_by__main_character"), pk=finding_id)


# --- reviewers -----------------------------------------------------------------------------------------------------


@router.get("/summary")
def summary(request):
    _view(request)
    return {**services.summary(request.user), "can_manage": request.user.has_perm(MANAGE_PERM)}


@router.get("/findings")
def findings(request, state: str = "new", kind: str = "", q: str = "", user: int | None = None, limit: int = 50, offset: int = 0):
    """Findings, most recently flagged first. Lists show counts and dates only; the records are behind ``/evidence``."""
    _view(request)
    return page(services.findings_qs(request.user, state, kind, q, user), services.finding_out, limit, offset)


@router.get("/findings/{finding_id}")
def finding(request, finding_id: int):
    """One finding with the records behind it (snooped and audited)."""
    _view(request)
    return services.evidence(_finding(request, finding_id), request)


class DecideIn(Schema):
    state: str
    note: str = ""


@router.post("/findings/{finding_id}/state")
def decide(request, finding_id: int, payload: DecideIn):
    _view(request)
    f = _run(services.decide, _finding(request, finding_id), request.user, payload.state, payload.note, request=request)
    return services.finding_out(f)


@router.get("/members")
def members(request, q: str = ""):
    _view(request)
    return {"items": services.members_out(request.user, q)}


@router.get("/members/{user_id}")
def member(request, user_id: int):
    """One member's findings across their characters."""
    _view(request)
    return services.member_detail(get_object_or_404(get_user_model(), pk=user_id), request)


@router.get("/watch")
def watch(request):
    _view(request)
    return {**services.watch_list(), "can_manage": request.user.has_perm(MANAGE_PERM)}


# --- managers ------------------------------------------------------------------------------------------------------


@router.get("/entities")
@require_perm(MANAGE_PERM)
def entities(request, q: str = ""):
    return services.find_entities(q)


class WatchIn(Schema):
    eve_id: int
    reason: str = ""


@router.post("/watch")
@require_perm(MANAGE_PERM)
def add_watch(request, payload: WatchIn):
    w = _run(services.add_watch, payload.eve_id, payload.reason, request.user, request=request)
    return services.watch_out(services.Watched(w.eve_id, w.kind, w.name, Finding.Source.WATCH, w.reason), w)


@router.delete("/watch/{entry_id}")
@require_perm(MANAGE_PERM)
def remove_watch(request, entry_id: int):
    services.remove_watch(get_object_or_404(WatchEntry, pk=entry_id), request.user, request=request)
    return {"ok": True}


@router.get("/settings")
@require_perm(MANAGE_PERM)
def get_settings(request):
    return services.settings_out()


class SettingsIn(Schema):
    notify_group: int | None = None
    use_blacklist: bool
    blacklist_watch_entries: bool
    min_standing: float = 0
    skip_kinds: list[str] = []


@router.put("/settings")
@require_perm(MANAGE_PERM)
def put_settings(request, payload: SettingsIn):
    return services.settings_out(_run(services.save_settings, payload.dict(), request.user, request=request))


@router.post("/scan")
@require_perm(MANAGE_PERM)
def scan(request):
    """Scan everyone now. What's new is sent in the usual digest, as the daily scan would."""
    flagged = services.scan()
    return {**services.summary(request.user), "flagged": len(flagged)}
