"""Planetary Industry: colonies, what they make, expiry reminders and the corporation view.

Everything is read from the character sheet's PI section (``conduit.sheet.planets``), which keeps each colony's full
ESI layout (pins, routes) and refreshes it hourly. Nothing here calls ESI.

Output is an estimate:

- an **extractor** that is still running gives ``qty_per_cycle`` every ``cycle_time`` (the program's average, so a
  little high early in long programs);
- a **factory** with at least one route into it is taken to run every cycle of its schematic at the standard rate
  (P1 20 per 30 minutes, P2 5, P3 3 and P4 1 an hour) and to use the standard inputs (3000 P0 per P1 run, 40 P1 per
  P2, 10 P2 per P3, 6 P3 or 40 P1 per P4). Its product is the type its output route carries, or the type named like
  its schematic. A factory with nothing routed into it is idle;
- per colony (and over all of a member's colonies, for totals) what's made minus what's used is the **output**; what's
  used but not made there is an **input** that has to be hauled in. Output is valued at CCP's average price.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.accounts.models import Character, User, UserPreferences
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify
from conduit.sde.models import ItemType, PlanetSchematic, SolarSystem
from conduit.sheet.planets.api import PLANET_TYPES
from conduit.sheet.planets.models import Colony
from conduit.sheet.util import parse_dt, prices_by_type, type_out, types_by_id

from .models import Digest, Reminder

log = logging.getLogger(__name__)

PLUGIN_ID = "pi"
VIEW_CORP_PERM = "pi.view_corp_pi"
SCOPE = "esi-planets.manage_planets.v1"
LINK = "/p/pi"

#: Item groups of the planetary tiers in the static data: raw resources (P0) and the four commodity tiers.
P0_GROUPS = {1032, 1033, 1035}
TIER_GROUPS = {1042: 1, 1034: 2, 1040: 3, 1041: 4}
P0_CATEGORY = 42
#: Pins that hold goods: command centres, storage facilities and launchpads.
STORAGE_GROUPS = {1027, 1029, 1030}
#: What one factory run makes, by tier, and what it uses of each input, by (product tier, input tier).
RUN_OUTPUT = {1: 20, 2: 5, 3: 3, 4: 1}
RUN_INPUT = {(1, 0): 3000, (2, 1): 40, (3, 2): 10, (4, 3): 6, (4, 1): 40}
DAY = 86400

#: Each member's own settings, kept with the core per-user plugin settings (``/api/me/preferences/plugins/pi``).
DEFAULTS = {"soon": True, "lead_hours": 2, "expired": True, "digest": False}
MAX_LEAD_HOURS = 72
#: An extractor that ended longer ago than this when the check first sees it isn't announced (a colony that's been
#: idle for weeks when the plugin is switched on, or a worker that was stopped for a long time).
EXPIRED_GRACE = timedelta(hours=12)


class PiError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- settings --------------------------------------------------------------------------------------------------------


def clean_settings(value) -> dict:
    """A member's stored settings with the defaults filled in and anything odd ignored."""
    out = dict(DEFAULTS)
    if not isinstance(value, dict):
        return out
    for key in ("soon", "expired", "digest"):
        if isinstance(value.get(key), bool):
            out[key] = value[key]
    try:
        out["lead_hours"] = min(MAX_LEAD_HOURS, max(1, int(value.get("lead_hours", DEFAULTS["lead_hours"]))))
    except (TypeError, ValueError):
        pass
    return out


def settings_map(user_ids) -> dict[int, dict]:
    stored = dict(UserPreferences.objects.filter(user_id__in=list(user_ids)).values_list("user_id", "plugins"))
    return {uid: clean_settings((stored.get(uid) or {}).get(PLUGIN_ID)) for uid in user_ids}


def settings_for(user) -> dict:
    return settings_map([user.pk])[user.pk]


# --- reading a colony's layout ---------------------------------------------------------------------------------------


