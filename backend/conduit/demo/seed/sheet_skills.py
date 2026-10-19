"""Skills, attributes and skill queues. Each character trains a few of the profiles below (a race's guns and
ships, industry, trade, leadership...), as far as their age allows; the demo account has nearly all of them and a
long queue in training. A handful of mains fly capitals, which is what the Capital Pilots group goes by."""

from datetime import timedelta

from conduit.sde.models import SkillInfo
from conduit.sheet.skills.models import CharacterSkill, SkillQueueItem, SkillSummary
from conduit.sheet.skills.training import sp_for_level, sp_per_minute

from .sheet_assets import named_types

ATTRS = {"p": "perception", "w": "willpower", "i": "intelligence", "m": "memory", "c": "charisma"}
GROUPS = {272: ("Electronic Systems", 16), 269: ("Rigging", 16), 1213: ("Targeting", 16), 1217: ("Scanning", 16),
          1220: ("Neural Enhancement", 16), 1241: ("Planet Management", 16)}
# name -> (fallback id, group, rank, primary + secondary attribute)
SKILLS = {
    "Gunnery": (3300, 255, 1, "pw"), "Small Hybrid Turret": (3301, 255, 1, "pw"), "Small Projectile Turret": (3302, 255, 1, "pw"),
    "Small Energy Turret": (3303, 255, 1, "pw"), "Medium Hybrid Turret": (3304, 255, 3, "pw"),
    "Medium Projectile Turret": (3305, 255, 3, "pw"), "Medium Energy Turret": (3306, 255, 3, "pw"),
    "Large Hybrid Turret": (3307, 255, 5, "pw"), "Large Projectile Turret": (3308, 255, 5, "pw"),
    "Large Energy Turret": (3309, 255, 5, "pw"), "Rapid Firing": (3310, 255, 2, "pw"), "Sharpshooter": (3311, 255, 2, "pw"),
    "Motion Prediction": (3312, 255, 2, "pw"), "Surgical Strike": (3315, 255, 4, "pw"), "Controlled Bursts": (3316, 255, 2, "pw"),
    "Trajectory Analysis": (3317, 255, 5, "pw"),
    "Missile Launcher Operation": (3319, 256, 1, "pw"), "Rockets": (3320, 256, 1, "pw"), "Light Missiles": (3321, 256, 2, "pw"),
    "Heavy Missiles": (3324, 256, 3, "pw"), "Torpedoes": (3325, 256, 4, "pw"), "Cruise Missiles": (3326, 256, 5, "pw"),
    "Spaceship Command": (3327, 257, 1, "pw"), "Gallente Frigate": (3328, 257, 2, "pw"), "Minmatar Frigate": (3329, 257, 2, "pw"),
    "Caldari Frigate": (3330, 257, 2, "pw"), "Amarr Frigate": (3331, 257, 2, "pw"), "Gallente Cruiser": (3332, 257, 5, "pw"),
    "Minmatar Cruiser": (3333, 257, 5, "pw"), "Caldari Cruiser": (3334, 257, 5, "pw"), "Amarr Cruiser": (3335, 257, 5, "pw"),
    "Gallente Battleship": (3336, 257, 8, "pw"), "Minmatar Battleship": (3337, 257, 8, "pw"),
    "Caldari Battleship": (3338, 257, 8, "pw"), "Amarr Battleship": (3339, 257, 8, "pw"),
    "Minmatar Industrial": (3341, 257, 4, "pw"), "Mining Barge": (17940, 257, 4, "pw"), "Exhumers": (22551, 257, 5, "pw"),
    "Logistics Cruisers": (12096, 257, 6, "pw"), "Advanced Spaceship Command": (20342, 257, 5, "pw"),
    "Capital Ships": (20533, 257, 14, "pw"), "Amarr Carrier": (24311, 257, 14, "pw"), "Gallente Carrier": (24313, 257, 14, "pw"),
    "Amarr Dreadnought": (20525, 257, 12, "pw"), "Minmatar Dreadnought": (20532, 257, 12, "pw"),
    "Navigation": (3449, 275, 1, "ip"), "Afterburner": (3450, 275, 1, "ip"), "Fuel Conservation": (3451, 275, 2, "ip"),
    "Acceleration Control": (3452, 275, 4, "ip"), "Evasive Maneuvering": (3453, 275, 2, "ip"),
    "High Speed Maneuvering": (3454, 275, 2, "ip"), "Warp Drive Operation": (3455, 275, 1, "ip"),
    "Jump Drive Operation": (3456, 275, 5, "ip"), "Jump Drive Calibration": (21611, 275, 9, "ip"),
    "Jump Fuel Conservation": (21610, 275, 8, "ip"),
    "Power Grid Management": (3413, 1216, 1, "im"), "Capacitor Systems Operation": (3417, 1216, 1, "im"),
    "Capacitor Management": (3418, 1216, 3, "im"), "CPU Management": (3426, 1216, 1, "im"),
    "Energy Grid Upgrades": (3424, 1216, 2, "im"), "Weapon Upgrades": (3318, 1216, 2, "im"),
    "Advanced Weapon Upgrades": (11207, 1216, 6, "im"), "Thermodynamics": (28164, 1216, 3, "im"),
    "Shield Operation": (3416, 1209, 1, "im"), "Shield Management": (3419, 1209, 3, "im"),
    "Tactical Shield Manipulation": (3420, 1209, 4, "im"), "Shield Upgrades": (3425, 1209, 2, "im"),
    "Shield Emission Systems": (3422, 1209, 2, "im"), "Capacitor Emission Systems": (3423, 1216, 2, "im"),
    "Mechanics": (3392, 1210, 1, "im"), "Repair Systems": (3393, 1210, 1, "im"), "Hull Upgrades": (3394, 1210, 2, "im"),
    "Remote Armor Repair Systems": (16069, 1210, 2, "im"),
    "Drones": (3436, 273, 1, "mp"), "Drone Avionics": (3437, 273, 1, "mp"), "Light Drone Operation": (24241, 273, 1, "mp"),
    "Medium Drone Operation": (33699, 273, 2, "mp"), "Heavy Drone Operation": (3441, 273, 5, "mp"),
    "Drone Interfacing": (3442, 273, 5, "mp"), "Drone Navigation": (12305, 273, 1, "mp"), "Drone Sharpshooting": (23606, 273, 1, "mp"),
    "Electronic Warfare": (3427, 272, 2, "im"), "Propulsion Jamming": (3435, 272, 2, "im"), "Cloaking": (11579, 272, 6, "im"),
    "Long Range Targeting": (3428, 1213, 2, "im"), "Target Management": (3429, 1213, 1, "im"),
    "Signature Analysis": (3431, 1213, 1, "im"),
    "Leadership": (3348, 258, 1, "cw"), "Wing Command": (11574, 258, 8, "cw"), "Fleet Command": (24764, 258, 12, "cw"),
    "Armored Command": (20494, 258, 2, "cw"), "Shield Command": (3350, 258, 2, "cw"), "Skirmish Command": (3349, 258, 2, "cw"),
    "Information Command": (3352, 258, 2, "cw"), "Mining Foreman": (22536, 258, 2, "cw"),
    "Industry": (3380, 268, 1, "mi"), "Mass Production": (3387, 268, 2, "mi"), "Advanced Industry": (3388, 268, 3, "mi"),
    "Supply Chain Management": (24268, 268, 3, "mi"), "Advanced Mass Production": (24625, 268, 8, "mi"),
    "Mining": (3386, 1218, 1, "mi"), "Astrogeology": (3410, 1218, 3, "mi"), "Mining Upgrades": (22578, 1218, 4, "mi"),
    "Reprocessing": (3385, 1218, 1, "mi"), "Reprocessing Efficiency": (3389, 1218, 3, "mi"), "Ice Harvesting": (16281, 1218, 2, "mi"),
    "Science": (3402, 270, 1, "im"), "Research": (3403, 270, 1, "im"), "Laboratory Operation": (3406, 270, 1, "im"),
    "Metallurgy": (3409, 270, 3, "im"), "Advanced Laboratory Operation": (24624, 270, 8, "im"),
    "Cybernetics": (3411, 1220, 3, "im"), "Infomorph Psychology": (24242, 1220, 1, "cw"), "Biology": (3405, 1220, 1, "im"),
    "Trade": (3443, 274, 1, "cm"), "Retail": (3444, 274, 2, "cm"), "Broker Relations": (3446, 274, 2, "cm"),
    "Accounting": (16622, 274, 3, "cm"), "Marketing": (16598, 274, 3, "cm"), "Daytrading": (16595, 274, 1, "cm"),
    "Wholesale": (16596, 274, 4, "cm"),
    "Social": (3355, 278, 1, "ci"), "Negotiation": (3356, 278, 2, "ci"), "Connections": (3359, 278, 3, "ci"),
    "Planetology": (2406, 1241, 3, "ci"), "Command Center Upgrades": (2505, 1241, 4, "ci"),
    "Interplanetary Consolidation": (2495, 1241, 4, "ci"),
    "Astrometrics": (3412, 1217, 3, "im"), "Archaeology": (13278, 1217, 3, "im"),
    "Jury Rigging": (26252, 269, 2, "im"), "Armor Rigging": (26253, 269, 3, "im"), "Shield Rigging": (26261, 269, 3, "im"),
}


