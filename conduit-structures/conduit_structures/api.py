"""Mounted at /api/p/structures/. Only reachable while the plugin is enabled, and by members (``members_only``).

Structures are shown to people who may open the corporation's Structures section on the corporation sheet; everything
here only ever covers those. The settings and per-structure overrides need structures.manage_structures as well.
"""

from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .services import MANAGE_PERM, StructuresError

router = Router(tags=["structures"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except StructuresError as exc:
        raise HttpError(exc.status, str(exc)) from None


# --- everyone who may see structures --------------------------------------------------------------------------------


@router.get("/board")
def board(request):
    return services.board(request.user)


@router.get("/plan")
def plan(request, days: int = 0):
    return _run(services.plan, request.user, days or None)


@router.get("/summary")
def summary(request):
    return services.summary(request.user)


class ClaimIn(Schema):
    note: str = ""


@router.post("/structures/{structure_id}/claim")
def claim(request, structure_id: int, payload: ClaimIn):
    _run(services.claim, request.user, structure_id, payload.note)
    return {"ok": True}


@router.delete("/structures/{structure_id}/claim")
def release(request, structure_id: int):
    services.release(request.user, structure_id)
    return {"ok": True}


# --- managers --------------------------------------------------------------------------------------------------------


@router.get("/settings")
@require_perm(MANAGE_PERM)
def get_settings(request):
    return services.settings_out()


class SettingsIn(Schema):
    thresholds: list[int]
    groups: list[int] = []
    notify: bool = True
    plan_days: int
    claim_hours: int


@router.put("/settings")
@require_perm(MANAGE_PERM)
def put_settings(request, payload: SettingsIn):
    s = _run(services.save_settings, payload.dict(), request.user, request=request)
    return services.settings_out(s)


class StructureIn(Schema):
    #: Hours; null uses the default thresholds, [] never warns.
    thresholds: list[int] | None = None
    staging: str = ""


@router.put("/structures/{structure_id}")
@require_perm(MANAGE_PERM)
def put_structure(request, structure_id: int, payload: StructureIn):
    _run(services.save_structure, request.user, structure_id, payload.dict(), request=request)
    return {"ok": True}
