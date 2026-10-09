"""The SeAT history import: killmails, contracts, industry jobs and market orders."""

import hashlib
from decimal import Decimal

import pytest

from conduit.accounts.models import Token
from conduit.sheet.contracts.models import Contract, ContractItem
from conduit.sheet.industry.models import IndustryJob
from conduit.sheet.killmails.models import CharacterKillmail, Killmail
from conduit.sheet.market.models import MarketOrder
from conduit.sheet.models import SyncStatus

from .conftest import make_user
from .seat_history import run, token_row, write_dump

DEAD, LIVE = 92000001, 92000002
SECTIONS = ["killmails", "contracts", "industry", "market"]
JITA = 60003760


# --- SeAT rows ------------------------------------------------------------------------------------------------

def km_rows(kid, time, victim, attackers, items=()):
    """killmails, killmail_details, killmail_victims, killmail_attackers and killmail_victim_items rows."""
    return {
        "killmails": [{"killmail_id": kid, "killmail_hash": hashlib.sha1(str(kid).encode()).hexdigest(), "created_at": time, "updated_at": time}],
        "killmail_details": [{"killmail_id": kid, "killmail_time": time, "solar_system_id": 30002187, "moon_id": None,
                              "war_id": None, "created_at": time, "updated_at": time}],
        "killmail_victims": [{"killmail_id": kid, "character_id": victim, "corporation_id": 98000001,
                              "alliance_id": 99000001, "faction_id": None, "damage_taken": 4321, "ship_type_id": 587,
                              "x": 1.5, "y": -2.5, "z": 3.25, "created_at": time, "updated_at": time}],
        "killmail_attackers": [
            {"id": kid * 10 + n, "attacker_hash": f"a{kid}{n}", "killmail_id": kid, "character_id": cid,
             "corporation_id": 98000002, "alliance_id": None, "faction_id": None, "security_status": -1.5,
             "final_blow": int(final), "damage_done": dmg, "ship_type_id": 621, "weapon_type_id": 2873,
             "created_at": time, "updated_at": time}
            for n, (cid, final, dmg) in enumerate(attackers)
        ],
        "killmail_victim_items": [
            {"killmail_id": kid, "item_type_id": t, "quantity_destroyed": d, "quantity_dropped": p, "singleton": 0,
             "flag": f} for t, d, p, f in items
        ],
    }


def contract(cid, contract_id, status, issued, type_="item_exchange"):
    return {"contract_id": contract_id, "issuer_id": cid, "issuer_corporation_id": 98000001, "assignee_id": 0,
            "acceptor_id": 0, "start_location_id": JITA, "start_location_type": "station", "end_location_id": JITA,
            "end_location_type": "station", "type": type_, "status": status, "title": "Rifters", "for_corporation": 0,
            "availability": "public", "date_issued": issued, "date_expired": "2019-07-01 00:00:00",
            "date_accepted": None, "days_to_complete": 0, "date_completed": None, "price": 1500000.0,
            "reward": 0.0, "collateral": 0.0, "buyout": None, "volume": 16500.0}


def job(cid, job_id, status, start):
    return {"character_id": cid, "job_id": job_id, "installer_id": cid, "facility_id": JITA, "station_id": JITA,
            "activity_id": 1, "blueprint_id": 1000000001, "blueprint_type_id": 688, "blueprint_location_id": JITA,
            "output_location_id": JITA, "runs": 10, "cost": 12345.67, "licensed_runs": 200, "probability": 1.0,
            "product_type_id": 587, "status": status, "duration": 3600, "start_date": start,
            "end_date": start.replace(":00:00", ":59:00"), "pause_date": None, "completed_date": None,
            "completed_character_id": None, "successful_runs": None, "created_at": start, "updated_at": start}


def order(cid, order_id, state, issued, duration=90, remain=5):
    return {"id": order_id, "character_id": cid, "order_id": order_id, "type_id": 34, "region_id": 10000002,
            "location_id": JITA, "range": "station", "is_buy_order": 0, "price": 5.55, "volume_total": 10,
            "volume_remain": remain, "issued": issued, "min_volume": 1, "duration": duration, "is_corporation": 0,
            "escrow": None, "state": state, "created_at": issued, "updated_at": issued}


