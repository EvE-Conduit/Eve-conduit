"""Example mentoring for demo mode (see conduit.demo.seed): the Recruiters (and the demo account) mentor, with
profiles, goals, a waiting list, active mentees with their threads and private notes, and past graduates.

The mentor permission goes to the Recruiters group, so mentors are found the way they are on a real site."""

from datetime import timedelta

from django.contrib.auth.models import Permission

from conduit.access import rules

from .models import Goal, GoalCheck, MentorProfile, Mentorship, Message, Program

BIOS = (
    ("Flying since the Dominion days. Happy to explain fleets, fitting and how not to die to gate camps.", "EU evenings", ["PvP", "Fleet doctrine"]),
    ("Industrialist and part-time hauler. I'll get you mining, building and selling within a week.", "US weekends",
     ["Industry", "Mining", "Trading"]),
    ("Explorer and wormhole diver. Ask me about scanning, hacking and living out of a Tengu.", "EU mornings", ["Exploration", "Wormholes"]),
    ("Logi main. If you want green boxes in fleet, I'm your mentor.", "AU/US late", ["Logistics", "PvE"]),
    ("I run the Sunday roams. Small gang, frigates, learning by dying.", "EU weekends", ["PvP"]),
)
# What new members write when they ask, and the focus areas they tick.
NOTES = (
    ("Hi! I'm new to null sec and would like help getting set up for fleets.", ["PvP", "Fleet doctrine"]),
    ("Mostly into mining and building for now. Not sure where to start with industry.", ["Mining", "Industry"]),
    ("Came back after five years away. Everything has changed!", ["PvP", "PvE"]),
    ("Want to try exploration and maybe wormholes later on.", ["Exploration", "Wormholes"]),
    ("", ["Logistics"]),
    ("Would like to learn the market and hauling.", ["Trading", "Industry"]),
)
THREAD = (
    ("mentor", "Welcome aboard! When are you usually on? We can do a quick comms check tonight."),
    ("mentee", "Evenings EU time mostly. Tonight works!"),
    ("mentor", "Great. First things first: move your stuff to Perimeter and set your clone at the Keepstar."),
    ("mentee", "Done. Which doctrine should I train for first?"),
    ("mentor", "The Drake Fleet. Cheap, forgiving, and we fly it every week. The fit is on the Doctrines page."),
    ("note", "Learning quickly. Good candidate for the Logistics Wing later."),
    ("mentee", "Flew my first CTA yesterday, that was amazing."),
)


def _goals():
    rows = [
        ("Meet your mentor on comms", "Say hello on voice comms and agree when you usually play.", {}, False, []),
        ("Set your home station and medical clone", "Move to Perimeter and set your medical clone at the Keepstar.", {}, True, []),
        ("Read the doctrine page", "Pick the doctrine you'll train for and save its fit in game.", {}, True, []),
        ("Reach 5 million skill points", "Keep your skill queue running. It ticks itself.",
         {"rules": [{"type": "total_sp", "params": {"sp": 5_000_000, "scope": "main"}}]}, False, []),
        ("Train Spaceship Command III", "The base for every ship you'll fly with us.",
         {"rules": [{"type": "skill", "params": {"skill": 3327, "level": 3, "scope": "main"}}]}, False, []),
        ("Mine with the Orca fleet", "Join a mining op and get boosted. Ask in the Industrialists channel.", {}, False, ["Mining", "Industry"]),
        ("Run your first scan site", "Find and run a relic or data site with your mentor.", {}, True, ["Exploration", "Wormholes"]),
    ]
    if "fleets_attended" in rules.RULE_TYPES:
        rows.insert(3, ("Fly in your first fleet", "Join a fleet with the corporation. It ticks itself once you have a FAT.",
                        {"rules": [{"type": "fleets_attended", "params": {"count": 1, "days": 30}}]}, False, []))
    return [Goal(order=i, title=t, description=d, rules=rules.validate_ruleset(r) if r else {}, mentee_can_tick=tick, focus=focus)
            for i, (t, d, r, tick, focus) in enumerate(rows)]


