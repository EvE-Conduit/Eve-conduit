from django.contrib.auth import get_user
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.utils.functional import SimpleLazyObject

from . import database
from .state import SESSION_KEY, activate, enabled

#: Never part of the demo: the EVE login is how administrators get back to the real site, and the external API
#: (API keys) keeps serving integrations the real data, so a Discord bot, say, doesn't think everyone left.
REAL_PATHS = ("/sso/", "/api/v1/", "/static/")
#: The only changes a demo visitor can make: signing in and out.
DEMO_WRITES = ("/api/core/demo/login", "/api/core/logout")
SAFE_METHODS = ("GET", "HEAD", "OPTIONS")


def _keeps_real_site(request) -> bool:
    """Administrators who signed in with EVE (or are helping a member while signed in as them) keep using the
    real site, so they can switch demo mode off. Everyone else sees the demo."""
    from conduit.accounts.models import User
    from conduit.site.impersonation import SESSION_KEY as IMPERSONATOR

    if not request.user.is_authenticated:
        return False
    real_id = request.session.get(IMPERSONATOR)
    person = User.objects.filter(pk=real_id, is_active=True).first() if real_id else request.user
    return bool(person and person.has_perm("site.manage_site"))


class DemoMiddleware:
    """While demo mode is on, run requests against the demo database (see conduit.demo). Comes after the
    impersonation guard (which checks the real session) and before anything that uses the site's data."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        demo_session = bool(request.session.get(SESSION_KEY))
        if request.path.startswith(REAL_PATHS) or not enabled():
            if demo_session:
                request.user = AnonymousUser()  # the demo account isn't in the real database
            return self.get_response(request)
        if not demo_session and _keeps_real_site(request):
            return self.get_response(request)

        if not database.ready():
            database.build_in_background()
            return JsonResponse({"detail": "The demo is being set up; it takes about a minute.", "maintenance": True}, status=503)
        if request.method not in SAFE_METHODS and not request.path.startswith(DEMO_WRITES):
            return JsonResponse({"detail": "This is a demo: changes can't be saved", "demo": True}, status=403)

        with activate():
            # Someone signed in to the real site (a member, not an admin) is signed out of the demo: their own
            # account isn't in it. Their sign-in is still in their session for when demo mode ends.
            request.user = SimpleLazyObject(lambda: get_user(request)) if demo_session else AnonymousUser()
            if hasattr(request, "_cached_user"):
                del request._cached_user
            return self.get_response(request)
