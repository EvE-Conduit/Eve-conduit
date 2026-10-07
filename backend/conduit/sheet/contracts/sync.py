from decimal import Decimal

from django.db import transaction

from conduit.esi.exceptions import EsiError
from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.locations import resolve
from conduit.sheet.util import parse_dt
from conduit.db import upsert

from .models import Contract, ContractItem

FIELDS = ["status", "acceptor_id", "date_accepted", "date_completed", "date_expired", "price", "reward", "buyout"]
#: New contracts whose items we fetch per sync; the rest follow on later syncs.
ITEM_FETCH_LIMIT = 40


def _dec(v):
    return Decimal(str(v)) if v is not None else None


def sync(character, esi):
    cid = character.pk
    rows = esi.get_all_pages(f"/characters/{cid}/contracts", character=character)
    with transaction.atomic():
        upsert(
            Contract,
            [
                Contract(
                    character=character,
                    contract_id=r["contract_id"],
                    type=r["type"],
                    status=r["status"],
                    title=(r.get("title") or "")[:200],
                    availability=r["availability"],
                    for_corporation=r.get("for_corporation", False),
                    issuer_id=r["issuer_id"],
                    issuer_corporation_id=r["issuer_corporation_id"],
                    assignee_id=r["assignee_id"],
                    acceptor_id=r["acceptor_id"],
                    price=_dec(r.get("price")),
                    reward=_dec(r.get("reward")),
                    collateral=_dec(r.get("collateral")),
                    buyout=_dec(r.get("buyout")),
                    volume=r.get("volume"),
                    days_to_complete=r.get("days_to_complete"),
                    start_location_id=r.get("start_location_id"),
                    end_location_id=r.get("end_location_id"),
                    date_issued=parse_dt(r["date_issued"]),
                    date_expired=parse_dt(r["date_expired"]),
                    date_accepted=parse_dt(r.get("date_accepted")),
                    date_completed=parse_dt(r.get("date_completed")),
                )
                for r in rows
            ],
            unique_fields=["character", "contract_id"],
            update_fields=FIELDS,
        )

    # Contents never change, so fetch them once. Courier contracts have none worth listing.
    pending = Contract.objects.filter(character=character, items_fetched=False).exclude(type="courier")[:ITEM_FETCH_LIMIT]
    for contract in pending:
        try:
            items = esi.get(f"/characters/{cid}/contracts/{contract.contract_id}/items", character=character).data
        except EsiError as exc:
            if exc.status != 404:  # 404: too old for ESI to list; stop asking
                continue
            items = []
        with transaction.atomic():
            ContractItem.objects.filter(contract=contract).delete()
            ContractItem.objects.bulk_create(
                ContractItem(
                    contract=contract,
                    record_id=i["record_id"],
                    type_id=i["type_id"],
                    quantity=i["quantity"],
                    is_included=i["is_included"],
                    is_singleton=i["is_singleton"],
                    raw_quantity=i.get("raw_quantity"),
                )
                for i in items
            )
            contract.items_fetched = True
            contract.save(update_fields=["items_fetched"])
    Contract.objects.filter(character=character, type="courier").update(items_fetched=True)

    ensure_eve_names({r["issuer_id"] for r in rows} | {r["assignee_id"] for r in rows} | {r["acceptor_id"] for r in rows})
    resolve({r.get("start_location_id") for r in rows} | {r.get("end_location_id") for r in rows}, character=character, client=esi)
