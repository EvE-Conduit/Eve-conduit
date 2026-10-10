"""Mounted at /api/p/buyback/. Only reachable while the plugin is enabled."""

from decimal import Decimal

from django.contrib.auth.models import Group
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth
from pydantic import Field

from conduit.access.models import State
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import market, prices, services
from .models import BuybackSettings, Contract, ItemPrice, Location, Program, Quote

router = Router(tags=["buyback"], auth=django_auth)
MAX_PASTE = 200_000


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.BuybackError as exc:
        raise HttpError(exc.status, str(exc)) from None


# --- sellers ---------------------------------------------------------------------------------------------------------


@router.get("/programs")
def programs(request):
    qs = services.usable(request.user).select_related("owner__corporation").prefetch_related("locations", "item_rules")
    return {
        "programs": [services.program_out(p, request.user) for p in qs],
        "prices": services.prices_out(),
        "can_create": services.can_create(request.user),
        "manages": services.managed(request.user).exists(),
        "can_see_leaderboards": request.user.has_perm("buyback.view_leaderboard"),
    }


@router.get("/programs/{program_id}")
def program(request, program_id: int):
    p = _run(services.program_for, request.user, program_id)
    return {**services.program_out(p, request.user), "prices": services.prices_out()}


class QuoteIn(Schema):
    text: str = Field(max_length=MAX_PASTE)


@router.post("/programs/{program_id}/quote")
def make_quote(request, program_id: int, payload: QuoteIn):
    p = _run(services.program_for, request.user, program_id)
    return _run(services.quote, p, payload.text, user=request.user)


@router.get("/programs/{program_id}/leaderboard")
def leaderboard(request, program_id: int, days: int = 90):
    p = _run(services.program_for, request.user, program_id)
    if not (request.user.has_perm("buyback.view_leaderboard") or services.sees_statistics(request.user, p)):
        raise HttpError(403, "You can't see the leaderboard")
    return services.leaderboard(p, min(max(days, 7), 365))


@router.get("/me")
def me(request):
    return services.my_contracts(request.user)


@router.get("/quotes/{tracking_number}")
def get_quote(request, tracking_number: str):
    q = Quote.objects.select_related("program__owner__corporation", "user").filter(tracking_number=tracking_number.lower()).first()
    if q is None or not services.can_open_quote(request.user, q):
        raise HttpError(404, "No such quote")
    return {**services.quote_detail(q), "mine": q.user_id == request.user.pk, "can_manage": services.sees_statistics(request.user, q.program)}


# --- managers --------------------------------------------------------------------------------------------------------


def _manager(request):
    if not (services.can_create(request.user) or request.user.has_perm("buyback.view_all_statistics")):
        raise HttpError(403, "You don't run buyback programs")


@router.get("/manage")
def manage(request):
    _manager(request)
    qs = Program.objects.all() if request.user.has_perm("buyback.view_all_statistics") else services.managed(request.user)
    out = []
    for p in qs.select_related("owner__corporation", "owner__token"):
        stats = services.statistics(p)
        out.append({"id": p.pk, "name": p.name, "active": p.active, "public": p.public, "can_manage": services.can_manage(request.user, p),
                    **{k: stats[k] for k in ("open", "open_value", "problems", "month_value", "month_count", "total_value", "wallet", "owner")}})
    return {"programs": out, "can_create": services.can_create(request.user), "manages_all": services.manages_all(request.user)}


@router.get("/manage/options")
def options(request):
    """Pickers for the program form."""
    _manager(request)
    from conduit.notify.services import users_with_perm

    chars = request.user.characters.select_related("corporation", "token").order_by("name")
    return {
        "characters": [{"id": c.pk, "name": c.name, "corporation": c.corporation.name if c.corporation_id and c.corporation else None,
                        "login_ok": bool(getattr(c, "token", None) and c.token.valid)} for c in chars],
        "locations": [services.location_out(loc) for loc in Location.objects.all()],
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "managers": [{"id": u.pk, "name": u.display_name} for u in users_with_perm("buyback.manage_programs")][:500],
        "default_prefix": BuybackSettings.load().tracking_prefix,
    }


