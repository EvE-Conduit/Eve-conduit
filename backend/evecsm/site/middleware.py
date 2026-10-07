from django.http import HttpResponseForbidden, JsonResponse

from .models import SiteSettings

# Always reachable, so people can still sign in and see the maintenance message.
OPEN_PATHS = ("/api/core/", "/api/setup/", "/sso/", "/django-admin/", "/static/")


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
    """While an admin is signed in as someone else, refuse anything that changes the site's setup."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from .impersonation import SESSION_KEY, blocked

        if request.user.is_authenticated and request.session.get(SESSION_KEY) and blocked(request):
            message = "Return to your own account first: this isn't allowed while signed in as someone else"
            if request.path.startswith("/api/"):
                return JsonResponse({"detail": message}, status=403)
            return HttpResponseForbidden(message)
        return self.get_response(request)
