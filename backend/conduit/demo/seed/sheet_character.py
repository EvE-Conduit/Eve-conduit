"""The character Overview tab: bio, where each character is and what they fly, clones and implants, jump fatigue,
corporation titles and roles, and a corporation history that starts in the NPC school corporations."""

from datetime import timedelta

from conduit.eve.models import EveCorporation, EveName
from conduit.sde.models import Bloodline, Race
from conduit.sheet.overview.models import CharacterInfo, CorporationHistory

from . import catalog
from .sheet_assets import items, named_types

RACES = {1: "Caldari", 2: "Minmatar", 4: "Amarr", 8: "Gallente"}
# id -> (name, race)
BLOODLINES = {
    1: ("Deteis", 1), 2: ("Civire", 1), 11: ("Achura", 1), 3: ("Sebiestor", 2), 4: ("Brutor", 2), 14: ("Vherokior", 2),
    5: ("Amarr", 4), 6: ("Ni-Kunni", 4), 13: ("Khanid", 4), 7: ("Gallente", 8), 8: ("Intaki", 8), 12: ("Jin-Mei", 8),
}
# The NPC corporations new characters start in, by race.
SCHOOLS = {
    1: ((1000045, "Science and Trade Institute"), (1000044, "School of Applied Knowledge"), (1000167, "State War Academy")),
    2: ((1000170, "Republic Military School"), (1000171, "Republic University"), (1000172, "Pator Tech School")),
    4: ((1000165, "Hedion University"), (1000166, "Imperial Academy"), (1000164, "Royal Amarr Institute")),
    8: ((1000115, "University of Caille"), (1000168, "Federal Navy Academy"), (1000169, "Center for Advanced Studies")),
}
IMPLANT_GROUPS = {300: ("Cyberimplant", 20)}
# name -> (fallback id, group)
IMPLANTS = {
    "Ocular Filter - Improved": (10216, 300), "Memory Augmentation - Improved": (10209, 300),
    "Neural Boost - Improved": (10213, 300), "Cybernetic Subprocessor - Improved": (10221, 300),
    "Social Adaptation Chip - Improved": (10226, 300), "Ocular Filter - Standard": (10217, 300),
    "Memory Augmentation - Standard": (10208, 300), "Neural Boost - Standard": (10212, 300),
    "Cybernetic Subprocessor - Standard": (10222, 300), "Limited Ocular Filter - Beta": (13219, 300),
    "High-grade Snake Alpha": (19540, 300), "High-grade Snake Beta": (19551, 300), "High-grade Snake Gamma": (19553, 300),
    "High-grade Snake Delta": (19554, 300), "High-grade Snake Epsilon": (19555, 300), "High-grade Snake Omega": (19556, 300),
    "Eifyr and Co. 'Rogue' Navigation NN-605": (27097, 300), "Inherent Implants 'Squire' Power Grid Management EG-605": (27070, 300),
    "Zainou 'Deadeye' Sharpshooter ST-905": (27074, 300),
}
PLUS5 = ("Ocular Filter - Improved", "Memory Augmentation - Improved", "Neural Boost - Improved", "Cybernetic Subprocessor - Improved",
         "Social Adaptation Chip - Improved")
PLUS4 = ("Ocular Filter - Standard", "Memory Augmentation - Standard", "Neural Boost - Standard", "Cybernetic Subprocessor - Standard")
SNAKES = tuple(f"High-grade Snake {g}" for g in ("Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Omega"))
HARDWIRINGS = ("Eifyr and Co. 'Rogue' Navigation NN-605", "Inherent Implants 'Squire' Power Grid Management EG-605",
               "Zainou 'Deadeye' Sharpshooter ST-905")

SHIPS = {
    # What people sit in, by corporation (main, staging, mining) and for everyone else.
    0: ("Machariel", "Hurricane", "Basilisk", "Drake", "Vexor", "Megathron", "Tengu"),
    1: ("Hurricane", "Loki", "Megathron", "Guardian", "Stabber", "Rifter"),
    2: ("Hulk", "Skiff", "Orca", "Retriever", "Procurer"),
    None: ("Rifter", "Merlin", "Caracal", "Thorax", "Drake", "Vexor"),
}
SHIP_NAMES = ("Northern Wind", "Iron Will", "Night Watch", "Second Chance", "Fly Safe o7", "Rust Bucket", "Lucky Strike",
              "Bad Idea", "Glass Cannon", "Quiet Storm", "Starfall", "Not Today", "Old Faithful", "Tax Write-Off")
