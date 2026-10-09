"""The SeAT history import for item-like snapshot sections: assets, blueprints, planets, research, fittings."""

import pytest

from conduit.accounts.models import Token
from conduit.sde.models import ItemCategory, ItemGroup, ItemType
from conduit.sheet.assets.models import Asset
from conduit.sheet.blueprints.models import Blueprint
from conduit.sheet.fittings.models import Fitting
from conduit.sheet.models import Location, SyncStatus
from conduit.sheet.planets.models import Colony
from conduit.sheet.research.models import ResearchAgent

from .conftest import make_user
from .seat_history import run, token_row, write_dump

DEAD, LIVE = 91000101, 91000102
SECTIONS = ["assets", "blueprints", "planets", "research", "fittings"]
JITA = 60003760
SHIP, CONTAINER, BPO_ITEM = 1000000000001, 1000000000002, 1000000000003
PLANET = 40009077
TS = {"created_at": "2024-01-01 00:00:00", "updated_at": "2025-02-28 00:00:00"}


def asset(cid, item_id, type_id, location_id, location_type, flag, singleton, name=None, quantity=1, bpc=None):
    return {"item_id": item_id, "character_id": cid, "type_id": type_id, "quantity": quantity,
            "location_id": location_id, "location_flag": flag, "is_singleton": singleton,
            "is_blueprint_copy": bpc, "x": None, "y": None, "z": None, "map_id": None, "map_name": None,
            "name": name, **TS, "location_type": location_type}


def planet_rows(cid):
    p = {"character_id": cid, "planet_id": PLANET}
    return {
        "character_planets": [{"id": 1, **p, "solar_system_id": 30000142, "upgrade_level": 4, "num_pins": 3,
                               "last_update": "2025-02-20 08:30:00", "planet_type": "barren", **TS}],
        "character_planet_pins": [
            {**p, "pin_id": 1021, "type_id": 2848, "schematic_id": None, "latitude": 1.25, "longitude": 2.5,
             "install_time": "2025-02-20 08:30:00", "expiry_time": "2025-02-23 08:30:00",
             "last_cycle_start": "2025-02-20 08:30:00", **TS},
            {**p, "pin_id": 1022, "type_id": 2473, "schematic_id": 121, "latitude": 1.3, "longitude": 2.6,
             "install_time": None, "expiry_time": None, "last_cycle_start": "2025-02-20 09:00:00", **TS},
            {**p, "pin_id": 1023, "type_id": 2541, "schematic_id": None, "latitude": 1.4, "longitude": 2.7,
             "install_time": None, "expiry_time": None, "last_cycle_start": None, **TS},
        ],
        "character_planet_extractors": [{**p, "pin_id": 1021, "product_type_id": 2267, "cycle_time": 1800,
                                         "head_radius": 0.02, "qty_per_cycle": 5400, **TS}],
        "character_planet_factories": [{**p, "pin_id": 1022, "schematic_id": 121.0, **TS}],
        "character_planet_heads": [
            {"id": 11, **p, "extractor_id": 1021, "head_id": 0, "latitude": 1.2, "longitude": 2.4, **TS},
            {"id": 12, **p, "extractor_id": 1021, "head_id": 1, "latitude": 1.21, "longitude": 2.41, **TS},
        ],
        "character_planet_contents": [{"id": 21, **p, "pin_id": 1023, "type_id": 2393, "amount": 12000, **TS}],
        "character_planet_links": [{"id": 31, **p, "source_pin_id": 1021, "destination_pin_id": 1023,
                                    "link_level": 0, **TS}],
        "character_planet_routes": [{**p, "route_id": 41, "source_pin_id": 1021, "destination_pin_id": 1022,
                                     "content_type_id": 2267, "quantity": 3000.0, **TS}],
        "character_planet_route_waypoints": [
            {"id": 52, **p, "route_id": 41, "pin_id": 1023, **TS},
            {"id": 53, **p, "route_id": 41, "pin_id": 1022, **TS},
        ],
    }


