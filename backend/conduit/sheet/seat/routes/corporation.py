"""Corporation sheet sections: the history SeAT kept for each corporation. EVE only serves the last 30 days of a
corporation's wallets and mining, 90 days of orders and recent contracts, jobs and killmails, so SeAT's copy is
the only one of the rest.

Each runs the corporation section's normal sync against the dump, like the character sections. When the section
has synced from EVE, only what Conduit doesn't have comes over, so nothing goes back to SeAT's older copy.

Current state (members, structures, assets, starbases, division names) isn't imported: a corporation is only
imported while it still has members here, and their next live sync gives EVE's own, newer copy.
"""

from datetime import date, timezone

from conduit.corp.models import CorpContract, CorpIndustryJob, CorpMarketOrder, MiningObservation, WalletDivision
from conduit.esi.exceptions import EsiError

from ..esi import SeatEsi, drop_none, esi_dt, route
from . import HISTORY, corp_section
from .contracts import contract_json
from .market import _ran_out

KILLMAIL_TABLES = ("killmails", "killmail_details", "killmail_victims", "killmail_attackers", "killmail_victim_items")


def _int(v):
    return None if v in (None, "") else int(v)


def _num(v):
    return None if v in (None, "") else float(v)


def _iso(dt) -> str | None:
    return None if dt is None else dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --- wallets --------------------------------------------------------------------------------------------------

corp_section("wallets", HISTORY,
             ["corporation_wallet_balances", "corporation_wallet_journals", "corporation_wallet_transactions"],
             indexes={"corporation_wallet_journals": ("division",), "corporation_wallet_transactions": ("division",)})


@route("/corporations/{cid}/wallets")
def wallets(ctx, params, cid):
    seat = {int(r["division"]): float(r["balance"] or 0)
            for r in ctx.store.rows("corporation_wallet_balances", corporation_id=cid)}
    if ctx.synced:  # never put an older balance over the one EVE gave
        seat.update({d.division: float(d.balance) for d in WalletDivision.objects.filter(corporation_id=cid)})
    for table in ("corporation_wallet_journals", "corporation_wallet_transactions"):
        for division in ctx.store.distinct(table, "division", corporation_id=cid):
            seat.setdefault(int(division), 0.0)  # history for a division SeAT had no balance for
    return [{"division": d, "balance": b} for d, b in sorted(seat.items())]


@route("/corporations/{cid}/wallets/{division}/journal")
def journal(ctx, params, cid, division):
    return [
        drop_none({
            "id": int(r["id"]), "date": esi_dt(r["date"]), "ref_type": r["ref_type"], "amount": _num(r["amount"]),
            "balance": _num(r["balance"]), "description": r["description"] or "", "reason": r["reason"],
            "first_party_id": _int(r["first_party_id"]), "second_party_id": _int(r["second_party_id"]),
            "context_id": _int(r["context_id"]), "context_id_type": r["context_id_type"], "tax": _num(r["tax"]),
            "tax_receiver_id": _int(r["tax_receiver_id"]),
        })
        for r in ctx.store.iter_rows("corporation_wallet_journals", corporation_id=cid, division=division)
    ]


@route("/corporations/{cid}/wallets/{division}/transactions")
def transactions(ctx, params, cid, division):
    return [
        {
            "transaction_id": int(r["transaction_id"]), "date": esi_dt(r["date"]), "type_id": int(r["type_id"]),
            "quantity": int(r["quantity"]), "unit_price": float(r["unit_price"]), "is_buy": bool(int(r["is_buy"] or 0)),
            "client_id": int(r["client_id"]), "location_id": int(r["location_id"]),
            "journal_ref_id": _int(r["journal_ref_id"]),
        }
        for r in ctx.store.iter_rows("corporation_wallet_transactions", corporation_id=cid, division=division)
    ]


# --- contracts ------------------------------------------------------------------------------------------------

corp_section("contracts", HISTORY, ["corporation_contracts", "contract_details"],
             indexes={"contract_details": ("contract_id",)})


