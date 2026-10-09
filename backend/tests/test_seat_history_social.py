"""The SeAT history import for contacts, standings, loyalty points and the mining ledger."""

from datetime import date

import pytest

from conduit.accounts.models import Token
from conduit.sheet.contacts.models import Contact
from conduit.sheet.loyalty.models import LoyaltyPoints
from conduit.sheet.mining.models import MiningEntry
from conduit.sheet.models import SyncStatus
from conduit.sheet.standings.models import Standing

from .conftest import make_user
from .seat_history import run, token_row, write_dump

DEAD, LIVE = 91000101, 91000102
SECTIONS = ["contacts", "standings", "loyalty", "mining"]
TS = {"created_at": "2024-01-01 00:00:00", "updated_at": "2025-02-28 00:00:00"}


def contact(row_id, cid, contact_id, contact_type, standing, label_ids=None, watched=0, blocked=0):
    return {"id": row_id, "character_id": cid, "contact_id": contact_id, "standing": standing,
            "contact_type": contact_type, "is_watched": watched, "is_blocked": blocked, "label_ids": label_ids, **TS}


def mining(row_id, cid, day, time, system, type_id, quantity):
    return {"id": row_id, "character_id": cid, "date": day, "time": time, "year": int(day[:4]),
            "month": int(day[5:7]), "solar_system_id": system, "type_id": type_id, "quantity": quantity, **TS}


def dump(tmp_path):
    return write_dump(tmp_path / "seat.sql", {
        "refresh_tokens": [token_row(DEAD, deleted_at="2025-03-02 00:00:00"), token_row(LIVE)],
        "universe_names": [{"entity_id": 1000125, "name": "CONCORD", "category": "corporation"}],
        "character_contacts": [
            contact(11, DEAD, 2112, "character", 10.0, label_ids="[1]", watched=1),
            contact(12, DEAD, 98000001, "corporation", -10.0, label_ids=None, blocked=1),
            contact(13, DEAD, 99000001, "alliance", 5.0, label_ids="[]"),
            contact(14, LIVE, 2113, "character", -5.0),
        ],
        "character_labels": [
            {"id": 501, "character_id": DEAD, "label_id": 1, "name": "Friends", **TS},
            {"id": 502, "character_id": DEAD, "label_id": 2, "name": "Reds", **TS},
            {"id": 503, "character_id": LIVE, "label_id": 1, "name": "Old", **TS},
        ],
        "character_contact_character_label": [
            {"character_contact_id": 11, "character_label_id": 501},
            {"character_contact_id": 12, "character_label_id": 502},
        ],
        "character_standings": [
            {"id": 1, "character_id": DEAD, "from_id": 500001, "from_type": "faction", "standing": 2.5, **TS},
            {"id": 2, "character_id": DEAD, "from_id": 1000125, "from_type": "npc_corp", "standing": -1.25, **TS},
            {"id": 3, "character_id": DEAD, "from_id": 3008416, "from_type": "agent", "standing": 4.0, **TS},
            {"id": 4, "character_id": LIVE, "from_id": 500001, "from_type": "faction", "standing": -9.0, **TS},
        ],
        "character_loyalty_points": [
            {"character_id": DEAD, "corporation_id": 1000125, "amount": 12000, **TS},
            {"character_id": DEAD, "corporation_id": 1000180, "amount": 350, **TS},
            {"character_id": LIVE, "corporation_id": 1000125, "amount": 1, **TS},
        ],
        "character_minings": [
            # SeAT keeps what each fetch added to the day; ESI's daily total is their sum.
            mining(1, DEAD, "2019-04-01", "10:00:00", 30000142, 1230, 1000),
            mining(2, DEAD, "2019-04-01", "14:00:00", 30000142, 1230, 500),
            mining(3, DEAD, "2019-04-02", "09:00:00", 30002187, 17470, 42),
            mining(4, LIVE, "2018-06-01", "08:00:00", 30000142, 1230, 700),
            mining(5, LIVE, "2025-02-20", "08:00:00", 30000142, 1230, 10),  # EVE's figure for this day wins
        ],
    })


