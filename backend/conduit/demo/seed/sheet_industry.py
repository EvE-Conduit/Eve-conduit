"""Industry jobs, research agents, the mining ledger, planetary colonies, market orders and contracts.

Types are looked up by name, so the real static data's ids are used when the site has it; ``ITEMS`` fills in the
ones the fallback catalog lacks. ``types``, ``role`` and ``neutrals`` are shared with the other sheet modules.
"""

from datetime import timedelta
from decimal import Decimal

from conduit.eve.models import EveName, MarketPrice
from conduit.sde.models import ItemCategory, ItemGroup, ItemType, PlanetSchematic
from conduit.sheet.contracts.models import Contract, ContractItem
from conduit.sheet.industry.models import IndustryJob
from conduit.sheet.market.models import MarketOrder
from conduit.sheet.mining.models import MiningEntry
from conduit.sheet.planets.models import Colony
from conduit.sheet.research.models import ResearchAgent
from conduit.sheet.util import prices_by_type

from . import Ids, catalog

# Static data the catalog doesn't have, for sites without the real static data.
CATEGORIES = {42: "Planetary Resources", 43: "Planetary Commodities"}
GROUPS = {
    450: ("Arkonor", 25), 454: ("Hedbergite", 25), 455: ("Hemorphite", 25), 456: ("Jaspet", 25), 457: ("Kernite", 25),
    465: ("Ice", 25), 107: ("Battlecruiser Blueprint", 9), 176: ("Drone Blueprint", 9), 166: ("Projectile Ammo Blueprint", 9),
    135: ("Projectile Weapon Blueprint", 9), 477: ("Mining Barge Blueprint", 9),
    1032: ("Planet Solid - Raw Resource", 42), 1033: ("Planet Liquid-Gas - Raw Resource", 42),
    1035: ("Planet Organic - Raw Resource", 42), 1042: ("Basic Commodities - Tier 1", 43), 1034: ("Refined Commodities - Tier 2", 43),
}
#: name -> (fallback id, group id, average price, volume). Catalog types only need a price (and an ore its volume).
ITEMS = {
    # minerals and ore
    "Tritanium": (34, 18, 4.1, 0.01), "Pyerite": (35, 18, 11.5, 0.01), "Mexallon": (36, 18, 68.0, 0.01),
    "Isogen": (37, 18, 115.0, 0.01), "Nocxium": (38, 18, 820.0, 0.01), "Zydrine": (39, 18, 1450.0, 0.01),
    "Megacyte": (40, 18, 2900.0, 0.01),
    "Veldspar": (1230, 462, 17.5, 0.1), "Scordite": (1228, 460, 27.0, 0.15), "Pyroxeres": (1224, 459, 58.0, 0.3),
    "Plagioclase": (18, 458, 71.0, 0.35), "Omber": (1227, 469, 112.0, 0.6), "Kernite": (20, 457, 236.0, 1.2),
    "Jaspet": (1226, 456, 455.0, 2.0), "Hemorphite": (1231, 455, 520.0, 3.0), "Hedbergite": (21, 454, 610.0, 3.0),
    "Clear Icicle": (16262, 465, 71500.0, 1000.0),
    # ships
    "Rifter": (587, 25, 520_000.0, None), "Merlin": (603, 25, 480_000.0, None), "Punisher": (597, 25, 450_000.0, None),
    "Executioner": (589, 25, 430_000.0, None), "Vexor": (626, 26, 9_800_000.0, None), "Caracal": (621, 26, 11_900_000.0, None),
    "Stabber": (622, 26, 10_400_000.0, None), "Thorax": (627, 26, 9_300_000.0, None), "Drake": (24698, 419, 44_000_000.0, None),
    "Hurricane": (24702, 419, 47_500_000.0, None), "Myrmidon": (24700, 419, 43_000_000.0, None),
    "Raven": (638, 27, 198_000_000.0, None), "Megathron": (641, 27, 182_000_000.0, None), "Apocalypse": (642, 27, 191_000_000.0, None),
    "Tempest": (639, 27, 176_000_000.0, None), "Machariel": (17738, 27, 640_000_000.0, None),
    "Procurer": (17480, 463, 24_000_000.0, None), "Retriever": (17478, 463, 29_000_000.0, None), "Hulk": (22544, 543, 310_000_000.0, None),
    "Skiff": (22546, 543, 285_000_000.0, None), "Orca": (28606, 941, 880_000_000.0, None), "Archon": (23757, 547, 1_550_000_000.0, None),
    "Thanatos": (23911, 547, 1_620_000_000.0, None), "Revelation": (19720, 485, 2_400_000_000.0, None),
    "Naglfar": (19722, 485, 2_350_000_000.0, None), "Basilisk": (11985, 832, 275_000_000.0, None),
    "Guardian": (11987, 832, 268_000_000.0, None), "Tengu": (29984, 963, 455_000_000.0, None), "Loki": (29990, 963, 470_000_000.0, None),
    "Capsule": (670, 29, 10_000.0, None),
    # modules, drones, ammo
    "Hobgoblin I": (2488, 100, 4_200.0, None), "Hammerhead I": (2454, 100, 11_000.0, None), "Hammerhead II": (2185, 100, 690_000.0, None),
    "125mm Gatling AutoCannon I": (484, 55, 9_500.0, None), "Light Neutron Blaster I": (3001, 74, 14_000.0, None),
    "Dual Light Beam Laser I": (3057, 53, 12_500.0, None), "EMP S": (185, 83, 21.0, None),
    # blueprints
    "Rifter Blueprint": (950, 105, 2_900_000.0, None), "Vexor Blueprint": (1178, 106, 75_000_000.0, None),
    "Caracal Blueprint": (955, 106, 82_000_000.0, None), "Drake Blueprint": (24699, 107, 380_000_000.0, None),
    "Procurer Blueprint": (17481, 477, 210_000_000.0, None), "Hobgoblin I Blueprint": (2489, 176, 1_400_000.0, None),
    "Hammerhead I Blueprint": (2455, 176, 2_100_000.0, None), "Hammerhead II Blueprint": (2186, 176, 0.0, None),
    "EMP S Blueprint": (1137, 166, 1_000_000.0, None), "125mm Gatling AutoCannon I Blueprint": (485, 135, 1_300_000.0, None),
    # research fields
    "Mechanical Engineering": (3409, 270, None, None), "Electronic Engineering": (3411, 270, None, None),
    "Graviton Physics": (11446, 270, None, None), "Laser Physics": (11433, 270, None, None),
    "Nuclear Physics": (11451, 270, None, None), "Plasma Physics": (11452, 270, None, None),
    "Quantum Physics": (11455, 270, None, None), "Rocket Science": (11529, 270, None, None),
    # planetary
    "Base Metals": (2267, 1032, 6.0, None), "Heavy Metals": (2272, 1032, 7.0, None), "Noble Metals": (2270, 1032, 9.0, None),
    "Aqueous Liquids": (2268, 1033, 5.0, None), "Noble Gas": (2310, 1033, 8.0, None), "Reactive Gas": (2311, 1033, 7.5, None),
    "Microorganisms": (2073, 1035, 6.5, None), "Carbon Compounds": (2288, 1035, 6.0, None),
    "Reactive Metals": (2398, 1042, 420.0, None), "Toxic Metals": (2400, 1042, 455.0, None), "Precious Metals": (2399, 1042, 510.0, None),
    "Water": (3645, 1042, 390.0, None), "Oxygen": (3683, 1042, 410.0, None), "Oxidizing Compound": (2317, 1042, 470.0, None),
    "Bacteria": (2393, 1042, 400.0, None), "Biofuels": (2396, 1042, 430.0, None),
    "Mechanical Parts": (3689, 1034, 11_800.0, None), "Enriched Uranium": (44, 1034, 13_500.0, None),
    "Coolant": (9832, 1034, 12_400.0, None), "Livestock": (3654, 1034, 11_200.0, None),
}

