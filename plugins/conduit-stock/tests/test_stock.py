"""Doctrine stock: counting from orders and contracts, claims, the low-stock alert and who may do what."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.corp.models import CorpMarketOrder
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType
from conduit.sheet.contracts.models import Contract, ContractItem
from conduit.sheet.market.models import MarketOrder
from conduit.sheet.models import Location
from conduit_stock import services
from conduit_stock.models import Claim, Place, Target
from tests.conftest import make_user

STAGING, ELSEWHERE = 1035466617946, 60003760
FEROX, SCIMITAR, NANITE = 37480, 11978, 28668


@pytest.fixture
def sde(db):
    ItemCategory.objects.create(id=6, name="Ship", published=True)
    ItemCategory.objects.create(id=4, name="Material", published=True)
    ItemGroup.objects.create(id=419, category_id=6, name="Combat Battlecruiser", published=True)
    ItemGroup.objects.create(id=832, category_id=6, name="Logistics", published=True)
    ItemGroup.objects.create(id=1, category_id=4, name="Repair paste", published=True)
    for tid, name, group in ((FEROX, "Ferox Navy Issue", 419), (SCIMITAR, "Scimitar", 832), (NANITE, "Nanite Repair Paste", 1)):
        ItemType.objects.create(id=tid, group_id=group, name=name, published=True, market_group_id=1)
    Location.objects.create(id=STAGING, kind="structure", name="1DQ1-A - Staging Keepstar", solar_system_id=30004759, resolved=True)
    Location.objects.create(id=ELSEWHERE, kind="station", name="Jita IV - Moon 4", solar_system_id=30000142, resolved=True)


@pytest.fixture
def setup(sde, corp):
    sync_installed()
    set_enabled("stock", True)
    seller = make_user(90000001, "Seeder Sue", corporation=corp)
    boss = make_user(90000050, "Logi Boss", corporation=corp)
    boss.user_permissions.add(Permission.objects.get(content_type__app_label="stock", codename="manage_stock"))
    boss = type(boss).objects.get(pk=boss.pk)
    place = Place.objects.create(location_id=STAGING, name="1DQ1-A - Staging Keepstar", label="Main staging")
    return place, seller, boss


def order(char, order_id, type_id, volume, price="100", location=STAGING, buy=False, state="open"):
    return MarketOrder.objects.create(character=char, order_id=order_id, type_id=type_id, is_buy=buy, price=Decimal(price),
                                      volume_total=volume, volume_remain=volume, issued=timezone.now(), duration=90,
                                      location_id=location, region_id=1, range="station", state=state)


def contract(char, contract_id, items, price="1000", location=STAGING, availability="alliance", status="outstanding",
             expires=timedelta(days=10)):
    c = Contract.objects.create(character=char, contract_id=contract_id, type="item_exchange", status=status, availability=availability,
                                issuer_id=char.pk, issuer_corporation_id=1, assignee_id=0, acceptor_id=0, price=Decimal(price),
                                start_location_id=location, end_location_id=location, date_issued=timezone.now(),
                                date_expired=timezone.now() + expires, items_fetched=True)
    for i, (type_id, qty, included) in enumerate(items):
        ContractItem.objects.create(contract=c, record_id=i + 1, type_id=type_id, quantity=qty, is_included=included, is_singleton=False)
    return c


def test_counts_sell_orders_and_contracts_once_each(setup, corp):
    place, seller, boss = setup
    char = seller.main_character
    order(char, 1, FEROX, 3, price="90000000")
    order(char, 2, FEROX, 5, buy=True)  # buy orders aren't stock
    order(char, 3, FEROX, 4, location=ELSEWHERE)  # somewhere else
    order(char, 4, FEROX, 2, state="closed")
    # A corporation order is both in the issuer's own orders and the corporation's: counted once.
    order(char, 5, FEROX, 2, price="85000000")
    CorpMarketOrder.objects.create(corporation=corp, order_id=5, type_id=FEROX, is_buy_order=False, price=Decimal("85000000"),
                                   volume_total=2, volume_remain=2, issued=timezone.now(), duration=90, location_id=STAGING, region_id=1)
    CorpMarketOrder.objects.create(corporation=corp, order_id=6, type_id=FEROX, is_buy_order=False, price=Decimal("95000000"),
                                   volume_total=1, volume_remain=1, issued=timezone.now(), duration=90, location_id=STAGING, region_id=1)
    # A fitted Ferox on contract (hull plus paste), seen by two members: one contract.
    contract(char, 100, [(FEROX, 1, True), (NANITE, 50, True)], price="120000000")
    contract(boss.main_character, 100, [(FEROX, 1, True), (NANITE, 50, True)], price="120000000")
    contract(char, 101, [(FEROX, 1, True)], availability="personal")  # meant for one person
    contract(char, 102, [(FEROX, 1, True)], expires=timedelta(days=-1))
    contract(char, 103, [(FEROX, 1, False), (NANITE, 10, True)])  # asks for a Ferox: not selling one

    got = services.count([(STAGING, FEROX), (STAGING, NANITE)])
    assert got[(STAGING, FEROX)]["have"] == 3 + 2 + 1 + 1
    assert got[(STAGING, FEROX)]["orders"] == 6 and got[(STAGING, FEROX)]["contracts"] == 1
    assert got[(STAGING, FEROX)]["cheapest_order"] == Decimal("85000000")
    assert got[(STAGING, FEROX)]["cheapest_contract"] == Decimal("120000000")  # the fitted ship's price
    # Paste counts in every contract; only a contract of just paste gives its price (1000 ISK for 10).
    assert got[(STAGING, NANITE)]["have"] == 60 and got[(STAGING, NANITE)]["cheapest_contract"] == Decimal("100")


def test_board_claims_and_releasing(setup, api_client):
    place, seller, boss = setup
    t = Target.objects.create(place=place, type_id=FEROX, quantity=10, low=4)
    order(seller.main_character, 1, FEROX, 3)
    api_client.force_login(seller)
    row = api_client.call("get", "/api/p/stock/board").json()["places"][0]["targets"][0]
    assert (row["have"], row["short"], row["claimed"], row["still_short"], row["status"]) == (3, 7, 0, 7, "low")

    assert api_client.call("post", f"/api/p/stock/targets/{t.pk}/claim", {"quantity": 0}).status_code == 400
    assert api_client.call("post", f"/api/p/stock/targets/{t.pk}/claim", {"quantity": 4}).status_code == 200
    assert api_client.call("post", f"/api/p/stock/targets/{t.pk}/claim", {"quantity": 5}).status_code == 200  # changes it
    row = api_client.call("get", "/api/p/stock/board").json()["places"][0]["targets"][0]
    assert (row["claimed"], row["still_short"], row["my_claim"]) == (5, 2, 5)
    assert row["claims"][0]["user"] == "Seeder Sue"

    api_client.call("delete", f"/api/p/stock/targets/{t.pk}/claim")
    assert not Claim.objects.exists()


def test_alert_fires_once_until_it_recovers_and_claims_expire(setup, monkeypatch):
    place, seller, boss = setup
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name == "stock.shortage" and emitted.append((name, kw)))
    t = Target.objects.create(place=place, type_id=SCIMITAR, quantity=6, low=2)
    old = Claim.objects.create(target=t, user=seller, quantity=1, expires_at=timezone.now() - timedelta(hours=1))

    out = services.check()
    assert out["alerts"] == 1 and out["expired_claims"] == 1 and not Claim.objects.filter(pk=old.pk).exists()
    assert len(emitted) == 1 and emitted[0][1]["have"] == 0 and emitted[0][1]["want"] == 6
    assert Notification.objects.filter(user=boss, title="Scimitar is running low at Main staging").count() == 1
    assert services.check()["alerts"] == 0  # not again while it stays low

    order(seller.main_character, 1, SCIMITAR, 6)
    Claim.objects.create(target=t, user=seller, quantity=2, expires_at=timezone.now() + timedelta(days=3))
    out = services.check()
    assert out["alerts"] == 0 and out["filled_claims"] == 1  # fully stocked: the claim is done
    assert not Target.objects.get(pk=t.pk).alerted
    MarketOrder.objects.update(state="closed")
    assert services.check()["alerts"] == 1  # low again: told again


def test_only_managers_set_things_up(setup, api_client):
    place, seller, boss = setup
    api_client.force_login(seller)
    assert api_client.call("get", "/api/p/stock/manage").status_code == 403
    assert api_client.call("post", f"/api/p/stock/places/{place.pk}/targets", {"type_id": FEROX, "quantity": 5}).status_code == 403

    api_client.force_login(boss)
    assert [h["name"] for h in api_client.call("get", "/api/p/stock/search/places?q=jita").json()] == ["Jita IV - Moon 4"]
    assert api_client.call("get", "/api/p/stock/search/types?q=scim").json()[0]["id"] == SCIMITAR
    made = api_client.call("post", "/api/p/stock/places", {"location_id": ELSEWHERE, "label": "Market hub"})
    assert made.status_code == 200 and Place.objects.get(pk=made.json()["id"]).name == "Jita IV - Moon 4"
    again = api_client.call("post", "/api/p/stock/places", {"location_id": ELSEWHERE})
    assert again.status_code == 400 and "already" in again.json()["detail"]

    ok = api_client.call("post", f"/api/p/stock/places/{place.pk}/targets", {"type_id": FEROX, "quantity": 5, "low": 2})
    assert ok.status_code == 200
    dup = api_client.call("post", f"/api/p/stock/places/{place.pk}/targets", {"type_id": FEROX, "quantity": 3})
    assert dup.status_code == 400
    bad = api_client.call("post", f"/api/p/stock/places/{place.pk}/targets", {"type_id": FEROX, "quantity": 3, "low": 9})
    assert bad.status_code == 400
    assert api_client.call("put", "/api/p/stock/settings", {"claim_days": 0}).status_code == 400
    assert api_client.call("put", "/api/p/stock/settings", {"claim_days": 3}).json()["claim_days"] == 3


def test_guests_get_nothing(setup, api_client):
    guest = make_user(90000070, "Just Visiting", member=False)
    api_client.force_login(guest)
    assert api_client.call("get", "/api/p/stock/board").status_code in (403, 404)


def test_doctrine_fit_targets_count_the_hull(setup, api_client):
    from conduit_doctrines.models import Fit

    place, seller, boss = setup
    set_enabled("doctrines", True)
    fit = Fit.objects.create(name="Ferox Fleet", ship_type_id=FEROX, items=[])
    api_client.force_login(boss)
    assert api_client.call("get", "/api/p/stock/search/fits?q=fleet").json()[0]["id"] == fit.pk
    made = api_client.call("post", f"/api/p/stock/places/{place.pk}/targets", {"fit_id": fit.pk, "quantity": 5})
    assert made.status_code == 200 and Target.objects.get(pk=made.json()["id"]).type_id == FEROX
    contract(seller.main_character, 200, [(FEROX, 1, True), (NANITE, 10, True)], price="150000000")
    row = api_client.call("get", "/api/p/stock/board").json()["places"][0]["targets"][0]
    assert row["fit"] == {"id": fit.pk, "name": "Ferox Fleet"} and row["have"] == 1 and row["cheapest_contract"] == 150000000
    missing = api_client.call("post", f"/api/p/stock/places/{place.pk}/targets", {"fit_id": 999999, "quantity": 5})
    assert missing.status_code == 400
