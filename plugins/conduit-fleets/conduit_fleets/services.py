"""Fleets and FATs (fleet attendance).

Attendance is recorded three ways:

- **Tracking:** the FC picks one of their characters that is fleet boss in game. Every minute the members of that
  in-game fleet are read from ESI (``esi-fleets.read_fleet.v1``) and everyone in it gets a FAT.
- **FAT link:** pilots open the fleet's link and register the characters they flew with.
- **Manually:** the FC or a fleet manager adds a character.

A fleet has FAT rounds: the FC can start another one (e.g. every hour of a long op), and a character gets at most one
FAT per round. Attendance counts FATs, and belongs to whoever owns the character now.

Once a fleet has been tracked, its FAT link only takes characters ESI saw in the in-game fleet this round (who already
have their FAT), so nobody can register characters that weren't there.

While a fleet is tracked, a few FAT lines (that FATs are automatic, the round and how many pilots, no names) are added
to the bottom of the in-game fleet's MOTD (``esi-fleets.write_fleet.v1``) and rewritten when they change. Whatever the
FC wrote above them stays.
"""

from __future__ import annotations

import logging
import re
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
MOTD_SCOPE = "esi-fleets.write_fleet.v1"
#: Starts the FAT lines in the MOTD. From the line it's on to the end of the MOTD is ours and gets replaced; the FC's
#: text above it is kept.
MOTD_TAG = "FATs by EvE Conduit"
#: The shortest time between FAT rounds, so a fleet can't be turned into a pile of FATs.
MIN_ROUND_GAP = timedelta(minutes=15)
#: EVE colours are ARGB: fully opaque green.
MOTD_COLOR = "#ff00ff00"
#: Empty lines between the FC's MOTD and the FAT lines.
MOTD_GAP = 2
_BR = re.compile(r"<br\s*/?>", re.I)
#: Line breaks at the end of the kept MOTD (the gap we added), possibly followed by closing tags the client moved.
_TRAILING_BR = re.compile(r"(?:<br\s*/?>\s*)+((?:</[^>]+>\s*)*)$", re.I)
_TAG = re.compile(r"<[^>]*>")
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
    was_tracking = fleet.tracking
    fleet.ended_at = timezone.now()
    fleet.tracking = False
    fleet.link_open = False
    fleet.save(update_fields=["ended_at", "tracking", "link_open"])
    if was_tracking:
        try:
            update_motd(fleet)  # "Fleet ended: N pilots got a FAT"
        except Exception:  # ending the fleet mustn't fail over the MOTD
            log.exception("Writing the MOTD of fleet %s failed", fleet.pk)
    pilots = pilot_count(fleet)
    bus.emit("fleets.ended", fleet_id=fleet.pk, fleet=fleet.name, pilots=pilots, title=f"Fleet ended: {fleet.name}",
             summary=f"{pilots} pilot{'s' if pilots != 1 else ''} got a FAT", link=f"/p/fleets/{fleet.pk}", level="success")
    return fleet


# --- tracking the in-game fleet ------------------------------------------------------------------------------------


def start_tracking(fleet: Fleet, character_id: int, by, motd: bool = True) -> Fleet:
    """Follow the in-game fleet ``character_id`` is boss of, and with ``motd`` put the FAT lines in its MOTD."""
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
    fleet.motd, fleet.motd_written, fleet.motd_error = motd, "", ""
    fleet.save(update_fields=["tracking_character", "esi_fleet_id", "tracking", "tracking_error", "motd", "motd_written", "motd_error"])
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
    update_motd(fleet)
    return added


# --- the in-game fleet's MOTD --------------------------------------------------------------------------------------


def _pilots(n: int) -> str:
    return f"{n} pilot{'s' if n != 1 else ''}"


def motd_lines(fleet: Fleet) -> str:
    """The FAT lines for the bottom of the MOTD, in EVE's MOTD markup. Counts only: who has a FAT isn't shown."""
    lines = [f"<b>--- {MOTD_TAG} ---</b>"]
    if fleet.ended_at:
        lines.append(f"Fleet ended: {_pilots(pilot_count(fleet))} got a FAT")
    else:
        now = fleet.fats.filter(round=fleet.fat_round).count()
        round_text = f"FAT round {fleet.fat_round}: " if fleet.fat_round > 1 else ""
        lines.append(f"Everyone in fleet gets a FAT automatically. {round_text}{_pilots(now)} so far")
    return f'<font color="{MOTD_COLOR}">' + "<br>".join(lines) + "</font>"


def with_fat_lines(motd: str, lines: str) -> str:
    """``motd`` with our old FAT lines (if any) replaced by ``lines`` at the bottom."""
    at = motd.find(MOTD_TAG)
    if at >= 0:
        breaks = list(_BR.finditer(motd, 0, at))
        motd = motd[: breaks[-1].start()] if breaks else ""
        # Take our gap off too, or it would grow by one each time.
        while (trimmed := _TRAILING_BR.sub(r"\1", motd)) != motd:
            motd = trimmed
    if not lines:
        return motd
    return motd + "<br>" * (MOTD_GAP + 1) + lines if _TAG.sub("", motd).strip() else lines


