"""Structures & Fuel: every structure the viewer may see, what it burns, what it needs, warnings and refuel claims.

Everything is read from what the core already syncs: the corporations' Upwell structures (``conduit.corp.models.Structure``,
its Structures section, every 30 minutes). Who sees a structure follows the corporation sheet: the corporation's
Structures section must be open to them (``conduit.corp.access.can_view_section``).

Warnings and the core's own: the core tells every viewer of a corporation once when a structure drops under 72 hours
(``corp.structure_fuel_low``). This plugin warns at its own thresholds; at exactly the core's 72 hours it sends no
notification of its own (the same people were just told by the core) but still emits its event. See the README.
"""

from __future__ import annotations

import logging
import math
from datetime import timedelta

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify

from . import burn as fuel
from .models import Claim, StructureFuel, StructuresSettings

log = logging.getLogger(__name__)

MANAGE_PERM = "structures.manage_structures"
LINK = "/p/structures"
#: The core's own low-fuel warning (``conduit.corp.sections.structures.FUEL_WARNING``), in hours.
CORE_WARNING_HOURS = 72
#: Fuel expiry moving later by at least this much is a refuel (ESI's estimate wobbles by minutes as it's recalculated).
REFUEL_MARGIN = timedelta(hours=6)
MAX_THRESHOLD_HOURS = 90 * 24
MAX_THRESHOLDS = 6
#: Structures with no fuel at all, in these states, are out of fuel rather than not using any.
EMPTY_STATES = {"low_power", "abandoned"}


