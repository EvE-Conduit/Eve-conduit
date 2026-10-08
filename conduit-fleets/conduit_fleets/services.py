"""Fleets and FATs (fleet attendance).

Attendance is recorded three ways:

- **Tracking:** the FC picks one of their characters that is fleet boss in game. Every minute the members of that
  in-game fleet are read from ESI (``esi-fleets.read_fleet.v1``) and everyone in it gets a FAT.
- **FAT link:** pilots open the fleet's link and register the characters they flew with.
- **Manually:** the FC or a fleet manager adds a character.

A character gets at most one FAT per fleet. Attendance counts belong to whoever owns the character now.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from conduit.accounts.models import Character, User
from conduit.eve.models import portrait_url
from conduit.eve.tasks import ensure_eve_names, names_for
from conduit.sde.models import ItemType, SolarSystem, type_icon_url

from .models import Fat, Fleet, FleetType

log = logging.getLogger(__name__)

FLEET_SCOPE = "esi-fleets.read_fleet.v1"
#: Tracking stops by itself after this long, in case nobody ends the fleet.
MAX_TRACKING = timedelta(hours=12)
DEFAULT_TYPES = (("CTA", "#f43f5e"), ("Stratop", "#fb923c"), ("Roam", "#22d3ee"), ("Home defense", "#34d399"), ("Mining", "#a78bfa"))


class FleetError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_run(user) -> bool:
    return user.has_perm("fleets.run_fleets") or user.has_perm("fleets.manage_fleets")


def can_manage(user) -> bool:
    return user.has_perm("fleets.manage_fleets")


def can_edit(user, fleet: Fleet) -> bool:
    return can_manage(user) or (can_run(user) and user.pk in (fleet.fc_id, fleet.created_by_id))


def fleet_types() -> list[FleetType]:
    """The fleet types, creating the usual ones the first time."""
    types = list(FleetType.objects.all())
    if not types:
        FleetType.objects.bulk_create([FleetType(name=n, color=c) for n, c in DEFAULT_TYPES], ignore_conflicts=True)
        types = list(FleetType.objects.all())
    return types


# --- fleets --------------------------------------------------------------------------------------------------------


def create_fleet(by, *, name: str, fleet_type_id: int | None, notes: str = "", link_minutes: int | None = None) -> Fleet:
    from conduit.events import bus

    name = name.strip()[:120]
    if not name:
        raise FleetError("Give the fleet a name")
    if fleet_type_id and not FleetType.objects.filter(pk=fleet_type_id).exists():
        raise FleetError("No such fleet type")
    fleet = Fleet.objects.create(
        name=name, fleet_type_id=fleet_type_id or None, notes=notes.strip()[:4000], fc=by, created_by=by,
        link_expires_at=timezone.now() + timedelta(minutes=link_minutes) if link_minutes else None,
    )
    bus.emit("fleets.created", fleet_id=fleet.pk, fleet=fleet.name, fc=by.display_name, title=f"Fleet: {fleet.name}",
             summary=f"FC {by.display_name}" + (f" · {fleet.fleet_type.name}" if fleet.fleet_type_id else ""), link=f"/p/fleets/{fleet.pk}")
    return fleet


def end_fleet(fleet: Fleet) -> Fleet:
    from conduit.events import bus

    if fleet.ended_at:
        raise FleetError("This fleet has already ended")
    fleet.ended_at = timezone.now()
    fleet.tracking = False
    fleet.link_open = False
    fleet.save(update_fields=["ended_at", "tracking", "link_open"])
    pilots = fleet.fats.count()
    bus.emit("fleets.ended", fleet_id=fleet.pk, fleet=fleet.name, pilots=pilots, title=f"Fleet ended: {fleet.name}",
             summary=f"{pilots} pilot{'s' if pilots != 1 else ''} got a FAT", link=f"/p/fleets/{fleet.pk}", level="success")
    return fleet


# --- tracking the in-game fleet ------------------------------------------------------------------------------------


def start_tracking(fleet: Fleet, character_id: int, by) -> Fleet:
    """Follow the in-game fleet ``character_id`` is boss of."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

    if fleet.ended_at:
        raise FleetError("This fleet has ended")
    char = Character.objects.filter(pk=character_id).select_related("token").first()
    # Always the FC's own character, managers included: tracking reads ESI with that character's login every minute,
    # which would let someone follow another member's in-game fleet without them knowing.
    if char is None or char.user_id != by.pk:
        raise FleetError("Pick one of your own characters")
    token = getattr(char, "token", None)
    if token is None or not token.has_scopes(FLEET_SCOPE):
        raise FleetError(f"{char.name} hasn't granted fleet access; log in with it again (Characters → Add character)")
    try:
        info = esi().get(f"/characters/{char.pk}/fleet", character=char).data
    except EsiError as exc:
        if exc.status == 404:
            raise FleetError(f"{char.name} isn't in a fleet in game right now") from None
        raise FleetError(f"ESI didn't answer ({exc.status}); try again in a moment") from None
    except (EsiBackoff, TokenInvalid) as exc:
        raise FleetError(str(exc)) from None
    if info.get("role") != "fleet_commander":
        raise FleetError(f"{char.name} has to be the fleet boss (fleet commander) to read who is in the fleet")
    fleet.tracking_character = char
    fleet.esi_fleet_id = info["fleet_id"]
    fleet.tracking = True
    fleet.tracking_error = ""
    fleet.save(update_fields=["tracking_character", "esi_fleet_id", "tracking", "tracking_error"])
    poll(fleet)
    return fleet


