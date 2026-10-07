"""Sending notifications. Plugins call ``notify`` (also exported as ``conduit.notify.notify``)."""

from __future__ import annotations

import logging
from collections.abc import Iterable
from urllib.parse import urlsplit

from conduit.events import bus

from .models import Notification

log = logging.getLogger(__name__)


def is_site_path(link: str) -> bool:
    """A path on this site: "/groups", not "//evil.example" or "/\\evil.example" (both leave the site)."""
    return link.startswith("/") and not link.startswith(("//", "/\\")) and "\\" not in link


def is_external_url(link: str) -> bool:
    parts = urlsplit(link)
    return parts.scheme == "https" and bool(parts.hostname) and not parts.username and not parts.password


def safe_link(link: str) -> str:
    """The link if it's a site path or an https:// URL, otherwise "" (never javascript:, data:, http: ...)."""
    link = (link or "").strip()
    if not link or is_site_path(link) or is_external_url(link):
        return link
    log.warning("Dropped an unsafe notification link: %.80r", link)
    return ""

CATEGORIES = {
    "system": "System messages",
    "groups": "Group requests and membership",
    "tokens": "Characters that need a new login",
    "compliance": "Compliance",
    "admin": "Administration alerts",
}


def register_category(key: str, label: str):
    """Plugins add their own categories (use ``p.<plugin id>`` or ``p.<plugin id>.<name>``)."""
    CATEGORIES[key] = label


def _users(target) -> list:
    from conduit.accounts.models import User

    if isinstance(target, User):
        return [target]
    if isinstance(target, int):
        return list(User.objects.filter(pk=target))
    items = list(target)
    if items and isinstance(items[0], int):
        return list(User.objects.filter(pk__in=items))
    return items


def muted(user, category: str) -> bool:
    from conduit.accounts.models import UserPreferences

    prefs = UserPreferences.objects.filter(user=user).only("muted_categories").first()
    return bool(prefs and category in prefs.muted_categories)


def notify(target, title: str, body: str = "", *, link: str = "", level: str = "info",
           category: str = "system", data: dict | None = None, force: bool = False) -> list[Notification]:
    """Send a notification to a user, a user id, or an iterable of either.

    Users who muted ``category`` don't get it unless ``force`` is set.
    """
    link = safe_link(link)
    out = []
    for user in _users(target):
        if not force and muted(user, category):
            continue
        n = Notification.objects.create(
            user=user, title=title[:200], body=body, link=link[:500], level=level, category=category[:40], data=data or {}
        )
        out.append(n)
        bus.emit("notification.created", user_id=user.pk, user=user.display_name, title=n.title, summary=body[:500],
                 level=level, category=category, link=link)
    return out


def notify_permission(perm: str, title: str, body: str = "", **kwargs) -> list[Notification]:
    """Notify everyone holding a permission (superusers included)."""
    return notify(users_with_perm(perm), title, body, **kwargs)


def users_with_perm(perm: str) -> list:
    from conduit.accounts.models import User

    return [u for u in User.objects.filter(is_active=True).select_related("state", "main_character") if u.has_perm(perm)]


def unread_count(user) -> int:
    return Notification.objects.filter(user=user, read_at__isnull=True).count()
