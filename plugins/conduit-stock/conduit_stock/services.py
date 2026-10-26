"""Doctrine stock: what should be for sale where, what is, and who's seeding what.

Stock is counted only from what the core already syncs: members' own market orders and contracts, and their
corporations' market orders (see ``count``). Other sellers on the market aren't seen.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm
from conduit.sde.models import ItemType, SolarSystem, type_icon_url

from .models import Claim, Place, StockSettings, Target

log = logging.getLogger(__name__)

MANAGE_PERM = "stock.manage_stock"
#: Contracts open to more than one person. Personal contracts are meant for someone in particular, not for sale.
CONTRACT_AVAILABILITY = ("public", "corporation", "alliance")
MAX_QUANTITY = 1_000_000
SHIP_CATEGORY = 6


class StockError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- doctrines (optional) -------------------------------------------------------------------------------------------


def doctrines_installed() -> bool:
    from conduit.plugins.services import is_enabled

    return is_enabled("doctrines")


def _fits(fit_ids) -> dict[int, object]:
    """Doctrines fits by id, or nothing when the Doctrines plugin isn't on."""
    ids = {i for i in fit_ids if i}
    if not ids or not doctrines_installed():
        return {}
    from conduit_doctrines.models import Fit

    return {f.pk: f for f in Fit.objects.filter(pk__in=ids)}


def search_fits(q: str, limit: int = 15) -> list[dict]:
    q = (q or "").strip()
    if len(q) < 2 or not doctrines_installed():
        return []
    from conduit_doctrines.models import Fit

    fits = list(Fit.objects.filter(name__icontains=q).order_by("name")[:limit])
    hulls = dict(ItemType.objects.filter(pk__in={f.ship_type_id for f in fits}).values_list("pk", "name"))
    return [{"id": f.pk, "name": f.name, "subtitle": hulls.get(f.ship_type_id, ""), "icon": type_icon_url(f.ship_type_id, 32),
             "type_id": f.ship_type_id} for f in fits]


# --- counting ---------------------------------------------------------------------------------------------------------


def count(pairs) -> dict[tuple[int, int], dict]:
    """What's for sale for each ``(location_id, type_id)``: ``{have, orders, contracts, cheapest_order, cheapest_contract}``.

    - Sell orders that are open: members' own (character market orders, which include orders they placed for their
      corporation) and their corporations' (corporation market orders), each order counted once by its order id.
      Each counts its remaining volume.
    - Item exchange contracts that are outstanding and not expired, at the location, open to the public, a corporation
      or an alliance, from members' own contracts. Each contract is counted once by its contract id, for the quantity
      of the type it sells (items the buyer would have to give are left out).
    """
    from conduit.corp.models import CorpMarketOrder
    from conduit.sheet.contracts.models import Contract
    from conduit.sheet.market.models import MarketOrder

    pairs = {(int(loc), int(t)) for loc, t in pairs}
    out = {p: {"have": 0, "orders": 0, "contracts": 0, "cheapest_order": None, "cheapest_contract": None} for p in pairs}
    if not pairs:
        return out
    locations = {loc for loc, _ in pairs}
    types = {t for _, t in pairs}

    orders = {}
    for oid, loc, t, vol, price in MarketOrder.objects.filter(
        state=MarketOrder.State.OPEN, is_buy=False, location_id__in=locations, type_id__in=types, volume_remain__gt=0,
    ).values_list("order_id", "location_id", "type_id", "volume_remain", "price"):
        orders[oid] = (loc, t, vol, price)
    for oid, loc, t, vol, price in CorpMarketOrder.objects.filter(
        state="active", is_buy_order=False, location_id__in=locations, type_id__in=types, volume_remain__gt=0,
    ).values_list("order_id", "location_id", "type_id", "volume_remain", "price"):
        orders[oid] = (loc, t, vol, price)
    for loc, t, vol, price in orders.values():
        row = out.get((loc, t))
        if row is None:
            continue
        row["have"] += vol
        row["orders"] += vol
        if row["cheapest_order"] is None or price < row["cheapest_order"]:
            row["cheapest_order"] = price

    ships = set(ItemType.objects.filter(pk__in=types, group__category_id=SHIP_CATEGORY).values_list("pk", flat=True))
    contracts = {}
    for c in (Contract.objects.filter(type="item_exchange", status="outstanding", start_location_id__in=locations,
                                      availability__in=CONTRACT_AVAILABILITY, date_expired__gt=timezone.now())
              .prefetch_related("items")):
        contracts.setdefault(c.contract_id, c)
    for c in contracts.values():
        sold = {}
        for item in c.items.all():
            if item.is_included:
                sold[item.type_id] = sold.get(item.type_id, 0) + max(item.quantity, 1)
        for t, qty in sold.items():
            row = out.get((c.start_location_id, t))
            if row is None:
                continue
            row["have"] += qty
            row["contracts"] += qty
            # A fitted ship's contract price is the price of the ship as fitted; for a mixed bag of items the price
            # says nothing about any one of them, so it's only kept when the contract is just this type.
            if c.price is not None and (len(sold) == 1 or t in ships):
                each = c.price / qty if len(sold) == 1 else c.price
                if row["cheapest_contract"] is None or each < row["cheapest_contract"]:
                    row["cheapest_contract"] = each
    return out