def trade_dump(tmp_path):
    tables = {
        "refresh_tokens": [token_row(DEAD, deleted_at="2025-03-02 00:00:00"), token_row(LIVE)],
        "universe_names": [],
        "universe_stations": [{"station_id": JITA, "name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
                               "system_id": 30000142, "type_id": 1531, "owner": 1000035}],
        "character_contracts": [
            {"id": 1, "character_id": DEAD, "contract_id": 501, "created_at": None, "updated_at": None},
            {"id": 2, "character_id": DEAD, "contract_id": 502, "created_at": None, "updated_at": None},
            {"id": 3, "character_id": LIVE, "contract_id": 601, "created_at": None, "updated_at": None},
            {"id": 4, "character_id": LIVE, "contract_id": 602, "created_at": None, "updated_at": None},
        ],
        "contract_details": [
            contract(DEAD, 501, "finished", "2019-06-01 10:00:00"),
            contract(DEAD, 502, "outstanding", "2019-06-02 10:00:00", type_="courier"),
            contract(LIVE, 601, "outstanding", "2018-01-01 00:00:00"),  # older copy of what EVE says is finished
            contract(LIVE, 602, "finished", "2017-01-01 00:00:00"),
        ],
        "contract_items": [
            {"contract_id": 501, "record_id": 9001, "type_id": 587, "quantity": 3, "raw_quantity": None,
             "is_singleton": 0, "is_included": 1, "created_at": None, "updated_at": None},
            {"contract_id": 501, "record_id": 9002, "type_id": 34, "quantity": 100, "raw_quantity": None,
             "is_singleton": 0, "is_included": 0, "created_at": None, "updated_at": None},
            {"contract_id": 602, "record_id": 9003, "type_id": 35, "quantity": 7, "raw_quantity": -1,
             "is_singleton": 1, "is_included": 1, "created_at": None, "updated_at": None},
        ],
        "character_industry_jobs": [
            job(DEAD, 701, "delivered", "2019-05-01 10:00:00"), job(DEAD, 702, "active", "2019-05-02 10:00:00"),
            job(LIVE, 801, "active", "2025-01-01 10:00:00"), job(LIVE, 802, "delivered", "2017-01-01 10:00:00"),
        ],
        "character_orders": [
            order(DEAD, 1001, "expired", "2019-01-01 00:00:00", remain=0),
            order(DEAD, 1002, "cancelled", "2019-02-01 00:00:00"),
            order(DEAD, 1003, "active", "2019-03-01 00:00:00"),  # ran out long ago
            order(DEAD, 1004, "active", "2099-01-01 00:00:00"),  # still open
            order(LIVE, 2001, "active", "2025-01-01 00:00:00", duration=3650),  # EVE says it's open, newer price
            order(LIVE, 2002, "expired", "2017-01-01 00:00:00"),
            order(LIVE, 2003, "active", "2098-01-01 00:00:00"),  # gone from EVE's open list
        ],
    }
    # Killmail 301: DEAD dies to LIVE (final blow) and someone else. 302: DEAD on a kill. 303: LIVE's older loss.
    for part in (
        km_rows(301, "2019-04-01 12:00:00", DEAD, [(93000001, False, 100), (LIVE, True, 4221)],
                items=[(2873, 1, None, 27), (34, None, 500, 5)]),
        km_rows(302, "2019-04-02 12:00:00", 93000002, [(DEAD, True, 999)]),
        km_rows(303, "2017-04-02 12:00:00", LIVE, [(93000003, True, 999)]),
    ):
        for t, rows in part.items():
            tables.setdefault(t, []).extend(rows)
    return write_dump(tmp_path / "seat.sql", tables)


@pytest.fixture
def people(db):
    dead = make_user(DEAD, "Gone Trader").main_character
    Token.objects.filter(character=dead).update(valid=False)
    live = make_user(LIVE, "Live Trader").main_character
    # The live character synced all four sections from EVE already.
    Contract.objects.create(character=live, contract_id=601, type="item_exchange", status="finished", title="EVE",
                            availability="public", issuer_id=LIVE, issuer_corporation_id=98000001, assignee_id=0,
                            acceptor_id=2112, date_issued="2018-01-01T00:00:00Z", date_expired="2018-02-01T00:00:00Z",
                            items_fetched=True)
    IndustryJob.objects.create(character=live, job_id=801, activity_id=1, status="delivered", blueprint_id=1,
                               blueprint_type_id=688, runs=10, facility_id=JITA, station_id=JITA,
                               output_location_id=JITA, start_date="2025-01-01T10:00:00Z",
                               end_date="2025-01-01T10:59:00Z")
    MarketOrder.objects.create(character=live, order_id=2001, type_id=34, is_buy=False, price=Decimal("4.20"),
                               volume_total=10, volume_remain=2, min_volume=1, issued="2025-01-01T00:00:00Z",
                               duration=3650, location_id=JITA, region_id=10000002, range="station")
    for s in SECTIONS:
        SyncStatus.objects.create(character=live, section=s, result="ok", last_success="2025-02-02T00:00:00Z")
    return dead, live


def snapshot():
    return {
        "km": sorted(Killmail.objects.values_list("id", "hash", "value", "attacker_count")),
        "ckm": sorted(CharacterKillmail.objects.values_list("character_id", "killmail_id", "is_loss")),
        "contracts": sorted(Contract.objects.values_list("character_id", "contract_id", "status", "items_fetched")),
        "items": sorted(ContractItem.objects.values_list("contract__contract_id", "record_id", "quantity")),
        "jobs": sorted(IndustryJob.objects.values_list("character_id", "job_id", "status")),
        "orders": sorted(MarketOrder.objects.values_list("character_id", "order_id", "state", "price",
                                                         "volume_remain")),
    }


