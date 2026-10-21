"""Who may use and run which service, prices, and what the pages show."""

from __future__ import annotations

import logging
import math
from decimal import Decimal

from conduit.eve.models import EveName
from conduit.sde.models import Region, SolarSystem
from django.db.models import Q, Sum

from .models import Contract, Route, Service

log = logging.getLogger(__name__)

OPEN = ("outstanding", "in_progress")
FINISHED = ("finished", "finished_issuer", "finished_contractor")


class FreightError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- access ---------------------------------------------------------------------------------------------------------


def can_manage(user) -> bool:
    return user.is_authenticated and user.has_perm("freight.manage_freight")


def sees_queue(user) -> bool:
    return user.is_authenticated and (user.has_perm("freight.view_contracts") or can_manage(user))


def usable(user):
    """Active services the member may use: open to everyone, or to their state or one of their groups. Managers see
    every service, even inactive ones."""
    if can_manage(user):
        return Service.objects.all()
    group_ids = list(user.groups.values_list("pk", flat=True))
    audience = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids)
    if user.state_id:
        audience |= Q(states=user.state_id)
    return Service.objects.filter(pk__in=Service.objects.filter(active=True).filter(audience).values("pk"))


def service_for(user, service_id: int) -> Service:
    service = usable(user).filter(pk=service_id).first()
    if service is None:
        raise FreightError("No such freight service", 404)
    return service


# --- prices ---------------------------------------------------------------------------------------------------------


def price(route: Route, volume: float, collateral: Decimal) -> Decimal:
    """The reward a route asks for, rounded up to whole ISK. Jumps count only when known."""
    reward = (route.base_price + route.price_per_m3 * Decimal(str(volume)) + route.price_per_jump * (route.jumps or 0)
              + collateral * route.collateral_percent / 100)
    return Decimal(math.ceil(max(reward, route.min_reward)))


def limits(route: Route, volume: float, collateral: Decimal) -> list[str]:
    """What's over the route's limits, in words."""
    out = []
    if route.max_volume and volume > route.max_volume:
        out.append(f"This route takes up to {route.max_volume:,.0f} m³.")
    if route.max_collateral and collateral > route.max_collateral:
        out.append(f"This route takes up to {route.max_collateral:,.0f} ISK collateral.")
    return out


def quote(service: Service, route_id: int, volume: float, collateral: float) -> dict:
    """The reward and the exact contract to make. Nothing is stored: contracts are checked against the route itself."""
    if not service.active:
        raise FreightError("This service is closed", 409)
    if service.owner is None:
        raise FreightError("This service has no one to contract to yet", 409)
    route = service.routes.filter(pk=route_id, active=True).first()
    if route is None:
        raise FreightError("No such route", 404)
    if volume <= 0:
        raise FreightError("Enter the volume, in m³")
    if collateral < 0:
        raise FreightError("Collateral can't be negative")
    col = Decimal(str(round(collateral, 2)))
    reward = price(route, volume, col)
    return {
        "route": route_out(route),
        "volume": volume,
        "collateral": float(col),
        "reward": float(reward),
        "breakdown": {
            "base": float(route.base_price),
            "volume": float(route.price_per_m3 * Decimal(str(volume))),
            "jumps": float(route.price_per_jump * (route.jumps or 0)),
            "collateral": float(col * route.collateral_percent / 100),
            "minimum": float(route.min_reward),
        },
        "problems": limits(route, volume, col),
        "terms": contract_terms(service),
    }


# --- output -----------------------------------------------------------------------------------------------------------


def _system(system_id: int | None) -> dict | None:
    s = SolarSystem.objects.filter(pk=system_id).first() if system_id else None
    if s is None:
        return None
    region = Region.objects.filter(pk=s.region_id).values_list("name", flat=True).first()
    return {"id": s.pk, "name": s.name, "security": s.display_security, "region": region or ""}


def _names(ids) -> dict[int, str]:
    ids = {i for i in ids if i}
    return dict(EveName.objects.filter(pk__in=ids).values_list("pk", "name"))


