"""Fleets: tracking the in-game fleet, FAT links, manual FATs, attendance and the group rule. ESI is faked."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.access import rules
from conduit.accounts.models import Character
from conduit.esi.exceptions import EsiError
from conduit.eve.models import EveName
from conduit.plugins.services import set_enabled, sync_installed
from conduit_fleets import services
from conduit_fleets.models import Fat, Fleet
from tests.conftest import make_user

FLEET_ID = 1234567


class FakeEsi:
    def __init__(self):
        self.members = []
        self.role = "fleet_commander"
        self.fail = None

    def get(self, path, *, character=None, params=None):
        if self.fail:
            raise EsiError(self.fail, "nope")

        class R:
            pass

        r = R()
        if path.endswith("/fleet"):
            r.data = {"fleet_id": FLEET_ID, "role": self.role, "squad_id": 1, "wing_id": 1}
        elif path == f"/fleets/{FLEET_ID}/members":
            r.data = self.members
        else:
            raise AssertionError(path)
        return r


@pytest.fixture
def esi(monkeypatch):
    fake = FakeEsi()
    monkeypatch.setattr("conduit.esi.client.esi", lambda: fake)
    monkeypatch.setattr(services, "ensure_eve_names", lambda ids: None)
    return fake


@pytest.fixture
def people(db, corp):
    sync_installed()
    set_enabled("fleets", True)
    fc = make_user(90000001, "FC Bob", corporation=corp, scopes="publicData esi-fleets.read_fleet.v1")
    fc.user_permissions.add(Permission.objects.get(codename="run_fleets"))
    pilot = make_user(90000002, "Pilot One", corporation=corp)
    alt = Character.objects.create(id=90000003, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=corp)
    return {"fc": fc, "pilot": pilot, "alt": alt}


def start(api_client, fc, **body):
    api_client.force_login(fc)
    resp = api_client.call("post", "/api/p/fleets", {"name": "Sunday roam", **body})
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_tracking_gives_everyone_in_fleet_a_fat(people, esi, api_client):
    EveName.objects.create(id=777, name="Blue Friend", category="character")
    esi.members = [{"character_id": 90000002, "ship_type_id": 587, "solar_system_id": 30000142},
                   {"character_id": 777, "ship_type_id": 587, "solar_system_id": 30000142}]
    fleet = start(api_client, people["fc"], track_character=90000001)
    assert fleet["tracking"] and fleet["pilots"] == 2 and "warning" not in fleet
    assert {f["character"]["name"] for f in fleet["fats"]} == {"Pilot One", "Blue Friend"}
    # Next minute: the alt joined; nobody is counted twice.
    esi.members.append({"character_id": 90000003, "ship_type_id": 587, "solar_system_id": 30000142})
    assert services.track_all() == 1 and Fat.objects.count() == 3
    # The in-game fleet is gone: tracking stops and says why.
    esi.fail = 404
    services.track_all()
    f = Fleet.objects.get()
    assert not f.tracking and "ended" in f.tracking_error


def test_tracking_needs_the_fleet_boss(people, esi, api_client):
    esi.role = "squad_member"
    fleet = start(api_client, people["fc"], track_character=90000001)
    assert not fleet["tracking"] and "fleet boss" in fleet["warning"]
    # A character without the fleet scope can't track.
    resp = api_client.call("post", f"/api/p/fleets/{fleet['id']}/track", {"character": 90000002})
    assert resp.status_code == 400


def test_fat_link(people, api_client):
    fleet = start(api_client, people["fc"], link_minutes=30)
    code = fleet["link"]["code"]
    api_client.force_login(people["pilot"])
    info = api_client.call("get", f"/api/p/fleets/fat/{code}").json()
    assert info["open"] and {c["name"] for c in info["characters"]} == {"Pilot One", "Pilot Alt"}
    assert "link" not in info  # pilots don't see the FC's controls
    assert api_client.call("post", f"/api/p/fleets/fat/{code}", {"characters": [90000002, 90000003, 90000001]}).json() == {"added": 2}
    # Someone else's character (the FC's) wasn't added; registering again adds nothing.
    assert api_client.call("post", f"/api/p/fleets/fat/{code}", {"characters": [90000002]}).json() == {"added": 0}
    Fleet.objects.update(link_expires_at=timezone.now() - timedelta(minutes=1))
    assert api_client.call("post", f"/api/p/fleets/fat/{code}", {"characters": [90000002]}).status_code == 400
    # The pilot can see the fleet but not its link or controls.
    detail = api_client.call("get", f"/api/p/fleets/{fleet['id']}").json()
    assert detail["attended"] and detail["link"] is None and not detail["can_edit"]


def test_only_fcs_run_fleets(people, api_client):
    api_client.force_login(people["pilot"])
    assert api_client.call("post", "/api/p/fleets", {"name": "Mine"}).status_code == 403
    fleet = start(api_client, people["fc"])
    api_client.force_login(people["pilot"])
    assert api_client.call("post", f"/api/p/fleets/{fleet['id']}/end").status_code == 403
    assert api_client.call("delete", f"/api/p/fleets/{fleet['id']}").status_code == 403


def test_manual_fats_and_ending(people, api_client):
    fleet = start(api_client, people["fc"])
    hits = api_client.call("get", f"/api/p/fleets/{fleet['id']}/candidates?q=pilot").json()
    assert {h["name"] for h in hits} == {"Pilot One", "Pilot Alt"}
    detail = api_client.call("post", f"/api/p/fleets/{fleet['id']}/fats", {"characters": [90000003]}).json()
    assert detail["pilots"] == 1 and detail["fats"][0]["via"] == "manual"
    fat_id = detail["fats"][0]["id"]
    assert api_client.call("delete", f"/api/p/fleets/{fleet['id']}/fats/{fat_id}").json()["pilots"] == 0
    ended = api_client.call("post", f"/api/p/fleets/{fleet['id']}/end").json()
    assert ended["ended_at"] and not ended["link"]["active"]
    assert api_client.call("post", f"/api/p/fleets/{fleet['id']}/end").status_code == 400


def test_attendance_and_the_group_rule(people, api_client):
    cta = next(t for t in services.fleet_types() if t.name == "CTA")
    roam = next(t for t in services.fleet_types() if t.name == "Roam")
    pilot = people["pilot"]
    for i, (ftype, days_ago) in enumerate([(cta, 2), (cta, 10), (roam, 5), (cta, 60)]):
        f = Fleet.objects.create(name=f"Op {i}", fleet_type=ftype, fc=people["fc"], started_at=timezone.now() - timedelta(days=days_ago))
        services.record(f, [(90000002, None, None), (90000003, None, None)], Fat.Via.LINK)  # main and alt: one fleet
    assert services.fleets_attended(pilot, 30) == 3
    assert services.fleets_attended(pilot, 30, ["CTA"]) == 2

    def rule(**params):
        return rules.evaluate_ruleset(pilot, rules.validate_ruleset({"rules": [{"type": "fleets_attended", "params": params}]}))

    assert rule(count=3, days=30)
    assert not rule(count=4, days=30)
    assert rule(count=3, days=90, types="CTA")
    assert not rule(count=3, days=30, types="CTA, Stratop")
    assert rules.explain_rule({"type": "fleets_attended", "params": {"count": 4, "days": 30, "types": "CTA"}}) == \
        "Flew in at least 4 CTA fleets (FATs) in the last 30 days"

    api_client.force_login(pilot)
    me = api_client.call("get", "/api/p/fleets").json()["me"]
    assert me["counts"] == {"days_30": 3, "days_90": 4, "all": 4}
    assert me["by_type_30"][0] == {"type": "CTA", "count": 2}
    assert api_client.call("get", "/api/p/fleets/stats/members").status_code == 403
    manager = people["fc"]
    manager.user_permissions.add(Permission.objects.get(codename="manage_fleets"))
    api_client.force_login(type(manager).objects.get(pk=manager.pk))
    board = api_client.call("get", "/api/p/fleets/stats/members?days=30").json()["members"]
    assert board[0]["name"] == "Pilot One" and board[0]["fleets"] == 3 and board[0]["characters"] == ["Pilot Alt", "Pilot One"]


def test_managers_cant_track_with_someone_elses_character(people, esi, api_client):
    """Tracking reads ESI with the character's login every minute; only its owner may start that."""
    fc = people["fc"]
    fc.user_permissions.add(Permission.objects.get(codename="manage_fleets"))
    fleet = start(api_client, type(fc).objects.get(pk=fc.pk))
    resp = api_client.call("post", f"/api/p/fleets/{fleet['id']}/track", {"character": 90000002})
    assert resp.status_code == 400 and "your own" in resp.json()["detail"]
    assert not Fleet.objects.get(pk=fleet["id"]).tracking