@route("/corporations/{cid}/contracts")
def contracts(ctx, params, cid):
    ids = {int(r["contract_id"]) for r in ctx.store.rows("corporation_contracts", corporation_id=cid)}
    if ctx.synced:  # Conduit's copy of these is newer
        ids -= set(CorpContract.objects.filter(corporation_id=cid).values_list("contract_id", flat=True))
    return [contract_json(r) for r in ctx.store.rows_in("contract_details", "contract_id", sorted(ids))]


# --- industry -------------------------------------------------------------------------------------------------

corp_section("industry", HISTORY, ["corporation_industry_jobs"])


@route("/corporations/{cid}/industry/jobs")
def jobs(ctx, params, cid):
    have = set()
    if ctx.synced:
        have = set(CorpIndustryJob.objects.filter(corporation_id=cid).values_list("job_id", flat=True))
    return [
        drop_none({
            "job_id": int(r["job_id"]), "installer_id": int(r["installer_id"]), "facility_id": int(r["facility_id"]),
            "location_id": _int(r["location_id"]), "activity_id": int(r["activity_id"]),
            "blueprint_id": _int(r["blueprint_id"]), "blueprint_type_id": int(r["blueprint_type_id"]),
            "blueprint_location_id": _int(r["blueprint_location_id"]),
            "output_location_id": _int(r["output_location_id"]), "runs": int(r["runs"]), "cost": _num(r["cost"]),
            "licensed_runs": _int(r["licensed_runs"]), "probability": _num(r["probability"]),
            "product_type_id": _int(r["product_type_id"]), "status": r["status"], "duration": _int(r["duration"]),
            "start_date": esi_dt(r["start_date"]), "end_date": esi_dt(r["end_date"]),
            "pause_date": esi_dt(r["pause_date"]), "completed_date": esi_dt(r["completed_date"]),
            "completed_character_id": _int(r["completed_character_id"]),
            "successful_runs": _int(r["successful_runs"]),
        })
        for r in ctx.store.rows("corporation_industry_jobs", corporation_id=cid) if int(r["job_id"]) not in have
    ]


# --- market ---------------------------------------------------------------------------------------------------
# The sync takes the list it gets as the open orders (and stores each one open), closing open orders missing from
# it. So the list is Conduit's own open orders once synced, or SeAT's still-running ones; ``closed_orders`` then
# adds every other order SeAT kept, closed.


def _order(r) -> dict:
    return drop_none({
        "order_id": int(r["order_id"]), "type_id": int(r["type_id"]), "region_id": int(r["region_id"]),
        "location_id": int(r["location_id"]), "range": r["range"],
        "is_buy_order": bool(int(r["is_buy_order"] or 0)), "price": float(r["price"]),
        "volume_total": int(r["volume_total"]), "volume_remain": int(r["volume_remain"]),
        "issued": esi_dt(r["issued"]), "issued_by": _int(r["issued_by"]) or None, "min_volume": _int(r["min_volume"]),
        "duration": int(r["duration"] or 0), "wallet_division": _int(r["wallet_division"]), "escrow": _num(r["escrow"]),
    })


def _still_open(ctx, cid) -> list[dict]:
    return [o for r in ctx.store.rows("corporation_orders", corporation_id=cid) if r["state"] == "active"
            for o in [_order(r)] if not _ran_out(o)]


def closed_orders(ctx):
    from conduit.sheet.locations import resolve
    from conduit.sheet.util import parse_dt

    corporation = ctx.corporation
    have = set(CorpMarketOrder.objects.filter(corporation=corporation).values_list("order_id", flat=True))
    rows = [_order(r) for r in ctx.store.rows("corporation_orders", corporation_id=corporation.pk)]
    rows = [o for o in rows if o["order_id"] not in have]
    CorpMarketOrder.objects.bulk_create(
        [
            CorpMarketOrder(
                corporation=corporation, order_id=o["order_id"], type_id=o["type_id"], is_buy_order=o["is_buy_order"],
                price=o["price"], volume_total=o["volume_total"], volume_remain=o["volume_remain"],
                issued=parse_dt(o["issued"]), issued_by=o.get("issued_by"), duration=o["duration"],
                location_id=o["location_id"], region_id=o["region_id"], wallet_division=o.get("wallet_division"),
                escrow=o.get("escrow"), state="closed",
            )
            for o in rows
        ],
        ignore_conflicts=True, batch_size=1000,
    )
    ctx.names.update(o["issued_by"] for o in rows if o.get("issued_by"))
    resolve({o["location_id"] for o in rows}, client=SeatEsi(ctx))