def dump(tmp_path):
    planets = planet_rows(DEAD)
    for table, rows in planet_rows(LIVE).items():  # the live character's SeAT copy must not come over
        planets[table] += [{**r, **({"id": r["id"] + 1000} if "id" in r else {}),
                            **({"pin_id": r["pin_id"] + 1000} if "pin_id" in r else {})} for r in rows
                           if table != "character_planet_routes"]
    return write_dump(tmp_path / "seat.sql", {
        "refresh_tokens": [token_row(DEAD, deleted_at="2025-03-02 00:00:00"), token_row(LIVE)],
        "universe_names": [{"entity_id": 3018681, "name": "Some Agent", "category": "character"}],
        "universe_stations": [{"station_id": JITA, "name": "Jita IV - Moon 4 - Caldari Navy Assembly Plant",
                               "system_id": 30000142, "type_id": 1531, "owner": 1000035}],
        "character_assets": [
            asset(DEAD, SHIP, 587, JITA, "station", "Hangar", 1, name="My Rifter"),
            asset(DEAD, CONTAINER, 3465, JITA, "station", "Hangar", 1, name=None),
            asset(DEAD, BPO_ITEM, 691, CONTAINER, "item", "Unlocked", 1, bpc=0),
            asset(DEAD, 1000000000004, 34, SHIP, "item", "Cargo", 0, quantity=5000),
            asset(LIVE, 1000000000099, 34, JITA, "station", "Hangar", 0, quantity=1),
        ],
        "character_blueprints": [
            {"item_id": BPO_ITEM, "character_id": DEAD, "type_id": 691, "location_flag": "Unlocked",
             "location_id": CONTAINER, "quantity": -1, "time_efficiency": 20, "material_efficiency": 10,
             "runs": -1, **TS},
            {"item_id": 1000000000005, "character_id": DEAD, "type_id": 692, "location_flag": "Hangar",
             "location_id": JITA, "quantity": -2, "time_efficiency": 4, "material_efficiency": 2, "runs": 10, **TS},
            {"item_id": 1000000000098, "character_id": LIVE, "type_id": 692, "location_flag": "Hangar",
             "location_id": JITA, "quantity": -2, "time_efficiency": 0, "material_efficiency": 0, "runs": 1, **TS},
        ],
        **planets,
        "planets": [{"planet_id": PLANET, "system_id": 30000142, "constellation_id": 20000020,
                     "region_id": 10000002, "name": "Jita IV", "type_id": 2016, "x": 1.0, "y": 2.0, "z": 3.0,
                     "radius": 5000000.0, "celestial_index": 4}],
        "character_agent_research": [
            {"id": 1, "character_id": DEAD, "agent_id": 3018681, "skill_type_id": 11433,
             "started_at": "2019-04-01 10:00:00", "points_per_day": 85.75, "remainder_points": 12.5, **TS},
            {"id": 2, "character_id": LIVE, "agent_id": 3018682, "skill_type_id": 11433,
             "started_at": "2019-04-01 10:00:00", "points_per_day": 1.0, "remainder_points": 0.0, **TS},
        ],
        "character_fittings": [
            {"id": 1, "character_id": DEAD, "fitting_id": 7001, "name": "PvP Rifter",
             "description": "Scram, web, guns", "ship_type_id": 587, **TS},
            {"id": 2, "character_id": DEAD, "fitting_id": 7002, "name": "Empty", "description": "",
             "ship_type_id": 588, **TS},
            {"id": 3, "character_id": LIVE, "fitting_id": 7099, "name": "Old", "description": "",
             "ship_type_id": 587, **TS},
        ],
        "character_fitting_items": [
            {"id": 10, "fitting_id": 7001, "type_id": 2873, "flag": "HiSlot0", "quantity": 1, **TS},
            {"id": 11, "fitting_id": 7001, "type_id": 5443, "flag": "MedSlot0", "quantity": 1, **TS},
            {"id": 12, "fitting_id": 7001, "type_id": 178, "flag": "Cargo", "quantity": 200, **TS},
            {"id": 13, "fitting_id": 7099, "type_id": 178, "flag": "Cargo", "quantity": 1, **TS},
        ],
    })