def _pins(c: Colony) -> list[dict]:
    return (c.layout or {}).get("pins") or []


def _routes(c: Colony) -> list[dict]:
    return (c.layout or {}).get("routes") or []


def _schematic_id(pin: dict):
    return pin.get("schematic_id") or (pin.get("factory_details") or {}).get("schematic_id")


def extractors(c: Colony) -> list[dict]:
    out = []
    for pin in _pins(c):
        ex = pin.get("extractor_details")
        if not ex:
            continue
        out.append({
            "pin_id": pin.get("pin_id"),
            "product_id": ex.get("product_type_id"),
            "qty_per_cycle": ex.get("qty_per_cycle") or 0,
            "cycle_time": ex.get("cycle_time") or 0,
            "heads": len(ex.get("heads") or []),
            "expiry": parse_dt(pin.get("expiry_time")),
            "installed": parse_dt(pin.get("install_time")),
        })
    return out


class Context:
    """Static data, prices and systems for a batch of colonies, loaded once."""

    def __init__(self, colonies):
        type_ids, schematic_ids = set(), set()
        for c in colonies:
            for pin in _pins(c):
                type_ids.add(pin.get("type_id"))
                type_ids.update(x.get("type_id") for x in pin.get("contents") or [])
                type_ids.add((pin.get("extractor_details") or {}).get("product_type_id"))
                schematic_ids.add(_schematic_id(pin))
            type_ids.update(r.get("content_type_id") for r in _routes(c))
        self.schematics = {s.id: s for s in PlanetSchematic.objects.filter(pk__in={s for s in schematic_ids if s})}
        # Schematics are named after what they make.
        self.by_name = dict(ItemType.objects.filter(group_id__in=TIER_GROUPS, name__in=[s.name for s in self.schematics.values()])
                            .values_list("name", "pk"))
        type_ids.update(self.by_name.values())
        self.types = types_by_id(type_ids)
        self.prices = prices_by_type(type_ids)
        self.systems = {s.id: s for s in SolarSystem.objects.filter(pk__in={c.solar_system_id for c in colonies})}
        self._type_out: dict[int, dict] = {}

    def tier(self, type_id) -> int | None:
        t = self.types.get(type_id)
        if t is None:
            return None
        if t.group_id in P0_GROUPS or t.group.category_id == P0_CATEGORY:
            return 0
        return TIER_GROUPS.get(t.group_id)

    def type(self, type_id) -> dict:
        if type_id not in self._type_out:
            self._type_out[type_id] = {**type_out(type_id, self.types), "tier": self.tier(type_id)}
        return self._type_out[type_id]

    def price(self, type_id) -> float:
        return self.prices.get(type_id, 0.0)


def _factories(c: Colony, ctx: Context) -> list[dict]:
    """Each factory pin: its product, tier, whether anything is routed in, and its inputs."""
    routes_out, routes_in = defaultdict(list), defaultdict(set)
    for r in _routes(c):
        routes_out[r.get("source_pin_id")].append(r.get("content_type_id"))
        routes_in[r.get("destination_pin_id")].add(r.get("content_type_id"))
    out = []
    for pin in _pins(c):
        sid = _schematic_id(pin)
        if not sid:
            continue
        schematic = ctx.schematics.get(sid)
        product = next((t for t in routes_out.get(pin.get("pin_id"), []) if t), None)
        if product is None and schematic is not None:
            product = ctx.by_name.get(schematic.name)
        tier = ctx.tier(product)
        cycle = (schematic.cycle_time if schematic else None) or (1800 if tier == 1 else 3600)
        out.append({
            "schematic_id": sid,
            "schematic": schematic.name if schematic else f"Schematic {sid}",
            "product_id": product,
            "tier": tier,
            "cycle_time": cycle,
            "inputs": sorted(t for t in routes_in.get(pin.get("pin_id"), set()) if t),
        })
    return out


