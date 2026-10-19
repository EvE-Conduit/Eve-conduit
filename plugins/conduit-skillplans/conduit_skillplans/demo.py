"""Example data for demo mode (Plugin.demo_data): shared doctrine, industry and new player plans, and a couple of
personal ones. Only skills the static data (or the demo's fallback catalog) knows are used."""

from datetime import timedelta

from conduit.sde.models import ItemType
from conduit.sheet.skills import training

from .models import SkillPlan

# name, category, description, wanted [(skill id, level)]
PLANS = (
    ("New Pilot Essentials", "New players",
     "The first month: fitting, moving around and staying alive. Train this before anything else.",
     [(3413, 4), (3426, 4), (3449, 3), (3450, 3), (3455, 3), (3392, 3), (3416, 3), (3436, 3), (3300, 3)]),
    ("Mainline Doctrine", "Doctrines",
     "What you need to fly the mainline shield cruisers and battlecruisers on alliance fleets.",
     [(3334, 4), (3330, 4), (3304, 4), (3300, 4), (3310, 3), (3311, 3), (3416, 4), (3419, 3), (3425, 3), (3413, 5), (3426, 4)]),
    ("Logistics Wing", "Doctrines",
     "Basilisk and Guardian pilots. Capacitor and fitting skills matter more than anything here.",
     [(3334, 5), (3335, 4), (3413, 5), (3426, 5), (3416, 4), (3392, 4), (3449, 4)]),
    ("Armor Battleships", "Doctrines",
     "Megathron and Apocalypse for structure bashes and big fights.",
     [(3336, 4), (3339, 3), (3307, 4), (3309, 3), (3393, 4), (3394, 4), (3392, 4), (3318, 4)]),
    ("Capital Pilot", "Doctrines",
     "Carriers and dreadnoughts. Talk to a director before you start: it's a long road.",
     [(3338, 5), (3336, 5), (20533, 3), (3413, 5), (3426, 5), (3392, 5), (3348, 4)]),
    ("Mining Fleet Basics", "Industry",
     "Barges, boosts and refining. Bring a Procurer to the Tuesday mining fleet.",
     [(3386, 4), (3380, 3), (3402, 3), (22536, 2), (3348, 2), (3413, 3)]),
    ("Trader Starter", "Industry",
     "More market orders and lower fees for anyone selling at the Keepstar market.",
     [(3443, 4), (3355, 3), (3402, 2)]),
)
PERSONAL = (
    ("My Tengu goals", "", "Long-term plan for strategic cruisers.", [(3334, 5), (3319, 4), (3416, 5), (3419, 4)]),
    ("Alt: hauler", "", "What the hauling alt still needs.", [(3449, 4), (3455, 4), (3392, 3)]),
    ("Drone skills", "", "", [(3436, 5), (3442, 3), (3332, 4)]),
)


def _steps(wanted, known):
    wanted = [(s, lvl) for s, lvl in wanted if s in known]
    info = training.skill_info(s for s, _ in wanted)
    # With the full static data, prerequisites are filled in; without it the steps are just the levels.
    return [[s, lvl] for s, lvl in training.plan(wanted, info) if s in known or s in info]


def seed(demo):
    wanted_ids = {s for *_, skills in PLANS + PERSONAL for s, _ in skills}
    known = set(ItemType.objects.filter(pk__in=wanted_ids).values_list("pk", flat=True))
    managers = [demo.admin, *demo.sample(demo.users[1:10], 2)]
    plans, stamps = [], []
    for name, category, description, wanted in PLANS:
        by = demo.pick(managers)
        plans.append(SkillPlan(name=name, category=category, description=description, skills=_steps(wanted, known),
                               shared=True, created_by=by))
        stamps.append(demo.ago(days=demo.rng.uniform(20, 300)))
    owners = [demo.admin, demo.admin, demo.pick(demo.users[1:])]
    for (name, category, description, wanted), owner in zip(PERSONAL, owners):
        plans.append(SkillPlan(name=name, category=category, description=description, skills=_steps(wanted, known),
                               owner=owner, created_by=owner))
        stamps.append(demo.ago(days=demo.rng.uniform(5, 120)))
    plans = SkillPlan.objects.bulk_create(plans)
    for plan, created in zip(plans, stamps):
        updated = created + timedelta(days=demo.rng.uniform(0, (demo.now - created).days))
        SkillPlan.objects.filter(pk=plan.pk).update(created_at=created, updated_at=updated)
