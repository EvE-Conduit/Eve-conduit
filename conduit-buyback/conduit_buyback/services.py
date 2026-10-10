"""Who may use and run which program, quotes, and what the pages show."""

from __future__ import annotations

import secrets
from datetime import timedelta
from decimal import Decimal

from django.db import IntegrityError
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from conduit.eve.models import EveName
from conduit.sde.models import ItemGroup, ItemType, MarketGroup, SolarSystem, type_icon_url

from . import pricing
from .models import BuybackSettings, Contract, ItemRule, Location, Program, Quote, WatchRule

OPEN = ("outstanding", "in_progress")
TRACKING_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"


class BuybackError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- access ---------------------------------------------------------------------------------------------------------


def manages_all(user) -> bool:
    return user.is_authenticated and user.has_perm("buyback.manage_all_programs")


def can_create(user) -> bool:
    return user.is_authenticated and (user.has_perm("buyback.manage_programs") or manages_all(user))


def managed(user):
    """Programs the user runs."""
    if manages_all(user):
        return Program.objects.all()
    if not user.has_perm("buyback.manage_programs"):
        return Program.objects.none()
    return Program.objects.filter(managers=user)


def can_manage(user, program: Program) -> bool:
    return managed(user).filter(pk=program.pk).exists()


def sees_statistics(user, program: Program) -> bool:
    return user.has_perm("buyback.view_all_statistics") or can_manage(user, program)


def usable(user):
    """Active programs the member may sell to: open to everyone, or to their state or one of their groups.
    Programs they run are always listed, even inactive ones."""
    group_ids = list(user.groups.values_list("pk", flat=True))
    audience = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids)
    if user.state_id:
        audience |= Q(states=user.state_id)
    ids = set(Program.objects.filter(active=True).filter(audience).values_list("pk", flat=True))
    ids |= set(managed(user).values_list("pk", flat=True))
    return Program.objects.filter(pk__in=ids)


def program_for(user, program_id: int) -> Program:
    program = usable(user).filter(pk=program_id).first()
    if program is None:
        raise BuybackError("No such program", 404)
    return program


def managed_program(user, program_id: int) -> Program:
    program = managed(user).filter(pk=program_id).first()
    if program is None:
        raise BuybackError("No such program, or you don't run it", 404)
    return program


# --- quotes ---------------------------------------------------------------------------------------------------------


def prefix_for(program: Program, settings: BuybackSettings | None = None) -> str:
    return program.tracking_prefix or (settings or BuybackSettings.load()).tracking_prefix


def new_tracking_number(program: Program, settings: BuybackSettings | None = None) -> str:
    """Lower case, so contracts are matched whatever case the seller typed."""
    return (prefix_for(program, settings) + "".join(secrets.choice(TRACKING_ALPHABET) for _ in range(10))).lower()


def quote(program: Program, text: str, user=None, public: bool = False) -> dict:
    """Value a paste. A tracking number is made when anything is bought (and, with ``reject_disallowed``, when
    everything is)."""
    if not program.active:
        raise BuybackError("This program is closed", 409)
    if program.owner is None:
        raise BuybackError("This program has no owner to contract to yet", 409)
    pasted = pricing.parse(text)
    if not pasted:
        raise BuybackError("Paste the items you want to sell, one per line")
    s = BuybackSettings.load()
    result = pricing.appraise(program, pasted, s)
    out = appraisal_out(result)
    blocked = s.reject_disallowed and (result.rejected or result.unknown)
    if blocked:
        out["blocked"] = "This program only takes a contract when it buys every item in it. Remove the items it doesn't buy."
    if not result.accepted or blocked:
        return {**out, "quote": None}
    for _ in range(5):
        try:
            q = Quote.objects.create(
                program=program, user=user if user and user.is_authenticated else None, tracking_number=new_tracking_number(program, s),
                lines=result.lines, value=result.value, volume=result.volume, flagged=result.flagged, public=public,
            )
            break
        except IntegrityError:  # the same random number twice: try another
            continue
    else:
        raise BuybackError("Couldn't make a tracking number; try again", 500)
    return {**out, "quote": quote_out(q)}