def flow(c: Colony, ctx: Context, now: datetime) -> tuple[dict[int, float], dict[int, float]]:
    """What a colony makes and uses per day, by type."""
    made, used = defaultdict(float), defaultdict(float)
    for ex in extractors(c):
        if ex["product_id"] and ex["cycle_time"] and ex["expiry"] and ex["expiry"] > now:
            made[ex["product_id"]] += ex["qty_per_cycle"] * DAY / ex["cycle_time"]
    for f in _factories(c, ctx):
        if not f["inputs"] or f["product_id"] is None or f["tier"] not in RUN_OUTPUT:
            continue
        runs = DAY / f["cycle_time"]
        made[f["product_id"]] += RUN_OUTPUT[f["tier"]] * runs
        for t in f["inputs"]:
            qty = RUN_INPUT.get((f["tier"], ctx.tier(t)))
            if qty:
                used[t] += qty * runs
    return made, used


def net(made: dict, used: dict, ctx: Context) -> tuple[list[dict], list[dict], float]:
    """Output (made more than used), inputs (used more than made) and the output's value per day."""
    outputs, inputs, value = [], [], 0.0
    for t in set(made) | set(used):
        n = made.get(t, 0.0) - used.get(t, 0.0)
        if n > 1e-6:
            isk = n * ctx.price(t)
            value += isk
            outputs.append({"type": ctx.type(t), "per_day": round(n, 1), "isk_per_day": round(isk, 2)})
        elif n < -1e-6:
            inputs.append({"type": ctx.type(t), "per_day": round(-n, 1)})
    outputs.sort(key=lambda o: (-(o["type"]["tier"] or 0), -o["isk_per_day"]))
    inputs.sort(key=lambda o: (o["type"]["tier"] or 0, -o["per_day"]))
    return outputs, inputs, round(value, 2)


def _storage(c: Colony, ctx: Context) -> list[dict]:
    out = []
    for pin in _pins(c):
        t = ctx.types.get(pin.get("type_id"))
        if t is None or t.group_id not in STORAGE_GROUPS or not t.capacity:
            continue
        contents = pin.get("contents") or []
        used = sum((x.get("amount") or 0) * ((ctx.types.get(x.get("type_id")).volume or 0) if ctx.types.get(x.get("type_id")) else 0)
                   for x in contents)
        out.append({
            "name": t.name,
            "capacity": t.capacity,
            "used": round(used, 2),
            "pct": round(min(100.0, used / t.capacity * 100), 1),
            "contents": sorted(({"type": ctx.type(x["type_id"]), "amount": x.get("amount") or 0} for x in contents if x.get("type_id")),
                               key=lambda x: -x["amount"])[:8],
        })
    return sorted(out, key=lambda s: -s["pct"])


def _status(expiry: datetime | None, now: datetime, lead: timedelta) -> str:
    if expiry is None:
        return "stopped"
    if expiry <= now:
        return "expired"
    return "soon" if expiry - now <= lead else "running"


def _iso(v):
    return v.isoformat() if v else None


def _planet_image(kind: str) -> str:
    return f"https://images.evetech.net/types/{PLANET_TYPES.get(kind, 11)}/icon?size=64"