# --- claims ---------------------------------------------------------------------------------------------------------


def active_claims(targets) -> dict[int, list[Claim]]:
    out: dict[int, list[Claim]] = {}
    for c in Claim.objects.filter(target__in=targets, expires_at__gt=timezone.now()).select_related("user__main_character"):
        out.setdefault(c.target_id, []).append(c)
    return out


def claim(target: Target, user, quantity: int) -> Claim:
    if quantity < 1:
        raise StockError("Claim at least one")
    if quantity > MAX_QUANTITY:
        raise StockError("That's more than anyone will seed")
    days = StockSettings.load().claim_days
    expires = timezone.now() + timedelta(days=days)
    c, _ = Claim.objects.update_or_create(target=target, user=user, defaults={"quantity": quantity, "expires_at": expires})
    return c


def release(target: Target, user) -> None:
    Claim.objects.filter(target=target, user=user).delete()


# --- managing ---------------------------------------------------------------------------------------------------------


def search_places(q: str, limit: int = 15) -> list[dict]:
    """Stations and structures the site already knows the names of (from assets, contracts, corporations)."""
    from conduit.sheet.models import Location

    q = (q or "").strip()
    if len(q) < 3:
        return []
    places = list(Location.objects.filter(kind__in=["station", "structure"], resolved=True, name__icontains=q).order_by("name")[:limit])
    systems = dict(SolarSystem.objects.filter(pk__in={p.solar_system_id for p in places}).values_list("pk", "name"))
    return [{"id": p.pk, "name": p.name, "subtitle": f"{p.get_kind_display()} · {systems.get(p.solar_system_id, 'unknown system')}"}
            for p in places]


def search_types(q: str, limit: int = 20) -> list[dict]:
    q = (q or "").strip()
    if len(q) < 2:
        return []
    from conduit.search.providers import ranked

    qs = ranked(ItemType.objects.filter(published=True, name__icontains=q, market_group__isnull=False).select_related("group"), "name", q)[:limit]
    return [{"id": t.pk, "name": t.name, "subtitle": t.group.name, "icon": type_icon_url(t.pk, 32)} for t in qs]


def save_place(place: Place | None, data: dict, by, request=None) -> Place:
    from conduit.sheet.models import Location

    label = str(data.get("label") or "").strip()[:100]
    order = int(data.get("order") or 0)
    if place is None:
        loc = Location.objects.filter(pk=data.get("location_id"), kind__in=["station", "structure"]).first()
        if loc is None:
            raise StockError("Pick a station or structure from the list")
        if Place.objects.filter(location_id=loc.pk).exists():
            raise StockError(f"{loc.name} is already a staging location")
        place = Place(location_id=loc.pk, name=loc.name, solar_system_id=loc.solar_system_id)
    place.label = label
    place.order = order
    place.save()
    record("stock.place_saved", f"saved staging location {place.name}", request=request, actor=by, target_type="plugin",
           details={"place_id": place.pk})
    return place