def _profile(text):
    """``"Gunnery 5, Rapid Firing 4"`` -> {"Gunnery": 5, "Rapid Firing": 4}."""
    out = {}
    for part in text.split(","):
        name, level = part.strip().rsplit(" ", 1)
        out[name] = int(level)
    return out


CORE = _profile(
    "Spaceship Command 5, Navigation 4, Afterburner 4, Evasive Maneuvering 4, Warp Drive Operation 5, Acceleration Control 3, "
    "High Speed Maneuvering 4, Fuel Conservation 2, Power Grid Management 5, CPU Management 5, Capacitor Systems Operation 4, "
    "Capacitor Management 4, Energy Grid Upgrades 4, Weapon Upgrades 4, Thermodynamics 3, Mechanics 4, Hull Upgrades 4, "
    "Repair Systems 4, Shield Operation 4, Shield Management 4, Shield Upgrades 4, Tactical Shield Manipulation 3, "
    "Long Range Targeting 4, Signature Analysis 4, Target Management 4, Drones 5, Light Drone Operation 4, Drone Avionics 3, "
    "Science 4, Cybernetics 4, Infomorph Psychology 3, Biology 3, Social 3, Trade 3, Astrometrics 3, Jury Rigging 3, "
    "Electronic Warfare 2, Propulsion Jamming 4"
)
PROFILES = {
    "minmatar": "Minmatar Frigate 5, Minmatar Cruiser 5, Minmatar Battleship 4, Gunnery 5, Small Projectile Turret 5, "
                "Medium Projectile Turret 5, Large Projectile Turret 4, Rapid Firing 4, Sharpshooter 4, Motion Prediction 4, "
                "Surgical Strike 4, Controlled Bursts 3, Trajectory Analysis 3, Shield Rigging 3",
    "caldari": "Caldari Frigate 4, Caldari Cruiser 5, Caldari Battleship 4, Missile Launcher Operation 5, Rockets 4, "
               "Light Missiles 4, Heavy Missiles 5, Cruise Missiles 4, Torpedoes 3, Shield Rigging 4",
    "gallente": "Gallente Frigate 4, Gallente Cruiser 5, Gallente Battleship 4, Gunnery 5, Small Hybrid Turret 5, "
                "Medium Hybrid Turret 4, Large Hybrid Turret 4, Rapid Firing 4, Sharpshooter 3, Motion Prediction 3, "
                "Surgical Strike 4, Medium Drone Operation 5, Heavy Drone Operation 4, Drone Interfacing 4, Drone Navigation 4, "
                "Drone Sharpshooting 4, Armor Rigging 3, Remote Armor Repair Systems 3",
    "amarr": "Amarr Frigate 4, Amarr Cruiser 4, Amarr Battleship 5, Gunnery 5, Small Energy Turret 5, Medium Energy Turret 4, "
             "Large Energy Turret 5, Rapid Firing 4, Sharpshooter 4, Motion Prediction 3, Surgical Strike 4, Controlled Bursts 4, "
             "Armor Rigging 4, Remote Armor Repair Systems 4",
    "industry": "Industry 5, Mass Production 5, Advanced Industry 4, Supply Chain Management 4, Advanced Mass Production 3, "
                "Mining 5, Astrogeology 5, Mining Upgrades 4, Reprocessing 5, Reprocessing Efficiency 4, Ice Harvesting 3, "
                "Mining Barge 5, Exhumers 4, Mining Foreman 5, Metallurgy 4, Research 4, Laboratory Operation 4, "
                "Advanced Laboratory Operation 3, Minmatar Industrial 4, Planetology 3, Command Center Upgrades 4, "
                "Interplanetary Consolidation 4",
    "trade": "Trade 5, Retail 5, Broker Relations 5, Accounting 5, Marketing 4, Daytrading 4, Wholesale 3, Negotiation 4, Connections 3",
    "leadership": "Leadership 5, Wing Command 4, Fleet Command 3, Armored Command 4, Shield Command 4, Skirmish Command 3, "
                  "Information Command 3",
    "logistics": "Logistics Cruisers 4, Shield Emission Systems 5, Capacitor Emission Systems 4, Remote Armor Repair Systems 4, "
                 "Caldari Cruiser 5, Amarr Cruiser 5",
    "covert": "Cloaking 4, Electronic Warfare 4, Archaeology 4, Astrometrics 4",
    "capital": "Advanced Spaceship Command 5, Jump Drive Operation 5, Jump Drive Calibration 4, Jump Fuel Conservation 4",
}
PROFILES = {k: _profile(v) for k, v in PROFILES.items()}
CARRIERS = ("Amarr Carrier", "Gallente Carrier")
DREADS = ("Amarr Dreadnought", "Minmatar Dreadnought")