def update_motd(fleet: Fleet) -> None:
    """Bring the FAT lines in the in-game fleet's MOTD up to date (or take them out when the FC switched them off)."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

    char = fleet.tracking_character
    if not fleet.esi_fleet_id or char is None:
        return
    lines = motd_lines(fleet) if fleet.motd else ""
    if lines == fleet.motd_written:
        return
    token = getattr(char, "token", None)
    if token is None or not token.has_scopes(MOTD_SCOPE):
        error = f"{char.name} hasn't allowed editing the fleet MOTD; log in with it again (Characters → Add character)"
        if fleet.motd_error != error:
            fleet.motd_error = error
            fleet.save(update_fields=["motd_error"])
        return
    path = f"/fleets/{fleet.esi_fleet_id}"
    try:
        current = (esi().get(path, character=char, cache_response=False).data or {}).get("motd") or ""
        esi().put(path, {"motd": with_fat_lines(current, lines)}, character=char)
        error = ""
    except (EsiBackoff, TokenInvalid):
        return  # try again next minute; tracking reports a login that stopped working
    except EsiError as exc:
        # Not again until the lines change: every failed call counts against the ESI error limit.
        error = (f"{char.name} is no longer the fleet boss" if exc.status in (403, 404)
                 else f"ESI didn't take the new MOTD ({exc.status})")
    fleet.motd_written, fleet.motd_error = lines, error
    fleet.save(update_fields=["motd_written", "motd_error"])


def set_motd(fleet: Fleet, on: bool) -> Fleet:
    fleet.motd = on
    fleet.motd_error = ""
    fleet.save(update_fields=["motd", "motd_error"])
    if fleet.tracking:
        update_motd(fleet)
    return fleet


def track_all() -> int:
    total = 0
    for fleet in Fleet.objects.filter(tracking=True).select_related("tracking_character"):
        try:
            total += poll(fleet)
        except Exception:  # one fleet must not stop the others
            log.exception("Tracking fleet %s failed", fleet.pk)
    return total


def new_round(fleet: Fleet) -> Fleet:
    """Start the next FAT round: everyone in the fleet from now on gets another FAT."""
    if fleet.ended_at:
        raise FleetError("This fleet has ended")
    since = timezone.now() - (fleet.round_started_at or fleet.started_at)
    if since < MIN_ROUND_GAP:
        wait = int((MIN_ROUND_GAP - since).total_seconds() // 60) + 1
        raise FleetError(f"FAT rounds are at least {int(MIN_ROUND_GAP.total_seconds() // 60)} minutes apart; "
                         f"the next one can start in {wait} minute{'s' if wait != 1 else ''}")
    fleet.fat_round += 1
    fleet.round_started_at = timezone.now()
    fleet.save(update_fields=["fat_round", "round_started_at"])
    if fleet.tracking:
        poll(fleet)  # everyone in the in-game fleet now gets this round's FAT straight away
    return fleet


def pilot_count(fleet: Fleet) -> int:
    """Characters with at least one FAT in the fleet."""
    return fleet.fats.values("character_id").distinct().count()


def record(fleet: Fleet, members: list[tuple[int, int | None, int | None]], via: str, by=None) -> int:
    """FATs in the current round for (character id, ship type, system) rows that don't have one in it yet."""
    have = set(fleet.fats.filter(round=fleet.fat_round).values_list("character_id", flat=True))
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
        [Fat(fleet=fleet, round=fleet.fat_round, character_id=cid, character_name=names.get(cid, f"Character {cid}")[:100], ship_type_id=ship,
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


def link_allowed(fleet: Fleet) -> set[int] | None:
    """Characters the FAT link may register, or None for any of the pilot's own.

    Once a fleet has been tracked, only characters ESI saw in the in-game fleet this round: the link mustn't let
    anyone register characters that weren't there."""
    if not fleet.esi_fleet_id:
        return None
    return set(fleet.fats.filter(round=fleet.fat_round, via=Fat.Via.ESI).values_list("character_id", flat=True))


def register_by_link(user, code: str, character_ids: list[int]) -> int:
    fleet = fleet_for_link(code)
    if not fleet.link_active:
        raise FleetError("This FAT link has closed; ask the FC to add you")
    chars = list(Character.objects.filter(user=user, pk__in=character_ids))
    if not chars:
        raise FleetError("Pick at least one of your characters")
    allowed = link_allowed(fleet)
    if allowed is not None:
        unseen = [c.name for c in chars if c.pk not in allowed]
        if unseen:
            raise FleetError(f"{', '.join(unseen)} {'wasn' if len(unseen) == 1 else 'weren'}'t seen in the in-game fleet. "
                             "This fleet is tracked: everyone in it gets a FAT by itself within a minute.")
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
    """The user's FATs: one per fleet and FAT round they flew in with any character (two characters count once).

    FATs someone added by hand for their own characters don't count (an FC could otherwise hand themselves
    attendance), and with ``min_pilots`` only fleets with at least that many pilots count.
    """
    qs = user_fats(user, days, type_names).exclude(via=Fat.Via.MANUAL, added_by=user)
    if min_pilots > 1:
        big = Fleet.objects.annotate(pilots=Count("fats__character_id", distinct=True)).filter(pilots__gte=min_pilots).values("pk")
        qs = qs.filter(fleet_id__in=big)
    return qs.values("fleet_id", "round").distinct().count()


def my_attendance(user) -> dict:
    fats = list(user_fats(user).select_related("fleet__fleet_type", "fleet__fc__main_character").order_by("-fleet__started_at")[:200])
    now = timezone.now()
    by_fleet: dict[int, dict] = {}
    for f in fats:
        row = by_fleet.setdefault(f.fleet_id, {**fleet_brief(f.fleet), "characters": [], "rounds": set()})
        if f.character_name not in row["characters"]:
            row["characters"].append(f.character_name)
        row["rounds"].add(f.round)
    by_type: dict[str, int] = defaultdict(int)
    for row in by_fleet.values():
        row["fats"] = len(row.pop("rounds"))
        if row["started_at"] >= (now - timedelta(days=30)).isoformat():
            by_type[row["type"]["name"] if row["type"] else "Other"] += row["fats"]
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
    """FATs and fleets per member (and per unregistered character) in the period."""
    fats = Fat.objects.filter(fleet__started_at__gte=timezone.now() - timedelta(days=days))
    if type_id:
        fats = fats.filter(fleet__fleet_type_id=type_id)
    rows = list(fats.values("fleet_id", "round", "character_id", "character_name", "fleet__started_at"))
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
                "fats": set(), "fleets": set(), "characters": set(), "last": r["fleet__started_at"],
            }
        m = members[key]
        m["fats"].add((r["fleet_id"], r["round"]))
        m["fleets"].add(r["fleet_id"])
        m["characters"].add(r["character_name"])
        m["last"] = max(m["last"], r["fleet__started_at"])
    out = [{**m, "fats": len(m["fats"]), "fleets": len(m["fleets"]), "characters": sorted(m["characters"]), "last": m["last"].isoformat()}
           for m in members.values()]
    return sorted(out, key=lambda m: (-m["fats"], -m["fleets"], m["name"].lower()))


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
        "round": f.fat_round,
    }


