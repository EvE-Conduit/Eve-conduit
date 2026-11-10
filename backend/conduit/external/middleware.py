import logging
import time

from conduit.audit.services import client_ip

from .models import ApiRequest

log = logging.getLogger(__name__)
PREFIX = "/api/v1/"
PLUGIN_PREFIX = PREFIX + "p/"  # plugin routers are mounted at /api/v1/p/<plugin id>/
NOT_LOGGED = ("/api/v1/docs", "/api/v1/openapi.json")
KEY_HEADERS = ("Authorization", "X-API-Key")


def presented_key(request) -> bool:
    """Whether the request tried to authenticate at all (see ``auth.ApiKeyAuth``)."""
    return any(request.headers.get(h, "").strip() for h in KEY_HEADERS)


def _known_key(request):
    """The key the request carries when no route checked it (a path that doesn't exist, a switched-off plugin),
    so those calls are still logged for a real key, revoked or not."""
    from secrets import compare_digest

    from .models import KEY_PREFIX, ApiKey, hash_secret

    header = request.headers.get("Authorization", "")
    token = header[7:].strip() if header[:7].lower() == "bearer " else request.headers.get("X-API-Key", "").strip()
    if not token.startswith(KEY_PREFIX):
        return None
    key = ApiKey.objects.filter(prefix=token[: len(KEY_PREFIX) + 8]).first()
    return key if key is not None and compare_digest(key.secret_hash, hash_secret(token)) else None


class ApiRequestLogMiddleware:
    """Records every call to the external API that presents a key, including refused ones.

    Requests without any key header are not stored, nor are ones with a made-up key that never reached a key
    check (an unknown path): there is nothing to attribute them to, and anyone on the internet could otherwise
    grow the request log without limit (failed keys are rate-limited per IP, see ``site.ratelimit``).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith(PREFIX) or request.path.startswith(NOT_LOGGED) or not presented_key(request):
            return self.get_response(request)
        started = time.monotonic()
        response = self.get_response(request)
        key = getattr(request, "api_key", None) or _known_key(request)
        if key is None and response.status_code != 401:
            # No key we know and not a refused login (those are limited per address): an unknown path or a
            # switched-off plugin answered before any key was checked. Storing these would let anyone fill the
            # log by sending a made-up key header to paths that don't exist.
            return response
        area = getattr(request, "api_area", "")
        if not area and request.path.startswith(PLUGIN_PREFIX):
            area = "p." + request.path[len(PLUGIN_PREFIX):].split("/", 1)[0]
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
