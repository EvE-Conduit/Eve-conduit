"""Example data for demo mode (Plugin.demo_data): a board of upcoming structure, sovereignty and moon timers, a few
that just came out, and who's going."""

from datetime import timedelta

from .models import Timer, TimerSettings
from .services import STRUCTURE_TYPES

HOSTILES = ("Obsidian Reach", "Crimson Tide Syndicate", "Black Lantern Collective", "Ironclad Assembly")
NOTES = (
    "Form 45 minutes before in staging. Mainline doctrine.",
    "Defensive timer, all hands. Logi especially.",
    "Hostiles have been reshipping into dreads, expect a capital escalation.",
    "Small gang should be enough, they don't defend this one.",
    "",
    "",
)


def seed(demo):
    TimerSettings.objects.update_or_create(pk=1, defaults={"notifications_seen_until": demo.ago(minutes=5)})
    systems = demo.system_ids()
    ours = demo.alliance.name if demo.alliance else "Our alliance"
    managers = [demo.admin, *demo.sample(demo.users[1:12], 2)]

    # name, structure type, system (or None for a random one), kind, side, hours from now, important, source
    rows = [
        (demo.structures[0]["name"] if demo.structures else "Perimeter - Aurora Forge", "Raitaru",
         demo.structures[0]["system_id"] if demo.structures else None, "armor", "friendly", 5.5, True, "structure"),
        ("Hek - Obsidian Market", "Fortizar", 30002053, "hull", "hostile", 22, True, "manual"),
        ("Rens - Lantern Tower", "Astrahus", 30002510, "armor", "hostile", 30, False, "notification"),
        ("Dodixie - Sunset Refinery", "Athanor", 30002659, "moon", "friendly", 41, False, "manual"),
        ("Amarr - Ironclad Spire", "Astrahus", 30002187, "anchoring", "hostile", 52, False, "notification"),
        ("Perimeter Customs Office", "Customs Office", 30000144, "other", "neutral", 70, False, "manual"),
        ("Hek Infrastructure Hub", "Infrastructure Hub", 30002053, "sov", "friendly", 96, True, "manual"),
        ("Jita - Starfall Lookout", "Astrahus", 30000142, "unanchoring", "friendly", 130, False, "structure"),
        # Just came out, and the history below it
        ("Rens - Blackwater Depot", "Raitaru", 30002510, "hull", "hostile", -0.4, False, "manual"),
        ("Hek - Crimson Watch", "Astrahus", 30002053, "armor", "hostile", -26, False, "notification"),
        ("Dodixie - Aurora Moon Drill", "Athanor", 30002659, "moon", "friendly", -50, False, "structure"),
        ("Amarr - Obsidian Bastion", "Fortizar", 30002187, "hull", "hostile", -120, True, "manual"),
        ("Perimeter - Northern Relay", "Azbel", 30000144, "armor", "friendly", -200, False, "structure"),
    ]
    timers = []
    for name, structure_type, system_id, kind, side, hours, important, source in rows:
        owner = ours if side == "friendly" else demo.pick(HOSTILES) if side == "hostile" else "Interbus"
        by = demo.pick(managers) if source == "manual" else None
        timers.append(Timer(
            name=name, structure_type=structure_type, type_id=STRUCTURE_TYPES.get(structure_type),
            system_id=system_id if system_id in systems else demo.pick(systems), kind=kind, side=side, owner=owner,
            ends_at=demo.ahead(hours=hours + demo.rng.uniform(-0.3, 0.3)), notes=demo.pick(NOTES), important=important,
            source=source, structure_id=demo.next_id() if source != "manual" else None,
            reminded=[60, 15] if hours < 0 else [60] if hours < 1 else [], created_by=by, updated_by=by,
        ))
    timers = Timer.objects.bulk_create(timers)

    members = [u for u in demo.users if u.state_id == demo.states["member"].pk]
    going = []
    for t in timers:
        count = demo.rng.randint(12, len(members)) if t.important else demo.rng.randint(0, 9)
        people = demo.sample(members, count)
        if demo.admin in members and demo.chance(0.5) and demo.admin not in people:
            people.append(demo.admin)
        going += [Timer.going.through(timer_id=t.pk, user_id=u.pk) for u in people]
    Timer.going.through.objects.bulk_create(going)

    for t in timers:
        created = min(t.ends_at, demo.now) - timedelta(hours=demo.rng.uniform(2, 72))
        Timer.objects.filter(pk=t.pk).update(created_at=created, updated_at=created)
