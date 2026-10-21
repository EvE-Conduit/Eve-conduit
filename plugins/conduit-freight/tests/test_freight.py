"""Freight: prices, matching courier contracts to routes and checking them, and who may see and run what."""

from datetime import timedelta
from decimal import Decimal

import pytest
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import SolarSystem
from conduit.sheet.models import Location as Place
from conduit_freight import contracts, services
from conduit_freight.models import Contract, Route, Service
from django.contrib.auth.models import Group, Permission
from django.utils import timezone
from tests.conftest import make_user

CORP_ID = 98000001
JITA, AMARR, PERIMETER = 30000142, 30002187, 30000144
JITA_44, AMARR_HUB = 60003760, 60008494
KEEPSTAR = 1035466617946


@pytest.fixture
def sde(db):
    SolarSystem.objects.create(id=JITA, constellation_id=1, region_id=1, name="Jita", security_status=0.95)
    SolarSystem.objects.create(id=AMARR, constellation_id=2, region_id=2, name="Amarr", security_status=1.0)
    SolarSystem.objects.create(id=PERIMETER, constellation_id=1, region_id=1, name="Perimeter", security_status=0.95)
    Place.objects.create(id=JITA_44, kind="station", name="Jita IV - Moon 4", solar_system_id=JITA, resolved=True)
    Place.objects.create(id=AMARR_HUB, kind="station", name="Amarr VIII", solar_system_id=AMARR, resolved=True)
    Place.objects.create(id=KEEPSTAR, kind="structure", name="Perimeter - Tranquility Trading Tower", solar_system_id=PERIMETER, resolved=True)


@pytest.fixture
def customer(sde, corp):
    sync_installed()
    set_enabled("freight", True)
    return make_user(90000001, "Customer One", corporation=corp)


def grant(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(content_type__app_label="freight", codename__in=codenames))
    return type(user).objects.get(pk=user.pk)  # fresh permission cache


@pytest.fixture
def boss(customer, corp):
    user = make_user(90000050, "Freight Boss", corporation=corp,
                     scopes="esi-contracts.read_character_contracts.v1 esi-contracts.read_corporation_contracts.v1")
    return grant(user, "manage_freight")


@pytest.fixture
def service(boss):
    s = Service.objects.create(name="Highsec freight", owner=boss.main_character, is_corporation=True, days_to_complete=3)
    # Jita 4-4 <-> Amarr hub, both ways; and anywhere in Perimeter to Amarr's system, one way only.
    Route.objects.create(service=s, start_name="Jita 4-4", start_system_id=JITA, start_location_id=JITA_44, end_name="Amarr VIII",
                         end_system_id=AMARR, end_location_id=AMARR_HUB, jumps=9, base_price=Decimal("1000000"), price_per_m3=Decimal("500"),
                         price_per_jump=Decimal("100000"), collateral_percent=Decimal("1"), max_volume=60000, max_collateral=Decimal("3000000000"))
    Route.objects.create(service=s, start_name="Perimeter", start_system_id=PERIMETER, end_name="Amarr", end_system_id=AMARR, both_ways=False,
                         min_reward=Decimal("5000000"))
    return s


def jita_amarr(service):
    return service.routes.get(start_system_id=JITA)


# --- prices ---------------------------------------------------------------------------------------------------------


def test_price_adds_base_volume_jumps_and_collateral(service):
    r = jita_amarr(service)
    # 1M base + 10,000 m³ at 500 + 9 jumps at 100k + 1% of 1B collateral = 1M + 5M + 0.9M + 10M
    assert services.price(r, 10_000, Decimal("1000000000")) == Decimal("16900000")
    # Unknown jumps cost nothing extra; the minimum reward still applies.
    perimeter = service.routes.get(start_system_id=PERIMETER)
    assert services.price(perimeter, 1, Decimal("0")) == Decimal("5000000")
    # Fractions of an ISK round up.
    r.price_per_m3 = Decimal("0.5")
    assert services.price(r, 1.5, Decimal("0")) == Decimal("1900001")


