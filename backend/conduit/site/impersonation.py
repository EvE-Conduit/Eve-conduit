"""Signing in as another user to see what they see. Every start and stop is audited."""

import re

from django.conf import settings
from django.contrib.auth import login

from conduit.audit.services import record

SESSION_KEY = "conduit_impersonator"


def impersonator(request):
    """The admin really behind this session, or None."""
    from conduit.accounts.models import User

    real_id = request.session.get(SESSION_KEY) if hasattr(request, "session") else None
    if not real_id or not request.user.is_authenticated:
        return None
    return User.objects.filter(pk=real_id, is_active=True).select_related("main_character").first()


def can_impersonate(actor, target) -> str | None:
    """None if allowed, otherwise why not."""
    if not actor.has_perm("site.impersonate_users"):
        return "You don't have permission to sign in as other users"
    if target.pk == actor.pk:
        return "That's you"
    if target.is_superuser and not actor.is_superuser:
        return "Only administrators can sign in as an administrator"
    if not target.is_active:
        return "That account is disabled"
    if not actor.is_superuser:
        # Never a way to gain power: the target may hold nothing the helper doesn't already hold.
        extra = sorted(set(target.get_all_permissions()) - set(actor.get_all_permissions()))
        if extra:
            return f"{target.display_name} has permissions you don't ({', '.join(extra[:5])}), so you can't sign in as them"
    return None


# While signed in as someone else, nothing that changes the site itself (admin changes, setup, the back-office,
# plugin administration) and nothing that spends the other person's standing: leading their groups (leadership
# isn't a permission, so can_impersonate's check doesn't see it and a leader's helper could add themselves to a
# group), joining or leaving groups and asking to, linking or unlinking characters or changing their main (which
# feeds their state). Looking around and harmless writes such as preferences and notifications are fine.
BLOCKED_WRITE_PREFIXES = (
    "/api/admin/",
    "/api/setup/",
    "/api/groups/",  # group-leader API
    "/api/me/groups/",
    "/api/me/group-requests/",
    "/api/me/characters/",
)
BLOCKED_WRITE_PATTERNS = (re.compile(r"^/api/p/[^/]+/admin(/|$)"),)  # a plugin's admin routes
BLOCKED_ANY_PREFIXES = ("/django-admin/", "/sso/add-character")
SAFE_METHODS = ("GET", "HEAD", "OPTIONS")


def blocked(request) -> bool:
    path = request.path
    if path.startswith(BLOCKED_ANY_PREFIXES):
        return True
    if request.method in SAFE_METHODS:
        return False
    return path.startswith(BLOCKED_WRITE_PREFIXES) or any(p.match(path) for p in BLOCKED_WRITE_PATTERNS)


def start(request, target):
    real = impersonator(request) or request.user
    record("auth.impersonation_started", f"signed in as {target.display_name}", request=request, target=target)
    login(request, target, backend=settings.AUTHENTICATION_BACKENDS[0])  # rotates the session key
    request.session[SESSION_KEY] = real.pk


def stop(request) -> bool:
    real = impersonator(request)
    if real is None:
        return False
    target = request.user
    login(request, real, backend=settings.AUTHENTICATION_BACKENDS[0])
    request.session.pop(SESSION_KEY, None)
    record("auth.impersonation_stopped", f"stopped signing in as {target.display_name}", request=request, target=target)
    return True