def contract_terms(service: Service) -> dict:
    """What the customer puts in the contract, besides the route and the money."""
    owner = service.owner
    corp = owner.corporation if owner else None
    name = (corp.name if corp else "") if service.is_corporation else (owner.name if owner else "")
    return {
        "assignee": {"id": service.assignee_id, "name": name, "kind": "corporation" if service.is_corporation else "character"},
        "days_to_complete": service.days_to_complete,
        "expiration_days": service.expiration_days,
    }


def route_out(r: Route) -> dict:
    return {
        "id": r.pk,
        "start": {"name": r.start_name, "location_id": r.start_location_id, "system": _system(r.start_system_id)},
        "end": {"name": r.end_name, "location_id": r.end_location_id, "system": _system(r.end_system_id)},
        "both_ways": r.both_ways,
        "jumps": r.jumps,
        "base_price": float(r.base_price),
        "price_per_m3": float(r.price_per_m3),
        "price_per_jump": float(r.price_per_jump),
        "collateral_percent": float(r.collateral_percent),
        "min_reward": float(r.min_reward),
        "max_volume": r.max_volume,
        "max_collateral": float(r.max_collateral),
        "active": r.active,
    }


def service_out(s: Service, user=None, *, all_routes: bool = False) -> dict:
    """What customers see: the terms and the routes, nothing internal."""
    routes = s.routes.all() if all_routes else s.routes.filter(active=True)
    return {
        "id": s.pk,
        "name": s.name,
        "description": s.description,
        "active": s.active,
        "public": s.public,
        "terms": contract_terms(s),
        "routes": [route_out(r) for r in routes],
        "can_manage": bool(user and can_manage(user)),
    }


def owner_out(s: Service) -> dict | None:
    o = s.owner
    if o is None:
        return None
    token = getattr(o, "token", None)
    scope = "esi-contracts.read_corporation_contracts.v1" if s.is_corporation else "esi-contracts.read_character_contracts.v1"
    return {
        "id": o.pk,
        "name": o.name,
        "corporation": o.corporation.name if o.corporation_id and o.corporation else None,
        "login_ok": bool(token and token.has_scopes(scope)),
    }


def manage_out(s: Service) -> dict:
    """Everything a manager edits."""
    return {
        **service_out(s, all_routes=True),
        "owner_id": s.owner_id,
        "owner": owner_out(s),
        "is_corporation": s.is_corporation,
        "days_to_complete": s.days_to_complete,
        "expiration_days": s.expiration_days,
        "state_ids": list(s.states.values_list("pk", flat=True)),
        "group_ids": list(s.groups.values_list("pk", flat=True)),
        "notify": s.notify,
    }


STATUS_LABELS = {
    "outstanding": "Waiting",
    "in_progress": "In transit",
    "finished": "Delivered",
    "finished_issuer": "Delivered",
    "finished_contractor": "Delivered",
    "rejected": "Rejected",
    "deleted": "Deleted",
    "expired": "Expired",
    "failed": "Failed",
    "reversed": "Reversed",
}


def _place(location_id: int | None, places: dict) -> str | None:
    if not location_id:
        return None
    return places.get(location_id) or f"Location {location_id}"


def _places(ids) -> dict[int, str]:
    from conduit.sheet.models import Location as Place

    return dict(Place.objects.filter(pk__in={i for i in ids if i}).values_list("pk", "name"))


def contracts_out(contracts: list[Contract]) -> list[dict]:
    names = _names({c.issuer_id for c in contracts} | {c.issuer_corporation_id for c in contracts} | {c.acceptor_id for c in contracts})
    places = _places({c.start_location_id for c in contracts} | {c.end_location_id for c in contracts})
    return [contract_out(c, names, places) for c in contracts]