def test_quote_gives_the_contract_and_flags_limits(service):
    r = jita_amarr(service)
    q = services.quote(service, r.pk, 70_000, 4_000_000_000)
    assert q["terms"]["assignee"] == {"id": CORP_ID, "name": "Test Corp", "kind": "corporation"}
    assert (q["terms"]["days_to_complete"], q["terms"]["expiration_days"]) == (3, 7)
    assert q["route"]["start"]["name"] == "Jita 4-4" and q["route"]["end"]["system"]["name"] == "Amarr"
    assert q["problems"] == ["This route takes up to 60,000 m³.", "This route takes up to 3,000,000,000 ISK collateral."]
    with pytest.raises(services.FreightError):
        services.quote(service, r.pk, 0, 0)
    r.active = False
    r.save()
    with pytest.raises(services.FreightError):
        services.quote(service, r.pk, 10, 0)


def test_routes_look_up_their_jumps(service):
    class FakeRoute:
        def get(self, path, **kwargs):
            assert path == f"/route/{JITA}/{AMARR}"
            return type("R", (), {"data": list(range(10))})()

    data = {"start_name": "Jita", "start_system_id": JITA, "end_name": "Amarr", "end_system_id": AMARR}
    assert services.save_route(service, None, data, client=FakeRoute()).jumps == 9
    # Typed in by hand wins.
    assert services.save_route(service, None, {**data, "jumps": 12}, client=FakeRoute()).jumps == 12
    with pytest.raises(services.FreightError):
        services.save_route(service, None, {**data, "end_system_id": 1})


# --- contracts -------------------------------------------------------------------------------------------------------


class FakeEsi:
    def __init__(self, routes):
        self.routes = routes

    def get_all_pages(self, path, character=None, params=None):
        return self.routes.get(path, [])


def row(contract_id, start, end, reward, collateral=0, volume=10_000, assignee=CORP_ID, status="outstanding", issuer=90000001, kind="courier",
        days=3, **extra):
    return {"contract_id": contract_id, "type": kind, "title": "", "reward": reward, "collateral": collateral, "volume": volume,
            "assignee_id": assignee, "issuer_id": issuer, "issuer_corporation_id": CORP_ID, "status": status, "availability": "personal",
            "for_corporation": False, "start_location_id": start, "end_location_id": end, "days_to_complete": days,
            "date_issued": "2026-10-09T10:00:00Z", "date_expired": "2099-10-23T10:00:00Z", **extra}


@pytest.fixture
def offline(monkeypatch):
    monkeypatch.setattr("conduit.eve.tasks.ensure_eve_names", lambda ids: None)
    # Every place in these tests is already known (see ``sde``); keep the lookup offline anyway.
    monkeypatch.setattr("conduit.sheet.locations.resolve", lambda ids, **k: {p.pk: p for p in Place.objects.filter(pk__in=ids)})


def codes(contract_id):
    return [p["code"] for p in Contract.objects.get(contract_id=contract_id).problems]


