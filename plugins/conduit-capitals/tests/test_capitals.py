"""Capital Registry: classes from the SDE, can fly against owns, where hulls are, availability, group rules and who may
see what."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.access.rules import RULE_TYPES, validate_ruleset
from conduit.audit.models import SnoopEvent
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType, Region, SolarSystem
from conduit.sheet.assets.models import Asset
from conduit.sheet.models import Location, SyncStatus
from conduit.sheet.overview.models import CharacterInfo
from conduit.sheet.skills.models import CharacterSkill, SkillSummary
from conduit_capitals import classes, services
from conduit_capitals.models import Availability
from tests.conftest import make_user

BASE = "/api/p/capitals"
# Hulls (real type ids) and the skills they need, cut down to one or two each.
THANATOS, NIDHOGGUR, NAGLFAR, MINOKAWA, ARK, RORQUAL, AVATAR, KARURA = 23911, 24483, 19722, 37605, 28850, 28352, 11567, 77283
CARRIER_SKILL, DREAD_SKILL, FAX_SKILL, JF_SKILL, TITAN_SKILL, INDY_SKILL = 24311, 20525, 40536, 29029, 3347, 28374
KEEPSTAR, JITA = 1035466617946, 60003760
SYSTEM, JITA_SYSTEM = 30004759, 30000142
SCOPES = "esi-skills.read_skills.v1 esi-assets.read_assets.v1 esi-clones.read_clones.v1"
LEGACY_TITAN_GROUP = 999  # a titan group under another id, found by name


@pytest.fixture
def sde(db):
    ItemCategory.objects.create(id=6, name="Ship", published=True)
    ItemCategory.objects.create(id=16, name="Skill", published=True)
    for gid, name in ((547, "Carrier"), (485, "Dreadnought"), (1538, "Force Auxiliary"), (902, "Jump Freighter"),
                      (883, "Capital Industrial Ship"), (4594, "Lancer Dreadnought"), (LEGACY_TITAN_GROUP, "Titan"),
                      (419, "Combat Battlecruiser")):
        ItemGroup.objects.create(id=gid, category_id=6, name=name, published=True)
    ItemGroup.objects.create(id=257, category_id=16, name="Spaceship Command", published=True)
    hulls = (
        (THANATOS, "Thanatos", 547, [[CARRIER_SKILL, 1]]),
        (NIDHOGGUR, "Nidhoggur", 547, [[CARRIER_SKILL, 1]]),
        (NAGLFAR, "Naglfar", 485, [[DREAD_SKILL, 1]]),
        (MINOKAWA, "Minokawa", 1538, [[FAX_SKILL, 1]]),
        (ARK, "Ark", 902, [[JF_SKILL, 1]]),
        (RORQUAL, "Rorqual", 883, [[INDY_SKILL, 1]]),
        (AVATAR, "Avatar", LEGACY_TITAN_GROUP, [[TITAN_SKILL, 1]]),
        (KARURA, "Karura", 4594, [[DREAD_SKILL, 3]]),
        (24690, "Hurricane", 419, []),
    )
    for tid, name, gid, reqs in hulls:
        ItemType.objects.create(id=tid, group_id=gid, name=name, published=True, required_skills=reqs)
    ItemType.objects.create(id=99999, group_id=547, name="Unreleased Carrier", published=False)
    for sid, name in ((CARRIER_SKILL, "Caldari Carrier"), (DREAD_SKILL, "Minmatar Dreadnought")):
        ItemType.objects.create(id=sid, group_id=257, name=name, published=True)
    Region.objects.create(id=10000060, name="Delve")
    Region.objects.create(id=10000002, name="The Forge")
    SolarSystem.objects.create(id=SYSTEM, constellation_id=1, region_id=10000060, name="1DQ1-A", security_status=-0.4)
    SolarSystem.objects.create(id=JITA_SYSTEM, constellation_id=2, region_id=10000002, name="Jita", security_status=0.95)
    Location.objects.create(id=KEEPSTAR, kind="structure", name="1DQ1-A - Imperial Palace", solar_system_id=SYSTEM)
    Location.objects.create(id=JITA, kind="station", name="Jita IV - Moon 4", solar_system_id=JITA_SYSTEM)


@pytest.fixture
def setup(sde, corp):
    sync_installed()
    set_enabled("capitals", True)
    pilot = make_user(90000001, "Cap Pilot", corporation=corp, scopes=SCOPES)
    boss = make_user(90000050, "Fleet Boss", corporation=corp, scopes=SCOPES)
    boss.user_permissions.add(
        Permission.objects.get(content_type__app_label="capitals", codename="view_registry"),
        Permission.objects.get(content_type__app_label="sheet", codename="view_corporation_characters"),
    )
    boss = type(boss).objects.get(pk=boss.pk)
    return pilot, boss


def synced(char, **skills):
    """Give a character synced skills (and sync statuses saying so)."""
    SkillSummary.objects.create(character=char, total_sp=1)
    for sid, level in skills.items():
        CharacterSkill.objects.create(character=char, skill_id=int(sid.lstrip("s")), active_level=level, trained_level=level, skillpoints=1)
    for section in ("skills", "assets", "overview"):
        SyncStatus.objects.update_or_create(character=char, section=section,
                                            defaults={"result": "ok", "last_success": timezone.now()})


def asset(char, item_id, type_id, location_id=KEEPSTAR, root=None, location_type="other", flag="Hangar", singleton=True, name=""):
    return Asset.objects.create(character=char, item_id=item_id, type_id=type_id, quantity=1, location_id=location_id,
                                location_type=location_type, location_flag=flag, is_singleton=singleton, name=name,
                                root_location_id=root or location_id)


def test_classes_come_from_sde_groups(sde):
    hulls = classes.hulls()
    assert {h.name: h.cls for h in hulls.values()} == {
        "Thanatos": "carrier", "Nidhoggur": "carrier", "Naglfar": "dreadnought", "Minokawa": "fax", "Ark": "jump_freighter",
        "Rorqual": "industrial", "Avatar": "titan", "Karura": "lancer",
    }
    # Not a capital, and unpublished hulls are left out; a class under another group id is found by its name.
    assert 24690 not in hulls and 99999 not in hulls
    assert list(classes.hulls("carrier")) == [NIDHOGGUR, THANATOS]
    assert classes.group_classes()[LEGACY_TITAN_GROUP] == "titan"


def test_can_fly_against_owns(setup):
    pilot, _ = setup
    char = pilot.main_character
    synced(char, **{f"s{CARRIER_SKILL}": 1, f"s{DREAD_SKILL}": 1})
    asset(char, 1, ARK)  # owns a jump freighter it can't fly
    reg = services.Registry([char])
    assert reg.flyable(char.pk, "carrier") == [NIDHOGGUR, THANATOS]
    assert reg.flyable(char.pk, "dreadnought") == [NAGLFAR]
    assert reg.flyable(char.pk, "lancer") == []  # needs level 3
    assert [a.type_id for a in reg.owned(char.pk)] == [ARK] and not reg.can_fly(char.pk, ARK)
    # Unsynced skills: can't say they fly anything, and it's flagged.
    other = make_user(90000002, "Fresh Pilot", scopes="publicData").main_character
    reg = services.Registry([other])
    assert reg.flyable(other.pk) == []
    assert reg.status[other.pk]["skills"]["status"] == "missing_scopes"


def test_where_the_hulls_are(setup):
    pilot, _ = setup
    char = pilot.main_character
    synced(char)
    asset(char, 10, AVATAR, location_id=SYSTEM, location_type="solar_system", flag="Hangar", name="Big Boy")
    asset(char, 11, THANATOS, location_id=10, root=SYSTEM, location_type="item", flag="ShipHangar")  # in the titan's bay
    asset(char, 12, NAGLFAR)  # docked in the Keepstar
    asset(char, 13, ARK, location_id=JITA, location_type="station", singleton=False)  # packaged in Jita
    asset(char, 14, RORQUAL, location_id=JITA, location_type="station", flag="AssetSafety")
    reg = services.Registry([char])
    rows = {r["type_id"]: r for r in (reg.asset_out(a) for a in reg.owned(char.pk))}
    assert rows[AVATAR]["where"] == "space" and rows[AVATAR]["place"]["system"]["region"] == "Delve"
    assert rows[THANATOS]["where"] == "ship_bay" and "Big Boy" in rows[THANATOS]["where_label"]
    assert rows[NAGLFAR]["where"] == "hangar" and rows[NAGLFAR]["place"]["name"] == "1DQ1-A - Imperial Palace"
    assert rows[NAGLFAR]["place"]["kind"] == "structure"
    assert rows[ARK]["packaged"] and rows[ARK]["place"]["system"]["name"] == "Jita"
    assert rows[RORQUAL]["where"] == "asset_safety"
    locs = services.by_location(reg)["locations"]
    assert [(g["place"]["name"], g["count"]) for g in locs] == [("1DQ1-A", 2), ("Jita IV - Moon 4", 2), ("1DQ1-A - Imperial Palace", 1)]


def test_jump_readiness(setup):
    pilot, _ = setup
    char = pilot.main_character
    synced(char, s21611=5, s21610=4, s3456=5, s33399=3)
    last = timezone.now() - timedelta(hours=10)
    CharacterInfo.objects.create(character=char, home_location_id=JITA, last_clone_jump_date=last, solar_system_id=SYSTEM,
                                 structure_id=KEEPSTAR, jump_clones=[{"jump_clone_id": 7, "location_id": KEEPSTAR, "implants": [1, 2]}],
                                 jump_fatigue_expires=timezone.now() + timedelta(minutes=30))
    data = services.me(pilot)
    jump = data["characters"][0]["jump"]
    assert jump["skills"] == {"jdo": 5, "jdc": 5, "jfc": 4, "infomorph": 3}
    assert jump["home"]["name"] == "Jita IV - Moon 4"
    assert jump["clones"] == [{"id": 7, "name": "", "place": jump["location"], "implants": 2}]
    assert jump["location"]["name"] == "1DQ1-A - Imperial Palace"
    # 24 h less 3 for Infomorph Synchronizing III: ready 21 h after the last jump.
    assert jump["clone_jump_ready_at"] == (last + timedelta(hours=21)).isoformat()
    assert jump["fatigue_until"]


def test_stale_and_missing_data_are_flagged(setup):
    pilot, _ = setup
    char = pilot.main_character
    synced(char)
    SyncStatus.objects.filter(character=char, section="assets").update(last_success=timezone.now() - timedelta(days=3))
    SyncStatus.objects.filter(character=char, section="overview").update(result="error", last_success=None)
    status = services.data_status([char])[char.pk]
    assert [status[k]["status"] for k in ("skills", "assets", "clones")] == ["ok", "stale", "error"]
    char.token.valid = False
    char.token.save()
    assert services.data_status([char])[char.pk]["skills"]["status"] == "token_invalid"


def test_availability(setup, api_client):
    pilot, boss = setup
    char = pilot.main_character
    synced(char, **{f"s{CARRIER_SKILL}": 1})
    asset(char, 1, NAGLFAR)
    api_client.force_login(pilot)
    r = api_client.call("put", f"{BASE}/availability", {"character_id": char.pk, "type_id": NAGLFAR, "available": True, "note": "Ping me on Discord"})
    assert r.status_code == 200 and r.json()["availability"]["available"]
    # A hull they can fly but don't own can be marked too...
    assert api_client.call("put", f"{BASE}/availability", {"character_id": char.pk, "type_id": THANATOS, "available": False}).status_code == 200
    # ...one they neither fly nor own can't, nor can a ship that isn't a capital or someone else's character.
    assert api_client.call("put", f"{BASE}/availability", {"character_id": char.pk, "type_id": ARK, "available": True}).status_code == 400
    assert api_client.call("put", f"{BASE}/availability", {"character_id": char.pk, "type_id": 24690, "available": True}).status_code == 400
    r = api_client.call("put", f"{BASE}/availability", {"character_id": boss.main_character_id, "type_id": NAGLFAR, "available": True})
    assert r.status_code == 404
    me = api_client.call("get", f"{BASE}/me").json()
    owned = me["characters"][0]["owned"]
    assert owned[0]["availability"] == {**owned[0]["availability"], "available": True, "note": "Ping me on Discord"}
    assert me["characters"][0]["availability"][str(THANATOS)]["available"] is False
    summary = services.summary(services.Registry([char]))
    dread = next(c for c in summary["classes"] if c["key"] == "dreadnought")
    assert (dread["owned"], dread["available"]) == (1, 1)
    # Clearing.
    api_client.call("put", f"{BASE}/availability", {"character_id": char.pk, "type_id": NAGLFAR, "available": None})
    assert not Availability.objects.filter(type_id=NAGLFAR).exists()


def test_group_rules(setup):
    pilot, _ = setup
    char = pilot.main_character
    alt = make_user(90000003, "Alt Pilot", scopes=SCOPES).main_character
    alt.user = pilot
    alt.save()
    synced(char, **{f"s{DREAD_SKILL}": 3})
    synced(alt)
    fly, own = RULE_TYPES["capitals_can_fly"], RULE_TYPES["capitals_owns"]
    assert fly.evaluate(pilot, {"class": "lancer", "scope": "any"})
    assert fly.evaluate(pilot, {"class": "any", "scope": "main"})
    assert not fly.evaluate(pilot, {"class": "lancer", "scope": "all"})  # the alt can't
    assert not fly.evaluate(pilot, {"class": "carrier", "scope": "any"})
    params = {"class": "fax", "count": 1, "scope": "any", "skip_unavailable": False}
    assert not own.evaluate(pilot, params)
    asset(alt, 5, MINOKAWA)
    assert own.evaluate(pilot, params) and not own.evaluate(pilot, {**params, "scope": "main"})
    assert not own.evaluate(pilot, {**params, "count": 2})
    Availability.objects.create(character=alt, type_id=MINOKAWA, available=False)
    assert own.evaluate(pilot, params) and not own.evaluate(pilot, {**params, "skip_unavailable": True})
    # The rule editor accepts them, with defaults, and explains them.
    rules = validate_ruleset({"rules": [{"type": "capitals_owns", "params": {"class": "titan"}}, {"type": "capitals_can_fly", "params": {}}]})
    assert rules["rules"][0]["params"] == {"class": "titan", "count": 1, "scope": "any", "skip_unavailable": False}
    assert own.explain(rules["rules"][0]["params"]) == "Owns a Titan on any character"
    assert fly.explain(rules["rules"][1]["params"]) == "Can fly any capital on any character"


def test_registry_needs_permission_and_follows_sheet_access(setup, api_client, corp):
    pilot, boss = setup
    synced(pilot.main_character, **{f"s{CARRIER_SKILL}": 1})
    asset(pilot.main_character, 1, THANATOS)
    outsider = make_user(90000010, "Elsewhere Pilot", scopes=SCOPES)  # not in the boss's corporation
    synced(outsider.main_character, **{f"s{CARRIER_SKILL}": 1})
    asset(outsider.main_character, 2, NIDHOGGUR)
    guest = make_user(90000011, "Guest Pilot", corporation=corp, scopes=SCOPES, member=False)
    synced(guest.main_character, **{f"s{CARRIER_SKILL}": 1})

    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/me").status_code == 200
    assert api_client.call("get", f"{BASE}/registry/summary").status_code == 403
    assert api_client.call("get", f"{BASE}/registry/members/{boss.pk}").status_code == 403

    api_client.force_login(boss)
    summary = api_client.call("get", f"{BASE}/registry/summary").json()
    carrier = next(c for c in summary["classes"] if c["key"] == "carrier")
    # Only the corporation's members (sheet access), not the outsider nor the guest.
    assert (summary["characters"], carrier["pilots"], carrier["owned"]) == (2, 1, 1)
    pilots = api_client.call("get", f"{BASE}/registry/classes/carrier").json()["pilots"]
    assert [p["name"] for p in pilots] == ["Cap Pilot"] and pilots[0]["owned"][0]["type_id"] == THANATOS
    assert SnoopEvent.objects.filter(viewer_id=boss.pk, character_id=pilot.main_character_id, section="assets").exists()
    assert api_client.call("get", f"{BASE}/registry/classes/nope").status_code == 404
    locs = api_client.call("get", f"{BASE}/registry/locations?cls=carrier").json()["locations"]
    assert [g["place"]["name"] for g in locs] == ["1DQ1-A - Imperial Palace"]
    members = api_client.call("get", f"{BASE}/registry/members").json()["members"]
    assert members[0]["name"] == "Cap Pilot" and members[0]["classes"]["carrier"] == {"fly": 1, "own": 1}
    assert api_client.call("get", f"{BASE}/registry/members/{pilot.pk}").json()["member"]["name"] == "Cap Pilot"
    assert api_client.call("get", f"{BASE}/registry/members/{outsider.pk}").status_code == 404


def test_registry_filters(setup, api_client, corp):
    pilot, boss = setup
    synced(pilot.main_character, **{f"s{CARRIER_SKILL}": 1})
    group = Group.objects.create(name="Capital pilots")
    api_client.force_login(boss)
    opts = api_client.call("get", f"{BASE}/registry/options").json()
    assert opts["corporations"] == [{"id": corp.pk, "name": "Test Corp", "ticker": "TCORP"}]
    assert len(opts["classes"]) == len(classes.CLASSES)
    pilots = lambda q: api_client.call("get", f"{BASE}/registry/summary?{q}").json()["classes"][0]["pilots"]  # noqa: E731
    assert pilots("") == 1
    assert pilots(f"group={group.pk}") == 0
    pilot.groups.add(group)
    assert pilots(f"group={group.pk}") == 1
    assert pilots(f"state={pilot.state_id}") == 1
    assert pilots(f"corporation={corp.pk + 1}") == 0