def seed(demo):
    ids = named_types({n: v[:2] for n, v in SKILLS.items()}, GROUPS)
    SkillInfo.objects.bulk_create(
        [SkillInfo(type_id=ids[n], rank=r, primary_attribute=ATTRS[a[0]], secondary_attribute=ATTRS[a[1]])
         for n, (_, _, r, a) in SKILLS.items() if n in ids],
        ignore_conflicts=True,
    )
    info = {s.type_id: s for s in SkillInfo.objects.filter(type_id__in=ids.values())}
    # Where the static data has more skills, sprinkle some of those in too.
    extra = [t for t in demo.type_ids(category=16, limit=120) if t not in set(ids.values())]
    info.update({s.type_id: s for s in SkillInfo.objects.filter(type_id__in=extra)})

    members = [u for u in demo.users if u.state_id == demo.states["member"].pk and u.pk != demo.admin.pk]
    capital_users = {demo.admin.pk, *(u.pk for u in demo.sample(members, 5))}

    summaries, skills, queue = [], [], []
    for c in demo.characters:
        is_admin = c.user_id == demo.admin.pk
        is_main = c.pk == c.user.main_character_id
        if is_admin and is_main:
            wanted, skill, extras = _admin_targets(), 1.0, extra
        else:
            races = demo.sample(("minmatar", "caldari", "gallente", "amarr"), demo.rng.randint(1, 2))
            others = demo.sample(("industry", "trade", "leadership", "logistics", "covert"), demo.rng.randint(0, 2))
            if is_admin:
                races, others = ["caldari"], ["industry" if c.pk % 2 else "trade"]
            wanted = dict(CORE)
            for p in (*races, *others):
                for name, level in PROFILES[p].items():
                    wanted[name] = max(wanted.get(name, 0), level)
            if c.user_id in capital_users and is_main:
                wanted.update(PROFILES["capital"])
                wanted |= {"Capital Ships": demo.rng.randint(1, 4), demo.pick(CARRIERS): 3, demo.pick(DREADS): 2}
                skill = demo.rng.uniform(0.75, 0.95)
            elif is_admin:
                skill = 0.85
            else:
                # How far along they are: mains of older accounts further than fresh alts.
                skill = demo.rng.uniform(0.45, 0.9) if is_main else demo.rng.uniform(0.2, 0.7)
            extras = demo.sample(extra, int(len(extra) * skill * 0.3))

        levels = {}
        for name, target in wanted.items():
            if name not in ids:
                continue
            if demo.chance(skill):
                levels[ids[name]] = target
            elif demo.chance(skill + 0.3):
                levels[ids[name]] = max(1, target - demo.rng.randint(1, 2))
        if is_main and c.user_id in capital_users and "Capital Ships" in ids:
            levels.setdefault(ids["Capital Ships"], wanted["Capital Ships"])
        for sid in extras:
            levels[sid] = demo.rng.choices([1, 2, 3, 4, 5], weights=[2, 3, 4, 3, 1])[0]
        levels = {sid: lvl for sid, lvl in levels.items() if sid in info}

        attrs = _attributes(demo, is_admin and is_main)
        sps = {sid: sp_for_level(info[sid].rank, lvl) for sid, lvl in levels.items()}
        length = (9 if is_main else 3) if is_admin else demo.rng.choice((0, 0, 1, 2, 3, 5))
        plan = _queue(demo, c, levels, info, attrs, length)
        if plan:
            # The skill in training has part of the next level already.
            first, si = plan[0], info[plan[0].skill_id]
            done = (demo.now - first.start_date).total_seconds() / 60 * sp_per_minute(attrs, si.primary_attribute, si.secondary_attribute)
            sps[first.skill_id] = min(first.level_end_sp - 1, first.training_start_sp + int(done))
        queue += plan
        skills += [CharacterSkill(character=c, skill_id=sid, active_level=lvl, trained_level=lvl, skillpoints=sps[sid])
                   for sid, lvl in levels.items()]
        remapped = demo.recent(500)
        summaries.append(SkillSummary(
            character=c, total_sp=sum(sps.values()), unallocated_sp=demo.pick((0, 0, 0, 0, 125_000, 500_000)) if not is_admin else 250_000,
            bonus_remaps=demo.rng.choice((0, 0, 1, 2)), last_remap_date=remapped,
            remap_available_date=remapped + timedelta(days=365), **attrs,
        ))

    SkillSummary.objects.bulk_create(summaries)
    CharacterSkill.objects.bulk_create(skills, batch_size=2000)
    SkillQueueItem.objects.bulk_create(queue, batch_size=2000)

    # The Capital Pilots group is kept up to date by its rule: exactly the accounts with Capital Ships.
    if "Capital Pilots" in demo.groups:
        demo.groups["Capital Pilots"].user_set.set([u for u in demo.users if u.pk in capital_users])