def appraisal_out(a: pricing.Appraisal) -> dict:
    return {
        "lines": a.lines,
        "unknown": a.unknown,
        "value": float(a.value),
        "volume": a.volume,
        "flagged": a.flagged,
        "accepted_count": len(a.accepted),
        "rejected_count": len(a.rejected),
    }


def contract_terms(program: Program) -> dict:
    """What the seller puts in the contract."""
    owner = program.owner
    corp = owner.corporation if owner else None
    assignee_name = (corp.name if corp else "") if program.is_corporation else (owner.name if owner else "")
    return {
        "assignee": {"id": program.assignee_id, "name": assignee_name, "kind": "corporation" if program.is_corporation else "character"},
        "locations": [location_out(loc) for loc in program.locations.all()],
        "expiration_days": program.expiration_days,
    }


def quote_out(q: Quote, *, with_lines: bool = False) -> dict:
    out = {
        "tracking_number": q.tracking_number,
        "program": {"id": q.program_id, "name": q.program.name},
        "value": float(q.value),
        "volume": q.volume,
        "flagged": q.flagged,
        "created_at": q.created_at,
        "items": len([ln for ln in q.lines if ln.get("accepted")]),
        "terms": contract_terms(q.program),
    }
    if with_lines:
        out["lines"] = q.lines
    return out


def quote_detail(q: Quote) -> dict:
    contracts = list(q.contracts.all())
    return {
        **quote_out(q, with_lines=True),
        "seller": q.user.display_name if q.user else None,
        "public": q.public,
        "contracts": [contract_out(c, with_items=True) for c in contracts],
    }


def can_open_quote(user, q: Quote) -> bool:
    if q.user_id and q.user_id == user.pk:
        return True
    if sees_statistics(user, q.program):
        return True
    return not BuybackSettings.load().restrict_quotes and usable(user).filter(pk=q.program_id).exists()


# --- output -----------------------------------------------------------------------------------------------------------


def _system(system_id: int | None) -> dict | None:
    s = SolarSystem.objects.filter(pk=system_id).select_related("region").first() if system_id else None
    return {"id": s.pk, "name": s.name, "security": s.display_security, "region": s.region.name} if s else None


def location_out(loc: Location) -> dict:
    return {"id": loc.pk, "name": loc.name, "structure_id": loc.structure_id, "system": _system(loc.solar_system_id)}


def _names(ids) -> dict[int, str]:
    ids = {i for i in ids if i}
    return dict(EveName.objects.filter(pk__in=ids).values_list("pk", "name"))


def program_out(p: Program, user=None) -> dict:
    """What sellers see: the terms, every rule that changes a price, nothing internal."""
    rules = list(p.item_rules.all())
    names = dict(ItemType.objects.filter(pk__in=[r.type_id for r in rules]).values_list("pk", "name"))
    out = {
        "id": p.pk,
        "name": p.name,
        "description": p.description,
        "active": p.active,
        "public": p.public,
        "price_type": p.price_type,
        "tax": float(p.tax),
        "hauling_fuel_cost": float(p.hauling_fuel_cost),
        "price_density_threshold": float(p.price_density_threshold),
        "price_density_tax": float(p.price_density_tax),
        "compressed_volume": p.compressed_volume,
        "allow_all_items": p.allow_all_items,
        "use_raw": p.use_raw,
        "use_compressed": p.use_compressed,
        "use_refined": p.use_refined,
        "refining_rate": float(p.refining_rate),
        "allow_unpacked": p.allow_unpacked,
        "blue_loot_npc": p.blue_loot_npc,
        "red_loot_npc": p.red_loot_npc,
        "t1_refined": p.t1_refined,
        "t1_refining_rate": float(p.t1_refining_rate),
        "terms": contract_terms(p),
        "item_rules": sorted(
            [{"type_id": r.type_id, "name": names.get(r.type_id, f"Type {r.type_id}"), "icon": type_icon_url(r.type_id, 32), "tax": float(r.tax),
              "disallowed": r.disallowed, "static_price": float(r.static_price) if r.static_price is not None else None} for r in rules],
            key=lambda r: r["name"],
        ),
        "can_manage": bool(user and user.is_authenticated and can_manage(user, p)),
    }
    return out


