"""The timer board: who may do what, adding and changing timers, reminders, and timers read from elsewhere.

Timers come from three places:

- **By hand:** someone with ``timers.manage_timers`` adds one from the in-game timer (the time left or the exact time).
- **Corporation structures:** the corporation sheet syncs ``/corporations/{id}/structures``; reinforced, anchoring and
  unanchoring structures with a timer get one here (``import_structures``).
- **In-game notifications:** characters' notifications (``esi-characters.read_notifications.v1``) say when a structure
  lost its shields or armor, when a sovereignty structure was reinforced, when a customs office comes out, and when
  a structure finishes anchoring. Those become timers too (``import_notifications``).

Every member sees the board and can say they're going. Reminders go to the people going (and to everyone for
important timers) at the minute marks in the settings, and every reminder fires ``timers.reminder`` for webhooks.
"""

from __future__ import annotations

import logging
import re
from datetime import UTC, datetime, timedelta

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from conduit.eve.models import portrait_url
from conduit.sde.models import ItemType, SolarSystem, type_icon_url

from .models import Timer, TimerSettings

log = logging.getLogger(__name__)

#: Structure types offered in the editor, with their type ids (for icons). Anything else can be typed in.
STRUCTURE_TYPES: dict[str, int | None] = {
    "Astrahus": 35832,
    "Fortizar": 35833,
    "Keepstar": 35834,
    "Raitaru": 35825,
    "Azbel": 35826,
    "Sotiyo": 35827,
    "Athanor": 35835,
    "Tatara": 35836,
    "Metenox Moon Drill": 81826,
    "Ansiblex Jump Gate": 35841,
    "Pharolux Cyno Beacon": 35840,
    "Tenebrex Cyno Jammer": 37534,
    "Orbital Skyhook": 81080,
    "Sovereignty Hub": 81615,
    "Customs Office": 2233,
    "Territorial Claim Unit": 32226,
    "Infrastructure Hub": 32458,
    "Control Tower": None,
}
#: How far ahead a timer may be set by hand; EVE timers are days, not months.
MAX_AHEAD = timedelta(days=60)
#: Timers read from elsewhere are the same timer when they end this close to one we already have.
SAME_TIMER = timedelta(minutes=10)
#: Notifications older than this are history, not timers.
NOTIFICATION_AGE = timedelta(days=7)
#: Notification types that carry a timer, and what kind of timer they are.
NOTIFICATION_KINDS = {
    "StructureLostShields": Timer.Kind.ARMOR,
    "StructureLostArmor": Timer.Kind.HULL,
    "SkyhookLostShields": Timer.Kind.ARMOR,
    "StructureAnchoring": Timer.Kind.ANCHORING,
    "StructureUnanchoring": Timer.Kind.UNANCHORING,
    "SovStructureReinforced": Timer.Kind.SOV,
    "OrbitalReinforced": Timer.Kind.OTHER,
}
NOTIFY_LEVEL = {Timer.Side.FRIENDLY: "danger", Timer.Side.HOSTILE: "warning", Timer.Side.NEUTRAL: "info"}
SOV_STRUCTURES = {1: ("Territorial Claim Unit", 32226), 2: ("Infrastructure Hub", 32458), 3: ("Station", None)}
LINK = "/p/timers"


class TimerError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_manage(user) -> bool:
    return user.has_perm("timers.manage_timers")


def type_id_for(name: str) -> int | None:
    """The type id of a structure type name: from the static data when it's there, else from the built-in list."""
    name = name.strip()
    if not name:
        return None
    row = ItemType.objects.filter(name__iexact=name, published=True).values_list("pk", flat=True).first()
    return row or STRUCTURE_TYPES.get(name) or next((v for k, v in STRUCTURE_TYPES.items() if k.lower() == name.lower()), None)


def status(t: Timer, now=None) -> str:
    """``upcoming`` until it comes out, ``now`` for the hour after (the fight is on), then ``past``."""
    now = now or timezone.now()
    if t.ends_at > now:
        return "upcoming"
    if t.ends_at > now - timedelta(hours=1):
        return "now"
    return "past"


def out(t: Timer, user, now=None) -> dict:
    going = list(t.going.all())
    system = t.system
    return {
        "id": t.pk,
        "name": t.name,
        "structure_type": t.structure_type,
        "type_id": t.type_id,
        "icon": type_icon_url(t.type_id, 32) if t.type_id else None,
        "system": {
            "id": system.pk,
            "name": system.name,
            "region": region_name(system),
            "security": round(system.display_security, 1),
        },
        "kind": t.kind,
        "side": t.side,
        "owner": t.owner,
        "ends_at": t.ends_at.isoformat(),
        "notes": t.notes,
        "important": t.important,
        "source": t.source,
        "structure_id": t.structure_id,
        "status": status(t, now),
        "going": any(u.pk == user.pk for u in going),
        "going_count": len(going),
        "going_names": [u.display_name for u in going[:20]],
        "created_by": _person(t.created_by),
        "updated_at": t.updated_at.isoformat(),
    }


