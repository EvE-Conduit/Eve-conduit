"""Finding the courier contracts customers make to service owners, and checking each against its route."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.utils import timezone

from .models import Contract, Route, Service
from .services import FINISHED, price

log = logging.getLogger(__name__)

CHARACTER_SCOPE = "esi-contracts.read_character_contracts.v1"
CORPORATION_SCOPE = "esi-contracts.read_corporation_contracts.v1"
SETTLED = (*FINISHED, "rejected", "deleted", "expired", "failed", "reversed")


def _dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def problem(code: str, text: str, severe: bool = True) -> dict:
    return {"code": code, "text": text, "severe": severe}


def _end_matches(location_id: int | None, system_id: int | None, want_location: int | None, want_system: int) -> bool:
    if want_location:
        return location_id == want_location
    return system_id == want_system


def match_route(service: Service, start: int | None, end: int | None, systems: dict[int, int]) -> Route | None:
    """The service's route the contract runs, either way round when the route allows it. A route naming the station
    or structure beats one naming only the system."""
    best, best_score = None, -1
    for r in service.routes.all():
        if not r.active:
            continue
        ways = [(r.start_location_id, r.start_system_id, r.end_location_id, r.end_system_id)]
        if r.both_ways:
            ways.append((r.end_location_id, r.end_system_id, r.start_location_id, r.start_system_id))
        for a_loc, a_sys, b_loc, b_sys in ways:
            if _end_matches(start, systems.get(start), a_loc, a_sys) and _end_matches(end, systems.get(end), b_loc, b_sys):
                score = bool(a_loc) + bool(b_loc)
                if score > best_score:
                    best, best_score = r, score
    return best


def check(c: Contract, service: Service | None, route: Route | None, now: datetime | None = None) -> list[dict]:
    """What's wrong with a contract, worst first."""
    now = now or timezone.now()
    out = []
    if service and service.assignee_id and c.assignee_id != service.assignee_id:
        should = "the corporation" if service.is_corporation else (service.owner.name if service.owner else "the character")
        out.append(problem("wrong_assignee", f"Made out to the wrong {'character' if service.is_corporation else 'corporation'}: it should go to {should}."))
    if route is None:
        out.append(problem("wrong_route", "Goes between places none of the service's routes cover."))
    else:
        expected = price(route, c.volume or 0, c.collateral)
        if c.reward < expected - 1:
            out.append(problem("reward_low", f"Pays {expected - c.reward:,.0f} ISK less than the route asks ({expected:,.0f} ISK)."))
        elif c.reward > expected + 1:
            out.append(problem("reward_high", f"Pays {c.reward - expected:,.0f} ISK more than the route asks.", severe=False))
        if route.max_volume and (c.volume or 0) > route.max_volume:
            out.append(problem("volume_high", f"{c.volume:,.0f} m³ is over the route's {route.max_volume:,.0f} m³."))
        if route.max_collateral and c.collateral > route.max_collateral:
            out.append(problem("collateral_high", f"{c.collateral:,.0f} ISK collateral is over the route's {route.max_collateral:,.0f} ISK."))
    if service and c.days_to_complete is not None and c.days_to_complete < service.days_to_complete:
        out.append(problem("days_short", f"Gives {c.days_to_complete} day{'s' if c.days_to_complete != 1 else ''} to deliver; "
                                         f"the service asks for {service.days_to_complete}.", severe=False))
    if c.status == "outstanding" and c.date_expired and c.date_expired < now:
        out.append(problem("expired", "Expired before anyone accepted it.", severe=False))
    if c.status == "in_progress" and c.date_accepted and c.days_to_complete and c.date_accepted + timedelta(days=c.days_to_complete) < now:
        out.append(problem("overdue", "Past its delivery deadline: the hauler may fail it and lose the collateral."))
    return sorted(out, key=lambda p: not p["severe"])


def _rows(character, services: list[Service], client) -> list[dict]:
    """The owner's character contracts, and their corporation's when a service goes to the corporation."""
    out = []
    token = getattr(character, "token", None)
    if token and token.has_scopes(CHARACTER_SCOPE):
        out += client.get_all_pages(f"/characters/{character.pk}/contracts", character=character)
    if any(s.is_corporation for s in services) and character.corporation_id and token and token.has_scopes(CORPORATION_SCOPE):
        out += client.get_all_pages(f"/corporations/{character.corporation_id}/contracts", character=character)
    return out


