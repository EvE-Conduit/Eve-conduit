"""Blueprint library: reading corporation blueprints, the grouped library and who sees it, sharing personal originals,
requests with their notifications, loans coming due, and research."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.corp.models import CorpAsset, CorpIndustryJob, CorporationInfo
from conduit.esi.client import EsiResponse
from conduit.esi.exceptions import EsiError
from conduit.eve.models import EveCorporation
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType
from conduit.sheet.blueprints.models import Blueprint
from conduit.sheet.models import Location
from conduit.sheet.overview.models import CharacterInfo
from conduit_blueprints import services, sync
from conduit_blueprints.models import CorpBlueprint, LibrarySync, Request
from tests.conftest import make_user

HURRICANE, HURRICANE_BP, RIFTER, RIFTER_BP, FULLERIDES, FULLERIDES_BP = 24702, 24703, 587, 691, 16679, 46166
STATION, OFFICE = 60003760, 1_000_000_000_001
SCOPE = "esi-corporations.read_blueprints.v1"
BASE = "/api/p/blueprints"


def grant(user, *codenames):
    for code in codenames:
        user.user_permissions.add(Permission.objects.get(codename=code))
    return type(user).objects.get(pk=user.pk)


@pytest.fixture
def setup(corp):
    sync_installed()
    set_enabled("blueprints", True)
    ItemCategory.objects.create(id=6, name="Ship", published=True)
    ItemCategory.objects.create(id=9, name="Blueprint", published=True)
    ItemCategory.objects.create(id=4, name="Material", published=True)
    ItemGroup.objects.create(id=419, category_id=6, name="Combat Battlecruiser", published=True)
    ItemGroup.objects.create(id=25, category_id=6, name="Frigate", published=True)
    ItemGroup.objects.create(id=105, category_id=9, name="Frigate Blueprint", published=True)
    ItemGroup.objects.create(id=429, category_id=4, name="Composite", published=True)
    ItemGroup.objects.create(id=1888, category_id=9, name="Composite Reaction Formulas", published=True)
    for pk, group, name in ((HURRICANE, 419, "Hurricane"), (HURRICANE_BP, 105, "Hurricane Blueprint"), (RIFTER, 25, "Rifter"),
                            (RIFTER_BP, 105, "Rifter Blueprint"), (FULLERIDES, 429, "Fullerides"),
                            (FULLERIDES_BP, 1888, "Fullerides Reaction Formula")):
        ItemType.objects.create(id=pk, group_id=group, name=name, published=True)
    Location.objects.create(id=STATION, kind="station", name="Jita IV - Moon 4", resolved=True)
    CorporationInfo.objects.create(corporation=corp, hangar_divisions=[{"division": 3, "name": "Blueprints"}])
    manager = grant(make_user(90000100, "Library Boss", corporation=corp), "manage_requests")
    pilot = grant(make_user(90000101, "Pilot Hammer", corporation=corp), "view_library")
    other_corp = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER")
    outsider = grant(make_user(90000102, "Pilot Anvil", corporation=other_corp), "view_library")
    return manager, pilot, outsider


def bp(corp, item_id, type_id, quantity=-1, runs=-1, me=10, te=20, division=3):
    return CorpBlueprint.objects.create(corporation=corp, item_id=item_id, type_id=type_id, location_id=OFFICE,
                                        root_location_id=STATION, location_flag=f"CorpSAG{division}", division=division,
                                        quantity=quantity, runs=runs, material_efficiency=me, time_efficiency=te)


@pytest.fixture
def stocked(setup, corp):
    bp(corp, 1, HURRICANE_BP, me=10, te=20)
    bp(corp, 2, HURRICANE_BP, quantity=-2, runs=10, me=10, te=20)
    bp(corp, 3, HURRICANE_BP, quantity=-2, runs=5, me=8, te=16)
    bp(corp, 4, RIFTER_BP, me=5, te=10)
    bp(corp, 5, FULLERIDES_BP, quantity=-2, runs=20, me=0, te=0)
    return setup


# --- reading corporation blueprints -----------------------------------------------------------------------------------


class FakeEsi:
    def __init__(self, refuse=()):
        self.refuse = set(refuse)
        self.as_character = []

    def get_all_pages(self, path, *, character=None, params=None):
        self.as_character.append(character.pk)
        if character.pk in self.refuse:
            raise EsiError(403, "Character does not have required role(s)")
        assert path == "/corporations/98000001/blueprints"
        return [
            {"item_id": 10, "type_id": HURRICANE_BP, "location_id": OFFICE, "location_flag": "CorpSAG3", "quantity": -1, "runs": -1,
             "material_efficiency": 10, "time_efficiency": 20},
            # In a container that's in the second hangar.
            {"item_id": 11, "type_id": RIFTER_BP, "location_id": 77, "location_flag": "Unlocked", "quantity": -2, "runs": 10,
             "material_efficiency": 4, "time_efficiency": 8},
        ]

    def get(self, path, *, character=None, params=None):
        return EsiResponse({"name": "Jita IV - Moon 4", "system_id": 30000142, "type_id": 1}, 200, {})


def director(char_id, name, corp, roles=("Director",), scopes=SCOPE):
    user = make_user(char_id, name, corporation=corp, scopes=scopes)
    CharacterInfo.objects.create(character=user.main_character, roles=list(roles))
    return user


def test_sync_reads_corp_blueprints_as_a_director(setup, corp):
    CorpAsset.objects.create(corporation=corp, item_id=OFFICE, type_id=27, quantity=1, location_id=STATION, location_type="station",
                             location_flag="OfficeFolder", is_singleton=True, root_location_id=STATION)
    CorpAsset.objects.create(corporation=corp, item_id=77, type_id=3467, quantity=1, location_id=OFFICE, location_type="item",
                             location_flag="CorpSAG2", is_singleton=True, root_location_id=STATION)
    # Nobody able yet: a line member with the scope, a Director without it.
    director(90000200, "Line Pilot", corp, roles=())
    director(90000201, "Scopeless Director", corp, scopes="publicData")
    assert sync.sync_corporation(corp.pk, FakeEsi()) == "no_character"
    assert LibrarySync.objects.get(corporation=corp).result == "no_character"

    refused = director(90000202, "Aaron Refused", corp)
    good = director(90000203, "Zed Director", corp)
    fake = FakeEsi(refuse={refused.main_character_id})
    assert sync.sync_corporation(corp.pk, fake) == "ok"
    assert fake.as_character == [refused.main_character_id, good.main_character_id]
    status = LibrarySync.objects.get(corporation=corp)
    assert status.character_id == good.main_character_id and status.blueprints == 2
    rows = {b.item_id: b for b in CorpBlueprint.objects.filter(corporation=corp)}
    assert rows[10].root_location_id == STATION and rows[10].division == 3
    assert rows[11].root_location_id == STATION and rows[11].division == 2 and rows[11].is_copy
    # The one that worked goes first next time; blueprints that are gone are dropped.
    fake = FakeEsi(refuse={refused.main_character_id})
    fake.get_all_pages = lambda path, character=None, params=None: (fake.as_character.append(character.pk), [])[1]
    assert sync.sync_corporation(corp.pk, fake) == "ok"
    assert fake.as_character == [good.main_character_id] and not CorpBlueprint.objects.filter(corporation=corp).exists()


# --- the library ------------------------------------------------------------------------------------------------------


def test_library_groups_by_product(stocked, api_client):
    manager, pilot, outsider = stocked
    api_client.force_login(pilot)
    data = api_client.call("get", f"{BASE}/library").json()
    groups = {g["name"]: g for g in data["groups"]}
    assert list(groups) == ["Fullerides Reaction Formula", "Hurricane Blueprint", "Rifter Blueprint"]
    h = groups["Hurricane Blueprint"]
    assert h["product"]["name"] == "Hurricane" and h["category"] == "Ship"
    assert (h["originals"], h["copies"], h["copy_runs"], h["best_me"], h["best_te"]) == (1, 2, 15, 10, 20)
    assert h["icon"].endswith("/bp?size=64") and h["owners"] == ["TCORP"]
    assert groups["Fullerides Reaction Formula"]["product"]["name"] == "Fullerides"
    assert groups["Fullerides Reaction Formula"]["icon"].endswith("/bpc?size=64")  # only copies
    assert {c["name"]: c["count"] for c in data["categories"]} == {"Material": 1, "Ship": 2}

    detail = api_client.call("get", f"{BASE}/library/{HURRICANE_BP}").json()
    assert [(e["copy"], e["runs"], e["me"]) for e in detail["entries"]] == [(False, -1, 10), (True, 10, 10), (True, 5, 8)]
    assert detail["entries"][0]["location"]["name"] == "Jita IV - Moon 4" and detail["entries"][0]["division"] == "Blueprints"


@pytest.mark.parametrize("query, names", [
    ("q=hurricane", ["Hurricane Blueprint"]),
    ("category=Ship", ["Hurricane Blueprint", "Rifter Blueprint"]),
    ("kind=original", ["Hurricane Blueprint", "Rifter Blueprint"]),
    ("kind=copy&me_min=1", ["Hurricane Blueprint"]),
    ("kind=original&me_min=8", ["Hurricane Blueprint"]),
    ("source=personal", []),
])
def test_library_filters(stocked, api_client, query, names):
    _, pilot, _ = stocked
    api_client.force_login(pilot)
    assert [g["name"] for g in api_client.call("get", f"{BASE}/library?{query}").json()["groups"]] == names


def test_who_sees_which_library(stocked, api_client, corp):
    manager, pilot, outsider = stocked
    nobody = make_user(90000110, "No Perms", corporation=corp)
    api_client.force_login(nobody)
    assert api_client.call("get", f"{BASE}/library").status_code == 403
    assert api_client.call("post", f"{BASE}/requests", {"type_id": HURRICANE_BP}).status_code == 403
    # Someone in another corporation sees none of this one's...
    api_client.force_login(outsider)
    assert api_client.call("get", f"{BASE}/library").json()["groups"] == []
    assert api_client.call("get", f"{BASE}/library/{HURRICANE_BP}").status_code == 404
    assert api_client.call("post", f"{BASE}/requests", {"type_id": HURRICANE_BP}).status_code == 404
    # ...unless the core lets them read its sheet.
    outsider = grant(outsider, "view_all_corporations")
    api_client.force_login(outsider)
    assert len(api_client.call("get", f"{BASE}/library").json()["groups"]) == 3
    # Request managers see every corporation's; members can't handle requests.
    other = EveCorporation.objects.get(pk=98000002)
    bp(other, 99, RIFTER_BP, me=1, te=2)
    api_client.force_login(manager)
    assert {e["owner"]["ticker"] for e in api_client.call("get", f"{BASE}/library/{RIFTER_BP}").json()["entries"]} == {"TCORP", "OTHER"}
    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/queue").status_code == 403


def test_personal_originals_only_when_shared(stocked, api_client):
    manager, pilot, outsider = stocked
    char = outsider.main_character
    for item_id, quantity, me in ((500, -1, 9), (501, -2, 10)):
        Blueprint.objects.create(character=char, item_id=item_id, type_id=RIFTER_BP, location_id=STATION, root_location_id=STATION,
                                 location_flag="Hangar", quantity=quantity, runs=-1 if quantity == -1 else 3,
                                 material_efficiency=me, time_efficiency=18)
    api_client.force_login(pilot)
    assert all(e["source"] == "corporation" for e in api_client.call("get", f"{BASE}/library/{RIFTER_BP}").json()["entries"])
    # Nobody shares someone else's character.
    assert api_client.call("put", f"{BASE}/sharing/{char.pk}", {"shared": True}).status_code == 404

    api_client.force_login(outsider)
    mine = api_client.call("get", f"{BASE}/sharing").json()
    assert mine == [{**mine[0], "id": char.pk, "shared": False, "originals": 1, "copies": 1}]
    assert api_client.call("put", f"{BASE}/sharing/{char.pk}", {"shared": True}).json()[0]["shared"] is True

    api_client.force_login(pilot)
    entries = api_client.call("get", f"{BASE}/library/{RIFTER_BP}").json()["entries"]
    personal = [e for e in entries if e["source"] == "personal"]
    assert [(e["owner"]["name"], e["copy"], e["me"]) for e in personal] == [("Pilot Anvil", False, 9)]  # copies stay private
    assert [g["name"] for g in api_client.call("get", f"{BASE}/library?source=personal").json()["groups"]] == ["Rifter Blueprint"]
    # A request can be made from a shared original alone.
    assert api_client.call("post", f"{BASE}/requests", {"type_id": RIFTER_BP, "kind": "loan"}).status_code == 200

    # The character moves to another account: the share no longer counts.
    char.user = pilot
    char.save()
    assert not [e for e in api_client.call("get", f"{BASE}/library/{RIFTER_BP}").json()["entries"] if e["source"] == "personal"]
    api_client.force_login(outsider)
    api_client.call("put", f"{BASE}/sharing/{char.pk}", {"shared": False})


# --- requests ---------------------------------------------------------------------------------------------------------


def titles(user):
    return list(Notification.objects.filter(user=user).order_by("pk").values_list("title", flat=True))


def test_copy_request_flow(stocked, api_client, corp, monkeypatch):
    manager, pilot, outsider = stocked
    emitted = []
    real_emit = bus.emit
    monkeypatch.setattr(bus, "emit", lambda name, **kw: (emitted.append((name, kw)) if name.startswith("blueprints.") else None,
                                                                 real_emit(name, **kw))[1])
    api_client.force_login(pilot)
    too_good = api_client.call("post", f"{BASE}/requests", {"type_id": HURRICANE_BP, "min_me": 10, "min_te": 20, "runs": 10, "copies": 2})
    assert too_good.status_code == 200  # the original is ME 10 / TE 20
    r = too_good.json()
    assert (r["status"], r["runs"], r["copies"], r["min_me"]) == ("open", 10, 2, 10)
    assert titles(manager) == ["Pilot Hammer asks for 2 × 10-run copies of Hurricane Blueprint"]
    assert [n for n, _ in emitted] == ["blueprints.request_created"]
    bad = api_client.call("post", f"{BASE}/requests", {"type_id": RIFTER_BP, "min_me": 6})
    assert bad.status_code == 400 and "best the library has is ME 5" in bad.json()["detail"]
    assert api_client.call("post", f"{BASE}/requests", {"type_id": RIFTER_BP, "copies": 101}).status_code == 400
    # Members don't handle requests, their own included.
    assert api_client.call("post", f"{BASE}/requests/{r['id']}/accept", {}).status_code == 403

    api_client.force_login(manager)
    queue = api_client.call("get", f"{BASE}/queue").json()
    assert [q["id"] for q in queue["requests"]] == [r["id"]] and queue["counts"]["active"] == 1
    assert api_client.call("post", f"{BASE}/requests/{r['id']}/accept", {"note": "On it"}).json()["status"] == "accepted"
    assert titles(pilot)[-1] == "Blueprint request accepted: 2 × 10-run copies of Hurricane Blueprint"

    now = timezone.now()
    job = CorpIndustryJob.objects.create(corporation=corp, job_id=4242, installer_id=manager.main_character_id, activity_id=5,
                                         status="active", blueprint_type_id=HURRICANE_BP, product_type_id=HURRICANE_BP, runs=2,
                                         facility_id=STATION, location_id=STATION, start_date=now, end_date=now + timedelta(hours=5))
    CorpIndustryJob.objects.create(corporation=corp, job_id=4243, installer_id=1, activity_id=1, status="active",
                                   blueprint_type_id=HURRICANE_BP, product_type_id=HURRICANE, runs=1, facility_id=STATION,
                                   location_id=STATION, start_date=now, end_date=now + timedelta(hours=5))
    assert [j["job_id"] for j in api_client.call("get", f"{BASE}/requests/{r['id']}/jobs").json()] == [4242]
    # A manufacturing job isn't the one making the copies.
    assert api_client.call("post", f"{BASE}/requests/{r['id']}/start", {"job_id": 4243}).status_code == 400
    started = api_client.call("post", f"{BASE}/requests/{r['id']}/start", {"job_id": job.job_id}).json()
    assert started["status"] == "in_progress" and started["job"] == {**started["job"], "job_id": 4242, "status": "active", "runs": 2}
    assert titles(pilot)[-1] == "Your copies are being made: Hurricane Blueprint"

    delivered = api_client.call("post", f"{BASE}/requests/{r['id']}/deliver", {"note": "In your hangar"}).json()
    assert delivered["status"] == "delivered" and delivered["due_at"] is None and delivered["response"] == "In your hangar"
    assert titles(pilot)[-1] == "Delivered: 2 × 10-run copies of Hurricane Blueprint"
    assert [n for n, _ in emitted][-1] == "blueprints.request_delivered"
    assert api_client.call("post", f"{BASE}/requests/{r['id']}/decline", {}).status_code == 400

    api_client.force_login(pilot)
    mine = api_client.call("get", f"{BASE}/requests").json()
    assert mine[0]["status"] == "delivered" and mine[0]["handled_by"]["name"] == "Library Boss"
    assert api_client.call("post", f"{BASE}/requests/{r['id']}/cancel").status_code == 400


def test_decline_and_cancel(stocked, api_client):
    manager, pilot, outsider = stocked
    first = services.create_request(pilot, {"type_id": RIFTER_BP})
    second = services.create_request(pilot, {"type_id": HURRICANE_BP, "kind": "loan"})
    api_client.force_login(manager)
    assert api_client.call("post", f"{BASE}/requests/{first.pk}/decline", {"note": "We don't copy T1 frigates"}).status_code == 200
    assert Notification.objects.get(user=pilot, title__startswith="Blueprint request declined").body == "We don't copy T1 frigates"
    services.accept(second, manager)
    api_client.force_login(outsider)
    assert api_client.call("post", f"{BASE}/requests/{second.pk}/cancel").status_code == 403
    api_client.force_login(pilot)
    assert api_client.call("post", f"{BASE}/requests/{second.pk}/cancel").json()["status"] == "cancelled"
    # Whoever accepted it is told.
    assert "Pilot Hammer cancelled their request" in titles(manager)


def test_loans_come_due(stocked, api_client):
    manager, pilot, outsider = stocked
    api_client.force_login(pilot)
    copies_only = api_client.call("post", f"{BASE}/requests", {"type_id": FULLERIDES_BP, "kind": "loan"})
    assert copies_only.status_code == 400 and "only copies" in copies_only.json()["detail"]
    r = api_client.call("post", f"{BASE}/requests", {"type_id": HURRICANE_BP, "kind": "loan", "loan_days": 3}).json()
    assert titles(manager)[-1] == "Pilot Hammer asks for a loan of Hurricane Blueprint"
    loan = Request.objects.get(pk=r["id"])
    # Copies are made; a loan is handed over.
    with pytest.raises(services.LibraryError, match="Only copies"):
        services.start(loan, manager)
    before = timezone.now()
    services.deliver(loan, manager)
    loan.refresh_from_db()
    assert timedelta(days=3) <= loan.due_at - before < timedelta(days=3, minutes=1)
    assert titles(pilot)[-1] == "Lent to you: Hurricane Blueprint"
    assert services.remind_overdue() == 0  # not due yet

    later = loan.due_at + timedelta(hours=2)
    assert services.remind_overdue(later) == 1
    assert titles(pilot)[-1] == "Loan overdue: Hurricane Blueprint"
    assert titles(manager)[-1] == "Pilot Hammer's loan of Hurricane Blueprint is overdue"
    assert services.remind_overdue(later + timedelta(hours=1)) == 0  # once a day
    assert services.remind_overdue(later + timedelta(days=1)) == 1
    assert titles(pilot).count("Loan overdue: Hurricane Blueprint") == 2
    assert titles(manager).count("Pilot Hammer's loan of Hurricane Blueprint is overdue") == 1  # managers hear once

    Request.objects.filter(pk=loan.pk).update(due_at=timezone.now() - timedelta(hours=1))
    api_client.force_login(manager)
    queue = api_client.call("get", f"{BASE}/queue?show=loans").json()
    assert queue["requests"][0]["overdue"] is True and queue["counts"] == {"active": 0, "loans": 1, "overdue": 1}
    new_due = (timezone.now() + timedelta(days=2)).isoformat()
    assert api_client.call("post", f"{BASE}/requests/{loan.pk}/due", {"due_at": new_due}).json()["overdue"] is False
    assert api_client.call("post", f"{BASE}/requests/{loan.pk}/returned").json()["status"] == "returned"
    assert titles(pilot)[-1] == "Loan returned: Hurricane Blueprint"
    assert services.remind_overdue(timezone.now() + timedelta(days=30)) == 0


def test_request_for_a_project(stocked, api_client):
    pytest.importorskip("conduit_projects")
    from conduit_projects import services as projects

    manager, pilot, _ = stocked
    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/options").json()["projects"] == []
    set_enabled("projects", True)
    project = projects.save_project(None, {"name": "Hurricane doctrine", "notify": False}, manager)
    assert api_client.call("get", f"{BASE}/options").json()["projects"] == [{"id": project.pk, "name": "Hurricane doctrine"}]
    r = api_client.call("post", f"{BASE}/requests", {"type_id": HURRICANE_BP, "project_id": project.pk}).json()
    assert r["project"] == {"id": project.pk, "name": "Hurricane doctrine"}
    assert api_client.call("post", f"{BASE}/requests", {"type_id": HURRICANE_BP, "project_id": 999999}).status_code == 404


# --- research ---------------------------------------------------------------------------------------------------------


def test_research_overview(stocked, api_client, corp):
    manager, pilot, outsider = stocked
    now = timezone.now()
    for job_id, activity, status, end in ((1, 4, "active", now + timedelta(days=1)), (2, 5, "active", now - timedelta(hours=1)),
                                          (3, 1, "active", now + timedelta(days=1)), (4, 3, "delivered", now - timedelta(days=1))):
        CorpIndustryJob.objects.create(corporation=corp, job_id=job_id, installer_id=1, activity_id=activity, status=status,
                                       blueprint_type_id=RIFTER_BP, product_type_id=RIFTER_BP, runs=1, facility_id=STATION,
                                       location_id=STATION, start_date=now - timedelta(days=2), end_date=end)
    api_client.force_login(pilot)
    data = api_client.call("get", f"{BASE}/research").json()
    assert data["summary"] == {"originals": 2, "researched": 1, "me_short": 1, "te_short": 1}
    assert [(r["name"], r["me"], r["te"], r["division"]) for r in data["unresearched"]] == [("Rifter Blueprint", 5, 10, "Blueprints")]
    # Research and copying only, and a finished job not yet delivered counts as ready.
    assert [(j["job_id"], j["activity"], j["status"]) for j in data["jobs"]] == [(2, "Copying", "ready"), (1, "ME research", "active")]
    api_client.force_login(outsider)
    assert api_client.call("get", f"{BASE}/research").json()["unresearched"] == []
