"""The SeAT history import for the skills and overview sections (both snapshots)."""

from datetime import datetime, timezone

import pytest

from conduit.accounts.models import Token
from conduit.sheet.models import SyncStatus
from conduit.sheet.overview.models import CharacterInfo, CorporationHistory
from conduit.sheet.skills.models import CharacterSkill, SkillQueueItem, SkillSummary

from .conftest import make_user
from .seat_history import run, token_row, write_dump

DEAD, LIVE = 91000101, 91000102
CORP, OLD_CORP = 98000001, 1000009
SCOPES = " ".join([
    "publicData", "esi-skills.read_skills.v1", "esi-skills.read_skillqueue.v1", "esi-location.read_location.v1",
    "esi-location.read_ship_type.v1", "esi-location.read_online.v1", "esi-clones.read_clones.v1",
    "esi-clones.read_implants.v1", "esi-characters.read_fatigue.v1", "esi-characters.read_titles.v1",
    "esi-characters.read_corporation_roles.v1",
])


def utc(*a):
    return datetime(*a, tzinfo=timezone.utc)


def per_character(cid):
    """One character's rows in each SeAT table the two sections read."""
    return {
        "character_info_skills": [{"character_id": cid, "total_sp": 5_000_000, "unallocated_sp": 12_000,
                                   "created_at": "2020-01-01 00:00:00", "updated_at": "2025-03-01 00:00:00"}],
        "character_skills": [
            {"id": cid * 10 + 1, "character_id": cid, "skill_id": 3300, "skillpoints_in_skill": 256000,
             "trained_skill_level": 5, "active_skill_level": 5, "created_at": None, "updated_at": None},
            {"id": cid * 10 + 2, "character_id": cid, "skill_id": 3327, "skillpoints_in_skill": 45255,
             "trained_skill_level": 4, "active_skill_level": 3, "created_at": None, "updated_at": None},
        ],
        "character_attributes": [{"character_id": cid, "charisma": 19, "intelligence": 27, "memory": 21,
                                  "perception": 17, "willpower": 20, "bonus_remaps": 1,
                                  "last_remap_date": "2023-06-01 10:00:00", "accrued_remap_cooldown_date": None,
                                  "created_at": None, "updated_at": None}],
        "character_skill_queues": [
            {"id": cid * 10 + 2, "character_id": cid, "skill_id": 3327, "finish_date": "2025-03-05 12:00:00",
             "start_date": "2025-03-01 12:00:00", "finished_level": 5, "queue_position": 1,
             "training_start_sp": 50000, "level_end_sp": 256000, "level_start_sp": 45255,
             "created_at": None, "updated_at": None},
            {"id": cid * 10 + 1, "character_id": cid, "skill_id": 3301, "finish_date": "2025-03-01 12:00:00",
             "start_date": "2025-02-28 12:00:00", "finished_level": 1, "queue_position": 0,
             "training_start_sp": 0, "level_end_sp": 250, "level_start_sp": 0, "created_at": None, "updated_at": None},
        ],
        "character_infos": [{"character_id": cid, "name": f"Pilot {cid}",
                             "description": "<font size=\"12\">Hello <b>there</b></font>",
                             "birthday": "2015-03-24T11:37:00Z", "gender": "female", "race_id": 1,
                             "bloodline_id": 3, "security_status": 4.5, "title": "<b>Boss</b>",
                             "created_at": None, "updated_at": None}],
        "character_affiliations": [{"character_id": cid, "corporation_id": CORP, "alliance_id": None,
                                    "faction_id": 500001, "created_at": None, "updated_at": None}],
        "character_corporation_histories": [
            {"id": cid * 10 + 1, "character_id": cid, "start_date": "2015-03-24 11:37:00", "corporation_id": OLD_CORP,
             "is_deleted": 0, "record_id": 100, "created_at": None, "updated_at": None},
            {"id": cid * 10 + 2, "character_id": cid, "start_date": "2016-01-01 00:00:00", "corporation_id": CORP,
             "is_deleted": 1, "record_id": 101, "created_at": None, "updated_at": None},
        ],
        "character_locations": [{"character_id": cid, "solar_system_id": 30000142, "station_id": 60003760,
                                 "structure_id": None, "created_at": None, "updated_at": None}],
        "character_ships": [{"character_id": cid, "ship_item_id": 1000000001, "ship_name": "Shuttle One",
                             "ship_type_id": 11129, "created_at": None, "updated_at": None}],
        "character_onlines": [{"character_id": cid, "online": 0, "last_login": "2025-02-28 20:00:00",
                               "last_logout": "2025-02-28 23:00:00", "logins": 812, "created_at": None,
                               "updated_at": None}],
        "character_clones": [{"character_id": cid, "last_clone_jump_date": "2024-12-01 08:00:00",
                              "home_location_id": 60003760, "home_location_type": "station",
                              "last_station_change_date": "2024-01-01 00:00:00", "created_at": None,
                              "updated_at": None}],
        "character_jump_clones": [{"id": cid * 10 + 1, "character_id": cid, "jump_clone_id": 777, "name": "PvP",
                                   "location_id": 60003760, "location_type": "station", "implants": "[22118, 13209]",
                                   "created_at": None, "updated_at": None}],
        "character_implants": [{"id": cid * 10 + 1, "character_id": cid, "type_id": 9899, "created_at": None,
                                "updated_at": None}],
        "character_fatigues": [{"character_id": cid, "last_jump_date": "2025-02-20 10:00:00",
                                "jump_fatigue_expire_date": "2025-02-21 10:00:00",
                                "last_update_date": "2025-02-20 10:00:00", "created_at": None, "updated_at": None}],
        "character_info_corporation_title": [{"character_info_character_id": cid, "corporation_title_id": 55}],
        "character_roles": [
            {"id": cid * 10 + 1, "character_id": cid, "role": "Director", "scope": "roles", "created_at": None,
             "updated_at": None},
            {"id": cid * 10 + 2, "character_id": cid, "role": "Accountant", "scope": "roles", "created_at": None,
             "updated_at": None},
            {"id": cid * 10 + 3, "character_id": cid, "role": "Hangar_Take_1", "scope": "roles_at_hq",
             "created_at": None, "updated_at": None},
        ],
    }


