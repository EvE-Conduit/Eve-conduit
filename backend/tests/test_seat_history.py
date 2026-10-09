"""The SeAT history import: framework, and the wallet section as its first user."""

from decimal import Decimal

import pytest
from django.core.management import call_command

from conduit.accounts.models import Token
from conduit.eve.models import EveName
from conduit.sheet.models import Location, SyncStatus
from conduit.sheet.seat import history
from conduit.sheet.wallet.models import JournalEntry, WalletBalance, WalletTransaction

from .conftest import make_user
from .seat_history import run, token_row, write_dump

DEAD, LIVE, ABSENT = 91000001, 91000002, 91000009


def journal(cid, ref, date, amount=100.0):
    return {"character_id": cid, "id": ref, "date": date, "ref_type": "player_donation", "first_party_id": 2112,
            "second_party_id": cid, "amount": amount, "balance": 1000.0, "reason": "thanks", "tax_receiver_id": None,
            "tax": None, "context_id": None, "context_id_type": None, "description": "Donation"}


def wallet_dump(tmp_path):
    return write_dump(tmp_path / "seat.sql", {
        "refresh_tokens": [token_row(DEAD, deleted_at="2025-03-02 00:00:00"), token_row(LIVE), token_row(ABSENT)],
        "universe_names": [{"entity_id": 2112, "name": "Some Donor", "category": "character"}],
        "universe_stations": [{"station_id": 60003760, "name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
                               "system_id": 30000142, "type_id": 1531, "owner": 1000035}],
        "character_wallet_balances": [{"character_id": DEAD, "balance": 1234.5}, {"character_id": LIVE, "balance": 1.0}],
        "character_wallet_journals": [
            journal(DEAD, 1, "2019-05-01 10:00:00"), journal(DEAD, 2, "2019-06-01 10:00:00", -50.0),
            journal(LIVE, 3, "2018-01-01 00:00:00"), journal(LIVE, 1000, "2025-02-01 00:00:00", 999.0),
            journal(ABSENT, 4, "2019-01-01 00:00:00"),
        ],
        "character_wallet_transactions": [{
            "id": 7, "character_id": DEAD, "transaction_id": 555, "date": "2019-05-02 11:00:00", "type_id": 34,
            "location_id": 60003760, "unit_price": 5.5, "quantity": 1000, "client_id": 2112, "is_buy": 1,
            "is_personal": 1, "journal_ref_id": 1,
        }],
        "character_infos": [],  # tables the import doesn't read are skipped
    })


@pytest.fixture
def people(db):
    dead = make_user(DEAD, "Gone Pilot").main_character
    Token.objects.filter(character=dead).update(valid=False)
    live = make_user(LIVE, "Live Pilot").main_character
    # The live character synced its wallet from EVE already: newer balance, last 30 days of journal.
    WalletBalance.objects.create(character=live, balance=Decimal("500.00"))
    JournalEntry.objects.create(character=live, ref_id=1000, date="2025-02-01T00:00:00Z", ref_type="player_donation",
                                amount=Decimal("999"), description="from EVE")
    SyncStatus.objects.create(character=live, section="wallet", result="ok", last_success="2025-02-02T00:00:00Z")
    return dead, live


@pytest.mark.django_db
def test_wallet_history_comes_over_for_every_character(tmp_path, people):
    dead, live = people
    summary = run(wallet_dump(tmp_path), sections=["wallet"])
    assert summary["characters"] == 2 and summary["not_here"] == 1
    assert summary["sections"]["wallet"] == {"imported": 2, "skipped": 0, "errors": 0}

    # The character whose token is gone gets everything SeAT had.
    assert list(JournalEntry.objects.filter(character=dead).values_list("ref_id", flat=True)) == [2, 1]
    entry = JournalEntry.objects.get(character=dead, ref_id=1)
    assert entry.amount == Decimal("100.00") and entry.reason == "thanks" and entry.date.year == 2019
    assert WalletBalance.objects.get(character=dead).balance == Decimal("1234.50")
    tx = WalletTransaction.objects.get(character=dead)
    assert tx.transaction_id == 555 and tx.is_buy and tx.unit_price == Decimal("5.50")
    assert Location.objects.get(pk=60003760).name.startswith("Jita IV")  # named from SeAT, no call to EVE
    status = SyncStatus.objects.get(character=dead, section="wallet")
    assert status.message == "From SeAT, data as of 2025-03-01" and status.last_success.year == 2025

    # The live one gains the older history; what EVE gave stays as it was.
    assert set(JournalEntry.objects.filter(character=live).values_list("ref_id", flat=True)) == {3, 1000}
    assert JournalEntry.objects.get(character=live, ref_id=1000).description == "from EVE"
    assert WalletBalance.objects.get(character=live).balance == Decimal("500.00")
    assert SyncStatus.objects.get(character=live, section="wallet").message == ""
    assert EveName.objects.get(pk=2112).name == "Some Donor"

    # Again: nothing doubles.
    run(wallet_dump(tmp_path), sections=["wallet"])
    assert JournalEntry.objects.count() == 4 and WalletTransaction.objects.count() == 1


@pytest.mark.django_db
def test_never_calls_eve_while_importing(tmp_path, people, monkeypatch):
    from conduit.sheet.seat import history as h

    calls = []
    real = h._no_live_esi
    monkeypatch.setattr(h, "_no_live_esi", lambda *a, **k: calls.append(a) or real())
    dump = wallet_dump(tmp_path)
    # A station SeAT doesn't know either: only the transaction points at it.
    dump.write_text("\n".join(line.replace("60003760", "60009999") if "character_wallet_transactions` VALUES" in line
                              else line for line in dump.read_text().split("\n")))
    summary = run(dump, sections=["wallet"])
    assert not summary["errors"] and not calls, calls
    assert not Location.objects.filter(pk=60009999, resolved=True).exists()  # left for a live sync to name


@pytest.mark.django_db
def test_one_failing_section_does_not_stop_the_rest(tmp_path, people, monkeypatch):
    real = history.import_character

    def boom_for_dead(store, character, imports, names, orgs=None):
        if character.pk == DEAD:
            from conduit.sheet.wallet import sync

            monkeypatch.setattr(sync, "_dec", lambda v: 1 / 0)
        else:
            from conduit.sheet.wallet import sync
            from decimal import Decimal as D

            monkeypatch.setattr(sync, "_dec", lambda v: None if v is None else D(str(v)))
        return real(store, character, imports, names, orgs)

    monkeypatch.setattr(history, "import_character", boom_for_dead)
    summary = run(wallet_dump(tmp_path), sections=["wallet"])
    assert summary["sections"]["wallet"] == {"imported": 1, "skipped": 0, "errors": 1}
    assert "ZeroDivisionError" in summary["errors"][0]["error"]
    assert not JournalEntry.objects.filter(character_id=DEAD).exists()  # rolled back as a whole
    assert JournalEntry.objects.filter(character_id=LIVE, ref_id=3).exists()


@pytest.mark.django_db
def test_command(tmp_path, people, capsys):
    call_command("import_seat_history", str(wallet_dump(tmp_path)), "--section", "wallet", "--no-names",
                 "--report", str(tmp_path / "r.json"))
    out = capsys.readouterr().out
    assert "wallet" in out and "Done." in out and (tmp_path / "r.json").exists()
    assert JournalEntry.objects.filter(character_id=DEAD).count() == 2


def test_unknown_section_is_refused():
    with pytest.raises(ValueError, match="No SeAT import for: nope"):
        history.plan(["nope"])