def stop_tracking(fleet: Fleet, error: str = "") -> None:
    fleet.tracking = False
    fleet.tracking_error = error[:300]
    fleet.save(update_fields=["tracking", "tracking_error"])


def poll(fleet: Fleet) -> int:
    """Give everyone in the in-game fleet a FAT. Returns how many new FATs."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

    if not fleet.tracking or fleet.tracking_character is None:
        return 0
    if fleet.ended_at or timezone.now() - fleet.started_at > MAX_TRACKING:
        stop_tracking(fleet, "Tracking stops after 12 hours")
        return 0
    try:
        members = esi().get(f"/fleets/{fleet.esi_fleet_id}/members", character=fleet.tracking_character).data or []
    except EsiBackoff:
        return 0  # ESI asked us to wait; try again next minute
    except TokenInvalid:
        stop_tracking(fleet, f"{fleet.tracking_character.name}'s login stopped working; log in with it again")
        return 0
    except EsiError as exc:
        if exc.status == 404:
            stop_tracking(fleet, "The in-game fleet has ended, or someone else is fleet boss now")
        elif exc.status == 403:
            stop_tracking(fleet, f"{fleet.tracking_character.name} is no longer the fleet boss")
        else:
            fleet.tracking_error = f"ESI didn't answer ({exc.status}); still trying"
            fleet.save(update_fields=["tracking_error"])
        return 0
    added = record(fleet, [(m["character_id"], m.get("ship_type_id"), m.get("solar_system_id")) for m in members], Fat.Via.ESI)
    fleet.last_tracked_at = timezone.now()
    fleet.tracking_error = ""
    fleet.save(update_fields=["last_tracked_at", "tracking_error"])
    return added


def track_all() -> int:
    total = 0
    for fleet in Fleet.objects.filter(tracking=True).select_related("tracking_character"):
        try:
            total += poll(fleet)
        except Exception:  # one fleet must not stop the others
            log.exception("Tracking fleet %s failed", fleet.pk)
    return total


def record(fleet: Fleet, members: list[tuple[int, int | None, int | None]], via: str, by=None) -> int:
    """FATs for (character id, ship type, system) rows that don't have one in this fleet yet."""
    have = set(fleet.fats.values_list("character_id", flat=True))
    new = [(cid, ship, system) for cid, ship, system in members if cid not in have]
    if not new:
        return 0
    ids = {cid for cid, _, _ in new}
    names = dict(Character.objects.filter(pk__in=ids).values_list("pk", "name"))
    missing = ids - set(names)
    if missing:
        ensure_eve_names(missing)
        names |= names_for(missing)
    Fat.objects.bulk_create(
        [Fat(fleet=fleet, character_id=cid, character_name=names.get(cid, f"Character {cid}")[:100], ship_type_id=ship,
             solar_system_id=system, via=via, added_by=by) for cid, ship, system in new],
        ignore_conflicts=True,
    )
    return len(new)


# --- FAT links -----------------------------------------------------------------------------------------------------