class ProgramIn(Schema):
    name: str = Field(max_length=100)
    description: str = Field("", max_length=4000)
    owner_id: int
    is_corporation: bool = True
    location_ids: list[int]
    manager_ids: list[int] = []
    expiration_days: int = 14
    price_type: str = "buy"
    tax: float = 10
    hauling_fuel_cost: float = 0
    price_density_threshold: float = 0
    price_density_tax: float = 0
    compressed_volume: bool = False
    allow_all_items: bool = True
    use_raw: bool = True
    use_compressed: bool = True
    use_refined: bool = True
    refining_rate: float = 80
    allow_unpacked: bool = False
    blue_loot_npc: bool = False
    red_loot_npc: bool = False
    t1_refined: bool = False
    t1_refining_rate: float = 55
    state_ids: list[int] = []
    group_ids: list[int] = []
    public: bool = False
    notify_managers: bool = True
    wallet_division: int | None = None
    tracking_prefix: str = ""
    active: bool = True


def _program_data(payload: ProgramIn) -> dict:
    if payload.price_type not in Program.PriceType.values:
        raise HttpError(400, "Unknown price type")
    if min(payload.hauling_fuel_cost, payload.price_density_threshold) < 0:
        raise HttpError(400, "Costs can't be negative")
    data = payload.model_dump()
    for f in ("tax", "hauling_fuel_cost", "price_density_threshold", "price_density_tax", "refining_rate", "t1_refining_rate"):
        data[f] = Decimal(str(round(data[f], 2)))
    return data


@router.post("/manage/programs")
def create_program(request, payload: ProgramIn):
    if not services.can_create(request.user):
        raise HttpError(403, "You can't create buyback programs")
    p = _run(services.save_program, request.user, None, _program_data(payload))
    record("buyback.program", f"created the buyback program {p.name}", request=request, target_type="plugin", details={"plugin": "buyback", "program_id": p.pk})
    return services.manage_out(p)


@router.get("/manage/programs/{program_id}")
def get_managed(request, program_id: int):
    return services.manage_out(_run(services.managed_program, request.user, program_id))


@router.put("/manage/programs/{program_id}")
def update_program(request, program_id: int, payload: ProgramIn):
    from .contracts import recheck

    p = _run(services.managed_program, request.user, program_id)
    p = _run(services.save_program, request.user, p, _program_data(payload))
    recheck(p)
    record("buyback.program", f"changed the buyback program {p.name}", request=request, target_type="plugin", details={"plugin": "buyback", "program_id": p.pk})
    return services.manage_out(p)


@router.delete("/manage/programs/{program_id}")
def delete_program(request, program_id: int):
    p = _run(services.managed_program, request.user, program_id)
    name = p.name
    p.delete()
    record("buyback.program", f"deleted the buyback program {name}", request=request, target_type="plugin", details={"plugin": "buyback"})
    return {"ok": True}


def _stats_program(request, program_id: int) -> Program:
    p = Program.objects.filter(pk=program_id).select_related("owner__corporation", "owner__token").first()
    if p is None or not services.sees_statistics(request.user, p):
        raise HttpError(404, "No such program")
    return p


@router.get("/manage/programs/{program_id}/stats")
def stats(request, program_id: int):
    p = _stats_program(request, program_id)
    return {"program": {"id": p.pk, "name": p.name, "can_manage": services.can_manage(request.user, p)}, **services.statistics(p),
            "leaderboard": services.leaderboard(p)}


@router.get("/manage/programs/{program_id}/contracts")
def program_contracts(request, program_id: int, status: str = "open", q: str = ""):
    p = _stats_program(request, program_id)
    qs = services.program_contracts(p)
    if status == "open":
        qs = qs.filter(status__in=services.OPEN)
    elif status == "problems":
        qs = qs.filter(status__in=services.OPEN).exclude(problems=[])
    elif status == "finished":
        qs = qs.filter(status__startswith="finished")
    elif status == "closed":
        qs = qs.exclude(status__in=services.OPEN).exclude(status__startswith="finished")
    elif status != "all":
        raise HttpError(400, "Unknown status")
    q = q.strip()[:100]
    if q:
        from conduit.eve.models import EveName

        ids = list(EveName.objects.filter(name__icontains=q).values_list("pk", flat=True)[:200])
        from django.db.models import Q

        qs = qs.filter(Q(title__icontains=q) | Q(issuer_id__in=ids))
    return services.contracts_out(list(qs[:500]))


