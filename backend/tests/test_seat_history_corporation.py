"""The SeAT history import for corporations: wallets, contracts, industry, market, mining and killmails."""

import hashlib
from datetime import date
from decimal import Decimal

import pytest

from conduit.corp.models import (CorpContract, CorpIndustryJob, CorpJournalEntry, CorpMarketOrder, CorpSyncStatus,
                                 CorpTransaction, CorporationKillmail, MiningObservation, MoonExtraction,
                                 WalletDivision)
from conduit.eve.models import EveCorporation

from .conftest import make_user
from .seat_history import run, token_row, write_dump

OLD, LIVE, GONE, OTHER = 98000001, 98000002, 98000003, 98000004  # GONE: nobody here; OTHER: only on killmails
PILOT, MEMBER = 93000001, 93000002
JITA = 60003760
CORP_SECTIONS = ["corp.wallets", "corp.contracts", "corp.industry", "corp.market", "corp.mining", "corp.killmails"]


def journal(corp, ref, day, division=1, amount=1000.0):
    return {"internal_id": ref, "corporation_id": corp, "division": division, "id": ref, "date": day,
            "ref_type": "bounty_prizes", "first_party_id": 1000125, "second_party_id": corp, "amount": amount,
            "balance": 5e9, "reason": "", "tax_receiver_id": None, "tax": None, "context_id": None,
            "context_id_type": None, "description": "Bounty", "created_at": day, "updated_at": day}


def contract(contract_id, status, issued):
    return {"contract_id": contract_id, "issuer_id": PILOT, "issuer_corporation_id": OLD, "assignee_id": OLD,
            "acceptor_id": 0, "start_location_id": JITA, "end_location_id": JITA, "type": "item_exchange",
            "status": status, "title": "Corp stuff", "for_corporation": 1, "availability": "corporation",
            "date_issued": issued, "date_expired": "2019-07-01 00:00:00", "date_accepted": None,
            "days_to_complete": 0, "date_completed": None, "price": 1e6, "reward": 0.0, "collateral": 0.0,
            "buyout": None, "volume": 100.0}


def job(corp, job_id, status, start):
    return {"corporation_id": corp, "job_id": job_id, "installer_id": PILOT, "facility_id": JITA, "location_id": JITA,
            "activity_id": 1, "blueprint_id": 1, "blueprint_type_id": 688, "blueprint_location_id": JITA,
            "output_location_id": JITA, "runs": 5, "cost": 1000.0, "licensed_runs": 10, "probability": 1.0,
            "product_type_id": 587, "status": status, "duration": 3600, "start_date": start,
            "end_date": start.replace("00:00:00", "01:00:00"), "pause_date": None, "completed_date": None,
            "completed_character_id": None, "successful_runs": None}


def order(corp, order_id, state, issued, duration=90):
    return {"id": order_id, "corporation_id": corp, "order_id": order_id, "type_id": 34, "region_id": 10000002,
            "location_id": JITA, "range": "station", "is_buy_order": 0, "price": 5.0, "volume_total": 100,
            "volume_remain": 10, "issued": issued, "issued_by": PILOT, "min_volume": 1, "wallet_division": 1,
            "duration": duration, "escrow": None, "state": state}


def mined(corp, n, character, day, quantity):
    return {"id": n, "corporation_id": corp, "observer_id": 1035000000001, "recorded_corporation_id": corp,
            "character_id": character, "type_id": 45490, "last_updated": f"{day} 00:00:00", "quantity": quantity,
            "created_at": f"{day} 00:00:00", "updated_at": f"{day} 00:00:00"}


def killmail(kid, victim_corp, attacker_corp):
    t = "2019-04-01 20:00:00"
    return {
        "killmails": [{"killmail_id": kid, "killmail_hash": hashlib.sha1(str(kid).encode()).hexdigest()}],
        "killmail_details": [{"killmail_id": kid, "killmail_time": t, "solar_system_id": 30002187, "moon_id": None,
                              "war_id": None}],
        "killmail_victims": [{"killmail_id": kid, "character_id": 95000000 + kid, "corporation_id": victim_corp,
                              "alliance_id": None, "faction_id": None, "damage_taken": 1000, "ship_type_id": 587,
                              "x": None, "y": None, "z": None}],
        "killmail_attackers": [{"id": kid, "killmail_id": kid, "character_id": 96000000 + kid,
                                "corporation_id": attacker_corp, "alliance_id": None, "faction_id": None,
                                "security_status": 0.0, "final_blow": 1, "damage_done": 1000, "ship_type_id": 621,
                                "weapon_type_id": 2873}],
        "killmail_victim_items": [],
    }


