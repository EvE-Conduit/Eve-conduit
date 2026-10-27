"""Planetary Industry: output estimates, extractor reminders once per program, the digest, the corporation view and
who may see what."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.accounts.models import Character, UserPreferences
from conduit.eve.models import EveCorporation, MarketPrice
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType, PlanetSchematic
from conduit.sheet.planets.models import Colony
from conduit_pi import services
from conduit_pi.models import Digest, Reminder
from tests.conftest import make_user

AQUEOUS, WATER, ELECTROLYTES, COOLANT = 2268, 3645, 2390, 9832
ECU, BASIC, ADVANCED, STORAGE = 2848, 2473, 2474, 2541
WATER_SCHEMATIC, COOLANT_SCHEMATIC, SILICON_SCHEMATIC = 121, 66, 131


@pytest.fixture
def sde(db):
    ItemCategory.objects.create(id=41, name="Planetary Interaction", published=True)
    ItemCategory.objects.create(id=42, name="Planetary Resources", published=True)
    ItemCategory.objects.create(id=43, name="Planetary Commodities", published=True)
    ItemGroup.objects.create(id=1033, category_id=42, name="Planet Liquid-Gas - Raw Resource", published=True)
    ItemGroup.objects.create(id=1042, category_id=43, name="Basic Commodities - Tier 1", published=True)
    ItemGroup.objects.create(id=1034, category_id=43, name="Refined Commodities - Tier 2", published=True)
    ItemGroup.objects.create(id=1063, category_id=41, name="Extractor Control Units", published=True)
    ItemGroup.objects.create(id=1028, category_id=41, name="Processors", published=True)
    ItemGroup.objects.create(id=1029, category_id=41, name="Storage Facilities", published=True)
    for tid, name, group, volume, capacity in (
        (AQUEOUS, "Aqueous Liquids", 1033, 0.005, None), (WATER, "Water", 1042, 0.38, None),
        (ELECTROLYTES, "Electrolytes", 1042, 0.38, None), (COOLANT, "Coolant", 1034, 1.5, None),
        (ECU, "Barren Extractor Control Unit", 1063, 0, None), (BASIC, "Barren Basic Industry Facility", 1028, 0, None),
        (ADVANCED, "Barren Advanced Industry Facility", 1028, 0, None), (STORAGE, "Barren Storage Facility", 1029, 0, 12000),
    ):
        ItemType.objects.create(id=tid, group_id=group, name=name, published=True, volume=volume, capacity=capacity)
    PlanetSchematic.objects.create(id=WATER_SCHEMATIC, name="Water", cycle_time=1800)
    PlanetSchematic.objects.create(id=COOLANT_SCHEMATIC, name="Coolant", cycle_time=3600)
    PlanetSchematic.objects.create(id=SILICON_SCHEMATIC, name="Silicon", cycle_time=1800)
    MarketPrice.objects.create(type_id=AQUEOUS, average_price=10.0)
    MarketPrice.objects.create(type_id=WATER, average_price=500.0)
    MarketPrice.objects.create(type_id=COOLANT, average_price=12000.0)


@pytest.fixture
def setup(sde, corp):
    sync_installed()
    set_enabled("pi", True)
    member = make_user(90000001, "Pi Farmer", corporation=corp)
    return member


def _ts(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def extractor(pin_id, expires_in, product=AQUEOUS, qty=6000, cycle=1800, installed_ago=timedelta(days=3)):
    now = timezone.now()
    return {"pin_id": pin_id, "type_id": ECU, "install_time": _ts(now - installed_ago), "expiry_time": _ts(now + expires_in),
            "extractor_details": {"product_type_id": product, "qty_per_cycle": qty, "cycle_time": cycle, "heads": [{}] * 10}}


def colony(char, planet_id, pins, routes=(), name=None, level=4):
    return Colony.objects.create(character=char, planet_id=planet_id, planet_name=name or f"Planet {planet_id}", planet_type="barren",
                                 solar_system_id=30000142, upgrade_level=level, num_pins=len(pins), last_update=timezone.now(),
                                 layout={"pins": list(pins), "routes": list(routes)})


def route(src, dst, type_id, qty=0):
    return {"source_pin_id": src, "destination_pin_id": dst, "content_type_id": type_id, "quantity": qty, "route_id": src * 1000 + dst}


def capture(monkeypatch):
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name.startswith("pi.") and emitted.append((name, kw)))
    return emitted


def factory_colony(char):
    """Extracts Aqueous Liquids, makes Water from it and Coolant from Water and hauled-in Electrolytes."""
    pins = [
        extractor(1, timedelta(hours=30)),
        extractor(2, timedelta(hours=-5)),  # stopped: makes nothing
        {"pin_id": 10, "type_id": BASIC, "schematic_id": WATER_SCHEMATIC},
        {"pin_id": 11, "type_id": BASIC, "schematic_id": SILICON_SCHEMATIC},  # nothing routed in: idle
        {"pin_id": 20, "type_id": ADVANCED, "factory_details": {"schematic_id": COOLANT_SCHEMATIC}},
        {"pin_id": 30, "type_id": STORAGE, "contents": [{"type_id": WATER, "amount": 1000}, {"type_id": ELECTROLYTES, "amount": 500}]},
    ]
    routes = [route(1, 30, AQUEOUS), route(30, 10, AQUEOUS), route(10, 30, WATER), route(30, 20, WATER), route(30, 20, ELECTROLYTES)]
    return colony(char, 40000001, pins, routes, name="Barren I")


# --- output -----------------------------------------------------------------------------------------------------------


def test_output_estimate_nets_what_factories_use(setup):
    factory_colony(setup.main_character)
    data = services.me(setup)
    c = data["colonies"][0]
    by_type = {o["type"]["id"]: o for o in c["output"]}
    # Extractor: 6000 every 30 minutes = 288000 a day; the Water factory uses 3000 a run, 48 runs = 144000.
    assert by_type[AQUEOUS]["per_day"] == 288000 - 144000
    # Water: 20 a run, 48 runs = 960; Coolant uses 40 an hour = 960: none left over.
    assert WATER not in by_type
    assert by_type[COOLANT]["per_day"] == 5 * 24 and by_type[COOLANT]["type"]["tier"] == 2
    assert c["inputs"] == [{"type": c["inputs"][0]["type"], "per_day": 960}] and c["inputs"][0]["type"]["id"] == ELECTROLYTES
    assert c["isk_per_day"] == 144000 * 10 + 120 * 12000
    assert data["totals"]["isk_per_day"] == c["isk_per_day"]
    # Factories grouped by schematic, idle ones counted.
    facts = {f["schematic"]: f for f in c["factories"]}
    assert facts["Water"]["running"] == 1 and facts["Silicon"]["running"] == 0 and facts["Coolant"]["product"]["id"] == COOLANT
    # Storage: 1000 Water at 0.38 + 500 Electrolytes at 0.38 = 570 m3 of 12000.
    assert c["storage"][0]["used"] == 570 and c["storage"][0]["pct"] == 4.8
    assert [e["status"] for e in c["extractors"]] == ["expired", "running"]
    assert c["active"] == 1 and c["expired"] == 1


def test_totals_net_across_colonies(setup):
    """Water made on one planet and turned into Coolant on another isn't counted twice."""
    char = setup.main_character
    colony(char, 1, [{"pin_id": 1, "type_id": BASIC, "schematic_id": WATER_SCHEMATIC}], [route(9, 1, AQUEOUS), route(1, 9, WATER)])
    colony(char, 2, [{"pin_id": 1, "type_id": ADVANCED, "schematic_id": COOLANT_SCHEMATIC}], [route(9, 1, WATER), route(9, 1, ELECTROLYTES)])
    totals = services.me(setup)["totals"]
    assert [(o["type"]["id"], o["per_day"]) for o in totals["output"]] == [(COOLANT, 120)]
    assert {i["type"]["id"]: i["per_day"] for i in totals["inputs"]} == {AQUEOUS: 144000, ELECTROLYTES: 960}