def colony_out(c: Colony, ctx: Context, now: datetime, lead: timedelta) -> dict:
    exs, upcoming_expiries = [], []
    for ex in extractors(c):
        active = bool(ex["expiry"] and ex["expiry"] > now)
        if active:
            upcoming_expiries.append(ex["expiry"])
        exs.append({
            "pin_id": ex["pin_id"],
            "product": ctx.type(ex["product_id"]) if ex["product_id"] else None,
            "qty_per_cycle": ex["qty_per_cycle"],
            "cycle_time": ex["cycle_time"],
            "heads": ex["heads"],
            "per_day": round(ex["qty_per_cycle"] * DAY / ex["cycle_time"], 1) if active and ex["cycle_time"] else 0,
            "installed": _iso(ex["installed"]),
            "expiry": _iso(ex["expiry"]),
            "status": _status(ex["expiry"], now, lead),
        })
    exs.sort(key=lambda e: e["expiry"] or "")
    grouped: dict[tuple, dict] = {}
    for f in _factories(c, ctx):
        g = grouped.setdefault((f["schematic_id"], f["product_id"]), {
            "schematic": f["schematic"], "product": ctx.type(f["product_id"]) if f["product_id"] else None,
            "tier": f["tier"], "count": 0, "running": 0,
        })
        g["count"] += 1
        g["running"] += bool(f["inputs"])
    made, used = flow(c, ctx, now)
    outputs, inputs, value = net(made, used, ctx)
    system = ctx.systems.get(c.solar_system_id)
    char = c.character
    return {
        "id": c.pk,
        "planet_id": c.planet_id,
        "name": c.planet_name or f"Planet {c.planet_id}",
        "type": c.planet_type,
        "image": _planet_image(c.planet_type),
        "system": {"id": c.solar_system_id, "name": system.name if system else "", "security": system.display_security if system else 0},
        "upgrade_level": c.upgrade_level,
        "pins": c.num_pins,
        "last_update": _iso(c.last_update),
        "character": {"id": char.pk, "name": char.name, "portrait": portrait_url(char.pk, 64)},
        "extractors": exs,
        "factories": sorted(grouped.values(), key=lambda g: (-(g["tier"] or 0), g["schematic"])),
        "storage": _storage(c, ctx),
        "output": outputs,
        "inputs": inputs,
        "isk_per_day": value,
        "next_expiry": _iso(min(upcoming_expiries, default=None)),
        "expired": sum(e["status"] in ("expired", "stopped") for e in exs),
        "active": sum(e["status"] in ("running", "soon") for e in exs),
    }


# --- a member's own view ---------------------------------------------------------------------------------------------


def _my_colonies(user):
    return list(Colony.objects.filter(character__user=user).select_related("character").order_by("character__name", "planet_name"))


def me(user, now: datetime | None = None) -> dict:
    now = now or timezone.now()
    s = settings_for(user)
    colonies = _my_colonies(user)
    ctx = Context(colonies)
    lead = timedelta(hours=s["lead_hours"])
    rows = [colony_out(c, ctx, now, lead) for c in colonies]
    rows.sort(key=lambda r: (not r["expired"], r["next_expiry"] or "9999", r["character"]["name"], r["name"]))
    made, used = defaultdict(float), defaultdict(float)
    for c in colonies:
        m, u = flow(c, ctx, now)
        for t, v in m.items():
            made[t] += v
        for t, v in u.items():
            used[t] += v
    outputs, inputs, value = net(made, used, ctx)
    counts = defaultdict(int)
    for c in colonies:
        counts[c.character_id] += 1
    chars = Character.objects.filter(user=user).select_related("token").order_by("name")
    return {
        "colonies": rows,
        "totals": {
            "colonies": len(rows),
            "extractors": sum(len(r["extractors"]) for r in rows),
            "active": sum(r["active"] for r in rows),
            "expired": sum(r["expired"] for r in rows),
            "soon": sum(e["status"] == "soon" for r in rows for e in r["extractors"]),
            "isk_per_day": value,
            "output": outputs,
            "inputs": inputs,
        },
        "characters": [{
            "id": ch.pk, "name": ch.name, "portrait": portrait_url(ch.pk, 64), "colonies": counts.get(ch.pk, 0),
            "has_scope": _has_scope(ch),
        } for ch in chars],
        "settings": s,
        "can_view_corp": user.has_perm(VIEW_CORP_PERM),
    }


def _has_scope(ch: Character) -> bool:
    token = getattr(ch, "token", None)
    return bool(token and token.valid and SCOPE in token.scope_set)


