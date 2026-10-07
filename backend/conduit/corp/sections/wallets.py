from django.db import transaction

from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.locations import resolve

from ..models import CorpJournalEntry, CorpTransaction, WalletDivision
from .common import dec, parse_dt


def sync(corporation, character, esi):
    cid = corporation.pk
    balances = esi.get(f"/corporations/{cid}/wallets", character=character).data
    party_ids, locations = set(), set()
    with transaction.atomic():
        for b in balances:
            WalletDivision.objects.update_or_create(corporation=corporation, division=b["division"], defaults={"balance": dec(b["balance"])})
    for b in balances:
        division = b["division"]
        journal = esi.get_all_pages(f"/corporations/{cid}/wallets/{division}/journal", character=character)
        transactions = esi.get(f"/corporations/{cid}/wallets/{division}/transactions", character=character).data or []
        CorpJournalEntry.objects.bulk_create(
            [
                CorpJournalEntry(
                    corporation=corporation, division=division, ref_id=j["id"], date=parse_dt(j["date"]), ref_type=j["ref_type"],
                    amount=dec(j.get("amount")), balance=dec(j.get("balance")), description=(j.get("description") or "")[:500],
                    reason=(j.get("reason") or "")[:500], first_party_id=j.get("first_party_id"),
                    second_party_id=j.get("second_party_id"), tax=dec(j.get("tax")),
                )
                for j in journal
            ],
            ignore_conflicts=True, batch_size=1000,
        )
        CorpTransaction.objects.bulk_create(
            [
                CorpTransaction(
                    corporation=corporation, division=division, transaction_id=t["transaction_id"], date=parse_dt(t["date"]),
                    type_id=t["type_id"], quantity=t["quantity"], unit_price=dec(t["unit_price"]), is_buy=t["is_buy"],
                    client_id=t["client_id"], location_id=t["location_id"], journal_ref_id=t.get("journal_ref_id"),
                )
                for t in transactions
            ],
            ignore_conflicts=True, batch_size=1000,
        )
        party_ids |= {j.get("first_party_id") for j in journal} | {j.get("second_party_id") for j in journal} | {t["client_id"] for t in transactions}
        locations |= {t["location_id"] for t in transactions}
    resolve(locations, character=character, client=esi)
    ensure_eve_names(party_ids)