def test_status_follows_the_members_lead_time(setup):
    char = setup.main_character
    colony(char, 1, [extractor(1, timedelta(hours=3)), extractor(2, timedelta(hours=1)), extractor(3, timedelta(hours=-1))])
    statuses = lambda: [e["status"] for e in services.me(setup)["colonies"][0]["extractors"]]  # noqa: E731
    assert statuses() == ["expired", "soon", "running"]
    UserPreferences.objects.update_or_create(user=setup, defaults={"plugins": {"pi": {"lead_hours": 4}}})
    assert statuses() == ["expired", "soon", "soon"]


def test_settings_are_cleaned():
    assert services.clean_settings(None) == services.DEFAULTS
    assert services.clean_settings({"lead_hours": "x", "soon": "yes", "digest": True}) == {**services.DEFAULTS, "digest": True}
    assert services.clean_settings({"lead_hours": 999})["lead_hours"] == services.MAX_LEAD_HOURS
    assert services.clean_settings({"lead_hours": 0})["lead_hours"] == 1


# --- reminders --------------------------------------------------------------------------------------------------------


def test_reminders_fire_once_per_extractor_cycle(setup, monkeypatch):
    emitted = capture(monkeypatch)
    char = setup.main_character
    c = colony(char, 1, [extractor(1, timedelta(minutes=90)), extractor(2, timedelta(hours=10))], name="Barren I")
    assert services.send_reminders() == 1
    assert services.send_reminders() == 0  # already told
    n = Notification.objects.get(user=setup)
    assert n.title.startswith("Extractor on Barren I expires in 1h") and "Aqueous Liquids" in n.body
    assert [name for name, _ in emitted] == ["pi.extractors_expiring"] and emitted[0][1]["count"] == 1

    # The program runs out: told once more, as expired.
    later = timezone.now() + timedelta(hours=2)
    assert services.send_reminders(now=later) == 1
    assert services.send_reminders(now=later + timedelta(minutes=10)) == 0
    assert emitted[-1][0] == "pi.extractors_expired"
    assert Notification.objects.filter(user=setup).count() == 2

    # Restarted in game: a new expiry is a new cycle, reminded again.
    c.layout["pins"][0] = extractor(1, timedelta(minutes=30), installed_ago=timedelta(days=1))
    c.save()
    assert services.send_reminders() == 1
    assert Reminder.objects.filter(pin_id=1).count() == 3