def region_name(system) -> str:
    """The system's region, or "" when the static data doesn't have it (the link isn't enforced by the database)."""
    try:
        return system.region.name if system.region_id else ""
    except ObjectDoesNotExist:
        return ""


def _person(u) -> dict | None:
    if u is None:
        return None
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None}


def _rows(qs):
    return qs.select_related("system__region", "created_by__main_character").prefetch_related("going__main_character")


def board(user) -> dict:
    now = timezone.now()
    s = TimerSettings.load()
    upcoming = list(_rows(Timer.objects.filter(ends_at__gt=now - timedelta(hours=1))).order_by("ends_at"))
    past = list(_rows(Timer.objects.filter(ends_at__lte=now - timedelta(hours=1), ends_at__gte=now - timedelta(days=s.keep_days))).order_by("-ends_at")[:200])
    mine = {t.pk for t in upcoming if any(u.pk == user.pk for u in t.going.all())}
    return {
        "upcoming": [out(t, user, now) for t in upcoming],
        "past": [out(t, user, now) for t in past],
        "going": sorted(mine),
        "can_manage": can_manage(user),
        "reminder_minutes": list(s.reminder_minutes),
    }


# --- our own structures, for the editor ---------------------------------------------------------------------------

#: A structure's state in the corporation sheet, and the timer kind and end time it carries.
STRUCTURE_STATE_KINDS = {"armor_reinforce": Timer.Kind.ARMOR, "hull_reinforce": Timer.Kind.HULL, "anchoring": Timer.Kind.ANCHORING}


def structure_search(user, q: str, limit: int = 12) -> list[dict]:
    """Our corporations' structures (from the corporation sheet) whose name, solar system or type matches ``q``, for
    filling in the editor. Only structures of corporations whose sheet the user may see; someone without that access
    gets an empty list and types everything by hand."""
    from conduit.corp.access import can_view_section
    from conduit.corp.models import Structure

    q = " ".join(q.split())
    if len(q) < 2:
        return []
    systems = {s.pk: s for s in SolarSystem.objects.filter(name__icontains=q).select_related("region")[:50]}
    types = dict(ItemType.objects.filter(name__icontains=q, published=True).values_list("pk", "name")[:50])
    types.update({v: k for k, v in STRUCTURE_TYPES.items() if v and q.lower() in k.lower()})
    rows = Structure.objects.filter(Q(name__icontains=q) | Q(system_id__in=list(systems)) | Q(type_id__in=list(types))).select_related("corporation")
    allowed: dict[int, bool] = {}
    hits = []
    for s in rows.order_by("name")[:200]:
        corp_id = s.corporation_id
        if corp_id not in allowed:
            allowed[corp_id] = can_view_section(user, s.corporation, "structures")
        if not allowed[corp_id]:
            continue
        hits.append(s)
    if not hits:
        return []
    missing_systems = {s.system_id for s in hits} - set(systems)
    if missing_systems:
        systems.update({x.pk: x for x in SolarSystem.objects.filter(pk__in=missing_systems).select_related("region")})
    missing_types = {s.type_id for s in hits} - set(types)
    if missing_types:
        types.update(dict(ItemType.objects.filter(pk__in=missing_types).values_list("pk", "name")))
    ql = q.lower()
    # Structures named like the search first, then the rest by name.
    hits.sort(key=lambda s: (not s.name.lower().startswith(ql), ql not in s.name.lower(), s.name.lower()))
    out = []
    for s in hits[:limit]:
        system = systems.get(s.system_id)
        kind, ends_at = STRUCTURE_STATE_KINDS.get(s.state), s.state_timer_end
        if s.unanchors_at and (not ends_at or ends_at <= timezone.now()):
            kind, ends_at = Timer.Kind.UNANCHORING, s.unanchors_at
        if not ends_at or ends_at <= timezone.now():
            kind, ends_at = None, None
        type_name = types.get(s.type_id) or next((k for k, v in STRUCTURE_TYPES.items() if v == s.type_id), "")
        out.append({
            "structure_id": s.structure_id,
            "name": s.name or type_name or f"Structure {s.structure_id}",
            "structure_type": type_name,
            "type_id": s.type_id,
            "icon": type_icon_url(s.type_id, 32),
            "system": {"id": s.system_id, "name": system.name if system else str(s.system_id), "region": region_name(system) if system else "",
                       "security": round(system.display_security, 1) if system else 0.0},
            "owner": s.corporation.name,
            "state": s.state,
            "kind": kind,
            "ends_at": ends_at.isoformat() if ends_at else None,
            "fuel_expires": s.fuel_expires.isoformat() if s.fuel_expires else None,
        })
    return out