def prices_out(settings: BuybackSettings | None = None) -> dict:
    s = settings or BuybackSettings.load()
    return {"source": s.get_price_source_display(), "hub": "Jita 4-4" if s.price_source == "janice" else s.hub_name,
            "instant": s.instant_prices, "guard": s.guard_enabled, "guard_days": s.guard_days}


STATUS_LABELS = {
    "outstanding": "Waiting",
    "in_progress": "In progress",
    "finished": "Accepted",
    "finished_issuer": "Accepted",
    "finished_contractor": "Accepted",
    "rejected": "Rejected",
    "deleted": "Deleted",
    "expired": "Expired",
    "failed": "Failed",
    "reversed": "Reversed",
}


def contract_out(c: Contract, names: dict[int, str] | None = None, with_items: bool = False) -> dict:
    names = names if names is not None else _names([c.issuer_id, c.issuer_corporation_id])
    out = {
        "contract_id": c.contract_id,
        "program": {"id": c.program_id, "name": c.program.name} if c.program_id else None,
        "tracking_number": c.quote.tracking_number if c.quote_id else None,
        "title": c.title,
        "status": c.status,
        "status_label": STATUS_LABELS.get(c.status, c.status.replace("_", " ").capitalize()),
        "open": c.outstanding,
        "issuer": {"id": c.issuer_id, "name": names.get(c.issuer_id, "Unknown pilot")},
        "issuer_corporation": names.get(c.issuer_corporation_id) if c.issuer_corporation_id else None,
        "price": float(c.price),
        "quoted": float(c.quote.value) if c.quote_id else None,
        "volume": c.volume,
        "date_issued": c.date_issued,
        "date_expired": c.date_expired,
        "date_completed": c.date_completed,
        "problems": c.problems,
        "severe": any(p.get("severe") for p in c.problems),
    }
    if with_items:
        ids = {i[0] for i in (c.items or [])}
        types = dict(ItemType.objects.filter(pk__in=ids).values_list("pk", "name"))
        out["items"] = None if c.items is None else [
            {"type_id": t, "name": types.get(t, f"Type {t}"), "icon": type_icon_url(t, 32), "quantity": q, "included": inc} for t, q, inc in c.items
        ]
        out["location"] = _location_name(c.start_location_id)
    return out


def _location_name(location_id: int | None) -> str | None:
    if not location_id:
        return None
    from conduit.sheet.models import Location as Place

    place = Place.objects.filter(pk=location_id).first()
    return place.name if place else f"Location {location_id}"


def contracts_out(contracts: list[Contract]) -> list[dict]:
    names = _names({c.issuer_id for c in contracts} | {c.issuer_corporation_id for c in contracts})
    return [contract_out(c, names) for c in contracts]


def my_contracts(user) -> dict:
    """The member's quotes and the contracts made for them."""
    quotes = list(Quote.objects.filter(user=user).select_related("program").prefetch_related("contracts")[:200])
    rows = []
    for q in quotes:
        contracts = list(q.contracts.all())
        latest = contracts[0] if contracts else None
        rows.append({
            **quote_out(q),
            "contract": contract_out(latest) if latest else None,
            "state": (latest.status if latest else "quoted"),
        })
    contracts = Contract.objects.filter(quote__user=user)
    return {
        "quotes": rows,
        "totals": {
            "open": contracts.filter(status__in=OPEN).count(),
            "open_value": float(contracts.filter(status__in=OPEN).aggregate(s=Sum("price"))["s"] or 0),
            "sold_value": float(contracts.filter(status__startswith="finished").aggregate(s=Sum("price"))["s"] or 0),
        },
    }


