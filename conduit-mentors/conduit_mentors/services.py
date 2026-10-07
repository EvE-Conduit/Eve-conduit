"""Mentoring: new members ask for a mentor, mentors claim them, goals track how they're getting on.

People with ``mentors.mentor`` keep a mentor profile (active or paused, how many mentees, focus areas) and see the
waiting list. New members ask for a mentor, by name or anyone. While a mentorship is active the mentor and mentee
talk in a thread (mentors can also keep private notes), work through the program's goals and, at the end, the
mentor graduates them. Goals with a group rule set tick themselves; the rest are ticked by hand.
``mentors.manage_program`` runs the program: goals, focus areas, assigning and every mentorship.
"""

from __future__ import annotations

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from conduit.access import rules
from conduit.accounts.models import Character, User
from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm

from .models import Goal, GoalCheck, MentorProfile, Mentorship, Message, Program

MENTOR_PERM = "mentors.mentor"
MANAGE_PERM = "mentors.manage_program"
RULES_PERM = "site.manage_access"
CATEGORY = "p.mentors"


class MentorError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def is_mentor(user) -> bool:
    return user.has_perm(MENTOR_PERM)


def can_manage(user) -> bool:
    return user.has_perm(MANAGE_PERM)


def _link(m: Mentorship) -> str:
    return f"/p/mentors/m/{m.pk}"


def _person(user) -> dict | None:
    if user is None:
        return None
    return {"id": user.pk, "name": user.display_name,
            "portrait": portrait_url(user.main_character_id, 128) if user.main_character_id else None}


# --- character sheet access and group rules --------------------------------------------------------------------


def mentor_can_view(user, character) -> bool:
    """Mentors may read their active mentees' character sheets (Plugin.sheet_access), if the program allows it."""
    return (Program.load().sheet_access
            and Mentorship.objects.filter(mentor=user, mentee_id=character.user_id, status=Mentorship.Status.ACTIVE).exists())


def mentee_status(user) -> str | None:
    """``waiting``, ``active`` or ``graduated`` (the latest that applies), or None."""
    statuses = set(Mentorship.objects.filter(mentee=user).values_list("status", flat=True))
    for s in (Mentorship.Status.ACTIVE, Mentorship.Status.WAITING, Mentorship.Status.GRADUATED):
        if s in statuses:
            return s
    return None


def is_active_mentor(user) -> bool:
    """Holds the mentor permission and hasn't paused (mentors who never saved a profile count as active)."""
    return is_mentor(user) and not MentorProfile.objects.filter(user=user, active=False).exists()


# --- program and goals -------------------------------------------------------------------------------------------


def _seed_goals():
    """The default goals, made the first time anyone looks. Auto goals only for rule types that exist now."""
    default = [
        {"title": "Meet your mentor on comms", "description": "Say hello on voice comms and agree when you usually play."},
        {"title": "Set your home station and medical clone", "description": "Move to our staging system and set your medical clone there.",
         "mentee_can_tick": True},
    ]
    if "fleets_attended" in rules.RULE_TYPES:
        default.append({"title": "Fly in your first fleet", "description": "Join a fleet with the corporation. It ticks itself once you have a FAT.",
                        "rules": {"rules": [{"type": "fleets_attended", "params": {"count": 1, "days": 30}}]}})
    else:
        default.append({"title": "Join a fleet", "description": "Fly in a fleet with the corporation.", "mentee_can_tick": True})
    if "total_sp" in rules.RULE_TYPES:
        default.append({"title": "Reach 5 million skill points", "description": "Keep your skill queue running. It ticks itself.",
                        "rules": {"rules": [{"type": "total_sp", "params": {"sp": 5_000_000, "scope": "main"}}]}})
    for i, g in enumerate(default):
        Goal.objects.create(order=i, title=g["title"], description=g["description"], mentee_can_tick=g.get("mentee_can_tick", False),
                            rules=rules.validate_ruleset(g.get("rules")))


def goals() -> list[Goal]:
    program = Program.load()
    if not program.seeded:
        with transaction.atomic():
            program = Program.objects.select_for_update().get(pk=program.pk)
            if not program.seeded:
                _seed_goals()
                program.seeded = True
                program.save(update_fields=["seeded"])
    return list(Goal.objects.all())


def _clean_rules(raw, old: dict, by) -> dict:
    """Validate a rule set; changing it needs the permission the rule editor needs (it reads the admin API)."""
    try:
        new = rules.validate_ruleset(raw or {})
    except rules.RuleError as exc:
        raise MentorError(str(exc)) from None
    if new != (old or {}) and not by.has_perm(RULES_PERM):
        raise MentorError("Only people who manage access (groups and rules) can change rules", 403)
    return new


