import re

from django.http import JsonResponse

from .services import can_use, is_enabled

# web UI, external API and public API
PLUGIN_API_RE = re.compile(r"^/api/(?:(?P<v1>v1/)|(?P<public>public/))?p/(?P<id>[a-z][a-z0-9_]*)(?:/|$)")


class DisabledModuleMiddleware:
    """Hide the API of plugins an admin has switched off, and of members-only plugins from non-members."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        match = PLUGIN_API_RE.match(request.path)
        if match and not is_enabled(match["id"]):
            return JsonResponse({"detail": "Plugin not enabled"}, status=404)
        # The external API is keyed and scoped by admins; signed-out visitors get the routes' own 401.
        # The public API is for everyone by design.
        if match and not match["v1"] and not match["public"] and request.user.is_authenticated and not can_use(request.user, match["id"]):
            return JsonResponse({"detail": "Only members can use this"}, status=403)
        return self.get_response(request)
