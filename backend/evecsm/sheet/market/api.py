from ninja.pagination import paginate

from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.locations import describe
from evecsm.sheet.models import Location
from evecsm.sheet.util import type_out, types_by_id

from .models import MarketOrder


def _rows(orders):
    types = types_by_id({o.type_id for o in orders})
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in={o.location_id for o in orders})}
    return [
        {
            "order_id": o.order_id,
            "type": type_out(o.type_id, types),
            "is_buy": o.is_buy,
            "price": float(o.price),
            "volume_total": o.volume_total,
            "volume_remain": o.volume_remain,
            "escrow": float(o.escrow) if o.escrow is not None else None,
            "issued": o.issued.isoformat(),
            "duration": o.duration,
            "range": o.range,
            "state": o.state,
            "location": describe(locations.get(o.location_id)),
        }
        for o in orders
    ]


@router.get("/{character_id}/market")
def market(request, character_id: int):
    character = viewable_character(request, character_id)
    orders = list(MarketOrder.objects.filter(character=character, state=MarketOrder.State.OPEN))
    rows = _rows(orders)
    return {
        "sell": [r for r in rows if not r["is_buy"]],
        "buy": [r for r in rows if r["is_buy"]],
        "sell_value": sum(float(o.price) * o.volume_remain for o in orders if not o.is_buy),
        "buy_value": sum(float(o.price) * o.volume_remain for o in orders if o.is_buy),
        "escrow": sum(float(o.escrow or 0) for o in orders if o.is_buy),
    }


@router.get("/{character_id}/market/history", response=list[dict])
@paginate
def market_history(request, character_id: int):
    character = viewable_character(request, character_id)
    return _rows(list(MarketOrder.objects.filter(character=character).exclude(state=MarketOrder.State.OPEN)[:2000]))
