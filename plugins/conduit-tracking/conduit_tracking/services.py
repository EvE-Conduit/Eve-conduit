"""Activity Tracking: start and stop following a member, and the report on what they did.

A session follows every character of one member (alts they link while it runs included) for 1 to 60 days.
``tracker`` polls where they are and what they fly; the report adds what Conduit already syncs for the same period:
the wallet journal (ISK in and out, and the systems bounties were paid in), the mining ledger and killmails.

The member is never told: nothing is sent to them, and only people with ``tracking.track_members`` see the plugin.
Starting, stopping, deleting and opening a report go in the audit log, and opening a report in the snooper log for
each of their characters, like opening their sheet. Nobody can track themselves, and a tracker only reaches members
whose characters their sheet permissions let them see.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.audit.services import record, record_snoop
from conduit.eve.models import portrait_url
from conduit.notify.services import notify
from conduit.sde.models import SolarSystem
from conduit.sheet.access import viewable_characters
from conduit.sheet.killmails.models import CharacterKillmail
from conduit.sheet.mining.models import MiningEntry
from conduit.sheet.models import Location
from conduit.sheet.util import prices_by_type, type_out, types_by_id
from conduit.sheet.wallet.models import JournalEntry

from . import tracker
from .models import Session, Stint, TrackedCharacter

PERM = "tracking.track_members"
MIN_DAYS, MAX_DAYS = 1, 60
LINK = "/p/tracking"
#: How many stints the report's timeline lists, newest first.
TIMELINE_LIMIT = 500
#: How many rows the report's ranked lists (systems, ships, ...) keep.
TOP = 25


class TrackingError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def others(viewer):
    """The characters the viewer's sheet permissions reach, but not their own: nobody tracks themselves."""
    return viewable_characters(viewer).exclude(user=viewer)


def visible(viewer):
    """Sessions on members the viewer can reach. Never sessions on the viewer."""
    return Session.objects.filter(target__in=others(viewer).values("user_id")).exclude(target=viewer)


def _iso(v):
    return v.isoformat() if v else None


def user_brief(u) -> dict:
    main = u.main_character
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(main.pk, 64) if main else None,
            "corporation": main.corporation.name if main and main.corporation else None}


# --- picking a member ----------------------------------------------------------------------------------------------


def find_members(viewer, q: str) -> list[dict]:
    """Members the viewer may track whose main or any alt matches ``q``, each with the alt that matched (None when the
    main did)."""
    q = q.strip()
    if len(q) < 2:
        return []
    hits = others(viewer).filter(name__icontains=q, user__main_character__isnull=False).select_related(
        "user__main_character__corporation")[:50]
    matched = {}
    for c in hits:
        if c.pk == c.user.main_character_id or c.user_id not in matched:
            matched[c.user_id] = c
    out = []
    for c in list(matched.values())[:20]:
        out.append({**user_brief(c.user), "matched": c.name if c.pk != c.user.main_character_id else None,
                    "characters": Character.objects.filter(user_id=c.user_id).count(),
                    "tracked": Session.objects.running().filter(target_id=c.user_id).exists()})
    return out


def why_nothing(viewer, q: str) -> str:
    """Why a search found nobody, when it isn't simply that no such character exists: "own" (it's one of the
    viewer's characters) or "no_reach" (no character sheet permission lets them see anyone else's characters)."""
    if Character.objects.filter(user=viewer, name__icontains=q.strip()).exists():
        return "own"
    if not others(viewer).exists():
        return "no_reach"
    return ""


# --- new members ---------------------------------------------------------------------------------------------------


