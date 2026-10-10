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
        self.motd = ""
        self.puts = []
        self.put_fail = None

    def put(self, path, body, *, character=None):
        assert path == f"/fleets/{FLEET_ID}"
        if self.put_fail:
            raise EsiError(self.put_fail, "nope")
        self.puts.append(body["motd"])
        self.motd = body["motd"]

    def get(self, path, *, character=None, params=None, cache_response=True):
        if self.fail:
            raise EsiError(self.fail, "nope")

        class R:
            pass

        r = R()
        if path.endswith("/fleet"):
            r.data = {"fleet_id": FLEET_ID, "role": self.role, "squad_id": 1, "wing_id": 1}
        elif path == f"/fleets/{FLEET_ID}/members":
            r.data = self.members
        elif path == f"/fleets/{FLEET_ID}":
            r.data = {"motd": self.motd, "is_free_move": False, "is_registered": False, "is_voice_enabled": False}
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
    fc = make_user(90000001, "FC Bob", corporation=corp, scopes="publicData esi-fleets.read_fleet.v1 esi-fleets.write_fleet.v1")
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
        "At least 4 CTA FATs in the last 30 days"

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
        "At least 2 FATs in fleets of 10+ pilots in the last 30 days"


def test_only_managers_change_the_type_of_an_ended_fleet(people, api_client):
    fleet = start(api_client, people["fc"])
    cta = next(t for t in services.fleet_types() if t.name == "CTA")
    api_client.call("post", f"/api/p/fleets/{fleet['id']}/end")
    resp = api_client.call("put", f"/api/p/fleets/{fleet['id']}", {"name": "Sunday roam", "fleet_type": cta.pk})
    assert resp.status_code == 403
    # Renaming is still fine.
    assert api_client.call("put", f"/api/p/fleets/{fleet['id']}", {"name": "Sunday roam!"}).status_code == 200


FC_TEXT = '<font size="12" color="#ffffffff">Comms: Mumble, Op channel<br>Doctrine: Ferox</font>'


def test_fat_lines_go_below_the_fcs_motd():
    lines = "<b>--- FATs by EvE Conduit ---</b><br>2 with a FAT: A, B"
    assert services.with_fat_lines("", lines) == lines
    assert services.with_fat_lines("<font></font>", lines) == lines
    once = services.with_fat_lines(FC_TEXT, lines)
    assert once == f"{FC_TEXT}<br><br><br>{lines}"  # two empty lines between
    # Rewriting keeps the same gap, however often it happens.
    assert services.with_fat_lines(services.with_fat_lines(once, lines), lines) == once
    # Next time only our lines change, even after the game client rewrote the MOTD's markup.
    rewritten = once.replace("<br>", "<br/>").replace("<b>", '<font color="#ffffffff"><b>')
    again = services.with_fat_lines(rewritten, "<b>--- FATs by EvE Conduit ---</b><br>3 with a FAT: C, A, B")
    assert again.startswith(FC_TEXT.replace("<br>", "<br/>")) and again.endswith("3 with a FAT: C, A, B") and again.count("FATs by") == 1
    # Switched off: our lines come out, the FC's text stays.
    assert services.with_fat_lines(once, "") == FC_TEXT
    # The client moving our gap inside the FC's closing tag doesn't add to it either.
    moved = FC_TEXT[:-len("</font>")] + "<br><br></font><br>" + lines
    assert services.with_fat_lines(moved, lines) == f"{FC_TEXT}<br><br><br>{lines}"


def test_tracking_adds_fat_counts_to_the_motd(people, esi, api_client):
    esi.motd = FC_TEXT
    esi.members = [{"character_id": 90000002, "ship_type_id": 587, "solar_system_id": 30000142}]
    fleet = start(api_client, people["fc"], track_character=90000001, link_minutes=30)
    assert len(esi.puts) == 1 and esi.motd.startswith(FC_TEXT + "<br><br><br><font color=\"#ff00ff00\">")
    assert esi.motd.endswith("Everyone in fleet gets a FAT automatically. 1 pilot so far</font>")
    # Who has a FAT isn't shown, and neither is the FAT link (it can't add anyone to a tracked fleet).
    assert "Pilot One" not in esi.motd and "/p/fleets/fat/" not in esi.motd
    # Nothing new: the MOTD isn't written again.
    services.track_all()
    assert len(esi.puts) == 1
    # The FC changes the MOTD in game, and someone joins: the count goes up, the FC's new text stays.
    esi.motd = esi.motd.replace("Ferox", "Eagle")
    esi.members.append({"character_id": 90000003, "ship_type_id": 587, "solar_system_id": 30000142})
    services.track_all()
    assert "Doctrine: Eagle" in esi.motd and esi.motd.endswith("2 pilots so far</font>") and esi.motd.count("FATs by") == 1
    # A new FAT round starts counting again.
    Fleet.objects.update(round_started_at=timezone.now() - timedelta(hours=1))
    api_client.call("post", f"/api/p/fleets/{fleet['id']}/rounds")
    assert esi.motd.endswith("FAT round 2: 2 pilots so far</font>")
    # Ending the fleet says so in the MOTD, counting each pilot once.
    api_client.call("post", f"/api/p/fleets/{fleet['id']}/end")
    assert esi.motd.startswith(FC_TEXT.replace("Ferox", "Eagle") + "<br><br><br>") and esi.motd.endswith("Fleet ended: 2 pilots got a FAT</font>")