@router.get("/contracts/{contract_id}")
def contract(request, contract_id: int):
    c = Contract.objects.select_related("program", "quote__user").filter(contract_id=contract_id).first()
    if c is None:
        raise HttpError(404, "No such contract")
    seller = c.quote_id and c.quote.user_id == request.user.pk
    if not (seller or (c.program and services.sees_statistics(request.user, c.program))):
        raise HttpError(404, "No such contract")
    out = services.contract_out(c, with_items=True)
    if c.quote_id:
        out["quote"] = services.quote_out(c.quote, with_lines=True)
    return out


@router.post("/manage/programs/{program_id}/sync")
def sync_now(request, program_id: int):
    from django.core.cache import cache

    from .tasks import sync_owner_contracts

    p = _run(services.managed_program, request.user, program_id)
    if not p.owner_id:
        raise HttpError(409, "The program has no owner")
    if not cache.add(f"buyback:sync:{p.owner_id}", 1, timeout=60):
        raise HttpError(429, "Contracts were checked less than a minute ago")
    sync_owner_contracts.delay(p.owner_id)
    return {"ok": True}


# --- item rules and watchlist ----------------------------------------------------------------------------------


class RulesIn(Schema):
    type_ids: list[int] = []
    market_group_id: int | None = None
    tax: float = 0
    disallowed: bool = False
    static_price: float | None = None


@router.post("/manage/programs/{program_id}/items")
def add_items(request, program_id: int, payload: RulesIn):
    p = _run(services.managed_program, request.user, program_id)
    ids = list(payload.type_ids[:5000])
    if payload.market_group_id:
        ids += services.market_group_types(payload.market_group_id)
    if not ids:
        raise HttpError(400, "Pick an item or a market group")
    n = _run(services.save_item_rules, p, ids, payload.tax, payload.disallowed, payload.static_price)
    record("buyback.items", f"set {n} item rule{'s' if n != 1 else ''} in the buyback program {p.name}", request=request,
           target_type="plugin", details={"plugin": "buyback", "program_id": p.pk})
    return {"added": n, "item_rules": services.item_rules_out(p)}


@router.delete("/manage/programs/{program_id}/items/{type_id}")
def delete_item(request, program_id: int, type_id: int):
    p = _run(services.managed_program, request.user, program_id)
    p.item_rules.filter(type_id=type_id).delete()
    return {"item_rules": services.item_rules_out(p)}


@router.delete("/manage/programs/{program_id}/items")
def delete_all_items(request, program_id: int):
    p = _run(services.managed_program, request.user, program_id)
    n, _ = p.item_rules.all().delete()
    record("buyback.items", f"removed all {n} item rules from the buyback program {p.name}", request=request, target_type="plugin",
           details={"plugin": "buyback", "program_id": p.pk})
    return {"item_rules": []}


class WatchIn(Schema):
    type_id: int | None = None
    group_id: int | None = None


@router.post("/manage/programs/{program_id}/watchlist")
def add_watch(request, program_id: int, payload: WatchIn):
    p = _run(services.managed_program, request.user, program_id)
    _run(services.add_watch, p, payload.type_id, payload.group_id)
    return services.watch_rules_out(p)


@router.delete("/manage/programs/{program_id}/watchlist/{rule_id}")
def delete_watch(request, program_id: int, rule_id: int):
    p = _run(services.managed_program, request.user, program_id)
    p.watch_rules.filter(pk=rule_id).delete()
    return services.watch_rules_out(p)


# --- locations -------------------------------------------------------------------------------------------------------


class LocationIn(Schema):
    name: str = Field(max_length=200)
    solar_system_id: int
    structure_id: int | None = None


def _location_manager(request):
    if not services.can_create(request.user):
        raise HttpError(403, "You can't change buyback locations")