def contract_out(c: Contract, names: dict[int, str], places: dict[int, str]) -> dict:
    return {
        "contract_id": c.contract_id,
        "service": {"id": c.service_id, "name": c.service.name} if c.service_id else None,
        "route": str(c.route) if c.route_id else None,
        "title": c.title,
        "status": c.status,
        "status_label": STATUS_LABELS.get(c.status, c.status.replace("_", " ").capitalize()),
        "open": c.outstanding,
        "issuer": {"id": c.issuer_id, "name": names.get(c.issuer_id, "Unknown pilot")},
        "issuer_corporation": names.get(c.issuer_corporation_id) if c.issuer_corporation_id else None,
        "acceptor": {"id": c.acceptor_id, "name": names.get(c.acceptor_id, "Unknown")} if c.acceptor_id else None,
        "start": _place(c.start_location_id, places),
        "end": _place(c.end_location_id, places),
        "reward": float(c.reward),
        "expected_reward": float(c.expected_reward) if c.expected_reward is not None else None,
        "collateral": float(c.collateral),
        "volume": c.volume,
        "days_to_complete": c.days_to_complete,
        "date_issued": c.date_issued,
        "date_expired": c.date_expired,
        "date_accepted": c.date_accepted,
        "date_completed": c.date_completed,
        "problems": c.problems,
        "severe": any(p.get("severe") for p in c.problems),
    }


QUEUE_FILTERS = {
    "waiting": Q(status="outstanding"),
    "in_transit": Q(status="in_progress"),
    "done": ~Q(status__in=OPEN),
    "problems": Q(status__in=OPEN) & ~Q(problems=[]),
}


def queue(service_id: int | None = None, show: str = "waiting", limit: int = 300) -> dict:
    """The hauling queue: courier contracts to the services, a slice at a time, with counts for every slice."""
    qs = Contract.objects.select_related("service", "route")
    if service_id:
        qs = qs.filter(service_id=service_id)
    counts = {k: qs.filter(f).count() for k, f in QUEUE_FILTERS.items()}
    rows = list(qs.filter(QUEUE_FILTERS.get(show, QUEUE_FILTERS["waiting"]))[:limit])
    open_qs = qs.filter(status__in=OPEN)
    return {
        "contracts": contracts_out(rows),
        "counts": counts,
        "totals": {
            "open_reward": float(open_qs.aggregate(s=Sum("reward"))["s"] or 0),
            "open_collateral": float(open_qs.aggregate(s=Sum("collateral"))["s"] or 0),
            "open_volume": open_qs.aggregate(s=Sum("volume"))["s"] or 0,
        },
    }


def my_contracts(user) -> dict:
    """Courier contracts the member's characters made to the services."""
    ids = list(user.characters.values_list("pk", flat=True))
    rows = list(Contract.objects.filter(issuer_id__in=ids).select_related("service", "route")[:200])
    return {"contracts": contracts_out(rows)}


def statistics(s: Service) -> dict:
    contracts = Contract.objects.filter(service=s)
    open_qs = contracts.filter(status__in=OPEN)
    return {
        "open": open_qs.count(),
        "problems": open_qs.exclude(problems=[]).count(),
        "open_reward": float(open_qs.aggregate(v=Sum("reward"))["v"] or 0),
        "delivered": contracts.filter(status__in=FINISHED).count(),
        "delivered_reward": float(contracts.filter(status__in=FINISHED).aggregate(v=Sum("reward"))["v"] or 0),
    }


# --- managers -----------------------------------------------------------------------------------------------------

SERVICE_FIELDS = {"name", "description", "is_corporation", "days_to_complete", "expiration_days", "public", "notify", "active"}


def save_service(user, service: Service | None, data: dict) -> Service:
    from conduit.accounts.models import Character

    name = (data.get("name") or "").strip()
    if not name:
        raise FreightError("Give the service a name")
    owner = Character.objects.filter(pk=data.get("owner_id")).select_related("corporation").first()
    if owner is None:
        raise FreightError("Pick the character contracts go to")
    # Only someone who owns the character can make it the owner (its login reads the contracts).
    if owner.user_id != user.pk and not (service and service.owner_id == owner.pk):
        raise FreightError("Pick one of your own characters")
    if data.get("is_corporation") and not owner.corporation_id:
        raise FreightError("That character's corporation isn't known yet")
    if not 1 <= int(data.get("days_to_complete") or 0) <= 30:
        raise FreightError("Haulers get 1 to 30 days to deliver")
    if not 1 <= int(data.get("expiration_days") or 0) <= 30:
        raise FreightError("Contracts expire after 1 to 30 days")
    service = service or Service()
    for f in SERVICE_FIELDS & set(data):
        value = data[f]
        setattr(service, f, value.strip() if isinstance(value, str) else value)
    service.name = name[:100]
    service.description = (service.description or "")[:4000]
    service.owner = owner
    service.save()
    service.states.set(data.get("state_ids") or [])
    service.groups.set(data.get("group_ids") or [])
    return service


