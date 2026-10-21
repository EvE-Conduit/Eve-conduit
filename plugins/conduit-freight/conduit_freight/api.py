"""Mounted at /api/p/freight/. Only reachable while the plugin is enabled."""

from conduit.access.models import State
from conduit.audit.services import record
from django.contrib.auth.models import Group
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth
from pydantic import Field

from . import services
from .models import Route, Service

router = Router(tags=["freight"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.FreightError as exc:
        raise HttpError(exc.status, str(exc)) from None


# --- customers -------------------------------------------------------------------------------------------------------


@router.get("/services")
def list_services(request):
    qs = services.usable(request.user).select_related("owner__corporation").prefetch_related("routes")
    return {
        "services": [services.service_out(s, request.user) for s in qs],
        "can_manage": services.can_manage(request.user),
        "sees_queue": services.sees_queue(request.user),
    }


@router.get("/services/{service_id}")
def service(request, service_id: int):
    return services.service_out(_run(services.service_for, request.user, service_id), request.user)


class QuoteIn(Schema):
    route_id: int
    volume: float
    collateral: float = 0


@router.post("/services/{service_id}/quote")
def make_quote(request, service_id: int, payload: QuoteIn):
    s = _run(services.service_for, request.user, service_id)
    return _run(services.quote, s, payload.route_id, payload.volume, payload.collateral)


@router.get("/me")
def me(request):
    return services.my_contracts(request.user)


# --- haulers ---------------------------------------------------------------------------------------------------------


@router.get("/queue")
def queue(request, show: str = "waiting", service: int | None = None):
    if not services.sees_queue(request.user):
        raise HttpError(403, "You can't see the hauling queue")
    return {**services.queue(service, show), "services": [{"id": s.pk, "name": s.name} for s in Service.objects.all()]}


# --- managers --------------------------------------------------------------------------------------------------------


def _manager(request):
    if not services.can_manage(request.user):
        raise HttpError(403, "You can't run freight services")


def _service(service_id: int) -> Service:
    s = Service.objects.select_related("owner__corporation", "owner__token").filter(pk=service_id).first()
    if s is None:
        raise HttpError(404, "No such service")
    return s


@router.get("/manage")
def manage(request):
    _manager(request)
    out = []
    for s in Service.objects.select_related("owner__corporation", "owner__token").prefetch_related("routes"):
        out.append({"id": s.pk, "name": s.name, "active": s.active, "public": s.public, "routes": s.routes.count(),
                    "owner": services.owner_out(s), **services.statistics(s)})
    return {"services": out}


@router.get("/manage/options")
def options(request):
    """Pickers for the service form."""
    _manager(request)
    chars = request.user.characters.select_related("corporation", "token").order_by("name")
    return {
        "characters": [{"id": c.pk, "name": c.name, "corporation": c.corporation.name if c.corporation_id and c.corporation else None,
                        "login_ok": bool(getattr(c, "token", None) and c.token.valid)} for c in chars],
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


class ServiceIn(Schema):
    name: str = Field(max_length=100)
    description: str = Field("", max_length=4000)
    owner_id: int
    is_corporation: bool = True
    days_to_complete: int = 3
    expiration_days: int = 7
    state_ids: list[int] = []
    group_ids: list[int] = []
    public: bool = False
    notify: bool = True
    active: bool = True


@router.post("/manage/services")
def create_service(request, payload: ServiceIn):
    _manager(request)
    s = _run(services.save_service, request.user, None, payload.model_dump())
    record("freight.service", f"created the freight service {s.name}", request=request, target_type="plugin", details={"plugin": "freight", "service_id": s.pk})
    return services.manage_out(s)


@router.get("/manage/services/{service_id}")
def get_service(request, service_id: int):
    _manager(request)
    return services.manage_out(_service(service_id))


@router.put("/manage/services/{service_id}")
def update_service(request, service_id: int, payload: ServiceIn):
    from .contracts import recheck

    _manager(request)
    s = _run(services.save_service, request.user, _service(service_id), payload.model_dump())
    recheck(s)
    record("freight.service", f"changed the freight service {s.name}", request=request, target_type="plugin", details={"plugin": "freight", "service_id": s.pk})
    return services.manage_out(s)


@router.delete("/manage/services/{service_id}")
def delete_service(request, service_id: int):
    _manager(request)
    s = _service(service_id)
    record("freight.service", f"deleted the freight service {s.name}", request=request, target_type="plugin", details={"plugin": "freight", "service_id": s.pk})
    s.delete()
    return {"ok": True}


@router.post("/manage/services/{service_id}/sync")
def sync_now(request, service_id: int):
    """Read the owner's contracts now instead of waiting for the next run."""
    from .tasks import sync_owner_contracts

    _manager(request)
    s = _service(service_id)
    if not s.owner_id:
        raise HttpError(409, "The service has no owner")
    sync_owner_contracts.delay(s.owner_id)
    return {"ok": True}


class RouteIn(Schema):
    start_name: str = Field(max_length=200)
    start_system_id: int
    start_location_id: int | None = None
    end_name: str = Field(max_length=200)
    end_system_id: int
    end_location_id: int | None = None
    both_ways: bool = True
    #: Empty: looked up from ESI when the systems change.
    jumps: int | None = None
    base_price: float = 0
    price_per_m3: float = 0
    price_per_jump: float = 0
    collateral_percent: float = 0
    min_reward: float = 0
    max_volume: float = 0
    max_collateral: float = 0
    active: bool = True


@router.post("/manage/services/{service_id}/routes")
def add_route(request, service_id: int, payload: RouteIn):
    from .contracts import recheck

    _manager(request)
    s = _service(service_id)
    r = _run(services.save_route, s, None, payload.model_dump())
    recheck(s)
    return services.route_out(r)


def _route(route_id: int) -> Route:
    r = Route.objects.select_related("service").filter(pk=route_id).first()
    if r is None:
        raise HttpError(404, "No such route")
    return r


@router.put("/manage/routes/{route_id}")
def update_route(request, route_id: int, payload: RouteIn):
    from .contracts import recheck

    _manager(request)
    r = _route(route_id)
    r = _run(services.save_route, r.service, r, payload.model_dump())
    recheck(r.service)
    return services.route_out(r)


@router.delete("/manage/routes/{route_id}")
def delete_route(request, route_id: int):
    from .contracts import recheck

    _manager(request)
    r = _route(route_id)
    service = r.service
    r.delete()
    recheck(service)
    return {"ok": True}


@router.get("/manage/search/systems")
def search_systems(request, q: str = ""):
    _manager(request)
    return services.search_systems(q)


@router.get("/manage/search/places")
def search_places(request, q: str = ""):
    _manager(request)
    return services.search_places(q)