def delete_place(place: Place, by, request=None) -> None:
    record("stock.place_deleted", f"removed staging location {place.name}", request=request, actor=by, target_type="plugin",
           details={"place_id": place.pk})
    place.delete()


def save_target(target: Target | None, place: Place, data: dict, by, request=None) -> Target:
    fit_id = data.get("fit_id") or None
    if fit_id:
        fit = _fits([fit_id]).get(int(fit_id))
        if fit is None:
            raise StockError("That doctrine fit doesn't exist" if doctrines_installed() else "Doctrine fits need the Doctrines plugin")
        type_id = fit.ship_type_id
    else:
        type_id = data.get("type_id")
    item = ItemType.objects.filter(pk=type_id).first() if type_id else None
    if item is None:
        raise StockError("Pick a ship or item")
    quantity = int(data.get("quantity") or 0)
    if not 1 <= quantity <= MAX_QUANTITY:
        raise StockError("Set how many should be for sale (at least one)")
    low = data.get("low")
    low = None if low in (None, "") else int(low)
    if low is not None and not 0 <= low <= quantity:
        raise StockError("The low mark must be between 0 and the target")
    dupes = Target.objects.filter(place=place, type_id=item.pk, fit_id=fit_id)
    if target is not None:
        dupes = dupes.exclude(pk=target.pk)
    if dupes.exists():
        raise StockError(f"{place} already has a target for {item.name}")
    target = target or Target(place=place)
    target.type_id = item.pk
    target.fit_id = int(fit_id) if fit_id else None
    target.quantity = quantity
    target.low = low
    target.note = str(data.get("note") or "").strip()[:200]
    target.order = int(data.get("order") or 0)
    target.save()
    record("stock.target_saved", f"set {place} to stock {quantity} {item.name}", request=request, actor=by, target_type="plugin",
           details={"target_id": target.pk, "type_id": item.pk, "fit_id": target.fit_id, "quantity": quantity})
    return target


def delete_target(target: Target, by, request=None) -> None:
    record("stock.target_deleted", f"removed a stock target at {target.place}", request=request, actor=by, target_type="plugin",
           details={"target_id": target.pk, "type_id": target.type_id})
    target.delete()


def save_settings(claim_days: int, by, request=None) -> StockSettings:
    if not 1 <= claim_days <= 90:
        raise StockError("Claims last between 1 and 90 days")
    s = StockSettings.load()
    s.claim_days = claim_days
    s.save()
    record("stock.settings_saved", f"set stock claims to last {claim_days} days", request=request, actor=by, target_type="plugin")
    return s


# --- what pages show ----------------------------------------------------------------------------------------------


def status_of(have: int, target: Target) -> str:
    if have >= target.quantity:
        return "ok"
    return "low" if have < target.low_mark else "short"


