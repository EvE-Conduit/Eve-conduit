"""Example doctrines for demo mode (see conduit.demo.seed): the alliance's fleet doctrines with their fits, one
of them retired.

Modules are found by name in the static data, so the fits are complete on a site that has it; where it's missing
(only the demo's small catalogue), a fit keeps the ship and whatever modules the catalogue knows."""

from django.db.models.functions import Lower

from conduit.sde.models import ItemType

from .models import Doctrine, DoctrineFit, Fit

# Skills the FCs want on top of what the fits need (ids from the demo's catalogue of skills).
GUNNERY, SPACESHIP, NAVIGATION, DRONES, SHIELDS, ARMOR, LEADERSHIP, MISSILES, CAPITALS = 3300, 3327, 3449, 3436, 3416, 3392, 3348, 3319, 20533

# name, ship, role, notes, recommended skills, {slot: [(module, charge) or module, ...]}
FITS = {
    "tempest": ("Tempest - Fleet DPS", "Tempest", "DPS", "Shoot the primary, nothing else. Keep transversal low and stay in range of logi.",
                [[GUNNERY, 5], [SHIELDS, 4]], {
                    "hi": [("1400mm Howitzer Artillery II", "Republic Fleet Phased Plasma L")] * 6,
                    "med": ["Large Shield Extender II", "Large Shield Extender II", "Multispectrum Shield Hardener II", "500MN Microwarpdrive II"],
                    "low": ["Gyrostabilizer II", "Gyrostabilizer II", "Gyrostabilizer II", "Tracking Enhancer II", "Damage Control II"],
                    "rig": ["Large Core Defense Field Extender I"] * 3,
                    "drone": [("Hammerhead II", 5)], "cargo": [("Republic Fleet Phased Plasma L", 2000)],
                }),
    "raven": ("Raven - Torpedo Brawler", "Raven", "DPS", "Close range only: burn to the anchor, then lock up the primary.",
              [[MISSILES, 5], [SHIELDS, 4]], {
                  "hi": [("Torpedo Launcher II", "Mjolnir Rage Torpedo")] * 6,
                  "med": ["Large Shield Extender II", "Large Shield Extender II", "Multispectrum Shield Hardener II", "500MN Microwarpdrive II",
                          "Target Painter II"],
                  "low": ["Ballistic Control System II", "Ballistic Control System II", "Ballistic Control System II", "Damage Control II"],
                  "drone": [("Hobgoblin I", 5)], "cargo": [("Mjolnir Rage Torpedo", 1500)],
              }),
    "basilisk": ("Basilisk - Fleet Logi", "Basilisk", "Logistics", "Lock the whole logi channel first. Broadcast for reps early.",
                 [[SHIELDS, 5], [NAVIGATION, 4]], {
                     "hi": ["Large Remote Shield Booster II"] * 4 + ["Small Remote Capacitor Transmitter II"],
                     "med": ["Large Shield Extender II", "Multispectrum Shield Hardener II", "50MN Microwarpdrive II", "Sensor Booster II",
                             "Large Remote Shield Booster II"],
                     "low": ["Damage Control II", "Power Diagnostic System II"],
                     "drone": [("Hobgoblin I", 2)],
                 }),
    "loki": ("Loki - Fleet Boosts", "Loki", "Boosts", "Stay aligned and out of the fight. Skirmish and Shield burst charges in cargo.",
             [[LEADERSHIP, 5]], {
                 "hi": ["Shield Command Burst II", "Skirmish Command Burst II"],
                 "med": ["Large Shield Extender II", "Multispectrum Shield Hardener II", "50MN Microwarpdrive II"],
                 "low": ["Damage Control II", "Nanofiber Internal Structure II"],
             }),
    "drake": ("Drake - Heavy Missiles", "Drake", "DPS", "The bread and butter doctrine. Cheap, sturdy, reimbursed.",
              [[MISSILES, 4], [SHIELDS, 4]], {
                  "hi": [("Heavy Missile Launcher II", "Scourge Heavy Missile")] * 7,
                  "med": ["Large Shield Extender II", "Large Shield Extender II", "Multispectrum Shield Hardener II", "10MN Afterburner II"],
                  "low": ["Ballistic Control System II", "Ballistic Control System II", "Damage Control II"],
                  "rig": ["Medium Core Defense Field Extender I"] * 3,
                  "drone": [("Hobgoblin I", 5)], "cargo": [("Scourge Heavy Missile", 2000)],
              }),
    "hurricane": ("Hurricane - Autocannons", "Hurricane", "DPS", "Pairs with the Drakes; brawl range.",
                  [[GUNNERY, 4]], {
                      "hi": [("425mm AutoCannon II", "Republic Fleet EMP M")] * 6,
                      "med": ["Large Shield Extender II", "Multispectrum Shield Hardener II", "10MN Afterburner II", "Warp Disruptor II"],
                      "low": ["Gyrostabilizer II", "Gyrostabilizer II", "Damage Control II"],
                      "drone": [("Hammerhead II", 5)],
                  }),
    "caracal": ("Caracal - Anti-support", "Caracal", "Support", "Kill tackle frigates and interceptors around the fleet.",
                [[MISSILES, 4]], {
                    "hi": [("Rapid Light Missile Launcher II", "Scourge Fury Light Missile")] * 5,
                    "med": ["Medium Shield Extender II", "Multispectrum Shield Hardener II", "10MN Afterburner II", "Sensor Booster II"],
                    "low": ["Ballistic Control System II", "Damage Control II"],
                }),
    "stabber": ("Stabber - Fast Tackle", "Stabber", "Tackle", "Point the primary, call it in fleet, keep it pointed.",
                [[NAVIGATION, 5]], {
                    "hi": [("220mm Vulcan AutoCannon II", "Republic Fleet EMP M")] * 4,
                    "med": ["50MN Microwarpdrive II", "Warp Disruptor II", "Stasis Webifier II", "Medium Shield Extender II"],
                    "low": ["Nanofiber Internal Structure II", "Damage Control II"],
                }),
    "thorax": ("Thorax - Blaster Brawler", "Thorax", "DPS", "Burn in, web, shoot. Logi does the rest.",
               [[GUNNERY, 4], [ARMOR, 4]], {
                   "hi": [("Heavy Neutron Blaster II", "Void M")] * 5,
                   "med": ["10MN Microwarpdrive II", "Stasis Webifier II", "Warp Scrambler II"],
                   "low": ["1600mm Steel Plates II", "Damage Control II", "Magnetic Field Stabilizer II", "Energized Adaptive Nano Membrane II"],
                   "drone": [("Hobgoblin I", 5)],
               }),
    "vexor": ("Vexor - Drone Cruiser", "Vexor", "DPS", "Drones on the primary; keep spares in the bay.",
              [[DRONES, 5]], {
                  "med": ["10MN Afterburner II", "Medium Cap Battery II", "Warp Disruptor II"],
                  "low": ["Drone Damage Amplifier II", "Drone Damage Amplifier II", "1600mm Steel Plates II", "Damage Control II"],
                  "drone": [("Hammerhead II", 5), ("Hobgoblin I", 5)],
              }),
    "guardian": ("Guardian - Armor Logi", "Guardian", "Logistics", "Cap chain with the other Guardians; FC posts the order.",
                 [[ARMOR, 5]], {
                     "hi": ["Large Remote Armor Repairer II"] * 4 + ["Large Remote Capacitor Transmitter II"],
                     "med": ["10MN Microwarpdrive II", "Sensor Booster II", "Medium Cap Battery II"],
                     "low": ["1600mm Steel Plates II", "Damage Control II", "Energized Adaptive Nano Membrane II"],
                 }),
    "rifter": ("Rifter - Newbro Tackle", "Rifter", "Tackle", "Free for new members: ask in the fleet channel.",
               [[SPACESHIP, 3]], {
                   "hi": [("125mm Gatling AutoCannon I", "EMP S")] * 3,
                   "med": ["1MN Afterburner II", "Warp Scrambler II"],
                   "low": ["Damage Control II", "Small Armor Repairer II"],
                   "cargo": [("EMP S", 400)],
               }),
    "merlin": ("Merlin - Newbro Blaster", "Merlin", "DPS", "Short range and sturdy. Overheat the guns.",
               [[SPACESHIP, 3]], {
                   "hi": [("Light Neutron Blaster I", "Void S")] * 3,
                   "med": ["1MN Afterburner II", "Small Shield Extender II", "Warp Disruptor II"],
                   "low": ["Damage Control II", "Magnetic Field Stabilizer II"],
               }),
    "punisher": ("Punisher - Newbro Armor", "Punisher", "DPS", "Lasers never run out of ammo.",
                 [[SPACESHIP, 3]], {
                     "hi": [("Dual Light Beam Laser I", "Multifrequency S")] * 3,
                     "med": ["1MN Afterburner II", "Warp Scrambler II"],
                     "low": ["200mm Steel Plates II", "Damage Control II", "Heat Sink II"],
                 }),
    "archon": ("Archon - Triage Carrier", "Archon", "Logistics", "Only on the FC's call. Stay docked otherwise.",
               [[CAPITALS, 4]], {
                   "hi": ["Capital Remote Armor Repairer II"] * 3,
                   "drone": [("Hobgoblin I", 5)],
               }),
    "thanatos": ("Thanatos - Fighters", "Thanatos", "DPS", "Fighters on the primary structure; keep a cyno alt nearby.",
                 [[CAPITALS, 4], [DRONES, 5]], {"drone": [("Hammerhead II", 5)]}),
    "naglfar": ("Naglfar - Siege Dread", "Naglfar", "DPS", "Structure bashes and capital kills.", [[CAPITALS, 5]], {}),
    "revelation": ("Revelation - Siege Dread", "Revelation", "DPS", "Structure bashes and capital kills.", [[CAPITALS, 5]], {}),
    "machariel": ("Machariel - Long Range", "Machariel", "DPS", "Retired: replaced by the Tempest fleet.", [[GUNNERY, 5]], {
        "hi": [("1200mm Artillery Cannon II", "Republic Fleet Phased Plasma L")] * 7,
        "low": ["Gyrostabilizer II", "Gyrostabilizer II", "Tracking Enhancer II", "Damage Control II"],
    }),
}

