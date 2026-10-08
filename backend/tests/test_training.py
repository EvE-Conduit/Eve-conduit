"""Skill training maths and skill plans (conduit.sheet.skills.training)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from conduit.sde.models import ItemType, SkillInfo
from conduit.sheet.skills import training
from conduit.sheet.skills.models import CharacterSkill, SkillQueueItem, SkillSummary
from tests.conftest import make_user

SPACESHIP, FRIGATE, DESTROYER, GUNNERY = 3327, 3330, 33091, 3300


@pytest.fixture
def skills(db):
    for tid, name in [(SPACESHIP, "Spaceship Command"), (FRIGATE, "Minmatar Frigate"), (DESTROYER, "Minmatar Destroyer"), (GUNNERY, "Gunnery")]:
        ItemType.objects.create(id=tid, name=name, group_id=257, published=True)
    SkillInfo.objects.create(type_id=SPACESHIP, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    SkillInfo.objects.create(type_id=FRIGATE, rank=2, primary_attribute="perception", secondary_attribute="willpower", required_skills=[[SPACESHIP, 1]])
    SkillInfo.objects.create(type_id=DESTROYER, rank=2, primary_attribute="perception", secondary_attribute="willpower", required_skills=[[FRIGATE, 3]])
    SkillInfo.objects.create(type_id=GUNNERY, rank=1, primary_attribute="perception", secondary_attribute="willpower")
    from conduit.sde.models import ItemCategory, ItemGroup

    ItemCategory.objects.create(id=16, name="Skill", published=True)
    ItemGroup.objects.create(id=257, category_id=16, name="Spaceship Command", published=True)
    ItemType.objects.create(id=16236, name="Thrasher", group_id=420, published=True, required_skills=[[DESTROYER, 1], [GUNNERY, 2]])


def test_sp_for_level():
    assert [training.sp_for_level(1, lvl) for lvl in range(6)] == [0, 250, 1415, 8000, 45255, 256000]
    assert training.sp_for_level(2, 5) == 512000


def test_plan_puts_prerequisites_first(skills):
    steps = training.plan([(DESTROYER, 2), (FRIGATE, 4)])
    assert steps == [(SPACESHIP, 1), (FRIGATE, 1), (FRIGATE, 2), (FRIGATE, 3), (DESTROYER, 1), (DESTROYER, 2), (FRIGATE, 4)]
    assert training.highest(steps) == {SPACESHIP: 1, FRIGATE: 4, DESTROYER: 2}
    # Planning what an item needs.
    need = training.requirements_of_types([16236])
    assert need == {DESTROYER: 1, GUNNERY: 2}
    assert training.plan(need.items())[-1] == (GUNNERY, 2)


def test_progress_counts_trained_queued_and_partial_levels(skills):
    user = make_user()
    cid = user.main_character_id
    SkillSummary.objects.create(character_id=cid, perception=27, willpower=21)
    CharacterSkill.objects.create(character_id=cid, skill_id=SPACESHIP, active_level=3, trained_level=3, skillpoints=8000)
    CharacterSkill.objects.create(character_id=cid, skill_id=FRIGATE, active_level=1, trained_level=1, skillpoints=2000)  # 1500 into level 2
    SkillQueueItem.objects.create(character_id=cid, position=0, skill_id=FRIGATE, finished_level=2, finish_date=timezone.now() + timedelta(hours=1))
    state = training.character_state([cid])[cid]
    steps = training.plan([(FRIGATE, 3)])
    out = training.progress(steps, state, training.skill_info([FRIGATE]))
    assert [s["status"] for s in out["steps"]] == ["done", "done", "queued", "missing"]
    level2 = out["steps"][2]
    assert level2["sp"] == 2829 - 500 - 1500  # rank 2: 500 SP at level 1, 2829 at level 2
    assert level2["seconds"] == round(829 / (27 + 21 / 2) * 60)
    assert out["sp_left"] == 829 + (16000 - 2829) and not out["complete"]
    assert training.meets(state["levels"], {SPACESHIP: 3}) and not training.meets(state["levels"], {FRIGATE: 2})


def test_text_round_trip(skills):
    text = "Spaceship Command 1\nminmatar frigate IV\n\n3. Gunnery level 2\nNot A Skill 3\nGarbage"
    steps, problems = training.parse_text(text)
    assert steps == [(SPACESHIP, 1), (FRIGATE, 4), (GUNNERY, 2)]
    assert problems == ["Garbage", "Not A Skill 3"]
    assert training.format_text([(SPACESHIP, 1), (FRIGATE, 2)]) == "Spaceship Command 1\nMinmatar Frigate 2"


def test_pasted_text_cannot_stall_the_server(skills):
    """One huge line used to make the old regular expression backtrack for minutes."""
    import time

    started = time.monotonic()
    steps, problems = training.parse_text("a" + " " * 100_000 + "b\nGunnery: 3\nGunnery L4")
    assert time.monotonic() - started < 1
    assert steps == [(GUNNERY, 3), (GUNNERY, 4)] and len(problems) == 1 and len(problems[0]) <= training.MAX_LINE