def test_fat_rounds(people, esi, api_client):
    esi.members = [{"character_id": 90000002, "ship_type_id": 587, "solar_system_id": 30000142}]
    fleet = start(api_client, people["fc"], track_character=90000001)
    # Not straight after the last one.
    resp = api_client.call("post", f"/api/p/fleets/{fleet['id']}/rounds")
    assert resp.status_code == 400 and "15 minutes apart" in resp.json()["detail"]
    Fleet.objects.update(started_at=timezone.now() - timedelta(minutes=20))
    detail = api_client.call("post", f"/api/p/fleets/{fleet['id']}/rounds").json()
    # Everyone in the in-game fleet got round 2's FAT straight away; the alt only joins for round 2.
    assert detail["round"] == 2 and detail["fat_count"] == 2 and detail["pilots"] == 1
    esi.members.append({"character_id": 90000003, "ship_type_id": 587, "solar_system_id": 30000142})
    services.track_all()
    detail = api_client.call("get", f"/api/p/fleets/{fleet['id']}").json()
    assert detail["rounds"] == [{"round": 2, "pilots": 2}, {"round": 1, "pilots": 1}] and detail["pilots"] == 2
    assert sum(s["count"] for s in detail["ships"]) in (0, 2)  # one ship per pilot, not per FAT
    # Two FATs for the member (main in both rounds, alt in round 2 counts once with the main), one fleet.
    assert services.fleets_attended(people["pilot"], 30) == 2
    api_client.force_login(people["pilot"])
    me = api_client.call("get", "/api/p/fleets").json()["me"]
    assert me["counts"]["days_30"] == 2 and me["fleets"][0]["fats"] == 2
    assert sorted(me["fleets"][0]["characters"]) == ["Pilot Alt", "Pilot One"]
    listed = api_client.call("get", "/api/p/fleets").json()["fleets"][0]
    assert listed["pilots"] == 2 and listed["round"] == 2


def test_fat_link_on_a_tracked_fleet_only_takes_pilots_in_the_fleet(people, esi, api_client):
    esi.members = [{"character_id": 90000002, "ship_type_id": 587, "solar_system_id": 30000142}]
    fleet = start(api_client, people["fc"], track_character=90000001)
    code = fleet["link"]["code"]
    assert fleet["link"]["tracked_only"]
    api_client.force_login(people["pilot"])
    info = api_client.call("get", f"/api/p/fleets/fat/{code}").json()
    assert info["tracked"] and {c["name"]: (c["registered"], c["allowed"]) for c in info["characters"]} == {
        "Pilot One": (True, True), "Pilot Alt": (False, False)}
    # The alt wasn't in the in-game fleet: it can't be registered, alone or along with the main.
    for ids in ([90000003], [90000002, 90000003]):
        resp = api_client.call("post", f"/api/p/fleets/fat/{code}", {"characters": ids})
        assert resp.status_code == 400 and "Pilot Alt wasn't seen in the in-game fleet" in resp.json()["detail"]
    assert not Fat.objects.filter(character_id=90000003).exists()
    # Seen in round 1 isn't enough for round 2.
    Fleet.objects.update(started_at=timezone.now() - timedelta(minutes=20))
    esi.members = []
    api_client.force_login(people["fc"])
    api_client.call("post", f"/api/p/fleets/{fleet['id']}/rounds")
    api_client.force_login(people["pilot"])
    assert api_client.call("post", f"/api/p/fleets/fat/{code}", {"characters": [90000002]}).status_code == 400


def test_motd_can_be_switched_off(people, esi, api_client):
    esi.motd = FC_TEXT
    fleet = start(api_client, people["fc"], track_character=90000001, motd=False)
    assert esi.puts == [] and not fleet["tracking_info"]["motd"]
    detail = api_client.call("post", f"/api/p/fleets/{fleet['id']}/motd", {"on": True}).json()
    assert detail["tracking_info"]["motd"] and esi.motd.endswith("0 pilots so far</font>")
    api_client.call("post", f"/api/p/fleets/{fleet['id']}/motd", {"on": False})
    assert esi.motd == FC_TEXT


def test_motd_needs_the_scope_and_says_why_it_failed(people, esi, api_client):
    token = Character.objects.get(pk=90000001).token
    token.scopes = "publicData esi-fleets.read_fleet.v1"
    token.save()
    fleet = start(api_client, people["fc"], track_character=90000001)
    assert fleet["tracking"] and esi.puts == [] and "log in with it again" in fleet["tracking_info"]["motd_error"]
    token.scopes += " esi-fleets.write_fleet.v1"
    token.save()
    esi.put_fail = 403
    services.track_all()
    assert "no longer the fleet boss" in Fleet.objects.get().motd_error
    # Not retried every minute while nothing changed.
    esi.put_fail = None
    services.track_all()
    assert esi.puts == []
