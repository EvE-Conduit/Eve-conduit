"""Example fleets for demo mode (see conduit.demo.seed): three months of fleets of every kind with their FATs, one
of them in the air right now and tracked, another with its FAT link still open."""

from datetime import timedelta

from conduit.demo.seed import catalog

from .models import Fat, Fleet, FleetType

TYPES = (("CTA", "#ef4444"), ("Stratop", "#f97316"), ("Roam", "#38bdf8"), ("Home Defence", "#22c55e"), ("Mining Op", "#eab308"))
# fleet type -> (names, ships flown, notes, pilots)
KINDS = {
    "CTA": (("CTA: Keepstar defence", "CTA: Fortizar armor timer", "CTA: Rens staging defence"), (639, 638, 11985, 29990),
            "Shield Battleships. Comms: Fleet 1. Form-up at the Perimeter Keepstar.", (25, 45)),
    "Stratop": (("Stratop: Hek refinery hull timer", "Stratop: Astrahus bash", "Stratop: moon defence"), (24698, 24702, 621, 11985, 622),
                "Drake Fleet. Logi in the logi channel. Bring a spare ship.", (15, 30)),
    "Roam": (("Sunday roam", "Low sec roam", "Frigate roam", "Thorax brawl roam"), (627, 626, 11987, 622, 587, 603, 597),
             "Armor Cruisers or Newbro Frigates. No SRP for off-doctrine.", (6, 16)),
    "Home Defence": (("Home defence: Hek gate camp", "Home defence: Perimeter", "Response fleet"), (24698, 24702, 627, 626),
                     "Whatever you have undocked. X up in fleet chat.", (5, 14)),
    "Mining Op": (("Moon frack: Deep Void Refinery", "Ice mining op", "Belt op"), (22544, 22546, 17480, 28606),
                  "Orca boosts from 19:00. Compress at the refinery.", (6, 18)),
}


def _code(demo) -> str:
    return "".join(demo.rng.choice("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789") for _ in range(12))


def seed(demo):
    types = {name: t for name, t in zip((n for n, _ in TYPES), FleetType.objects.bulk_create([FleetType(name=n, color=c) for n, c in TYPES]))}
    fcs = list(demo.groups["Fleet Commanders"].user_set.all()) or [demo.admin]
    pilots = [c for c in demo.characters if c.user.state_id in (demo.states["member"].pk, demo.states["blue"].pk)]
    systems = list(catalog.SYSTEMS)

    plan = []  # (fleet, how many pilots, ships)
    for n in range(42):
        kind = demo.rng.choices(list(KINDS), weights=[2, 3, 5, 3, 3])[0]
        names, ships, notes, (lo, hi) = KINDS[kind]
        started = demo.recent(90) if n > 1 else demo.ago(hours=1.5 if n == 0 else 0.4)
        hours = demo.rng.uniform(1, 4)
        running = n <= 1
        fc = demo.admin if n == 0 else demo.pick(fcs)
        fleet = Fleet(
            name=demo.pick(names), fleet_type=types[kind], notes=notes, fc=fc, created_by=fc, started_at=started,
            ended_at=None if running else started + timedelta(hours=hours), link_code=_code(demo),
            link_open=running or demo.chance(0.1), fat_round=2 if hours > 3 and kind in ("CTA", "Stratop") else 1,
        )
        if n == 0:
            # In the air now, read from the FC's in-game fleet every minute (the demo never really asks ESI).
            fleet.name, fleet.fleet_type, fleet.notes = "CTA: Keepstar defence", types["CTA"], KINDS["CTA"][2]
            fleet.tracking, fleet.tracking_character, fleet.esi_fleet_id = True, demo.admin.main_character, demo.next_id()
            fleet.last_tracked_at, fleet.motd_written = demo.ago(minutes=1), "FATs are being tracked"
            names, ships, notes, (lo, hi) = KINDS["CTA"]
        elif n == 1:
            fleet.link_expires_at = demo.ahead(minutes=45)  # pilots register with the FAT link
        if fleet.fat_round > 1:
            fleet.round_started_at = started + timedelta(hours=hours / 2)
        plan.append((fleet, demo.rng.randint(lo, hi), ships))
    Fleet.objects.bulk_create([f for f, _, _ in plan])

    fats, created = [], []
    for fleet, count, ships in plan:
        system = demo.pick(systems)
        flown = demo.sample(pilots, count)
        if fleet.fc and demo.chance(0.9):  # the FC is in their own fleet (and the demo account flies often)
            flown = [fleet.fc.main_character] + [c for c in flown if c.pk != fleet.fc.main_character_id]
        if demo.admin.main_character not in flown and demo.chance(0.35):
            flown.append(demo.admin.main_character)
        via = "esi" if fleet.esi_fleet_id or demo.chance(0.6) else "link"
        for r in range(1, fleet.fat_round + 1):
            for c in flown if r == 1 else demo.sample(flown, int(len(flown) * 0.8)):
                how = "manual" if demo.chance(0.04) else via  # the odd pilot the FC added by hand
                fats.append(Fat(fleet=fleet, round=r, character_id=c.pk, character_name=c.name, ship_type_id=demo.pick(ships),
                                solar_system_id=system, via=how, added_by=fleet.fc if how == "manual" else None))
                start = fleet.started_at if r == 1 else fleet.round_started_at
                created.append(start + timedelta(minutes=demo.rng.uniform(0, 30)))
    Fat.objects.bulk_create(fats)
    for fat, when in zip(fats, created):
        fat.created_at = when
    Fat.objects.bulk_update(fats, ["created_at"])
