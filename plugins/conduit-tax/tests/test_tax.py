"""Corp tax: attributing journal entries to members, the extra tax, closing months, payments and reminders."""

from datetime import UTC, datetime, time, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from conduit.access.rules import RULE_TYPES
from conduit.accounts.models import Character
from conduit.corp.models import CorpJournalEntry, CorporationInfo
from conduit.eve.models import EveName
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_tax import services
from conduit_tax.models import Invoice, LedgerMonth, Payment, Settlement, TaxSettings
from tests.conftest import make_user

CONCORD = 1000125
_ref = iter(range(1, 10**6))


@pytest.fixture
def last_month():
    return (timezone.now().date().replace(day=1) - timedelta(days=1)).replace(day=1)


def journal(corp, when, ref_type, amount, first, second, reason=""):
    return CorpJournalEntry.objects.create(
        corporation=corp, division=1, ref_id=next(_ref), date=when, ref_type=ref_type, amount=Decimal(amount),
        first_party_id=first, second_party_id=second, reason=reason,
    )


@pytest.fixture
def taxed(db, corp, last_month):
    """Pilot One (with an alt) and an unregistered ratter, all taxed by the corporation last month."""
    sync_installed()
    set_enabled("tax", True)
    TaxSettings.objects.update_or_create(pk=1, defaults={"rate": 50})
    CorporationInfo.objects.create(corporation=corp, tax_rate=0.1)
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    Character.objects.create(id=90000002, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=corp)
    EveName.objects.create(id=91000777, name="Stranger", category="character")
    day = datetime.combine(last_month + timedelta(days=3), time(12), tzinfo=UTC)
    journal(corp, day, "bounty_prizes", 1_000_000, CONCORD, 90000001)
    journal(corp, day, "ess_escrow_transfer", 400_000, CONCORD, 90000002)
    journal(corp, day, "agent_mission_reward", 9_999_999, CONCORD, 90000001)  # not counted by default
    journal(corp, day, "bounty_prizes", 500_000, CONCORD, 91000777)
    return pilot


def ledger_admin(admin_user):
    from django.contrib.auth.models import Permission

    admin_user.is_superuser = False
    admin_user.save()
    admin_user.user_permissions.add(*Permission.objects.filter(content_type__app_label="tax"))
    # The ledger follows the corporation sheet's permissions: this one may see every corporation's wallets.
    admin_user.user_permissions.add(*Permission.objects.filter(codename__in=["view_all_corporations", "view_corporation_wallets"]))
    return type(admin_user).objects.get(pk=admin_user.pk)


def close(last_month, admin_user):
    services.close_month(last_month, admin_user)
    return Invoice.objects.get()


def test_ledger_groups_alts_under_their_member(taxed, last_month):
    data = services.ledger(last_month)
    pilot, stranger = data["members"]
    assert pilot["name"] == "Pilot One" and pilot["collected"] == 1_400_000
    assert [c["name"] for c in pilot["characters"]] == ["Pilot One", "Pilot Alt"]
    assert pilot["earned"] == pytest.approx(14_000_000)  # at the corporation's 10 % tax rate
    assert pilot["tax"] == 700_000  # 50 % of what the corporation took
    assert not stranger["registered"] and stranger["name"] == "Stranger" and stranger["tax"] == 0
    assert data["totals"]["tax"] == 700_000 and data["totals"]["unregistered_collected"] == 500_000
    assert [k["label"] for k in data["kinds"]] == ["Bounties", "ESS payouts"]
    assert data["can_close"]


def test_chosen_ref_types_and_corporations_count(taxed, last_month):
    TaxSettings.objects.filter(pk=1).update(ref_types=["agent_mission_reward"])
    assert services.ledger(last_month)["totals"]["collected"] == 9_999_999
    TaxSettings.objects.filter(pk=1).update(corporations=[12345])
    assert services.ledger(last_month)["members"] == []


def test_entries_without_a_player_are_ignored(taxed, corp, last_month):
    journal(corp, datetime.combine(last_month, time(1), tzinfo=UTC), "bounty_prizes", 5, CONCORD, corp.pk)
    assert services.ledger(last_month)["totals"]["collected"] == 1_900_000


def test_members_only_see_their_own(taxed, last_month, api_client):
    api_client.force_login(taxed)
    me = api_client.call("get", f"/api/p/tax/me?month={last_month:%Y-%m}").json()
    assert [m["name"] for m in me["ledger"]["members"]] == ["Pilot One"]
    assert api_client.call("get", f"/api/p/tax/ledger?month={last_month:%Y-%m}").status_code == 403


