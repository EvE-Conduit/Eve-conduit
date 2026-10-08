"""Mentoring: asking, claiming and assigning, goals, the thread, sheet access, graduation and the group rules."""

import pytest
from django.contrib.auth.models import Permission

from conduit.access import rules
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sheet.access import can_view
from conduit.sheet.skills.models import SkillSummary
from conduit_mentors import services
from conduit_mentors.models import Goal, Mentorship, Program
from tests.conftest import make_user

BASE = "/api/p/mentors"


def give(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(codename__in=codenames))
    return type(user).objects.get(pk=user.pk)  # drop the permission cache


@pytest.fixture
def people(db):
    sync_installed()
    set_enabled("mentors", True)
    mentor = give(make_user(90000010, "Mentor Mia"), "mentor")
    other = give(make_user(90000011, "Mentor Max"), "mentor")
    manager = give(make_user(90000012, "Program Pat"), "manage_program")
    newbro = make_user(90000020, "New Bro")
    stranger = make_user(90000030, "Stranger")
    return {"mentor": mentor, "other": other, "manager": manager, "newbro": newbro, "stranger": stranger}


def login(api_client, user):
    api_client.force_login(user)
    return api_client


def test_ask_by_name_notifies_and_announces(people, api_client, monkeypatch):
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name.startswith("mentors.") and emitted.append(name))
    c = login(api_client, people["newbro"])
    home = c.call("get", BASE).json()
    assert home["mine"] is None and {m["name"] for m in home["mentors"]} == {"Mentor Mia", "Mentor Max"}
    resp = c.call("post", f"{BASE}/request", {"focus": ["pvp", "Nonsense"], "note": "Want to learn to fight", "mentor_id": people["mentor"].pk})
    assert resp.status_code == 200, resp.content
    m = resp.json()
    assert m["status"] == "waiting" and m["focus"] == ["PvP"] and m["requested_mentor"]["name"] == "Mentor Mia"
    assert Notification.objects.filter(user=people["mentor"], title="New Bro asked you to be their mentor").exists()
    assert not Notification.objects.filter(user=people["other"]).exists()
    assert emitted == ["mentors.requested"]
    assert c.call("post", f"{BASE}/request", {}).status_code == 400  # one at a time
    # Asking for anyone tells every active mentor.
    c.call("post", f"{BASE}/m/{m['id']}/withdraw")
    c.call("post", f"{BASE}/request", {"note": "Anyone"})
    assert Notification.objects.filter(user=people["other"], title="New Bro is looking for a mentor").exists()


def test_claim_respects_capacity_but_managers_can_assign(people, api_client):
    mentor, newbro = people["mentor"], people["newbro"]
    services.save_profile(mentor, {"capacity": 1})
    first = services.request_mentor(newbro)
    second = services.request_mentor(people["stranger"])
    c = login(api_client, mentor)
    waiting = c.call("get", BASE).json()["waiting"]
    assert {w["mentee"]["name"] for w in waiting} == {"New Bro", "Stranger"}
    claimed = c.call("post", f"{BASE}/m/{first.pk}/claim").json()
    assert claimed["status"] == "active" and claimed["mentor"]["name"] == "Mentor Mia" and claimed["role"] == "mentor"
    assert Notification.objects.filter(user=newbro, title="Mentor Mia is your mentor").exists()
    full = c.call("post", f"{BASE}/m/{second.pk}/claim")
    assert full.status_code == 400 and "your limit" in full.json()["detail"]
    # Not open to new members any more.
    assert people["mentor"].pk not in [m["id"] for m in services.mentors_out(available_only=True)]
    # A manager can go over the limit, and hand a mentee to someone else.
    c = login(api_client, people["manager"])
    assert c.call("post", f"{BASE}/m/{second.pk}/assign", {"mentor_id": mentor.pk}).json()["mentor"]["name"] == "Mentor Mia"
    moved = c.call("post", f"{BASE}/m/{first.pk}/assign", {"mentor_id": people["other"].pk}).json()
    assert moved["mentor"]["name"] == "Mentor Max"
    assert Notification.objects.filter(user=mentor, title="New Bro has a new mentor").exists()
    # Plain members can't claim or assign.
    c = login(api_client, people["stranger"])
    assert c.call("post", f"{BASE}/m/{first.pk}/assign", {"mentor_id": mentor.pk}).status_code == 403