# name, description, active, fits
DOCTRINES = (
    ("Shield Battleships", "Our main fleet doctrine for structure timers and big fights. Tempests and Ravens, Basilisks on reps, "
     "a Loki on boosts.", True, ("tempest", "raven", "basilisk", "loki")),
    ("Drake Fleet", "Cheap and forgiving. Home defence and the Sunday roams.", True, ("drake", "hurricane", "caracal", "basilisk", "stabber")),
    ("Armor Cruisers", "Brawling cruisers for small gang fights in low sec.", True, ("thorax", "vexor", "guardian", "stabber")),
    ("Newbro Frigates", "Free frigates for anyone new: learn tackle and fleet basics without risking much.", True, ("rifter", "merlin", "punisher")),
    ("Capital Umbrella", "Carriers and dreadnoughts for structure fights. Capital Pilots only.", True,
     ("archon", "thanatos", "naglfar", "revelation")),
    ("Machariel Fleet", "Retired in favour of the Tempests. Kept for reference.", False, ("machariel", "guardian")),
)


def _items(slots, ids):
    """The fit's items, keeping only the types this site's static data has."""
    items = []
    for slot, entries in slots.items():
        position = 0
        for entry in entries:
            if slot in ("drone", "cargo"):
                name, quantity = entry
                charge = None
            else:
                name, charge = entry if isinstance(entry, tuple) else (entry, None)
                quantity = 1
            if name.lower() not in ids:
                continue
            items.append({"slot": slot, "position": position, "type_id": ids[name.lower()], "charge_id": ids.get(charge.lower()) if charge else None,
                          "quantity": quantity, "offline": False})
            position += 1
    return items