def seed(demo):
    Program.objects.create(pk=1, seeded=True)  # our own goals below instead of the default ones
    goals = Goal.objects.bulk_create(_goals())

    recruiters = demo.groups["Recruiters"]
    recruiters.permissions.add(Permission.objects.get(content_type__app_label="mentors", codename="mentor"))
    mentors = [demo.admin] + [u for u in recruiters.user_set.all() if u.pk != demo.admin.pk]
    MentorProfile.objects.bulk_create([
        MentorProfile(user=u, bio=bio, play_time=play_time, focus=focus, capacity=demo.pick((2, 3, 3, 4)), active=n != 3)
        for n, (u, (bio, play_time, focus)) in enumerate(zip(mentors, BIOS * 3))
    ])

    # The newest members are mentees; the demo account itself graduated long ago.
    members = [u for u in demo.users[1:] if u.state_id == demo.states["member"].pk and u not in mentors]
    newest = sorted(members, key=lambda u: u.date_joined, reverse=True)
    plan = [(u, "waiting") for u in newest[:3]] + [(u, "active") for u in newest[3:9]] + [(u, "graduated") for u in newest[9:14]]
    plan += [(newest[14], "ended")] if len(newest) > 14 else []
    plan.append((demo.admin, "graduated"))

    ships, created = [], []
    for n, (mentee, status) in enumerate(plan):
        note, focus = demo.pick(NOTES)
        start = demo.ago(days=demo.rng.uniform(0.2, 4)) if status == "waiting" else (
            demo.ago(days=demo.rng.uniform(5, 40)) if status == "active" else demo.ago(days=demo.rng.uniform(60, 300)))
        mentor = None if status == "waiting" else (demo.admin if status == "active" and n % 3 == 0 else demo.pick(mentors[1:] or mentors))
        if mentee is demo.admin:
            mentor = demo.pick(mentors[1:] or mentors)
        assigned = start + timedelta(hours=demo.rng.uniform(2, 60)) if mentor else None
        ended = assigned + timedelta(days=demo.rng.uniform(14, 45)) if status in ("graduated", "ended") else None
        ships.append(Mentorship(
            mentee=mentee, mentor=mentor, status=status, focus=focus, note=note,
            play_time=demo.pick(("EU evenings", "US evenings", "Weekends", "AU mornings", "")),
            requested_mentor=demo.admin if status == "waiting" and n == 0 else None, assigned_at=assigned, ended_at=ended,
            end_reason={"graduated": "Flies with the fleets every week now. Well done!", "ended": "Left for another alliance."}.get(status, ""),
            ended_by=mentor if ended else None,
        ))
        created.append(start)
    Mentorship.objects.bulk_create(ships)
    for m, when in zip(ships, created):
        m.created_at = when
    Mentorship.objects.bulk_update(ships, ["created_at"])

    messages, times, checks = [], [], []
    manual = [g for g in goals if not g.rules and not g.focus]
    for m in ships:
        messages.append(Message(mentorship=m, author=m.mentee, text="Asked for a mentor", event="requested"))
        times.append(m.created_at)
        if not m.mentor:
            continue
        messages.append(Message(mentorship=m, author=m.mentor, text=f"{m.mentor.display_name} is the mentor now", event="assigned"))
        times.append(m.assigned_at)
        last = m.ended_at or demo.now
        lines = THREAD if m.status != "active" else THREAD[: demo.rng.randint(2, len(THREAD))]
        for i, (who, text) in enumerate(lines, start=1):
            messages.append(Message(mentorship=m, author=m.mentee if who == "mentee" else m.mentor, text=text, private=who == "note"))
            times.append(m.assigned_at + (last - m.assigned_at) * i / (len(lines) + 1))
        if m.ended_at:
            messages.append(Message(mentorship=m, author=m.mentor, text=m.end_reason, event=m.status))
            times.append(m.ended_at)
        done = manual if m.status == "graduated" else manual[: demo.rng.randint(0, len(manual))]
        checks += [GoalCheck(mentorship=m, goal=g, done_by=m.mentee if g.mentee_can_tick else m.mentor) for g in done]
    Message.objects.bulk_create(messages)
    for msg, when in zip(messages, times):
        msg.created_at = when
    Message.objects.bulk_update(messages, ["created_at"])
    GoalCheck.objects.bulk_create(checks)
    for c in checks:
        c.done_at = c.mentorship.assigned_at + timedelta(days=demo.rng.uniform(0.5, 10))
    GoalCheck.objects.bulk_update(checks, ["done_at"])