def test_who_sees_what(people, api_client):
    m = services.request_mentor(people["newbro"])
    # Other mentors see a waiting request (to claim it), strangers don't.
    assert login(api_client, people["other"]).call("get", f"{BASE}/m/{m.pk}").json()["role"] == "candidate"
    assert login(api_client, people["stranger"]).call("get", f"{BASE}/m/{m.pk}").status_code == 404
    m = services.assign(m, people["mentor"], people["mentor"])
    services.message(m, people["mentor"], "Seems keen", private=True)
    services.message(m, people["mentor"], "Welcome!", private=False)
    # Once it's taken, other mentors are out.
    assert login(api_client, people["other"]).call("get", f"{BASE}/m/{m.pk}").status_code == 404
    mentee_view = login(api_client, people["newbro"]).call("get", f"{BASE}/m/{m.pk}").json()
    texts = [x["text"] for x in mentee_view["messages"]]
    assert "Welcome!" in texts and "Seems keen" not in texts and "characters" not in mentee_view
    # The mentee can't sneak in a private note.
    api_client.call("post", f"{BASE}/m/{m.pk}/messages", {"text": "Thanks!", "private": True})
    mentor_view = login(api_client, people["mentor"]).call("get", f"{BASE}/m/{m.pk}").json()
    assert "Seems keen" in [x["text"] for x in mentor_view["messages"]]
    assert next(x for x in mentor_view["messages"] if x["text"] == "Thanks!")["private"] is False
    assert Notification.objects.filter(user=people["mentor"], title="New Bro wrote to you").exists()
    manager_view = login(api_client, people["manager"]).call("get", f"{BASE}/m/{m.pk}").json()
    assert manager_view["role"] == "manager" and "Seems keen" in [x["text"] for x in manager_view["messages"]]


def test_sheet_access_only_while_active(people):
    mentor, newbro = people["mentor"], people["newbro"]
    char = newbro.main_character
    m = services.request_mentor(newbro)
    assert not can_view(mentor, char)
    m = services.assign(m, mentor, mentor)
    assert can_view(mentor, char) and not can_view(people["other"], char)
    Program.objects.filter(pk=1).update(sheet_access=False)
    assert not can_view(mentor, char)
    Program.objects.filter(pk=1).update(sheet_access=True)
    services.graduate(m, mentor, "Well done")
    assert not can_view(mentor, char)


def test_taking_the_mentor_permission_away_ends_sheet_access(people):
    """Removed from the mentors before anyone reassigned their mentees: no more reading their sheets."""
    mentor, newbro = people["mentor"], people["newbro"]
    services.assign(services.request_mentor(newbro), mentor, mentor)
    assert can_view(mentor, newbro.main_character)
    mentor.user_permissions.clear()
    mentor = type(mentor).objects.get(pk=mentor.pk)
    assert not can_view(mentor, newbro.main_character)


def test_alts_stay_private_from_mentors_who_dont_mentor_them(people, api_client):
    from conduit.accounts.models import Character

    mentor, newbro = people["mentor"], people["newbro"]
    Character.objects.create(id=90000021, name="Secret Alt", owner_hash="alt", user=newbro)
    m = services.request_mentor(newbro)
    # A waiting request: mentors see the main character only, and can't find it by the alt's name.
    view = login(api_client, people["other"]).call("get", f"{BASE}/m/{m.pk}").json()
    assert [c["name"] for c in view["characters"]] == ["New Bro"]
    assert services.search(people["other"], "Secret", 10) == [] and services.search(people["other"], "New Bro", 10) == [m]
    # Their own active mentee: every character.
    m = services.assign(m, mentor, mentor)
    assert {c["name"] for c in login(api_client, mentor).call("get", f"{BASE}/m/{m.pk}").json()["characters"]} == {"New Bro", "Secret Alt"}
    assert services.search(mentor, "Secret", 10) == [m]
    # Once it's over, back to the main character.
    services.graduate(m, mentor, "Well done")
    assert [c["name"] for c in login(api_client, mentor).call("get", f"{BASE}/m/{m.pk}").json()["characters"]] == ["New Bro"]


