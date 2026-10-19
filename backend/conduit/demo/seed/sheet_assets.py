"""Assets, blueprints and saved fittings: ships fitted to the alliance's doctrines, hangars of modules, ammo and
minerals, a blueprint library at the Forge, capitals at the staging and market stock in Jita.

Also the item table the other character modules share (``items()``): types are looked up by name in the static
data, so a site with the full SDE shows its own; the fallback ids only fill in where it has none.
"""

from conduit.eve.models import MarketPrice
from conduit.sde.models import ItemCategory, ItemGroup, ItemType
from conduit.sheet.assets.models import Asset
from conduit.sheet.blueprints.models import Blueprint
from conduit.sheet.fittings.models import Fitting
from conduit.sheet.overview.models import CharacterInfo
from conduit.sheet.skills.models import CharacterSkill

CATEGORIES = {2: "Celestial"}
GROUPS = {
    340: ("Secure Cargo Container", 2), 60: ("Damage Control", 7), 62: ("Armor Repair Unit", 7), 329: ("Armor Plate", 7),
    326: ("Energized Armor Membrane", 7), 38: ("Shield Extender", 7), 77: ("Shield Hardener", 7), 46: ("Propulsion Module", 7),
    52: ("Warp Scrambler", 7), 65: ("Stasis Web", 7), 59: ("Gyrostabilizer", 7), 302: ("Magnetic Field Stabilizer", 7),
    367: ("Ballistic Control system", 7), 645: ("Drone Damage Modules", 7), 211: ("Tracking Enhancer", 7),
    766: ("Power Diagnostic System", 7), 41: ("Remote Shield Booster", 7), 464: ("Strip Miner", 7), 546: ("Mining Upgrade", 7),
    49: ("Survey Scanner", 7), 510: ("Missile Launcher Heavy", 7), 774: ("Rig Shield", 7), 773: ("Rig Armor", 7),
    85: ("Hybrid Charge", 8), 385: ("Heavy Missile", 8), 916: ("Nanite Repair Paste", 8), 423: ("Ice Product", 4),
    1136: ("Fuel Block", 4), 107: ("Battleship Blueprint", 9), 489: ("Battlecruiser Blueprint", 9), 176: ("Drone Blueprint", 9),
    160: ("Module Blueprint", 9), 166: ("Missile Blueprint", 9), 1137: ("Fuel Block Blueprint", 9),
}
# name -> (fallback id, group id, price)
ITEMS = {
    "Tritanium": (34, 18, 4.2), "Pyerite": (35, 18, 9.5), "Mexallon": (36, 18, 68), "Isogen": (37, 18, 110),
    "Nocxium": (38, 18, 640), "Zydrine": (39, 18, 1150), "Megacyte": (40, 18, 2600),
    "Veldspar": (1230, 462, 14), "Scordite": (1228, 460, 22), "Pyroxeres": (1224, 459, 48), "Plagioclase": (18, 458, 55),
    "Omber": (1227, 469, 75),
    "Rifter": (587, 25, 650e3), "Merlin": (603, 25, 620e3), "Punisher": (597, 25, 600e3), "Executioner": (589, 25, 700e3),
    "Vexor": (626, 26, 14.5e6), "Caracal": (621, 26, 13.8e6), "Stabber": (622, 26, 12.9e6), "Thorax": (627, 26, 12.5e6),
    "Drake": (24698, 419, 58e6), "Hurricane": (24702, 419, 62e6), "Myrmidon": (24700, 419, 56e6),
    "Raven": (638, 27, 245e6), "Megathron": (641, 27, 232e6), "Apocalypse": (642, 27, 238e6), "Tempest": (639, 27, 215e6),
    "Machariel": (17738, 27, 410e6), "Procurer": (17480, 463, 31e6), "Retriever": (17478, 463, 29e6),
    "Hulk": (22544, 543, 315e6), "Skiff": (22546, 543, 270e6), "Orca": (28606, 941, 880e6), "Archon": (23757, 547, 1.55e9),
    "Thanatos": (23911, 547, 1.65e9), "Revelation": (19720, 485, 2.6e9), "Naglfar": (19722, 485, 2.35e9),
    "Basilisk": (11985, 832, 235e6), "Guardian": (11987, 832, 228e6), "Tengu": (29984, 963, 420e6), "Loki": (29990, 963, 395e6),
    "Hobgoblin I": (2488, 100, 4e3), "Hammerhead I": (2454, 100, 22e3), "Hammerhead II": (2185, 100, 520e3),
    "Hobgoblin II": (2456, 100, 310e3),
    "125mm Gatling AutoCannon I": (484, 55, 4.5e3), "Light Neutron Blaster I": (3001, 74, 9e3),
    "Dual Light Beam Laser I": (3057, 53, 6e3), "EMP S": (185, 83, 9),
    "Small Secure Container": (3467, 340, 9e3), "Medium Secure Container": (3466, 340, 30e3),
    "Giant Secure Container": (11489, 340, 650e3),
    "Damage Control II": (2048, 60, 650e3), "Medium Armor Repairer II": (3530, 62, 1.1e6), "1600mm Steel Plates II": (20353, 329, 2.4e6),
    "Energized Adaptive Nano Membrane II": (11269, 326, 1.3e6), "Large Shield Extender II": (3841, 38, 2.2e6),
    "Medium Shield Extender II": (3831, 38, 1.4e6), "Multispectrum Shield Hardener II": (2281, 77, 1.5e6),
    "10MN Afterburner II": (12058, 46, 1.1e6), "50MN Microwarpdrive II": (12076, 46, 3.3e6), "Warp Disruptor II": (3244, 52, 1.35e6),
    "Warp Scrambler II": (448, 52, 1.25e6), "Stasis Webifier II": (527, 65, 1e6), "Gyrostabilizer II": (519, 59, 1.25e6),
    "Magnetic Field Stabilizer II": (10190, 302, 1.35e6), "Ballistic Control System II": (22291, 367, 1.5e6),
    "Drone Damage Amplifier II": (4405, 645, 1.7e6), "Tracking Enhancer II": (1999, 211, 1.2e6),
    "Power Diagnostic System II": (1541, 766, 900e3), "Large Remote Shield Booster II": (3608, 41, 3.2e6),
    "425mm AutoCannon II": (2913, 55, 2.3e6), "800mm Repeating Cannon II": (2961, 55, 6.5e6),
    "Neutron Blaster Cannon II": (3186, 74, 4.1e6), "Heavy Missile Launcher II": (2410, 510, 1.9e6),
    "Modulated Strip Miner II": (28754, 464, 9.5e6), "Mining Laser Upgrade II": (28576, 546, 2.8e6),
    "Survey Scanner II": (18068, 49, 1.1e6),
    "Medium Core Defense Field Extender I": (31796, 774, 1.6e6), "Large Core Defense Field Extender I": (26088, 774, 4.2e6),
    "Large Trimark Armor Pump I": (26302, 773, 4.5e6),
    "Hail M": (12608, 83, 210), "Void L": (12789, 85, 650), "Scourge Heavy Missile": (209, 385, 260),
    "Nanite Repair Paste": (28668, 916, 24e3), "Helium Isotopes": (16274, 423, 680), "Nitrogen Fuel Block": (4051, 1136, 19e3),
    "Rifter Blueprint": (950, 105, 2.9e6), "Vexor Blueprint": (1178, 106, 68e6), "Drake Blueprint": (24699, 489, 42e6),
    "Hurricane Blueprint": (24703, 489, 45e6), "Raven Blueprint": (688, 107, 380e6), "Megathron Blueprint": (997, 107, 360e6),
    "Hobgoblin I Blueprint": (2455, 176, 1.5e6), "Hammerhead II Blueprint": (2186, 176, 0),
    "Damage Control II Blueprint": (2049, 160, 0), "Heavy Missile Launcher II Blueprint": (2411, 160, 0),
    "Scourge Heavy Missile Blueprint": (810, 166, 1.2e6), "Nitrogen Fuel Block Blueprint": (4314, 1137, 10e6),
}

