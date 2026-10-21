"""The ops calendar: who sees which op, scheduling and changing ops, RSVPs, reminders and search.

- **Who sees an op:** every member, unless it's limited to some states or groups (like announcements). People who
  may change it (its creator, its FC and ``ops.manage_ops``) always see it.
- **Who may write:** ``ops.schedule_ops`` posts ops and changes or cancels the ones they made or lead;
  ``ops.manage_ops`` changes anyone's and the settings.
- **RSVPs:** going, maybe or not going, with the character they'll bring and a short note for the FC.
- **Telling people:** a new op goes under the bell for its audience (when asked, or always for important ones).
  Reminders go to the people going or maybe going (everyone in the audience for important ops) at the minute marks
  in the settings. A moved or cancelled op tells the people who answered. Webhooks hear about all of it; ops for
  some states or groups only go out as ``*_restricted`` events, since webhooks often post where anyone can read.
- **Doctrines:** with the Doctrines plugin on, an op can name one of its doctrines and links to it. Without it the
  doctrine is just a name.
"""

from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from conduit.access.models import State
from conduit.eve.models import portrait_url

from .models import Op, OpsSettings, Rsvp

log = logging.getLogger(__name__)

#: How far ahead an op may be scheduled.
MAX_AHEAD = timedelta(days=120)
#: The longest an op may run.
MAX_DURATION = 24 * 60
LINK = "/p/ops"
NOTIFY_LEVEL = {Op.Kind.CTA: "danger", Op.Kind.STRATOP: "warning", Op.Kind.DEFENSE: "warning"}


class OpError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_schedule(user) -> bool:
    return user.has_perm("ops.schedule_ops") or can_manage(user)


def can_manage(user) -> bool:
    return user.has_perm("ops.manage_ops")


def can_edit(user, op: Op) -> bool:
    """Managers change any op; schedulers the ones they made or lead."""
    if can_manage(user):
        return True
    return user.has_perm("ops.schedule_ops") and user.pk in (op.created_by_id, op.fc_id)


def ends_at(op: Op) -> datetime:
    return op.starts_at + timedelta(minutes=op.duration_minutes)


def status(op: Op, now=None) -> str:
    """``cancelled``, ``upcoming`` until form-up, ``live`` while it runs, then ``past``."""
    now = now or timezone.now()
    if op.cancelled:
        return "cancelled"
    if op.starts_at > now:
        return "upcoming"
    if ends_at(op) > now:
        return "live"
    return "past"


def level(op: Op) -> str:
    return "danger" if op.important else NOTIFY_LEVEL.get(op.kind, "info")


# --- who sees what ------------------------------------------------------------------------------------------------


def visible_to(user, qs=None):
    """Ops meant for this user, plus the ones they may change."""
    qs = Op.objects.all() if qs is None else qs
    if can_manage(user):
        return qs
    group_ids = list(user.groups.values_list("pk", flat=True))
    audience = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids) | Q(created_by=user) | Q(fc=user)
    if user.state_id:
        audience |= Q(states=user.state_id)
    return qs.filter(audience).distinct()


def audience_users(op: Op):
    """Everyone the op is for (only members can open the calendar)."""
    from conduit.access.services import site_members

    users = site_members()
    state_ids = list(op.states.values_list("pk", flat=True))
    group_ids = list(op.groups.values_list("pk", flat=True))
    if not state_ids and not group_ids:
        return users
    return users.filter(Q(state_id__in=state_ids) | Q(groups__in=group_ids)).distinct()


def restricted(op: Op) -> bool:
    return op.states.exists() or op.groups.exists()


# --- reading ------------------------------------------------------------------------------------------------------


def _person(u) -> dict | None:
    if u is None:
        return None
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None}


def _rows(qs):
    return (qs.select_related("fc__main_character", "created_by__main_character")
            .prefetch_related("states", "groups", "rsvps__user__main_character", "rsvps__character"))


def doctrines_on() -> bool:
    from django.apps import apps

    from conduit.plugins.services import is_enabled

    return apps.is_installed("conduit_doctrines") and is_enabled("doctrines")