def test_seeded_goals_and_ticking(people, api_client):
    goals = services.goals()
    titles = [g.title for g in goals]
    assert titles[:2] == ["Meet your mentor on comms", "Set your home station and medical clone"]
    assert "Reach 5 million skill points" in titles  # core total_sp rule
    sp_goal = next(g for g in goals if g.title == "Reach 5 million skill points")
    assert sp_goal.rules["rules"][0] == {"type": "total_sp", "params": {"sp": 5_000_000, "scope": "main"}, "negate": False}
    # Fleets is in this environment only if installed; the fleet goal falls back to a manual one otherwise.
    fleet_goal = next(g for g in goals if "fleet" in g.title.lower())
    assert bool(fleet_goal.rules) == ("fleets_attended" in rules.RULE_TYPES)
    Goal.objects.all().delete()
    assert services.goals() == []  # seeded once: deleting the defaults sticks

    meet = Goal.objects.create(title="Meet your mentor", order=0)
    clone = Goal.objects.create(title="Set your clone", mentee_can_tick=True, order=1)
    sp = Goal.objects.create(title="5M SP", order=2, rules=rules.validate_ruleset({"rules": [{"type": "total_sp", "params": {"sp": 5_000_000}}]}))
    newbro, mentor = people["newbro"], people["mentor"]
    m = services.request_mentor(newbro)
    c = login(api_client, newbro)
    assert c.call("post", f"{BASE}/m/{m.pk}/goals/{clone.pk}", {"done": True}).status_code == 400  # not active yet
    m = services.assign(m, mentor, mentor)
    assert c.call("post", f"{BASE}/m/{m.pk}/goals/{meet.pk}", {"done": True}).status_code == 403
    out = c.call("post", f"{BASE}/m/{m.pk}/goals/{clone.pk}", {"done": True}).json()
    assert [g["done"] for g in out["goals"]] == [False, True, False] and out["progress"] == {"done": 1, "total": 3}
    auto = out["goals"][2]
    assert auto["auto"] and len(auto["checks"]) == 1 and "5,000,000 skill points" in auto["checks"][0]["text"] and not auto["checks"][0]["ok"]
    # The rule ticks itself once the mentee has the skill points.
    SkillSummary.objects.create(character=newbro.main_character, total_sp=6_000_000)
    c = login(api_client, mentor)
    out = c.call("post", f"{BASE}/m/{m.pk}/goals/{meet.pk}", {"done": True}).json()
    assert all(g["done"] for g in out["goals"]) and out["goals"][2]["by_rules"] and out["goals"][0]["done_by"] == "Mentor Mia"
    assert c.call("post", f"{BASE}/m/{m.pk}/goals/{meet.pk}", {"done": False}).json()["goals"][0]["done"] is False


def test_goals_by_focus_area(people, api_client):
    services.goals()
    Goal.objects.all().delete()
    c = login(api_client, people["manager"])
    everyone = c.call("post", f"{BASE}/program/goals", {"title": "Meet your mentor"}).json()
    assert everyone["focus"] == []
    pvp = c.call("post", f"{BASE}/program/goals", {"title": "Fit a frigate", "focus": ["pvp", "Nonsense"]}).json()
    assert pvp["focus"] == ["PvP"]  # only the program's focus areas, spelled the program's way
    industry = c.call("post", f"{BASE}/program/goals", {"title": "Build a module", "focus": ["Industry", "Mining"]}).json()
    assert [g["focus"] for g in c.call("get", f"{BASE}/program").json()["goals"]] == [[], ["PvP"], ["Industry", "Mining"]]

    newbro, mentor = people["newbro"], people["mentor"]
    m = services.assign(services.request_mentor(newbro, focus=["Mining"]), mentor, mentor)
    c = login(api_client, mentor)
    out = c.call("get", f"{BASE}/m/{m.pk}").json()
    assert [g["title"] for g in out["goals"]] == ["Meet your mentor", "Build a module"] and out["progress"]["total"] == 2
    assert c.call("post", f"{BASE}/m/{m.pk}/goals/{pvp['id']}", {"done": True}).status_code == 400
    assert c.call("post", f"{BASE}/m/{m.pk}/goals/{industry['id']}", {"done": True}).status_code == 200
    # No focus given: only the goals for everyone.
    other = services.assign(services.request_mentor(people["stranger"]), mentor, mentor)
    assert [g["title"] for g in c.call("get", f"{BASE}/m/{other.pk}").json()["goals"]] == ["Meet your mentor"]
    # Clearing a goal's focus areas makes it everyone's.
    c = login(api_client, people["manager"])
    c.call("put", f"{BASE}/program/goals/{pvp['id']}", {"title": "Fit a frigate", "focus": []})
    assert c.call("get", f"{BASE}/m/{other.pk}").json()["progress"]["total"] == 2