# The alliance's doctrines: (ship, fitting name, description, [(slot, item, count)]).
FITS = (
    ("Hurricane", "NLC Cane - Skirmish", "Roaming doctrine. Bring Hail and Barrage, overheat the guns.", [
        ("HiSlot", "425mm AutoCannon II", 6), ("MedSlot", "50MN Microwarpdrive II", 1), ("MedSlot", "Large Shield Extender II", 2),
        ("MedSlot", "Warp Disruptor II", 1), ("LoSlot", "Gyrostabilizer II", 3), ("LoSlot", "Damage Control II", 1),
        ("LoSlot", "Tracking Enhancer II", 1), ("RigSlot", "Medium Core Defense Field Extender I", 3), ("Cargo", "Hail M", 2400),
        ("Cargo", "Nanite Repair Paste", 40)]),
    ("Drake", "Drake - Anomalies", "Ratting fit for the home anomalies. Align out when locals go red.", [
        ("HiSlot", "Heavy Missile Launcher II", 6), ("MedSlot", "Large Shield Extender II", 2),
        ("MedSlot", "Multispectrum Shield Hardener II", 2), ("MedSlot", "10MN Afterburner II", 1),
        ("LoSlot", "Ballistic Control System II", 3), ("LoSlot", "Damage Control II", 1),
        ("RigSlot", "Medium Core Defense Field Extender I", 3), ("Cargo", "Scourge Heavy Missile", 6000)]),
    ("Vexor", "Vexor - Newbro Drones", "The corp's starter ratting ship. Ask a director for a free hull.", [
        ("MedSlot", "10MN Afterburner II", 1), ("MedSlot", "Warp Disruptor II", 1), ("MedSlot", "Stasis Webifier II", 1),
        ("LoSlot", "Drone Damage Amplifier II", 2), ("LoSlot", "Medium Armor Repairer II", 1), ("LoSlot", "Damage Control II", 1),
        ("DroneBay", "Hammerhead II", 5), ("DroneBay", "Hobgoblin II", 5), ("Cargo", "Nanite Repair Paste", 20)]),
    ("Basilisk", "NLC Basi - Mainline Logi", "Logistics for the battleship fleets. Broadcast for reps, lock the FC first.", [
        ("HiSlot", "Large Remote Shield Booster II", 4), ("MedSlot", "Large Shield Extender II", 2),
        ("MedSlot", "Multispectrum Shield Hardener II", 2), ("MedSlot", "50MN Microwarpdrive II", 1),
        ("LoSlot", "Damage Control II", 1), ("LoSlot", "Power Diagnostic System II", 2),
        ("RigSlot", "Medium Core Defense Field Extender I", 2)]),
    ("Megathron", "NLC Mega - Brawler", "Armor brawl doctrine for structure timers. Void for the first volley.", [
        ("HiSlot", "Neutron Blaster Cannon II", 7), ("MedSlot", "Warp Scrambler II", 1), ("MedSlot", "Stasis Webifier II", 2),
        ("LoSlot", "1600mm Steel Plates II", 2), ("LoSlot", "Magnetic Field Stabilizer II", 3), ("LoSlot", "Damage Control II", 1),
        ("LoSlot", "Energized Adaptive Nano Membrane II", 1), ("RigSlot", "Large Trimark Armor Pump I", 3),
        ("DroneBay", "Hammerhead II", 5), ("Cargo", "Void L", 4000), ("Cargo", "Nanite Repair Paste", 60)]),
    ("Machariel", "NLC Mach - Shield Kite", "Fast shield battleship doctrine. Keep range, keep transversal.", [
        ("HiSlot", "800mm Repeating Cannon II", 7), ("MedSlot", "Large Shield Extender II", 3),
        ("MedSlot", "Multispectrum Shield Hardener II", 2), ("MedSlot", "50MN Microwarpdrive II", 1),
        ("LoSlot", "Gyrostabilizer II", 3), ("LoSlot", "Damage Control II", 1), ("LoSlot", "Tracking Enhancer II", 2),
        ("RigSlot", "Large Core Defense Field Extender I", 3), ("Cargo", "Hail M", 8000)]),
    ("Hulk", "Hulk - Max Yield", "Boosted by the Orca in Hek. Empty the ore hold into the refinery.", [
        ("HiSlot", "Modulated Strip Miner II", 3), ("MedSlot", "Multispectrum Shield Hardener II", 1),
        ("MedSlot", "Survey Scanner II", 1), ("MedSlot", "Medium Shield Extender II", 1), ("LoSlot", "Mining Laser Upgrade II", 2),
        ("LoSlot", "Damage Control II", 1), ("DroneBay", "Hobgoblin II", 5)]),
)
SLOTS = ("HiSlot", "MedSlot", "LoSlot", "RigSlot")
CONTAINER_NAMES = ("Doctrine Modules", "Ammo", "Spare Fits", "Loot", "Do Not Touch", "SRP Stock", "Misc")
BLUEPRINTS = (
    # name, copy, runs, me, te
    ("Rifter Blueprint", False, -1, 10, 20), ("Vexor Blueprint", False, -1, 10, 20), ("Drake Blueprint", False, -1, 10, 20),
    ("Hurricane Blueprint", False, -1, 9, 18), ("Raven Blueprint", False, -1, 8, 16), ("Megathron Blueprint", False, -1, 10, 20),
    ("Hobgoblin I Blueprint", False, -1, 10, 20), ("Scourge Heavy Missile Blueprint", False, -1, 10, 20),
    ("Nitrogen Fuel Block Blueprint", False, -1, 10, 20), ("Hammerhead II Blueprint", True, 10, 2, 4),
    ("Damage Control II Blueprint", True, 10, 2, 4), ("Heavy Missile Launcher II Blueprint", True, 5, 3, 2),
    ("Drake Blueprint", True, 20, 10, 20), ("Vexor Blueprint", True, 10, 10, 20),
)