def fleet_for_link(code: str) -> Fleet:
    fleet = Fleet.objects.filter(link_code=code).select_related("fleet_type", "fc__main_character").first()
    if fleet is None:
        raise FleetError("That FAT link doesn't exist", 404)
    return fleet


def register_by_link(user, code: str, character_ids: list[int]) -> int:
    fleet = fleet_for_link(code)
    if not fleet.link_active:
        raise FleetError("This FAT link has closed; ask the FC to add you")
    chars = list(Character.objects.filter(user=user, pk__in=character_ids))
    if not chars:
        raise FleetError("Pick at least one of your characters")
    return record(fleet, [(c.pk, None, None) for c in chars], Fat.Via.LINK, by=user)


# --- attendance ----------------------------------------------------------------------------------------------------


def user_fats(user, days: int | None = None, type_names: list[str] | None = None):
    """FATs of the characters the user owns now."""
    qs = Fat.objects.filter(character_id__in=user.characters.values_list("pk", flat=True))
    if days:
        qs = qs.filter(fleet__started_at__gte=timezone.now() - timedelta(days=days))
    if type_names:
        qs = qs.filter(fleet__fleet_type__name__in=type_names)
    return qs


def fleets_attended(user, days: int | None = None, type_names: list[str] | None = None, min_pilots: int = 1) -> int:
    """Fleets the user flew in with any character (two characters in one fleet count once).

    FATs someone added by hand for their own characters don't count (an FC could otherwise hand themselves
    attendance), and with ``min_pilots`` only fleets with at least that many pilots count.
    """
    from django.db.models import Count

    qs = user_fats(user, days, type_names).exclude(via=Fat.Via.MANUAL, added_by=user)
    if min_pilots > 1:
        big = Fleet.objects.annotate(pilots=Count("fats")).filter(pilots__gte=min_pilots).values("pk")
        qs = qs.filter(fleet_id__in=big)
    return qs.values("fleet_id").distinct().count()


def my_attendance(user) -> dict:
    fats = list(user_fats(user).select_related("fleet__fleet_type", "fleet__fc__main_character").order_by("-fleet__started_at")[:200])
    now = timezone.now()
    by_fleet: dict[int, dict] = {}
    for f in fats:
        row = by_fleet.setdefault(f.fleet_id, {**fleet_brief(f.fleet), "characters": []})
        row["characters"].append(f.character_name)
    by_type: dict[str, int] = defaultdict(int)
    for row in by_fleet.values():
        if row["started_at"] >= (now - timedelta(days=30)).isoformat():
            by_type[row["type"]["name"] if row["type"] else "Other"] += 1
    return {
        "counts": {
            "days_30": fleets_attended(user, 30),
            "days_90": fleets_attended(user, 90),
            "all": fleets_attended(user),
        },
        "by_type_30": [{"type": k, "count": v} for k, v in sorted(by_type.items(), key=lambda kv: -kv[1])],
        "fleets": list(by_fleet.values())[:50],
    }


def leaderboard(days: int = 30, type_id: int | None = None) -> list[dict]:
    """Fleets attended per member (and per unregistered character) in the period."""
    fats = Fat.objects.filter(fleet__started_at__gte=timezone.now() - timedelta(days=days))
    if type_id:
        fats = fats.filter(fleet__fleet_type_id=type_id)
    rows = list(fats.values("fleet_id", "character_id", "character_name", "fleet__started_at"))
    owners = dict(Character.objects.filter(pk__in={r["character_id"] for r in rows}).values_list("pk", "user_id"))
    users = {u.pk: u for u in User.objects.filter(pk__in=set(owners.values())).select_related("main_character")}
    members: dict[str, dict] = {}
    for r in rows:
        uid = owners.get(r["character_id"])
        key = f"u{uid}" if uid else f"c{r['character_id']}"
        if key not in members:
            u = users.get(uid)
            members[key] = {
                "key": key, "user_id": uid, "registered": uid is not None,
                "name": u.display_name if u else r["character_name"],
                "portrait": portrait_url((u.main_character_id if u else None) or r["character_id"], 64),
                "fleets": set(), "characters": set(), "last": r["fleet__started_at"],
            }
        m = members[key]
        m["fleets"].add(r["fleet_id"])
        m["characters"].add(r["character_name"])
        m["last"] = max(m["last"], r["fleet__started_at"])
    out = [{**m, "fleets": len(m["fleets"]), "characters": sorted(m["characters"]), "last": m["last"].isoformat()} for m in members.values()]
    return sorted(out, key=lambda m: (-m["fleets"], m["name"].lower()))