corp_section("market", HISTORY, ["corporation_orders"], after=closed_orders)


@route("/corporations/{cid}/orders")
def open_orders(ctx, params, cid):
    if not ctx.synced:
        return _still_open(ctx, cid)
    return [
        drop_none({
            "order_id": o.order_id, "type_id": o.type_id, "region_id": o.region_id, "location_id": o.location_id,
            "is_buy_order": o.is_buy_order, "price": float(o.price), "volume_total": o.volume_total,
            "volume_remain": o.volume_remain, "issued": _iso(o.issued), "issued_by": o.issued_by,
            "duration": o.duration, "wallet_division": o.wallet_division,
            "escrow": None if o.escrow is None else float(o.escrow),
        })
        for o in CorpMarketOrder.objects.filter(corporation_id=cid, state="active")
    ]


# --- mining ---------------------------------------------------------------------------------------------------

corp_section("mining", HISTORY, ["corporation_industry_mining_observer_data"],
             indexes={"corporation_industry_mining_observer_data": ("observer_id",)})


@route("/corporation/{cid}/mining/extractions")
def extractions(ctx, params, cid):
    # Extractions are what's scheduled now: SeAT's are long past. The sync keeps whatever Conduit has.
    raise EsiError(403, "extractions are left to the live sync")


@route("/corporation/{cid}/mining/observers")
def observers(ctx, params, cid):
    ids = {int(r["observer_id"]) for r in ctx.store.rows("corporation_industry_mining_observer_data", corporation_id=cid)}
    return [{"observer_id": i, "observer_type": "structure"} for i in sorted(ids)]


@route("/corporation/{cid}/mining/observers/{observer_id}")
def observed(ctx, params, cid, observer_id):
    have = set()
    if ctx.synced:  # EVE's figures for a day are the final ones
        have = set(MiningObservation.objects.filter(corporation_id=cid, observer_id=observer_id)
                   .values_list("character_id", "type_id", "last_updated"))
    rows = {}
    for r in ctx.store.rows("corporation_industry_mining_observer_data", corporation_id=cid, observer_id=observer_id):
        day = str(r["last_updated"])[:10]
        key = (int(r["character_id"]), int(r["type_id"]), day)
        rows[key] = {"character_id": key[0], "type_id": key[1], "last_updated": day, "quantity": int(r["quantity"]),
                     "recorded_corporation_id": _int(r["recorded_corporation_id"])}  # SeAT's last copy of the day
    return [row for (c, t, d), row in rows.items() if (c, t, date.fromisoformat(d)) not in have]


# --- killmails ------------------------------------------------------------------------------------------------

corp_section("killmails", HISTORY, KILLMAIL_TABLES,
             indexes={t: ("killmail_id",) for t in KILLMAIL_TABLES}
             | {"killmail_victims": ("killmail_id", "corporation_id"),
                "killmail_attackers": ("killmail_id", "corporation_id")},
             limits=[("conduit.corp.sections.killmails", "FETCH_LIMIT", 10**9)])


@route("/corporations/{cid}/killmails/recent")
def recent(ctx, params, cid):
    # SeAT keeps no list per corporation: its killmails are the ones it was on, as victim or attacker, at the time.
    ids = {int(r["killmail_id"]) for t in ("killmail_victims", "killmail_attackers")
           for r in ctx.store.rows(t, corporation_id=cid)}
    hashes = {int(r["killmail_id"]): r["killmail_hash"] for r in ctx.store.rows_in("killmails", "killmail_id", sorted(ids))}
    return [{"killmail_id": k, "killmail_hash": hashes[k]} for k in sorted(ids, reverse=True) if hashes.get(k)]
