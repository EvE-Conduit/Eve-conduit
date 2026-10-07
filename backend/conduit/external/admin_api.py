"""Administration > API: keys, switching APIs on and off, and the request log."""

import ipaddress
from datetime import datetime, timedelta

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field, field_validator

from conduit.audit.services import record
from conduit.paging import page
from conduit.permissions import require_perm

from . import areas
from .api import request_out
from .models import ApiKey, ApiRequest

router = Router(tags=["admin"])


# --- APIs ------------------------------------------------------------------------


def area_out(area: areas.Area) -> dict:
    return {
        "key": area.key,
        "label": area.label,
        "description": area.description,
        "enabled": area.key in areas.enabled_keys(),
        "available": areas.is_available(area),
        "plugin": area.plugin,
        "base_path": area.base_path,
        "scopes": [{"scope": s.scope, "label": s.label, "description": s.description, "write": s.write} for s in area.scopes],
    }


class ToggleIn(Schema):
    enabled: bool


@router.get("/api/areas")
@require_perm("site.manage_api")
def list_areas(request):
    return [area_out(a) for a in areas.all_areas().values()]


@router.post("/api/areas/{key}")
@require_perm("site.manage_api")
def toggle_area(request, key: str, payload: ToggleIn):
    area = areas.all_areas().get(key)
    if area is None:
        raise HttpError(404, "No such API")
    if payload.enabled != (key in areas.enabled_keys()):
        areas.set_enabled(key, payload.enabled)
        record(f"api.area_{'enabled' if payload.enabled else 'disabled'}",
               f"switched the {area.label} API {'on' if payload.enabled else 'off'}", request=request,
               target_type="api", details={"api": key})
    return area_out(area)


# --- keys ------------------------------------------------------------------------


class ApiKeyIn(Schema):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field("", max_length=300)
    scopes: list[str] = []
    allowed_ips: list[str] = []
    expires_at: datetime | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("name can't be empty")
        return v

    @field_validator("allowed_ips")
    @classmethod
    def _ips(cls, v):
        out = []
        for item in (i.strip() for i in v):
            if not item:
                continue
            try:
                out.append(str(ipaddress.ip_network(item, strict=False)))
            except ValueError:
                raise ValueError(f"{item!r} is not an IP address or CIDR range") from None
        return out


def _check_scopes(scopes: list[str]) -> list[str]:
    known = areas.known_scopes()
    unknown = sorted(set(scopes) - set(known))
    if unknown:
        raise HttpError(400, f"Unknown scope(s): {', '.join(unknown)}")
    return sorted(set(scopes))


def key_out(key: ApiKey, requests_24h: int | None = None) -> dict:
    if requests_24h is None:
        requests_24h = key.requests.filter(at__gte=timezone.now() - timedelta(hours=24)).count()
    return {
        "id": key.pk,
        "name": key.name,
        "description": key.description,
        "prefix": key.prefix,
        "scopes": key.scopes,
        "allowed_ips": key.allowed_ips,
        "expires_at": key.expires_at.isoformat() if key.expires_at else None,
        "created_at": key.created_at.isoformat(),
        "created_by": key.created_by.display_name if key.created_by else None,
        "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
        "last_used_ip": key.last_used_ip,
        "revoked_at": key.revoked_at.isoformat() if key.revoked_at else None,
        "status": key.status,
        "requests_24h": requests_24h,
    }


@router.get("/api/keys")
@require_perm("site.manage_api")
def list_keys(request):
    since = timezone.now() - timedelta(hours=24)
    qs = ApiKey.objects.select_related("created_by__main_character").annotate(
        recent=Count("requests", filter=Q(requests__at__gte=since))
    )
    return [key_out(k, k.recent) for k in qs]


@router.post("/api/keys")
@require_perm("site.manage_api")
def create_key(request, payload: ApiKeyIn):
    key, secret = ApiKey.issue(
        name=payload.name,
        description=payload.description,
        scopes=_check_scopes(payload.scopes),
        allowed_ips=payload.allowed_ips,
        expires_at=payload.expires_at,
        created_by=request.user,
    )
    record("api.key_created", f"created API key {key.name} ({key.prefix})", request=request, target=key,
           details={"scopes": key.scopes, "allowed_ips": key.allowed_ips})
    return {"key": key_out(key, 0), "secret": secret}


@router.put("/api/keys/{key_id}")
@require_perm("site.manage_api")
def update_key(request, key_id: int, payload: ApiKeyIn):
    key = get_object_or_404(ApiKey, pk=key_id)
    before = {"scopes": key.scopes, "allowed_ips": key.allowed_ips, "expires_at": key.expires_at.isoformat() if key.expires_at else None}
    key.name = payload.name
    key.description = payload.description
    key.scopes = _check_scopes(payload.scopes)
    key.allowed_ips = payload.allowed_ips
    key.expires_at = payload.expires_at
    key.save()
    after = {"scopes": key.scopes, "allowed_ips": key.allowed_ips, "expires_at": key.expires_at.isoformat() if key.expires_at else None}
    record("api.key_updated", f"changed API key {key.name} ({key.prefix})", request=request, target=key,
           details={"before": before, "after": after})
    return key_out(key)


@router.post("/api/keys/{key_id}/revoke")
@require_perm("site.manage_api")
def revoke_key(request, key_id: int):
    key = get_object_or_404(ApiKey, pk=key_id)
    if key.revoked_at is None:
        key.revoked_at = timezone.now()
        key.save(update_fields=["revoked_at"])
        record("api.key_revoked", f"revoked API key {key.name} ({key.prefix})", request=request, target=key)
    return key_out(key)


@router.delete("/api/keys/{key_id}")
@require_perm("site.manage_api")
def delete_key(request, key_id: int):
    key = get_object_or_404(ApiKey, pk=key_id)
    record("api.key_deleted", f"deleted API key {key.name} ({key.prefix})", request=request, target=key)
    key.delete()
    return {"ok": True}


# --- request log -------------------------------------------------------------------


@router.get("/api/requests")
def request_log(request, key: int | None = None, status: str = "", area: str = "", q: str = "", limit: int = 50, offset: int = 0):
    if not (request.user.has_perm("site.manage_api") or request.user.has_perm("site.view_logs")):
        raise HttpError(403, "You do not have permission to do that")
    qs = ApiRequest.objects.select_related("key")
    if key:
        qs = qs.filter(key_id=key)
    if status:
        if len(status) == 3 and status.endswith("xx") and status[0] in "12345":
            low = int(status[0]) * 100
            qs = qs.filter(status__gte=low, status__lt=low + 100)
        elif status.isdigit():
            qs = qs.filter(status=int(status))
        else:
            raise HttpError(400, "status must be like 2xx, 4xx or an exact code")
    if area:
        qs = qs.filter(area=area)
    if q:
        qs = qs.filter(path__icontains=q)
    return page(qs, request_out, limit, offset)