def doctrine_choices() -> list[dict]:
    """The Doctrines plugin's active doctrines, for the editor. Empty without the plugin."""
    if not doctrines_on():
        return []
    from conduit_doctrines.models import Doctrine

    return [{"id": d.pk, "name": d.name} for d in Doctrine.objects.filter(active=True)]


def _doctrine(op: Op, linked: bool) -> dict | None:
    if not (op.doctrine_id or op.doctrine_name):
        return None
    link = f"/p/doctrines/{op.doctrine_id}" if op.doctrine_id and linked else None
    return {"id": op.doctrine_id, "name": op.doctrine_name, "link": link}


def out(op: Op, user, now=None, linked: bool | None = None) -> dict:
    now = now or timezone.now()
    rsvps = list(op.rsvps.all())
    mine = next((r for r in rsvps if r.user_id == user.pk), None)
    counts = {a: sum(1 for r in rsvps if r.answer == a) for a in Rsvp.Answer.values}
    edit = can_edit(user, op)
    states, groups = list(op.states.all()), list(op.groups.all())
    row = {
        "id": op.pk,
        "title": op.title,
        "kind": op.kind,
        "starts_at": op.starts_at.isoformat(),
        "ends_at": ends_at(op).isoformat(),
        "duration_minutes": op.duration_minutes,
        "fc": _person(op.fc),
        "fc_name": op.fc_name,
        "formup": op.formup,
        "comms": op.comms,
        "doctrine": _doctrine(op, doctrines_on() if linked is None else linked),
        "description": op.description,
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in states],
        "groups": [{"id": g.pk, "name": g.name} for g in groups],
        "important": op.important,
        "ping": op.ping,
        "ping_roles": list(op.ping_roles or []),
        "status": status(op, now),
        "counts": counts,
        "my_answer": mine.answer if mine else None,
        "my_character": mine.character_id if mine else None,
        "my_note": mine.note if mine else "",
        "can_edit": edit,
        "created_by": _person(op.created_by),
        "updated_at": op.updated_at.isoformat(),
    }
    # Who answered what: everyone sees the names, the FC and editors also see the characters and notes.
    row["rsvps"] = [
        {
            "user": r.user.display_name,
            "answer": r.answer,
            "character": r.character.name if r.character and (edit or r.user_id == user.pk) else None,
            "note": r.note if edit or r.user_id == user.pk else "",
        }
        for r in rsvps if r.answer != Rsvp.Answer.DECLINED or edit
    ]
    return row


def board(user) -> dict:
    """Ops from ``keep_days`` ago on, for the list and the calendar, and what the user may do."""
    now = timezone.now()
    s = OpsSettings.load()
    linked = doctrines_on()
    rows = list(_rows(visible_to(user, Op.objects.filter(starts_at__gte=now - timedelta(days=s.keep_days)))).order_by("starts_at"))
    upcoming = [op for op in rows if not op.cancelled and ends_at(op) > now]
    past = sorted((op for op in rows if op.cancelled or ends_at(op) <= now), key=lambda op: op.starts_at, reverse=True)
    return {
        "upcoming": [out(op, user, now, linked) for op in upcoming],
        "past": [out(op, user, now, linked) for op in past[:200]],
        "characters": [{"id": c.pk, "name": c.name} for c in user.characters.order_by("name")],
        "main_character": user.main_character_id,
        "can_schedule": can_schedule(user),
        "can_manage": can_manage(user),
        "doctrines": linked,
        "reminder_minutes": list(s.reminder_minutes),
    }


def month(user, first: date) -> list[dict]:
    """Every op the user may see starting in the month that begins on ``first`` (by EVE time), cancelled ones too."""
    start = datetime(first.year, first.month, 1, tzinfo=UTC)
    end = datetime(first.year + (first.month == 12), first.month % 12 + 1, 1, tzinfo=UTC)
    now = timezone.now()
    linked = doctrines_on()
    rows = _rows(visible_to(user, Op.objects.filter(starts_at__gte=start, starts_at__lt=end))).order_by("starts_at")
    return [out(op, user, now, linked) for op in rows]