# --- writing ------------------------------------------------------------------------------------------------------


def save(t: Timer | None, by, *, name: str, system: int, kind: str, side: str, ends_at: datetime, structure_type: str = "",
         owner: str = "", notes: str = "", important: bool = False, notify: bool = True, structure_id: int | None = None) -> Timer:
    name = " ".join(name.split())
    if not name:
        raise TimerError("Give the timer a name (the structure's name)")
    if kind not in Timer.Kind.values:
        raise TimerError("Unknown timer kind")
    if side not in Timer.Side.values:
        raise TimerError("Unknown side")
    if timezone.is_naive(ends_at):
        ends_at = timezone.make_aware(ends_at, UTC)
    now = timezone.now()
    if ends_at > now + MAX_AHEAD:
        raise TimerError(f"A timer can't be more than {MAX_AHEAD.days} days away")
    if ends_at < now - timedelta(days=TimerSettings.load().keep_days):
        raise TimerError("That time is too long ago")
    sys_row = SolarSystem.objects.filter(pk=system).first()
    if sys_row is None:
        raise TimerError("Pick a solar system")
    new = t is None
    if new:
        t = Timer(created_by=by, source=Timer.Source.MANUAL)
    else:
        t.updated_by = by
    changed_time = not new and t.ends_at != ends_at
    t.name, t.system, t.kind, t.side, t.ends_at = name[:200], sys_row, kind, side, ends_at
    t.structure_type = " ".join(structure_type.split())[:60]
    t.type_id = type_id_for(t.structure_type)
    t.owner, t.notes, t.important = " ".join(owner.split())[:120], notes.strip()[:5000], important
    # Picked from our own structures: remember which, so the automatic import sees it's already on the board.
    if structure_id:
        t.structure_id = structure_id
    if changed_time:
        t.reminded = []  # a moved timer gets its reminders again
    t.save()
    if new:
        announce(t, notify=notify)
    else:
        _emit("timers.updated", t, f"Now comes out {t.ends_at:%Y-%m-%d %H:%M} ET." if changed_time else "Details changed.")
    return t


def announce(t: Timer, notify: bool = True) -> None:
    """Tell people about a new timer: members under the bell (when asked, or always for important ones), and webhooks."""
    from conduit.access.services import site_members
    from conduit.notify.services import notify as send

    if notify or t.important:
        send(list(site_members()), f"{title(t)}", f"{describe(t)} Comes out {t.ends_at:%a %d %b %H:%M} ET.", link=LINK,
             level=NOTIFY_LEVEL.get(t.side, "info"), category="p.timers", force=t.important, data={"timer_id": t.pk})
    _emit("timers.created", t, f"Comes out {t.ends_at:%a %d %b %H:%M} ET.")


def delete(t: Timer) -> None:
    _emit("timers.deleted", t, "Taken off the board.")
    t.delete()


def set_going(t: Timer, user, going: bool) -> int:
    if going:
        t.going.add(user)
    else:
        t.going.remove(user)
    return t.going.count()


def title(t: Timer) -> str:
    what = t.get_kind_display().lower() if t.kind != Timer.Kind.OTHER else ""
    return f"{t.name} in {t.system.name}" + (f" ({what} timer)" if what else "")


def describe(t: Timer) -> str:
    parts = [p for p in (t.structure_type, t.owner and f"owned by {t.owner}", t.get_side_display().lower() if t.side != Timer.Side.NEUTRAL else "") if p]
    return (", ".join(parts) + ".") if parts else ""


def _emit(event: str, t: Timer, summary: str) -> None:
    from conduit.events import bus

    bus.emit(event, timer_id=t.pk, structure=t.name, structure_type=t.structure_type, system=t.system.name, kind=t.kind, side=t.side,
             owner=t.owner, ends_at=t.ends_at.isoformat(), important=t.important, title=title(t),
             summary=f"{describe(t)} {summary}".strip(), level=NOTIFY_LEVEL.get(t.side, "info"), link=LINK)


# --- reminders ----------------------------------------------------------------------------------------------------