def seed(demo):
    names = {FITS[k][1] for k in FITS} | {
        n for f in FITS.values() for entries in f[5].values() for e in entries for n in ((e[0], e[1]) if isinstance(e, tuple) else (e,))
        if isinstance(n, str)
    }
    ids = dict(ItemType.objects.annotate(lname=Lower("name")).filter(lname__in={n.lower() for n in names}).order_by("published")
               .values_list("lname", "pk"))
    fc = list(demo.groups["Fleet Commanders"].user_set.all()) or [demo.admin]
    fits = {}
    for key, (name, ship, role, notes, recommended, slots) in FITS.items():
        if ship.lower() not in ids:
            continue
        fits[key] = Fit(name=name, ship_type_id=ids[ship.lower()], role=role, notes=notes, recommended=recommended,
                        items=_items(slots, ids), created_by=demo.pick(fc))
    Fit.objects.bulk_create(fits.values())

    doctrines = Doctrine.objects.bulk_create([
        Doctrine(name=name, description=description, active=active, order=n,
                 icon_type_id=fits[keys[0]].ship_type_id if keys[0] in fits else None)
        for n, (name, description, active, keys) in enumerate(DOCTRINES)
    ])
    DoctrineFit.objects.bulk_create([
        DoctrineFit(doctrine=d, fit=fits[k], order=n)
        for d, (*_, keys) in zip(doctrines, DOCTRINES) for n, k in enumerate(keys) if k in fits
    ])

    # Made over the last year, touched now and then.
    for f in fits.values():
        f.created_at = demo.recent(365)
        f.updated_at = f.created_at + (demo.now - f.created_at) * demo.rng.random()
    Fit.objects.bulk_update(fits.values(), ["created_at", "updated_at"])