def test_closing_bills_members(taxed, last_month, api_client, admin_user):
    api_client.force_login(ledger_admin(admin_user))
    TaxSettings.objects.filter(pk=1).update(payment_instructions="Give to Holding Corp")
    resp = api_client.call("post", f"/api/p/tax/months/{last_month:%Y-%m}/close")
    assert resp.status_code == 200 and resp.json()["closed"]
    inv = Invoice.objects.get(user=taxed)
    assert inv.amount == 700_000 and inv.collected == 1_400_000 and not inv.paid
    assert Invoice.objects.count() == 1  # nobody to bill for the unregistered ratter
    note = Notification.objects.get(user=taxed)
    assert note.title.startswith("Corp tax for") and f"TAX {last_month:%Y-%m}" in note.body

    TaxSettings.objects.filter(pk=1).update(rate=1)
    assert services.ledger(last_month)["members"][0]["tax"] == 700_000  # the rate it was closed with

    assert api_client.call("post", f"/api/p/tax/months/{last_month:%Y-%m}/close").status_code == 400
    assert api_client.call("post", f"/api/p/tax/invoices/{inv.pk}", {"paid": True}).json()["paid"]
    assert "already paid" in api_client.call("post", f"/api/p/tax/months/{last_month:%Y-%m}/reopen").json()["detail"]
    api_client.call("post", f"/api/p/tax/invoices/{inv.pk}", {"paid": False})
    assert api_client.call("post", f"/api/p/tax/months/{last_month:%Y-%m}/reopen").status_code == 200
    assert not LedgerMonth.objects.exists() and not Invoice.objects.exists()


def test_small_bills_are_not_sent(taxed, last_month, admin_user):
    TaxSettings.objects.filter(pk=1).update(minimum=1_000_000)
    services.close_month(last_month, admin_user)
    assert not Invoice.objects.exists()


def test_this_month_cannot_be_closed(taxed, admin_user):
    with pytest.raises(services.LedgerError, match="once it's over"):
        services.close_month(services.parse_month(None), admin_user)


def test_payments_from_the_wallet_settle_bills(taxed, corp, last_month, admin_user):
    inv = close(last_month, admin_user)
    now = timezone.now()
    journal(corp, now, "player_donation", 300_000, 90000002, corp.pk, reason=f"tax {last_month:%Y-%m}")
    journal(corp, now, "player_donation", 999_999_999, 90000001, corp.pk, reason="thanks for the fleet")  # wrong reason
    assert services.match_payments() == 1
    inv.refresh_from_db()
    assert not inv.paid  # 300k doesn't cover 700k yet
    journal(corp, now, "player_donation", 500_000, 90000001, corp.pk, reason="TAX")
    services.match_payments()
    inv.refresh_from_db()
    assert inv.paid and inv.marked_by is None and services.invoice_out(inv)["paid_from_wallet"]
    assert sum(p.remaining for p in Payment.objects.all()) == 100_000
    assert services.match_payments() == 0  # the same entries aren't counted twice


def test_payments_made_before_closing_count(taxed, corp, last_month, admin_user):
    journal(corp, timezone.now(), "player_donation", 700_000, 90000001, corp.pk, reason="TAX")
    services.match_payments()
    assert close(last_month, admin_user).paid


def test_reminders(taxed, last_month, admin_user):
    inv = close(last_month, admin_user)
    assert services.send_reminders() == 0  # not a week old yet
    LedgerMonth.objects.update(closed_at=timezone.now() - timedelta(days=8))
    assert services.send_reminders() == 1
    assert Notification.objects.filter(user=taxed, title__startswith="Reminder").count() == 1
    assert services.send_reminders() == 0  # not again for a week
    Invoice.objects.filter(pk=inv.pk).update(paid=True)
    Invoice.objects.update(reminded_at=timezone.now() - timedelta(days=8))
    assert services.send_reminders() == 0


def test_paid_up_rule(taxed, last_month, admin_user):
    rule = RULE_TYPES["tax_paid_up"]
    assert rule.evaluate(taxed, {"days": 14})  # never billed
    inv = close(last_month, admin_user)
    assert rule.evaluate(taxed, {"days": 14})  # still has time to pay
    LedgerMonth.objects.update(closed_at=timezone.now() - timedelta(days=20))
    assert not rule.evaluate(taxed, {"days": 14})
    Invoice.objects.filter(pk=inv.pk).update(paid=True)
    assert rule.evaluate(taxed, {"days": 14})


def test_settings(taxed, api_client, admin_user):
    api_client.force_login(ledger_admin(admin_user))
    data = api_client.call("get", "/api/p/tax/settings").json()
    assert data["rate"] == 50 and data["ref_types"] == ["bounty_prizes", "ess_escrow_transfer"]
    assert [c["name"] for c in data["available_corporations"]] == ["Test Corp"]
    resp = api_client.call("put", "/api/p/tax/settings", {"rate": 25, "ref_types": ["bounty_prizes"], "payment_reason": " RAT "})
    assert resp.status_code == 200 and resp.json()["payment_reason"] == "RAT"
    assert api_client.call("put", "/api/p/tax/settings", {"rate": 25, "ref_types": ["market_transaction"]}).status_code == 400