MONEY_FIELDS = ("base_price", "price_per_m3", "price_per_jump", "min_reward", "max_collateral")


def save_route(service: Service, route: Route | None, data: dict, client=None) -> Route:
    """A route's ends and rates. Jumps are looked up when the systems change and none were typed in."""
    for end in ("start", "end"):
        if not SolarSystem.objects.filter(pk=data.get(f"{end}_system_id")).exists():
            raise FreightError(f"Pick the {'pick-up' if end == 'start' else 'delivery'} system")
        if not (data.get(f"{end}_name") or "").strip():
            raise FreightError(f"Name the {'pick-up' if end == 'start' else 'delivery'} place")
    for f in MONEY_FIELDS:
        if (data.get(f) or 0) < 0:
            raise FreightError("Prices and limits can't be negative")
    if not 0 <= (data.get("collateral_percent") or 0) <= 100:
        raise FreightError("The collateral percentage goes from 0 to 100")
    if (data.get("max_volume") or 0) < 0:
        raise FreightError("Prices and limits can't be negative")
    jumps = data.get("jumps")
    if jumps is not None and not 0 <= jumps <= 500:
        raise FreightError("Jumps go from 0 to 500")
    route = route or Route(service=service)
    moved = route.pk is None or (route.start_system_id, route.end_system_id) != (data["start_system_id"], data["end_system_id"])
    route.start_name = data["start_name"].strip()[:200]
    route.start_system_id = data["start_system_id"]
    route.start_location_id = data.get("start_location_id") or None
    route.end_name = data["end_name"].strip()[:200]
    route.end_system_id = data["end_system_id"]
    route.end_location_id = data.get("end_location_id") or None
    route.both_ways = bool(data.get("both_ways", True))
    for f in MONEY_FIELDS:
        setattr(route, f, Decimal(str(round(data.get(f) or 0, 2))))
    route.collateral_percent = Decimal(str(round(data.get("collateral_percent") or 0, 2)))
    route.max_volume = float(data.get("max_volume") or 0)
    route.active = bool(data.get("active", True))
    if jumps is not None:
        route.jumps = jumps
    elif moved:
        route.jumps = count_jumps(route.start_system_id, route.end_system_id, client)
    route.save()
    return route


def count_jumps(origin: int, destination: int, client=None) -> int | None:
    """Gate jumps on the shortest route, from ESI's route finder. None when ESI can't say (wormhole space, an outage)."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiError

    if origin == destination:
        return 0
    try:
        systems = (client or esi()).get(f"/route/{origin}/{destination}").data
    except EsiError as exc:
        log.info("ESI found no route from %s to %s: %s", origin, destination, exc)
        return None
    return max(len(systems) - 1, 0) if isinstance(systems, list) and systems else None


def search_systems(q: str, limit: int = 15) -> list[dict]:
    q = q.strip()
    if len(q) < 2:
        return []
    qs = SolarSystem.objects.filter(name__istartswith=q).select_related("region").order_by("name")[:limit]
    return [{"id": s.pk, "name": s.name, "subtitle": f"{s.display_security:.1f} · {s.region.name}"} for s in qs]


def search_places(q: str, limit: int = 15) -> list[dict]:
    """Stations and structures the site already knows the names of (from assets, contracts, corporations)."""
    from conduit.sheet.models import Location as Place

    q = q.strip()
    if len(q) < 3:
        return []
    places = list(Place.objects.filter(kind__in=["station", "structure"], resolved=True, name__icontains=q).order_by("name")[:limit])
    systems = dict(SolarSystem.objects.filter(pk__in={p.solar_system_id for p in places}).values_list("pk", "name"))
    return [{"id": p.pk, "name": p.name, "solar_system_id": p.solar_system_id, "solar_system_name": systems.get(p.solar_system_id),
             "subtitle": f"{p.get_kind_display()} · {systems.get(p.solar_system_id, 'unknown system')}"} for p in places]