def named_types(types: dict, groups: dict | None = None, categories: dict | None = None) -> dict[str, int]:
    """Type ids by name: the static data's where it has the type, else the fallback ids in ``types``
    (name -> (id, group id, ...)), added here along with ``groups`` and ``categories``."""
    found = dict(ItemType.objects.filter(name__in=types).order_by("published", "-id").values_list("name", "id"))
    missing = [n for n in types if n not in found]
    if missing:
        ItemCategory.objects.bulk_create(
            [ItemCategory(id=i, name=n, published=True) for i, n in (categories or {}).items()], ignore_conflicts=True
        )
        ItemGroup.objects.bulk_create(
            [ItemGroup(id=i, name=n, category_id=c, published=True) for i, (n, c) in (groups or {}).items()], ignore_conflicts=True
        )
        ItemType.objects.bulk_create(
            [ItemType(id=types[n][0], name=n, group_id=types[n][1], published=True) for n in missing], ignore_conflicts=True
        )
        found.update(ItemType.objects.filter(name__in=missing).values_list("name", "id"))
    return found


def items() -> dict[str, int]:
    """``ITEMS`` by name, with market prices where the copied ones have none (asset and fitting values)."""
    ids = named_types(ITEMS, GROUPS, CATEGORIES)
    MarketPrice.objects.bulk_create(
        [MarketPrice(type_id=ids[n], average_price=p, adjusted_price=p) for n, (_, _, p) in ITEMS.items() if n in ids and p],
        ignore_conflicts=True,
    )
    return ids


