from django.contrib.auth import logout
from django.http import HttpResponseForbidden, HttpResponseRedirect, JsonResponse

from conduit.audit.services import trusted_proxy

from .models import SiteSettings

# Always reachable, so people can still sign in and see the maintenance message.
OPEN_PATHS = ("/api/core/", "/api/setup/", "/sso/", "/django-admin/", "/static/")

# What a reverse proxy tells us about the real client. Anyone can send these, so they're only kept when the
# connection comes from a trusted proxy (CONDUIT_TRUSTED_PROXIES).
FORWARDED_HEADERS = ("HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED_PROTO", "HTTP_X_FORWARDED_HOST", "HTTP_X_REAL_IP")


class TrustedProxyMiddleware:
    """Drop forwarded headers unless a trusted proxy sent them. Runs first, so SECURE_PROXY_SSL_HEADER, the rate
    limits, API-key allow-lists and the logs (all built on client_ip()) never see a header a visitor made up."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not trusted_proxy(request.META.get("REMOTE_ADDR")):
            for header in FORWARDED_HEADERS:
                request.META.pop(header, None)
        return self.get_response(request)


class MaintenanceMiddleware:
    """While maintenance mode is on, only users who can manage the site may use the API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if path.startswith("/api/") and not path.startswith(OPEN_PATHS):
            site = SiteSettings.objects.filter(pk=1).only("maintenance_mode", "maintenance_message").first()
            if site and site.maintenance_mode and not (request.user.is_authenticated and request.user.has_perm("site.manage_site")):
                return JsonResponse(
                    {"detail": site.maintenance_message or "The site is down for maintenance", "maintenance": True}, status=503
                )
        return self.get_response(request)


class ImpersonationGuardMiddleware:
    """While an admin is signed in as someone else, refuse anything that changes the site's setup or that would
    use the other person's standing (see impersonation.blocked). If the admin behind the session is gone
    (disabled or deleted), the session ends instead of staying signed in as the other person."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from conduit.accounts.models import User

        from .impersonation import SESSION_KEY, blocked

        real_id = request.session.get(SESSION_KEY)
        if real_id:
            if not User.objects.filter(pk=real_id, is_active=True).exists():
                logout(request)  # flushes the session: the impersonated login goes with it
                message = "Your account was disabled while you were signed in as someone else. Please sign in again."
                if request.path.startswith("/api/"):
                    return JsonResponse({"detail": message}, status=401)
                return HttpResponseRedirect("/login")
            if request.user.is_authenticated and blocked(request):
                message = "Return to your own account first: this isn't allowed while signed in as someone else"
                if request.path.startswith("/api/"):
                    return JsonResponse({"detail": message}, status=403)
                return HttpResponseForbidden(message)
        return self.get_response(request)


class NoCacheMiddleware:
    """Browsers keep nothing: they check back on every load (a quick 304 when a static file hasn't changed), so
    updates to the site and its plugins show up at once. Responses that ask for ``no-store`` keep it."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if "no-store" not in response.get("Cache-Control", ""):
            response["Cache-Control"] = "no-cache"
        return response