def test_fats_cant_be_farmed_for_group_rules(people, api_client):
    fc, pilot = people["fc"], people["pilot"]
    # An FC adding their own character by hand to fleets they ran themselves: none of it counts.
    for i in range(3):
        f = Fleet.objects.create(name=f"Solo {i}", fc=fc, created_by=fc)
        services.record(f, [(90000001, None, None)], Fat.Via.MANUAL, by=fc)
    assert services.fleets_attended(fc, 30) == 0
    # Added by someone else, it does; and leadership can require real fleets.
    f = Fleet.objects.create(name="Small gang", fc=fc, created_by=fc)
    services.record(f, [(90000002, None, None)], Fat.Via.MANUAL, by=fc)
    assert services.fleets_attended(pilot, 30) == 1
    assert services.fleets_attended(pilot, 30, min_pilots=2) == 0
    services.record(f, [(90000001, None, None)], Fat.Via.LINK)
    assert services.fleets_attended(pilot, 30, min_pilots=2) == 1

    def rule(**params):
        return rules.evaluate_ruleset(pilot, rules.validate_ruleset({"rules": [{"type": "fleets_attended", "params": params}]}))

    assert rule(count=1, days=30) and not rule(count=1, days=30, min_pilots=3)
    assert rules.explain_rule({"type": "fleets_attended", "params": {"count": 2, "days": 30, "types": "", "min_pilots": 10}}) == \
        "Flew in at least 2 fleets of 10+ pilots (FATs) in the last 30 days"


def test_only_managers_change_the_type_of_an_ended_fleet(people, api_client):
    fleet = start(api_client, people["fc"])
    cta = next(t for t in services.fleet_types() if t.name == "CTA")
    api_client.call("post", f"/api/p/fleets/{fleet['id']}/end")
    resp = api_client.call("put", f"/api/p/fleets/{fleet['id']}", {"name": "Sunday roam", "fleet_type": cta.pk})
    assert resp.status_code == 403
    # Renaming is still fine.
    assert api_client.call("put", f"/api/p/fleets/{fleet['id']}", {"name": "Sunday roam!"}).status_code == 200
