"""Mounted at /api/p/announcements/. Only reachable while the plugin is enabled."""

from datetime import datetime

from django.contrib.auth.models import Group
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.access.models import State
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import Announcement

router = Router(tags=["announcements"], auth=django_auth)


@router.get("")
def feed(request, all: bool = False):
    """What the user may read, newest first with pinned ones on top. Writers can ask for scheduled and ended ones too."""
    return services.feed(request.user, include_all=all)


class ReadIn(Schema):
    ids: list[int] | None = None


@router.get("/bulletin")
def bulletin(request, limit: int = 4):
    """The latest announcements posted to the landing page that this member may see, pinned first."""
    return services.bulletin(request.user, max(1, min(limit, 12)))


@router.post("/read")
def mark_read(request, payload: ReadIn):
    services.mark_read(request.user, payload.ids)
    return {"unread": services.visible_to(request.user).exclude(reads__user=request.user).count()}


@router.get("/audience")
@require_perm("announcements.post_announcements")
def audience(request):
    return {
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


class AnnouncementIn(Schema):
    title: str
    body: str = ""
    tone: str = "info"
    pinned: bool = False
    on_landing: bool = True
    states: list[int] = []
    groups: list[int] = []
    publish_at: datetime | None = None
    expires_at: datetime | None = None
    notify: bool = True


def _save(request, a, payload: AnnouncementIn):
    try:
        return services.save(a, request.user, **payload.model_dump())
    except services.AnnouncementError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _one(request, a: Announcement) -> dict:
    a = Announcement.objects.select_related("author__main_character").prefetch_related("states", "groups").get(pk=a.pk)
    return services.out(a, set(), editor=True)


@router.post("")
@require_perm("announcements.post_announcements")
def create(request, payload: AnnouncementIn):
    a = _save(request, None, payload)
    record("announcements.create", f"posted the announcement \"{a.title}\"", request=request, target=a)
    return _one(request, a)


def _get(pk: int) -> Announcement:
    a = Announcement.objects.filter(pk=pk).first()
    if a is None:
        raise HttpError(404, "No such announcement")
    return a


@router.put("/{announcement_id}")
@require_perm("announcements.post_announcements")
def update(request, announcement_id: int, payload: AnnouncementIn):
    a = _save(request, _get(announcement_id), payload)
    record("announcements.update", f"edited the announcement \"{a.title}\"", request=request, target=a)
    return _one(request, a)


class PinIn(Schema):
    pinned: bool


@router.post("/{announcement_id}/pin")
@require_perm("announcements.post_announcements")
def pin(request, announcement_id: int, payload: PinIn):
    a = _get(announcement_id)
    a.pinned = payload.pinned
    a.save(update_fields=["pinned"])
    return _one(request, a)


@router.delete("/{announcement_id}")
@require_perm("announcements.post_announcements")
def delete(request, announcement_id: int):
    a = _get(announcement_id)
    record("announcements.delete", f"deleted the announcement \"{a.title}\"", request=request, target=a)
    a.delete()
    return {"ok": True}
