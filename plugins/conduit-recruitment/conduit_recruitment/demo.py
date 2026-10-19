"""Example data for demo mode (Plugin.demo_data): a form per corporation, open applications from the guests and blue
pilots (new and in review, with messages and recruiter notes), and the members' own accepted applications from
when they joined, plus a few rejected and withdrawn ones."""

from datetime import timedelta

from .models import Application, Comment, Form, RecruitSettings

BASIC = [
    {"id": "main", "label": "Which character is your main?", "help": "", "kind": "text", "choices": [], "required": True},
    {"id": "tz", "label": "When do you usually play?", "help": "Times in EVE time", "kind": "choice",
     "choices": ["EU (16:00-23:00)", "US (00:00-05:00)", "AU (08:00-14:00)", "All over the place"], "required": True},
    {"id": "about", "label": "Tell us about yourself", "help": "How long you've played, what you enjoy, previous corporations.",
     "kind": "long", "choices": [], "required": True},
    {"id": "voice", "label": "Can you join voice comms during fleets?", "help": "", "kind": "yesno", "choices": [], "required": True},
]
FORMS = (
    ("Aurora Industries", "Our main corporation: industry, mining and the home defence fleet. New players welcome.",
     BASIC + [{"id": "industry", "label": "What do you like to do?", "help": "", "kind": "choice",
               "choices": ["Mining", "Manufacturing", "Hauling", "PvP", "A bit of everything"], "required": False}],
     ("Industrialists",)),
    ("Starfall Vanguard", "The alliance's PvP corporation. You'll need a doctrine ship and to show up for fleets.",
     BASIC + [{"id": "sp", "label": "Roughly how many skill points does your main have?", "help": "", "kind": "text",
               "choices": [], "required": True},
              {"id": "doctrine", "label": "Can you fly the Mainline Doctrine?", "help": "See the skill plan of that name.",
               "kind": "yesno", "choices": [], "required": True},
              {"id": "kb", "label": "Anything we should know about your killboard?", "help": "", "kind": "long", "choices": [],
               "required": False}],
     ("Logistics Wing",)),
    ("Deep Void Logistics", "Hauling and freight for the alliance. Applications are closed until the next freighter round.",
     BASIC, ()),
)
ABOUT = (
    "Playing on and off since 2019, mostly mining and some exploration. Looking for a group that actually talks on comms.",
    "Ex-lowsec pirate, came back after a break. I want to learn fleet fights and maybe fly logi.",
    "New-ish player (four months). I've done the career agents and want to join something bigger than my one-man corp.",
    "I run a small manufacturing setup and would love access to your structures. Happy to help with hauling too.",
    "Friend of a friend in the alliance. I fly logi mostly, Basilisk and Scimitar, and some Ferox.",
    "Returning vet, did nullsec years ago. Have a couple of alts for hauling and scouting.",
)
FROM_APPLICANT = ("Thanks! When is a good time to talk on voice?", "I added my second alt, it was missing earlier.",
                  "Sure, I can do Thursday evening.")
FROM_RECRUITER = ("Hi! Thanks for applying. Can you join voice some evening this week for a quick chat?",
                  "Could you add all your characters, please? We need to see every one.",
                  "Looks good. One of the directors will have a final look.")
NOTES = ("Talked on voice, seems sound. Killboard is clean.", "Alt in a hostile corp until last month, ask about it.",
         "Skills are fine for the mainline doctrine.", "Vouched for by an alliance member.")
REJECT = "Sorry, we're not a good fit right now. Feel free to apply again in a couple of months."


def _answers(demo, form, user):
    out = {}
    for q in form.questions:
        if q["id"] == "main":
            out["main"] = user.main_character.name if user.main_character_id else ""
        elif q["kind"] == "choice":
            out[q["id"]] = demo.pick(q["choices"])
        elif q["kind"] == "yesno":
            out[q["id"]] = demo.chance(0.85)
        elif q["id"] == "about":
            out["about"] = demo.pick(ABOUT)
        elif q["id"] == "sp":
            out["sp"] = f"About {demo.rng.randint(8, 140)} million"
        elif q["id"] == "kb":
            out["kb"] = demo.pick(("Mostly losses from learning PvP, I'm getting better.", "", "Nothing unusual."))
    return out


