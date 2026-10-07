import logging
import time

from evecsm.audit.services import client_ip

from .models import ApiRequest

log = logging.getLogger(__name__)
PREFIX = "/api/v1/"
NOT_LOGGED = ("/api/v1/docs", "/api/v1/openapi.json")


class ApiRequestLogMiddleware:
    """Records every call to the external API, including refused ones."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith(PREFIX) or request.path.startswith(NOT_LOGGED):
            return self.get_response(request)
        started = time.monotonic()
        response = self.get_response(request)
        key = getattr(request, "api_key", None)
        area = getattr(request, "api_area", "")
        if not area and request.path.startswith(PREFIX + "m/"):
            area = "m." + request.path[len(PREFIX) + 2 :].split("/", 1)[0]
        try:
            ApiRequest.objects.create(
                key=key,
                key_prefix=key.prefix if key else "",
                method=request.method[:8],
                path=request.path[:500],
                query=request.META.get("QUERY_STRING", "")[:1000],
                status=response.status_code,
                duration_ms=int((time.monotonic() - started) * 1000),
                ip=client_ip(request),
                user_agent=request.headers.get("User-Agent", "")[:300],
                area=area[:80],
            )
        except Exception:  # logging a call must never break it
            log.exception("Could not record API request %s %s", request.method, request.path)
        return response