def fc_search(q: str, limit: int = 10) -> list[dict]:
    """Members whose main character (or any character) matches ``q``, for picking the FC."""
    from conduit.access.services import site_members

    q = " ".join(q.split())
    if len(q) < 2:
        return []
    users = (site_members().filter(Q(main_character__name__icontains=q) | Q(characters__name__icontains=q))
             .select_related("main_character").distinct().order_by("main_character__name")[:limit])
    return [_person(u) for u in users]


# --- writing ------------------------------------------------------------------------------------------------------


def _audience(states: list[int], groups: list[int]):
    state_objs = list(State.objects.filter(pk__in=states))
    group_objs = list(Group.objects.filter(pk__in=groups))
    if len(state_objs) != len(set(states)) or len(group_objs) != len(set(groups)):
        raise OpError("Some of those states or groups don't exist")
    return state_objs, group_objs


def save(op: Op | None, by, *, title: str, kind: str, starts_at: datetime, duration_minutes: int = 120, fc: int | None = None,
         fc_name: str = "", formup: str = "", comms: str = "", doctrine_id: int | None = None, doctrine_name: str = "",
         description: str = "", states: list[int] | None = None, groups: list[int] | None = None, important: bool = False,
         notify: bool = True, ping: bool = False, ping_roles: list[str] | None = None) -> Op:
    from conduit.accounts.models import User

    title = " ".join(title.split())
    if not title:
        raise OpError("Give the op a title")
    if kind not in Op.Kind.values:
        raise OpError("Unknown kind of op")
    if not 15 <= duration_minutes <= MAX_DURATION:
        raise OpError("An op runs from 15 minutes to 24 hours")
    if timezone.is_naive(starts_at):
        starts_at = timezone.make_aware(starts_at, UTC)
    now = timezone.now()
    if starts_at > now + MAX_AHEAD:
        raise OpError(f"An op can't be more than {MAX_AHEAD.days} days away")
    new = op is None
    if (new or starts_at != op.starts_at) and starts_at < now - timedelta(hours=1):
        raise OpError("That time has passed")
    fc_user = None
    if fc:
        fc_user = User.objects.filter(pk=fc, is_active=True).first()
        if fc_user is None:
            raise OpError("That FC isn't on the site")
    doctrine_name = " ".join(doctrine_name.split())
    if doctrine_id:
        match = next((d for d in doctrine_choices() if d["id"] == doctrine_id), None)
        if match is None:
            raise OpError("That doctrine doesn't exist")
        doctrine_name = match["name"]
    state_objs, group_objs = _audience(states or [], groups or [])

    if new:
        op = Op(created_by=by)
    else:
        if op.cancelled:
            raise OpError("This op was cancelled")
        op.updated_by = by
    moved = not new and op.starts_at != starts_at
    op.title, op.kind, op.starts_at, op.duration_minutes = title[:200], kind, starts_at, duration_minutes
    op.fc, op.fc_name = fc_user, "" if fc_user else " ".join(fc_name.split())[:100]
    op.formup, op.comms = " ".join(formup.split())[:120], " ".join(comms.split())[:120]
    op.doctrine_id, op.doctrine_name = doctrine_id or None, doctrine_name[:100]
    op.description, op.important = description.strip()[:5000], important
    op.ping, op.ping_roles = ping, clean_roles(ping_roles)
    if moved:
        op.reminded = []  # a moved op gets its reminders again
    with transaction.atomic():
        op.save()
        op.states.set(state_objs)
        op.groups.set(group_objs)
    if new:
        announce(op, notify=notify)
    elif moved:
        _tell_answered(op, f"Moved: {op.title}", f"Now forms up {op.starts_at:%a %d %b %H:%M} ET.")
        _emit("ops.updated", op, f"Moved to {op.starts_at:%a %d %b %H:%M} ET.")
    else:
        _emit("ops.updated", op, "Details changed.")
    return op