def new_joiners(viewer, days: int) -> dict:
    """Who joined a corporation in the last ``days`` days, to start tracking them.

    ``members``: site members the viewer may track with a character whose current corporation it joined since then,
    grouped by member. The join date is the corporation's member tracking (when a Director's login syncs it) or else
    the character's own corporation history. ``unregistered``: characters a corporation's member tracking shows
    joining that nobody has added to the site, in corporations whose member list the viewer may see; they can't be
    tracked until they do.
    """
    from conduit.access.services import site_members
    from conduit.corp.access import can_view_section
    from conduit.corp.models import CorporationMember
    from conduit.eve.models import EveCorporation, EveName
    from conduit.sheet.overview.models import CorporationHistory

    since = timezone.now() - timedelta(days=days)
    joined: dict[tuple[int, int], datetime] = {}
    for cid, start_date, corp_id in CorporationHistory.objects.filter(start_date__gte=since, is_deleted=False).values_list(
            "character_id", "start_date", "corporation_id"):
        joined[(cid, corp_id)] = max(start_date, joined.get((cid, corp_id), start_date))
    tracking = list(CorporationMember.objects.filter(start_date__gte=since).values_list("character_id", "start_date", "corporation_id"))
    for cid, start_date, corp_id in tracking:
        joined[(cid, corp_id)] = start_date  # the corporation's own record wins

    registered = {c.pk: c for c in others(viewer).filter(
        pk__in={cid for cid, _ in joined}, user__in=site_members(), user__main_character__isnull=False,
    ).select_related("corporation", "user__main_character__corporation")}
    running = dict(Session.objects.running().filter(target_id__in={c.user_id for c in registered.values()}).values_list("target_id", "pk"))
    members: dict[int, dict] = {}
    for (cid, corp_id), at in joined.items():
        c = registered.get(cid)
        if c is None or c.corporation_id != corp_id:  # only the corporation they're in now
            continue
        m = members.setdefault(c.user_id, {**user_brief(c.user), "tracked": c.user_id in running, "session_id": running.get(c.user_id),
                                           "joined_at": at, "characters": []})
        m["joined_at"] = max(m["joined_at"], at)
        m["characters"].append({"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "main": c.pk == c.user.main_character_id,
                                "corporation": c.corporation.name if c.corporation else None, "joined_at": _iso(at)})
    out = sorted(members.values(), key=lambda m: m["joined_at"], reverse=True)
    for m in out:
        m["joined_at"] = _iso(m["joined_at"])
        m["characters"].sort(key=lambda c: (not c["main"], c["name"]))

    known = set(Character.objects.filter(pk__in={cid for cid, _, _ in tracking}).values_list("pk", flat=True))
    corps = {c.pk: c for c in EveCorporation.objects.filter(pk__in={corp for _, _, corp in tracking})}
    visible_corps = {pk for pk, c in corps.items() if can_view_section(viewer, c, "members")}
    strangers = [(cid, at, corp) for cid, at, corp in tracking if cid not in known and corp in visible_corps]
    names = dict(EveName.objects.filter(pk__in={cid for cid, _, _ in strangers}).values_list("pk", "name"))
    unregistered = [{"id": cid, "name": names.get(cid, f"Character {cid}"), "portrait": portrait_url(cid, 64),
                     "corporation": corps[corp].name, "joined_at": _iso(at)}
                    for cid, at, corp in sorted(strangers, key=lambda r: r[1], reverse=True)]
    return {"days": days, "members": out, "unregistered": unregistered}


def start_many(viewer, user_ids: list[int], days: int, reason: str = "", request=None) -> dict:
    """Start tracking several members at once. One that can't be (already tracked, out of reach) doesn't stop the rest."""
    started, failed = [], []
    for uid in dict.fromkeys(user_ids):
        try:
            started.append(session_out(start(viewer, uid, days, reason, request=request)))
        except TrackingError as exc:
            failed.append({"user_id": uid, "error": str(exc)})
    return {"started": started, "failed": failed}


# --- starting and stopping -----------------------------------------------------------------------------------------


def start(viewer, target_id: int, days: int, reason: str = "", request=None) -> Session:
    if not MIN_DAYS <= days <= MAX_DAYS:
        raise TrackingError(f"Track for {MIN_DAYS} to {MAX_DAYS} days")
    target = get_user_model().objects.filter(pk=target_id).select_related("main_character").first()
    if target is None or not others(viewer).filter(user=target).exists():
        raise TrackingError("You can't track that member", 404)
    if target.main_character is None:
        raise TrackingError("That member has no main character")
    for s in tracker.finish_expired():
        tell_finished(s)
    now = timezone.now()
    try:
        with transaction.atomic():
            session = Session.objects.create(target=target, target_name=target.main_character.name, started_by=viewer,
                                             reason=reason.strip(), days=days, started_at=now, ends_at=now + timedelta(days=days))
    except IntegrityError:
        raise TrackingError(f"{target.display_name} is already being tracked; stop that first", 409) from None
    TrackedCharacter.objects.bulk_create([TrackedCharacter(session=session, character_id=c.pk, name=c.name)
                                          for c in Character.objects.filter(user=target)])
    record("tracking.started", f"started tracking {target.display_name} for {days} day{'s' if days != 1 else ''}",
           request=request, actor=viewer, target=target, details={"session": session.pk, "days": days, "reason": session.reason})
    return session