def dump(tmp_path):
    tables = {
        "refresh_tokens": [token_row(DEAD, deleted_at="2025-03-02 00:00:00"), token_row(LIVE)],
        "universe_names": [],
        "universe_stations": [{"station_id": 60003760, "name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
                               "system_id": 30000142, "type_id": 1531, "owner": 1000035}],
        "corporation_titles": [
            {"id": 55, "corporation_id": CORP, "title_id": 4, "name": "<color=0xff>Fleet</color> Boss",
             "created_at": None, "updated_at": None},
            {"id": 56, "corporation_id": CORP, "title_id": 8, "name": "Unused", "created_at": None, "updated_at": None},
        ],
    }
    for cid in (DEAD, LIVE):
        for table, rows in per_character(cid).items():
            tables.setdefault(table, []).extend(rows)
    return write_dump(tmp_path / "seat.sql", tables)


@pytest.fixture
def people(db):
    dead = make_user(DEAD, "Gone Pilot", scopes=SCOPES).main_character
    Token.objects.filter(character=dead).update(valid=False)
    live = make_user(LIVE, "Live Pilot", scopes=SCOPES).main_character
    # The live character synced both sections from EVE already.
    SkillSummary.objects.create(character=live, total_sp=9_000_000, intelligence=30)
    CharacterSkill.objects.create(character=live, skill_id=3300, active_level=5, trained_level=5, skillpoints=256000)
    CharacterInfo.objects.create(character=live, gender="male", ship_name="From EVE", roles=["Director"])
    CorporationHistory.objects.create(character=live, record_id=200, corporation_id=CORP, start_date=utc(2020, 1, 1))
    for key in ("skills", "overview"):
        SyncStatus.objects.create(character=live, section=key, result="ok", last_success="2025-02-02T00:00:00Z")
    return dead, live


def snapshot():
    return (
        sorted(SkillSummary.objects.values_list("character_id", "total_sp", "unallocated_sp", "intelligence")),
        sorted(CharacterSkill.objects.values_list("character_id", "skill_id", "active_level", "skillpoints")),
        sorted(SkillQueueItem.objects.values_list("character_id", "position", "skill_id")),
        sorted(CorporationHistory.objects.values_list("character_id", "record_id", "corporation_id", "is_deleted")),
        sorted(CharacterInfo.objects.values_list("character_id", "gender", "ship_name", "titles", "roles",
                                                 "jump_clones")),
    )


@pytest.mark.django_db
def test_skills(tmp_path, people):
    dead, live = people
    summary = run(dump(tmp_path), sections=["skills"])
    assert not summary["errors"], summary["errors"]
    assert summary["sections"]["skills"] == {"imported": 1, "skipped": 1, "errors": 0}

    s = SkillSummary.objects.get(character=dead)
    assert (s.total_sp, s.unallocated_sp) == (5_000_000, 12_000)
    assert (s.charisma, s.intelligence, s.memory, s.perception, s.willpower) == (19, 27, 21, 17, 20)
    assert s.bonus_remaps == 1 and s.last_remap_date == utc(2023, 6, 1, 10) and s.remap_available_date is None
    skills = {k.skill_id: k for k in CharacterSkill.objects.filter(character=dead)}
    assert set(skills) == {3300, 3327}
    assert (skills[3327].active_level, skills[3327].trained_level, skills[3327].skillpoints) == (3, 4, 45255)
    queue = list(SkillQueueItem.objects.filter(character=dead))
    assert [(q.position, q.skill_id, q.finished_level) for q in queue] == [(0, 3301, 1), (1, 3327, 5)]
    assert queue[1].start_date == utc(2025, 3, 1, 12) and queue[1].finish_date == utc(2025, 3, 5, 12)
    assert (queue[1].training_start_sp, queue[1].level_start_sp, queue[1].level_end_sp) == (50000, 45255, 256000)
    assert SyncStatus.objects.get(character=dead, section="skills").message == "From SeAT, data as of 2025-03-01"

    # The live character keeps what EVE gave.
    assert SkillSummary.objects.get(character=live).total_sp == 9_000_000
    assert list(CharacterSkill.objects.filter(character=live).values_list("skill_id", flat=True)) == [3300]
    assert not SkillQueueItem.objects.filter(character=live).exists()

    before = snapshot()
    again = run(dump(tmp_path), sections=["skills"])
    assert not again["errors"] and again["sections"]["skills"] == {"imported": 0, "skipped": 2, "errors": 0}
    assert snapshot() == before