def announce(op: Op, notify: bool = True) -> None:
    """Tell people about a new op: its audience under the bell (when asked, or always for important ones), and webhooks."""
    from conduit.notify.services import notify as send

    if notify or op.important:
        send(list(audience_users(op)), f"{op.get_kind_display()}: {op.title}", f"{describe(op)} Forms up {op.starts_at:%a %d %b %H:%M} ET.",
             link=f"{LINK}#o{op.pk}", level=level(op), category="p.ops", force=op.important, data={"op_id": op.pk})
    _emit("ops.created", op, f"Forms up {op.starts_at:%a %d %b %H:%M} ET.")


def cancel(op: Op, by) -> None:
    if op.cancelled:
        return
    op.cancelled, op.updated_by = True, by
    op.save(update_fields=["cancelled", "updated_by", "updated_at"])
    _tell_answered(op, f"Cancelled: {op.title}", f"The op on {op.starts_at:%a %d %b %H:%M} ET is off.", level="warning")
    _emit("ops.cancelled", op, "Called off.")


def delete(op: Op) -> None:
    """Gone without a word: for mistakes. Cancelling tells people."""
    op.delete()


def set_rsvp(op: Op, user, answer: str | None, character_id: int | None = None, note: str = "") -> Rsvp | None:
    """Answer an op (``None`` takes the answer back). The character must be one of the user's own."""
    if op.cancelled:
        raise OpError("This op was cancelled")
    if ends_at(op) <= timezone.now():
        raise OpError("This op is over")
    if not answer:
        Rsvp.objects.filter(op=op, user=user).delete()
        return None
    if answer not in Rsvp.Answer.values:
        raise OpError("Answer going, maybe or not going")
    character = None
    if character_id:
        character = user.characters.filter(pk=character_id).first()
        if character is None:
            raise OpError("That isn't one of your characters")
    elif answer != Rsvp.Answer.DECLINED:
        character = user.main_character
    r, _ = Rsvp.objects.update_or_create(op=op, user=user, defaults={"answer": answer, "character": character, "note": " ".join(note.split())[:120]})
    return r


def describe(op: Op) -> str:
    fc = op.fc.display_name if op.fc else op.fc_name
    parts = [p for p in (fc and f"FC {fc}", op.formup and f"form-up {op.formup}", op.doctrine_name and f"doctrine {op.doctrine_name}") if p]
    text = ", ".join(parts)
    return f"{text[:1].upper()}{text[1:]}." if text else ""


def _answered(op: Op, answers=(Rsvp.Answer.GOING, Rsvp.Answer.MAYBE)) -> list:
    return [r.user for r in op.rsvps.filter(answer__in=answers).select_related("user")]


def _tell_answered(op: Op, title: str, body: str, level: str = "info") -> None:
    from conduit.notify.services import notify as send

    people = _answered(op)
    if people:
        send(people, title, body, link=f"{LINK}#o{op.pk}", level=level, category="p.ops", force=True, data={"op_id": op.pk})


def _emit(event: str, op: Op, summary: str) -> None:
    """Webhooks hear about every change. ``ping`` and ``mention_roles`` make a Discord webhook ping (its own mention
    and the op's roles) when the op asks for it; a cancelled op still pings, so people don't turn up for nothing."""
    from conduit.events import bus

    states, groups = list(op.states.values_list("name", flat=True)), list(op.groups.values_list("name", flat=True))
    limited = bool(states or groups)
    fc = op.fc.display_name if op.fc else op.fc_name
    bus.emit(f"{event}_restricted" if limited else event, op_id=op.pk, title=f"{op.get_kind_display()}: {op.title}", kind=op.kind,
             starts_at=op.starts_at.isoformat(), duration_minutes=op.duration_minutes, fc=fc, formup=op.formup, comms=op.comms,
             doctrine=op.doctrine_name, important=op.important, audience={"states": states, "groups": groups} if limited else "everyone",
             summary=f"{describe(op)} {summary}".strip(), level=level(op), link=f"{LINK}#o{op.pk}",
             ping=op.ping, mention_roles=list(op.ping_roles or []) if op.ping else [])


# --- Discord roles to ping ----------------------------------------------------------------------------------------

ROLES_CACHE = 600


def clean_roles(roles) -> list[str]:
    return list(dict.fromkeys(str(r) for r in (roles or []) if str(r).isdigit()))[:10]