TITLES = ("Line Member", "Fleet Commander", "Industrialist", "Recruiter", "Logistics", "Scout", "Hauler", "Veteran")
ROLES = ("Hangar_Take_1", "Hangar_Query_1", "Container_Take_1", "Station_Manager", "Factory_Manager", "Accountant",
         "Contract_Manager", "Communications_Officer", "Personnel_Manager", "Trader", "Diplomat", "Security_Officer")
CLONE_NAMES = ("", "", "Travel", "PvP", "Industry", "Trade hub", "Staging", "Snakes")
BIOS = (
    "Miner by day, roamer by night. Ask me about Hek.",
    "Logistics main. If you're red on my watchlist, I'm already locking you.",
    "Here for the explosions. Will fly whatever the FC says.",
    "Industrialist and part-time hauler. Contracts welcome, scams not.",
    "Former nullsec FC, now mostly herding newbros through their first roam.",
    "I build things so other people can lose them. You're welcome.",
    "Don't fly what you can't afford to lose. I never listen either.",
)
ADMIN_BIO = (
    "CEO of Aurora Industries and the Northern Lights Coalition.\n\n"
    "We build, we mine, we fly together. New pilots are welcome: the corporation pays for your first doctrine hulls and "
    "the Industrialists will get you mining on day one.\n\nRecruitment: open. Talk to any Recruiter in the corp channel."
)


def _home(demo, character):
    """Where a character is based: the corporation's structure, or an NPC station for those outside the alliance."""
    corps = [c.pk for c in demo.corporations]
    structures = [s["id"] for s in demo.structures]
    stations = demo.station_ids()
    if character.corporation_id in corps and structures:
        i = corps.index(character.corporation_id)
        return structures[{0: character.pk % 2, 1: -1, 2: 2 % len(structures)}[i]] if len(structures) >= 4 else structures[0]
    return stations[character.pk % len(stations)]