@router.post("/manage/locations")
def create_location(request, payload: LocationIn):
    _location_manager(request)
    return services.location_out(_run(services.save_location, None, payload.model_dump()))


@router.put("/manage/locations/{location_id}")
def update_location(request, location_id: int, payload: LocationIn):
    _location_manager(request)
    loc = Location.objects.filter(pk=location_id).first()
    if loc is None:
        raise HttpError(404, "No such location")
    if not services.manages_all(request.user) and loc.programs.exclude(pk__in=services.managed(request.user)).exists():
        raise HttpError(403, "Programs you don't run use this location")
    return services.location_out(_run(services.save_location, loc, payload.model_dump()))


@router.delete("/manage/locations/{location_id}")
def delete_location(request, location_id: int):
    _location_manager(request)
    loc = Location.objects.filter(pk=location_id).first()
    if loc is None:
        raise HttpError(404, "No such location")
    if loc.programs.exists():
        raise HttpError(409, "Programs still use this location")
    loc.delete()
    return {"ok": True}


# --- search ----------------------------------------------------------------------------------------------------------


@router.get("/manage/search/{kind}")
def search(request, kind: str, q: str = ""):
    _manager(request)
    fn = {"types": services.search_types, "market-groups": services.search_market_groups, "groups": services.search_groups,
          "systems": services.search_systems, "places": services.search_places, "hubs": market.search_hubs}.get(kind)
    if fn is None:
        raise HttpError(404, "Unknown search")
    return fn(q[:100])


# --- site settings ----------------------------------------------------------------------------------------------


def settings_out(s: BuybackSettings, user=None) -> dict:
    from conduit.sde.models import Region

    region = market.hub_region(s)
    c = s.esi_character
    chars = user.characters.select_related("token").order_by("name") if user else []
    return {
        "hubs": [{"id": i, "name": short, "full_name": full, "region": reg} for i, short, full, reg in market.HUBS],
        "esi_character": {"id": c.pk, "name": c.name} if c else None,
        "characters": [{"id": ch.pk, "name": ch.name, "can_read": bool(getattr(ch, "token", None) and ch.token.has_scopes(market.STRUCTURE_SCOPE))}
                       for ch in chars],
        "hub_kind": market.hub_kind(s.hub_id),
        "history_region": Region.objects.filter(pk=region).values_list("name", flat=True).first() if region else None,
        "market_pulled_at": s.market_pulled_at,
        "market_note": s.market_note,
        "guard_enabled": s.guard_enabled,
        "guard_threshold": float(s.guard_threshold),
        "guard_days": s.guard_days,
        "guard_min_days": s.guard_min_days,
        "guard_both_ways": s.guard_both_ways,
        "price_source": s.price_source,
        "hub_id": s.hub_id,
        "hub_name": s.hub_name,
        "instant_prices": s.instant_prices,
        "janice_key_set": bool(s.janice_api_key),
        "price_max_age_hours": s.price_max_age_hours,
        "tracking_prefix": s.tracking_prefix,
        "unlinked_purge_hours": s.unlinked_purge_hours,
        "reject_disallowed": s.reject_disallowed,
        "restrict_quotes": s.restrict_quotes,
        "prices_stored": ItemPrice.objects.count(),
    }


@router.get("/settings")
@require_perm("buyback.manage_all_programs")
def get_settings(request):
    return settings_out(BuybackSettings.load(), request.user)


class SettingsIn(Schema):
    price_source: str = "esi"
    hub_id: int = 60003760
    hub_name: str = Field("Jita 4-4", max_length=100)
    instant_prices: bool = False
    #: Empty keeps the stored key; "-" removes it.
    janice_api_key: str = Field("", max_length=100)
    price_max_age_hours: int = 24
    tracking_prefix: str = Field("bb-", max_length=20)
    unlinked_purge_hours: int = 48
    reject_disallowed: bool = False
    restrict_quotes: bool = True
    esi_character_id: int | None = None
    guard_enabled: bool = True
    guard_threshold: float = 20
    guard_days: int = 7
    guard_min_days: int = 5
    guard_both_ways: bool = False