@pytest.mark.django_db
def test_trade_history_comes_over(tmp_path, people):
    dead, live = people
    summary = run(trade_dump(tmp_path), sections=SECTIONS)
    assert not summary["errors"], summary["errors"]
    for s in SECTIONS:
        assert summary["sections"][s] == {"imported": 2, "skipped": 0, "errors": 0}

    # Killmails: rebuilt into ESI's JSON, linked to everyone on them.
    km = Killmail.objects.get(pk=301)
    assert km.hash == hashlib.sha1(b"301").hexdigest() and km.time.year == 2019 and km.solar_system_id == 30002187
    assert km.victim_character_id == DEAD and km.victim_ship_type_id == 587 and km.damage_taken == 4321
    assert km.attacker_count == 2 and km.final_blow_character_id == LIVE
    assert km.data["killmail_time"] == "2019-04-01T12:00:00Z"
    assert km.data["victim"]["position"] == {"x": 1.5, "y": -2.5, "z": 3.25}
    assert km.data["victim"]["items"] == [
        {"item_type_id": 2873, "flag": 27, "singleton": 0, "quantity_destroyed": 1},
        {"item_type_id": 34, "flag": 5, "singleton": 0, "quantity_dropped": 500},
    ]
    final = [a for a in km.data["attackers"] if a["final_blow"]]
    assert final == [{"character_id": LIVE, "corporation_id": 98000002, "security_status": -1.5, "final_blow": True,
                      "damage_done": 4221, "ship_type_id": 621, "weapon_type_id": 2873}]
    assert set(CharacterKillmail.objects.values_list("character_id", "killmail_id", "is_loss")) == {
        (DEAD, 301, True), (DEAD, 302, False), (LIVE, 301, False), (LIVE, 303, True)}

    # Contracts: the gone character gets all of them, items included.
    c = Contract.objects.get(character=dead, contract_id=501)
    assert c.status == "finished" and c.price == Decimal("1500000.00") and c.date_issued.year == 2019
    assert c.items_fetched and c.start_location_id == JITA and c.buyout is None
    assert sorted(c.items.values_list("record_id", "type_id", "quantity", "is_included")) == [
        (9001, 587, 3, True), (9002, 34, 100, False)]
    assert Contract.objects.get(character=dead, contract_id=502).items_fetched  # courier
    # The live one gains the older contract; what EVE said about 601 stays.
    assert Contract.objects.get(character=live, contract_id=601).status == "finished"
    assert Contract.objects.get(character=live, contract_id=601).title == "EVE"
    old = Contract.objects.get(character=live, contract_id=602)
    assert list(old.items.values_list("record_id", "raw_quantity", "is_singleton")) == [(9003, -1, True)]

    # Industry.
    j = IndustryJob.objects.get(character=dead, job_id=701)
    assert j.status == "delivered" and j.cost == Decimal("12345.67") and j.licensed_runs == 200
    assert j.product_type_id == 587 and j.start_date.year == 2019 and j.end_date.minute == 59
    assert set(IndustryJob.objects.filter(character=dead).values_list("job_id", flat=True)) == {701, 702}
    assert IndustryJob.objects.get(character=live, job_id=801).status == "delivered"  # not back to active
    assert IndustryJob.objects.filter(character=live, job_id=802).exists()

    # Market: the gone character's history, with stale "active" orders expired and the live one open.
    states = dict(MarketOrder.objects.filter(character=dead).values_list("order_id", "state"))
    assert states == {1001: "expired", 1002: "cancelled", 1003: "expired", 1004: "open"}
    o = MarketOrder.objects.get(character=dead, order_id=1004)
    assert o.price == Decimal("5.55") and o.volume_remain == 5 and o.region_id == 10000002 and not o.is_buy
    # The live one keeps EVE's open order as it was; gains the old ones.
    o = MarketOrder.objects.get(character=live, order_id=2001)
    assert o.state == "open" and o.price == Decimal("4.20") and o.volume_remain == 2
    assert dict(MarketOrder.objects.filter(character=live).values_list("order_id", "state")) == {
        2001: "open", 2002: "expired", 2003: "closed"}

    # Again: nothing changes.
    before = snapshot()
    again = run(trade_dump(tmp_path), sections=SECTIONS)
    assert not again["errors"], again["errors"]
    assert snapshot() == before


@pytest.mark.django_db
def test_live_contract_without_items_waits_for_eve(tmp_path, people):
    dead, live = people
    # A contract EVE listed but whose items haven't been fetched yet; SeAT doesn't have them either.
    Contract.objects.filter(character=live, contract_id=601).update(items_fetched=False)
    summary = run(trade_dump(tmp_path), sections=["contracts"])
    assert not summary["errors"], summary["errors"]
    assert not Contract.objects.get(character=live, contract_id=601).items_fetched
    assert Contract.objects.get(character=live, contract_id=602).items_fetched