def save_goal(goal: Goal | None, data: dict, by, request=None) -> Goal:
    title = str(data.get("title", "")).strip()[:150]
    if not title:
        raise MentorError("Give the goal a title")
    goal = goal or Goal(order=(Goal.objects.order_by("-order").values_list("order", flat=True).first() or 0) + 1)
    goal.rules = _clean_rules(data.get("rules"), goal.rules, by)
    goal.title = title
    goal.description = str(data.get("description", "")).strip()[:2000]
    goal.mentee_can_tick = bool(data.get("mentee_can_tick")) and not goal.rules
    goal.save()
    record("mentors.goal_saved", f"saved the mentoring goal \"{goal.title}\"", request=request, actor=by, target_type="plugin",
           details={"goal_id": goal.pk})
    return goal


def reorder_goals(ids: list[int]):
    for i, pk in enumerate(ids):
        Goal.objects.filter(pk=pk).update(order=i)


def goal_out(g: Goal) -> dict:
    return {"id": g.pk, "title": g.title, "description": g.description, "rules": g.rules, "rules_text": rules.describe_ruleset(g.rules),
            "mentee_can_tick": g.mentee_can_tick, "order": g.order}


def save_program(data: dict, by, request=None) -> Program:
    p = Program.load()
    if "focus_areas" in data:
        areas = []
        for a in data["focus_areas"] or []:
            a = str(a).strip()[:40]
            if a and a.lower() not in {x.lower() for x in areas}:
                areas.append(a)
        if len(areas) > 30:
            raise MentorError("Up to 30 focus areas")
        p.focus_areas = areas
    if "sheet_access" in data:
        p.sheet_access = bool(data["sheet_access"])
    if "suggest_rules" in data:
        p.suggest_rules = _clean_rules(data["suggest_rules"], p.suggest_rules, by)
    p.save()
    record("mentors.settings_saved", "changed the mentoring program settings", request=request, actor=by, target_type="plugin")
    return p


def program_out(p: Program) -> dict:
    return {"focus_areas": p.focus_areas, "sheet_access": p.sheet_access, "suggest_rules": p.suggest_rules,
            "suggest_text": rules.describe_ruleset(p.suggest_rules)}


def suggested(user) -> bool:
    """Invite this member to ask for a mentor: they match the program's new-member rules and never had a mentorship."""
    p = Program.load()
    if not (p.suggest_rules or {}).get("rules"):
        return False
    return not Mentorship.objects.filter(mentee=user).exists() and rules.evaluate_ruleset(user, p.suggest_rules)


# --- mentors ------------------------------------------------------------------------------------------------------


def profile_for(user) -> MentorProfile:
    profile, _ = MentorProfile.objects.get_or_create(user=user)
    return profile


def save_profile(user, data: dict) -> MentorProfile:
    if not is_mentor(user):
        raise MentorError("You aren't a mentor", 403)
    p = profile_for(user)
    p.active = bool(data.get("active", p.active))
    capacity = int(data.get("capacity", p.capacity) or 0)
    if not 1 <= capacity <= 50:
        raise MentorError("Take 1 to 50 mentees")
    p.capacity = capacity
    p.bio = str(data.get("bio", p.bio)).strip()[:2000]
    p.play_time = str(data.get("play_time", p.play_time)).strip()[:100]
    p.focus = _focus(data.get("focus", p.focus))
    p.save()
    return p


def _focus(raw) -> list[str]:
    allowed = {a.lower(): a for a in Program.load().focus_areas}
    return [allowed[str(a).lower()] for a in raw or [] if str(a).lower() in allowed][:30]


def mentor_loads() -> dict[int, int]:
    return dict(Mentorship.objects.filter(status=Mentorship.Status.ACTIVE, mentor__isnull=False)
                .values_list("mentor").annotate(n=Count("id")))