def fleet_list(user, q: str = "", type_id: int | None = None, limit: int = 100) -> list[dict]:
    qs = Fleet.objects.select_related("fleet_type", "fc__main_character").annotate(pilots=Count("fats__character_id", distinct=True))
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
    # Each pilot's ship in their latest round.
    flown: dict[int, str] = {}
    for f in sorted(fats, key=lambda f: f.round):
        if f.ship_type_id and ships.get(f.ship_type_id):
            flown[f.character_id] = ships[f.ship_type_id]
    ships_count: dict[str, int] = defaultdict(int)
    for ship in flown.values():
        ships_count[ship] += 1
    rounds: dict[int, int] = defaultdict(int)
    rows = []
    for f in fats:
        owner = owners.get(f.character_id)
        ship = ships.get(f.ship_type_id) if f.ship_type_id else None
        rounds[f.round] += 1
        rows.append({
            "id": f.pk,
            "round": f.round,
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
        "fat_count": len(rows),
        "pilots": len({r["character"]["id"] for r in rows}),
        "rounds": [{"round": n, "pilots": rounds.get(n, 0)} for n in range(fleet.fat_round, 0, -1)],
        "round_started_at": fleet.round_started_at.isoformat() if fleet.round_started_at else None,
        "members": len({r["member"]["id"] for r in rows if r["member"]}),
        "ships": [{"name": k, "count": v} for k, v in sorted(ships_count.items(), key=lambda kv: -kv[1])],
        "attended": any(f.character_id in mine for f in fats),
        "can_edit": editable,
        # The link and tracking details are for the people running the fleet.
        "link": {"code": fleet.link_code, "active": fleet.link_active, "tracked_only": fleet.esi_fleet_id is not None, "expires_at": fleet.link_expires_at.isoformat() if fleet.link_expires_at else None} if editable else None,
        "tracking_info": {
            "character": {"id": fleet.tracking_character_id, "name": fleet.tracking_character.name} if fleet.tracking_character_id else None,
            "last_at": fleet.last_tracked_at.isoformat() if fleet.last_tracked_at else None,
            "error": fleet.tracking_error,
            "motd": fleet.motd,
            "motd_error": fleet.motd_error,
        } if editable else None,
    }


def fc_characters(user) -> list[dict]:
    """The user's characters, and whether each can track a fleet."""
    out = []
    for c in Character.objects.filter(user=user).select_related("token"):
        token = getattr(c, "token", None)
        out.append({"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "can_track": bool(token and token.has_scopes(FLEET_SCOPE)),
                    "can_motd": bool(token and token.has_scopes(MOTD_SCOPE))})
    return out
