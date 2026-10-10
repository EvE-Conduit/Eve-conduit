"""Prices straight from ESI, and the manipulation guard.

ESI has no "price of these items" call. Like Fuzzwork and Janice, the ESI source reads the hub's whole order book
in the background (``/markets/{region}/orders``, a few hundred pages for The Forge; or a player structure's market),
keeps the hub's orders, and stores each item's prices. Quotes then only read stored prices.

The guard compares each price with what the item actually traded for recently in the hub's region
(``/markets/{region}/history``, daily averages and volumes).
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone

from conduit.db import upsert
from conduit.esi.exceptions import EsiError

from .models import BuybackSettings, ItemPrice, PriceHistory

log = logging.getLogger(__name__)

THE_FORGE = 10000002
STRUCTURE_SCOPE = "esi-markets.structure_markets.v1"
TOP_SHARE = Decimal("0.05")
PULL_LOCK = "buyback:market-pull"
#: Pages aren't cached (that would hold a region's whole order book for a day), so never read them again before
#: ESI's copy has changed; ESI refreshes market orders every 5 minutes.
MIN_PULL_GAP = timedelta(minutes=10)
HISTORY_DAYS = 30
#: History fetched while a quote waits; the rest is fetched in the background.
HISTORY_INLINE = 60
CENT = Decimal("0.01")


#: The main trade hubs: (station id, short name, full name, region).
HUBS = (
    (60003760, "Jita 4-4", "Jita IV - Moon 4 - Caldari Navy Assembly Plant", "The Forge"),
    (60008494, "Amarr VIII", "Amarr VIII (Oris) - Emperor Family Academy", "Domain"),
    (60011866, "Dodixie IX-20", "Dodixie IX - Moon 20 - Federation Navy Assembly Plant", "Sinq Laison"),
    (60004588, "Rens VI-8", "Rens VI - Moon 8 - Brutor Tribe Treasury", "Heimatar"),
    (60005686, "Hek VIII-12", "Hek VIII - Moon 12 - Boundless Creation Factory", "Metropolis"),
)


class MarketError(Exception):
    pass


def search_hubs(q: str, limit: int = 15) -> list[dict]:
    """Markets to price against: regions, systems, and stations or structures the site knows the names of."""
    from conduit.sde.models import Region, SolarSystem
    from conduit.sheet.models import Location as Place

    q = q.strip()
    if len(q) < 2:
        return []
    out = [{"id": r.pk, "name": r.name, "subtitle": "Region: every order in it"} for r in Region.objects.filter(name__istartswith=q).order_by("name")[:5]]
    out += [{"id": s.pk, "name": s.name, "subtitle": f"System in {s.region.name}"}
            for s in SolarSystem.objects.filter(name__istartswith=q).select_related("region").order_by("name")[:5]]
    if len(q) >= 3:
        out += [{"id": p.pk, "name": p.name, "subtitle": "Player structure (ESI only)" if p.kind == "structure" else "Station"}
                for p in Place.objects.filter(kind__in=["station", "structure"], resolved=True, name__icontains=q).order_by("name")[:limit]]
    return out[:limit]


# --- where the hub is ---------------------------------------------------------------------------------------------


def hub_kind(hub_id: int) -> str:
    if 10_000_000 <= hub_id < 20_000_000:
        return "region"
    if 30_000_000 <= hub_id < 40_000_000:
        return "system"
    if 60_000_000 <= hub_id < 70_000_000:
        return "station"
    return "structure"


def hub_region(s: BuybackSettings) -> int | None:
    """The region the hub is in: where its orders are read and its history is measured."""
    if s.price_source == BuybackSettings.Source.JANICE:
        return THE_FORGE  # Janice prices Jita 4-4
    from conduit.sde.models import SolarSystem, Station

    kind, hub = hub_kind(s.hub_id), s.hub_id
    if kind == "region":
        return hub
    if kind == "system":
        return SolarSystem.objects.filter(pk=hub).values_list("region_id", flat=True).first()
    if kind == "station":
        system = Station.objects.filter(pk=hub).values_list("solar_system_id", flat=True).first()
    else:
        from conduit.corp.models import Structure
        from conduit.sheet.models import Location

        system = Location.objects.filter(pk=hub).values_list("solar_system_id", flat=True).first() or (
            Structure.objects.filter(structure_id=hub).values_list("system_id", flat=True).first()
        )
    return SolarSystem.objects.filter(pk=system).values_list("region_id", flat=True).first() if system else None


# --- reading the order book -------------------------------------------------------------------------------------


def top_average(orders: list[tuple[Decimal, int]], highest_first: bool) -> Decimal:
    """Volume-weighted average of the best 5% of the volume: what a sizeable sale really fetches, and hard to move
    with one order."""
    if not orders:
        return Decimal(0)
    orders = sorted(orders, key=lambda o: o[0], reverse=highest_first)
    total = sum(v for _, v in orders)
    want = max(Decimal(total) * TOP_SHARE, Decimal(1))
    taken, value = Decimal(0), Decimal(0)
    for price, volume in orders:
        use = min(Decimal(volume), want - taken)
        value += price * use
        taken += use
        if taken >= want:
            break
    return value / taken


def aggregate(orders: dict[int, dict[str, list]], instant: bool) -> dict[int, tuple[Decimal, Decimal]]:
    """``{type_id: (buy, sell)}`` from ``{type_id: {"buy": [(price, volume)], "sell": [...]}}``."""
    out = {}
    for type_id, book in orders.items():
        buys, sells = book["buy"], book["sell"]
        if instant:
            buy = max((p for p, _ in buys), default=Decimal(0))
            sell = min((p for p, _ in sells), default=Decimal(0))
        else:
            buy, sell = top_average(buys, True), top_average(sells, False)
        out[type_id] = (buy.quantize(CENT), sell.quantize(CENT))
    return out


def _source(s: BuybackSettings) -> tuple[str, dict, object, callable]:
    """ESI route, query, login and which orders count."""
    kind = hub_kind(s.hub_id)
    if kind == "structure":
        c = s.esi_character
        if c is None:
            raise MarketError("Pick a character that can see the structure's market")
        token = getattr(c, "token", None)
        if not (token and token.has_scopes(STRUCTURE_SCOPE)):
            raise MarketError(f"{c.name}'s login can't read structure markets; they need to log in again")
        return f"/markets/structures/{s.hub_id}", {}, c, lambda o: True
    region = hub_region(s)
    if region is None:
        raise MarketError(f"Unknown market {s.hub_id}: use a station, system or region id")
    if kind == "station":
        return f"/markets/{region}/orders", {"order_type": "all"}, None, lambda o: o.get("location_id") == s.hub_id
    if kind == "system":
        return f"/markets/{region}/orders", {"order_type": "all"}, None, lambda o: o.get("system_id") == s.hub_id
    return f"/markets/{region}/orders", {"order_type": "all"}, None, lambda o: True


def pull(settings: BuybackSettings | None = None, client=None) -> int:
    """Read the hub's whole order book and store every item's prices. Items no longer on sale drop to 0."""
    from conduit.esi.client import esi

    s = settings or BuybackSettings.load()
    client = client or esi()
    path, params, character, wanted = _source(s)
    books: dict[int, dict[str, list]] = defaultdict(lambda: {"buy": [], "sell": []})
    page, pages = 1, 1
    while page <= pages:
        resp = client.get(path, character=character, params={**params, "page": page} if page > 1 else (params or None), cache_response=False)
        pages = resp.pages
        for o in resp.data or ():
            if wanted(o):
                books[o["type_id"]]["buy" if o.get("is_buy_order") else "sell"].append((Decimal(str(o["price"])), int(o["volume_remain"])))
        page += 1
    prices = aggregate(books, s.instant_prices)
    now = timezone.now()
    upsert(ItemPrice, [ItemPrice(type_id=t, buy=b, sell=sl, updated_at=now) for t, (b, sl) in prices.items()],
           unique_fields=["type_id"], update_fields=["buy", "sell", "updated_at"], batch_size=2000)
    ItemPrice.objects.exclude(type_id__in=list(prices)).update(buy=0, sell=0, updated_at=now)
    s.market_pulled_at = now
    s.market_note = f"{len(prices):,} items from {pages} page{'s' if pages != 1 else ''}"
    s.save(update_fields=["market_pulled_at", "market_note"])
    return len(prices)


def pull_once(client=None) -> int | None:
    """``pull`` unless one is already running (they take a minute or two)."""
    s = BuybackSettings.load()
    if s.price_source != BuybackSettings.Source.ESI:
        return None
    if s.market_pulled_at and timezone.now() - s.market_pulled_at < MIN_PULL_GAP:
        return None
    if not cache.add(PULL_LOCK, 1, timeout=30 * 60):
        return None
    try:
        return pull(s, client)
    except (MarketError, EsiError) as exc:
        BuybackSettings.objects.filter(pk=s.pk).update(market_note=f"Last read failed: {exc}"[:300])
        log.warning("Couldn't read the market: %s", exc)
        return None
    finally:
        cache.delete(PULL_LOCK)


# --- history and the guard ------------------------------------------------------------------------------------------


def fetch_history(type_ids, region_id: int, client=None) -> int:
    from conduit.esi.client import esi

    client = client or esi()
    cutoff = (timezone.now() - timedelta(days=HISTORY_DAYS)).date().isoformat()
    rows, now = [], timezone.now()
    for type_id in type_ids:
        try:
            data = client.get(f"/markets/{region_id}/history", params={"type_id": type_id}).data or []
        except EsiError as exc:
            if exc.status not in (400, 404):  # 400/404: not a market item; stored as never traded
                raise
            data = []
        days = [[d["date"], d["average"], d["volume"]] for d in data if d.get("date", "") >= cutoff]
        rows.append(PriceHistory(type_id=type_id, region_id=region_id, days=sorted(days), updated_at=now))
    upsert(PriceHistory, rows, unique_fields=["type_id"], update_fields=["region_id", "days", "updated_at"])
    return len(rows)


def histories(type_ids, s: BuybackSettings) -> dict[int, PriceHistory]:
    """History for the types, fetching up to ``HISTORY_INLINE`` missing or stale ones now and the rest in the
    background. Empty when the guard is off or the hub's region is unknown."""
    if not s.guard_enabled:
        return {}
    region = hub_region(s)
    if region is None:
        return {}
    ids = {int(t) for t in type_ids}
    stale = timezone.now() - timedelta(hours=20)
    have = {h.type_id: h for h in PriceHistory.objects.filter(type_id__in=ids, region_id=region)}
    todo = sorted(t for t in ids if t not in have or have[t].updated_at < stale)
    if todo:
        now_ids, later = todo[:HISTORY_INLINE], todo[HISTORY_INLINE:]
        try:
            fetch_history(now_ids, region)
        except Exception as exc:  # the guard is a safety net: quote without it rather than not at all
            log.warning("Couldn't read market history: %s", exc)
        else:
            have.update({h.type_id: h for h in PriceHistory.objects.filter(type_id__in=now_ids, region_id=region)})
        if later:
            from .tasks import fetch_history_later

            fetch_history_later.delay(later, region)
    return have