# --- output ----------------------------------------------------------------------------------------------------------


def type_out(t: FleetType | None) -> dict | None:
    return {"id": t.pk, "name": t.name, "color": t.color} if t else None


def fleet_brief(f: Fleet) -> dict:
    fc = f.fc
    return {
        "id": f.pk,
        "name": f.name,
        "type": type_out(f.fleet_type),
        "fc": {"id": fc.pk, "name": fc.display_name, "portrait": portrait_url(fc.main_character_id, 64) if fc.main_character_id else None} if fc else None,
        "started_at": f.started_at.isoformat(),
        "ended_at": f.ended_at.isoformat() if f.ended_at else None,
        "tracking": f.tracking,
    }


def fleet_list(user, q: str = "", type_id: int | None = None, limit: int = 100) -> list[dict]:
    qs = Fleet.objects.select_related("fleet_type", "fc__main_character").annotate(pilots=Count("fats"))
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(fc__main_character__name__icontains=q))
    if type_id:
        qs = qs.filter(fleet_type_id=type_id)
    mine = set(user_fats(user).values_list("fleet_id", flat=True))
    return [{**fleet_brief(f), "pilots": f.pilots, "attended": f.pk in mine} for f in qs[:limit]]


def fleet_detail(fleet: Fleet, user) -> dict:
    fats = list(fleet.fats.all())
    owners = {c.pk: c.user for c in Character.objects.filter(pk__in=[f.character_id for f in fats]).select_related("user__main_character")}
    ships = dict(ItemType.objects.filter(pk__in={f.ship_type_id for f in fats if f.ship_type_id}).values_list("pk", "name"))
    systems = dict(SolarSystem.objects.filter(pk__in={f.solar_system_id for f in fats if f.solar_system_id}).values_list("pk", "name"))
    editable = can_edit(user, fleet)
    ships_count: dict[str, int] = defaultdict(int)
    rows = []
    for f in fats:
        owner = owners.get(f.character_id)
        ship = ships.get(f.ship_type_id) if f.ship_type_id else None
        if ship:
            ships_count[ship] += 1
        rows.append({
            "id": f.pk,
            "character": {"id": f.character_id, "name": f.character_name, "portrait": portrait_url(f.character_id, 64)},
            "member": {"id": owner.pk, "name": owner.display_name} if owner else None,
            "ship": {"id": f.ship_type_id, "name": ship, "icon": type_icon_url(f.ship_type_id, 32)} if f.ship_type_id else None,
            "system": systems.get(f.solar_system_id),
            "via": f.via,
            "at": f.created_at.isoformat(),
        })
    mine = {c for c in user.characters.values_list("pk", flat=True)}
    return {
        **fleet_brief(fleet),
        "notes": fleet.notes,
        "fats": rows,
        "pilots": len(rows),
        "members": len({r["member"]["id"] for r in rows if r["member"]}),
        "ships": [{"name": k, "count": v} for k, v in sorted(ships_count.items(), key=lambda kv: -kv[1])],
        "attended": any(f.character_id in mine for f in fats),
        "can_edit": editable,
        # The link and tracking details are for the people running the fleet.
        "link": {"code": fleet.link_code, "active": fleet.link_active, "expires_at": fleet.link_expires_at.isoformat() if fleet.link_expires_at else None} if editable else None,
        "tracking_info": {
            "character": {"id": fleet.tracking_character_id, "name": fleet.tracking_character.name} if fleet.tracking_character_id else None,
            "last_at": fleet.last_tracked_at.isoformat() if fleet.last_tracked_at else None,
            "error": fleet.tracking_error,
        } if editable else None,
    }


def fc_characters(user) -> list[dict]:
    """The user's characters, and whether each can track a fleet."""
    out = []
    for c in Character.objects.filter(user=user).select_related("token"):
        token = getattr(c, "token", None)
        out.append({"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "can_track": bool(token and token.has_scopes(FLEET_SCOPE))})
    return out