def board(places=None, user=None) -> list[dict]:
    """Each place with its targets: what's for sale against what should be, and who's seeding."""
    places = list(places if places is not None else Place.objects.all())
    targets = list(Target.objects.filter(place__in=places).select_related("place"))
    counts = count((t.place.location_id, t.type_id) for t in targets)
    claims = active_claims(targets)
    names = dict(ItemType.objects.filter(pk__in={t.type_id for t in targets}).values_list("pk", "name"))
    fits = _fits(t.fit_id for t in targets)
    systems = dict(SolarSystem.objects.filter(pk__in={p.solar_system_id for p in places if p.solar_system_id}).values_list("pk", "name"))
    by_place: dict[int, list[dict]] = {}
    for t in targets:
        c = counts[(t.place.location_id, t.type_id)]
        cl = claims.get(t.pk, [])
        claimed = sum(x.quantity for x in cl)
        short = max(t.quantity - c["have"], 0)
        fit = fits.get(t.fit_id)
        mine = next((x for x in cl if user is not None and x.user_id == user.pk), None)
        by_place.setdefault(t.place_id, []).append({
            "id": t.pk,
            "type_id": t.type_id,
            "name": names.get(t.type_id, f"Type {t.type_id}"),
            "icon": type_icon_url(t.type_id, 64),
            "fit": {"id": fit.pk, "name": fit.name} if fit else None,
            "quantity": t.quantity,
            "low": t.low_mark,
            "note": t.note,
            "have": c["have"],
            "on_market": c["orders"],
            "on_contract": c["contracts"],
            "cheapest_order": float(c["cheapest_order"]) if c["cheapest_order"] is not None else None,
            "cheapest_contract": float(c["cheapest_contract"]) if c["cheapest_contract"] is not None else None,
            "short": short,
            "claimed": claimed,
            "still_short": max(short - claimed, 0),
            "status": status_of(c["have"], t),
            "claims": [{"user": x.user.display_name, "user_id": x.user_id, "quantity": x.quantity,
                        "portrait": portrait_url(x.user.main_character_id, 64) if x.user.main_character_id else None,
                        "expires_at": x.expires_at.isoformat()} for x in cl],
            "my_claim": mine.quantity if mine else None,
            "order": t.order,
        })
    return [{"id": p.pk, "name": p.name, "label": p.label, "location_id": p.location_id, "system": systems.get(p.solar_system_id),
             "order": p.order, "targets": by_place.get(p.pk, [])} for p in places]


def summary(user=None) -> dict:
    """For the dashboard: how many targets are short, and the worst few."""
    rows = [{**t, "place": p["label"] or p["name"]} for p in board(user=user) for t in p["targets"]]
    short = [r for r in rows if r["status"] != "ok"]
    short.sort(key=lambda r: (r["status"] != "low", -(r["short"] / max(r["quantity"], 1))))
    return {"targets": len(rows), "short": len(short), "low": sum(1 for r in short if r["status"] == "low"),
            "worst": [{k: r[k] for k in ("id", "name", "icon", "place", "have", "quantity", "short", "claimed", "status")} for r in short[:5]]}


# --- the hourly check -------------------------------------------------------------------------------------------------


def check() -> dict:
    """Tell the managers once about each target that went below its low mark (again only after it recovered), drop
    claims that ran out, and claims on targets that are fully stocked."""
    now = timezone.now()
    expired, _ = Claim.objects.filter(expires_at__lte=now).delete()
    targets = list(Target.objects.select_related("place"))
    counts = count((t.place.location_id, t.type_id) for t in targets)
    names = dict(ItemType.objects.filter(pk__in={t.type_id for t in targets}).values_list("pk", "name"))
    went_low, done = [], []
    for t in targets:
        have = counts[(t.place.location_id, t.type_id)]["have"]
        if have >= t.quantity:
            done.append(t.pk)
        if have < t.low_mark and not t.alerted:
            went_low.append((t, have))
        elif have >= t.low_mark and t.alerted:
            Target.objects.filter(pk=t.pk).update(alerted=False)
    filled, _ = Claim.objects.filter(target_id__in=done).delete()
    if went_low:
        managers = users_with_perm(MANAGE_PERM)
        with transaction.atomic():
            for t, have in went_low:
                Target.objects.filter(pk=t.pk).update(alerted=True)
                name = names.get(t.type_id, f"Type {t.type_id}")
                place = str(t.place)
                notify(managers, f"{name} is running low at {place}", f"{have} for sale, {t.quantity} wanted", link="/p/stock",
                       level="warning", category="p.stock", data={"target_id": t.pk})
                bus.emit("stock.shortage", location=place, location_id=t.place.location_id, item=name, type_id=t.type_id,
                         have=have, want=t.quantity, link="/p/stock", level="warning",
                         title=f"{name} running low at {place}", summary=f"{have} for sale, {t.quantity} wanted")
    return {"alerts": len(went_low), "expired_claims": expired, "filled_claims": filled}
