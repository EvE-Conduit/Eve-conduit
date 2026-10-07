from decimal import Decimal

from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names
from evecsm.sheet.locations import resolve
from evecsm.sheet.util import parse_dt

from .models import JournalEntry, WalletBalance, WalletTransaction


def _dec(value):
    return None if value is None else Decimal(str(value))


def sync(character, esi):
    cid = character.pk
    balance = esi.get(f"/characters/{cid}/wallet", character=character).data
    journal = esi.get_all_pages(f"/characters/{cid}/wallet/journal", character=character)
    transactions = esi.get(f"/characters/{cid}/wallet/transactions", character=character).data

    with transaction.atomic():
        WalletBalance.objects.update_or_create(character=character, defaults={"balance": _dec(balance)})
        # ESI only returns the last 30 days; older rows we already have are kept.
        JournalEntry.objects.bulk_create(
            [
                JournalEntry(
                    character=character,
                    ref_id=j["id"],
                    date=parse_dt(j["date"]),
                    ref_type=j["ref_type"],
                    amount=_dec(j.get("amount")),
                    balance=_dec(j.get("balance")),
                    description=j.get("description", "")[:500],
                    reason=(j.get("reason") or "")[:500],
                    first_party_id=j.get("first_party_id"),
                    second_party_id=j.get("second_party_id"),
                    context_id=j.get("context_id"),
                    context_id_type=j.get("context_id_type") or "",
                    tax=_dec(j.get("tax")),
                )
                for j in journal
            ],
            ignore_conflicts=True,
        )
        WalletTransaction.objects.bulk_create(
            [
                WalletTransaction(
                    character=character,
                    transaction_id=t["transaction_id"],
                    date=parse_dt(t["date"]),
                    type_id=t["type_id"],
                    quantity=t["quantity"],
                    unit_price=_dec(t["unit_price"]),
                    is_buy=t["is_buy"],
                    is_personal=t.get("is_personal", True),
                    client_id=t["client_id"],
                    location_id=t["location_id"],
                    journal_ref_id=t.get("journal_ref_id"),
                )
                for t in transactions
            ],
            ignore_conflicts=True,
        )
    resolve({t["location_id"] for t in transactions}, character=character, client=esi)
    ensure_eve_names(
        {j.get("first_party_id") for j in journal} | {j.get("second_party_id") for j in journal} | {t["client_id"] for t in transactions}
    )
