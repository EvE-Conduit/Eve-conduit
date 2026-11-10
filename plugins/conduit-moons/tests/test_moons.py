"""Moon mining ledger: grouping by member, valuation, tax, closing months and payments."""

from datetime import timedelta

import pytest
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.audit.models import AuditEvent
from conduit.corp.models import CorpSyncStatus, MiningObservation
from conduit.eve.models import EveName, MarketPrice
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemType
from conduit_moons import services
from conduit_moons.models import Invoice, MoonSettings
from tests.conftest import make_user

ORE, ORE2 = 45490, 45491  # Zeolites, Sylvite


@pytest.fixture
def last_month():
    return (timezone.now().date().replace(day=1) - timedelta(days=1)).replace(day=1)


@pytest.fixture
def mined(db, corp, last_month):
    """Pilot One (with an alt) and an unregistered miner, all on one moon drill last month."""
    sync_installed()
    set_enabled("moons", True)
    ItemType.objects.create(id=ORE, group_id=1, name="Zeolites", published=True)
    ItemType.objects.create(id=ORE2, group_id=1, name="Sylvite", published=True)
    MarketPrice.objects.create(type_id=ORE, average_price=100.0)
    MarketPrice.objects.create(type_id=ORE2, average_price=50.0)
    CorpSyncStatus.objects.create(corporation=corp, section="mining", last_success=timezone.now())  # synced since last month ended
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    Character.objects.create(id=90000002, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=corp)
    EveName.objects.create(id=777, name="Stranger", category="character")
    day = last_month + timedelta(days=3)
    for char, type_id, qty in ((90000001, ORE, 1000), (90000002, ORE2, 2000), (777, ORE, 500)):
        MiningObservation.objects.create(corporation=corp, observer_id=1_000_000_000_001, character_id=char, type_id=type_id,
                                         quantity=qty, last_updated=day)
    return pilot


def ledger_admin(admin_user):
    from django.contrib.auth.models import Permission

    admin_user.is_superuser = False
    admin_user.save()
    admin_user.user_permissions.add(*Permission.objects.filter(content_type__app_label="moons"))
    # The ledger follows the corporation sheet's permissions: this one may see every corporation.
    admin_user.user_permissions.add(Permission.objects.get(codename="view_all_corporations"))
    return type(admin_user).objects.get(pk=admin_user.pk)


def test_ledger_groups_alts_under_their_member(mined, last_month):
    data = services.ledger(last_month)
    pilot, stranger = data["members"]
    assert pilot["name"] == "Pilot One" and pilot["value"] == 1000 * 100 + 2000 * 50
    assert [c["name"] for c in pilot["characters"]] == ["Pilot One", "Pilot Alt"]
    assert pilot["tax"] == 20000  # 10 % by default
    assert not stranger["registered"] and stranger["name"] == "Stranger" and stranger["value"] == 50000
    assert data["totals"]["tax"] == 20000 and data["totals"]["unregistered_value"] == 50000
    assert [o["name"] for o in data["ores"]] == ["Zeolites", "Sylvite"]
    assert data["moons"][0]["miners"] == 2 and data["can_close"]


def test_members_only_see_their_own(mined, last_month, api_client):
    api_client.force_login(mined)
    me = api_client.call("get", f"/api/p/moons/me?month={last_month:%Y-%m}").json()
    assert [m["name"] for m in me["ledger"]["members"]] == ["Pilot One"]
    assert api_client.call("get", f"/api/p/moons/ledger?month={last_month:%Y-%m}").status_code == 403


def test_closing_fixes_prices_and_bills_members(mined, last_month, api_client, admin_user):
    api_client.force_login(ledger_admin(admin_user))
    MoonSettings.objects.update_or_create(pk=1, defaults={"tax_rate": 5, "payment_instructions": "Give to Moon Holdings, reason MOON"})
    resp = api_client.call("post", f"/api/p/moons/months/{last_month:%Y-%m}/close")
    assert resp.status_code == 200 and resp.json()["closed"]
    inv = Invoice.objects.get(user=mined)
    assert inv.amount == 10000 and not inv.paid
    assert Invoice.objects.count() == 1  # nobody to bill for the unregistered miner
    assert Notification.objects.get(user=mined).title.startswith("Moon tax for")

    MarketPrice.objects.filter(type_id=ORE).update(average_price=1_000_000.0)
    assert services.ledger(last_month)["members"][0]["value"] == 200000  # prices of the day it closed

    assert api_client.call("post", f"/api/p/moons/months/{last_month:%Y-%m}/close").status_code == 400
    assert api_client.call("post", f"/api/p/moons/invoices/{inv.pk}", {"paid": True}).json()["paid"]
    assert "already paid" in api_client.call("post", f"/api/p/moons/months/{last_month:%Y-%m}/reopen").json()["detail"]
    api_client.call("post", f"/api/p/moons/invoices/{inv.pk}", {"paid": False})
    assert api_client.call("post", f"/api/p/moons/months/{last_month:%Y-%m}/reopen").status_code == 200
    assert not Invoice.objects.exists()