def fits(ids: dict[str, int]) -> list[dict]:
    """``FITS`` with type ids and ESI's flags (HiSlot0, HiSlot1, ..., DroneBay, Cargo)."""
    out = []
    for ship, name, description, layout in FITS:
        if ship not in ids:
            continue
        used, rows = {}, []
        for slot, item, count in layout:
            if item not in ids:
                continue
            if slot in SLOTS:
                for _ in range(count):
                    rows.append({"flag": f"{slot}{used.get(slot, 0)}", "quantity": 1, "type_id": ids[item]})
                    used[slot] = used.get(slot, 0) + 1
            else:
                rows.append({"flag": slot, "quantity": count, "type_id": ids[item]})
        out.append({"ship": ids[ship], "name": name, "description": description, "items": rows})
    return out


class _Hangar:
    """One character's asset rows, built the way ESI lists them."""

    def __init__(self, demo, character):
        self.demo, self.character = demo, character
        self.assets, self.blueprints, self.roots = [], [], {}

    def add(self, type_id, where, flag="Hangar", quantity=1, singleton=False, name="", bpc=None) -> int:
        """``where``: a station, structure or system id, or an item added before (a ship or container)."""
        item_id = self.demo.next_id()
        if where in self.roots:
            location_type, root = "item", self.roots[where]
        else:
            location_type = "station" if 60_000_000 <= where < 64_000_000 else "solar_system" if where < 33_000_000 else "item"
            root = where
        self.roots[item_id] = root
        self.assets.append(Asset(
            character=self.character, item_id=item_id, type_id=type_id, quantity=quantity, location_id=where,
            location_type=location_type, location_flag=flag, is_singleton=singleton, is_blueprint_copy=bpc, name=name,
            root_location_id=root,
        ))
        return item_id

    def ship(self, type_id, where, fit=None, name="") -> int:
        ship_id = self.add(type_id, where, singleton=True, name=name)
        for row in (fit or {}).get("items", ()):
            fitted = row["flag"].startswith(SLOTS)
            self.add(row["type_id"], ship_id, row["flag"], row["quantity"], singleton=fitted)
        return ship_id

    def container(self, ids, where, name, size="Medium Secure Container") -> int:
        return self.add(ids[size], where, singleton=True, name=name)

    def blueprint(self, type_id, where, copy, runs, me, te, flag="Hangar"):
        item_id = self.add(type_id, where, flag, singleton=True, bpc=True if copy else None)
        self.blueprints.append(Blueprint(
            character=self.character, item_id=item_id, type_id=type_id, location_id=where, root_location_id=self.roots[item_id],
            location_flag=flag, quantity=-2 if copy else -1, runs=runs if copy else -1, material_efficiency=me, time_efficiency=te,
        ))