def upcoming(user, limit: int = 5, now: datetime | None = None) -> dict:
    """For the dashboard widget: the member's extractors running out next, and how many already have."""
    now = now or timezone.now()
    lead = timedelta(hours=settings_for(user)["lead_hours"])
    items, expired, running = [], 0, 0
    colonies = _my_colonies(user)
    product_ids = set()
    for c in colonies:
        for ex in extractors(c):
            if ex["expiry"] is None or ex["expiry"] <= now:
                expired += 1
                continue
            running += 1
            product_ids.add(ex["product_id"])
            items.append((ex["expiry"], c, ex))
    items.sort(key=lambda i: i[0])
    types = types_by_id(product_ids)
    return {
        "expired": expired,
        "running": running,
        "colonies": len(colonies),
        "next": [{
            "character": c.character.name, "planet": c.planet_name or f"Planet {c.planet_id}", "planet_type": c.planet_type,
            "image": _planet_image(c.planet_type), "product": type_out(ex["product_id"], types) if ex["product_id"] else None,
            "expiry": ex["expiry"].isoformat(), "status": _status(ex["expiry"], now, lead),
        } for _, c, ex in items[:limit]],
    }


# --- reminders -------------------------------------------------------------------------------------------------------


def _due(colonies, s: dict, now: datetime) -> dict[str, list]:
    """The extractors of one member that a reminder is due for, by kind (not yet checked against what was sent)."""
    lead = timedelta(hours=s["lead_hours"])
    due = {Reminder.Kind.SOON: [], Reminder.Kind.EXPIRED: []}
    for c in colonies:
        for ex in extractors(c):
            exp = ex["expiry"]
            if exp is None or ex["pin_id"] is None:
                continue
            if exp <= now:
                if s["expired"] and now - exp <= EXPIRED_GRACE:
                    due[Reminder.Kind.EXPIRED].append((c, ex))
            elif s["soon"] and exp - now <= lead:
                # A program set shorter than the lead time was just started by hand: no point reminding of it.
                if ex["installed"] is None or exp - ex["installed"] > lead:
                    due[Reminder.Kind.SOON].append((c, ex))
    return due


def _mark(c: Colony, ex: dict, kind: str) -> bool:
    """Record the reminder; False when this program already had it."""
    try:
        with transaction.atomic():
            _, created = Reminder.objects.get_or_create(character_id=c.character_id, planet_id=c.planet_id, pin_id=ex["pin_id"],
                                                        expiry=ex["expiry"], kind=kind)
    except IntegrityError:  # another worker got there first
        return False
    return created