def test_csv_export(taxed, last_month, api_client, admin_user):
    api_client.force_login(ledger_admin(admin_user))
    body = api_client.call("get", f"/api/p/tax/ledger.csv?month={last_month:%Y-%m}").content.decode()
    assert "Pilot Alt" in body and "Stranger" in body


def test_wallets_permission_is_needed(taxed, last_month, api_client):
    """The ledger shows what members earned, so it needs the corporation sheet's wallet permission too."""
    from django.contrib.auth.models import Permission

    officer = make_user(90000050, "Tax Officer", corporation=taxed.main_character.corporation)
    officer.user_permissions.add(*Permission.objects.filter(codename__in=["view_ledger", "manage_ledger", "view_own_corporation"]))
    api_client.force_login(type(officer).objects.get(pk=officer.pk))
    assert api_client.call("get", f"/api/p/tax/ledger?month={last_month:%Y-%m}").json()["members"] == []
    officer.user_permissions.add(Permission.objects.get(codename="view_corporation_wallets"))
    api_client.force_login(type(officer).objects.get(pk=officer.pk))
    assert len(api_client.call("get", f"/api/p/tax/ledger?month={last_month:%Y-%m}").json()["members"]) == 2


def test_plugin_off_means_no_api(taxed, api_client):
    set_enabled("tax", False)
    api_client.force_login(taxed)
    assert api_client.call("get", "/api/p/tax/me").status_code == 404


def test_far_off_months_are_refused(taxed, api_client):
    api_client.force_login(taxed)
    assert api_client.call("get", "/api/p/tax/me?month=9999-12").status_code == 400


def test_unmarking_a_wallet_settled_bill_gives_the_payment_back(taxed, corp, last_month, admin_user):
    officer = ledger_admin(admin_user)
    journal(corp, timezone.now(), "player_donation", 1_000_000, 90000001, corp.pk, reason="TAX")
    services.match_payments()
    inv = close(last_month, officer)
    assert inv.paid and Payment.objects.get().remaining == 300_000
    services.set_paid(inv.pk, False, officer)
    assert Payment.objects.get().remaining == 1_000_000 and not Settlement.objects.exists()
    services.set_paid(inv.pk, False, officer)  # unmarking again gives nothing more back
    assert Payment.objects.get().remaining == 1_000_000
    # Reopening and closing the month again settles the bill from the same donation, once.
    services.reopen_month(last_month)
    inv = close(last_month, officer)
    assert inv.paid and Payment.objects.get().remaining == 300_000
    assert services.settle(taxed.pk) == [] and Payment.objects.get().remaining == 300_000


def test_settling_takes_each_payment_once(taxed, corp, last_month, admin_user):
    inv = close(last_month, ledger_admin(admin_user))
    now = timezone.now()
    journal(corp, now, "player_donation", 400_000, 90000001, corp.pk, reason="TAX")
    journal(corp, now, "player_donation", 400_000, 90000002, corp.pk, reason="TAX")
    services.match_payments()
    inv.refresh_from_db()
    assert inv.paid
    assert sorted(s.amount for s in Settlement.objects.filter(invoice=inv)) == [300_000, 400_000]
    assert sum(p.remaining for p in Payment.objects.all()) == 100_000
    services.settle(taxed.pk)
    assert sum(p.remaining for p in Payment.objects.all()) == 100_000


def test_nobody_marks_their_own_bill(taxed, last_month, admin_user):
    from django.contrib.auth.models import Permission

    inv = close(last_month, admin_user)
    taxed.user_permissions.add(*Permission.objects.filter(content_type__app_label="tax"))
    with pytest.raises(services.LedgerError, match="your own"):
        services.set_paid(inv.pk, True, taxed)
    inv.refresh_from_db()
    assert not inv.paid


def test_the_payment_word_must_be_a_word_of_its_own(taxed, corp, last_month, admin_user):
    assert services.is_payment_reason(f"tax {last_month:%Y-%m}", "TAX")
    assert services.is_payment_reason("Sept corp Tax, Pilot Alt", "TAX")
    assert services.is_payment_reason(f"TAX{last_month:%Y-%m}", "TAX")
    assert not services.is_payment_reason("syntax error", "TAX")
    assert not services.is_payment_reason("taxi fare", "TAX")
    now = timezone.now()
    journal(corp, now, "player_donation", 700_000, 90000001, corp.pk, reason="for the taxi")
    assert services.match_payments() == 0 and not Payment.objects.exists()


def test_the_minimum_must_be_a_real_number(taxed, api_client, admin_user):
    api_client.force_login(ledger_admin(admin_user))
    for bad in (float("nan"), float("inf"), 1e30, -1):
        resp = api_client.call("put", "/api/p/tax/settings", {"rate": 25, "minimum": bad, "ref_types": ["bounty_prizes"]})
        assert resp.status_code == 400, bad
    assert TaxSettings.load().minimum == 0
