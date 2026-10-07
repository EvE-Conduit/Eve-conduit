from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.accounts.models import Token
from conduit.sheet import registry
from conduit.sheet.assets.models import Asset
from conduit.sheet.assets.sync import root_locations
from conduit.sheet.models import Location, SyncStatus
from conduit.sheet.tasks import schedule_syncs, sync_section

from .conftest import make_user
from .fake_esi import CID, FakeEsi, load_sde_fixture

ALL_SCOPES = " ".join(["publicData", *registry.all_scopes()])


@pytest.fixture
def pilot(db):
    load_sde_fixture()
    return make_user(CID, "Pilot One", scopes=ALL_SCOPES)


@pytest.fixture
def fake(monkeypatch):
    fake = FakeEsi()
    for target in ("conduit.sheet.tasks.esi", "conduit.sheet.locations.esi", "conduit.eve.tasks.esi"):
        monkeypatch.setattr(target, lambda: fake)
    return fake


def run(section, character_id=CID):
    return sync_section.apply(args=[character_id, section]).get()


def test_core_sections_are_registered_with_scopes():
    assert {"overview", "skills", "wallet", "assets"} <= set(registry.SECTIONS)
    assert "esi-assets.read_assets.v1" in registry.all_scopes()


@pytest.mark.django_db
def test_required_scopes_include_sheet_scopes():
    from conduit.plugins.services import required_scopes

    assert "esi-wallet.read_character_wallet.v1" in required_scopes()


@pytest.mark.django_db
def test_scheduler_queues_due_sections_once(pilot, monkeypatch):
    queued = []
    monkeypatch.setattr("conduit.sheet.tasks.sync_section.delay", lambda *a: queued.append(a))
    assert schedule_syncs() == len(registry.synced())
    assert schedule_syncs() == 0  # already pushed into the future
    assert {s for _, s in queued} == set(registry.synced())


@pytest.mark.django_db
def test_missing_scope_is_recorded_not_fetched(pilot, fake):
    Token.objects.filter(character_id=CID).update(scopes="publicData")
    assert run("wallet") == SyncStatus.Result.MISSING_SCOPES
    assert not any("wallet" in c for c in fake.calls)


@pytest.mark.django_db
def test_errors_back_off(pilot, fake):
    fake.fail.add(f"/characters/{CID}/wallet")
    assert run("wallet") == SyncStatus.Result.ERROR
    status = SyncStatus.objects.get(character_id=CID, section="wallet")
    assert status.failures == 1 and status.next_due > timezone.now() + timedelta(minutes=30)


@pytest.mark.django_db
def test_overview_sync_and_api(pilot, fake, client):
    assert run("overview") == SyncStatus.Result.OK
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/overview").json()
    assert data["description"] == "Fly safe"
    assert data["ship"]["name"] == "Zippy" and data["ship"]["type"]["name"] == "Rifter"
    assert data["location"]["system"]["name"] == "Jita"
    assert data["location"]["docked_at"]["name"].startswith("Jita IV")
    assert data["jump_clones"][0]["location"]["name"] == "Perimeter - Tranquility Trading Tower"
    assert data["implants"][0]["name"] == "Limited Ocular Filter - Beta"
    assert [h["corporation"]["name"] for h in data["corporation_history"]] == ["Test Corp", "State War Academy"]
    assert data["titles"] == ["Line Member"] and data["roles"] == ["Accountant", "Hangar_Take_1"]


@pytest.mark.django_db
def test_skills_sync_and_api(pilot, fake, client):
    assert run("skills") == SyncStatus.Result.OK
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/skills").json()
    assert data["total_sp"] == 53255 and data["attributes"]["perception"] == 27
    assert data["groups"][0]["name"] == "Gunnery" and len(data["groups"][0]["skills"]) == 2
    assert data["queue"][0]["name"] == "Gunnery" and data["queue"][0]["level"] == 5
    assert data["levels"][4] == 1
    widget = client.get("/api/me/skillqueues").json()
    assert widget[0]["training"]["name"] == "Gunnery"


@pytest.mark.django_db
def test_wallet_sync_and_api(pilot, fake, client):
    assert run("wallet") == SyncStatus.Result.OK
    assert run("wallet") == SyncStatus.Result.OK  # re-sync doesn't duplicate rows
    client.force_login(pilot)
    summary = client.get(f"/api/characters/{CID}/wallet").json()
    assert summary["balance"] == pytest.approx(1234567.89)
    assert summary["series"][-1]["balance"] == pytest.approx(1234567.89)
    assert summary["income"] == pytest.approx(500000)
    journal = client.get(f"/api/characters/{CID}/wallet/journal").json()
    assert journal["count"] == 2 and journal["items"][0]["first_party"] == "CONCORD"
    tx = client.get(f"/api/characters/{CID}/wallet/transactions").json()["items"][0]
    assert tx["type"]["name"] == "Tritanium" and tx["total"] == -100000 and tx["client"] == "Market Buddy"
    assert client.get("/api/me/wallet").json()["balance"] == pytest.approx(1234567.89)