def _systems(location_ids, character, client) -> dict[int, int]:
    """{location id: solar system id} for stations, structures (when the owner can see them) and systems."""
    from conduit.sheet.locations import kind_of, resolve

    ids = {i for i in location_ids if i}
    out = {i: i for i in ids if kind_of(i) == "solar_system"}
    try:
        found = resolve(ids - set(out), character=character, client=client)
    except Exception:  # an unknown place just doesn't match a system-wide route; never lose the sync over it
        log.exception("Couldn't look up contract locations")
        found = {}
    out.update({i: loc.solar_system_id for i, loc in found.items() if loc.solar_system_id})
    return out


def sync_owner(character_id: int, client=None) -> dict:
    """Fetch the owner's contracts and track every courier contract to a service. Returns counts."""
    from conduit.accounts.models import Character
    from conduit.esi.client import esi
    from conduit.eve.tasks import ensure_eve_names

    character = Character.objects.select_related("token").filter(pk=character_id).first()
    services = list(Service.objects.filter(owner_id=character_id).prefetch_related("routes"))
    if character is None or not services:
        return {"seen": 0, "new": 0}
    client = client or esi()
    # Who each service's contracts go to; a contract to anyone else isn't ours.
    by_assignee: dict[int, list[Service]] = {}
    for s in services:
        by_assignee.setdefault(s.assignee_id, []).append(s)
    assignees = {character.pk, character.corporation_id or 0}
    known = {c.contract_id: c for c in Contract.objects.filter(owner_id__in=assignees)}
    rows = [r for r in _rows(character, services, client) if r.get("type") == "courier" and r.get("assignee_id") in assignees]
    if not rows:
        return {"seen": 0, "new": 0}
    systems = _systems({r.get("start_location_id") for r in rows} | {r.get("end_location_id") for r in rows}, character, client)
    # Every contract to whoever a service goes to; to the owner's other half (the character for a corporation service,
    # or the other way round) only when it runs one of the routes, so the owner's own hauling stays out.
    rows = [r for r in rows if r["assignee_id"] in by_assignee or r["contract_id"] in known
            or any(match_route(s, r.get("start_location_id"), r.get("end_location_id"), systems) for s in services)]
    if not rows:
        return {"seen": 0, "new": 0}

    own = {s.pk for s in services}
    touched = []
    for row in rows:
        c = known.get(row["contract_id"])
        theirs = c is not None and c.service_id is not None and c.service_id not in own
        mine = by_assignee.get(row["assignee_id"]) or services
        if theirs and (c.route_id or not any(match_route(s, row.get("start_location_id"), row.get("end_location_id"), systems)
                                             for s in mine)):
            # Another owner's service in the same corporation: its owner's sync looks after it, unless it runs none of
            # that service's routes but one of ours. Otherwise the two syncs would take it from each other in turn.
            continue
        created = c is None
        old_status = None if created else c.status
        c = c or Contract(contract_id=row["contract_id"])
        c.owner_id = row["assignee_id"]
        c.issuer_id = row["issuer_id"]
        c.issuer_corporation_id = row.get("issuer_corporation_id")
        c.assignee_id = row["assignee_id"]
        c.acceptor_id = row.get("acceptor_id") or None
        c.title = (row.get("title") or "")[:200]
        c.status = row["status"]
        c.reward = Decimal(str(row.get("reward") or 0))
        c.collateral = Decimal(str(row.get("collateral") or 0))
        c.volume = row.get("volume") or 0
        c.days_to_complete = row.get("days_to_complete")
        c.start_location_id = row.get("start_location_id")
        c.end_location_id = row.get("end_location_id")
        c.date_issued = _dt(row["date_issued"])
        c.date_expired = _dt(row.get("date_expired"))
        c.date_accepted = _dt(row.get("date_accepted"))
        c.date_completed = _dt(row.get("date_completed"))
        candidates = mine if theirs else by_assignee.get(c.assignee_id) or ([c.service] if c.service_id else services)
        route = None
        for s in candidates:
            route = match_route(s, c.start_location_id, c.end_location_id, systems)
            if route:
                c.service = s
                break
        if route is None and not c.service_id:
            c.service = candidates[0]
        c.route = route
        c.expected_reward = price(route, c.volume, c.collateral) if route else None
        c.problems = check(c, c.service, route)
        c.save()
        touched.append((c, created, old_status))

    ensure_eve_names({c.issuer_id for c, _, _ in touched} | {c.issuer_corporation_id for c, _, _ in touched if c.issuer_corporation_id}
                     | {c.acceptor_id for c, _, _ in touched if c.acceptor_id})
    for c, created, old_status in touched:
        _announce(c, created, old_status)
    return {"seen": len(touched), "new": sum(created for _, created, _ in touched)}