# Made-up outsiders: traders and haulers the members deal with, and pilots applying to join.
NEUTRAL_CORPORATIONS = (("Saltmarsh Freight Co", 1), ("Quillon Trade Syndicate", 2), ("Emberline Ventures", 3))
NEUTRALS = (
    "Halvard Brightwater", "Oskana Teleth", "Pim Varrow", "Selka Durn", "Tobiah Querre", "Wynna Lask", "Ezren Moll",
    "Ilsabet Corran", "Marek Fenwhistle", "Jossa Kirrin",
)
NEUTRAL_CHARACTER = Ids.CHARACTER + 160_000
NEUTRAL_CORPORATION = Ids.CORPORATION + 160


def types(names) -> dict[str, int]:
    """Type ids by name, from the static data; where it lacks a name, the fallback id in ``ITEMS`` (if that id is
    free). Names that can't be had are left out, so callers filter on what comes back."""
    names = list(names)
    found = dict(ItemType.objects.filter(name__in=names).order_by("published", "-id").values_list("name", "id"))
    missing = [n for n in names if n not in found and n in ITEMS]
    if missing:
        ItemCategory.objects.bulk_create([ItemCategory(id=i, name=n, published=True) for i, n in CATEGORIES.items()], ignore_conflicts=True)
        ItemGroup.objects.bulk_create(
            [ItemGroup(id=i, name=n, category_id=c, published=True) for i, (n, c) in GROUPS.items()], ignore_conflicts=True
        )
        ItemType.objects.bulk_create(
            [ItemType(id=ITEMS[n][0], name=n, group_id=ITEMS[n][1], published=True, volume=ITEMS[n][3]) for n in missing],
            ignore_conflicts=True,
        )
        found.update(ItemType.objects.filter(name__in=missing).values_list("name", "id"))
    return found


