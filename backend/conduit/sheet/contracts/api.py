from django.db.models import Q
from django.shortcuts import get_object_or_404
from ninja.pagination import paginate

from conduit.eve.tasks import names_for
from conduit.sde.models import ItemType
from conduit.sheet.api import router, viewable_character
from conduit.sheet.locations import describe
from conduit.sheet.models import Location
from conduit.sheet.util import prices_by_type, type_out, types_by_id

from .models import Contract, ContractItem

OPEN = ("outstanding", "in_progress")


def _f(v):
    return float(v) if v is not None else None


def _matching_items(contracts, type_ids) -> dict[int, list[dict]]:
    """For a search: the searched-for items each contract holds, {contract pk: [{name, quantity}]}."""
    rows = ContractItem.objects.filter(contract__in=contracts, type_id__in=type_ids).values_list("contract_id", "type_id", "quantity")
    names = dict(ItemType.objects.filter(pk__in={t for _, t, _ in rows}).values_list("id", "name"))
    out: dict[int, list[dict]] = {}
    for contract_pk, type_id, quantity in rows:
        out.setdefault(contract_pk, []).append({"name": names.get(type_id, str(type_id)), "quantity": quantity})
    return out


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
def contracts(request, character_id: int, state: str = "open", type: str = "", q: str = ""):
    """``q`` finds contracts by title or by the items in them (any part of the item name)."""
    character = viewable_character(request, character_id)
    qs = Contract.objects.filter(character=character)
    qs = qs.filter(status__in=OPEN) if state == "open" else qs.exclude(status__in=OPEN)
    if type:
        qs = qs.filter(type=type)
    q = q.strip()[:100]
    if not q:
        return _rows(list(qs[:2000]), character.pk)
    type_ids = list(ItemType.objects.filter(name__icontains=q).values_list("id", flat=True)[:5000])
    contracts = list(qs.filter(Q(title__icontains=q) | Q(items__type_id__in=type_ids)).distinct()[:2000])
    matches = _matching_items(contracts, type_ids)
    return [row | {"matches": matches.get(c.pk, [])} for c, row in zip(contracts, _rows(contracts, character.pk), strict=True)]


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