def seed(demo):
    Race.objects.bulk_create([Race(id=i, name=n) for i, n in RACES.items()], ignore_conflicts=True)
    Bloodline.objects.bulk_create([Bloodline(id=i, name=n, race_id=r) for i, (n, r) in BLOODLINES.items()], ignore_conflicts=True)
    schools = [s for by_race in SCHOOLS.values() for s in by_race]
    EveCorporation.objects.bulk_create([EveCorporation(id=i, name=n) for i, n in schools], ignore_conflicts=True)
    EveName.objects.bulk_create([EveName(id=i, name=n, category="corporation") for i, n in schools], ignore_conflicts=True)

    implants = named_types(IMPLANTS, IMPLANT_GROUPS, {20: "Implant"})
    ships = items()
    system_of = {loc: sys for loc, (_, sys) in catalog.STATIONS.items()}
    system_of.update({s["id"]: s["system_id"] for s in demo.structures})
    corps = [c.pk for c in demo.corporations]
    directors = set(demo.groups["Directors"].user_set.values_list("pk", flat=True)) if "Directors" in demo.groups else set()
    fcs = set(demo.groups["Fleet Commanders"].user_set.values_list("pk", flat=True)) if "Fleet Commanders" in demo.groups else set()
    structures = [s["id"] for s in demo.structures]

    infos, history = [], []
    for c in demo.characters:
        is_admin = c.user_id == demo.admin.pk
        is_main = c.pk == c.user.main_character_id
        bloodline = demo.pick(BLOODLINES)
        race = BLOODLINES[bloodline][1]
        born = c.added_at - timedelta(days=demo.rng.uniform(30, 4200 if is_main else 2500))
        if is_admin and is_main:
            born = demo.ago(days=365 * 11 + 47)

        # Where they are now: mostly docked at home, now and then in Jita or out in space.
        home = _home(demo, c)
        where = home if demo.chance(0.75) or is_admin else demo.pick(demo.station_ids())
        in_space = not is_admin and demo.chance(0.12)
        system_id = system_of.get(where) or demo.pick(demo.system_ids())
        corp_index = corps.index(c.corporation_id) if c.corporation_id in corps else None
        ship_pool = [s for s in SHIPS[corp_index] if s in ships] or [s for s in SHIPS[None] if s in ships]
        ship = "Machariel" if is_admin and is_main and "Machariel" in ships else demo.pick(ship_pool)
        online = is_admin and is_main or demo.chance(0.3)
        last_login = demo.recent(0.2) if online else demo.recent(6)

        # Clones: the active one, plus jump clones at the structures and trade hubs.
        if is_admin:
            active = [implants[n] for n in (PLUS5 + HARDWIRINGS if is_main else PLUS4) if n in implants]
        else:
            active = [implants[n] for n in demo.pick((PLUS5, PLUS4, PLUS4[:2], (), ())) if n in implants]
        clones = []
        clone_places = demo.sample([*structures, *demo.station_ids()], 3 if is_admin and is_main else demo.rng.randint(0, 2))
        for n, place in enumerate(p for p in clone_places if p != where):
            name = "Snakes" if is_admin and n == 0 else demo.pick(CLONE_NAMES)
            kit = SNAKES if name == "Snakes" else demo.pick((PLUS4, PLUS5[:3], ()))
            clones.append({"jump_clone_id": 20_000_000 + demo.next_id() % 10_000_000, "location_id": place, "name": name,
                           "implants": [implants[i] for i in kit if i in implants]})

        titles, roles = [], []
        if corp_index is not None:
            if is_admin:
                titles, roles = ["CEO", "Director", "Fleet Commander"], ["Director", *ROLES]
            elif c.user_id in directors and is_main:
                titles, roles = ["Director"], ["Director", *demo.sample(ROLES, 4)]
            else:
                titles = (["Fleet Commander"] if c.user_id in fcs and is_main else []) + demo.sample(TITLES, demo.rng.randint(1, 2))
                titles = list(dict.fromkeys(titles))
                roles = sorted(demo.sample(ROLES[:3], demo.rng.randint(0, 3)))
        jumped = is_admin and is_main or (corp_index is not None and demo.chance(0.15))

        infos.append(CharacterInfo(
            character=c, birthday=born, gender=demo.pick(("male", "female")), race_id=race, bloodline_id=bloodline,
            security_status=round(5.0 if is_admin and is_main else demo.rng.triangular(-3.5, 5.0, 2.0), 6),
            description=ADMIN_BIO if is_admin and is_main else demo.pick(BIOS) if is_main and demo.chance(0.6) else "",
            title=titles[0] if titles else "",
            solar_system_id=system_id, station_id=where if 60_000_000 <= where < 64_000_000 and not in_space else None,
            structure_id=where if where >= 1_000_000_000_000 and not in_space else None,
            ship_type_id=ships[ship], ship_name="Aurora's Pride" if is_admin and is_main else demo.pick((
                f"{c.name.split()[0]}'s {ship}", *SHIP_NAMES)),
            online=online, last_login=last_login, last_logout=None if online else last_login + timedelta(hours=demo.rng.uniform(0.3, 5)),
            logins=demo.rng.randint(300, 4000) if is_main else demo.rng.randint(20, 900),
            home_location_id=home, last_clone_jump_date=demo.recent(40) if clones else None, implants=active, jump_clones=clones,
            jump_fatigue_expires=demo.ahead(hours=demo.rng.uniform(1, 9)) if jumped else None,
            last_jump_date=demo.ago(hours=demo.rng.uniform(0.5, 6)) if jumped else None,
            titles=sorted(titles), roles=sorted(roles),
        ))

        # Corporation history: a school corporation first, then perhaps a stint elsewhere, then today's.
        school = demo.pick(SCHOOLS[race])[0]
        stops = [(school, born)]
        joined = c.added_at - timedelta(days=demo.rng.uniform(5, 200))
        if demo.chance(0.5) and joined - born > timedelta(days=60):
            others = [x.pk for x in (*demo.corporations, demo.blue_corporation) if x and x.pk != c.corporation_id]
            stops.append((demo.pick(others), born + (joined - born) * demo.rng.uniform(0.2, 0.8)))
        stops.append((c.corporation_id, max(joined, born + timedelta(days=1))))
        history += [CorporationHistory(character=c, record_id=10_000_000 + demo.next_id() % 90_000_000, corporation_id=corp,
                                       start_date=start) for corp, start in stops]

    CharacterInfo.objects.bulk_create(infos)
    CorporationHistory.objects.bulk_create(history)