def _left(delta: timedelta) -> str:
    mins = max(0, int(delta.total_seconds() // 60))
    h, m = divmod(mins, 60)
    return f"{h}h {m}m" if h else f"{m}m"


def _announce(user, kind: str, items: list, s: dict, now: datetime) -> None:
    types = types_by_id(ex["product_id"] for _, ex in items)
    items = sorted(items, key=lambda i: i[1]["expiry"])
    lines, rows = [], []
    for c, ex in items:
        planet = c.planet_name or f"Planet {c.planet_id}"
        product = types[ex["product_id"]].name if ex["product_id"] in types else "extractor"
        when = f"in {_left(ex['expiry'] - now)}" if kind == Reminder.Kind.SOON else f"{_left(now - ex['expiry'])} ago"
        lines.append(f"{planet} ({c.character.name}): {product}, {when}")
        rows.append({"character": c.character.name, "character_id": c.character_id, "planet": planet, "planet_id": c.planet_id,
                     "product": product, "expiry": ex["expiry"].isoformat()})
    n = len(items)
    if kind == Reminder.Kind.SOON:
        title = (f"Extractor on {rows[0]['planet']} expires in {_left(items[0][1]['expiry'] - now)}" if n == 1
                 else f"{n} extractors expire within {s['lead_hours']} hour{'s' if s['lead_hours'] != 1 else ''}")
        level, event = "warning", "pi.extractors_expiring"
    else:
        title = f"Extractor on {rows[0]['planet']} expired" if n == 1 else f"{n} extractors expired"
        level, event = "danger", "pi.extractors_expired"
    summary = "; ".join(lines[:10]) + (f"; and {n - 10} more" if n > 10 else "")
    notify(user, title, summary, link=LINK, level=level, category="p.pi")
    bus.emit(event, user_id=user.pk, user=user.display_name, count=n, extractors=rows[:50], title=title, summary=summary,
             link=LINK, level=level)


def send_reminders(now: datetime | None = None) -> int:
    """Remind members of extractors about to expire and ones that just did, once per program. Returns how many."""
    from conduit.plugins.services import can_use

    now = now or timezone.now()
    by_user = defaultdict(list)
    for c in Colony.objects.select_related("character"):
        by_user[c.character.user_id].append(c)
    users = {u.pk: u for u in User.objects.filter(pk__in=by_user).select_related("main_character")}
    prefs = settings_map(list(by_user))
    sent = 0
    for uid, colonies in by_user.items():
        user = users.get(uid)
        if user is None or not user.is_active or not can_use(user, PLUGIN_ID):
            continue
        for kind, items in _due(colonies, prefs[uid], now).items():
            fresh = [(c, ex) for c, ex in items if _mark(c, ex, kind)]
            if fresh:
                _announce(user, kind, fresh, prefs[uid], now)
                sent += len(fresh)
    Reminder.objects.filter(expiry__lt=now - timedelta(days=30)).delete()
    return sent


def send_digests(now: datetime | None = None) -> int:
    """The daily digest for members who switched it on: what has expired, what runs out in the next day, ISK a day."""
    from conduit.plugins.services import can_use

    now = now or timezone.now()
    today = now.date()
    wanted = [uid for uid, plugins in UserPreferences.objects.values_list("user_id", "plugins")
              if clean_settings((plugins or {}).get(PLUGIN_ID))["digest"]]
    done = set(Digest.objects.filter(user_id__in=wanted, sent_on=today).values_list("user_id", flat=True))
    sent = 0
    for user in User.objects.filter(pk__in=[u for u in wanted if u not in done], is_active=True).select_related("main_character"):
        if not can_use(user, PLUGIN_ID):
            continue
        colonies = _my_colonies(user)
        if not colonies:
            continue
        ctx = Context(colonies)
        expired = soon = running = 0
        made, used = defaultdict(float), defaultdict(float)
        for c in colonies:
            for ex in extractors(c):
                if ex["expiry"] is None or ex["expiry"] <= now:
                    expired += 1
                else:
                    running += 1
                    soon += ex["expiry"] - now <= timedelta(days=1)
            m, u = flow(c, ctx, now)
            for t, v in m.items():
                made[t] += v
            for t, v in u.items():
                used[t] += v
        _, _, value = net(made, used, ctx)
        parts = []
        if expired:
            parts.append(f"{expired} extractor{'s' if expired != 1 else ''} not running")
        if soon:
            parts.append(f"{soon} expire{'s' if soon == 1 else ''} in the next 24 hours")
        title = "PI: " + (", ".join(parts) if parts else f"all {running} extractors running")
        body = f"{len(colonies)} colon{'ies' if len(colonies) != 1 else 'y'}, about {value / 1e6:,.1f}M ISK a day."
        notify(user, title, body, link=LINK, level="warning" if expired else "info", category="p.pi")
        Digest.objects.update_or_create(user=user, defaults={"sent_on": today})
        sent += 1
    return sent


# --- the corporation view ----------------------------------------------------------------------------------------------


def corp_overview(user, idle_days: int = 3, corporation_id: int | None = None, now: datetime | None = None) -> dict:
    """PI of every character the officer's character sheet access covers: totals by product, who makes what and idle
    colonies (every extractor stopped for more than ``idle_days``)."""
    from conduit.sheet.access import viewable_characters

    if not user.has_perm(VIEW_CORP_PERM):
        raise PiError("You don't have permission to do that", 403)
    now = now or timezone.now()
    idle_days = min(365, max(0, int(idle_days)))
    chars = viewable_characters(user)
    corporations = sorted({(c.corporation_id, c.corporation.name) for c in chars.filter(colonies__isnull=False).distinct()
                           if c.corporation_id}, key=lambda c: c[1])
    if corporation_id:
        chars = chars.filter(corporation_id=corporation_id)
    colonies = list(Colony.objects.filter(character__in=chars).select_related(
        "character__corporation", "character__user__main_character__corporation"))
    ctx = Context(colonies)

    per_user: dict[int, dict] = {}
    idle = []
    for c in colonies:
        u = c.character.user
        m = per_user.setdefault(u.pk, {"user": u, "made": defaultdict(float), "used": defaultdict(float), "characters": set(),
                                       "colonies": 0, "active": 0, "expired": 0, "idle": 0})
        made, used = flow(c, ctx, now)
        for t, v in made.items():
            m["made"][t] += v
        for t, v in used.items():
            m["used"][t] += v
        m["characters"].add(c.character_id)
        m["colonies"] += 1
        exs = extractors(c)
        running = [e for e in exs if e["expiry"] and e["expiry"] > now]
        m["active"] += len(running)
        m["expired"] += len(exs) - len(running)
        if exs and not running:
            last = max((e["expiry"] for e in exs if e["expiry"]), default=None) or c.last_update
            if last <= now - timedelta(days=idle_days):
                m["idle"] += 1
                idle.append({
                    "colony": c.pk, "planet": c.planet_name or f"Planet {c.planet_id}", "type": c.planet_type,
                    "image": _planet_image(c.planet_type),
                    "system": ctx.systems[c.solar_system_id].name if c.solar_system_id in ctx.systems else "",
                    "upgrade_level": c.upgrade_level, "character": c.character.name, "character_id": c.character_id,
                    "member": u.display_name, "since": last.isoformat(), "days": (now - last).days,
                    "products": sorted({ctx.type(e["product_id"])["name"] for e in exs if e["product_id"]}),
                })

    products: dict[int, dict] = {}
    members = []
    total_value = 0.0
    for m in per_user.values():
        outputs, _, value = net(m["made"], m["used"], ctx)
        total_value += value
        u = m["user"]
        main = u.main_character
        brief = {"id": u.pk, "name": u.display_name, "portrait": portrait_url(main.pk, 64) if main else None,
                 "corporation": main.corporation.name if main and main.corporation else None}
        for o in outputs:
            p = products.setdefault(o["type"]["id"], {"type": o["type"], "per_day": 0.0, "isk_per_day": 0.0, "producers": []})
            p["per_day"] += o["per_day"]
            p["isk_per_day"] += o["isk_per_day"]
            p["producers"].append({"id": u.pk, "name": u.display_name, "per_day": o["per_day"]})
        members.append({**brief, "characters": len(m["characters"]), "colonies": m["colonies"], "active": m["active"],
                        "expired": m["expired"], "idle": m["idle"], "isk_per_day": value,
                        "products": [o["type"]["name"] for o in outputs[:6]]})
    for p in products.values():
        p["per_day"] = round(p["per_day"], 1)
        p["isk_per_day"] = round(p["isk_per_day"], 2)
        p["producers"].sort(key=lambda x: -x["per_day"])
    members.sort(key=lambda x: (-x["isk_per_day"], x["name"]))
    idle.sort(key=lambda x: -x["days"])
    return {
        "totals": {
            "members": len(members), "colonies": len(colonies), "active": sum(m["active"] for m in members),
            "expired": sum(m["expired"] for m in members), "idle": len(idle), "isk_per_day": round(total_value, 2),
        },
        "products": sorted(products.values(), key=lambda p: (-(p["type"]["tier"] or 0), -p["isk_per_day"])),
        "members": members,
        "idle": idle,
        "idle_days": idle_days,
        "corporations": [{"id": cid, "name": name} for cid, name in corporations],
        "corporation": corporation_id or None,
    }