def test_reminders_respect_settings(setup, monkeypatch):
    capture(monkeypatch)
    char = setup.main_character
    colony(char, 1, [
        extractor(1, timedelta(hours=5)),
        extractor(2, timedelta(minutes=30), installed_ago=timedelta(minutes=30)),  # a one-hour program started by hand
        extractor(3, timedelta(days=-3)),  # long gone when first seen
    ])
    assert services.send_reminders() == 0
    UserPreferences.objects.update_or_create(user=setup, defaults={"plugins": {"pi": {"lead_hours": 6, "expired": False}}})
    assert services.send_reminders() == 1
    assert Reminder.objects.get().pin_id == 1
    UserPreferences.objects.filter(user=setup).update(plugins={"pi": {"soon": False, "expired": False}})
    assert services.send_reminders(now=timezone.now() + timedelta(hours=6)) == 0


def test_reminders_group_and_skip_non_members(setup, corp, monkeypatch):
    emitted = capture(monkeypatch)
    alt = Character.objects.create(id=90000002, name="Pi Alt", owner_hash="h2", user=setup, corporation=corp)
    colony(setup.main_character, 1, [extractor(1, timedelta(minutes=20))])
    colony(alt, 2, [extractor(1, timedelta(minutes=40))])
    guest = make_user(90000010, "Guest Pilot", member=False)
    colony(guest.main_character, 3, [extractor(1, timedelta(minutes=20))])
    assert services.send_reminders() == 2
    assert Notification.objects.get(user=setup).title == "2 extractors expire within 2 hours"
    assert not Notification.objects.filter(user=guest).exists()
    assert len(emitted) == 1 and emitted[0][1]["user_id"] == setup.pk


def test_nothing_when_switched_off(setup):
    colony(setup.main_character, 1, [extractor(1, timedelta(minutes=20))])
    set_enabled("pi", False)
    from conduit_pi import tasks

    tasks.reminders()
    assert not Reminder.objects.exists()


def test_digest_once_a_day_for_those_who_want_it(setup, corp):
    other = make_user(90000003, "No Digest", corporation=corp)
    colony(setup.main_character, 1, [extractor(1, timedelta(hours=10)), extractor(2, timedelta(hours=-1))])
    colony(other.main_character, 2, [extractor(1, timedelta(hours=10))])
    UserPreferences.objects.update_or_create(user=setup, defaults={"plugins": {"pi": {"digest": True}}})
    assert services.send_digests() == 1
    assert services.send_digests() == 0
    n = Notification.objects.get(user=setup)
    assert n.title == "PI: 1 extractor not running, 1 expires in the next 24 hours"
    assert Digest.objects.get(user=setup).sent_on == timezone.now().date()
    assert not Notification.objects.filter(user=other).exists()


# --- the corporation view ----------------------------------------------------------------------------------------------


def _perm(user, app, codename):
    user.user_permissions.add(Permission.objects.get(content_type__app_label=app, codename=codename))
    return type(user).objects.get(pk=user.pk)


