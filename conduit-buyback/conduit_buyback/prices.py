"""Market prices at each hub in use, from Fuzzwork (free), Janice (with an API key) or ESI (see ``market``), kept
in ``ItemPrice``."""

from __future__ import annotations

import logging
from datetime import timedelta
from decimal import Decimal, InvalidOperation

import httpx
from django.utils import timezone

from conduit.db import upsert
from conduit.esi.client import user_agent

from .market import Hub, hubs_in_use, site_hub
from .models import BuybackSettings, ItemPrice, MarketRead

log = logging.getLogger(__name__)

FUZZWORK_URL = "https://market.fuzzwork.co.uk/aggregates/"
JANICE_URL = "https://janice.e-351.com/api/rest/v2/pricer"
JANICE_JITA = 2
BATCH = 200


class PriceError(Exception):
    pass


def _dec(value) -> Decimal:
    try:
        return Decimal(str(value or 0)).quantize(Decimal("0.01"))
    except InvalidOperation:
        return Decimal(0)


def hub_param(hub_id: int) -> str:
    """Fuzzwork takes a region, a system or a station."""
    if 10_000_000 <= hub_id < 20_000_000:
        return "region"
    if 30_000_000 <= hub_id < 40_000_000:
        return "system"
    return "station"


def _fuzzwork(type_ids: list[int], s: BuybackSettings, hub: Hub, client: httpx.Client) -> dict[int, tuple[Decimal, Decimal]]:
    out = {}
    for i in range(0, len(type_ids), BATCH):
        chunk = type_ids[i : i + BATCH]
        resp = client.get(FUZZWORK_URL, params={hub_param(hub.id): hub.id, "types": ",".join(map(str, chunk))})
        resp.raise_for_status()
        for key, row in resp.json().items():
            buy, sell = row.get("buy") or {}, row.get("sell") or {}
            if s.instant_prices:
                out[int(key)] = (_dec(buy.get("max")), _dec(sell.get("min")))
            else:
                out[int(key)] = (_dec(buy.get("percentile")), _dec(sell.get("percentile")))
    return out


def _janice(type_ids: list[int], s: BuybackSettings, hub: Hub, client: httpx.Client) -> dict[int, tuple[Decimal, Decimal]]:
    out = {}
    for i in range(0, len(type_ids), BATCH):
        chunk = type_ids[i : i + BATCH]
        resp = client.post(
            JANICE_URL,
            params={"market": JANICE_JITA},
            content="\n".join(map(str, chunk)),
            headers={"X-ApiKey": s.janice_api_key, "Content-Type": "text/plain", "Accept": "application/json"},
        )
        resp.raise_for_status()
        for row in resp.json():
            tid = (row.get("itemType") or {}).get("eid")
            prices = row.get("immediatePrices" if s.instant_prices else "top5AveragePrices") or {}
            if tid:
                out[int(tid)] = (_dec(prices.get("buyPrice")), _dec(prices.get("sellPrice")))
    return out


def fetch(type_ids, settings: BuybackSettings | None = None, client: httpx.Client | None = None, hub: Hub | None = None) -> int:
    """Fetch and store prices for the types at the hub (the site's by default). Types the source doesn't know are
    stored at 0, so they aren't asked for again until they are stale."""
    s = settings or BuybackSettings.load()
    hub = hub or site_hub(s)
    ids = sorted({int(t) for t in type_ids})
    if not ids:
        return 0
    if s.price_source == BuybackSettings.Source.ESI:
        raise PriceError("ESI prices are read for the whole market at once, not item by item")
    if s.price_source == BuybackSettings.Source.JANICE and not s.janice_api_key:
        raise PriceError("Janice needs an API key (Buyback settings)")
    own = client is None
    client = client or httpx.Client(timeout=30, headers={"User-Agent": user_agent()}, follow_redirects=True)
    try:
        found = (_janice if s.price_source == BuybackSettings.Source.JANICE else _fuzzwork)(ids, s, hub, client)
    except (httpx.HTTPError, ValueError) as exc:
        raise PriceError(f"Couldn't get prices from {s.get_price_source_display()}: {exc}") from exc
    finally:
        if own:
            client.close()
    now = timezone.now()
    zero = Decimal(0)
    upsert(
        ItemPrice,
        [ItemPrice(hub_id=hub.id, type_id=t, buy=found.get(t, (zero, zero))[0], sell=found.get(t, (zero, zero))[1], updated_at=now) for t in ids],
        unique_fields=["hub_id", "type_id"],
        update_fields=["buy", "sell", "updated_at"],
    )
    return len(ids)


def stale_before(settings: BuybackSettings | None = None):
    s = settings or BuybackSettings.load()
    return timezone.now() - timedelta(hours=max(s.price_max_age_hours, 1))


def get(type_ids, settings: BuybackSettings | None = None, hub: Hub | None = None) -> dict[int, ItemPrice]:
    """Prices for the types at the hub (the site's by default), fetching the ones missing or stale first. If the
    source is down, stale prices are used rather than none; types never priced are left out."""
    s = settings or BuybackSettings.load()
    hub = hub or site_hub(s)
    ids = {int(t) for t in type_ids}
    have = {p.type_id: p for p in ItemPrice.objects.filter(hub_id=hub.id, type_id__in=ids)}
    if s.price_source == BuybackSettings.Source.ESI:
        # Read in the background as a whole; before the first read there's nothing yet.
        if not MarketRead.objects.filter(hub_id=hub.id).exclude(pulled_at=None).exists():
            from .tasks import pull_market

            pull_market.delay()
        return have
    cutoff = stale_before(s)
    todo = [t for t in ids if t not in have or have[t].updated_at < cutoff]
    if todo:
        try:
            fetch(todo, s, hub=hub)
        except PriceError as exc:
            log.warning("%s", exc)
        else:
            have = {p.type_id: p for p in ItemPrice.objects.filter(hub_id=hub.id, type_id__in=ids)}
    return have


def refresh(stale_only: bool = True, limit: int = 5000) -> int:
    """Re-fetch stored prices at every hub in use: those older than the maximum age, or all of them."""
    s = BuybackSettings.load()
    if s.price_source == BuybackSettings.Source.ESI:
        return 0  # the market is read as a whole every half hour
    total = 0
    for hub in hubs_in_use(s):
        qs = ItemPrice.objects.filter(hub_id=hub.id)
        if stale_only:
            qs = qs.filter(updated_at__lt=stale_before(s))
        ids = list(qs.order_by("updated_at").values_list("type_id", flat=True)[: max(limit - total, 0)])
        total += fetch(ids, s, hub=hub) if ids else 0
    return total


def refresh_stale(limit: int = 5000) -> int:
    """Re-fetch stored prices that are older than the maximum age."""
    return refresh(True, limit)