def test_root_locations_walk_containers():
    rows = [
        {"item_id": 1, "location_id": 60003760, "location_type": "station"},
        {"item_id": 2, "location_id": 1, "location_type": "item"},
        {"item_id": 3, "location_id": 2, "location_type": "item"},
    ]
    assert root_locations(rows) == {1: 60003760, 2: 60003760, 3: 60003760}


@pytest.mark.django_db
def test_assets_sync_and_api(pilot, fake, client):
    from conduit.eve.tasks import update_market_prices

    update_market_prices.run()
    assert run("assets") == SyncStatus.Result.OK
    assert Asset.objects.get(item_id=1).name == "Zippy"
    client.force_login(pilot)

    locations = client.get("/api/me/assets/locations").json()
    assert locations[0]["location"]["name"].startswith("Jita IV")
    assert locations[0]["value"] == pytest.approx(400000 + 5000 * 4 + 10 * 4)

    tree = client.get(f"/api/characters/{CID}/assets/locations/60003760").json()
    ship = next(n for n in tree if n["name"] == "Zippy")
    assert ship["children"][0]["type"]["name"] == "Tritanium"
    box = next(n for n in tree if n["name"] == "Loot box")
    assert box["children"][0]["quantity"] == 5000

    found = client.get("/api/me/assets/search?q=trit").json()["results"]
    assert {r["inside"] for r in found} == {"Zippy", "Loot box"}


@pytest.mark.django_db
def test_structure_without_scope_stays_restricted(pilot, fake):
    from conduit.sheet.locations import resolve

    Token.objects.filter(character_id=CID).update(scopes="publicData")
    pilot.main_character.refresh_from_db()
    loc = resolve([1035466617946], character=pilot.main_character, client=fake)[1035466617946]
    assert loc.name == "Restricted structure" and not loc.resolved


@pytest.mark.django_db
def test_other_members_need_permission(pilot, fake, client, corp):
    run("wallet")
    viewer = make_user(90000002, "Recruiter", corporation=corp)
    client.force_login(viewer)
    assert client.get(f"/api/characters/{CID}/wallet").status_code == 403

    viewer.user_permissions.add(Permission.objects.get(codename="view_all_characters"))
    viewer = type(viewer).objects.get(pk=viewer.pk)
    client.force_login(viewer)
    assert client.get(f"/api/characters/{CID}/wallet").status_code == 200
    header = client.get(f"/api/characters/{CID}").json()
    assert header["is_mine"] is False and {s["key"] for s in header["sections"]} >= {"overview", "wallet"}


@pytest.mark.django_db
def test_corporation_permission_is_scoped_to_own_corp(pilot, fake, client, corp):
    viewer = make_user(90000003, "Director", corporation=corp)
    viewer.user_permissions.add(Permission.objects.get(codename="view_corporation_characters"))
    client.force_login(viewer)
    assert client.get(f"/api/characters/{CID}").status_code == 403  # pilot isn't in their corp
    pilot.main_character.corporation = corp
    pilot.main_character.save()
    assert client.get(f"/api/characters/{CID}").status_code == 200


@pytest.mark.django_db
def test_location_kinds():
    from conduit.sheet.locations import kind_of

    assert kind_of(30000142) == Location.Kind.SOLAR_SYSTEM
    assert kind_of(60003760) == Location.Kind.STATION
    assert kind_of(1035466617946) == Location.Kind.STRUCTURE


# --- structure names (403 handling) ----------------------------------------------------


@pytest.mark.django_db
def test_refused_structure_is_not_asked_again_with_the_same_character(pilot):
    from conduit.esi.exceptions import EsiError
    from conduit.sheet.locations import resolve

    class Refusing(FakeEsi):
        def get(self, path, *, character=None, params=None):
            self.calls.append((path, character.pk if character else None))
            raise EsiError(403, "Forbidden")

    fake = Refusing()
    alt = make_user(90000077, "Alt").main_character
    alt.user = pilot
    alt.save()
    Token.objects.filter(character=alt).update(scopes=ALL_SCOPES)
    loc = resolve({1040000000001}, character=pilot.main_character, client=fake)[1040000000001]
    assert loc.name == "Restricted structure" and not loc.resolved
    assert {c for _, c in fake.calls} == {CID, alt.pk}  # tried the alt too
    # A day later both are remembered as refused: no new 403s.
    Location.objects.filter(pk=1040000000001).update(updated_at=timezone.now() - timedelta(days=2))
    fake.calls.clear()
    resolve({1040000000001}, character=pilot.main_character, client=fake)
    assert fake.calls == []