def seed(demo):
    RecruitSettings.objects.update_or_create(pk=1, defaults={"require_discord": False})
    forms = Form.objects.bulk_create([
        Form(name=name, description=description, questions=questions, open=i < 2, order=i)
        for i, (name, description, questions, _) in enumerate(FORMS)
    ])
    for form, (*_, groups) in zip(forms, FORMS):
        form.accept_groups.add(*[demo.groups[g] for g in groups if g in demo.groups])

    member_state = demo.states["member"].pk
    outsiders = [u for u in demo.users if u.state_id != member_state]
    members = [u for u in demo.users if u.state_id == member_state and u != demo.admin]
    recruiters = [demo.admin, *(demo.groups["Recruiters"].user_set.all()[:3] if "Recruiters" in demo.groups else [])]
    others = [r for r in recruiters if r != demo.admin] or [demo.admin]

    # (user, form, status, days ago, reviewer)
    plan = []
    for i, user in enumerate(outsiders[:6]):
        status = ("new", "review")[i % 2]
        reviewer = (demo.admin if i in (1, 3) else demo.pick(others)) if status == "review" else None
        plan.append((user, demo.pick(forms[:2]), status, demo.rng.uniform(0.2, 9), reviewer))
    plan.append((demo.admin, forms[0], "accepted", 380, demo.pick(others)))
    for user in demo.sample(members, 7):
        plan.append((user, forms[demo.corporations.index(user.main_character.corporation)] if user.main_character.corporation in demo.corporations else forms[0],
                     "accepted", demo.rng.uniform(15, 300), demo.pick(recruiters)))
    for user in outsiders[:2]:  # an earlier try that didn't work out, shown in their history
        plan.append((user, forms[1], demo.pick(("rejected", "withdrawn")), demo.rng.uniform(60, 200), demo.pick(recruiters)))

    apps, stamps = [], []
    for user, form, status, days, reviewer in plan:
        created = demo.ago(days=days)
        decided = created + timedelta(days=demo.rng.uniform(1, 6)) if status not in Application.OPEN else None
        apps.append(Application(user=user, form=form, status=status, answers=_answers(demo, form, user), reviewer=reviewer,
                                decided_at=decided, decided_by=reviewer if status in ("accepted", "rejected") else None))
        stamps.append((created, decided or created + timedelta(hours=demo.rng.uniform(1, 30))))
    apps = Application.objects.bulk_create(apps)

    comments = []  # (comment, when)
    for app, (created, last) in zip(apps, stamps):
        step = lambda h: created + timedelta(hours=h)  # noqa: E731
        if app.reviewer_id and app.status != "withdrawn":
            comments.append((Comment(application=app, author=app.reviewer, text="Took this application", internal=True, event="claimed"), step(3)))
            comments.append((Comment(application=app, author=app.reviewer, text=demo.pick(FROM_RECRUITER)), step(4)))
            if demo.chance(0.8):
                comments.append((Comment(application=app, author=app.user, text=demo.pick(FROM_APPLICANT)), step(9)))
            if demo.chance(0.7):
                comments.append((Comment(application=app, author=app.reviewer, text=demo.pick(NOTES), internal=True), step(20)))
        if app.status == "accepted":
            text = demo.pick(("Welcome aboard! Join the alliance channel and say hi.", "Accepted"))
            comments.append((Comment(application=app, author=app.decided_by, text=text, event="accepted"), app.decided_at))
        elif app.status == "rejected":
            comments.append((Comment(application=app, author=app.decided_by, text=REJECT, event="rejected"), app.decided_at))
        elif app.status == "withdrawn":
            comments.append((Comment(application=app, author=app.user, text="Withdrew the application", event="withdrawn"), last))
    made = Comment.objects.bulk_create([c for c, _ in comments])

    # auto_now(_add) stamped everything with today; put it back where it happened.
    for app, (created, last) in zip(apps, stamps):
        Application.objects.filter(pk=app.pk).update(created_at=created, updated_at=min(last, demo.now))
    for c, (_, when) in zip(made, comments):
        Comment.objects.filter(pk=c.pk).update(created_at=min(when, demo.ago(minutes=5)))