@pytest.fixture
def corp_setup(setup, corp):
    officer = _perm(make_user(90000050, "PI Officer", corporation=corp), "pi", "view_corp_pi")
    second = make_user(90000004, "Second Farmer", corporation=corp)
    outsider_corp = EveCorporation.objects.create(id=98000002, name="Other Corp", ticker="OTHER")
    outsider = make_user(90000005, "Outsider", corporation=outsider_corp)
    factory_colony(setup.main_character)
    colony(second.main_character, 2, [extractor(1, timedelta(hours=20))], name="Gas II")
    old = colony(second.main_character, 3, [extractor(1, timedelta(days=-10))], name="Lava III")
    colony(outsider.main_character, 4, [extractor(1, timedelta(hours=20))])
    return officer, second, outsider, old


def test_corp_view_needs_the_permission(corp_setup, setup, api_client):
    api_client.force_login(setup)
    assert api_client.call("get", "/api/p/pi/corp").status_code == 403
    assert api_client.call("get", "/api/p/pi/me").status_code == 200


def test_corp_view_is_limited_by_sheet_access(corp_setup, api_client):
    officer, *_ = corp_setup
    api_client.force_login(officer)
    # The plugin permission alone shows only what their sheet access covers: their own characters.
    assert api_client.call("get", "/api/p/pi/corp").json()["totals"]["colonies"] == 0
    officer = _perm(officer, "sheet", "view_corporation_characters")
    api_client.force_login(officer)
    data = api_client.call("get", "/api/p/pi/corp").json()
    assert data["totals"]["colonies"] == 3 and data["totals"]["members"] == 2  # not the other corporation's
    assert [c["name"] for c in data["corporations"]] == ["Test Corp"]


def test_corp_aggregation_and_idle_colonies(corp_setup, setup):
    officer, second, outsider, old = corp_setup
    officer = _perm(officer, "sheet", "view_all_characters")
    data = services.corp_overview(officer, idle_days=3)
    products = {p["type"]["id"]: p for p in data["products"]}
    # Aqueous Liquids: the farmer's 144000 left over plus 288000 a day from each of the other two.
    assert products[AQUEOUS]["per_day"] == 144000 + 288000 * 2
    assert [p["name"] for p in products[AQUEOUS]["producers"]] == ["Second Farmer", "Outsider", "Pi Farmer"]
    assert [p["name"] for p in products[COOLANT]["producers"]] == ["Pi Farmer"]
    assert data["products"][0]["type"]["id"] == COOLANT  # highest tier first
    assert [i["planet"] for i in data["idle"]] == ["Lava III"] and data["idle"][0]["days"] == 10
    assert data["idle"][0]["member"] == "Second Farmer"
    members = {m["name"]: m for m in data["members"]}
    assert members["Second Farmer"]["idle"] == 1 and members["Second Farmer"]["active"] == 1
    # Longer than it has been idle: not listed.
    assert services.corp_overview(officer, idle_days=11)["idle"] == []
    # One corporation only.
    only = services.corp_overview(officer, corporation_id=outsider.main_character.corporation_id)
    assert only["totals"]["members"] == 1 and only["members"][0]["name"] == "Outsider"


# --- the widget and pages ---------------------------------------------------------------------------------------------


def test_widget_lists_what_runs_out_next(setup, api_client):
    colony(setup.main_character, 1, [extractor(1, timedelta(hours=8)), extractor(2, timedelta(hours=1)), extractor(3, timedelta(hours=-2))],
           name="Barren I")
    api_client.force_login(setup)
    data = api_client.call("get", "/api/p/pi/upcoming").json()
    assert data["expired"] == 1 and data["running"] == 2
    assert [n["status"] for n in data["next"]] == ["soon", "running"] and data["next"][0]["product"]["name"] == "Aqueous Liquids"


def test_me_lists_characters_and_settings(setup, api_client):
    factory_colony(setup.main_character)
    api_client.force_login(setup)
    data = api_client.call("get", "/api/p/pi/me").json()
    assert data["characters"] == [{"id": 90000001, "name": "Pi Farmer", "portrait": data["characters"][0]["portrait"],
                                   "colonies": 1, "has_scope": False}]
    assert data["settings"] == services.DEFAULTS and data["can_view_corp"] is False
    # Settings go through the core per-user plugin settings.
    api_client.call("put", "/api/me/preferences/plugins/pi", {"value": {"lead_hours": 5, "digest": True}})
    assert api_client.call("get", "/api/p/pi/me").json()["settings"] == {**services.DEFAULTS, "lead_hours": 5, "digest": True}
