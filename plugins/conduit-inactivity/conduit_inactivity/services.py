"""Inactivity: who has gone quiet, and leave of absence.

A member's activity comes from three signals, each switched on or off under Settings:

- **site**: when they last signed in to EvE Conduit (``User.last_login``);
- **game**: when any of their characters last logged in or out of EVE (the character sheet's location data, and the
  corporation member tracking a Director's login gives);
- **fleets**: their last FAT, when the Fleets plugin is installed and on.

They're active while the latest switched-on signal is within the limit (and never counted from before they joined the
site), or while an approved leave of absence runs. The daily check stores the result in ``Activity`` and tells people
with ``inactivity.view_inactivity`` who went quiet since the last time, in one notification.
"""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone

from conduit.access.models import State
from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm

from .models import Activity, InactivitySettings, Leave

VIEW_PERM = "inactivity.view_inactivity"
MANAGE_PERM = "inactivity.manage_leave"
SIGNALS = ("site", "game", "fleets")


class InactivityError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_see_list(user) -> bool:
    return user.has_perm(VIEW_PERM) or user.has_perm(MANAGE_PERM)


def fleets_available() -> bool:
    from conduit.plugins.services import is_enabled

    return is_enabled("fleets")


# --- who is checked ------------------------------------------------------------------------------------------------


def checked_users(s: InactivitySettings | None = None):
    """Members the settings say to check: every member, narrowed to the chosen states and groups."""
    from conduit.access.services import site_members

    s = s or InactivitySettings.load()
    qs = site_members()
    state_ids = list(s.states.values_list("pk", flat=True))
    group_ids = list(s.groups.values_list("pk", flat=True))
    if state_ids:
        qs = qs.filter(state_id__in=state_ids)
    if group_ids:
        qs = qs.filter(groups__in=group_ids)
    return qs.distinct()


# --- signals -------------------------------------------------------------------------------------------------------


def _latest(*values):
    values = [v for v in values if v is not None]
    return max(values) if values else None


def _game_signal(user_ids) -> dict[int, datetime]:
    """Each user's latest EVE login or logout over all their characters (someone online now counts as now)."""
    from conduit.accounts.models import Character
    from conduit.corp.models import CorporationMember
    from conduit.sheet.overview.models import CharacterInfo

    owner = dict(Character.objects.filter(user_id__in=user_ids).values_list("pk", "user_id"))
    out: dict[int, datetime] = {}

    def bump(char_id, when):
        uid = owner.get(char_id)
        if uid is not None and when is not None:
            out[uid] = _latest(out.get(uid), when)

    now = timezone.now()
    for cid, login, logout, online in CharacterInfo.objects.filter(character_id__in=owner).values_list(
            "character_id", "last_login", "last_logout", "online"):
        bump(cid, now if online else _latest(login, logout))
    for cid, logon, logoff in CorporationMember.objects.filter(character_id__in=owner).values_list(
            "character_id", "logon_date", "logoff_date"):
        bump(cid, _latest(logon, logoff))
    return out


def _fleet_signal(user_ids) -> dict[int, datetime]:
    """Each user's latest fleet with a FAT, from the Fleets plugin. FATs people added by hand for themselves don't count."""
    if not fleets_available():
        return {}
    from conduit.accounts.models import Character
    from conduit_fleets.models import Fat

    owner = dict(Character.objects.filter(user_id__in=user_ids).values_list("pk", "user_id"))
    rows = (Fat.objects.filter(character_id__in=owner)
            .values("character_id", "added_by_id", "via").annotate(last=Max("fleet__started_at")))
    out: dict[int, datetime] = {}
    for r in rows:
        uid = owner[r["character_id"]]
        if r["via"] == Fat.Via.MANUAL and r["added_by_id"] == uid:
            continue
        out[uid] = _latest(out.get(uid), r["last"])
    return out


def _signals(users) -> dict[int, dict]:
    ids = [u.pk for u in users]
    game = _game_signal(ids)
    fleets = _fleet_signal(ids)
    return {u.pk: {"site": u.last_login, "game": game.get(u.pk), "fleets": fleets.get(u.pk)} for u in users}


def _last_active(user, signals: dict, s: InactivitySettings):
    used = [signals[k] for k in SIGNALS if getattr(s, f"use_{k}")]
    return _latest(*used, user.date_joined)


# --- leave -----------------------------------------------------------------------------------------------------------


def _today() -> date:
    return timezone.localdate()


def current_leave(user) -> Leave | None:
    today = _today()
    return Leave.objects.filter(user=user, status=Leave.Status.APPROVED, start__lte=today, end__gte=today).first()


