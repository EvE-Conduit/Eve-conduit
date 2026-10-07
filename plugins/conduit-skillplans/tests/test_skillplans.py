"""Skill plans: the plans API (also used by other plugins), who may change what, progress, text in and out,
the leadership view and the group rule."""

import pytest
from django.contrib.auth.models import Permission

from conduit.access import rules
from conduit.accounts.models import Character
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType, SkillInfo
from conduit.sheet.skills.models import CharacterSkill, SkillSummary
from conduit_skillplans.models import SkillPlan
from tests.conftest import make_user

SPACESHIP, FRIGATE, DESTROYER, GUNNERY, THRASHER = 3327, 3330, 33091, 3300, 16236


@pytest.fixture
def skills(db):
    ItemCategory.objects.create(id=16, name="Skill", published=True)
    ItemGroup.objects.create(id=257, category_id=16, name="Spaceship Command", published=True)
    ItemGroup.objects.create(id=420, category_id=6, name="Destroyer", published=True)
    for tid, name in [(SPACESHIP, "Spaceship Command"), (FRIGATE, "Minmatar Frigate"), (DESTROYER, "Minmatar Destroyer"), (GUNNERY, "Gunnery")]:
        ItemType.objects.create(id=tid, name=name, group_id=257, published=True)
    SkillInfo.objects.create(type_id=SPACESHIP, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    SkillInfo.objects.create(type_id=FRIGATE, rank=2, primary_attribute="perception", secondary_attribute="willpower", required_skills=[[SPACESHIP, 1]])
    SkillInfo.objects.create(type_id=DESTROYER, rank=2, primary_attribute="perception", secondary_attribute="willpower", required_skills=[[FRIGATE, 3]])
    SkillInfo.objects.create(type_id=GUNNERY, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    ItemType.objects.create(id=THRASHER, name="Thrasher", group_id=420, published=True, required_skills=[[DESTROYER, 1], [GUNNERY, 2]])


@pytest.fixture
def people(skills, corp):
    sync_installed()
    set_enabled("skillplans", True)
    manager = make_user(90000001, "Manager Mo", corporation=corp)
    manager.user_permissions.add(*Permission.objects.filter(codename__in=["manage_plans", "view_progress"]))
    pilot = make_user(90000002, "Pilot One", corporation=corp)
    alt = Character.objects.create(id=90000003, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=corp)
    return {"manager": type(manager).objects.get(pk=manager.pk), "pilot": pilot, "alt": alt}


def train(character_id, **levels):
    SkillSummary.objects.update_or_create(character_id=character_id, defaults={"perception": 27, "willpower": 21})
    for sid, level in levels.items():
        CharacterSkill.objects.update_or_create(character_id=character_id, skill_id=int(sid.lstrip("s")),
                                                defaults={"active_level": level, "trained_level": level, "skillpoints": 0})


def test_create_contract_expands_prerequisites(people, api_client):
    """POST /plans is what other plugins call: prerequisites are added and the detail comes back with an id."""
    api_client.force_login(people["pilot"])
    resp = api_client.call("post", "/api/p/skillplans/plans", {"name": "Thrasher", "skills": [[DESTROYER, 1], [GUNNERY, 2]]})
    assert resp.status_code == 200, resp.content
    plan = resp.json()
    assert plan["id"] and not plan["shared"] and plan["can_edit"]
    assert [(s["skill_id"], s["level"]) for s in plan["steps_detail"]] == [
        (SPACESHIP, 1), (FRIGATE, 1), (FRIGATE, 2), (FRIGATE, 3), (DESTROYER, 1), (GUNNERY, 1), (GUNNERY, 2)]
    assert plan["text"].splitlines()[:2] == ["Spaceship Command 1", "Minmatar Frigate 1"]
    assert SkillPlan.objects.get(pk=plan["id"]).owner_id == people["pilot"].pk
    # Not a skill, bad level, no name.
    assert api_client.call("post", "/api/p/skillplans/plans", {"name": "x", "skills": [[THRASHER, 1]]}).status_code == 400
    assert api_client.call("post", "/api/p/skillplans/plans", {"name": "x", "skills": [[GUNNERY, 6]]}).status_code == 400
    assert api_client.call("post", "/api/p/skillplans/plans", {"name": " ", "skills": []}).status_code == 400


def test_personal_and_shared_plans(people, api_client):
    pilot, manager = people["pilot"], people["manager"]
    api_client.force_login(pilot)
    assert api_client.call("post", "/api/p/skillplans/plans", {"name": "Corp", "skills": [], "shared": True}).status_code == 403
    mine = api_client.call("post", "/api/p/skillplans/plans", {"name": "Mine", "skills": [[GUNNERY, 1]]}).json()

    api_client.force_login(manager)
    shared = api_client.call("post", "/api/p/skillplans/plans", {"name": "Newbro", "skills": [[GUNNERY, 3]], "shared": True}).json()
    assert shared["shared"] and shared["owner"] is None
    # Someone else's personal plan is invisible, even to a manager.
    assert api_client.call("get", f"/api/p/skillplans/plans/{mine['id']}").status_code == 404
    assert [p["name"] for p in api_client.call("get", "/api/p/skillplans").json()["plans"]] == ["Newbro"]

    api_client.force_login(pilot)
    assert {p["name"] for p in api_client.call("get", "/api/p/skillplans").json()["plans"]} == {"Mine", "Newbro"}
    detail = api_client.call("get", f"/api/p/skillplans/plans/{shared['id']}").json()
    assert not detail["can_edit"] and not detail["can_view_progress"]
    assert api_client.call("put", f"/api/p/skillplans/plans/{shared['id']}", {"name": "Hacked"}).status_code == 403
    assert api_client.call("delete", f"/api/p/skillplans/plans/{shared['id']}").status_code == 403
    # A personal copy of the shared plan, which the pilot may change.
    copy = api_client.call("post", f"/api/p/skillplans/plans/{shared['id']}/copy").json()
    assert copy["name"] == "Newbro (copy)" and copy["can_edit"] and not copy["shared"]
    edited = api_client.call("put", f"/api/p/skillplans/plans/{copy['id']}", {"name": "My newbro", "skills": [[GUNNERY, 4]]}).json()
    assert edited["name"] == "My newbro" and edited["steps"] == 4
    assert api_client.call("put", f"/api/p/skillplans/plans/{copy['id']}", {"name": "x", "shared": True}).status_code == 403
    assert api_client.call("delete", f"/api/p/skillplans/plans/{copy['id']}").json() == {"ok": True}


def test_progress_and_copy_for_eve(people, api_client):
    pilot = people["pilot"]
    train(90000002, s3327=1, s3330=3)
    train(90000003, s3300=5)
    plan = SkillPlan.objects.create(name="Thrasher", shared=True, skills=[[3327, 1], [3330, 1], [3330, 2], [3330, 3], [33091, 1], [3300, 1], [3300, 2]])
    api_client.force_login(pilot)
    detail = api_client.call("get", f"/api/p/skillplans/plans/{plan.pk}").json()
    main, alt = detail["characters"]
    assert main["name"] == "Pilot One" and main["done"] == 4 and not main["complete"]
    assert [s["status"] for s in main["steps"]] == ["done"] * 4 + ["missing"] * 3
    assert main["missing_text"] == "Minmatar Destroyer 1\nGunnery 1\nGunnery 2"
    assert main["seconds_left"] > 0 and alt["done"] == 2
    overview = api_client.call("get", "/api/p/skillplans").json()["plans"][0]
    assert overview["me"]["character"] == "Pilot One"
    widget = api_client.call("get", "/api/p/skillplans/me").json()
    assert widget["plans"] == 1 and widget["next"]["id"] == plan.pk

    # Text from the game, with a line that isn't a skill.
    parsed = api_client.call("post", "/api/p/skillplans/parse", {"text": "Gunnery IV\nMinmatar Destroyer 2\nNonsense"}).json()
    assert parsed == {"skills": [[GUNNERY, 4], [DESTROYER, 2]], "problems": ["Nonsense"]}
    norm = api_client.call("post", "/api/p/skillplans/normalise", {"skills": parsed["skills"]}).json()
    assert len(norm["steps"]) == 4 + 4 + 2 and norm["total_sp"] > 0
    # Everything a ship needs.
    assert api_client.call("get", "/api/p/skillplans/types?q=thra").json()[0]["id"] == THRASHER
    assert api_client.call("get", f"/api/p/skillplans/types/{THRASHER}/requirements").json()["skills"] == [[DESTROYER, 1], [GUNNERY, 2]]
    assert [s["name"] for s in api_client.call("get", "/api/p/skillplans/skills?q=minmatar").json()] == ["Minmatar Destroyer", "Minmatar Frigate"]


def test_leadership_view(people, api_client):
    train(90000002, s3300=2)
    train(90000001, s3300=1)
    plan = SkillPlan.objects.create(name="Guns", shared=True, skills=[[3300, 1], [3300, 2]])
    api_client.force_login(people["pilot"])
    assert api_client.call("get", f"/api/p/skillplans/plans/{plan.pk}/members").status_code == 403
    api_client.force_login(people["manager"])
    rows = api_client.call("get", f"/api/p/skillplans/plans/{plan.pk}/members").json()["members"]
    assert [(r["name"], r["complete"]) for r in rows] == [("Pilot One", True), ("Manager Mo", False)]
    csv = api_client.call("get", f"/api/p/skillplans/plans/{plan.pk}/members.csv").content.decode()
    assert csv.splitlines()[1].startswith("Pilot One,Pilot One,100.0,yes")


def test_group_rule(people):
    plan = SkillPlan.objects.create(name="Guns", shared=True, skills=[[3300, 1], [3300, 2]])
    pilot = people["pilot"]
    spec = rules.RULE_TYPES["skillplan_complete"].spec()
    assert spec["params"][0]["choices"] == [{"value": str(plan.pk), "label": "Guns"}]

    def rule(scope):
        return rules.evaluate_ruleset(pilot, rules.validate_ruleset({"rules": [{"type": "skillplan_complete", "params": {"plan": plan.pk, "scope": scope}}]}))

    assert not rule("any")
    train(90000003, s3300=2)  # the alt finished it
    assert rule("any") and not rule("main") and not rule("all")
    train(90000002, s3300=3)
    assert rule("main") and rule("all")
    assert rules.explain_rule({"type": "skillplan_complete", "params": {"plan": str(plan.pk), "scope": "main"}}) == \
        "Completed the skill plan “Guns” on their main"
    with pytest.raises(rules.RuleError):
        rules.validate_ruleset({"rules": [{"type": "skillplan_complete", "params": {"plan": 999, "scope": "any"}}]})