@pytest.mark.django_db
def test_overview(tmp_path, people):
    dead, live = people
    summary = run(dump(tmp_path), sections=["overview"])
    assert not summary["errors"], summary["errors"]
    assert summary["sections"]["overview"] == {"imported": 1, "skipped": 1, "errors": 0}

    info = CharacterInfo.objects.get(character=dead)
    assert info.birthday == utc(2015, 3, 24, 11, 37) and info.gender == "female"
    assert (info.race_id, info.bloodline_id, info.security_status, info.faction_id) == (1, 3, 4.5, 500001)
    assert info.description == "Hello there" and info.title == "Boss"
    assert (info.solar_system_id, info.station_id, info.structure_id) == (30000142, 60003760, None)
    assert (info.ship_type_id, info.ship_name) == (11129, "Shuttle One")
    assert info.online is False and info.logins == 812
    assert info.last_login == utc(2025, 2, 28, 20) and info.last_logout == utc(2025, 2, 28, 23)
    assert info.home_location_id == 60003760 and info.last_clone_jump_date == utc(2024, 12, 1, 8)
    assert info.jump_clones == [{"jump_clone_id": 777, "location_id": 60003760, "name": "PvP",
                                 "implants": [22118, 13209]}]
    assert info.implants == [9899]
    assert info.jump_fatigue_expires == utc(2025, 2, 21, 10) and info.last_jump_date == utc(2025, 2, 20, 10)
    assert info.titles == ["Fleet Boss"]
    assert info.roles == ["Accountant", "Director"]  # "roles" scope only, as a live sync keeps
    history = list(CorporationHistory.objects.filter(character=dead))
    assert [(h.record_id, h.corporation_id, h.is_deleted) for h in history] == [(101, CORP, True),
                                                                                (100, OLD_CORP, False)]
    assert history[1].start_date == utc(2015, 3, 24, 11, 37)

    # The live character keeps what EVE gave.
    live_info = CharacterInfo.objects.get(character=live)
    assert (live_info.gender, live_info.ship_name, live_info.roles) == ("male", "From EVE", ["Director"])
    assert list(CorporationHistory.objects.filter(character=live).values_list("record_id", flat=True)) == [200]

    before = snapshot()
    again = run(dump(tmp_path), sections=["overview"])
    assert not again["errors"] and again["sections"]["overview"] == {"imported": 0, "skipped": 2, "errors": 0}
    assert snapshot() == before and CorporationHistory.objects.count() == 3


@pytest.mark.django_db
def test_characters_seat_has_little_on(tmp_path, people):
    """A character SeAT held a token for but kept no sheet data on: both sections import as empty, no errors."""
    dead, _ = people
    path = write_dump(tmp_path / "bare.sql", {"refresh_tokens": [token_row(DEAD)], "universe_names": []})
    summary = run(path, sections=["skills", "overview"])
    assert not summary["errors"], summary["errors"]
    assert SkillSummary.objects.get(character=dead).total_sp == 0
    assert not CharacterSkill.objects.filter(character=dead).exists()
    info = CharacterInfo.objects.get(character=dead)
    assert info.solar_system_id is None and info.jump_clones == [] and info.roles == []


@pytest.mark.django_db
def test_character_without_any_token_gets_its_queue_too(tmp_path, people):
    # SeAT had dropped this one's token, so the account import brought the character over with none at all.
    dead, _ = people
    Token.objects.filter(character=dead).delete()
    summary = run(dump(tmp_path), sections=["skills", "overview"])
    assert not summary["errors"], summary["errors"]
    assert SkillQueueItem.objects.filter(character=dead).count() == 2  # a scoped call, made despite no token
    assert not Token.objects.filter(character=dead).exists()  # the stand-in token is never saved


@pytest.mark.django_db
def test_corporation_names_wait_for_the_end(tmp_path, people, monkeypatch):
    from conduit.eve import tasks

    looked_up = []
    monkeypatch.setattr(tasks, "ensure_names", lambda **kw: looked_up.append(kw))
    monkeypatch.setattr(tasks, "ensure_eve_names", lambda ids: None)
    summary = run(dump(tmp_path), sections=["overview"], lookup_names=True)
    assert not summary["errors"], summary["errors"]
    assert len(looked_up) == 1 and looked_up[0]["corporation_ids"]  # once, after every character