def _on_leave_map(user_ids=None) -> dict[int, date]:
    """User id -> the end of their approved leave running today."""
    today = _today()
    qs = Leave.objects.filter(status=Leave.Status.APPROVED, start__lte=today, end__gte=today)
    if user_ids is not None:
        qs = qs.filter(user_id__in=user_ids)
    out: dict[int, date] = {}
    for uid, end in qs.values_list("user_id", "end"):
        out[uid] = max(out.get(uid, end), end)
    return out


@transaction.atomic
def post_leave(user, start: date, end: date, reason: str, request=None) -> Leave:
    s = InactivitySettings.load()
    reason = (reason or "").strip()[:1000]
    if end < start:
        raise InactivityError("The leave ends before it starts")
    if end < _today():
        raise InactivityError("That leave is already over")
    if start > _today() + timedelta(days=365):
        raise InactivityError("A leave can start up to a year from now")
    if (end - start).days + 1 > s.max_leave_days:
        raise InactivityError(f"A leave can be up to {s.max_leave_days} days long; ask HR if you need longer")
    get_user_model().objects.select_for_update().filter(pk=user.pk).first()
    if Leave.objects.filter(user=user, status__in=Leave.LIVE, start__lte=end, end__gte=start).exists():
        raise InactivityError("You already have a leave for some of those days; cancel it first")
    leave = Leave.objects.create(user=user, start=start, end=end, reason=reason,
                                 status=Leave.Status.PENDING if s.leave_needs_approval else Leave.Status.APPROVED)
    link = "/p/inactivity/members?tab=leave"
    when = f"{start:%d %b} to {end:%d %b %Y}"
    if leave.status == Leave.Status.PENDING:
        notify([u for u in users_with_perm(MANAGE_PERM) if u.pk != user.pk], f"{user.display_name} asked for leave",
               f"{when}{': ' + reason[:200] if reason else ''}", link=link, category="p.inactivity")
    bus.emit("inactivity.leave_posted", user_id=user.pk, user=user.display_name, start=start.isoformat(), end=end.isoformat(),
             status=leave.status, link=link, summary=f"{user.display_name} is away {when}")
    record("inactivity.leave_posted", f"posted a leave of absence ({when})", request=request, actor=user,
           target_type="plugin", details={"leave_id": leave.pk, "status": leave.status})
    refresh_user(user)
    return leave


def cancel_leave(user, leave: Leave) -> Leave:
    if leave.user_id != user.pk:
        raise InactivityError("Not your leave", 403)
    if leave.status not in Leave.LIVE:
        raise InactivityError("This leave is already closed")
    if leave.end < _today():
        raise InactivityError("This leave is already over")
    leave.status = Leave.Status.CANCELLED
    leave.save(update_fields=["status"])
    refresh_user(user)
    return leave


def decide_leave(leave: Leave, by, approve: bool, note: str = "", request=None) -> Leave:
    if leave.status != Leave.Status.PENDING:
        raise InactivityError("This leave isn't waiting for approval")
    if leave.user_id == by.pk:
        raise InactivityError("You can't decide your own leave", 403)
    leave.status = Leave.Status.APPROVED if approve else Leave.Status.REJECTED
    leave.note = (note or "").strip()[:1000]
    leave.decided_by = by
    leave.decided_at = timezone.now()
    leave.save()
    when = f"{leave.start:%d %b} to {leave.end:%d %b %Y}"
    title = f"Your leave ({when}) was approved" if approve else f"Your leave ({when}) wasn't approved"
    notify(leave.user_id, title, leave.note[:300], link="/p/inactivity", level="success" if approve else "info",
           category="p.inactivity", force=True)
    verb = "approved" if approve else "rejected"
    record(f"inactivity.leave_{verb}", f"{verb} {leave.user.display_name}'s leave of absence ({when})", request=request,
           actor=by, target=leave.user, details={"leave_id": leave.pk})
    refresh_user(leave.user)
    return leave


# --- the check -------------------------------------------------------------------------------------------------------


def _apply(user, signals: dict, s: InactivitySettings, on_leave: bool, now) -> tuple[Activity, bool]:
    """Store one member's activity. Returns the row and whether they were flagged just now."""
    last = _last_active(user, signals, s)
    inactive = not on_leave and (last is None or last < now - timedelta(days=s.days))
    row = Activity.objects.filter(user=user).first() or Activity(user=user)
    newly = inactive and row.inactive_since is None
    row.last_site, row.last_game, row.last_fleet = signals["site"], signals["game"], signals["fleets"]
    row.last_active = last
    row.inactive = inactive
    row.inactive_since = (row.inactive_since or now) if inactive else None
    row.save()
    return row, newly


