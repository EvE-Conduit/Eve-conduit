"""API key authentication for /api/v1/, and the scope check every external route uses.

Services send ``Authorization: Bearer evk_...`` (or ``X-API-Key: evk_...``). Module routes guard
themselves the same way core routes do::

    from conduit.external.auth import require_scope

    @router.get("/fleets")
    @require_scope("m.fleets:read")
    def fleets(request): ...
"""

from datetime import timedelta
from functools import wraps
from secrets import compare_digest

from django.utils import timezone
from ninja.errors import HttpError
from ninja.security.base import AuthBase

from conduit.audit.services import client_ip

from . import areas
from .models import KEY_PREFIX, ApiKey, hash_secret

LAST_USED_EVERY = timedelta(minutes=1)


class ApiPrincipal:
    """Stands in for ``request.user`` on external calls, so core code that checks permissions
    (like the character sheet's) sees what the key may do and nothing more."""

    is_authenticated = True
    is_anonymous = False
    is_active = True
    is_superuser = False
    is_staff = False
    pk = id = None
    main_character = None
    main_character_id = None
    state = None
    state_id = None

    def __init__(self, key: ApiKey):
        self.key = key
        self.display_name = f"API key {key.name}"
        self._perms = {"sheet.view_all_characters"} if any(s.startswith("sheet:") for s in key.scopes) else set()

    def has_perm(self, perm, obj=None):
        return perm in self._perms

    def has_perms(self, perms, obj=None):
        return all(self.has_perm(p) for p in perms)


class ApiKeyAuth(AuthBase):
    openapi_type = "http"
    openapi_scheme = "bearer"

    def __call__(self, request):
        header = request.headers.get("Authorization", "")
        token = header[7:].strip() if header[:7].lower() == "bearer " else request.headers.get("X-API-Key", "").strip()
        if not token:
            raise HttpError(401, "Send an API key: Authorization: Bearer evk_...")
        return authenticate(request, token)


def authenticate(request, token: str) -> ApiKey:
    prefix = token[: len(KEY_PREFIX) + 8]
    key = ApiKey.objects.filter(prefix=prefix).first() if token.startswith(KEY_PREFIX) else None
    if key is None or not compare_digest(key.secret_hash, hash_secret(token)):
        raise HttpError(401, "Invalid API key")
    request.api_key = key  # from here on the request log shows which key it was
    status = key.status
    if status != "active":
        raise HttpError(401, f"This API key is {status}")
    ip = client_ip(request)
    if not key.ip_allowed(ip):
        raise HttpError(403, f"This API key may not be used from {ip}")
    request.user = ApiPrincipal(key)
    now = timezone.now()
    if key.last_used_at is None or now - key.last_used_at > LAST_USED_EVERY or key.last_used_ip != ip:
        ApiKey.objects.filter(pk=key.pk).update(last_used_at=now, last_used_ip=ip)
    return key


def check_scope(request, *scopes: str):
    """403 unless the key holds every scope and each scope's API is switched on."""
    key = getattr(request, "api_key", None)
    if key is None:
        raise HttpError(401, "API key required")
    for scope in scopes:
        area_key = areas.area_of_scope(scope)
        request.api_area = getattr(request, "api_area", "") or area_key
        if not areas.is_on(area_key):
            area = areas.all_areas().get(area_key)
            raise HttpError(403, f"The {area.label if area else area_key} API is switched off on this site")
        if scope not in key.scopes:
            raise HttpError(403, f"This API key lacks the {scope} scope")


def require_scope(*scopes: str):
    def decorator(view):
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            check_scope(request, *scopes)
            return view(request, *args, **kwargs)

        return wrapper

    return decorator
