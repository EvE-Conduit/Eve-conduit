"""Moon mining ledger: grouping by member, valuation, tax, closing months and payments."""

from datetime import timedelta

import pytest
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.corp.models import MiningObservation
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
    return admin_user


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
