"""Mounted at /api/p/blacklist/. Only reachable while the plugin is enabled, and every route needs
blacklist.view_blacklist: members never see the list."""

from datetime import datetime

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .models import Entry, Match
from .services import MANAGE_PERM, VIEW_PERM, BlacklistError

router = Router(tags=["blacklist"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except BlacklistError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _entries():
    return Entry.objects.select_related("added_by", "added_by__main_character").prefetch_related("matches")


def _detail(entry_id: int) -> dict:
    return services.entry_out(get_object_or_404(_entries(), pk=entry_id), detail=True)


# --- entries -----------------------------------------------------------------------------------------------------


@router.get("/entries")
@require_perm(VIEW_PERM)
def entries(request, q: str = "", kind: str = "", severity: str = "", status: str = "active"):
    qs = _entries()
    if q.strip():
        qs = qs.filter(Q(name__icontains=q.strip()) | Q(reason__icontains=q.strip()))
    if kind in Entry.Kind.values:
        qs = qs.filter(kind=kind)
    if severity in Entry.Severity.values:
        qs = qs.filter(severity=severity)
    if status == "active":
        qs = qs.active()
    elif status == "expired":
        qs = qs.filter(expires_at__lte=timezone.now())
    return {"items": [services.entry_out(e) for e in qs[:1000]], "can_manage": request.user.has_perm(MANAGE_PERM)}


@router.get("/entries/{entry_id}")
@require_perm(VIEW_PERM)
def entry(request, entry_id: int):
    return {**_detail(entry_id), "can_manage": request.user.has_perm(MANAGE_PERM)}


class EntryIn(Schema):
    kind: str = ""
    eve_id: int = 0
    reason: str = ""
    severity: str = "banned"
    expires_at: datetime | None = None


@router.post("/entries")
@require_perm(MANAGE_PERM)
def create_entry(request, payload: EntryIn):
    e = _run(services.save_entry, None, payload.dict(), request.user, request=request)
    return _detail(e.pk)


@router.put("/entries/{entry_id}")
@require_perm(MANAGE_PERM)
def update_entry(request, entry_id: int, payload: EntryIn):
    e = _run(services.save_entry, get_object_or_404(Entry, pk=entry_id), payload.dict(), request.user, request=request)
    return _detail(e.pk)


@router.delete("/entries/{entry_id}")
@require_perm(MANAGE_PERM)
def delete_entry(request, entry_id: int):
    services.delete_entry(get_object_or_404(Entry, pk=entry_id), request.user, request=request)
    return {"ok": True}


class NoteIn(Schema):
    text: str


@router.post("/entries/{entry_id}/notes")
@require_perm(VIEW_PERM)
def add_note(request, entry_id: int, payload: NoteIn):
    _run(services.add_note, get_object_or_404(Entry, pk=entry_id), request.user, payload.text)
    return _detail(entry_id)


@router.get("/lookup")
@require_perm(MANAGE_PERM)
def lookup(request, q: str):
    """Exact-name lookup of characters, corporations and alliances, to add one."""
    return _run(services.lookup, q)


@router.get("/check")
@require_perm(VIEW_PERM)
def check(request, q: str):
    """Is someone blacklisted, directly or through their corporation or alliance?"""
    return _run(services.check_name, q)


# --- matches ------------------------------------------------------------------------------------------------------


def _matches():
    return Match.objects.select_related("entry", "user", "user__main_character", "resolved_by", "resolved_by__main_character")


@router.get("/matches")
@require_perm(VIEW_PERM)
def matches(request, status: str = "open"):
    qs = _matches()
    if status == "open":
        qs = qs.filter(resolved_at__isnull=True)
    elif status == "resolved":
        qs = qs.filter(resolved_at__isnull=False)
    return {
        "items": [services.match_out(m) for m in qs[:500]],
        "counts": {"open": Match.objects.filter(resolved_at__isnull=True).count(),
                   "resolved": Match.objects.filter(resolved_at__isnull=False).count()},
    }


class ResolveIn(Schema):
    resolved: bool = True


@router.post("/matches/{match_id}")
@require_perm(VIEW_PERM)
def resolve_match(request, match_id: int, payload: ResolveIn):
    m = services.resolve_match(get_object_or_404(_matches(), pk=match_id), request.user, payload.resolved)
    return services.match_out(m)


@router.get("/summary")
@require_perm(VIEW_PERM)
def summary(request):
    """For the dashboard widget."""
    open_ = _matches().filter(resolved_at__isnull=True)
    return {
        "entries": Entry.objects.active().count(),
        "open_matches": open_.count(),
        "latest": [services.match_out(m) for m in open_[:5]],
    }
