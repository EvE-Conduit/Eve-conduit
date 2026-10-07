from django.shortcuts import get_object_or_404
from ninja.pagination import paginate

from evecsm.eve.tasks import names_for
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.locations import describe
from evecsm.sheet.models import Location
from evecsm.sheet.util import prices_by_type, type_out, types_by_id

from .models import Contract

OPEN = ("outstanding", "in_progress")


def _f(v):
    return float(v) if v is not None else None


def _rows(contracts, character_id):
    names = names_for({c.issuer_id for c in contracts} | {c.assignee_id for c in contracts} | {c.acceptor_id for c in contracts})
    locs = {loc.id: loc for loc in Location.objects.filter(pk__in={c.start_location_id for c in contracts} | {c.end_location_id for c in contracts})}
    out = []
    for c in contracts:
        out.append(
            {
                "contract_id": c.contract_id,
                "type": c.type,
                "status": c.status,
                "title": c.title,
                "availability": c.availability,
                "direction": "issued" if c.issuer_id == character_id else "received",
                "issuer": names.get(c.issuer_id, str(c.issuer_id)),
                "assignee": names.get(c.assignee_id) if c.assignee_id else None,
                "acceptor": names.get(c.acceptor_id) if c.acceptor_id else None,
                "price": _f(c.price),
                "reward": _f(c.reward),
                "collateral": _f(c.collateral),
                "buyout": _f(c.buyout),
                "volume": c.volume,
                "start": describe(locs.get(c.start_location_id)),
                "end": describe(locs.get(c.end_location_id)),
                "date_issued": c.date_issued.isoformat(),
                "date_expired": c.date_expired.isoformat(),
                "date_completed": c.date_completed.isoformat() if c.date_completed else None,
            }
        )
    return out


@router.get("/{character_id}/contracts", response=list[dict])
@paginate
def contracts(request, character_id: int, state: str = "open", type: str = ""):
    character = viewable_character(request, character_id)
    qs = Contract.objects.filter(character=character)
    qs = qs.filter(status__in=OPEN) if state == "open" else qs.exclude(status__in=OPEN)
    if type:
        qs = qs.filter(type=type)
    return _rows(list(qs[:2000]), character.pk)


@router.get("/{character_id}/contracts/{contract_id}")
def contract_detail(request, character_id: int, contract_id: int):
    character = viewable_character(request, character_id)
    contract = get_object_or_404(Contract, character=character, contract_id=contract_id)
    items = list(contract.items.all())
    types = types_by_id({i.type_id for i in items})
    prices = prices_by_type({i.type_id for i in items})
    return {
        **_rows([contract], character.pk)[0],
        "items_loaded": contract.items_fetched,
        "items": [
            {
                "type": type_out(i.type_id, types, copy=i.raw_quantity == -2),
                "quantity": i.quantity,
                "included": i.is_included,
                "bpc": i.raw_quantity == -2,
                "value": 0 if i.raw_quantity == -2 else prices.get(i.type_id, 0) * i.quantity,
            }
            for i in items
        ],
    }