def _admin_targets():
    wanted = dict(CORE)
    for p, profile in PROFILES.items():
        for name, level in profile.items():
            wanted[name] = max(wanted.get(name, 0), level if p != "capital" else 5)
    # A veteran: the basics at V, capitals and command well along.
    wanted.update({n: 5 for n in CORE})
    wanted |= {"Capital Ships": 4, "Amarr Carrier": 4, "Amarr Dreadnought": 3, "Gallente Carrier": 2, "Fleet Command": 3,
               "Wing Command": 4, "Jump Drive Calibration": 4, "Cloaking": 4}
    return wanted


def _attributes(demo, admin):
    """Remapped for perception/willpower, or left alone, plus implants."""
    if admin:
        return {"perception": 32, "willpower": 26, "intelligence": 22, "memory": 22, "charisma": 22}
    base = demo.pick(({"perception": 27, "willpower": 21, "intelligence": 17, "memory": 17, "charisma": 17},
                      {"perception": 17, "willpower": 17, "intelligence": 27, "memory": 21, "charisma": 17},
                      {"perception": 20, "willpower": 20, "intelligence": 20, "memory": 20, "charisma": 19}))
    bonus = demo.pick((0, 0, 3, 4, 5))
    return {a: v + bonus for a, v in base.items()}


def _queue(demo, character, levels, info, attrs, length):
    """The next ``length`` levels of skills the character has started, back to back, the first one under way."""
    candidates = [sid for sid, lvl in levels.items() if lvl < 5]
    rows, start, planned = [], None, {}
    for position, sid in enumerate(demo.sample(candidates, length)):
        si = info[sid]
        level = planned.get(sid, levels[sid]) + 1
        planned[sid] = level
        lo, hi = sp_for_level(si.rank, level - 1), sp_for_level(si.rank, level)
        minutes = (hi - lo) / sp_per_minute(attrs, si.primary_attribute, si.secondary_attribute)
        if start is None:
            start = demo.now - timedelta(minutes=minutes * demo.rng.uniform(0.05, 0.9))
        finish = start + timedelta(minutes=minutes)
        rows.append(SkillQueueItem(character=character, position=position, skill_id=sid, finished_level=level, start_date=start,
                                   finish_date=finish, training_start_sp=lo, level_start_sp=lo, level_end_sp=hi))
        start = finish
    return rows