def mentors_out(*, available_only: bool = False, exclude=None) -> list[dict]:
    """Mentors with their load. ``available_only``: active, with free places (what new members pick from)."""
    loads = mentor_loads()
    graduated = dict(Mentorship.objects.filter(status=Mentorship.Status.GRADUATED, mentor__isnull=False)
                     .values_list("mentor").annotate(n=Count("id")))
    out = []
    for u in users_with_perm(MENTOR_PERM):
        if exclude is not None and u.pk == exclude.pk:
            continue
        p = MentorProfile.objects.filter(user=u).first() or MentorProfile(user=u)
        load = loads.get(u.pk, 0)
        if available_only and (not p.active or load >= p.capacity):
            continue
        out.append({**_person(u), "active": p.active, "capacity": p.capacity, "mentees": load, "bio": p.bio,
                    "play_time": p.play_time, "focus": p.focus, "graduated": graduated.get(u.pk, 0)})
    return sorted(out, key=lambda m: (not m["active"], m["name"].lower()))


def profile_out(p: MentorProfile) -> dict:
    return {"active": p.active, "capacity": p.capacity, "bio": p.bio, "play_time": p.play_time, "focus": p.focus,
            "mentees": mentor_loads().get(p.user_id, 0)}


# --- asking, claiming, assigning -----------------------------------------------------------------------------------


def open_mentorship(user) -> Mentorship | None:
    return Mentorship.objects.filter(mentee=user, status__in=Mentorship.OPEN).first()


def _event(m: Mentorship, by, text: str, event: str, private: bool = False):
    Message.objects.create(mentorship=m, author=by, text=text, event=event, private=private)


@transaction.atomic
def request_mentor(user, *, focus=None, note: str = "", play_time: str = "", mentor_id: int | None = None) -> Mentorship:
    if open_mentorship(user):
        raise MentorError("You already have a mentor or are waiting for one")
    wanted = None
    if mentor_id:
        wanted = User.objects.filter(pk=mentor_id).first()
        if wanted is None or wanted.pk == user.pk or not any(m["id"] == wanted.pk for m in mentors_out(available_only=True)):
            raise MentorError("That mentor isn't taking new mentees right now")
    m = Mentorship.objects.create(mentee=user, requested_mentor=wanted, focus=_focus(focus), note=(note or "").strip()[:4000],
                                  play_time=(play_time or "").strip()[:100])
    _event(m, user, "Asked for a mentor", "requested")
    if wanted:
        notify(wanted, f"{user.display_name} asked you to be their mentor", m.note[:300], link=_link(m), category=CATEGORY)
    else:
        mentors = [u for u in users_with_perm(MENTOR_PERM) if u.pk != user.pk and is_active_mentor(u)]
        notify(mentors, f"{user.display_name} is looking for a mentor", ", ".join(m.focus) or m.note[:300], link=_link(m), category=CATEGORY)
    bus.emit("mentors.requested", user_id=user.pk, user=user.display_name, focus=m.focus, mentorship_id=m.pk,
             requested_mentor=wanted.display_name if wanted else None, link=_link(m), title=f"{user.display_name} is looking for a mentor",
             summary=(f"Asked for {wanted.display_name}" if wanted else "Any mentor") + (f" · {', '.join(m.focus)}" if m.focus else ""))
    return m


def withdraw(m: Mentorship, user) -> Mentorship:
    if m.mentee_id != user.pk:
        raise MentorError("Not your request", 403)
    if m.status != Mentorship.Status.WAITING:
        raise MentorError("Only a request still waiting for a mentor can be withdrawn")
    m.status, m.ended_at, m.ended_by, m.end_reason = Mentorship.Status.ENDED, timezone.now(), user, "Withdrawn"
    m.save(update_fields=["status", "ended_at", "ended_by", "end_reason"])
    _event(m, user, "Withdrew the request", "withdrawn")
    return m