def test_graduation_and_ending(people, api_client, monkeypatch):
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name.startswith("mentors.") and emitted.append(name))
    newbro, mentor = people["newbro"], people["mentor"]
    m = services.request_mentor(newbro)
    m = services.assign(m, mentor, mentor)
    c = login(api_client, newbro)
    assert c.call("post", f"{BASE}/m/{m.pk}/graduate", {"text": "me!"}).status_code == 403
    c = login(api_client, mentor)
    assert c.call("post", f"{BASE}/m/{m.pk}/end", {"text": ""}).status_code == 400  # needs a reason
    out = c.call("post", f"{BASE}/m/{m.pk}/graduate", {"text": "Fly safe"}).json()
    assert out["status"] == "graduated" and not out["can"]["message"]
    assert Notification.objects.filter(user=newbro, title="Congratulations, you graduated!").exists()
    assert emitted == ["mentors.requested", "mentors.assigned", "mentors.graduated"]
    assert c.call("post", f"{BASE}/m/{m.pk}/messages", {"text": "hi"}).status_code == 400
    # After graduating they may ask again later; an ended one shows on their history.
    again = services.request_mentor(newbro)
    again = services.assign(again, mentor, mentor)
    ended = c.call("post", f"{BASE}/m/{again.pk}/end", {"text": "Left the corporation"}).json()
    assert ended["status"] == "ended" and ended["end_reason"] == "Left the corporation"
    assert len(login(api_client, newbro).call("get", BASE).json()["past"]) == 2


def test_managers_see_graduates_and_reopen(people, api_client):
    newbro, mentor, manager = people["newbro"], people["mentor"], people["manager"]
    m = services.assign(services.request_mentor(newbro), mentor, mentor)
    services.graduate(m, mentor, "Well done")
    c = login(api_client, manager)
    graduates = c.call("get", f"{BASE}/program?status=graduated").json()["mentorships"]
    assert [(g["mentee"]["name"], g["mentor"]["name"]) for g in graduates] == [("New Bro", "Mentor Mia")] and graduates[0]["ended_at"]
    # Only program managers reopen, and only what's closed.
    assert login(api_client, mentor).call("get", f"{BASE}/m/{m.pk}").json()["can"]["reopen"] is False
    assert login(api_client, mentor).call("post", f"{BASE}/m/{m.pk}/reopen").status_code == 403
    c = login(api_client, manager)
    assert c.call("get", f"{BASE}/m/{m.pk}").json()["can"]["reopen"] is True
    out = c.call("post", f"{BASE}/m/{m.pk}/reopen").json()
    assert out["status"] == "active" and out["mentor"]["name"] == "Mentor Mia" and out["ended_at"] is None and out["end_reason"] == ""
    assert out["messages"][-1]["event"] == "reopened"
    assert Notification.objects.filter(user=newbro, title="Your mentorship is open again").exists()
    assert Notification.objects.filter(user=mentor, title="You're mentoring New Bro again").exists()
    assert c.call("post", f"{BASE}/m/{m.pk}/reopen").status_code == 400  # already open
    # Not while the mentee has another one open.
    m.refresh_from_db()
    services.end(m, manager, "Left")
    services.request_mentor(newbro)
    assert c.call("get", f"{BASE}/m/{m.pk}").json()["can"]["reopen"] is False
    assert c.call("post", f"{BASE}/m/{m.pk}/reopen").status_code == 400
    # A mentor who stopped mentoring doesn't get them back: they wait for a new one.
    Mentorship.objects.filter(mentee=newbro, status="waiting").delete()
    mentor.user_permissions.clear()
    out = c.call("post", f"{BASE}/m/{m.pk}/reopen").json()
    assert out["status"] == "waiting" and out["mentor"] is None