# --- managers -----------------------------------------------------------------------------------------------------


def program_contracts(program: Program):
    """Contracts for the program, and ones to its owner carrying its prefix without a quote behind them."""
    q = Q(program=program)
    if program.owner_id:
        q |= Q(program__isnull=True, owner_id__in=[program.owner_id, program.owner_corporation_id or 0])
    return Contract.objects.filter(q).select_related("program", "quote")


def statistics(program: Program) -> dict:
    now = timezone.now()
    qs = program_contracts(program)
    finished = qs.filter(status__startswith="finished")
    month = finished.filter(date_completed__gte=now - timedelta(days=30))
    by_month = (
        finished.filter(date_completed__gte=(now - timedelta(days=365)).replace(day=1))
        .annotate(m=TruncMonth("date_completed"))
        .values("m")
        .annotate(value=Sum("price"), count=Count("pk"))
        .order_by("m")
    )
    out = {
        "open": qs.filter(status__in=OPEN).count(),
        "open_value": float(qs.filter(status__in=OPEN).aggregate(s=Sum("price"))["s"] or 0),
        "problems": qs.filter(status__in=OPEN).exclude(problems=[]).count(),
        "month_count": month.count(),
        "month_value": float(month.aggregate(s=Sum("price"))["s"] or 0),
        "total_value": float(finished.aggregate(s=Sum("price"))["s"] or 0),
        "total_count": finished.count(),
        "months": [{"month": r["m"].strftime("%Y-%m"), "value": float(r["value"] or 0), "count": r["count"]} for r in by_month if r["m"]],
        "wallet": wallet(program),
        "owner": owner_out(program),
    }
    # What it bought most of in the last 90 days, from the quotes behind accepted contracts.
    items: dict[int, dict] = {}
    for q in Quote.objects.filter(contracts__in=finished.filter(date_completed__gte=now - timedelta(days=90))).distinct():
        for ln in q.lines:
            if ln.get("accepted"):
                row = items.setdefault(ln["type_id"], {"type_id": ln["type_id"], "name": ln["name"], "icon": ln.get("icon"), "quantity": 0, "value": 0.0})
                row["quantity"] += ln["quantity"]
                row["value"] += ln["value"]
    out["top_items"] = sorted(items.values(), key=lambda r: -r["value"])[:10]
    return out


def leaderboard(program: Program, days: int = 90) -> list[dict]:
    since = timezone.now() - timedelta(days=days)
    rows = (
        Contract.objects.filter(program=program, status__startswith="finished", date_completed__gte=since)
        .values("issuer_id")
        .annotate(value=Sum("price"), count=Count("pk"))
        .order_by("-value")[:25]
    )
    names = _names([r["issuer_id"] for r in rows])
    return [{"id": r["issuer_id"], "name": names.get(r["issuer_id"], "Unknown pilot"), "value": float(r["value"] or 0), "count": r["count"]} for r in rows]


def wallet(program: Program) -> dict | None:
    if not (program.is_corporation and program.wallet_division and program.owner_corporation_id):
        return None
    from conduit.corp.models import WalletDivision

    w = WalletDivision.objects.filter(corporation_id=program.owner_corporation_id, division=program.wallet_division).first()
    return {"division": program.wallet_division, "balance": float(w.balance) if w else None, "updated_at": w.updated_at if w else None}


def owner_out(program: Program) -> dict | None:
    o = program.owner
    if o is None:
        return None
    token = getattr(o, "token", None)
    scope = "esi-contracts.read_corporation_contracts.v1" if program.is_corporation else "esi-contracts.read_character_contracts.v1"
    return {
        "id": o.pk,
        "name": o.name,
        "corporation": o.corporation.name if o.corporation_id and o.corporation else None,
        "login_ok": bool(token and token.has_scopes(scope)),
    }