@pytest.fixture
def people(db):
    ItemCategory.objects.create(id=6, name="Ship", published=True)
    ItemGroup.objects.create(id=25, category_id=6, name="Frigate", published=True)
    ItemGroup.objects.create(id=12, category_id=2, name="Cargo Container", published=True)
    ItemType.objects.create(id=587, name="Rifter", group_id=25, published=True)
    ItemType.objects.create(id=3465, name="Large Secure Container", group_id=12, published=True)

    dead = make_user(DEAD, "Gone Pilot").main_character
    Token.objects.filter(character=dead).update(valid=False)
    live = make_user(LIVE, "Live Pilot").main_character
    # Every section already synced from EVE for the live character.
    Asset.objects.create(character=live, item_id=5, type_id=35, quantity=9, location_id=JITA, location_type="station",
                         location_flag="Hangar", is_singleton=False, root_location_id=JITA)
    Blueprint.objects.create(character=live, item_id=6, type_id=693, location_id=JITA, root_location_id=JITA,
                             location_flag="Hangar", quantity=-1, runs=-1, material_efficiency=10, time_efficiency=20)
    Colony.objects.create(character=live, planet_id=1, planet_name="From EVE", planet_type="gas",
                          solar_system_id=30000142, upgrade_level=5, num_pins=1, last_update="2025-03-01T00:00:00Z",
                          layout={"pins": []})
    ResearchAgent.objects.create(character=live, agent_id=1, skill_type_id=11433, started_at="2025-01-01T00:00:00Z",
                                 points_per_day=99.0, remainder_points=1.0)
    Fitting.objects.create(character=live, fitting_id=1, name="From EVE", ship_type_id=587, items=[])
    for key in SECTIONS:
        SyncStatus.objects.create(character=live, section=key, result="ok", last_success="2025-03-05T00:00:00Z")
    return dead, live


def counts():
    return [m.objects.count() for m in (Asset, Blueprint, Colony, ResearchAgent, Fitting)]


