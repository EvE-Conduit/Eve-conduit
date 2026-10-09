"""Market orders: every order SeAT kept. EVE's order history only goes back 90 days.

SeAT keeps open and closed orders in one table, with state active, cancelled or expired. The sync treats the open
list as current state (open orders missing from it get closed), so:

* Synced from EVE: the open list is Conduit's own open orders, untouched; history adds only orders Conduit
  doesn't have. A SeAT "active" order Conduit doesn't know is long gone from EVE, so it comes over closed.
* Never synced: SeAT's active orders are open, unless their duration has run out (then they come over expired).
"""

from datetime import datetime, timedelta, timezone

from conduit.sheet.market.models import MarketOrder
from conduit.sheet.util import parse_dt

from ..esi import drop_none, esi_dt, route
from . import HISTORY, section

section("market", HISTORY, ["character_orders"])


def _int(v):
    return None if v in (None, "") else int(v)


def _esi(r) -> dict:
    return drop_none({
        "order_id": int(r["order_id"]), "type_id": int(r["type_id"]), "region_id": int(r["region_id"]),
        "location_id": int(r["location_id"]), "range": r["range"],
        "is_buy_order": bool(int(r["is_buy_order"] or 0)), "price": float(r["price"]),
        "volume_total": int(r["volume_total"]), "volume_remain": int(r["volume_remain"]),
        "issued": esi_dt(r["issued"]), "min_volume": _int(r["min_volume"]), "duration": int(r["duration"]),
        "is_corporation": bool(int(r["is_corporation"] or 0)),
        "escrow": None if r["escrow"] in (None, "") else float(r["escrow"]),
    })


def _ran_out(order: dict) -> bool:
    issued = parse_dt(order["issued"])
    return issued + timedelta(days=order["duration"]) < datetime.now(timezone.utc)


def _seat_open(ctx) -> list[dict]:
    return [_esi(r) for r in ctx.store.rows("character_orders", character_id=ctx.cid) if r["state"] == "active"]


@route("/characters/{cid}/orders")
def open_orders(ctx, params, cid):
    if ctx.synced:
        return [
            drop_none({
                "order_id": o.order_id, "type_id": o.type_id, "region_id": o.region_id, "location_id": o.location_id,
                "range": o.range, "is_buy_order": o.is_buy, "price": float(o.price), "volume_total": o.volume_total,
                "volume_remain": o.volume_remain, "issued": o.issued.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "min_volume": o.min_volume, "duration": o.duration, "is_corporation": o.is_corporation,
                "escrow": None if o.escrow is None else float(o.escrow),
            })
            for o in MarketOrder.objects.filter(character_id=cid, state=MarketOrder.State.OPEN)
        ]
    return [o for o in _seat_open(ctx) if not _ran_out(o)]


@route("/characters/{cid}/orders/history")
def history(ctx, params, cid):
    have = set()
    if ctx.synced:
        have = set(MarketOrder.objects.filter(character_id=cid).values_list("order_id", flat=True))
    out = []
    for r in ctx.store.rows("character_orders", character_id=cid):
        if int(r["order_id"]) in have:
            continue
        order = _esi(r)
        if r["state"] == "active":
            if not _ran_out(order):
                if not ctx.synced:
                    continue  # still open: it's in the open list
                order["state"] = MarketOrder.State.CLOSED
            else:
                order["state"] = MarketOrder.State.EXPIRED
        else:
            order["state"] = r["state"]
        out.append(order)
    return out