@dataclass
class Check:
    current: Decimal
    average: Decimal | None
    days_traded: int
    reliable: bool
    #: "current", "average" or "lower" (and checked by hand).
    used: str
    price: Decimal

    @property
    def deviation(self) -> float | None:
        return float((self.current - self.average) / self.average * 100) if self.average else None

    def out(self) -> dict:
        return {"current": float(self.current), "average": float(self.average) if self.average is not None else None,
                "deviation": round(self.deviation, 1) if self.deviation is not None else None, "days_traded": self.days_traded,
                "reliable": self.reliable, "used": self.used}


def average(h: PriceHistory | None, days: int, today: date | None = None) -> tuple[Decimal | None, int]:
    """Volume-weighted average price over the last ``days`` days, and on how many of them it traded."""
    if h is None:
        return None, 0
    since = ((today or timezone.now().date()) - timedelta(days=days)).isoformat()
    window = [(Decimal(str(a)), int(v)) for d, a, v in h.days if d >= since and v]
    volume = sum(v for _, v in window)
    if not volume:
        return None, 0
    return (sum(a * v for a, v in window) / volume).quantize(CENT), len(window)


def check(current: Decimal, h: PriceHistory | None, s: BuybackSettings) -> Check:
    """The price to use: the current one unless it's far off what the item traded for."""
    avg, traded = average(h, s.guard_days)
    reliable = avg is not None and traded >= s.guard_min_days
    if avg is None or current <= 0:
        return Check(current, avg, traded, reliable, "current", current)
    limit = s.guard_threshold / 100
    too_high = current > avg * (1 + limit)
    too_low = s.guard_both_ways and current < avg * (1 - limit)
    if not (too_high or too_low):
        return Check(current, avg, traded, reliable, "current", current)
    if reliable:
        return Check(current, avg, traded, reliable, "average", avg)
    return Check(current, avg, traded, reliable, "lower", min(current, avg))