def refresh_user(user) -> Activity | None:
    """Work one member out again now (after a leave changes). Doesn't notify anyone."""
    s = InactivitySettings.load()
    if not checked_users(s).filter(pk=user.pk).exists():
        Activity.objects.filter(user=user).delete()
        return None
    user = get_user_model().objects.get(pk=user.pk)
    row, _ = _apply(user, _signals([user])[user.pk], s, user.pk in _on_leave_map([user.pk]), timezone.now())
    return row


def scan(notify_people: bool = True) -> list:
    """Work everyone out again. Tells HR (and, if switched on, the member) about each member flagged for the first time."""
    s = InactivitySettings.load()
    now = timezone.now()
    users = list(checked_users(s).select_related("main_character"))
    Activity.objects.exclude(user__in=[u.pk for u in users]).delete()
    signals = _signals(users)
    leave = _on_leave_map([u.pk for u in users])
    newly = []
    for u in users:
        _, flagged = _apply(u, signals[u.pk], s, u.pk in leave, now)
        if flagged:
            newly.append(u)
    if newly and notify_people:
        _digest(newly, s)
    return newly


def _digest(newly: list, s: InactivitySettings) -> None:
    names = sorted(u.display_name for u in newly)
    shown = ", ".join(names[:20]) + (f" and {len(names) - 20} more" if len(names) > 20 else "")
    n = len(names)
    title = f"{n} member{'s' if n != 1 else ''} went inactive"
    link = "/p/inactivity/members"
    notify(users_with_perm(VIEW_PERM), title, f"No activity for {s.days} days: {shown}", link=link, level="warning",
           category="p.inactivity")
    bus.emit("inactivity.flagged", count=n, users=names[:100], user_ids=[u.pk for u in newly][:100], days=s.days,
             link=link, title=title, summary=shown, level="warning")
    if s.notify_member:
        notify(newly, "We haven't seen you in a while",
               f"Nothing from you for {s.days} days. Going away for a bit? Post a leave of absence so nobody chases you.",
               link="/p/inactivity", category="p.inactivity")


def active_within(user, days: int) -> bool:
    """For the group rule: active in the last ``days`` days by the switched-on signals, or on leave."""
    if current_leave(user) is not None:
        return True
    row = Activity.objects.filter(user=user).first()
    if row is None:  # not checked yet (new member, or outside the checked states and groups): work it out now
        s = InactivitySettings.load()
        last = _last_active(user, _signals([user])[user.pk], s)
    else:
        last = row.last_active
    return last is not None and last >= timezone.now() - timedelta(days=days)


# --- settings --------------------------------------------------------------------------------------------------------


def settings_out(s: InactivitySettings | None = None) -> dict:
    s = s or InactivitySettings.load()
    return {
        "days": s.days, "use_site": s.use_site, "use_game": s.use_game, "use_fleets": s.use_fleets,
        "states": list(s.states.values_list("pk", flat=True)), "groups": list(s.groups.values_list("pk", flat=True)),
        "leave_needs_approval": s.leave_needs_approval, "max_leave_days": s.max_leave_days, "notify_member": s.notify_member,
        "fleets_available": fleets_available(),
        "state_options": [{"id": st.pk, "name": st.name} for st in State.objects.filter(public=False).order_by("-priority")],
        "group_options": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


def save_settings(data: dict, by, request=None) -> InactivitySettings:
    s = InactivitySettings.load()
    days, max_leave = int(data.get("days") or 0), int(data.get("max_leave_days") or 0)
    if not 1 <= days <= 3650:
        raise InactivityError("Days before inactive must be between 1 and 3650")
    if not 1 <= max_leave <= 3650:
        raise InactivityError("The longest leave must be between 1 and 3650 days")
    if not any(data.get(f"use_{k}") for k in SIGNALS):
        raise InactivityError("Switch on at least one kind of activity")
    s.days, s.max_leave_days = days, max_leave
    for k in SIGNALS:
        setattr(s, f"use_{k}", bool(data.get(f"use_{k}")))
    s.leave_needs_approval = bool(data.get("leave_needs_approval"))
    s.notify_member = bool(data.get("notify_member"))
    s.save()
    s.states.set(State.objects.filter(pk__in=data.get("states") or [], public=False))
    s.groups.set(Group.objects.filter(pk__in=data.get("groups") or []))
    record("inactivity.settings_saved", "changed the inactivity settings", request=request, actor=by, target_type="plugin",
           details={"days": days, "signals": [k for k in SIGNALS if getattr(s, f"use_{k}")]})
    # New limits apply straight away, without telling anyone: the daily check does that.
    scan(notify_people=False)
    return s


# --- what pages show -----------------------------------------------------------------------------------------------


def _iso(v):
    return v.isoformat() if v else None


def user_brief(u) -> dict:
    main = u.main_character
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(main.pk, 64) if main else None,
            "corporation": main.corporation.name if main and main.corporation else None}