def discord_roles() -> dict:
    """The Discord server's roles (through the Discord plugin, when it's on and linked), for picking who an op
    pings. ``available`` is False without the plugin; then only the webhook's own mention pings."""
    from django.apps import apps
    from django.core.cache import cache

    from conduit.plugins.services import is_enabled

    if not (apps.is_installed("conduit_discord") and is_enabled("discord")):
        return {"available": False, "roles": []}
    from conduit_discord import discord_api
    from conduit_discord.models import DiscordSettings

    s = DiscordSettings.load()
    if not (s.bot_token and s.guild_id):
        return {"available": False, "roles": []}
    roles = cache.get("ops:discord_roles")
    if roles is None:
        try:
            raw = discord_api.roles(s.bot_token, s.guild_id)
        except Exception as exc:  # noqa: BLE001 - Discord being down mustn't break the editor
            log.warning("Couldn't read the Discord roles: %s", exc)
            return {"available": True, "roles": [], "error": "Discord couldn't be reached; the roles aren't available right now."}
        roles = [{"id": str(r["id"]), "name": r["name"], "color": r.get("color") or 0}
                 for r in sorted(raw, key=lambda r: -r.get("position", 0)) if str(r["id"]) != str(s.guild_id) and not r.get("managed")]
        cache.set("ops:discord_roles", roles, ROLES_CACHE)
    return {"available": True, "roles": roles}


# --- reminders ----------------------------------------------------------------------------------------------------


def remind_due() -> int:
    """Send the reminders whose minute mark has passed. Each mark is sent once; if several are due at once (the
    scheduler was down), one reminder goes out for the nearest mark."""
    from conduit.notify.services import notify as send

    marks = sorted({int(m) for m in OpsSettings.load().reminder_minutes if int(m) > 0}, reverse=True)
    if not marks:
        return 0
    now = timezone.now()
    sent = 0
    for op in Op.objects.filter(cancelled=False, starts_at__gt=now, starts_at__lte=now + timedelta(minutes=marks[0])).select_related("fc__main_character"):
        due = [m for m in marks if m not in op.reminded and op.starts_at - now <= timedelta(minutes=m)]
        if not due:
            continue
        with transaction.atomic():
            claimed = Op.objects.filter(pk=op.pk, reminded=op.reminded).update(reminded=[*op.reminded, *due])
        if not claimed:
            continue
        minutes = max(1, int((op.starts_at - now).total_seconds() // 60))
        body = f"{describe(op)} Forms up in {_minutes(minutes)}, at {op.starts_at:%H:%M} ET.".strip()
        people = list(audience_users(op)) if op.important else _answered(op)
        if people:
            send(people, f"Op soon: {op.title}", body, link=f"{LINK}#o{op.pk}", level=level(op), category="p.ops",
                 force=op.important, data={"op_id": op.pk})
        _emit("ops.reminder", op, f"Forms up in {_minutes(minutes)}.")
        sent += 1
    return sent


def _minutes(n: int) -> str:
    if n >= 120:
        return f"{n // 60} hours" + (f" {n % 60} min" if n % 60 else "")
    if n >= 60:
        return "1 hour" + (f" {n % 60} min" if n % 60 else "")
    return f"{n} min"


# --- search -------------------------------------------------------------------------------------------------------


def search(request, q, limit):
    """Ctrl+K: upcoming ops the user may see, by title, form-up, FC or doctrine."""
    now = timezone.now()
    rows = (visible_to(request.user, Op.objects.filter(cancelled=False, starts_at__gt=now - timedelta(hours=2)))
            .filter(Q(title__icontains=q) | Q(formup__icontains=q) | Q(fc_name__icontains=q) | Q(fc__main_character__name__icontains=q)
                    | Q(doctrine_name__icontains=q))
            .order_by("starts_at")[:limit])
    return {
        "key": "ops",
        "label": "Ops",
        "hits": [{"id": f"op:{op.pk}", "title": op.title, "subtitle": f"{op.get_kind_display()} · {op.starts_at:%a %d %b %H:%M} ET",
                  "icon": "calendar", "url": f"{LINK}#o{op.pk}"} for op in rows],
    }
