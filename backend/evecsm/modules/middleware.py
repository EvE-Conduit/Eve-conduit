import re

from django.http import JsonResponse

from .services import is_enabled

MODULE_API_RE = re.compile(r"^/api/(?:v1/)?m/(?P<id>[a-z][a-z0-9_]*)/")  # web UI and external API


class DisabledModuleMiddleware:
    """Hide the API of modules an admin has switched off."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        match = MODULE_API_RE.match(request.path)
        if match and not is_enabled(match["id"]):
            return JsonResponse({"detail": "Module not enabled"}, status=404)
        return self.get_response(request)