def seed(demo):
    ids = items()
    doctrine = fits(ids)
    fit_of = {}
    for f in doctrine:
        fit_of.setdefault(f["ship"], f)
    infos = {i.character_id: i for i in CharacterInfo.objects.filter(character__in=demo.characters)}
    capital_ids = ItemType.objects.filter(name="Capital Ships").values("id")
    capital = set(CharacterSkill.objects.filter(skill_id__in=capital_ids, active_level__gte=1).values_list("character_id", flat=True))
    stations = demo.station_ids()
    structures = [s["id"] for s in demo.structures] or stations[:4]

    hangars, fittings = [], []
    for c in demo.characters:
        h = _Hangar(demo, c)
        info = infos.get(c.pk)
        here = info and (info.structure_id or info.station_id or info.solar_system_id)
        if info and info.ship_type_id and here:
            h.ship(info.ship_type_id, here, fit_of.get(info.ship_type_id), info.ship_name)
        if c.pk == demo.admin.main_character_id:
            _admin_main(demo, h, ids, doctrine, structures, stations)
        elif c.user_id == demo.admin.pk:
            _admin_alt(demo, h, ids, structures, stations, trader=c.pk % 2 == 0)
        else:
            _member(demo, h, ids, doctrine, structures, stations, here, main=c.pk == c.user.main_character_id,
                    capital=c.pk in capital)
        hangars.append(h)

        # Saved fittings: everyone keeps the doctrines they fly; the demo account has them all.
        mine = doctrine if c.user_id == demo.admin.pk else demo.sample(doctrine, demo.rng.randint(1, 4))
        for f in mine:
            fittings.append(Fitting(character=c, fitting_id=40_000_000 + demo.next_id() % 10_000_000, name=f["name"],
                                    description=f["description"], ship_type_id=f["ship"], items=f["items"]))

    Asset.objects.bulk_create([a for h in hangars for a in h.assets], batch_size=2000)
    Blueprint.objects.bulk_create([b for h in hangars for b in h.blueprints], batch_size=2000)
    Fitting.objects.bulk_create(fittings, batch_size=2000)


def _stacks(demo, h, ids, where, names, low, high, flag="Hangar"):
    for name in names:
        if name in ids:
            h.add(ids[name], where, flag, demo.rng.randint(low, high))


MODULES = ("Damage Control II", "Large Shield Extender II", "Multispectrum Shield Hardener II", "50MN Microwarpdrive II",
           "Warp Disruptor II", "Gyrostabilizer II", "425mm AutoCannon II", "Heavy Missile Launcher II", "Drone Damage Amplifier II",
           "Ballistic Control System II", "Medium Core Defense Field Extender I", "Stasis Webifier II", "1600mm Steel Plates II")
MINERALS = ("Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Zydrine", "Megacyte")
AMMO = ("Hail M", "Scourge Heavy Missile", "Void L", "EMP S")