@pytest.fixture
def people(db):
    dead = make_user(DEAD, "Gone Pilot").main_character
    Token.objects.filter(character=dead).update(valid=False)
    live = make_user(LIVE, "Live Pilot").main_character
    # The live character synced every section from EVE already.
    Contact.objects.create(character=live, contact_id=3000, contact_type="character", standing=10.0, labels=["Now"])
    Standing.objects.create(character=live, from_id=500001, from_type="faction", standing=3.0)
    LoyaltyPoints.objects.create(character=live, corporation_id=1000125, points=999)
    MiningEntry.objects.create(character=live, date=date(2025, 2, 20), solar_system_id=30000142, type_id=1230,
                               quantity=5000)
    for key in SECTIONS:
        SyncStatus.objects.create(character=live, section=key, result="ok", last_success="2025-02-21T00:00:00Z")
    return dead, live


def state():
    return (
        sorted(Contact.objects.values_list("character_id", "contact_id", "contact_type", "standing", "is_blocked",
                                           "is_watched", "labels")),
        sorted(Standing.objects.values_list("character_id", "from_id", "from_type", "standing")),
        sorted(LoyaltyPoints.objects.values_list("character_id", "corporation_id", "points")),
        sorted(MiningEntry.objects.values_list("character_id", "date", "solar_system_id", "type_id", "quantity")),
    )


@pytest.mark.django_db
def test_dead_character_gets_what_seat_had(tmp_path, people):
    dead, _ = people
    summary = run(dump(tmp_path), sections=SECTIONS)
    assert not summary["errors"], summary["errors"]
    for key in SECTIONS:
        assert summary["sections"][key]["errors"] == 0

    contacts = {c.contact_id: c for c in Contact.objects.filter(character=dead)}
    assert set(contacts) == {2112, 98000001, 99000001}
    friend, corp, alliance = contacts[2112], contacts[98000001], contacts[99000001]
    assert (friend.contact_type, friend.standing, friend.is_watched, friend.is_blocked, friend.labels) == \
        ("character", 10.0, True, False, ["Friends"])
    assert (corp.contact_type, corp.standing, corp.is_blocked, corp.labels) == ("corporation", -10.0, True, ["Reds"])
    assert (alliance.contact_type, alliance.labels) == ("alliance", [])

    assert sorted(Standing.objects.filter(character=dead).values_list("from_id", "from_type", "standing")) == [
        (500001, "faction", 2.5), (1000125, "npc_corp", -1.25), (3008416, "agent", 4.0)]
    assert sorted(LoyaltyPoints.objects.filter(character=dead).values_list("corporation_id", "points")) == [
        (1000125, 12000), (1000180, 350)]
    assert sorted(MiningEntry.objects.filter(character=dead).values_list(
        "date", "solar_system_id", "type_id", "quantity")) == [
        (date(2019, 4, 1), 30000142, 1230, 1500), (date(2019, 4, 2), 30002187, 17470, 42)]
    for key in SECTIONS:
        assert SyncStatus.objects.get(character=dead, section=key).message == "From SeAT, data as of 2025-03-01"


@pytest.mark.django_db
def test_synced_character_keeps_eve_data(tmp_path, people):
    _, live = people
    summary = run(dump(tmp_path), sections=SECTIONS)
    assert not summary["errors"], summary["errors"]
    for key in ("contacts", "standings", "loyalty"):
        assert summary["sections"][key] == {"imported": 1, "skipped": 1, "errors": 0}

    assert list(Contact.objects.filter(character=live).values_list("contact_id", "labels")) == [(3000, ["Now"])]
    assert list(Standing.objects.filter(character=live).values_list("from_id", "standing")) == [(500001, 3.0)]
    assert list(LoyaltyPoints.objects.filter(character=live).values_list("corporation_id", "points")) == [
        (1000125, 999)]
    # Mining gains the older day only; the day EVE gave keeps EVE's total.
    assert sorted(MiningEntry.objects.filter(character=live).values_list("date", "quantity")) == [
        (date(2018, 6, 1), 700), (date(2025, 2, 20), 5000)]
    for key in SECTIONS:
        assert SyncStatus.objects.get(character=live, section=key).message == ""


@pytest.mark.django_db
def test_running_twice_changes_nothing(tmp_path, people):
    first = run(dump(tmp_path), sections=SECTIONS)
    before = state()
    second = run(dump(tmp_path), sections=SECTIONS)
    assert not first["errors"] and not second["errors"]
    assert state() == before
    assert second["sections"]["mining"] == {"imported": 2, "skipped": 0, "errors": 0}
    for key in ("contacts", "standings", "loyalty"):
        assert second["sections"][key] == {"imported": 0, "skipped": 2, "errors": 0}
