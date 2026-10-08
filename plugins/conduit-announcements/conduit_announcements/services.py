"""Who sees which announcement, publishing them (notifications and the webhook event), and search."""

from __future__ import annotations

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from conduit.access.models import State
from conduit.eve.models import portrait_url

from .models import Announcement, AnnouncementRead

NOTIFY_LEVEL = {"info": "info", "important": "warning", "urgent": "danger"}


class AnnouncementError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_post(user) -> bool:
    return user.has_perm("announcements.post_announcements")


def live(qs=None):
    now = timezone.now()
    qs = Announcement.objects.all() if qs is None else qs
    return qs.filter(publish_at__lte=now).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))


def visible_to(user, qs=None):
    """Published, unexpired announcements meant for this user."""
    qs = live(qs)
    group_ids = list(user.groups.values_list("pk", flat=True))
    audience = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids)
    if user.state_id:
        audience |= Q(states=user.state_id)
    return qs.filter(audience).distinct()


def audience_users(a: Announcement):
    """Everyone who can read the announcement (only members can open Announcements)."""
    from conduit.access.services import site_members

    users = site_members()
    state_ids = list(a.states.values_list("pk", flat=True))
    group_ids = list(a.groups.values_list("pk", flat=True))
    if not state_ids and not group_ids:
        return users
    return users.filter(Q(state_id__in=state_ids) | Q(groups__in=group_ids)).distinct()


def status(a: Announcement) -> str:
    now = timezone.now()
    if a.publish_at > now:
        return "scheduled"
    if a.expires_at and a.expires_at <= now:
        return "expired"
    return "live"


def out(a: Announcement, read_ids: set[int], editor: bool) -> dict:
    author = a.author
    row = {
        "id": a.pk,
        "title": a.title,
        "body": a.body,
        "tone": a.tone,
        "pinned": a.pinned,
        "on_landing": a.on_landing,
        "publish_at": a.publish_at.isoformat(),
        "expires_at": a.expires_at.isoformat() if a.expires_at else None,
        "edited": a.edited_by_id is not None,
        "updated_at": a.updated_at.isoformat(),
        "author": {"id": author.pk, "name": author.display_name, "portrait": portrait_url(author.main_character_id, 64) if author.main_character_id else None} if author else None,
        "unread": a.pk not in read_ids,
        "status": status(a),
    }
    if editor:
        row |= {
            "notify": a.notify,
            "announced_at": a.announced_at.isoformat() if a.announced_at else None,
            "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in a.states.all()],
            "groups": [{"id": g.pk, "name": g.name} for g in a.groups.all()],
        }
    return row


def feed(user, include_all: bool = False) -> dict:
    editor = can_post(user)
    if include_all and editor:
        qs = Announcement.objects.all()
    else:
        qs = visible_to(user)
    qs = qs.select_related("author__main_character").prefetch_related("states", "groups").order_by("-pinned", "-publish_at")[:200]
    rows = list(qs)
    read_ids = set(AnnouncementRead.objects.filter(user=user, announcement__in=rows).values_list("announcement_id", flat=True))
    unread = visible_to(user).exclude(reads__user=user).count()
    return {"announcements": [out(a, read_ids, editor) for a in rows], "unread": unread, "can_post": editor}


def bulletin(user, limit: int = 4) -> dict:
    """The landing page's Bulletin: live announcements posted there that ``user`` may see, pinned first, then newest."""
    qs = visible_to(user).filter(on_landing=True).select_related("author__main_character")
    rows = list(qs.order_by("-pinned", "-publish_at")[:limit])
    read_ids = set(AnnouncementRead.objects.filter(user=user, announcement__in=rows).values_list("announcement_id", flat=True))
    total = visible_to(user).filter(on_landing=True).count()
    return {"announcements": [out(a, read_ids, editor=False) for a in rows], "more": max(0, total - len(rows))}


def mark_read(user, ids: list[int] | None = None) -> int:
    qs = visible_to(user).exclude(reads__user=user)
    if ids is not None:
        qs = qs.filter(pk__in=ids)
    rows = [AnnouncementRead(announcement_id=pk, user=user) for pk in qs.values_list("pk", flat=True)]
    AnnouncementRead.objects.bulk_create(rows, ignore_conflicts=True)
    return len(rows)


# --- writing ------------------------------------------------------------------------------------------------------


def save(a: Announcement | None, by, *, title: str, body: str, tone: str, pinned: bool, states: list[int], groups: list[int],
         publish_at, expires_at, notify: bool, on_landing: bool = True) -> Announcement:
    title = title.strip()
    if not title:
        raise AnnouncementError("Give it a title")
    if tone not in Announcement.Tone.values:
        raise AnnouncementError("Unknown tone")
    if expires_at and expires_at <= (publish_at or timezone.now()):
        raise AnnouncementError("It has to end after it's published")
    state_objs = list(State.objects.filter(pk__in=states))
    group_objs = list(Group.objects.filter(pk__in=groups))
    if len(state_objs) != len(set(states)) or len(group_objs) != len(set(groups)):
        raise AnnouncementError("Some of those states or groups don't exist")
    new = a is None
    if new:
        a = Announcement(author=by)
    else:
        a.edited_by = by
    a.title, a.body, a.tone, a.pinned, a.notify, a.on_landing = title[:200], body.strip()[:20000], tone, pinned, notify, on_landing
    # No time given: now, except that an edit leaves an already published announcement's date alone.
    a.publish_at = publish_at or (a.publish_at if not new and a.publish_at <= timezone.now() else timezone.now())
    a.expires_at = expires_at
    with transaction.atomic():
        a.save()
        a.states.set(state_objs)
        a.groups.set(group_objs)
    if a.publish_at <= timezone.now():
        announce(a)
    return a


def announce(a: Announcement) -> bool:
    """Tell people about a published announcement, once. Returns whether it did."""
    from conduit.events import bus
    from conduit.notify.services import notify

    claimed = Announcement.objects.filter(pk=a.pk, announced_at__isnull=True, publish_at__lte=timezone.now()).update(announced_at=timezone.now())
    if not claimed:
        return False
    a.refresh_from_db()
    if a.notify:
        users = list(audience_users(a))
        if users:
            notify(users, a.title, _plain(a.body)[:300], link="/p/announcements", level=NOTIFY_LEVEL.get(a.tone, "info"),
                   category="p.announcements", force=a.tone == "urgent")
    bus.emit("announcements.published", announcement_id=a.pk, title=a.title, summary=_plain(a.body)[:500],
             author=a.author.display_name if a.author else None, link="/p/announcements", level=NOTIFY_LEVEL.get(a.tone, "info"))
    return True


def publish_due() -> int:
    """Announce scheduled announcements whose time has come."""
    return sum(announce(a) for a in live(Announcement.objects.filter(announced_at__isnull=True)))


def _plain(md: str) -> str:
    """The body without Markdown marks, for notifications and webhooks."""
    import re

    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md)
    text = re.sub(r"[*_`#>]+", "", text)
    return " ".join(text.split())


def search(request, q, limit):
    """Ctrl+K: announcements the user can read whose title or text matches."""
    rows = visible_to(request.user).filter(Q(title__icontains=q) | Q(body__icontains=q)).order_by("-publish_at")[:limit]
    return {
        "key": "announcements",
        "label": "Announcements",
        "hits": [{"id": f"announcement:{a.pk}", "title": a.title, "subtitle": a.publish_at.strftime("%d %b %Y"), "icon": "bell",
                  "url": f"/p/announcements#a{a.pk}"} for a in rows],
    }