def test_rule_edits_need_manage_access(people, api_client):
    manager = people["manager"]
    sp_rules = {"rules": [{"type": "total_sp", "params": {"sp": 1000}}]}
    c = login(api_client, manager)
    assert c.call("get", f"{BASE}/program").json()["can_edit_rules"] is False
    # Manual goals are fine; rule sets aren't.
    goal = c.call("post", f"{BASE}/program/goals", {"title": "Say hi", "mentee_can_tick": True}).json()
    assert goal["rules"] == {} and goal["mentee_can_tick"]
    assert c.call("post", f"{BASE}/program/goals", {"title": "SP", "rules": sp_rules}).status_code == 403
    assert c.call("put", f"{BASE}/program/settings", {"suggest_rules": sp_rules}).status_code == 403
    # Editing the text of a rule goal without touching its rules is fine.
    sp_goal = Goal.objects.filter(rules__isnull=False).exclude(rules={}).first()
    resp = c.call("put", f"{BASE}/program/goals/{sp_goal.pk}", {"title": "Train up", "rules": sp_goal.rules})
    assert resp.status_code == 200 and resp.json()["title"] == "Train up"

    manager = give(manager, "manage_access")
    c = login(api_client, manager)
    bad = c.call("post", f"{BASE}/program/goals", {"title": "Bad", "rules": {"rules": [{"type": "nope"}]}})
    assert bad.status_code == 400
    made = c.call("post", f"{BASE}/program/goals", {"title": "SP", "rules": sp_rules, "mentee_can_tick": True}).json()
    assert "1,000 skill points" in made["rules_text"] and made["mentee_can_tick"] is False
    saved = c.call("put", f"{BASE}/program/settings", {"suggest_rules": sp_rules, "focus_areas": ["PvP", "pvp", "Faction warfare"]}).json()
    assert saved["focus_areas"] == ["PvP", "Faction warfare"] and saved["suggest_text"]
    # Stranger can't open the program at all.
    assert login(api_client, people["stranger"]).call("get", f"{BASE}/program").status_code == 403


def test_suggestions_and_widget(people, api_client):
    newbro = people["newbro"]
    SkillSummary.objects.create(character=newbro.main_character, total_sp=2_000_000)
    assert not services.suggested(newbro)  # no new-member rules set
    p = Program.load()
    p.suggest_rules = rules.validate_ruleset({"rules": [{"type": "total_sp", "params": {"sp": 5_000_000}, "negate": True}]})
    p.save()
    assert services.suggested(newbro)
    SkillSummary.objects.create(character=people["stranger"].main_character, total_sp=9_000_000)
    assert not services.suggested(people["stranger"])
    c = login(api_client, newbro)
    assert c.call("get", f"{BASE}/widget").json()["suggested"] is True
    m = services.request_mentor(newbro)
    w = c.call("get", f"{BASE}/widget").json()
    assert not w["suggested"] and w["mine"]["status"] == "waiting"
    m = services.assign(m, people["mentor"], people["mentor"])
    w = login(api_client, people["mentor"]).call("get", f"{BASE}/widget").json()
    assert w["mentees"] == 1 and w["waiting"] == 0 and w["capacity"] == 3


def test_group_rules_and_search(people, api_client):
    newbro, mentor = people["newbro"], people["mentor"]

    def rule(user, key, **params):
        return rules.evaluate_ruleset(user, rules.validate_ruleset({"rules": [{"type": key, "params": params}]}))

    assert not rule(newbro, "mentors_mentee", status="waiting")
    m = services.request_mentor(newbro)
    assert rule(newbro, "mentors_mentee", status="waiting") and not rule(newbro, "mentors_mentee", status="active")
    m = services.assign(m, mentor, mentor)
    assert rule(newbro, "mentors_mentee", status="active")
    services.graduate(m, mentor)
    assert rule(newbro, "mentors_mentee", status="graduated") and not rule(newbro, "mentors_mentee", status="active")
    assert rules.explain_rule({"type": "mentors_mentee", "params": {"status": "active"}}) == "Is being mentored in the mentoring program"

    services.profile_for(mentor)  # active by default
    assert rule(mentor, "mentors_is_mentor") and not rule(newbro, "mentors_is_mentor")
    services.save_profile(mentor, {"active": False})
    assert not rule(mentor, "mentors_is_mentor")

    hits = login(api_client, mentor).call("get", "/api/search?q=new").json()["groups"]
    group = next(g for g in hits if g["key"] == "mentors")
    assert group["hits"][0]["url"] == f"/p/mentors/m/{m.pk}"
    hits = login(api_client, people["stranger"]).call("get", "/api/search?q=new").json()["groups"]
    assert not any(g["key"] == "mentors" for g in hits)