def manage_out(p: Program) -> dict:
    """Everything a manager edits."""
    return {
        **program_out(p),
        "owner_id": p.owner_id,
        "is_corporation": p.is_corporation,
        "expiration_days": p.expiration_days,
        "location_ids": list(p.locations.values_list("pk", flat=True)),
        "manager_ids": list(p.managers.values_list("pk", flat=True)),
        "managers": [{"id": u.pk, "name": u.display_name} for u in p.managers.all()],
        "state_ids": list(p.states.values_list("pk", flat=True)),
        "group_ids": list(p.groups.values_list("pk", flat=True)),
        "notify_managers": p.notify_managers,
        "wallet_division": p.wallet_division,
        "tracking_prefix": p.tracking_prefix,
        "owner": owner_out(p),
        "watch_rules": watch_rules_out(p),
    }


PROGRAM_FIELDS = {
    "name", "description", "is_corporation", "expiration_days", "price_type", "tax", "hauling_fuel_cost", "price_density_threshold",
    "price_density_tax", "compressed_volume", "allow_all_items", "use_raw", "use_compressed", "use_refined", "refining_rate",
    "allow_unpacked", "blue_loot_npc", "red_loot_npc", "t1_refined", "t1_refining_rate", "public", "notify_managers",
    "wallet_division", "tracking_prefix", "active",
}
PERCENT_FIELDS = {"tax", "price_density_tax", "refining_rate", "t1_refining_rate"}


def save_program(user, program: Program | None, data: dict) -> Program:
    from conduit.accounts.models import Character

    name = (data.get("name") or "").strip()
    if not name:
        raise BuybackError("Give the program a name")
    owner = Character.objects.filter(pk=data.get("owner_id")).select_related("corporation").first()
    if owner is None:
        raise BuybackError("Pick the character contracts go to")
    # Only someone who owns the character can make it the owner (its login reads the contracts).
    if owner.user_id != user.pk and not (program and program.owner_id == owner.pk):
        raise BuybackError("Pick one of your own characters")
    if data.get("is_corporation") and not owner.corporation_id:
        raise BuybackError("That character's corporation isn't known yet")
    for f in PERCENT_FIELDS:
        if not 0 <= Decimal(str(data.get(f) or 0)) <= 100:
            raise BuybackError("Percentages go from 0 to 100")
    if not 1 <= int(data.get("expiration_days") or 0) <= 90:
        raise BuybackError("Contracts expire after 1 to 90 days")
    if data.get("wallet_division") not in (None, *range(1, 8)):
        raise BuybackError("Wallet divisions go from 1 to 7")
    prefix = (data.get("tracking_prefix") or "").strip()
    if prefix and (len(prefix) > 20 or not all(c.isalnum() or c in "-_." for c in prefix)):
        raise BuybackError("Tracking prefixes are up to 20 letters, digits, - _ or .")
    location_ids = set(data.get("location_ids") or [])
    locations = list(Location.objects.filter(pk__in=location_ids))
    if not locations:
        raise BuybackError("Pick at least one location")
    program = program or Program()
    for f in PROGRAM_FIELDS & set(data):
        value = data[f]
        if f in ("name", "description", "tracking_prefix") and isinstance(value, str):
            value = value.strip()
        setattr(program, f, value)
    program.name = name[:100]
    program.description = (program.description or "")[:4000]
    program.owner = owner
    program.save()
    program.locations.set(locations)
    from conduit.accounts.models import User

    managers = set(data.get("manager_ids") or []) | {user.pk}
    program.managers.set(User.objects.filter(pk__in=managers))
    program.states.set(data.get("state_ids") or [])
    program.groups.set(data.get("group_ids") or [])
    return program