def corp_dump(tmp_path):
    kms = [killmail(1, OLD, OTHER), killmail(2, OTHER, OLD), killmail(3, OTHER, GONE)]
    tables = {
        "refresh_tokens": [token_row(PILOT), token_row(MEMBER)],
        "universe_stations": [{"station_id": JITA, "name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
                               "system_id": 30000142, "type_id": 1531, "owner": 1000035}],
        "corporation_wallet_balances": [{"corporation_id": OLD, "division": 1, "balance": 4.5e9},
                                        {"corporation_id": LIVE, "division": 1, "balance": 1.0}],
        "corporation_wallet_journals": [
            journal(OLD, 1, "2018-01-01 00:00:00"), journal(OLD, 2, "2018-02-01 00:00:00", division=2),
            journal(LIVE, 3, "2017-05-01 00:00:00"), journal(LIVE, 9000, "2025-02-01 00:00:00", amount=7.0),
            journal(GONE, 4, "2016-01-01 00:00:00"),
        ],
        "corporation_wallet_transactions": [{
            "id": 1, "corporation_id": OLD, "division": 1, "transaction_id": 777, "date": "2018-01-02 10:00:00",
            "type_id": 34, "location_id": JITA, "unit_price": 5.0, "quantity": 1000, "client_id": PILOT, "is_buy": 0,
            "journal_ref_id": 1,
        }],
        "corporation_contracts": [{"id": 1, "corporation_id": OLD, "contract_id": 501},
                                  {"id": 2, "corporation_id": LIVE, "contract_id": 502},
                                  {"id": 3, "corporation_id": LIVE, "contract_id": 503}],
        "contract_details": [contract(501, "finished", "2019-01-01 00:00:00"),
                             contract(502, "outstanding", "2019-02-01 00:00:00"),
                             contract(503, "finished", "2018-03-01 00:00:00")],
        "corporation_industry_jobs": [job(OLD, 11, "delivered", "2018-06-01 00:00:00"),
                                      job(LIVE, 12, "active", "2019-06-01 00:00:00"),
                                      job(LIVE, 13, "delivered", "2017-06-01 00:00:00")],
        "corporation_orders": [order(OLD, 21, "expired", "2018-01-01 00:00:00"),
                               order(OLD, 22, "active", "2018-01-01 00:00:00"),  # ran out long ago
                               order(OLD, 23, "active", "2099-01-01 00:00:00"),  # "still open"
                               order(LIVE, 24, "active", "2019-01-01 00:00:00"),
                               order(LIVE, 25, "cancelled", "2018-01-01 00:00:00")],
        "corporation_industry_mining_observer_data": [
            mined(OLD, 1, PILOT, "2019-03-01", 100), mined(OLD, 2, PILOT, "2019-03-01", 150),  # SeAT's later copy wins
            mined(OLD, 3, MEMBER, "2019-03-02", 50),
            mined(LIVE, 4, MEMBER, "2025-02-01", 1), mined(LIVE, 5, MEMBER, "2018-02-01", 70),
        ],
        "killmails": [], "killmail_details": [], "killmail_victims": [], "killmail_attackers": [],
        "killmail_victim_items": [],
    }
    for km in kms:
        for t, rows in km.items():
            tables[t] += rows
    return write_dump(tmp_path / "seat.sql", tables)


@pytest.fixture
def corps(db):
    old = EveCorporation.objects.create(id=OLD, name="Old Corp", ticker="OLD")
    live = EveCorporation.objects.create(id=LIVE, name="Live Corp", ticker="LIVE")
    EveCorporation.objects.create(id=GONE, name="Gone Corp", ticker="GONE")  # known here, but nobody in it
    make_user(PILOT, "Old Pilot", corporation=old)
    make_user(MEMBER, "Live Member", corporation=live)
    # Live Corp has synced from EVE: newer balance, recent journal, a contract, a job, an open order, a mining day
    # and a scheduled extraction.
    WalletDivision.objects.create(corporation=live, division=1, balance=Decimal("123.00"))
    CorpJournalEntry.objects.create(corporation=live, division=1, ref_id=9000, date="2025-02-01T00:00:00Z",
                                    ref_type="bounty_prizes", amount=Decimal("7"), description="from EVE")
    CorpContract.objects.create(corporation=live, contract_id=502, type="item_exchange", status="finished",
                                availability="corporation", issuer_id=PILOT, date_issued="2019-02-01T00:00:00Z")
    CorpIndustryJob.objects.create(corporation=live, job_id=12, installer_id=PILOT, activity_id=1, status="delivered",
                                   blueprint_type_id=688, runs=5, facility_id=JITA, location_id=JITA,
                                   start_date="2019-06-01T00:00:00Z", end_date="2019-06-01T01:00:00Z")
    CorpMarketOrder.objects.create(corporation=live, order_id=26, type_id=34, is_buy_order=True, price=Decimal("4"),
                                   volume_total=10, volume_remain=10, issued="2025-02-01T00:00:00Z", duration=30,
                                   location_id=JITA, region_id=10000002, state="active")
    MiningObservation.objects.create(corporation=live, observer_id=1035000000001, character_id=MEMBER, type_id=45490,
                                     quantity=999, last_updated=date(2025, 2, 1))
    MoonExtraction.objects.create(corporation=live, structure_id=1035000000001, moon_id=40000001,
                                  extraction_start_time="2025-02-01T00:00:00Z", chunk_arrival_time="2025-02-07T00:00:00Z",
                                  natural_decay_time="2025-02-07T03:00:00Z")
    for section in ("wallets", "contracts", "industry", "market", "mining"):
        CorpSyncStatus.objects.create(corporation=live, section=section, result="ok", last_success="2025-02-02T00:00:00Z")
    return old, live