def ensure_prices(ids: dict[str, int]) -> dict[int, float]:
    """Prices for these types: the real site's where it has them, ``ITEMS``'s otherwise."""
    MarketPrice.objects.bulk_create(
        [MarketPrice(type_id=tid, average_price=ITEMS[n][2], adjusted_price=ITEMS[n][2]) for n, tid in ids.items() if ITEMS.get(n, (0, 0, None))[2]],
        ignore_conflicts=True,
    )
    return prices_by_type(ids.values())


def role(demo, character) -> str:
    """"star" (the demo account's main), "admin" (its alts), "main" or "alt": how much data a character gets."""
    if character.user_id == demo.admin.pk:
        return "star" if character.pk == demo.admin.main_character_id else "admin"
    return "main" if character.pk == character.user.main_character_id else "alt"


def neutrals(demo) -> list[tuple[int, int]]:
    """The outsiders, as (character id, corporation id); their names are made sure of."""
    EveName.objects.bulk_create(
        [EveName(id=NEUTRAL_CHARACTER + i + 1, name=n, category="character") for i, n in enumerate(NEUTRALS)]
        + [EveName(id=NEUTRAL_CORPORATION + i, name=n, category="corporation") for n, i in NEUTRAL_CORPORATIONS],
        ignore_conflicts=True,
    )
    return [(NEUTRAL_CHARACTER + i + 1, NEUTRAL_CORPORATION + 1 + i % len(NEUTRAL_CORPORATIONS)) for i in range(len(NEUTRALS))]


def _dec(value) -> Decimal:
    return Decimal(str(round(value, 2)))


def _count(demo, character, star, admin, main, alt) -> int:
    """A count for the character's role; ``main``/``alt`` are (low, high) ranges."""
    r = role(demo, character)
    if r == "star":
        return star
    if r == "admin":
        return admin
    return demo.rng.randint(*(main if r == "main" else alt))


def seed(demo):
    ids = types(ITEMS)
    prices = ensure_prices(ids)
    _industry(demo, ids, prices)
    _research(demo, ids)
    _mining(demo, ids, prices)
    _planets(demo, ids)
    _market(demo, ids, prices)
    _contracts(demo, ids, prices)


# --- industry --------------------------------------------------------------------------------------------------------

# product, blueprint, hours per run, most runs
PRODUCTS = (
    ("Rifter", "Rifter Blueprint", 1.0, 20), ("Vexor", "Vexor Blueprint", 2.4, 10), ("Caracal", "Caracal Blueprint", 2.4, 10),
    ("Drake", "Drake Blueprint", 3.6, 8), ("Procurer", "Procurer Blueprint", 5.5, 4), ("Hobgoblin I", "Hobgoblin I Blueprint", 0.15, 200),
    ("Hammerhead I", "Hammerhead I Blueprint", 0.25, 100), ("EMP S", "EMP S Blueprint", 0.05, 300),
    ("125mm Gatling AutoCannon I", "125mm Gatling AutoCannon I Blueprint", 0.3, 50),
)