def test_contracts_are_matched_to_routes_and_checked(service, customer, boss, offline):
    owner = boss.main_character.pk
    good = 1_000_000 + 5_000_000 + 900_000 + 10_000_000  # 10,000 m³, 1B collateral
    esi = FakeEsi({
        f"/corporations/{CORP_ID}/contracts": [
            row(1, JITA_44, AMARR_HUB, good, collateral=1_000_000_000),
            row(2, AMARR_HUB, JITA_44, 2_000_000, collateral=1_000_000_000),  # the other way: fine, but pays too little
            row(3, KEEPSTAR, AMARR_HUB, 5_000_000),  # Perimeter anywhere -> Amarr system: matches the system-wide route
            row(4, AMARR_HUB, KEEPSTAR, 5_000_000),  # that route is one way only
            row(5, JITA_44, AMARR_HUB, 76_900_000, volume=70_000, collateral=4_000_000_000, days=1),
            row(6, JITA_44, AMARR_HUB, good, kind="item_exchange"),
            row(7, JITA_44, AMARR_HUB, good, assignee=12345),
        ],
        f"/characters/{owner}/contracts": [
            # Made out to the boss instead of the corporation.
            row(8, JITA_44, AMARR_HUB, good, collateral=1_000_000_000, assignee=owner),
        ],
    })
    assert contracts.sync_owner(owner, client=esi) == {"seen": 6, "new": 6}
    c1, c3 = Contract.objects.get(contract_id=1), Contract.objects.get(contract_id=3)
    assert c1.problems == [] and c1.route == jita_amarr(service) and c1.expected_reward == Decimal(good) and c1.service == service
    assert codes(2) == ["reward_low"]
    assert c3.problems == [] and c3.route.start_system_id == PERIMETER
    assert codes(4) == ["wrong_route"] and Contract.objects.get(contract_id=4).route is None
    assert codes(5) == ["volume_high", "collateral_high", "days_short"]
    assert codes(8) == ["wrong_assignee"]
    assert not Contract.objects.filter(contract_id__in=[6, 7]).exists()
    # Haulers and managers hear about new contracts, louder when something's wrong.
    notes = list(Notification.objects.filter(user=boss))
    assert len(notes) == 6 and all(n.category == "p.freight" for n in notes)
    assert sorted(n.level for n in notes).count("warning") == 4

    # Accepted and delivered: tracked, and the next run creates nothing new.
    esi.routes[f"/corporations/{CORP_ID}/contracts"][0] = row(1, JITA_44, AMARR_HUB, good, collateral=1_000_000_000, status="finished",
                                                              acceptor_id=90000077, date_completed="2026-10-10T08:00:00Z")
    assert contracts.sync_owner(owner, client=esi)["new"] == 0
    c1.refresh_from_db()
    assert c1.status == "finished" and c1.acceptor_id == 90000077
    stats = services.statistics(service)
    assert (stats["delivered"], stats["open"], stats["problems"]) == (1, 5, 4)


def test_late_and_stale_contracts_are_flagged(service, boss):
    now = timezone.now()
    r = jita_amarr(service)
    late = Contract(contract_id=1, service=service, owner_id=CORP_ID, issuer_id=1, assignee_id=CORP_ID, status="in_progress", reward=services.price(r, 1, Decimal(0)),
                    volume=1, days_to_complete=3, date_issued=now - timedelta(days=5), date_accepted=now - timedelta(days=4))
    assert [p["code"] for p in contracts.check(late, service, r)] == ["overdue"]
    stale = Contract(contract_id=2, service=service, owner_id=CORP_ID, issuer_id=1, assignee_id=CORP_ID, status="outstanding", reward=services.price(r, 1, Decimal(0)),
                     volume=1, days_to_complete=3, date_issued=now - timedelta(days=9), date_expired=now - timedelta(days=2))
    assert [p["code"] for p in contracts.check(stale, service, r)] == ["expired"]


def test_changing_routes_rechecks_open_contracts(service, customer, boss, offline):
    owner = boss.main_character.pk
    contracts.sync_owner(owner, client=FakeEsi({f"/corporations/{CORP_ID}/contracts": [row(4, AMARR_HUB, KEEPSTAR, 5_000_000)]}))
    assert codes(4) == ["wrong_route"]
    service.routes.filter(start_system_id=PERIMETER).update(both_ways=True)
    contracts.recheck(service)
    assert codes(4) == []


# --- access and the API ------------------------------------------------------------------------------------------


