"""Structures & Fuel: the burn table, the fuel plan, thresholds warning once, refuel claims and who may see what."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.corp.models import Structure
from conduit.eve.models import EveAlliance, EveCorporation
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_structures import burn as fuel
from conduit_structures import services
from conduit_structures.models import Claim, StructureFuel, StructuresSettings
from tests.conftest import make_user

BASE = "/api/p/structures"
ASTRAHUS, RAITARU, ATHANOR, TATARA, ANSIBLEX, METENOX = 35832, 35825, 35835, 35836, 35841, 81826
CLONE, MARKET = {"name": "Clone Bay", "state": "online"}, {"name": "Market", "state": "online"}


def svc(name, state="online"):
    return {"name": name, "state": state}


def corp_perm(user, codename="view_own_corporation"):
    user.user_permissions.add(Permission.objects.get(content_type__app_label="corp", codename=codename))
    return type(user).objects.get(pk=user.pk)


def structure(corp, sid, hours, type_id=ASTRAHUS, services_=(CLONE,), name=None, system=30000142, state="shield_vulnerable"):
    return Structure.objects.create(
        corporation=corp, structure_id=sid, name=name or f"Citadel {sid}", type_id=type_id, system_id=system, state=state,
        fuel_expires=timezone.now() + timedelta(hours=hours) if hours is not None else None, services=list(services_),
    )


def refuel(s, hours):
    Structure.objects.filter(pk=s.pk).update(fuel_expires=timezone.now() + timedelta(hours=hours))


@pytest.fixture
def setup(db, corp):
    sync_installed()
    set_enabled("structures", True)
    viewer = corp_perm(make_user(90000001, "Fuel Fred", corporation=corp))
    boss = corp_perm(make_user(90000050, "Director Dee", corporation=corp))
    boss.user_permissions.add(Permission.objects.get(content_type__app_label="structures", codename="manage_structures"))
    boss = type(boss).objects.get(pk=boss.pk)
    return viewer, boss


@pytest.fixture
def events(monkeypatch):
    out = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name.startswith("structures.") and out.append((name, kw)))
    return out


# --- the burn table -------------------------------------------------------------------------------------------------


def test_citadel_bonus_on_clone_and_market():
    b = fuel.burn(ASTRAHUS, [CLONE, MARKET, svc("Manufacturing (Standard)")])
    # Clone 10 and market 40 at 75 %, manufacturing 12 at full rate in a citadel.
    assert b.online == pytest.approx(37.5 + 12)


def test_engineering_complex_counts_each_module_once_and_skips_offline():
    b = fuel.burn(RAITARU, [
        svc("Manufacturing (Standard)"),
        svc("Blueprint Copying"), svc("Material Efficiency Research"), svc("Time Efficiency Research"),  # one Research Lab
        svc("Invention", "offline"),
        svc("Some New Service"),
    ])
    assert b.online == pytest.approx(9 + 9)
    assert b.all == pytest.approx(27)
    assert {m["module"] for m in b.modules} == {"manufacturing", "research", "invention"}
    assert b.unknown == ["Some New Service"]


def test_refineries_and_shipyards():
    assert fuel.burn(ATHANOR, [svc("Moon Drilling"), svc("Reprocessing")]).online == pytest.approx((5 + 10) * 0.8)
    assert fuel.burn(TATARA, [svc("Composite Reactions"), svc("Hybrid Reactions")]).online == pytest.approx(30 * 0.75)
    sotiyo = fuel.burn(35827, [svc("Manufacturing (Capitals)"), svc("Manufacturing (Super Capitals)")])
    assert sotiyo.online == pytest.approx((24 + 36) * 0.75)
    # A structure type not in the table falls back on its SDE group; anything else gets no bonus.
    assert fuel.burn(99999, [CLONE], group_id=1657).online == pytest.approx(7.5)
    assert fuel.burn(99998, [CLONE]).online == 10


def test_flex_structures_burn_a_fixed_rate_while_fuelled():
    assert fuel.burn(ANSIBLEX, []).online == 30
    assert fuel.burn(ANSIBLEX, [], fuelled=False).online == 0
    assert fuel.burn(METENOX, [svc("Moon Drilling")]).online == 5


def test_need_and_refuel_detection():
    b = fuel.Burn(10, 10, [], [])
    assert services.need_for(48, b, 7) == 1200
    assert services.need_for(200, b, 7) == 0
    assert services.need_for(None, fuel.Burn(0, 12, [], []), 1) == 288  # out of fuel: planned at every fitted service
    now = timezone.now()
    assert services.went_up(now, 10, now + timedelta(hours=7), 10)
    assert not services.went_up(now, 10, now + timedelta(minutes=30), 10)  # ESI's estimate wobbling
    assert not services.went_up(now, 20, now + timedelta(days=2), 10)  # a service went offline
    assert services.went_up(None, 0, now + timedelta(days=2), 10)  # was out of fuel


# --- the board and the plan -----------------------------------------------------------------------------------------


def test_board_and_plan(setup, corp, api_client):
    viewer, boss = setup
    a = structure(corp, 1, 48, services_=(CLONE, MARKET))
    structure(corp, 2, 500, type_id=RAITARU, services_=(svc("Manufacturing (Standard)"),), system=30000144)
    structure(corp, 3, None, type_id=ASTRAHUS, services_=(svc("Clone Bay", "offline"),), state="low_power")
    api_client.force_login(viewer)
    data = api_client.call("get", f"{BASE}/board").json()
    rows = {r["id"]: r for r in data["structures"]}
    assert [r["id"] for r in data["structures"]] == [3, 1, 2]  # out of fuel first, then least fuel left
    assert rows[1]["burn"] == 37.5 and rows[1]["level"] == "warning" and rows[1]["thresholds"] == [168, 72, 24]
    assert rows[3]["level"] == "empty" and rows[2]["level"] == "ok"
    assert data["corporations"][0]["ticker"] == "TCORP" and not data["can_manage"]

    plan = api_client.call("get", f"{BASE}/plan?days=7").json()
    groups = {g["label"]: g for g in plan["groups"]}
    # Astrahus 1: 120 hours short at 37.5 an hour; Astrahus 3 (out of fuel): 168 hours of its clone bay at 7.5.
    assert groups["System 30000142"]["blocks"] == 4500 + 1260
    assert groups["System 30000144"]["blocks"] == 0
    assert plan["blocks"] == 5760 and plan["volume"] == 5760 * 5

    StructureFuel.objects.create(structure_id=a.structure_id, staging="Home")
    plan = api_client.call("get", f"{BASE}/plan?days=7").json()
    assert {g["label"]: g["blocks"] for g in plan["groups"]}["Home"] == 4500
    assert api_client.call("get", f"{BASE}/plan?days=0").json()["days"] == 30  # the settings' days
    assert api_client.call("get", f"{BASE}/plan?days=999").status_code == 400

    summary = api_client.call("get", f"{BASE}/summary").json()
    assert summary["low"] == 2 and summary["danger"] == 1 and summary["worst"][0]["id"] == 3


# --- warnings -------------------------------------------------------------------------------------------------------


def warned(user):
    return list(Notification.objects.filter(user=user, category="p.structures").order_by("id").values_list("title", flat=True))


def test_each_threshold_warns_once_until_refuelled(setup, corp, events):
    viewer, boss = setup
    s = structure(corp, 1, 100)

    assert services.check()["warnings"] == 1
    assert warned(viewer) == ["Citadel 1 has under 7.0 days of fuel"]
    assert [e[1]["threshold_hours"] for e in events if e[0] == "structures.fuel_low"] == [168]
    assert services.check()["warnings"] == 0  # not again while it stays there

    # The core's own 72 hour warning went to the same people: the event goes out, no second notification.
    refuel(s, 60)
    assert services.check()["warnings"] == 1
    assert [e[1]["threshold_hours"] for e in events if e[0] == "structures.fuel_low"] == [168, 72]
    assert len(warned(viewer)) == 1

    refuel(s, 20)
    services.check()
    assert warned(viewer)[-1] == "Citadel 1 has under 24 hours of fuel"
    assert Notification.objects.get(user=viewer, title__contains="24 hours").level == "danger"

    refuel(s, 400)
    out = services.check()
    assert out["refuels"] == 1 and out["warnings"] == 0
    assert StructureFuel.objects.get(structure_id=1).warned == []
    refuel(s, 150)
    assert services.check()["warnings"] == 1  # below 7 days again: told again
    assert len(warned(viewer)) == 3


def test_a_structure_found_low_warns_only_at_its_worst_threshold(setup, corp, events):
    viewer, _ = setup
    structure(corp, 1, 10)
    services.check()
    assert warned(viewer) == ["Citadel 1 has under 24 hours of fuel"]
    assert StructureFuel.objects.get(structure_id=1).warned == [168, 72, 24]


def test_per_structure_thresholds_and_switching_off(setup, corp, api_client, events):
    viewer, boss = setup
    structure(corp, 1, 100)
    structure(corp, 2, 100)
    api_client.force_login(boss)
    assert api_client.call("put", f"{BASE}/structures/1", {"thresholds": []}).status_code == 200
    assert api_client.call("put", f"{BASE}/structures/2", {"thresholds": [120, 120, 6], "staging": "Home"}).status_code == 200
    assert api_client.call("put", f"{BASE}/structures/2", {"thresholds": [0]}).status_code == 400
    assert StructureFuel.objects.get(structure_id=2).thresholds == [120, 6]
    services.check()
    assert warned(viewer) == ["Citadel 2 has under 5.0 days of fuel"]

    # Back to the defaults.
    api_client.call("put", f"{BASE}/structures/1", {"thresholds": None})
    services.check()
    assert "Citadel 1 has under 7.0 days of fuel" in warned(viewer)


def test_warnings_go_to_the_chosen_groups_who_may_see_the_structure(setup, corp, events):
    viewer, boss = setup
    fuel_team = Group.objects.create(name="Fuel team")
    in_group = corp_perm(make_user(90000002, "Hauler Hal", corporation=corp))
    no_access = make_user(90000003, "Blind Bob", corporation=corp)
    for u in (in_group, no_access):
        u.groups.add(fuel_team)
    s = StructuresSettings.load()
    s.groups.set([fuel_team])
    structure(corp, 1, 100)
    services.check()
    assert warned(in_group) and not warned(viewer) and not warned(no_access)

    s.notify = False
    s.save()
    structure(corp, 2, 100)
    services.check()
    assert len(warned(in_group)) == 1  # notifications off: only the event
    assert [e[1]["structure_id"] for e in events if e[0] == "structures.fuel_low"] == [1, 2]


# --- claims ---------------------------------------------------------------------------------------------------------


def test_claims_clear_when_the_fuel_goes_up(setup, corp, api_client, events):
    viewer, boss = setup
    s = structure(corp, 1, 30)
    services.check()
    api_client.force_login(viewer)
    assert api_client.call("post", f"{BASE}/structures/1/claim", {"note": "Hauling 2k from Jita"}).status_code == 200
    row = api_client.call("get", f"{BASE}/board").json()["structures"][0]
    assert row["my_claim"]["note"] == "Hauling 2k from Jita" and row["claims"][0]["user"] == "Fuel Fred"
    assert [e[0] for e in events] == ["structures.fuel_low", "structures.refuel_claimed"]

    # Taking a service offline makes the fuel last longer, but isn't a refuel.
    Structure.objects.filter(pk=s.pk).update(services=[svc("Clone Bay", "offline")], fuel_expires=timezone.now() + timedelta(hours=60))
    assert services.check()["finished_claims"] == 0 and Claim.objects.exists()

    Structure.objects.filter(pk=s.pk).update(services=[CLONE])
    refuel(s, 30 + 24 * 20)
    out = services.check()
    assert out["finished_claims"] == 1 and not Claim.objects.exists()
    done = [e[1] for e in events if e[0] == "structures.refuelled"]
    assert done[-1]["claimed_by"] == ["Fuel Fred"]


def test_claims_run_out_and_can_be_dropped(setup, corp, api_client):
    viewer, boss = setup
    structure(corp, 1, 30)
    api_client.force_login(viewer)
    api_client.call("post", f"{BASE}/structures/1/claim", {})
    api_client.call("delete", f"{BASE}/structures/1/claim")
    assert not Claim.objects.exists()

    api_client.call("post", f"{BASE}/structures/1/claim", {})
    Claim.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert api_client.call("get", f"{BASE}/board").json()["structures"][0]["claims"] == []
    assert services.check()["expired_claims"] == 1


# --- who may see what -----------------------------------------------------------------------------------------------


def test_structures_follow_the_corporation_sheet(setup, corp, api_client):
    viewer, boss = setup
    other = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER", alliance=EveAlliance.objects.create(id=99000002, name="Other", ticker="OTH"))
    structure(corp, 1, 100)
    structure(other, 2, 100)

    api_client.force_login(viewer)
    assert [r["id"] for r in api_client.call("get", f"{BASE}/board").json()["structures"]] == [1]
    assert api_client.call("post", f"{BASE}/structures/2/claim", {}).status_code == 404

    nobody = make_user(90000004, "No Perms", corporation=corp)
    api_client.force_login(nobody)
    data = api_client.call("get", f"{BASE}/board").json()
    assert data["structures"] == [] and not data["can_view"]
    assert api_client.call("post", f"{BASE}/structures/1/claim", {}).status_code == 404

    seer = corp_perm(make_user(90000005, "All Seeing", corporation=corp), "view_all_corporations")
    api_client.force_login(seer)
    assert {r["id"] for r in api_client.call("get", f"{BASE}/board").json()["structures"]} == {1, 2}

    # Recipients follow it too: nobody in Test Corp is told about Other Corp's structure.
    services.check()
    assert not Notification.objects.filter(user=viewer, title__startswith="Citadel 2").exists()
    assert Notification.objects.filter(user=seer, title__startswith="Citadel 2").exists()


def test_only_managers_change_settings(setup, corp, api_client):
    viewer, boss = setup
    other = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER")
    structure(other, 2, 30)
    api_client.force_login(viewer)
    assert api_client.call("get", f"{BASE}/settings").status_code == 403
    assert api_client.call("put", f"{BASE}/structures/2", {"thresholds": []}).status_code == 403

    api_client.force_login(boss)
    assert api_client.call("put", f"{BASE}/structures/2", {"thresholds": []}).status_code == 404  # can't see it
    s = api_client.call("get", f"{BASE}/settings").json()
    assert s["thresholds"] == [168, 72, 24] and s["core_warning_hours"] == 72
    bad = api_client.call("put", f"{BASE}/settings", {**s, "thresholds": [168, 99999]})
    assert bad.status_code == 400
    ok = api_client.call("put", f"{BASE}/settings", {**s, "thresholds": [24, 336], "plan_days": 14}).json()
    assert ok["thresholds"] == [336, 24] and ok["plan_days"] == 14


def test_guests_get_nothing(setup, api_client):
    guest = make_user(90000070, "Just Visiting", member=False)
    api_client.force_login(guest)
    assert api_client.call("get", f"{BASE}/board").status_code in (403, 404)