class StructuresError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def core_warning_hours() -> int:
    try:
        from conduit.corp.sections.structures import FUEL_WARNING

        return int(FUEL_WARNING.total_seconds() // 3600)
    except ImportError:  # pragma: no cover - older cores
        return CORE_WARNING_HOURS


# --- who sees what ---------------------------------------------------------------------------------------------------


def visible_corporations(user) -> set[int]:
    """Corporations with structures whose Structures section ``user`` may open on the corporation sheet."""
    from conduit.corp.access import can_view_section, has_any_corp_permission
    from conduit.corp.models import Structure

    if not has_any_corp_permission(user):
        return set()
    ids = set(Structure.objects.values_list("corporation_id", flat=True).distinct())
    return {cid for cid in ids if can_view_section(user, cid, "structures")}


def visible_structures(user):
    from conduit.corp.models import Structure

    return Structure.objects.filter(corporation_id__in=visible_corporations(user)).select_related("corporation")


def get_structure(user, structure_id: int):
    """One structure ``user`` may see, or a 404."""
    s = visible_structures(user).filter(structure_id=structure_id).first()
    if s is None:
        raise StructuresError("Not found", 404)
    return s


# --- fuel maths ------------------------------------------------------------------------------------------------------


def burn_of(s, groups: dict[int, int] | None = None) -> fuel.Burn:
    return fuel.burn(s.type_id, s.services, (groups or {}).get(s.type_id), fuelled=s.fuel_expires is not None)


def _groups(type_ids) -> dict[int, int]:
    from conduit.sde.models import ItemType

    return dict(ItemType.objects.filter(pk__in=set(type_ids)).values_list("pk", "group_id"))


def hours_left(s, now=None) -> float | None:
    if s.fuel_expires is None:
        return None
    return max(0.0, (s.fuel_expires - (now or timezone.now())).total_seconds() / 3600)


def thresholds_for(tracked: StructureFuel | None, settings: StructuresSettings) -> list[int]:
    """The structure's thresholds in hours, largest first."""
    ths = tracked.thresholds if tracked is not None and tracked.thresholds is not None else settings.thresholds
    return sorted({int(t) for t in ths or []}, reverse=True)


def level_of(s, hours: float | None, b: fuel.Burn, thresholds: list[int]) -> str:
    """``ok``, ``warning`` (below a threshold), ``danger`` (below the last one), ``empty`` (out of fuel) or ``none``
    (no fuel and nothing that would burn any)."""
    if hours is None:
        return "empty" if s.state in EMPTY_STATES or b.all > 0 else "none"
    crossed = [t for t in thresholds if hours < t]
    if not crossed:
        return "ok"
    return "danger" if min(crossed) == min(thresholds) else "warning"


def need_for(hours: float | None, b: fuel.Burn, days: int) -> int:
    """Blocks to top a structure up to ``days`` of fuel. Out of fuel, it's planned at the burn of every fitted service
    (what it needs to come back up)."""
    rate = b.online if hours is not None else b.all
    # To the minute, so the seconds since the page asked don't add a block.
    short = round(days * 24 - (hours or 0), 2)
    return max(0, math.ceil(short * rate - 1e-9))


def went_up(old_expires, old_burn, new_expires, new_burn) -> bool:
    """Whether fuel was put in between two looks. Fuel lasting longer because a service went offline (the burn fell)
    doesn't count."""
    if new_expires is None:
        return False
    if old_expires is None:
        return True
    if old_burn is not None and new_burn < old_burn - 1e-6:
        return False
    return new_expires - old_expires >= REFUEL_MARGIN


# --- rows the pages show ---------------------------------------------------------------------------------------------


def _iso(v):
    return v.isoformat() if v else None


def _claims_by_structure(ids) -> dict[int, list[Claim]]:
    out: dict[int, list[Claim]] = {}
    for c in Claim.objects.filter(structure_id__in=ids, expires_at__gt=timezone.now()).select_related("user__main_character"):
        out.setdefault(c.structure_id, []).append(c)
    return out


def claim_out(c: Claim) -> dict:
    return {"user": c.user.display_name, "user_id": c.user_id, "note": c.note,
            "portrait": portrait_url(c.user.main_character_id, 64) if c.user.main_character_id else None,
            "created_at": _iso(c.created_at), "expires_at": _iso(c.expires_at)}


def rows(structures, user=None, days: int | None = None) -> list[dict]:
    """Each structure with its fuel, burn, warning level, what it needs for ``days`` (the settings' plan) and claims."""
    from conduit.sde.models import SolarSystem
    from conduit.sheet.util import type_out, types_by_id

    structures = list(structures)
    settings = StructuresSettings.load()
    days = days or settings.plan_days
    ids = [s.structure_id for s in structures]
    tracked = {t.structure_id: t for t in StructureFuel.objects.filter(structure_id__in=ids)}
    claims = _claims_by_structure(ids)
    types = types_by_id({s.type_id for s in structures})
    groups = {tid: t.group_id for tid, t in types.items()}
    systems = {x.id: x for x in SolarSystem.objects.filter(pk__in={s.system_id for s in structures}).select_related("region")}
    now = timezone.now()
    out = []
    for s in structures:
        t = tracked.get(s.structure_id)
        b = burn_of(s, groups)
        hours = hours_left(s, now)
        ths = thresholds_for(t, settings)
        sys_ = systems.get(s.system_id)
        cl = claims.get(s.structure_id, [])
        online = {m["module"] for m in b.modules if m["online"]}
        out.append({
            "id": s.structure_id,
            "name": s.name or f"Structure {s.structure_id}",
            "type": type_out(s.type_id, types),
            "corporation": {"id": s.corporation_id, "name": s.corporation.name, "ticker": s.corporation.ticker},
            "system": {"id": s.system_id, "name": sys_.name if sys_ else f"System {s.system_id}",
                       "security": sys_.display_security if sys_ else None, "region": sys_.region.name if sys_ else ""},
            "state": s.state,
            "fuel_expires": _iso(s.fuel_expires),
            "hours_left": round(hours, 1) if hours is not None else None,
            "services": [{"name": x.get("name", ""), "state": x.get("state", ""),
                          "module": fuel.module_of(x.get("name", "")) if s.type_id not in fuel.FIXED else "fixed"} for x in s.services],
            "modules": b.modules,
            "unknown_services": b.unknown,
            "burn": b.online,
            "burn_all": b.all,
            "blocks_left": math.floor(hours * b.online) if hours is not None else 0,
            "need": need_for(hours, b, days),
            "level": level_of(s, hours, b, ths),
            "thresholds": ths,
            "threshold_override": t is not None and t.thresholds is not None,
            "staging": t.staging if t else "",
            "reinforce_hour": s.reinforce_hour,
            "state_timer_end": _iso(s.state_timer_end),
            "unanchors_at": _iso(s.unanchors_at),
            "claims": [claim_out(c) for c in cl],
            "my_claim": next((claim_out(c) for c in cl if user is not None and c.user_id == user.pk), None),
            "online_modules": len(online),
        })
    # Out of fuel first, then the least fuel left; structures that use none last.
    rank = {"empty": 0, "none": 2}
    out.sort(key=lambda r: (rank.get(r["level"], 1), r["hours_left"] or 0, r["name"].lower()))
    return out


def board(user) -> dict:
    settings = StructuresSettings.load()
    items = rows(visible_structures(user), user)
    corps = sorted({(r["corporation"]["id"], r["corporation"]["name"], r["corporation"]["ticker"]) for r in items}, key=lambda c: c[1].lower())
    return {
        "structures": items,
        "corporations": [{"id": c[0], "name": c[1], "ticker": c[2]} for c in corps],
        "thresholds": thresholds_for(None, settings),
        "plan_days": settings.plan_days,
        "claim_hours": settings.claim_hours,
        "can_manage": user.has_perm(MANAGE_PERM),
        "can_view": _has_corp_perm(user),
    }


def _has_corp_perm(user) -> bool:
    from conduit.corp.access import has_any_corp_permission

    return has_any_corp_permission(user)


def plan(user, days: int | None = None) -> dict:
    """The fuel shopping list: blocks to top every structure up to ``days``, by staging label or else by system."""
    from conduit.sheet.util import prices_by_type

    settings = StructuresSettings.load()
    days = days or settings.plan_days
    if not 1 <= days <= 365:
        raise StructuresError("Plan between 1 and 365 days")
    groups: dict[str, dict] = {}
    for r in rows(visible_structures(user), user, days):
        if r["need"] <= 0 and r["burn"] <= 0:
            continue
        key = f"staging:{r['staging'].lower()}" if r["staging"] else f"system:{r['system']['id']}"
        g = groups.setdefault(key, {
            "key": key, "label": r["staging"] or r["system"]["name"], "kind": "staging" if r["staging"] else "system",
            "systems": [], "region": r["system"]["region"], "blocks": 0, "burn": 0.0, "structures": [],
        })
        if r["system"]["name"] not in g["systems"]:
            g["systems"].append(r["system"]["name"])
        g["blocks"] += r["need"]
        g["burn"] += r["burn"]
        g["structures"].append({k: r[k] for k in ("id", "name", "type", "corporation", "system", "hours_left", "fuel_expires",
                                                  "burn", "burn_all", "need", "level", "claims")})
    out = sorted(groups.values(), key=lambda g: (-g["blocks"], g["label"].lower()))
    for g in out:
        g["volume"] = g["blocks"] * fuel.BLOCK_VOLUME
        g["burn"] = round(g["burn"], 2)
        g["per_day"] = math.ceil(g["burn"] * 24)
    prices = [p for p in prices_by_type(fuel.FUEL_BLOCK_TYPES).values() if p]
    price = float(min(prices)) if prices else None
    blocks = sum(g["blocks"] for g in out)
    return {
        "days": days,
        "groups": out,
        "blocks": blocks,
        "volume": blocks * fuel.BLOCK_VOLUME,
        "per_day": math.ceil(sum(g["burn"] for g in out) * 24),
        "block_price": price,
        "cost": blocks * price if price is not None else None,
    }


def summary(user) -> dict:
    """For the dashboard: structures below a threshold or out of fuel, worst first."""
    items = rows(visible_structures(user), user)
    low = [r for r in items if r["level"] in ("warning", "danger", "empty")]
    low.sort(key=lambda r: (r["level"] != "empty", r["hours_left"] if r["hours_left"] is not None else -1))
    return {
        "structures": len(items),
        "low": len(low),
        "danger": sum(1 for r in low if r["level"] in ("danger", "empty")),
        "can_view": bool(items) or _has_corp_perm(user),
        "worst": [{"id": r["id"], "name": r["name"], "icon": r["type"]["icon"], "ticker": r["corporation"]["ticker"],
                   "system": r["system"]["name"], "hours_left": r["hours_left"], "fuel_expires": r["fuel_expires"],
                   "level": r["level"], "claimed": bool(r["claims"])} for r in low[:6]],
    }


# --- claims ----------------------------------------------------------------------------------------------------------


def claim(user, structure_id: int, note: str = "") -> Claim:
    s = get_structure(user, structure_id)
    b = burn_of(s, _groups([s.type_id]))
    hours = StructuresSettings.load().claim_hours
    c, created = Claim.objects.update_or_create(
        structure_id=s.structure_id, user=user,
        defaults={"note": (note or "").strip()[:200], "fuel_expires": s.fuel_expires, "burn": b.online,
                  "expires_at": timezone.now() + timedelta(hours=hours)},
    )
    if created:
        name = s.name or f"Structure {s.structure_id}"
        bus.emit("structures.refuel_claimed", structure_id=s.structure_id, structure=name, corporation_id=s.corporation_id,
                 corporation=s.corporation.name, user=user.display_name, link=LINK, level="info",
                 title=f"{user.display_name} is refuelling {name}", summary=c.note or f"{s.corporation.name}")
    return c


def release(user, structure_id: int) -> None:
    Claim.objects.filter(structure_id=structure_id, user=user).delete()


# --- managing --------------------------------------------------------------------------------------------------------


def clean_thresholds(values) -> list[int]:
    if not isinstance(values, (list, tuple)):
        raise StructuresError("Thresholds must be a list of hours")
    try:
        out = sorted({int(v) for v in values}, reverse=True)
    except (TypeError, ValueError):
        raise StructuresError("Thresholds must be whole hours") from None
    if len(out) > MAX_THRESHOLDS:
        raise StructuresError(f"At most {MAX_THRESHOLDS} thresholds")
    if any(not 1 <= v <= MAX_THRESHOLD_HOURS for v in out):
        raise StructuresError("Each threshold must be between 1 hour and 90 days")
    return out


def settings_out(s: StructuresSettings | None = None) -> dict:
    s = s or StructuresSettings.load()
    return {
        "thresholds": thresholds_for(None, s),
        "groups": list(s.groups.values_list("pk", flat=True)),
        "notify": s.notify,
        "plan_days": s.plan_days,
        "claim_hours": s.claim_hours,
        "core_warning_hours": core_warning_hours(),
        "group_options": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


def save_settings(data: dict, by, request=None) -> StructuresSettings:
    s = StructuresSettings.load()
    thresholds = clean_thresholds(data.get("thresholds") or [])
    plan_days, claim_hours = int(data.get("plan_days") or 0), int(data.get("claim_hours") or 0)
    if not 1 <= plan_days <= 365:
        raise StructuresError("Plan between 1 and 365 days")
    if not 1 <= claim_hours <= 24 * 14:
        raise StructuresError("Claims last between 1 hour and 14 days")
    s.thresholds, s.plan_days, s.claim_hours = thresholds, plan_days, claim_hours
    s.notify = bool(data.get("notify"))
    s.save()
    s.groups.set(Group.objects.filter(pk__in=data.get("groups") or []))
    record("structures.settings_saved", "changed the structure fuel settings", request=request, actor=by, target_type="plugin",
           details={"thresholds": thresholds, "groups": list(s.groups.values_list("name", flat=True)), "notify": s.notify})
    return s


def save_structure(by, structure_id: int, data: dict, request=None) -> StructureFuel:
    """Per-structure thresholds (``None``: the default ones, ``[]``: never warn) and its staging label."""
    s = get_structure(by, structure_id)
    t, _ = StructureFuel.objects.get_or_create(structure_id=s.structure_id)
    if "thresholds" in data:
        t.thresholds = None if data["thresholds"] is None else clean_thresholds(data["thresholds"])
    if "staging" in data:
        t.staging = str(data.get("staging") or "").strip()[:100]
    t.save()
    record("structures.structure_saved", f"changed the fuel settings of {s.name or s.structure_id}", request=request, actor=by,
           target_type="plugin", details={"structure_id": s.structure_id, "thresholds": t.thresholds, "staging": t.staging})
    return t


# --- the check -------------------------------------------------------------------------------------------------------


def recipients(corporation, settings: StructuresSettings, cache: dict) -> list:
    """Who is warned about a corporation's structures: the chosen groups' members who may see them, or everyone who may."""
    from conduit.access.services import is_site_member
    from conduit.accounts.models import User
    from conduit.corp.access import can_view_section, viewers

    if corporation.pk in cache:
        return cache[corporation.pk]
    group_ids = list(settings.groups.values_list("pk", flat=True))
    if group_ids:
        people = User.objects.filter(is_active=True, groups__in=group_ids).distinct().select_related("state", "main_character")
        people = [u for u in people if can_view_section(u, corporation, "structures")]
    else:
        people = viewers(corporation)
    cache[corporation.pk] = [u for u in people if is_site_member(u)]
    return cache[corporation.pk]


def _hours_text(hours: float) -> str:
    return f"{hours / 24:.1f} days" if hours >= 48 else f"{int(hours)} hours"


def check() -> dict:
    """Warn once per threshold a structure's fuel falls below (again only once it's been back above it), notice refuels
    and clear the claims they finish, and drop claims that ran out."""
    from conduit.corp.models import Structure

    settings = StructuresSettings.load()
    core_hours = core_warning_hours()
    now = timezone.now()
    structures = list(Structure.objects.select_related("corporation"))
    groups = _groups(s.type_id for s in structures)
    tracked = {t.structure_id: t for t in StructureFuel.objects.filter(structure_id__in=[s.structure_id for s in structures])}
    by_id = {s.structure_id: s for s in structures}

    # Claims on structures that are gone, or that ran out, go first: nothing below names them.
    expired, _ = Claim.objects.filter(Q(expires_at__lte=now) | ~Q(structure_id__in=list(by_id))).delete()
    claims: dict[int, list[Claim]] = {}
    for c in Claim.objects.select_related("user"):
        claims.setdefault(c.structure_id, []).append(c)

    warnings, refuels, done = [], [], []
    for s in structures:
        b = burn_of(s, groups)
        hours = hours_left(s, now)
        t = tracked.get(s.structure_id)
        first = t is None
        t = t or StructureFuel(structure_id=s.structure_id)
        if not first and went_up(t.last_fuel_expires, t.last_burn, s.fuel_expires, b.online):
            refuels.append((s, [c.user.display_name for c in claims.get(s.structure_id, [])]))
        for c in claims.get(s.structure_id, []):
            if went_up(c.fuel_expires, c.burn, s.fuel_expires, b.online):
                done.append(c.pk)

        ths = thresholds_for(t, settings)
        if hours is None:
            warned = list(t.warned)  # out of fuel (or none needed): no new warnings, and don't forget the old ones
        else:
            crossed = [x for x in ths if hours < x]
            if crossed and min(crossed) not in t.warned:
                warnings.append((s, min(crossed), hours, b))
            warned = sorted(crossed, reverse=True)
        changed = first or warned != t.warned or t.last_fuel_expires != s.fuel_expires or t.last_burn != b.online
        t.warned, t.last_fuel_expires, t.last_burn = warned, s.fuel_expires, b.online
        if changed:
            t.save()
    finished, _ = Claim.objects.filter(pk__in=done).delete()

    cache: dict = {}
    with transaction.atomic():
        for s, threshold, hours, b in warnings:
            # Claims this run's refuel finished aren't someone refuelling it any more.
            _warn(s, threshold, hours, b, settings, core_hours, cache, [c for c in claims.get(s.structure_id, []) if c.pk not in done])
        for s, by in refuels:
            name = s.name or f"Structure {s.structure_id}"
            left = hours_left(s, now) or 0
            bus.emit("structures.refuelled", corporation_id=s.corporation_id, corporation=s.corporation.name,
                     structure_id=s.structure_id, structure=name, fuel_expires=_iso(s.fuel_expires), hours_left=round(left, 1),
                     claimed_by=by, link=LINK, level="success", title=f"{name} was refuelled",
                     summary=f"{s.corporation.name}: {_hours_text(left)} of fuel now" + (f" (thanks {', '.join(by)})" if by else ""))
    return {"warnings": len(warnings), "refuels": len(refuels), "finished_claims": finished, "expired_claims": expired}


def _warn(s, threshold: int, hours: float, b: fuel.Burn, settings, core_hours: int, cache: dict, claims: list[Claim]) -> None:
    name = s.name or f"Structure {s.structure_id}"
    level = "danger" if threshold <= 24 else "warning"
    by = [c.user.display_name for c in claims]
    body = f"{_hours_text(hours)} of fuel left, burning {b.online:g} blocks an hour."
    if by:
        body += f" {', '.join(by)} {'is' if len(by) == 1 else 'are'} refuelling it."
    title = f"{name} has under {_hours_text(threshold)} of fuel"
    bus.emit("structures.fuel_low", corporation_id=s.corporation_id, corporation=s.corporation.name, structure_id=s.structure_id,
             structure=name, system_id=s.system_id, threshold_hours=threshold, hours_left=round(hours, 1),
             fuel_expires=_iso(s.fuel_expires), burn=b.online, claimed_by=by, link=LINK, level=level,
             title=title, summary=f"{s.corporation.name}: {body}")
    # At the core's own mark everyone who may see the structure was just told by the core: don't tell them twice.
    if not settings.notify or threshold == core_hours:
        return
    people = recipients(s.corporation, settings, cache)
    if people:
        notify(people, title, f"{s.corporation.name}: {body}", link=LINK, level=level, category="p.structures",
               data={"structure_id": s.structure_id, "threshold_hours": threshold})