def leave_out(leave: Leave, *, with_user: bool = False) -> dict:
    today = _today()
    out = {"id": leave.pk, "start": leave.start.isoformat(), "end": leave.end.isoformat(), "reason": leave.reason,
           "status": leave.status, "note": leave.note, "decided_by": leave.decided_by.display_name if leave.decided_by else None,
           "decided_at": _iso(leave.decided_at), "created_at": leave.created_at.isoformat(),
           "running": leave.status == Leave.Status.APPROVED and leave.start <= today <= leave.end,
           "over": leave.end < today}
    if with_user:
        out["user"] = user_brief(leave.user)
    return out


def member_rows(filter_: str = "all", q: str = "") -> dict:
    now = timezone.now()
    rows = list(Activity.objects.select_related("user__main_character__corporation"))
    leave = _on_leave_map([r.user_id for r in rows])
    items = []
    for r in rows:
        on_leave_until = leave.get(r.user_id)
        items.append({
            **user_brief(r.user),
            "last_site": _iso(r.last_site), "last_game": _iso(r.last_game), "last_fleet": _iso(r.last_fleet),
            "last_active": _iso(r.last_active),
            "days_inactive": (now - r.last_active).days if r.last_active else None,
            "inactive": r.inactive, "inactive_since": _iso(r.inactive_since),
            "on_leave_until": on_leave_until.isoformat() if on_leave_until else None,
        })
    counts = {"all": len(items), "inactive": sum(i["inactive"] for i in items),
              "leave": sum(1 for i in items if i["on_leave_until"])}
    if filter_ == "inactive":
        items = [i for i in items if i["inactive"]]
    elif filter_ == "leave":
        items = [i for i in items if i["on_leave_until"]]
    if q.strip():
        from conduit.accounts.models import Character

        hit = set(Character.objects.filter(name__icontains=q.strip()).values_list("user_id", flat=True))
        items = [i for i in items if i["id"] in hit]
    items.sort(key=lambda i: (not i["inactive"], -(i["days_inactive"] or 0), i["name"]))
    checked = max((r.checked_at for r in rows), default=None)
    return {"items": items, "counts": counts, "checked_at": _iso(checked)}


def members_csv(filter_: str = "all", q: str = "") -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Member", "Corporation", "Last active", "Days inactive", "Inactive", "On leave until",
                "Signed in to the site", "Played", "Last fleet"])
    for i in member_rows(filter_, q)["items"]:
        w.writerow([i["name"], i["corporation"] or "", i["last_active"] or "", i["days_inactive"] if i["days_inactive"] is not None else "",
                    "yes" if i["inactive"] else "no", i["on_leave_until"] or "", i["last_site"] or "", i["last_game"] or "",
                    i["last_fleet"] or ""])
    return buf.getvalue()


def leave_list(status: str = "pending") -> list[dict]:
    today = _today()
    qs = Leave.objects.select_related("user__main_character__corporation", "decided_by__main_character")
    if status == "pending":
        qs = qs.filter(status=Leave.Status.PENDING, end__gte=today).order_by("start")
    elif status == "current":
        qs = qs.filter(status=Leave.Status.APPROVED, start__lte=today, end__gte=today).order_by("end")
    elif status == "upcoming":
        qs = qs.filter(status=Leave.Status.APPROVED, start__gt=today).order_by("start")
    else:
        qs = qs.filter(Q(end__lt=today) | Q(status__in=[Leave.Status.REJECTED, Leave.Status.CANCELLED]))
    return [leave_out(lv, with_user=True) for lv in qs[:500]]


def summary() -> dict:
    today = _today()
    return {
        "inactive": Activity.objects.filter(inactive=True).count(),
        "on_leave": Leave.objects.filter(status=Leave.Status.APPROVED, start__lte=today, end__gte=today).values("user").distinct().count(),
        "pending": Leave.objects.filter(status=Leave.Status.PENDING, end__gte=today).count(),
        "checked": Activity.objects.count(),
        "days": InactivitySettings.load().days,
    }


def me(user) -> dict:
    s = InactivitySettings.load()
    row = Activity.objects.filter(user=user).first()
    leaves = Leave.objects.filter(user=user).select_related("decided_by__main_character")[:50]
    return {
        "leaves": [leave_out(lv) for lv in leaves],
        "needs_approval": s.leave_needs_approval,
        "max_leave_days": s.max_leave_days,
        "days": s.days,
        "last_active": _iso(row.last_active) if row else None,
        "can_see_list": can_see_list(user),
    }