def _admin_main(demo, h, ids, doctrine, structures, stations):
    market, forge, staging = structures[1 % len(structures)], structures[0], structures[-1]
    # The Keepstar: doctrine ships ready to undock, a container of spare modules, ammo.
    for f in doctrine:
        if f["name"].startswith("NLC") and demo.chance(0.8):
            h.ship(f["ship"], market, f, f"{f['name'].split(' - ')[0].removeprefix('NLC ')} {demo.rng.randint(1, 9)}")
    box = h.container(ids, market, "Doctrine Modules", "Giant Secure Container")
    _stacks(demo, h, ids, box, MODULES, 6, 40, "Unlocked")
    _stacks(demo, h, ids, market, AMMO, 8_000, 60_000)
    _stacks(demo, h, ids, market, ("Nanite Repair Paste", "Hammerhead II", "Hobgoblin II"), 20, 400)
    # The Forge: the blueprint library, minerals, fuel and the Orca.
    library = h.container(ids, forge, "BPO Library", "Giant Secure Container")
    copies = h.container(ids, forge, "Invention Copies")
    for name, copy, runs, me, te in BLUEPRINTS:
        if name in ids:
            h.blueprint(ids[name], copies if copy else library, copy, runs, me, te, "Unlocked")
            if copy and demo.chance(0.6):
                h.blueprint(ids[name], copies, copy, runs, me, te, "Unlocked")
    for name, qty in zip(MINERALS, (14_200_000, 3_650_000, 910_000, 248_000, 61_500, 24_800, 11_900)):
        if name in ids:
            h.add(ids[name], forge, quantity=qty)
    _stacks(demo, h, ids, forge, ("Nitrogen Fuel Block",), 6_000, 12_000)
    if "Orca" in ids:
        h.ship(ids["Orca"], forge, name="Mother Goose")
    # The staging: the capitals.
    for ship, name in (("Archon", "Northern Light"), ("Revelation", "Sunbreaker")):
        if ship in ids:
            h.ship(ids[ship], staging, name=name)
    _stacks(demo, h, ids, staging, ("Helium Isotopes",), 150_000, 300_000)
    # Jita, Amarr and Hek: market stock and odds and ends.
    jita, amarr, hek = stations[0], stations[1 % len(stations)], stations[-1]
    _stacks(demo, h, ids, jita, ("Large Shield Extender II", "Damage Control II", "Multispectrum Shield Hardener II"), 40, 150)
    _stacks(demo, h, ids, jita, ("Drake", "Hurricane"), 2, 5)
    _stacks(demo, h, ids, amarr, ("Punisher", "Executioner", "Dual Light Beam Laser I"), 1, 12)
    hulk = next((f for f in doctrine if f["name"].startswith("Hulk")), None)
    if hulk:
        h.ship(hulk["ship"], hek, hulk, "Rock Muncher")
    _stacks(demo, h, ids, hek, ("Veldspar", "Scordite", "Pyroxeres"), 80_000, 600_000)


def _admin_alt(demo, h, ids, structures, stations, trader):
    if trader:
        jita = stations[0]
        _stacks(demo, h, ids, jita, MODULES, 20, 200)
        _stacks(demo, h, ids, jita, ("Hail M", "Scourge Heavy Missile", "Nanite Repair Paste"), 5_000, 40_000)
        _stacks(demo, h, ids, jita, ("Vexor", "Caracal", "Drake"), 3, 10)
        return
    forge = structures[0]
    for name, copy, runs, me, te in BLUEPRINTS:
        if copy and name in ids:
            h.blueprint(ids[name], forge, copy, runs, me, te)
    _stacks(demo, h, ids, forge, MINERALS, 20_000, 2_000_000)
    for ship in ("Retriever", "Procurer"):
        if ship in ids:
            h.ship(ids[ship], forge)


def _member(demo, h, ids, doctrine, structures, stations, here, main, capital):
    home = here if here and here >= 60_000_000 else demo.pick(structures)
    for f in demo.sample(doctrine, demo.rng.randint(1, 3) if main else demo.rng.randint(0, 1)):
        h.ship(f["ship"], home, f)
    if main or demo.chance(0.5):
        box = h.container(ids, home, demo.pick(CONTAINER_NAMES), demo.pick(("Small Secure Container", "Medium Secure Container")))
        _stacks(demo, h, ids, box, demo.sample(MODULES, demo.rng.randint(2, 6)), 1, 12, "Unlocked")
    _stacks(demo, h, ids, home, demo.sample(AMMO, 2), 500, 12_000)
    if demo.chance(0.35):
        _stacks(demo, h, ids, home, demo.sample(MINERALS, 4), 5_000, 900_000)
    if demo.chance(0.4):
        _stacks(demo, h, ids, demo.pick(stations), demo.sample(("Rifter", "Merlin", "Vexor", "Thorax", "Drake", "Tritanium"), 2), 1, 4)
    if capital:
        staging = structures[-1]
        ship = demo.pick(("Archon", "Thanatos", "Revelation", "Naglfar"))
        if ship in ids:
            h.ship(ids[ship], staging)
        _stacks(demo, h, ids, staging, ("Helium Isotopes",), 20_000, 120_000)
    # A blueprint or two: mostly research copies, the odd original.
    for name, copy, runs, me, te in demo.sample(BLUEPRINTS, demo.rng.randint(1, 3) if main else demo.rng.randint(0, 2)):
        if name in ids:
            h.blueprint(ids[name], home, copy, runs, me if copy else demo.rng.randint(0, 10), te if copy else 2 * demo.rng.randint(0, 10))