def stop(session: Session, viewer, request=None) -> Session:
    if session.ended_at is not None:
        raise TrackingError("This tracking has already finished")
    session.ended_at = min(timezone.now(), session.ends_at)
    session.stopped_by = viewer
    session.save(update_fields=["ended_at", "stopped_by"])
    TrackedCharacter.objects.filter(session=session).update(current_stint=None)
    record("tracking.stopped", f"stopped tracking {session.target_name}", request=request, actor=viewer,
           target=session.target, details={"session": session.pk})
    return session


def delete(session: Session, viewer, request=None) -> None:
    record("tracking.deleted", f"deleted the activity tracking of {session.target_name} started {session.started_at:%Y-%m-%d}",
           request=request, actor=viewer, target=session.target, details={"session": session.pk})
    session.delete()


def tell_finished(session: Session) -> None:
    """Tell whoever started it that the report is complete. Never the member."""
    if session.started_by_id and session.stopped_by_id is None:
        notify(session.started_by, f"Tracking of {session.target_name} finished",
               f"The {session.days}-day activity report is complete.", link=f"{LINK}/{session.pk}", category="p.tracking")


# --- lists ---------------------------------------------------------------------------------------------------------


def session_out(s: Session) -> dict:
    return {
        "id": s.pk,
        "target": user_brief(s.target),
        "target_name": s.target_name,
        "started_by": s.started_by.display_name if s.started_by else None,
        "stopped_by": s.stopped_by.display_name if s.stopped_by else None,
        "reason": s.reason,
        "days": s.days,
        "started_at": _iso(s.started_at),
        "ends_at": _iso(s.ends_at),
        "ended_at": _iso(s.ended_at),
        "running": s.running,
    }


def sessions_qs(viewer, state: str = ""):
    qs = visible(viewer).select_related("target__main_character__corporation", "started_by__main_character",
                                         "stopped_by__main_character")
    if state == "running":
        qs = qs.filter(ended_at__isnull=True, ends_at__gt=timezone.now())
    elif state == "finished":
        qs = qs.filter(Q(ended_at__isnull=False) | Q(ends_at__lte=timezone.now()))
    return qs


# --- the report ----------------------------------------------------------------------------------------------------


def _hours(start: datetime, end: datetime):
    """Split [start, end) at EVE-time hour boundaries: (hour start, seconds) pieces."""
    t = start
    while t < end:
        hour = t.replace(minute=0, second=0, microsecond=0)
        nxt = min(hour + timedelta(hours=1), end)
        yield hour, (nxt - t).total_seconds()
        t = nxt


def _ranked(totals: dict, chars: dict, out, limit: int = TOP) -> list[dict]:
    keys = sorted(totals, key=lambda k: -totals[k])[:limit]
    return [{**out(k), "seconds": round(totals[k]), "characters": sorted(chars[k])} for k in keys]


