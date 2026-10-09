"""Wallet: the whole journal and transaction history SeAT kept. EVE only serves the last 30 days."""

from conduit.sheet.wallet.models import WalletBalance

from ..esi import drop_none, esi_dt, route
from . import HISTORY, section

section("wallet", HISTORY, ["character_wallet_balances", "character_wallet_journals", "character_wallet_transactions"])


@route("/characters/{cid}/wallet")
def balance(ctx, params, cid):
    if ctx.synced:  # never put an older balance over the one EVE gave
        current = WalletBalance.objects.filter(character_id=cid).values_list("balance", flat=True).first()
        if current is not None:
            return float(current)
    row = ctx.store.one("character_wallet_balances", character_id=cid)
    return row["balance"] if row else 0


@route("/characters/{cid}/wallet/journal")
def journal(ctx, params, cid):
    return [
        drop_none({
            "id": r["id"], "date": esi_dt(r["date"]), "ref_type": r["ref_type"], "amount": r["amount"],
            "balance": r["balance"], "description": r["description"] or "", "reason": r["reason"],
            "first_party_id": r["first_party_id"], "second_party_id": r["second_party_id"],
            "context_id": r["context_id"], "context_id_type": r["context_id_type"], "tax": r["tax"],
            "tax_receiver_id": r["tax_receiver_id"],
        })
        for r in ctx.store.rows("character_wallet_journals", character_id=cid)
    ]


@route("/characters/{cid}/wallet/transactions")
def transactions(ctx, params, cid):
    return [
        {
            "transaction_id": r["transaction_id"], "date": esi_dt(r["date"]), "type_id": r["type_id"],
            "quantity": r["quantity"], "unit_price": r["unit_price"], "is_buy": bool(r["is_buy"]),
            "is_personal": bool(r["is_personal"]), "client_id": r["client_id"], "location_id": r["location_id"],
            "journal_ref_id": r["journal_ref_id"],
        }
        for r in ctx.store.rows("character_wallet_transactions", character_id=cid)
    ]