@transaction.atomic
def assign(m: Mentorship, mentor, by, request=None) -> Mentorship:
    """Make ``mentor`` the mentor. Mentors claiming for themselves must have a free place; managers may go over."""
    m = Mentorship.objects.select_for_update().get(pk=m.pk)
    if not m.is_open:
        raise MentorError("This mentorship has ended")
    if mentor.pk == m.mentee_id:
        raise MentorError("Nobody can mentor themselves")
    if not is_mentor(mentor):
        raise MentorError(f"{mentor.display_name} isn't a mentor")
    if m.mentor_id == mentor.pk:
        raise MentorError(f"{mentor.display_name} is already the mentor")
    if not can_manage(by):
        profile = profile_for(mentor)
        if not profile.active:
            raise MentorError("Your mentor profile is paused; switch it on to take mentees")
        if mentor_loads().get(mentor.pk, 0) >= profile.capacity:
            raise MentorError(f"You already have {profile.capacity} mentee{'s' if profile.capacity != 1 else ''}, your limit")
    previous = m.mentor
    m.mentor, m.status, m.assigned_at = mentor, Mentorship.Status.ACTIVE, timezone.now()
    m.save(update_fields=["mentor", "status", "assigned_at"])
    who = mentor.display_name
    _event(m, by, f"{who} is the mentor now" + (f" (was {previous.display_name})" if previous else ""), "assigned")
    notify(m.mentee_id, f"{who} is your mentor", "Say hello in your mentoring thread.", link=_link(m), level="success", category=CATEGORY)
    if by.pk != mentor.pk:
        notify(mentor, f"You're now mentoring {m.mentee.display_name}", link=_link(m), category=CATEGORY)
    if previous and previous.pk != by.pk:
        notify(previous, f"{m.mentee.display_name} has a new mentor", f"{by.display_name} handed them to {who}.", link=_link(m), category=CATEGORY)
    bus.emit("mentors.assigned", user_id=m.mentee_id, user=m.mentee.display_name, mentor_id=mentor.pk, mentor=who, mentorship_id=m.pk,
             link=_link(m), title=f"{who} is mentoring {m.mentee.display_name}", level="success",
             summary=f"{m.mentee.display_name} has a mentor: {who}")
    record("mentors.assigned", f"made {who} the mentor of {m.mentee.display_name}", request=request, actor=by, target=m.mentee,
           details={"mentorship_id": m.pk, "mentor_id": mentor.pk})
    return m


# --- the mentorship ------------------------------------------------------------------------------------------------


def role(m: Mentorship, user) -> str | None:
    """How ``user`` sees a mentorship: ``mentee``, ``mentor``, ``manager``, ``candidate`` (a mentor looking at a
    waiting request), or None (not at all)."""
    if can_manage(user) and user.pk != m.mentee_id:
        return "manager"
    if m.mentee_id == user.pk:
        return "mentee"
    if m.mentor_id == user.pk and is_mentor(user):
        return "mentor"
    if m.status == Mentorship.Status.WAITING and is_mentor(user):
        return "candidate"
    return None


def goal_status(m: Mentorship, goal_list: list[Goal] | None = None) -> list[dict]:
    goal_list = goal_list if goal_list is not None else goals()
    checks = {c.goal_id: c for c in m.checks.select_related("done_by")}
    out = []
    for g in goal_list:
        check = checks.get(g.pk)
        auto = bool((g.rules or {}).get("rules"))
        parts = rules.check_ruleset(m.mentee, g.rules) if auto else []
        passed = auto and rules.evaluate_ruleset(m.mentee, g.rules)
        out.append({
            "id": g.pk, "title": g.title, "description": g.description, "auto": auto, "mentee_can_tick": g.mentee_can_tick,
            "rules_text": rules.describe_ruleset(g.rules), "checks": parts,
            "done": bool(passed or check), "by_rules": passed,
            "done_by": check.done_by.display_name if check and check.done_by else None,
            "done_at": check.done_at.isoformat() if check else None,
        })
    return out


def tick(m: Mentorship, goal: Goal, user, done: bool) -> None:
    r = role(m, user)
    if m.status != Mentorship.Status.ACTIVE:
        raise MentorError("Goals can only be ticked while the mentorship is active")
    allowed = r in ("mentor", "manager") or (r == "mentee" and goal.mentee_can_tick and not (goal.rules or {}).get("rules"))
    if not allowed:
        raise MentorError("Your mentor ticks this goal" if r == "mentee" else "You can't tick goals here", 403)
    if done:
        GoalCheck.objects.get_or_create(mentorship=m, goal=goal, defaults={"done_by": user})
    else:
        GoalCheck.objects.filter(mentorship=m, goal=goal).delete()


def message(m: Mentorship, by, text: str, private: bool) -> Message:
    text = (text or "").strip()[:10000]
    if not text:
        raise MentorError("Write something first")
    r = role(m, by)
    if r not in ("mentee", "mentor", "manager"):
        raise MentorError("You aren't part of this mentorship", 403)
    if not m.is_open:
        raise MentorError("This mentorship has ended")
    private = private and r != "mentee"
    msg = Message.objects.create(mentorship=m, author=by, text=text, private=private)
    if r == "mentee":
        target = [m.mentor_id] if m.mentor_id else [u.pk for u in users_with_perm(MANAGE_PERM) if u.pk != by.pk]
        notify(target, f"{by.display_name} wrote to you", text[:300], link=_link(m), category=CATEGORY)
    elif not private:
        notify(m.mentee_id, f"{by.display_name} wrote to you", text[:300], link=_link(m), category=CATEGORY)
    return msg


