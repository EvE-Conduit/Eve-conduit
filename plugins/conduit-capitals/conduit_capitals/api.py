"""Mounted at /api/p/capitals/. Only reachable while the plugin is enabled, and only by members.

Every member sees their own characters and marks their own hulls available or not. The registry needs
capitals.view_registry and only covers the characters the core sheet permissions let the viewer read; seeing someone
else's hulls (where they're parked) goes in the snooper log like opening their assets.
"""

from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record_snoop

from . import services
from .services import CapitalsError, Registry

router = Router(tags=["capitals"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except CapitalsError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _registry_perm(request):
    if not services.can_view_registry(request.user):
        raise HttpError(403, "You don't have access to the Capital Registry")


def _registry(request, corporation: int | None, state: int | None, group: int | None, cls: str | None = None) -> Registry:
    _registry_perm(request)
    return Registry(services.reach(request.user, corporation, state, group), cls)


def _snoop(request, reg: Registry):
    for c in reg.shown.values():
        record_snoop(request, c, "assets")


# --- every member ------------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    return services.me(request.user)


class AvailabilityIn(Schema):
    character_id: int
    type_id: int
    #: True: available for ops; False: not available; None: clear.
    available: bool | None = None
    note: str = ""


@router.put("/availability")
def availability(request, payload: AvailabilityIn):
    return {"availability": _run(services.set_availability, request.user, payload.character_id, payload.type_id,
                                 payload.available, payload.note)}


# --- the registry --------------------------------------------------------------------------------------------------


@router.get("/registry/options")
def options(request):
    _registry_perm(request)
    return services.filter_options(request.user)


@router.get("/registry/summary")
def summary(request, corporation: int | None = None, state: int | None = None, group: int | None = None):
    return services.summary(_registry(request, corporation, state, group))


@router.get("/registry/classes/{key}")
def class_pilots(request, key: str, corporation: int | None = None, state: int | None = None, group: int | None = None):
    reg = _registry(request, corporation, state, group, key)
    out = _run(services.class_pilots, reg, key)
    _snoop(request, reg)
    return out


@router.get("/registry/locations")
def locations(request, cls: str = "", corporation: int | None = None, state: int | None = None, group: int | None = None):
    reg = _registry(request, corporation, state, group, cls or None)
    out = services.by_location(reg, cls or None)
    _snoop(request, reg)
    return out


@router.get("/registry/members")
def members(request, corporation: int | None = None, state: int | None = None, group: int | None = None):
    return services.by_member(_registry(request, corporation, state, group))


@router.get("/registry/members/{user_id}")
def member(request, user_id: int):
    _registry_perm(request)
    out, reg = _run(services.member, request.user, user_id)
    _snoop(request, reg)
    return out