def _announce(c: Contract, created: bool, old_status: str | None) -> None:
    from conduit.eve.models import EveName
    from conduit.events import bus
    from conduit.notify.services import notify, users_with_perm

    service = c.service
    issuer = EveName.objects.filter(pk=c.issuer_id).values_list("name", flat=True).first() or "Someone"
    route = str(c.route) if c.route_id else "an unknown route"
    payload = {"contract_id": c.contract_id, "service_id": c.service_id, "service": service.name if service else None, "issuer_id": c.issuer_id,
               "issuer": issuer, "route": route, "reward": float(c.reward), "collateral": float(c.collateral), "volume": c.volume,
               "status": c.status, "problems": [p["code"] for p in c.problems]}
    link = "/p/freight/queue"
    # title, summary, link and level are what webhooks show (a Discord embed, a Slack message).
    payload["link"] = link
    where = f" ({service.name})" if service else ""
    if created and c.status in ("outstanding", "in_progress"):
        severe = [p for p in c.problems if p["severe"]]
        body = f"{route}: {c.volume:,.0f} m³, {c.reward:,.0f} ISK reward, {c.collateral:,.0f} ISK collateral" + (f". Check it: {severe[0]['text']}" if severe else ".")
        level = "warning" if severe else "info"
        bus.emit("freight.contract_created", **payload, title=f"Courier contract from {issuer}{where}", summary=body, level=level)
        if service and service.notify:
            haulers = set(users_with_perm("freight.view_contracts")) | set(users_with_perm("freight.manage_freight"))
            notify(list(haulers), f"Courier contract from {issuer}{where}", body, link=link, level=level, category="p.freight")
    elif not created and old_status != c.status and c.status in SETTLED:
        outcome = "delivered" if c.status in FINISHED else c.status
        level = "success" if c.status in FINISHED else "warning" if c.status in ("rejected", "failed", "reversed") else "info"
        bus.emit("freight.contract_finished", **payload, title=f"Courier contract {outcome}{where}",
                 summary=f"{issuer}: {route}, {c.reward:,.0f} ISK.", level=level)


def sync_due_owners() -> list[int]:
    """Owners of active services whose login still works."""
    return list(Service.objects.filter(active=True, owner__isnull=False, owner__token__valid=True).values_list("owner_id", flat=True).distinct())


def recheck(service: Service) -> int:
    """Check the service's open contracts again (after its routes or owner change). Route matching by system needs the
    locations, which the last sync already looked up."""
    from conduit.sheet.models import Location as Place

    open_ = list(Contract.objects.filter(service=service, status__in=("outstanding", "in_progress")))
    ids = {c.start_location_id for c in open_} | {c.end_location_id for c in open_}
    systems = {i: i for i in ids if i and 30_000_000 <= i < 33_000_000}
    systems.update({pk: sys for pk, sys in Place.objects.filter(pk__in=ids, solar_system_id__isnull=False).values_list("pk", "solar_system_id")})
    for c in open_:
        c.route = match_route(service, c.start_location_id, c.end_location_id, systems)
        c.expected_reward = price(c.route, c.volume, c.collateral) if c.route else None
        c.problems = check(c, service, c.route)
        c.save(update_fields=["route", "expected_reward", "problems", "updated_at"])
    return len(open_)