def _close(m: Mentorship, by, status: str, text: str, event: str):
    m.status, m.ended_at, m.ended_by, m.end_reason = status, timezone.now(), by, text
    m.save(update_fields=["status", "ended_at", "ended_by", "end_reason"])
    _event(m, by, text, event)


@transaction.atomic
def graduate(m: Mentorship, by, text: str = "", request=None) -> Mentorship:
    if role(m, by) not in ("mentor", "manager"):
        raise MentorError("Only the mentor or a program manager can do that", 403)
    if m.status != Mentorship.Status.ACTIVE:
        raise MentorError("Only an active mentorship can graduate")
    text = (text or "").strip()[:2000]
    _close(m, by, Mentorship.Status.GRADUATED, text or "Graduated", "graduated")
    notify(m.mentee_id, "Congratulations, you graduated!", text[:300] or f"From {by.display_name}", link=_link(m), level="success",
           category=CATEGORY, force=True)
    bus.emit("mentors.graduated", user_id=m.mentee_id, user=m.mentee.display_name, mentor=m.mentor.display_name if m.mentor else None,
             mentorship_id=m.pk, link=_link(m), level="success", title=f"{m.mentee.display_name} graduated",
             summary=f"Mentored by {m.mentor.display_name}" if m.mentor else "")
    record("mentors.graduated", f"graduated {m.mentee.display_name}", request=request, actor=by, target=m.mentee, details={"mentorship_id": m.pk})
    return m


def end(m: Mentorship, by, reason: str, request=None) -> Mentorship:
    r = role(m, by)
    if r not in ("mentor", "manager"):
        raise MentorError("Only the mentor or a program manager can do that", 403)
    if not m.is_open:
        raise MentorError("This mentorship has already ended")
    reason = (reason or "").strip()[:2000]
    if not reason:
        raise MentorError("Say why it ends")
    _close(m, by, Mentorship.Status.ENDED, reason, "ended")
    notify(m.mentee_id, "Your mentorship ended", reason[:300], link=_link(m), category=CATEGORY)
    record("mentors.ended", f"ended {m.mentee.display_name}'s mentorship", request=request, actor=by, target=m.mentee,
           details={"mentorship_id": m.pk, "reason": reason})
    return m


# --- what pages show -----------------------------------------------------------------------------------------------


def message_out(msg: Message) -> dict:
    a = msg.author
    return {"id": msg.pk, "author": a.display_name if a else "Someone", "author_id": msg.author_id,
            "portrait": portrait_url(a.main_character_id, 64) if a and a.main_character_id else None,
            "text": msg.text, "private": msg.private, "event": msg.event, "created_at": msg.created_at.isoformat()}


def _iso(dt):
    return dt.isoformat() if dt else None


def brief(m: Mentorship, goal_list: list[Goal] | None = None) -> dict:
    status = goal_status(m, goal_list) if m.status == Mentorship.Status.ACTIVE else []
    return {
        "id": m.pk, "status": m.status, "mentee": _person(m.mentee), "mentor": _person(m.mentor),
        "requested_mentor": _person(m.requested_mentor), "focus": m.focus, "play_time": m.play_time, "note": m.note,
        "created_at": _iso(m.created_at), "assigned_at": _iso(m.assigned_at), "ended_at": _iso(m.ended_at), "end_reason": m.end_reason,
        "progress": {"done": sum(1 for g in status if g["done"]), "total": len(status)} if status else None,
    }


def detail(m: Mentorship, viewer) -> dict:
    r = role(m, viewer)
    staff = r in ("mentor", "manager")
    out = brief(m)
    goal_list = goals()
    out["goals"] = goal_status(m, goal_list)
    out["progress"] = {"done": sum(1 for g in out["goals"] if g["done"]), "total": len(out["goals"])}
    out["role"] = r
    msgs = m.messages.select_related("author")
    out["messages"] = [message_out(x) for x in msgs if staff or not x.private] if r != "candidate" else []
    if m.mentor_id:
        p = MentorProfile.objects.filter(user_id=m.mentor_id).first()
        out["mentor_profile"] = {"bio": p.bio, "play_time": p.play_time, "focus": p.focus} if p else None
    if staff or r == "candidate":
        # Only the mentor gets in through this plugin; managers need the core sheet permissions.
        out["sheet_access"] = Program.load().sheet_access and m.status == Mentorship.Status.ACTIVE and m.mentor_id == viewer.pk
        out["characters"] = characters_out(m.mentee)
    active = m.status == Mentorship.Status.ACTIVE
    out["can"] = {
        "message": m.is_open and r in ("mentee", "mentor", "manager"),
        "private_notes": m.is_open and staff,
        "claim": m.status == Mentorship.Status.WAITING and r in ("candidate", "manager") and is_mentor(viewer),
        "assign": m.is_open and r == "manager",
        "graduate": active and staff,
        "end": m.is_open and staff,
        "withdraw": m.status == Mentorship.Status.WAITING and r == "mentee",
        "tick": active and staff,
    }
    return out


