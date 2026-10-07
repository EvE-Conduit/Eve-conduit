from decimal import Decimal

from django.db import transaction

from evecsm.sheet.locations import resolve
from evecsm.sheet.util import parse_dt
from evecsm.db import upsert

from .models import MarketOrder

FIELDS = ["price", "volume_remain", "escrow", "state", "issued", "duration", "min_volume"]


def _order(character, r, state):
    return MarketOrder(
        character=character,
        order_id=r["order_id"],
        type_id=r["type_id"],
        is_buy=r.get("is_buy_order", False),
        is_corporation=r.get("is_corporation", False),
        price=Decimal(str(r["price"])),
        volume_total=r["volume_total"],
        volume_remain=r["volume_remain"],
        min_volume=r.get("min_volume"),
        escrow=Decimal(str(r["escrow"])) if r.get("escrow") is not None else None,
        issued=parse_dt(r["issued"]),
        duration=r["duration"],
        location_id=r["location_id"],
        region_id=r["region_id"],
        range=r["range"],
        state=state,
    )


def sync(character, esi):
    cid = character.pk
    open_rows = esi.get(f"/characters/{cid}/orders", character=character).data
    history = esi.get_all_pages(f"/characters/{cid}/orders/history", character=character)
    open_ids = {r["order_id"] for r in open_rows}
    with transaction.atomic():
        orders = [_order(character, r, MarketOrder.State.OPEN) for r in open_rows]
        orders += [_order(character, r, r["state"]) for r in history if r["order_id"] not in open_ids]
        upsert(MarketOrder, orders, unique_fields=["character", "order_id"], update_fields=FIELDS, batch_size=2000)
        # Orders that left the open list without showing up in history were filled.
        MarketOrder.objects.filter(character=character, state=MarketOrder.State.OPEN).exclude(order_id__in=open_ids).update(
            state=MarketOrder.State.CLOSED, volume_remain=0
        )
    resolve({r["location_id"] for r in open_rows}, character=character, client=esi)