def remind_due() -> int:
    """Send the reminders whose minute mark has passed. Each mark is sent once; if several are due at once (the
    scheduler was down), one reminder goes out for the nearest mark."""
    from conduit.access.services import site_members
    from conduit.notify.services import notify as send

    marks = sorted({int(m) for m in TimerSettings.load().reminder_minutes if int(m) > 0}, reverse=True)
    if not marks:
        return 0
    now = timezone.now()
    sent = 0
    for t in _rows(Timer.objects.filter(ends_at__gt=now, ends_at__lte=now + timedelta(minutes=marks[0]))):
        due = [m for m in marks if m not in t.reminded and t.ends_at - now <= timedelta(minutes=m)]
        if not due:
            continue
        with transaction.atomic():
            claimed = Timer.objects.filter(pk=t.pk, reminded=t.reminded).update(reminded=[*t.reminded, *due])
        if not claimed:
            continue
        minutes = max(1, int((t.ends_at - now).total_seconds() // 60))
        body = f"{describe(t)} Comes out in {_minutes(minutes)}, at {t.ends_at:%H:%M} ET."
        people = list(site_members()) if t.important else list(t.going.all())
        if people:
            send(people, f"Timer soon: {title(t)}", body, link=LINK, level=NOTIFY_LEVEL.get(t.side, "info"), category="p.timers",
                 force=t.important, data={"timer_id": t.pk})
        _emit("timers.reminder", t, f"Comes out in {_minutes(minutes)}.")
        sent += 1
    return sent


def _minutes(n: int) -> str:
    if n >= 120:
        return f"{n // 60} hours" + (f" {n % 60} min" if n % 60 else "")
    if n >= 60:
        return "1 hour" + (f" {n % 60} min" if n % 60 else "")
    return f"{n} min"


# --- timers from elsewhere ----------------------------------------------------------------------------------------


def _same(structure_id: int | None, kind: str, ends_at: datetime, system_id: int | None = None) -> Timer | None:
    """A timer we already have for this structure (or, without an id, in this system) and kind, ending about then."""
    qs = Timer.objects.filter(kind=kind, ends_at__gte=ends_at - SAME_TIMER, ends_at__lte=ends_at + SAME_TIMER)
    if structure_id:
        qs = qs.filter(structure_id=structure_id)
    elif system_id:
        qs = qs.filter(system_id=system_id, structure_id__isnull=True)
    else:
        return None
    return qs.first()


def _add(*, name: str, type_id: int | None, system_id: int, kind: str, ends_at: datetime, owner: str, source: str,
         structure_id: int | None = None, side: str = Timer.Side.FRIENDLY) -> Timer | None:
    """Add a timer read from elsewhere unless it's already on the board (then its time is corrected if it moved).
    New ones are announced like timers added by hand: under the bell for members, and to webhooks."""
    if ends_at <= timezone.now() or not SolarSystem.objects.filter(pk=system_id).exists():
        return None
    existing = _same(structure_id, kind, ends_at, system_id)
    if existing is not None:
        if abs((existing.ends_at - ends_at).total_seconds()) > 60 and existing.source != Timer.Source.MANUAL:
            existing.ends_at = ends_at
            existing.reminded = []
            existing.save(update_fields=["ends_at", "reminded", "updated_at"])
        return None
    type_name = ""
    if type_id:
        type_name = ItemType.objects.filter(pk=type_id).values_list("name", flat=True).first() or next((k for k, v in STRUCTURE_TYPES.items() if v == type_id), "")
    t = Timer.objects.create(name=(name or type_name or "Structure")[:200], structure_type=type_name[:60], type_id=type_id, system_id=system_id,
                             kind=kind, side=side, owner=owner[:120], ends_at=ends_at, source=source, structure_id=structure_id)
    announce(t, notify=True)
    return t


def import_structures() -> int:
    """Timers for the corporation sheet's structures that are reinforced, anchoring or unanchoring."""
    from conduit.corp.models import Structure

    now = timezone.now()
    added = 0
    rows = Structure.objects.filter(Q(state_timer_end__gt=now) | Q(unanchors_at__gt=now)).select_related("corporation")
    for s in rows:
        kind = {"armor_reinforce": Timer.Kind.ARMOR, "hull_reinforce": Timer.Kind.HULL, "anchoring": Timer.Kind.ANCHORING}.get(s.state)
        ends_at = s.state_timer_end
        if s.unanchors_at and s.unanchors_at > now and (not ends_at or ends_at <= now):
            kind, ends_at = Timer.Kind.UNANCHORING, s.unanchors_at
        if not kind or not ends_at or ends_at <= now:
            continue
        if _add(name=s.name, type_id=s.type_id, system_id=s.system_id, kind=kind, ends_at=ends_at, owner=s.corporation.name,
                source=Timer.Source.STRUCTURE, structure_id=s.structure_id):
            added += 1
    return added


_ID = re.compile(r"^(\w+):\s*(?:&\w+\s+)?(-?\d+(?:\.\d+)?)\s*$", re.M)
#: Windows file time: 100-nanosecond ticks since 1601, which is how notifications give times.
_FILETIME_EPOCH = datetime(1601, 1, 1, tzinfo=UTC)


def notification_fields(text: str) -> dict[str, int]:
    """The numeric ``key: value`` lines of a notification body (``structureID: &id001 1030000000`` included)."""
    return {k: int(float(v)) for k, v in _ID.findall(text or "")}


def filetime(ticks: int) -> datetime:
    return _FILETIME_EPOCH + timedelta(microseconds=ticks // 10)


def timer_from_notification(n) -> dict | None:
    """What timer a notification describes, or None when it has no time in it."""
    kind = NOTIFICATION_KINDS.get(n.type)
    if kind is None:
        return None
    f = notification_fields(n.text)
    system_id = f.get("solarsystemID") or f.get("solarSystemID")
    if not system_id:
        return None
    owner = n.character.corporation.name if n.character.corporation_id and n.character.corporation else ""
    if n.type == "SovStructureReinforced":
        if "decloakTime" not in f:
            return None
        name, type_id = SOV_STRUCTURES.get(f.get("campaignEventType", 0), ("Sovereignty structure", None))
        return {"name": name, "type_id": type_id, "system_id": system_id, "kind": kind, "ends_at": filetime(f["decloakTime"]), "owner": owner}
    if n.type == "OrbitalReinforced":
        if "reinforceExitTime" not in f:
            return None
        return {"name": "Customs Office", "type_id": f.get("typeID") or 2233, "system_id": system_id, "kind": Timer.Kind.OTHER,
                "ends_at": filetime(f["reinforceExitTime"]), "owner": owner, "structure_id": f.get("planetID")}
    if "timeLeft" not in f:
        return None
    structure_id = f.get("structureID")
    name = ""
    if structure_id:
        from conduit.sheet.models import Location

        name = Location.objects.filter(pk=structure_id).values_list("name", flat=True).first() or ""
    return {"name": name, "type_id": f.get("structureTypeID"), "system_id": system_id, "kind": kind,
            "ends_at": n.timestamp + timedelta(microseconds=f["timeLeft"] // 10), "owner": owner, "structure_id": structure_id}


def import_notifications() -> int:
    """Timers from members' in-game notifications that arrived since the last look."""
    from conduit.sheet.notifications.models import Notification

    s = TimerSettings.load()
    now = timezone.now()
    since = max(s.notifications_seen_until or (now - NOTIFICATION_AGE), now - NOTIFICATION_AGE)
    rows = (Notification.objects.filter(type__in=NOTIFICATION_KINDS, timestamp__gt=since)
            .select_related("character__corporation").order_by("timestamp"))
    added, latest = 0, since
    for n in rows:
        latest = max(latest, n.timestamp)
        try:
            spec = timer_from_notification(n)
        except (ValueError, OverflowError):
            log.warning("Couldn't read the time in %s notification %s", n.type, n.notification_id)
            continue
        if spec and _add(source=Timer.Source.NOTIFICATION, **spec):
            added += 1
    TimerSettings.objects.filter(pk=s.pk).update(notifications_seen_until=latest)
    return added


def import_all() -> dict:
    s = TimerSettings.load()
    return {
        "structures": import_structures() if s.import_structures else 0,
        "notifications": import_notifications() if s.import_notifications else 0,
    }


# --- search -------------------------------------------------------------------------------------------------------


def search(request, q, limit):
    """Ctrl+K: upcoming timers by structure name, system or owner."""
    now = timezone.now()
    rows = (Timer.objects.filter(ends_at__gt=now - timedelta(hours=1))
            .filter(Q(name__icontains=q) | Q(system__name__icontains=q) | Q(owner__icontains=q))
            .select_related("system").order_by("ends_at")[:limit])
    return {
        "key": "timers",
        "label": "Timers",
        "hits": [{"id": f"timer:{t.pk}", "title": f"{t.name} · {t.system.name}", "subtitle": f"{t.get_kind_display()} · {t.ends_at:%d %b %H:%M} ET",
                  "icon": "timer", "url": f"{LINK}#t{t.pk}"} for t in rows],
    }
