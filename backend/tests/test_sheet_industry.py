import pytest

from conduit.sheet.contracts.models import Contract
from conduit.sheet.market.models import MarketOrder
from conduit.sheet.models import SyncStatus

from .fake_esi import CID
from .test_sheet import fake, pilot, run  # noqa: F401  (fixtures)


@pytest.mark.django_db
def test_blueprints(pilot, fake, client):
    run("assets")  # the BPO sits in a container; assets tell us where that container is
    assert run("blueprints") == SyncStatus.Result.OK
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/blueprints").json()["items"]
    original = next(b for b in data if not b["copy"])
    assert original["location"]["name"].startswith("Jita IV") and original["me"] == 10 and original["runs"] == -1
    assert "/bp?" in original["type"]["icon"]  # the image server has no /icon for blueprints
    copies = client.get(f"/api/characters/{CID}/blueprints?kind=copy").json()
    assert copies["count"] == 1 and copies["items"][0]["runs"] == 5 and "/bpc?" in copies["items"][0]["type"]["icon"]
    assert client.get(f"/api/characters/{CID}/blueprints/summary").json() == {"originals": 1, "copies": 1, "researched": 1}


@pytest.mark.django_db
def test_industry(pilot, fake, client):
    assert run("industry") == SyncStatus.Result.OK
    assert run("industry") == SyncStatus.Result.OK
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/industry").json()
    assert data["active"][0]["activity"] == "Manufacturing" and data["active"][0]["product"]["name"] == "Rifter"
    assert 0 < data["active"][0]["progress"] < 1
    history = client.get(f"/api/characters/{CID}/industry/history").json()["items"]
    assert history[0]["activity"] == "Invention" and history[0]["probability"] == 0.34


@pytest.mark.django_db
def test_research(pilot, fake, client):
    assert run("research") == SyncStatus.Result.OK
    client.force_login(pilot)
    agent = client.get(f"/api/characters/{CID}/research").json()["agents"][0]
    assert agent["agent"]["name"] == "Research Agent" and agent["field"]["name"] == "Gunnery"
    assert agent["points"] > 10  # accrues since started_at


@pytest.mark.django_db
def test_mining(pilot, fake, client, monkeypatch):
    from datetime import datetime, timezone

    from conduit.eve.tasks import update_market_prices

    update_market_prices.run()
    assert run("mining") == SyncStatus.Result.OK
    monkeypatch.setattr("django.utils.timezone.now", lambda: datetime(2099, 1, 2, tzinfo=timezone.utc))
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/mining").json()
    assert data["ores"][0]["type"]["name"] == "Tritanium" and data["ores"][0]["quantity"] == 1000
    assert data["total_value"] == pytest.approx(4000) and data["total_volume"] == pytest.approx(10)
    assert data["systems"][0]["system"]["name"] == "Jita"


@pytest.mark.django_db
def test_planets(pilot, fake, client):
    assert run("planets") == SyncStatus.Result.OK
    client.force_login(pilot)
    colony = client.get(f"/api/characters/{CID}/planets").json()[0]
    assert colony["name"] == "Jita I" and colony["any_expired"] is True
    assert colony["extractors"][0]["product"]["name"] == "Tritanium"
    assert colony["factories"] == [{"schematic": "Superconductors", "count": 1}]
    assert colony["storage"][0]["amount"] == 777


@pytest.mark.django_db
def test_market_orders_and_filled_detection(pilot, fake, client):
    assert run("market") == SyncStatus.Result.OK
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/market").json()
    assert data["sell_value"] == pytest.approx(2200) and data["escrow"] == pytest.approx(600000)
    # Order 100 disappears from the open list without appearing in history: it was filled.
    fake.routes[f"/characters/{CID}/orders"] = [r for r in fake.routes[f"/characters/{CID}/orders"] if r["order_id"] != 100]
    run("market")
    assert MarketOrder.objects.get(order_id=100).state == MarketOrder.State.CLOSED
    history = client.get(f"/api/characters/{CID}/market/history").json()["items"]
    assert {h["state"] for h in history} == {"closed", "expired"}


@pytest.mark.django_db
def test_contracts(pilot, fake, client):
    from conduit.eve.tasks import update_market_prices

    update_market_prices.run()
    assert run("contracts") == SyncStatus.Result.OK
    assert Contract.objects.get(contract_id=7).items_fetched
    assert sum(1 for c in fake.calls if c.endswith("/items")) == 1  # couriers have no items call
    run("contracts")
    assert sum(1 for c in fake.calls if c.endswith("/items")) == 1  # fetched once only

    client.force_login(pilot)
    open_ = client.get(f"/api/characters/{CID}/contracts").json()["items"]
    assert open_[0]["direction"] == "issued" and open_[0]["assignee"] == "Market Buddy"
    done = client.get(f"/api/characters/{CID}/contracts?state=closed").json()["items"]
    assert done[0]["type"] == "courier" and done[0]["end"]["name"] == "Perimeter - Tranquility Trading Tower"
    detail = client.get(f"/api/characters/{CID}/contracts/7").json()
    assert {i["type"]["name"] for i in detail["items"]} == {"Rifter", "Tritanium"}
    assert sum(i["value"] for i in detail["items"]) == pytest.approx(400000 + 2000)