def report(session: Session, request=None) -> dict:
    """Everything the session saw, plus what the member's characters' synced data says about the same period."""
    start, end = session.started_at, session.period_end
    tracked = list(session.characters.all())
    names = {t.character_id: t.name for t in tracked}
    for c in Character.objects.filter(user_id=session.target_id):
        names.setdefault(c.pk, c.name)
    ids = set(names)

    if request is not None:
        for c in Character.objects.filter(pk__in=ids).select_related("user"):
            record_snoop(request, c, "tracking")
        record("tracking.report_viewed", f"opened the activity report on {session.target_name}", request=request,
               target=session.target, details={"session": session.pk})

    stints = list(Stint.objects.filter(session=session).order_by("started_at"))
    # Wallet: money moved between the member's own characters is neither earned nor spent.
    journal = list(JournalEntry.objects.filter(character_id__in=ids, date__gte=start, date__lte=end)
                   .exclude(first_party_id__in=ids, second_party_id__in=ids).exclude(amount__isnull=True)
                   .values_list("ref_type", "amount", "context_id", "context_id_type", "character_id"))
    mining = list(MiningEntry.objects.filter(character_id__in=ids, date__gte=start.date(), date__lte=end.date())
                  .values_list("type_id", "solar_system_id", "quantity"))
    kms = list(CharacterKillmail.objects.filter(character_id__in=ids, killmail__time__gte=start, killmail__time__lte=end)
               .select_related("killmail").order_by("-killmail__time"))
    system_ids = ({st.solar_system_id for st in stints} | {m[1] for m in mining} | {k.killmail.solar_system_id for k in kms}
                  | {j[2] for j in journal if j[3] == "system_id" and j[2]})
    systems = {s.id: s for s in SolarSystem.objects.filter(pk__in=system_ids).select_related("region")}

    def system_out(sid):
        s = systems.get(sid)
        return {"id": sid, "name": s.name if s else f"System {sid}", "security": s.display_security if s else None,
                "region": s.region.name if s else ""}

    by_system, by_ship, by_region, by_dock = (defaultdict(float) for _ in range(4))
    sys_chars, ship_chars, region_chars, dock_chars = (defaultdict(set) for _ in range(4))
    per_char = defaultdict(lambda: {"seconds": 0.0, "docked": 0.0, "systems": defaultdict(float), "ships": defaultdict(float)})
    by_day, by_hour = defaultdict(float), [0.0] * 24
    for st in stints:
        secs = (st.ended_at - st.started_at).total_seconds()
        who = names.get(st.character_id, str(st.character_id))
        by_system[st.solar_system_id] += secs
        sys_chars[st.solar_system_id].add(who)
        region = systems[st.solar_system_id].region.name if st.solar_system_id in systems else "Unknown"
        by_region[region] += secs
        region_chars[region].add(who)
        if st.ship_type_id:
            by_ship[st.ship_type_id] += secs
            ship_chars[st.ship_type_id].add(who)
        if st.docked_at:
            by_dock[st.docked_at] += secs
            dock_chars[st.docked_at].add(who)
        pc = per_char[st.character_id]
        pc["seconds"] += secs
        pc["docked"] += secs if st.docked_at else 0
        pc["systems"][st.solar_system_id] += secs
        if st.ship_type_id:
            pc["ships"][st.ship_type_id] += secs
        for hour, s in _hours(st.started_at, st.ended_at):
            by_day[hour.date().isoformat()] += s
            by_hour[hour.hour] += s

    income, spending, isk_systems = defaultdict(float), defaultdict(float), defaultdict(float)
    earned_by_char = defaultdict(float)
    earned = spent = 0.0
    for ref_type, amount, ctx, ctx_type, cid in journal:
        a = float(amount)
        if a > 0:
            earned += a
            income[ref_type] += a
            earned_by_char[cid] += a
            if ctx_type == "system_id" and ctx:
                isk_systems[ctx] += a
        else:
            spent -= a
            spending[ref_type] -= a

    km_ships = defaultdict(int)
    for ck in kms:
        km = ck.killmail
        if ck.is_loss:
            km_ships[km.victim_ship_type_id] += 1
        else:
            for a in km.data.get("attackers", []):
                if a.get("character_id") == ck.character_id and a.get("ship_type_id"):
                    km_ships[a["ship_type_id"]] += 1
    types = types_by_id(set(by_ship) | set(km_ships) | {k.killmail.victim_ship_type_id for k in kms} | {m[0] for m in mining})
    prices = prices_by_type({m[0] for m in mining})

    ore, ore_systems = defaultdict(lambda: [0, 0.0]), defaultdict(float)
    for type_id, sid, qty in mining:
        value = qty * prices.get(type_id, 0)
        ore[type_id][0] += qty
        ore[type_id][1] += value
        ore_systems[sid] += value

    docks = {loc.id: loc for loc in Location.objects.filter(pk__in=set(by_dock))}
    online_total = sum(by_system.values())
    tracked_by_id = {t.character_id: t for t in tracked}
    current = {t.current_stint_id for t in tracked if t.current_stint_id}

    def top(d):
        return max(d, key=d.get) if d else None

    characters = []
    for cid, name in sorted(names.items(), key=lambda kv: (-per_char[kv[0]]["seconds"], kv[1])):
        t = tracked_by_id.get(cid)
        pc = per_char[cid]
        now_at = next((st for st in reversed(stints) if st.pk in current and st.character_id == cid), None)
        characters.append({
            "id": cid, "name": name, "portrait": portrait_url(cid, 64),
            "status": t.status if t else "pending", "status_label": t.get_status_display() if t else "Not polled yet",
            "status_detail": t.status_detail if t else "",
            "online": t.online if t else None, "last_polled_at": _iso(t.last_polled_at) if t else None,
            "seconds": round(pc["seconds"]), "docked_seconds": round(pc["docked"]),
            "top_system": system_out(top(pc["systems"])) if pc["systems"] else None,
            "top_ship": type_out(top(pc["ships"]), types) if pc["ships"] else None,
            "earned": round(earned_by_char[cid], 2),
            "now": {"system": system_out(now_at.solar_system_id),
                    "ship": type_out(now_at.ship_type_id, types) if now_at.ship_type_id else None,
                    "docked": bool(now_at.docked_at)} if now_at else None,
        })

    return {
        "session": session_out(session),
        "period": {"start": _iso(start), "end": _iso(end)},
        "totals": {
            "online_seconds": round(online_total),
            "docked_seconds": round(sum(by_dock.values())),
            "systems": len(by_system),
            "regions": len(by_region),
            "ships": len(by_ship),
            "earned": round(earned, 2),
            "spent": round(spent, 2),
            "kills": sum(1 for k in kms if not k.is_loss),
            "losses": sum(1 for k in kms if k.is_loss),
            "isk_destroyed": round(sum(k.killmail.value for k in kms if not k.is_loss)),
            "isk_lost": round(sum(k.killmail.value for k in kms if k.is_loss)),
            "mined_value": round(sum(v[1] for v in ore.values())),
        },
        "characters": characters,
        "systems": _ranked(by_system, sys_chars, system_out),
        "regions": _ranked(by_region, region_chars, lambda r: {"name": r}),
        "ships": _ranked(by_ship, ship_chars, lambda t: type_out(t, types)),
        "docked": _ranked(by_dock, dock_chars, lambda i: {"id": i, "name": docks[i].name if i in docks else f"Location {i}"}, 10),
        "by_day": [{"day": d, "seconds": round(s)} for d, s in sorted(by_day.items())],
        "by_hour": [round(s) for s in by_hour],
        "income": [{"ref_type": k, "amount": round(v, 2)} for k, v in sorted(income.items(), key=lambda kv: -kv[1])],
        "spending": [{"ref_type": k, "amount": round(v, 2)} for k, v in sorted(spending.items(), key=lambda kv: -kv[1])],
        "isk_systems": [{**system_out(k), "amount": round(v, 2)} for k, v in sorted(isk_systems.items(), key=lambda kv: -kv[1])[:TOP]],
        "mining": [{**type_out(k, types), "quantity": v[0], "value": round(v[1])} for k, v in sorted(ore.items(), key=lambda kv: -kv[1][1])],
        "mining_systems": [{**system_out(k), "value": round(v)} for k, v in sorted(ore_systems.items(), key=lambda kv: -kv[1])],
        "killmails": [{
            "id": k.killmail.id, "hash": k.killmail.hash, "time": _iso(k.killmail.time), "is_loss": k.is_loss,
            "character": names.get(k.character_id, str(k.character_id)), "system": system_out(k.killmail.solar_system_id),
            "victim_ship": type_out(k.killmail.victim_ship_type_id, types), "value": round(k.killmail.value),
        } for k in kms[:100]],
        "killmail_ships": [{**type_out(k, types), "count": v} for k, v in sorted(km_ships.items(), key=lambda kv: -kv[1])],
        "timeline": [{
            "character": names.get(st.character_id, str(st.character_id)), "system": system_out(st.solar_system_id),
            "ship": type_out(st.ship_type_id, types) if st.ship_type_id else None, "ship_name": st.ship_name,
            "docked": (docks[st.docked_at].name if st.docked_at in docks else f"Location {st.docked_at}") if st.docked_at else None,
            "started_at": _iso(st.started_at), "ended_at": _iso(st.ended_at),
            "seconds": round((st.ended_at - st.started_at).total_seconds()),
        } for st in reversed(stints[-TIMELINE_LIMIT:])],
        "timeline_total": len(stints),
    }