def test_this_month_cannot_be_closed(mined, admin_user):
    with pytest.raises(services.LedgerError, match="once it's over"):
        services.close_month(services.parse_month(None), admin_user)


def test_only_chosen_corporations_count(mined, last_month):
    MoonSettings.objects.update_or_create(pk=1, defaults={"corporations": [12345]})
    assert services.ledger(last_month)["members"] == []


def test_csv_export(mined, last_month, api_client, admin_user):
    api_client.force_login(ledger_admin(admin_user))
    body = api_client.call("get", f"/api/p/moons/ledger.csv?month={last_month:%Y-%m}").content.decode()
    assert "Pilot Alt" in body and "Stranger" in body


def test_plugin_off_means_no_api(mined, api_client):
    set_enabled("moons", False)
    api_client.force_login(mined)
    assert api_client.call("get", "/api/p/moons/me").status_code == 404


def test_ledger_only_shows_corporations_the_viewer_may_see(mined, last_month, api_client):
    """A corporation's moon officer sees their own corporation's mining, not the rest of the alliance's."""
    from django.contrib.auth.models import Permission

    from conduit.eve.models import EveCorporation

    other = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER", alliance=mined.main_character.corporation.alliance)
    MiningObservation.objects.create(corporation=other, observer_id=1_000_000_000_002, character_id=888, type_id=ORE, quantity=10,
                                     last_updated=last_month + timedelta(days=4))
    EveName.objects.create(id=888, name="Other Miner", category="character")
    officer = make_user(90000050, "Moon Officer", corporation=mined.main_character.corporation)
    officer.user_permissions.add(*Permission.objects.filter(codename__in=["view_ledger", "manage_ledger", "view_own_corporation"]))
    officer = type(officer).objects.get(pk=officer.pk)
    api_client.force_login(officer)
    data = api_client.call("get", f"/api/p/moons/ledger?month={last_month:%Y-%m}").json()
    assert {m["name"] for m in data["members"]} == {"Pilot One", "Stranger"}
    csv = api_client.call("get", f"/api/p/moons/ledger.csv?month={last_month:%Y-%m}").content.decode()
    assert "Other Miner" not in csv
    settings = api_client.call("get", "/api/p/moons/settings").json()
    assert [c["name"] for c in settings["available_corporations"]] == ["Test Corp"]
    # Closing, reopening and the settings cover every corporation, so they need access to all of them.
    resp = api_client.call("post", f"/api/p/moons/months/{last_month:%Y-%m}/close")
    assert resp.status_code == 403 and "Other Corp" in resp.json()["detail"]
    assert api_client.call("put", "/api/p/moons/settings", {"tax_rate": 1}).status_code == 403
    # Without any corporation permission: nothing at all.
    officer.user_permissions.remove(Permission.objects.get(codename="view_own_corporation"))
    api_client.force_login(type(officer).objects.get(pk=officer.pk))
    assert api_client.call("get", f"/api/p/moons/ledger?month={last_month:%Y-%m}").json()["members"] == []


def test_invoices_of_hidden_corporations_cannot_be_marked(mined, last_month, admin_user):
    from django.contrib.auth.models import Permission

    services.close_month(last_month, admin_user)
    inv = Invoice.objects.get(user=mined)
    outsider = make_user(90000051, "Outsider")
    outsider.user_permissions.add(*Permission.objects.filter(codename__in=["manage_ledger", "view_own_corporation"]))
    with pytest.raises(services.LedgerError, match="can't see"):
        services.set_paid(inv.pk, True, type(outsider).objects.get(pk=outsider.pk))


def test_nobody_marks_their_own_bill(mined, last_month, admin_user):
    from django.contrib.auth.models import Permission

    services.close_month(last_month, admin_user)
    inv = Invoice.objects.get(user=mined)
    mined.user_permissions.add(*Permission.objects.filter(content_type__app_label="moons"))
    mined.user_permissions.add(Permission.objects.get(codename="view_all_corporations"))
    with pytest.raises(services.LedgerError, match="your own"):
        services.set_paid(inv.pk, True, type(mined).objects.get(pk=mined.pk))
    inv.refresh_from_db()
    assert not inv.paid