def save_location(location: Location | None, data: dict) -> Location:
    name = (data.get("name") or "").strip()
    if not name:
        raise BuybackError("Give the location a name, ideally the structure's in-game name")
    if not SolarSystem.objects.filter(pk=data.get("solar_system_id")).exists():
        raise BuybackError("Pick a solar system")
    location = location or Location()
    location.name = name[:200]
    location.solar_system_id = data["solar_system_id"]
    location.structure_id = data.get("structure_id") or None
    location.save()
    return location


def item_rules_out(program: Program) -> list[dict]:
    return program_out(program)["item_rules"]


def save_item_rules(program: Program, type_ids: list[int], tax: float, disallowed: bool, static_price: float | None) -> int:
    if static_price is not None and static_price < 0:
        raise BuybackError("Prices can't be negative")
    if not -100 <= tax <= 100:
        raise BuybackError("The tax goes from -100 to 100 percent")
    ids = list(ItemType.objects.filter(pk__in=type_ids).values_list("pk", flat=True))
    for tid in ids:
        ItemRule.objects.update_or_create(
            program=program, type_id=tid,
            defaults={"tax": Decimal(str(tax)), "disallowed": disallowed,
                      "static_price": Decimal(str(static_price)) if static_price is not None else None},
        )
    return len(ids)


def market_group_types(market_group_id: int) -> list[int]:
    """Every published type in the market group and the groups under it."""
    ids, todo = set(), [market_group_id]
    while todo and len(ids) < 5000:
        ids.update(todo)
        todo = list(MarketGroup.objects.filter(parent_id__in=todo).exclude(pk__in=ids).values_list("pk", flat=True))
    return list(ItemType.objects.filter(market_group_id__in=ids, published=True).values_list("pk", flat=True)[:5000])


def watch_rules_out(program: Program) -> list[dict]:
    rules = list(program.watch_rules.all())
    types = dict(ItemType.objects.filter(pk__in=[r.type_id for r in rules if r.type_id]).values_list("pk", "name"))
    groups = dict(ItemGroup.objects.filter(pk__in=[r.group_id for r in rules if r.group_id]).values_list("pk", "name"))
    return [
        {"id": r.pk, "kind": "type" if r.type_id else "group", "target_id": r.type_id or r.group_id,
         "name": types.get(r.type_id, f"Type {r.type_id}") if r.type_id else groups.get(r.group_id, f"Group {r.group_id}"),
         "icon": type_icon_url(r.type_id, 32) if r.type_id else None}
        for r in rules
    ]


def add_watch(program: Program, type_id: int | None, group_id: int | None) -> WatchRule:
    if bool(type_id) == bool(group_id):
        raise BuybackError("Pick an item or an item group")
    if type_id and not ItemType.objects.filter(pk=type_id).exists() or group_id and not ItemGroup.objects.filter(pk=group_id).exists():
        raise BuybackError("No such item or group")
    rule, _ = WatchRule.objects.get_or_create(program=program, type_id=type_id or None, group_id=group_id or None)
    return rule


def search_types(q: str, limit: int = 20) -> list[dict]:
    q = q.strip()
    if len(q) < 2:
        return []
    qs = ItemType.objects.filter(published=True, name__icontains=q, market_group__isnull=False).select_related("group").order_by("name")[:limit]
    return [{"id": t.pk, "name": t.name, "subtitle": t.group.name, "icon": type_icon_url(t.pk, 32)} for t in qs]


def search_market_groups(q: str, limit: int = 20) -> list[dict]:
    q = q.strip()
    if len(q) < 2:
        return []
    out = []
    for g in MarketGroup.objects.filter(name__icontains=q).select_related("parent").order_by("name")[:limit]:
        out.append({"id": g.pk, "name": g.name, "subtitle": g.parent.name if g.parent_id and g.parent else "Top level"})
    return out


def search_groups(q: str, limit: int = 20) -> list[dict]:
    q = q.strip()
    if len(q) < 2:
        return []
    qs = ItemGroup.objects.filter(published=True, name__icontains=q).select_related("category").order_by("name")[:limit]
    return [{"id": g.pk, "name": g.name, "subtitle": g.category.name} for g in qs]


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