def characters_out(user) -> list[dict]:
    chars = Character.objects.filter(user=user).select_related("corporation", "skill_summary").order_by("name")
    out = []
    for c in chars:
        skills = getattr(c, "skill_summary", None)
        out.append({"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "main": c.pk == user.main_character_id,
                    "corporation": c.corporation.name if c.corporation else None, "total_sp": skills.total_sp if skills else None})
    return out


def overview(user) -> dict:
    """The plugin's home page: my own mentorship, and for mentors their mentees and the waiting list."""
    mine = Mentorship.objects.filter(mentee=user).select_related("mentor", "mentee", "requested_mentor").first()
    current = mine if mine and mine.is_open else None
    out = {
        "focus_areas": Program.load().focus_areas,
        "mine": detail(current, user) if current else None,
        "past": [brief(m) for m in Mentorship.objects.filter(mentee=user).exclude(status__in=Mentorship.OPEN)
                 .select_related("mentor", "mentee", "requested_mentor")],
        "suggested": current is None and suggested(user),
        "mentors": mentors_out(available_only=True, exclude=user) if current is None else [],
        "is_mentor": is_mentor(user),
        "can_manage": can_manage(user),
    }
    if out["is_mentor"]:
        goal_list = goals()
        out["profile"] = profile_out(profile_for(user))
        out["mentees"] = [brief(m, goal_list) for m in Mentorship.objects.filter(mentor=user, status=Mentorship.Status.ACTIVE)
                          .select_related("mentor", "mentee", "requested_mentor")]
    if out["is_mentor"] or out["can_manage"]:
        waiting = Mentorship.objects.filter(status=Mentorship.Status.WAITING).exclude(mentee=user).select_related("mentee", "requested_mentor")
        mine_focus = set(out.get("profile", {}).get("focus", []))
        out["waiting"] = sorted(
            [{**brief(m), "for_me": m.requested_mentor_id == user.pk, "matches": len(mine_focus & set(m.focus))} for m in waiting],
            key=lambda w: (not w["for_me"], -w["matches"], w["created_at"]),
        )
    return out


def widget(user) -> dict:
    current = open_mentorship(user)
    out = {"is_mentor": is_mentor(user), "suggested": current is None and suggested(user), "mine": None}
    if current:
        out["mine"] = brief(current)
    if out["is_mentor"]:
        out["mentees"] = Mentorship.objects.filter(mentor=user, status=Mentorship.Status.ACTIVE).count()
        out["capacity"] = profile_for(user).capacity
        out["waiting"] = Mentorship.objects.filter(status=Mentorship.Status.WAITING).exclude(mentee=user).count()
    return out


def stats() -> dict:
    counts = dict(Mentorship.objects.values_list("status").annotate(n=Count("id")))
    done = Mentorship.objects.filter(status=Mentorship.Status.GRADUATED, assigned_at__isnull=False, ended_at__isnull=False)
    days = [(m.ended_at - m.assigned_at).total_seconds() / 86400 for m in done.only("assigned_at", "ended_at")]
    waits = [(m.assigned_at - m.created_at).total_seconds() / 86400
             for m in Mentorship.objects.filter(assigned_at__isnull=False).only("assigned_at", "created_at")]
    return {
        "waiting": counts.get("waiting", 0), "active": counts.get("active", 0), "graduated": counts.get("graduated", 0),
        "ended": counts.get("ended", 0),
        "avg_days_to_graduate": round(sum(days) / len(days), 1) if days else None,
        "avg_days_waiting": round(sum(waits) / len(waits), 1) if waits else None,
    }


def search(user, q: str, limit: int) -> list[Mentorship]:
    qs = Mentorship.objects.filter(mentee__characters__name__icontains=q).distinct().select_related("mentee", "mentor")
    if not can_manage(user):
        qs = qs.filter(Q(mentor=user) | Q(status=Mentorship.Status.WAITING))
    return list(qs[:limit])