def test_members_see_services_meant_for_them(service, customer, api_client):
    api_client.force_login(customer)
    data = api_client.get("/api/p/freight/services").json()
    assert [s["id"] for s in data["services"]] == [service.pk] and not data["sees_queue"] and not data["can_manage"]
    r = jita_amarr(service)
    q = api_client.call("post", f"/api/p/freight/services/{service.pk}/quote", {"route_id": r.pk, "volume": 10_000, "collateral": 1_000_000_000})
    assert q.json()["reward"] == 16_900_000
    haulers = Group.objects.create(name="Haulers")
    service.groups.add(haulers)
    assert api_client.get("/api/p/freight/services").json()["services"] == []
    assert api_client.call("post", f"/api/p/freight/services/{service.pk}/quote", {"route_id": r.pk, "volume": 1}).status_code == 404
    assert api_client.get("/api/p/freight/queue").status_code == 403
    assert api_client.get("/api/p/freight/manage").status_code == 403


def test_haulers_see_the_queue(service, customer, boss, offline, api_client):
    contracts.sync_owner(boss.main_character.pk, client=FakeEsi({f"/corporations/{CORP_ID}/contracts": [
        row(1, JITA_44, AMARR_HUB, 1), row(2, JITA_44, AMARR_HUB, 50_000_000, status="in_progress"), row(3, JITA_44, AMARR_HUB, 1, status="finished"),
    ]}))
    hauler = grant(customer, "view_contracts")
    api_client.force_login(hauler)
    data = api_client.get("/api/p/freight/queue").json()
    assert data["counts"] == {"waiting": 1, "in_transit": 1, "done": 1, "problems": 2}
    assert [c["contract_id"] for c in data["contracts"]] == [1] and data["contracts"][0]["severe"]
    assert data["contracts"][0]["start"] == "Jita IV - Moon 4"
    assert [c["contract_id"] for c in api_client.get("/api/p/freight/queue?show=done").json()["contracts"]] == [3]
    assert api_client.get("/api/p/freight/me").json()["contracts"][0]["issuer"]["id"] == 90000001


def test_managers_run_services(customer, boss, api_client, monkeypatch):
    monkeypatch.setattr(services, "count_jumps", lambda a, b, client=None: 9)
    api_client.force_login(boss)
    s = api_client.call("post", "/api/p/freight/manage/services", {"name": "Freight", "owner_id": boss.main_character.pk}).json()
    # Only your own characters can be the owner.
    assert api_client.call("post", "/api/p/freight/manage/services", {"name": "X", "owner_id": customer.main_character.pk}).status_code == 400
    r = api_client.call("post", f"/api/p/freight/manage/services/{s['id']}/routes", {
        "start_name": "Jita 4-4", "start_system_id": JITA, "start_location_id": JITA_44, "end_name": "Amarr", "end_system_id": AMARR,
        "price_per_m3": 800,
    }).json()
    assert r["jumps"] == 9 and r["start"]["system"]["name"] == "Jita"
    assert api_client.call("put", f"/api/p/freight/manage/routes/{r['id']}", {**r | {"start_name": "Jita", "start_system_id": JITA, "end_name": "Amarr",
                                                                                  "end_system_id": AMARR, "jumps": 10}}).json()["jumps"] == 10
    listing = api_client.get("/api/p/freight/manage").json()["services"]
    assert listing[0]["routes"] == 1 and listing[0]["owner"]["login_ok"]
    assert api_client.call("delete", f"/api/p/freight/manage/routes/{r['id']}").status_code == 200
    assert api_client.call("delete", f"/api/p/freight/manage/services/{s['id']}").status_code == 200
    assert not Service.objects.exists()


def test_public_calculator(service, client):
    r = jita_amarr(service)
    assert client.get("/api/public/p/freight/services").json()["services"] == []
    assert client.post(f"/api/public/p/freight/services/{service.pk}/quote", {"route_id": r.pk, "volume": 1}, content_type="application/json").status_code == 404
    service.public = True
    service.save()
    assert [s["id"] for s in client.get("/api/public/p/freight/services").json()["services"]] == [service.pk]
    q = client.post(f"/api/public/p/freight/services/{service.pk}/quote", {"route_id": r.pk, "volume": 10_000, "collateral": 1_000_000_000},
                    content_type="application/json")
    assert q.json()["reward"] == 16_900_000
