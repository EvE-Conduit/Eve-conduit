"""Contracts: every contract SeAT kept for the character, with its items. EVE only serves recent ones.

When the section has synced from EVE, only contracts Conduit doesn't have come over, so no status goes back to
SeAT's older one. Items are taken from SeAT for any contract still waiting for them.
"""

from conduit.esi.exceptions import EsiError
from conduit.sheet.contracts.models import Contract

from ..esi import drop_none, esi_dt, route
from . import HISTORY, section

section(
    "contracts", HISTORY, ["character_contracts", "contract_details", "contract_items"],
    indexes={"contract_details": ("contract_id",), "contract_items": ("contract_id",)},
    limits=[("conduit.sheet.contracts.sync", "ITEM_FETCH_LIMIT", 10**9)],
)


def _num(v):
    return None if v in (None, "") else float(v)


def _int(v):
    return None if v in (None, "") else int(v)


def _contract_ids(ctx) -> set[int]:
    return {int(r["contract_id"]) for r in ctx.store.rows("character_contracts", character_id=ctx.cid)}


@route("/characters/{cid}/contracts")
def contracts(ctx, params, cid):
    ids = _contract_ids(ctx)
    if ctx.synced:  # Conduit's copy of these is newer
        ids -= set(Contract.objects.filter(character_id=cid).values_list("contract_id", flat=True))
    out = []
    for r in ctx.store.rows_in("contract_details", "contract_id", sorted(ids)):
        out.append(drop_none({
            "contract_id": int(r["contract_id"]), "type": r["type"], "status": r["status"],
            "title": r["title"] or "", "availability": r["availability"],
            "for_corporation": bool(int(r["for_corporation"] or 0)),
            "issuer_id": int(r["issuer_id"]), "issuer_corporation_id": int(r["issuer_corporation_id"]),
            "assignee_id": int(r["assignee_id"]), "acceptor_id": int(r["acceptor_id"]),
            "price": _num(r["price"]), "reward": _num(r["reward"]), "collateral": _num(r["collateral"]),
            "buyout": _num(r["buyout"]), "volume": _num(r["volume"]), "days_to_complete": _int(r["days_to_complete"]),
            "start_location_id": _int(r["start_location_id"]), "end_location_id": _int(r["end_location_id"]),
            "date_issued": esi_dt(r["date_issued"]), "date_expired": esi_dt(r["date_expired"]),
            "date_accepted": esi_dt(r["date_accepted"]), "date_completed": esi_dt(r["date_completed"]),
        }))
    return out


@route("/characters/{cid}/contracts/{contract_id}/items")
def items(ctx, params, cid, contract_id):
    rows = ctx.store.rows("contract_items", order="record_id", contract_id=contract_id)
    if not rows and (ctx.synced or contract_id not in _contract_ids(ctx)):
        # Neither SeAT nor EVE has given the items yet: leave the contract waiting for a live sync.
        raise EsiError(503, "contract items not in the SeAT dump")
    return [
        drop_none({
            "record_id": int(i["record_id"]), "type_id": int(i["type_id"]), "quantity": int(i["quantity"]),
            "raw_quantity": _int(i["raw_quantity"]), "is_singleton": bool(int(i["is_singleton"] or 0)),
            "is_included": bool(int(i["is_included"] or 0)),
        })
        for i in rows
    ]
