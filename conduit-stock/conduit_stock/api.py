"""Mounted at /api/p/stock/. Only reachable while the plugin is enabled, and by members (``members_only``)."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .models import Place, StockSettings, Target
from .services import MANAGE_PERM, StockError

router = Router(tags=["stock"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except StockError as exc:
        raise HttpError(exc.status, str(exc)) from None


# --- members --------------------------------------------------------------------------------------------------------


@router.get("/board")
def board(request):
    return {
        "places": services.board(user=request.user),
        "claim_days": StockSettings.load().claim_days,
        "can_manage": request.user.has_perm(MANAGE_PERM),
    }


@router.get("/summary")
def summary(request):
    return services.summary(request.user)


class ClaimIn(Schema):
    quantity: int


@router.post("/targets/{target_id}/claim")
def claim(request, target_id: int, payload: ClaimIn):
    _run(services.claim, get_object_or_404(Target, pk=target_id), request.user, payload.quantity)
    return {"ok": True}


@router.delete("/targets/{target_id}/claim")
def release(request, target_id: int):
    services.release(get_object_or_404(Target, pk=target_id), request.user)
    return {"ok": True}


# --- managers -------------------------------------------------------------------------------------------------------


@router.get("/manage")
@require_perm(MANAGE_PERM)
def manage(request):
    return {
        "places": services.board(user=request.user),
        "settings": {"claim_days": StockSettings.load().claim_days},
        "doctrines": services.doctrines_installed(),
    }


@router.get("/search/{kind}")
@require_perm(MANAGE_PERM)
def search(request, kind: str, q: str = ""):
    finders = {"places": services.search_places, "types": services.search_types, "fits": services.search_fits}
    if kind not in finders:
        raise HttpError(404, "Not found")
    return finders[kind](q)


class PlaceIn(Schema):
    location_id: int | None = None
    label: str = ""
    order: int = 0


@router.post("/places")
@require_perm(MANAGE_PERM)
def create_place(request, payload: PlaceIn):
    place = _run(services.save_place, None, payload.dict(), request.user, request=request)
    return {"id": place.pk}


@router.put("/places/{place_id}")
@require_perm(MANAGE_PERM)
def update_place(request, place_id: int, payload: PlaceIn):
    _run(services.save_place, get_object_or_404(Place, pk=place_id), payload.dict(), request.user, request=request)
    return {"ok": True}


@router.delete("/places/{place_id}")
@require_perm(MANAGE_PERM)
def delete_place(request, place_id: int):
    services.delete_place(get_object_or_404(Place, pk=place_id), request.user, request=request)
    return {"ok": True}


class TargetIn(Schema):
    type_id: int | None = None
    fit_id: int | None = None
    quantity: int
    low: int | None = None
    note: str = ""
    order: int = 0


@router.post("/places/{place_id}/targets")
@require_perm(MANAGE_PERM)
def create_target(request, place_id: int, payload: TargetIn):
    place = get_object_or_404(Place, pk=place_id)
    target = _run(services.save_target, None, place, payload.dict(), request.user, request=request)
    return {"id": target.pk}


@router.put("/targets/{target_id}")
@require_perm(MANAGE_PERM)
def update_target(request, target_id: int, payload: TargetIn):
    target = get_object_or_404(Target.objects.select_related("place"), pk=target_id)
    _run(services.save_target, target, target.place, payload.dict(), request.user, request=request)
    return {"ok": True}


@router.delete("/targets/{target_id}")
@require_perm(MANAGE_PERM)
def delete_target(request, target_id: int):
    services.delete_target(get_object_or_404(Target.objects.select_related("place"), pk=target_id), request.user, request=request)
    return {"ok": True}


class SettingsIn(Schema):
    claim_days: int


@router.put("/settings")
@require_perm(MANAGE_PERM)
def update_settings(request, payload: SettingsIn):
    s = _run(services.save_settings, payload.claim_days, request.user, request=request)
    return {"claim_days": s.claim_days}