@router.put("/settings")
@require_perm("buyback.manage_all_programs")
def put_settings(request, payload: SettingsIn):
    if payload.price_source not in BuybackSettings.Source.values:
        raise HttpError(400, "Unknown price source")
    if not 1 <= payload.price_max_age_hours <= 24 * 14:
        raise HttpError(400, "Prices can be kept for 1 hour to 14 days")
    if not 0 <= payload.unlinked_purge_hours <= 24 * 90:
        raise HttpError(400, "Quotes can be kept for up to 90 days")
    prefix = payload.tracking_prefix.strip()
    if not prefix or not all(c.isalnum() or c in "-_." for c in prefix):
        raise HttpError(400, "The tracking prefix is letters, digits, - _ or .")
    if not 1 <= payload.guard_threshold <= 1000:
        raise HttpError(400, "The guard's threshold goes from 1 to 1000 percent")
    if not 2 <= payload.guard_days <= 30 or not 1 <= payload.guard_min_days <= payload.guard_days:
        raise HttpError(400, "The average covers 2 to 30 days, and the item must trade on 1 to that many of them")
    s = BuybackSettings.load()
    if payload.esi_character_id != s.esi_character_id:
        from conduit.accounts.models import Character

        c = Character.objects.filter(pk=payload.esi_character_id, user=request.user).first() if payload.esi_character_id else None
        if payload.esi_character_id and c is None:
            raise HttpError(400, "Pick one of your own characters")
        s.esi_character = c
    kind = market.hub_kind(payload.hub_id)
    if payload.price_source != "janice":
        if kind == "structure" and payload.price_source != "esi":
            raise HttpError(400, "Only ESI can read a player structure's market")
        if kind == "structure" and s.esi_character is None:
            raise HttpError(400, "Reading a structure's market needs a character that can dock there")
        if kind != "structure" and market.hub_region(BuybackSettings(price_source=payload.price_source, hub_id=payload.hub_id)) is None:
            raise HttpError(400, "No such market: pick a trade hub, or a region, system or station")
    source_changed = (s.price_source, s.hub_id, s.instant_prices) != (payload.price_source, payload.hub_id, payload.instant_prices)
    s.price_source = payload.price_source
    s.hub_id = payload.hub_id
    s.hub_name = payload.hub_name.strip() or "Market hub"
    s.instant_prices = payload.instant_prices
    if payload.janice_api_key.strip() == "-":
        s.janice_api_key = ""
    elif payload.janice_api_key.strip():
        s.janice_api_key = payload.janice_api_key.strip()
    if s.price_source == BuybackSettings.Source.JANICE and not s.janice_api_key:
        raise HttpError(400, "Janice needs an API key")
    s.price_max_age_hours = payload.price_max_age_hours
    s.tracking_prefix = prefix
    s.unlinked_purge_hours = payload.unlinked_purge_hours
    s.reject_disallowed = payload.reject_disallowed
    s.restrict_quotes = payload.restrict_quotes
    s.guard_enabled = payload.guard_enabled
    s.guard_threshold = Decimal(str(round(payload.guard_threshold, 2)))
    s.guard_days = payload.guard_days
    s.guard_min_days = payload.guard_min_days
    s.guard_both_ways = payload.guard_both_ways
    if source_changed:
        s.market_pulled_at, s.market_note = None, ""
    s.save()
    if source_changed:
        ItemPrice.objects.all().delete()  # priced elsewhere or differently: fetch again when next needed
        if s.price_source == BuybackSettings.Source.ESI:
            from .tasks import pull_market

            pull_market.delay()
    record("buyback.settings", "changed the buyback settings", request=request, target_type="plugin", details={"plugin": "buyback"})
    return settings_out(s, request.user)


@router.post("/settings/refresh-prices")
@require_perm("buyback.manage_all_programs")
def refresh_prices(request):
    if BuybackSettings.load().price_source == BuybackSettings.Source.ESI:
        from .tasks import pull_market

        pull_market.delay()
        return {"refreshed": None, "queued": True}
    ids = list(ItemPrice.objects.values_list("type_id", flat=True)[:20000])
    try:
        n = prices.fetch(ids) if ids else 0
    except prices.PriceError as exc:
        raise HttpError(502, str(exc)) from None
    return {"refreshed": n}