@pytest.mark.django_db
def test_item_sections_come_over_for_characters_without_eve_data(tmp_path, people):
    dead, live = people
    summary = run(dump(tmp_path), sections=SECTIONS)
    assert not summary["errors"], summary["errors"]
    for key in SECTIONS:
        assert summary["sections"][key] == {"imported": 1, "skipped": 1, "errors": 0}, key
        status = SyncStatus.objects.get(character=dead, section=key)
        assert status.message == "From SeAT, data as of 2025-03-01"

    # Assets: the tree, the names SeAT kept for ships, and where everything ultimately sits.
    items = {a.item_id: a for a in Asset.objects.filter(character=dead)}
    assert set(items) == {SHIP, CONTAINER, BPO_ITEM, 1000000000004}
    ship = items[SHIP]
    assert ship.name == "My Rifter" and ship.type_id == 587 and ship.is_singleton and ship.location_type == "station"
    assert items[CONTAINER].name == ""  # SeAT had no name for it
    ore = items[1000000000004]
    assert ore.quantity == 5000 and not ore.is_singleton and ore.location_flag == "Cargo"
    assert ore.root_location_id == JITA and ore.is_blueprint_copy is None
    assert items[BPO_ITEM].root_location_id == JITA and items[BPO_ITEM].is_blueprint_copy is False
    assert Location.objects.get(pk=JITA).name.startswith("Jita IV")

    # Blueprints: one sits in a container, so its station comes from the asset tree.
    bps = {b.item_id: b for b in Blueprint.objects.filter(character=dead)}
    bpo = bps[BPO_ITEM]
    assert (bpo.location_id, bpo.root_location_id) == (CONTAINER, JITA)
    assert (bpo.quantity, bpo.runs, bpo.material_efficiency, bpo.time_efficiency) == (-1, -1, 10, 20)
    bpc = bps[1000000000005]
    assert bpc.is_copy and bpc.runs == 10 and bpc.root_location_id == JITA

    # Planets: the colony with its layout rebuilt in ESI's shape, named from SeAT's planets table.
    colony = Colony.objects.get(character=dead)
    assert (colony.planet_id, colony.planet_name, colony.planet_type) == (PLANET, "Jita IV", "barren")
    assert (colony.upgrade_level, colony.num_pins, colony.last_update.day) == (4, 3, 20)
    layout = colony.layout
    pins = {p["pin_id"]: p for p in layout["pins"]}
    assert set(pins) == {1021, 1022, 1023}
    ex = pins[1021]["extractor_details"]
    assert ex["product_type_id"] == 2267 and ex["qty_per_cycle"] == 5400 and ex["cycle_time"] == 1800
    assert [h["head_id"] for h in ex["heads"]] == [0, 1] and ex["heads"][1]["latitude"] == 1.21
    assert pins[1021]["expiry_time"] == "2025-02-23T08:30:00Z" and "schematic_id" not in pins[1021]
    assert pins[1022]["factory_details"] == {"schematic_id": 121} and pins[1022]["schematic_id"] == 121
    assert pins[1023]["contents"] == [{"type_id": 2393, "amount": 12000}]
    assert layout["links"] == [{"source_pin_id": 1021, "destination_pin_id": 1023, "link_level": 0}]
    assert layout["routes"] == [{"route_id": 41, "source_pin_id": 1021, "destination_pin_id": 1022,
                                 "content_type_id": 2267, "quantity": 3000.0, "waypoints": [1023, 1022]}]

    # Research.
    agent = ResearchAgent.objects.get(character=dead)
    assert (agent.agent_id, agent.skill_type_id, agent.points_per_day, agent.remainder_points) == (
        3018681, 11433, 85.75, 12.5)
    assert agent.started_at.year == 2019 and agent.started_at.hour == 10

    # Fittings, with their items joined back on.
    fits = {f.fitting_id: f for f in Fitting.objects.filter(character=dead)}
    rifter = fits[7001]
    assert (rifter.name, rifter.description, rifter.ship_type_id) == ("PvP Rifter", "Scram, web, guns", 587)
    assert rifter.items == [{"flag": "HiSlot0", "quantity": 1, "type_id": 2873},
                            {"flag": "MedSlot0", "quantity": 1, "type_id": 5443},
                            {"flag": "Cargo", "quantity": 200, "type_id": 178}]
    assert fits[7002].items == [] and fits[7002].description == ""


@pytest.mark.django_db
def test_sections_synced_from_eve_keep_their_data(tmp_path, people):
    dead, live = people
    run(dump(tmp_path), sections=SECTIONS)
    assert list(Asset.objects.filter(character=live).values_list("item_id", flat=True)) == [5]
    assert list(Blueprint.objects.filter(character=live).values_list("item_id", flat=True)) == [6]
    assert list(Colony.objects.filter(character=live).values_list("planet_name", flat=True)) == ["From EVE"]
    assert list(ResearchAgent.objects.filter(character=live).values_list("points_per_day", flat=True)) == [99.0]
    assert list(Fitting.objects.filter(character=live).values_list("name", flat=True)) == ["From EVE"]
    for key in SECTIONS:
        assert SyncStatus.objects.get(character=live, section=key).message == ""


@pytest.mark.django_db
def test_running_again_changes_nothing(tmp_path, people):
    first = run(dump(tmp_path), sections=SECTIONS)
    before = counts()
    layout = Colony.objects.get(character_id=DEAD).layout
    second = run(dump(tmp_path), sections=SECTIONS)
    assert not first["errors"] and not second["errors"]
    assert counts() == before == [5, 3, 2, 2, 3]
    assert Colony.objects.get(character_id=DEAD).layout == layout
    for key in SECTIONS:
        assert second["sections"][key] == {"imported": 0, "skipped": 2, "errors": 0}


@pytest.mark.django_db
def test_planet_name_left_blank_when_seat_lacks_it(tmp_path, people):
    path = dump(tmp_path)
    path.write_text("\n".join(line for line in path.read_text().split("\n") if "INSERT INTO `planets`" not in line))
    summary = run(path, sections=["planets"])
    assert not summary["errors"]
    assert Colony.objects.get(character_id=DEAD).planet_name == ""