def _industry(demo, ids, prices):
    products = [p for p in PRODUCTS if p[0] in ids and p[1] in ids]
    invention = ids.get("Hammerhead I Blueprint"), ids.get("Hammerhead II Blueprint")
    forge = demo.structures[0]["id"] if demo.structures else demo.station_ids()[0]
    stations = demo.station_ids()
    jobs = []

    def job(character, status, *, open_job):
        product, blueprint, per_run, most = demo.pick(products)
        bp, out = ids[blueprint], ids[product]
        activity = demo.rng.choices([1, 3, 4, 5, 8], weights=[10, 2, 3, 2, 2 if all(invention) else 0])[0]
        runs, licensed, probability = demo.rng.randint(max(1, most // 5), most), None, None
        if activity == 1:
            hours, cost = per_run * runs, prices.get(out, 0) * runs * 0.025
        elif activity in (3, 4):
            runs, out = demo.rng.randint(1, 5), bp
            hours, cost = demo.rng.uniform(5, 70), prices.get(bp, 0) * 0.004
        elif activity == 5:
            runs, out, licensed = demo.rng.randint(1, 10), bp, demo.rng.randint(1, 10) * 10
            hours, cost = demo.rng.uniform(2, 40), prices.get(bp, 0) * 0.002 * runs
        else:
            bp, out = invention
            runs, probability = demo.rng.randint(1, 20), round(demo.rng.uniform(0.3, 0.46), 2)
            hours, cost = 22.5 * runs / 10 + 15, 180_000 * runs
        duration = timedelta(hours=hours * demo.rng.uniform(0.75, 0.95))
        location = forge if demo.chance(0.8) else demo.pick(stations)
        if open_job:
            # Running, some due soon; "active" with an end in the past reads as ready to deliver.
            start = demo.now - duration * demo.rng.uniform(0.05, 0.95) if status != "ready" else demo.now - duration - timedelta(hours=demo.rng.uniform(1, 40))
            end, completed, successful = start + duration, None, None
        else:
            start = demo.ago(days=demo.rng.uniform(2, 90)) - duration
            end = start + duration
            completed = end + timedelta(hours=demo.rng.uniform(0.1, 20)) if status == "delivered" else start + duration / 3
            successful = (sum(demo.chance(probability) for _ in range(runs)) if activity == 8 else runs) if status == "delivered" else None
        jobs.append(IndustryJob(
            character=character, job_id=demo.next_id(), activity_id=activity, status="active" if status == "ready" else status,
            blueprint_id=demo.next_id(), blueprint_type_id=bp, product_type_id=out, runs=runs, licensed_runs=licensed,
            successful_runs=successful, probability=probability, cost=_dec(cost), facility_id=location, station_id=location,
            output_location_id=location, start_date=start, end_date=end,
            pause_date=demo.recent(1) if status == "paused" else None, completed_date=completed,
        ))

    for character in demo.characters:
        for _ in range(_count(demo, character, 14, 5, (1, 5), (0, 3))):
            job(character, demo.rng.choices(["active", "ready", "paused"], weights=[14, 4, 1])[0], open_job=True)
        for _ in range(_count(demo, character, 70, 20, (5, 20), (0, 8))):
            job(character, demo.rng.choices(["delivered", "cancelled"], weights=[12, 1])[0], open_job=False)
    IndustryJob.objects.bulk_create(jobs, batch_size=1000)


# --- research ----------------------------------------------------------------------------------------------------------

AGENTS = (
    "Akaro Tenmei", "Seline Varkonen", "Joth Ammaril", "Usko Haikonen", "Renna Talaquin", "Imir Daskaro", "Vel Ossingtar",
    "Hannaro Oikka", "Teska Marrenfold", "Ludovar Assin",
)
AGENT = Ids.CHARACTER + 170_000


def research_agents() -> list[int]:
    """The made-up research agents (named here, used for agent standings too)."""
    EveName.objects.bulk_create([EveName(id=AGENT + i + 1, name=n, category="character") for i, n in enumerate(AGENTS)], ignore_conflicts=True)
    return [AGENT + i + 1 for i in range(len(AGENTS))]


def _research(demo, ids):
    agents = research_agents()
    fields = [ids[n] for n in ITEMS if ITEMS[n][1] == 270 and n in ids]
    rows = []
    for character in demo.characters:
        for agent in demo.sample(agents, _count(demo, character, 5, 2, (1, 3), (0, 2))):
            rows.append(ResearchAgent(
                character=character, agent_id=agent, skill_type_id=demo.pick(fields), started_at=demo.recent(500),
                points_per_day=round(demo.rng.uniform(45, 135), 2), remainder_points=round(demo.rng.uniform(-50, 400), 2),
            ))
    ResearchAgent.objects.bulk_create(rows)


# --- mining ------------------------------------------------------------------------------------------------------------

# Where the ore is: system -> ores
BELTS = {
    30002053: ("Omber", "Kernite", "Pyroxeres", "Hemorphite", "Clear Icicle"),  # Hek
    30002510: ("Scordite", "Plagioclase", "Pyroxeres", "Veldspar"),  # Rens
    30000144: ("Veldspar", "Scordite", "Plagioclase"),  # Perimeter
    30002659: ("Veldspar", "Pyroxeres", "Jaspet", "Hedbergite"),  # Dodixie
}


def _mining(demo, ids, prices):
    volumes = dict(ItemType.objects.filter(pk__in=ids.values()).values_list("id", "volume"))
    for name, tid in ids.items():
        if ITEMS[name][3] and not volumes.get(tid):
            ItemType.objects.filter(pk=tid).update(volume=ITEMS[name][3])
            volumes[tid] = ITEMS[name][3]
    belts = {s: [ids[o] for o in ores if o in ids] for s, ores in BELTS.items()}
    belts = {s: ores for s, ores in belts.items() if ores}
    today = demo.now.date()
    rows = []
    for character in demo.characters:
        r = role(demo, character)
        days = {"star": 0.85, "admin": 0.6, "main": demo.rng.uniform(0.1, 0.6), "alt": demo.rng.uniform(0, 0.5)}[r]
        home = demo.sample(belts, 2)
        rate = demo.rng.uniform(25_000, 110_000) if r in ("star", "admin") else demo.rng.uniform(8_000, 70_000)  # m3 a day
        mined = []
        for back in range(45):
            if demo.chance(days) or (back == 1 and not mined):
                system = demo.pick(home)
                for ore in demo.sample(belts[system], demo.rng.randint(1, 3)):
                    m3 = rate * demo.rng.uniform(0.3, 1.1) * (0.4 if back == 0 else 1)
                    mined.append(MiningEntry(character=character, date=today - timedelta(days=back), solar_system_id=system,
                                             type_id=ore, quantity=max(1, int(m3 / (volumes.get(ore) or 1)))))
        rows += mined
    MiningEntry.objects.bulk_create(rows, batch_size=2000)


# --- planets -------------------------------------------------------------------------------------------------------------

# planet type -> what its extractors pull up, and what that becomes
PLANETS = {
    "barren": (("Base Metals", "Reactive Metals"), ("Noble Metals", "Precious Metals")),
    "lava": (("Heavy Metals", "Toxic Metals"), ("Base Metals", "Reactive Metals")),
    "plasma": (("Noble Metals", "Precious Metals"), ("Heavy Metals", "Toxic Metals")),
    "temperate": (("Aqueous Liquids", "Water"), ("Carbon Compounds", "Biofuels"), ("Microorganisms", "Bacteria")),
    "gas": (("Noble Gas", "Oxygen"), ("Reactive Gas", "Oxidizing Compound")),
    "oceanic": (("Aqueous Liquids", "Water"), ("Microorganisms", "Bacteria")),
    "ice": (("Aqueous Liquids", "Water"), ("Noble Gas", "Oxygen")),
}
# advanced product -> its inputs
REFINED = {
    "Mechanical Parts": ("Reactive Metals", "Precious Metals"), "Enriched Uranium": ("Precious Metals", "Toxic Metals"),
    "Coolant": ("Water", "Oxidizing Compound"), "Livestock": ("Biofuels", "Bacteria"),
}
PIN = {"command": 2524, "extractor": 2848, "basic": 2473, "advanced": 2474, "launchpad": 2544, "storage": 2541}
ROMAN = ("I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X")


def _schematics(names) -> dict[str, int]:
    """Schematic ids by the name of what they make; made up where the static data has none."""
    found = dict(PlanetSchematic.objects.filter(name__in=names).values_list("name", "id"))
    missing = [n for n in names if n not in found]
    if missing:
        PlanetSchematic.objects.bulk_create(
            [PlanetSchematic(id=9000 + i, name=n, cycle_time=1800) for i, n in enumerate(missing)], ignore_conflicts=True
        )
        found.update(PlanetSchematic.objects.filter(name__in=missing).values_list("name", "id"))
    return found


def _planets(demo, ids):
    schematics = _schematics(sorted({p for chain in PLANETS.values() for _, p in chain} | set(REFINED)))
    systems = list(catalog.SYSTEMS)
    rows = []
    for character in demo.characters:
        count = _count(demo, character, 6, 5, (2, 6), (0, 6))
        for slot, system in enumerate(sorted(demo.rng.choices(systems, k=count))):
            kind = demo.pick(PLANETS)
            number = demo.rng.randint(1, len(ROMAN))
            pins, pin_id = [{"pin_id": demo.next_id(), "type_id": PIN["command"], "latitude": 1.2, "longitude": 2.1}], 0
            made = []
            for raw, product in demo.sample(PLANETS[kind], 2):
                if raw not in ids:
                    continue
                expiry = demo.ahead(hours=demo.rng.uniform(-30, 150)) if demo.chance(0.85) else demo.ago(days=demo.rng.uniform(1, 4))
                cycle = demo.pick([1800, 3600, 7200])
                pins.append({
                    "pin_id": demo.next_id(), "type_id": PIN["extractor"], "latitude": demo.rng.uniform(0, 3.1), "longitude": demo.rng.uniform(0, 6.2),
                    "install_time": (expiry - timedelta(days=demo.pick([1, 2, 3, 7]))).isoformat(), "expiry_time": expiry.isoformat(),
                    "last_cycle_start": (min(expiry, demo.now) - timedelta(seconds=cycle)).isoformat(),
                    "extractor_details": {
                        "cycle_time": cycle, "head_radius": 0.014, "product_type_id": ids[raw], "qty_per_cycle": demo.rng.randint(2500, 9500),
                        "heads": [{"head_id": h, "latitude": demo.rng.uniform(0, 3.1), "longitude": demo.rng.uniform(0, 6.2)} for h in range(demo.rng.randint(6, 10))],
                    },
                })
                if product in schematics:
                    made.append(product)
                    pins += [{"pin_id": demo.next_id(), "type_id": PIN["basic"], "schematic_id": schematics[product],
                              "latitude": 1.0, "longitude": 1.0, "last_cycle_start": demo.recent(0.02).isoformat()}
                             for _ in range(demo.rng.randint(3, 7))]
            refined = [r for r, inputs in REFINED.items() if set(inputs) <= set(made) and r in schematics]
            for r in refined:
                pins.append({"pin_id": demo.next_id(), "type_id": PIN["advanced"], "schematic_id": schematics[r], "latitude": 1.0, "longitude": 1.0})
            stock = [p for p in made + refined if p in ids]
            pins.append({
                "pin_id": demo.next_id(), "type_id": PIN["launchpad"], "latitude": 1.1, "longitude": 1.1,
                "contents": [{"type_id": ids[p], "amount": demo.rng.randint(400, 30000) if p not in REFINED else demo.rng.randint(20, 900)} for p in stock],
            })
            rows.append(Colony(
                character=character, planet_id=40_000_000 + (system - 30_000_000) * 12 + number,
                planet_name=f"{catalog.SYSTEMS[system][0]} {ROMAN[number - 1]}", planet_type=kind, solar_system_id=system,
                upgrade_level=demo.rng.randint(3, 5), num_pins=len(pins), last_update=demo.recent(4),
                layout={"pins": pins, "links": [], "routes": []},
            ))
    # One planet each: a character can't hold two colonies on it.
    seen, unique = set(), []
    for c in rows:
        if (c.character_id, c.planet_id) not in seen:
            seen.add((c.character_id, c.planet_id))
            unique.append(c)
    Colony.objects.bulk_create(unique)


# --- market --------------------------------------------------------------------------------------------------------------

SELL = ("Rifter", "Vexor", "Caracal", "Drake", "Hurricane", "Procurer", "Retriever", "Hobgoblin I", "Hammerhead I",
        "Hammerhead II", "EMP S", "125mm Gatling AutoCannon I", "Light Neutron Blaster I", "Mechanical Parts", "Coolant")
BUY = ("Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte", "Reactive Metals", "Precious Metals")


def _lot(name) -> int:
    price = ITEMS[name][2] or 1
    return 1 if price > 100_000_000 else 5 if price > 5_000_000 else 50 if price > 100_000 else 500 if price > 1000 else 2_000_000


def _market(demo, ids, prices):
    region = {sid: catalog.SYSTEMS[sys][2] for sid, (_, sys) in catalog.STATIONS.items()}
    region.update({s["id"]: catalog.SYSTEMS.get(s["system_id"], (0, 0, 10000002))[2] for s in demo.structures})
    hubs = [60003760, *(s["id"] for s in demo.structures[1:2])] + demo.station_ids()
    hubs = [h for h in dict.fromkeys(hubs) if h in region]
    sell = [n for n in SELL if n in ids and prices.get(ids[n])]
    buy = [n for n in BUY if n in ids and prices.get(ids[n])]
    rows = []

    def order(character, state):
        is_buy = demo.chance(0.35)
        name = demo.pick(buy if is_buy else sell)
        tid, base = ids[name], prices[ids[name]]
        price = base * (demo.rng.uniform(0.85, 0.98) if is_buy else demo.rng.uniform(1.01, 1.18))
        total = max(1, int(_lot(name) * demo.rng.uniform(0.5, 4)))
        duration = 90 if is_buy or demo.chance(0.6) else demo.pick([14, 30])
        if state == "open":
            issued, remain = demo.recent(min(duration, 25)), max(1, int(total * demo.rng.uniform(0.05, 1)))
        else:
            issued = demo.ago(days=demo.rng.uniform(duration if state == "expired" else 1, 120))
            remain = 0 if state == "closed" else int(total * demo.rng.uniform(0.1, 1))
        location = demo.pick(hubs[:2]) if demo.chance(0.75) else demo.pick(hubs)
        rows.append(MarketOrder(
            character=character, order_id=demo.next_id(), type_id=tid, is_buy=is_buy, price=_dec(price), volume_total=total,
            volume_remain=remain, min_volume=1 if is_buy else None, escrow=_dec(price * remain * 0.6) if is_buy and state == "open" else None,
            issued=issued, duration=duration, location_id=location, region_id=region[location],
            range=demo.pick(["station", "solarsystem", "5", "region"]) if is_buy else "region", state=state,
        ))

    for character in demo.characters:
        for _ in range(_count(demo, character, 28, 6, (1, 8), (1, 4))):
            order(character, "open")
        for _ in range(_count(demo, character, 60, 12, (3, 20), (1, 8))):
            order(character, demo.rng.choices(["closed", "expired", "cancelled"], weights=[8, 3, 2])[0])
    MarketOrder.objects.bulk_create(rows, batch_size=1000)


# --- contracts -------------------------------------------------------------------------------------------------------------

FITS = {
    "Hurricane": (("125mm Gatling AutoCannon I", 6), ("EMP S", 3000), ("Hammerhead I", 5)),
    "Drake": (("Hobgoblin I", 5),),
    "Vexor": (("Hammerhead I", 5), ("Hobgoblin I", 5), ("Light Neutron Blaster I", 4)),
    "Caracal": (("Hobgoblin I", 2),),
    "Rifter": (("125mm Gatling AutoCannon I", 3), ("EMP S", 1000)),
    "Thorax": (("Light Neutron Blaster I", 5), ("Hobgoblin I", 5)),
    "Retriever": (), "Procurer": (), "Hulk": (), "Basilisk": (), "Guardian": (),
}
TITLES = {
    "fit": ("{ship} - doctrine fit", "{ship}, fitted, ready to undock", "SRP replacement: {ship}", "{ship} for the Sunday roam", ""),
    "minerals": ("Minerals for the Forge", "Buyback: ore and minerals", "Mineral delivery, as discussed", ""),
    "bpc": ("{ship} BPCs", "BPC pack: {ship}", "Research job output: {ship} copies"),
    "courier": ("Jita -> Perimeter, freight run", "Market restock for the Keepstar", "Hek refinery output to Jita", "", "Fuel and ammo to Rens"),
}


def _worth(demo, ids, prices, name, low, high) -> int:
    """A quantity of ``name`` worth between ``low`` and ``high`` million ISK."""
    return max(1000, int(round(demo.rng.uniform(low, high) * 1_000_000 / (prices.get(ids[name]) or 1), -3)))


def _contracts(demo, ids, prices):
    by_id = {c.pk: c for c in demo.characters}
    outsiders = neutrals(demo)
    stations = demo.station_ids()
    keepstar = demo.structures[1]["id"] if len(demo.structures) > 1 else stations[1]
    dvlog = demo.corporations[2] if len(demo.corporations) > 2 else demo.corporations[0]
    haulers = [c for c in demo.characters if c.corporation_id == dvlog.pk] or demo.characters
    fits = {s: f for s, f in FITS.items() if s in ids}
    minerals = [n for n in ("Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine") if n in ids]
    bpcs = [p for p in PRODUCTS if p[1] in ids]
    copies, items = [], []

    def value(lines):
        return sum(prices.get(ids[n], 0) * q for n, q, *_ in lines)

    def contract(issuer, kind, status, *, to=None, by=None, availability=None):
        """``to``: who it's assigned to ("alliance", "corporation", a character id or None for public); ``by``: who
        accepted it (a character id)."""
        open_ = status in ("outstanding", "in_progress")
        issued = demo.recent(9) if open_ else demo.ago(days=demo.rng.uniform(1, 100))
        lines, title, fields = [], "", {}
        if kind == "courier":
            title = demo.pick(TITLES["courier"])
            start, end = (stations[0], keepstar) if demo.chance(0.7) else demo.sample([*stations, keepstar], 2)
            fields = {"reward": _dec(demo.rng.randint(4, 60) * 1_000_000), "collateral": _dec(demo.rng.randint(1, 40) * 50_000_000),
                      "volume": float(demo.pick([12_500, 60_000, 155_000, 320_000, 860_000])), "days_to_complete": demo.pick([3, 7, 14])}
        else:
            what = demo.rng.choices(["fit", "minerals", "bpc"], weights=[6, 2, 2 if bpcs else 0])[0]
            if what == "fit":
                ship = demo.pick(fits)
                lines = [(ship, demo.rng.randint(1, 5) if demo.chance(0.3) else 1)] + [(n, q) for n, q in fits[ship] if n in ids]
            elif what == "minerals":
                ship = ""
                lines = [(n, _worth(demo, ids, prices, n, 10, 250)) for n in demo.sample(minerals, demo.rng.randint(2, 5))]
            else:
                product, blueprint, *_ = demo.pick(bpcs)
                ship, lines = product, [(blueprint, demo.rng.randint(1, 10), -2)]
            title = demo.pick(TITLES[what]).format(ship=ship)
            worth = value(lines) or demo.rng.randint(10, 200) * 1_000_000
            price = round(worth * demo.rng.uniform(0.85, 1.1), -5)
            if kind == "auction":
                fields = {"price": _dec(round(price * 0.6, -5)), "buyout": _dec(price)}
            else:
                fields = {"price": _dec(price)}
            start = end = keepstar if demo.chance(0.5) else demo.pick(stations)
        to_corp = issuer.corporation_id
        assignee = {"alliance": issuer.alliance_id or 0, "corporation": to_corp, None: 0}.get(to, to)
        acceptor = by if status in ("in_progress", "finished") and by else 0
        row = dict(
            contract_id=demo.next_id(), type=kind, status=status, title=title, issuer_id=issuer.pk, issuer_corporation_id=to_corp,
            availability=availability or ("personal" if isinstance(to, int) else to or "public"), assignee_id=assignee,
            acceptor_id=acceptor, start_location_id=start, end_location_id=end, date_issued=issued,
            date_expired=issued + timedelta(days=demo.pick([3, 7, 14]) if kind != "auction" else 7),
            date_accepted=issued + timedelta(hours=demo.rng.uniform(0.2, 40)) if acceptor else None,
            date_completed=issued + timedelta(hours=demo.rng.uniform(1, 70)) if status == "finished" else None,
            items_fetched=True, **fields,
        )
        # Everyone registered here who's party to it has their own copy, as ESI lists it for each of them.
        for holder in dict.fromkeys(p for p in (issuer.pk, assignee, acceptor) if p in by_id):
            c = Contract(character=by_id[holder], **row)
            copies.append(c)
            items.append((c, lines))

    alliance_chars = [c for c in demo.characters if c.alliance_id == demo.alliance.pk]
    for character in demo.characters:
        r = role(demo, character)
        mates = [c for c in alliance_chars if c.user_id != character.user_id] or alliance_chars
        n = _count(demo, character, 40, 6, (2, 6), (1, 3))
        for i in range(n):
            kind = demo.rng.choices(["item_exchange", "courier", "auction"], weights=[8, 3 if character.alliance_id else 0, 1])[0]
            status = demo.rng.choices(["outstanding", "in_progress", "finished", "expired", "deleted"], weights=[4, 1, 10, 2, 1])[0]
            if kind != "courier" and status == "in_progress":
                status = "outstanding"
            if kind == "courier":
                to, by = (dvlog.pk if dvlog.alliance_id == character.alliance_id else None), demo.pick(haulers).pk
                contract(character, kind, status, to=to, by=by, availability="corporation" if to else "public")
                continue
            if kind == "auction":
                contract(character, kind, status, by=demo.pick(outsiders)[0])
                continue
            pick = demo.rng.random()
            if pick < 0.45 and character.alliance_id:
                buyer = demo.pick(mates)
                contract(character, kind, status, to=buyer.pk, by=buyer.pk)
            elif pick < 0.75 and character.alliance_id:
                contract(character, kind, status, to=demo.pick(["alliance", "corporation"]), by=demo.pick(mates).pk)
            else:
                contract(character, kind, status, by=demo.pick(outsiders)[0])
        if r == "star":
            # A few aimed at the demo account by outsiders: buyback offers it hasn't answered.
            for who, corp in demo.sample(outsiders, 3):
                lines = [(n, _worth(demo, ids, prices, n, 40, 400)) for n in demo.sample(minerals, 3)]
                cid = demo.next_id()
                c = Contract(
                    character=character, contract_id=cid, type="item_exchange", status="outstanding", title="Minerals, priced under Jita",
                    availability="personal", issuer_id=who, issuer_corporation_id=corp, assignee_id=character.pk, acceptor_id=0,
                    price=_dec(round(value(lines) * 0.92, -5)), start_location_id=stations[0], end_location_id=stations[0],
                    date_issued=demo.recent(4), date_expired=demo.ahead(days=demo.rng.uniform(2, 12)), items_fetched=True,
                )
                copies.append(c)
                items.append((c, lines))

    for c in copies:
        if c.status == "outstanding" and c.date_expired < demo.now:
            c.date_expired = demo.ahead(days=demo.rng.uniform(1, 13))
        if c.status == "expired" and c.date_expired > demo.now:
            c.date_expired = demo.ago(hours=1)
    Contract.objects.bulk_create(copies, batch_size=1000)
    records: dict[tuple, int] = {}
    ContractItem.objects.bulk_create(
        [
            ContractItem(
                contract=c, record_id=records.setdefault((c.contract_id, i), demo.next_id()), type_id=ids[name],
                quantity=qty, is_included=True, is_singleton=bool(raw), raw_quantity=raw[0] if raw else None,
            )
            for c, lines in items for i, (name, qty, *raw) in enumerate(lines)
        ],
        batch_size=2000,
    )