@pytest.mark.django_db
def test_corporation_history_comes_over(tmp_path, corps):
    old, live = corps
    summary = run(corp_dump(tmp_path), sections=CORP_SECTIONS)
    assert not summary["errors"], summary["errors"]
    assert summary["corporations"] == 2 and summary["corporations_done"] == 2  # not Gone Corp, nor OTHER
    for s in CORP_SECTIONS:
        assert summary["sections"][s] == {"imported": 2, "skipped": 0, "errors": 0}, s

    # Wallets: every division's journal, the transactions and the balance for the corporation never synced...
    assert set(CorpJournalEntry.objects.filter(corporation=old).values_list("division", "ref_id")) == {(1, 1), (2, 2)}
    assert CorpTransaction.objects.get(corporation=old).transaction_id == 777
    assert WalletDivision.objects.get(corporation=old, division=1).balance == Decimal("4500000000.00")
    # ...and the older history for the live one, leaving what EVE gave alone.
    assert set(CorpJournalEntry.objects.filter(corporation=live).values_list("ref_id", flat=True)) == {3, 9000}
    assert CorpJournalEntry.objects.get(corporation=live, ref_id=9000).description == "from EVE"
    assert WalletDivision.objects.get(corporation=live, division=1).balance == Decimal("123.00")
    assert not CorpJournalEntry.objects.filter(ref_id=4).exists()  # Gone Corp has nobody here

    # Contracts and jobs: missing ones added, none sent back to SeAT's older status.
    assert CorpContract.objects.get(corporation=old, contract_id=501).status == "finished"
    assert CorpContract.objects.get(corporation=live, contract_id=502).status == "finished"
    assert CorpContract.objects.filter(corporation=live, contract_id=503).exists()
    assert CorpIndustryJob.objects.get(corporation=live, job_id=12).status == "delivered"
    assert CorpIndustryJob.objects.filter(corporation=live, job_id=13).exists()
    assert CorpIndustryJob.objects.filter(corporation=old, job_id=11).exists()

    # Market: SeAT's past orders come over closed; Live Corp's own open order stays open.
    states = dict(CorpMarketOrder.objects.values_list("order_id", "state"))
    assert states == {21: "closed", 22: "closed", 23: "active", 24: "closed", 25: "closed", 26: "active"}

    # Mining: one row a day per member and ore, EVE's figure kept; extractions left to the live sync.
    assert MiningObservation.objects.get(corporation=old, character_id=PILOT).quantity == 150
    assert MiningObservation.objects.get(corporation=live, last_updated=date(2025, 2, 1)).quantity == 999
    assert MiningObservation.objects.get(corporation=live, last_updated=date(2018, 2, 1)).quantity == 70
    assert MoonExtraction.objects.filter(corporation=live).count() == 1

    # Killmails the corporation was on, either side, with losses marked.
    kms = dict(CorporationKillmail.objects.filter(corporation=old).values_list("killmail_id", "is_loss"))
    assert kms == {1: True, 2: False}
    assert not CorporationKillmail.objects.filter(killmail_id=3).exists()

    # Sections filled from SeAT say so; ones synced from EVE keep their status.
    status = CorpSyncStatus.objects.get(corporation=old, section="wallets")
    assert status.message == "From SeAT, data as of 2018-02-01" and status.result == "ok"
    assert CorpSyncStatus.objects.get(corporation=live, section="wallets").message == ""

    # Again: nothing doubles.
    run(corp_dump(tmp_path), sections=CORP_SECTIONS)
    assert CorpJournalEntry.objects.count() == 4 and CorpMarketOrder.objects.count() == 6
    assert MiningObservation.objects.count() == 4 and CorporationKillmail.objects.count() == 2


@pytest.mark.django_db
def test_only_the_chosen_characters_corporations(tmp_path, corps):
    old, live = corps
    summary = run(corp_dump(tmp_path), sections=["corp.wallets"], character_ids=[MEMBER])
    assert summary["corporations"] == 1
    assert not CorpJournalEntry.objects.filter(corporation=old).exists()
    assert CorpJournalEntry.objects.filter(corporation=live, ref_id=3).exists()


@pytest.mark.django_db
def test_a_failing_corporation_section_is_reported_and_rolled_back(tmp_path, corps, monkeypatch):
    from conduit.corp.sections import wallets

    monkeypatch.setattr(wallets, "dec", lambda v: 1 / 0)
    summary = run(corp_dump(tmp_path), sections=["corp.wallets", "corp.industry"])
    assert summary["sections"]["corp.wallets"]["errors"] == 2
    assert summary["sections"]["corp.industry"]["imported"] == 2
    err = summary["errors"][0]
    assert err["corporation"] in (OLD, LIVE) and err["character"] is None and "ZeroDivisionError" in err["error"]
    assert not CorpJournalEntry.objects.filter(ref_id__in=[1, 2, 3]).exists()