def test_far_off_months_are_refused(mined, api_client):
    api_client.force_login(mined)
    assert api_client.call("get", "/api/p/moons/me?month=9999-12").status_code == 400
    assert api_client.call("get", "/api/p/moons/me?month=2026-13").status_code == 400


def test_a_month_waits_for_the_mining_to_sync_past_its_end(mined, last_month, admin_user, monkeypatch):
    """Bills are fixed at closing: what was mined on the month's last day and arrives with the next sync would be on
    nobody's bill. So closing waits for that sync, for two days at most."""
    end = services._at(services.month_end(last_month))
    CorpSyncStatus.objects.update(last_success=end - timedelta(minutes=20))  # last synced just before midnight
    monkeypatch.setattr(timezone, "now", lambda: end + timedelta(minutes=5))
    with pytest.raises(services.LedgerError, match="Test Corp hasn't synced since"):
        services.close_month(last_month, admin_user)
    # A corporation that stopped syncing doesn't hold the month up for ever.
    monkeypatch.setattr(timezone, "now", lambda: end + services.SYNC_GRACE + timedelta(minutes=1))
    services.close_month(last_month, admin_user)
    services.reopen_month(last_month)
    # Synced after the month ended: straight away.
    CorpSyncStatus.objects.update(last_success=end + timedelta(minutes=3))
    monkeypatch.setattr(timezone, "now", lambda: end + timedelta(minutes=5))
    services.close_month(last_month, admin_user)
    assert Invoice.objects.get().amount == 20_000


def test_characters_taken_off_an_account_are_pointed_out(mined, last_month, admin_user):
    """An alt removed before the month is closed is "unregistered" and on nobody's bill. Whoever closes the month is
    told which characters that happened to and whose they were; nobody is billed from the audit log."""
    assert services.ledger(last_month)["removed_characters"] == []
    Character.objects.filter(pk=90000002).delete()  # the member unlinked their alt...
    AuditEvent.objects.create(action="character.removed", summary="Pilot One removed character Pilot Alt", actor_type="user",  # ...as the core records it
                              actor_id=mined.pk, actor_name="Pilot One", target_type="character", details={"character_id": 90000002, "name": "Pilot Alt"})
    (gone,) = services.ledger(last_month)["removed_characters"]
    assert (gone["character_id"], gone["value"], gone["previous_owner"], gone["sold"]) == (90000002, 100_000.0, {"id": mined.pk, "name": "Pilot One"}, False)
    assert services.ledger(last_month, user=mined)["removed_characters"] == []  # not on members' own pages
    services.close_month(last_month, admin_user)
    assert Invoice.objects.get().amount == 10_000  # the main only: the warning doesn't bill anyone


def test_a_bill_isnt_shown_to_someone_who_cant_see_all_it_covers(mined, corp, last_month, api_client, admin_user):
    """A bill adds up every corporation's moons. To a viewer who may see only some of them, its total would give away
    what the member mined in the others."""
    from django.contrib.auth.models import Permission

    from conduit.eve.models import EveCorporation

    other = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER")
    CorpSyncStatus.objects.create(corporation=other, section="mining", last_success=timezone.now())
    MiningObservation.objects.create(corporation=other, observer_id=1_000_000_000_002, character_id=90000002, type_id=ORE, quantity=50_000,
                                     last_updated=last_month + timedelta(days=4))
    services.close_month(last_month, admin_user)
    assert Invoice.objects.get(user=mined).amount == 520_000

    officer = make_user(90000050, "Moon Officer", corporation=corp)
    officer.user_permissions.add(*Permission.objects.filter(codename__in=["view_ledger", "view_own_corporation"]))
    api_client.force_login(type(officer).objects.get(pk=officer.pk))
    data = api_client.call("get", f"/api/p/moons/ledger?month={last_month:%Y-%m}").json()
    pilot = next(m for m in data["members"] if m["user_id"] == mined.pk)
    assert pilot["value"] == 200_000 and pilot["partial"]
    assert pilot["invoice"] is None and pilot["tax"] == 20_000  # their own corporation's share, not the 520,000 bill
    assert data["totals"]["tax"] == 20_000
    assert "520000" not in api_client.call("get", f"/api/p/moons/ledger.csv?month={last_month:%Y-%m}").content.decode()

    api_client.force_login(ledger_admin(admin_user))
    data = api_client.call("get", f"/api/p/moons/ledger?month={last_month:%Y-%m}").json()
    pilot = next(m for m in data["members"] if m["user_id"] == mined.pk)
    assert pilot["invoice"]["amount"] == 520_000 and not pilot["partial"]
