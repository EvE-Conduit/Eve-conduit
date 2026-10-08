"""Doctrines and fits: who can fly what, the fitting view's data, saving to the game, readiness and search.

Required skills are what the ship, modules, charges and drones of a fit need (``ItemType.required_skills``) with
their prerequisites. A character is:

- **ready**: has those and the fit's recommended skills,
- **can fly**: has the required skills,
- **missing**: lacks some required skills (with how long they take to train with the character's attributes).
"""

from __future__ import annotations

from collections import defaultdict

from django.db.models import Q

from conduit.accounts.models import Character
from conduit.sde.models import ItemType, type_icon_url, type_render_url
from conduit.sheet.skills import training
from conduit.sheet.util import prices_by_type

from . import eft
from .models import Doctrine, DoctrineFit, Fit

WRITE_SCOPE = "esi-fittings.write_fittings.v1"
ROLES = ("DPS", "Logistics", "Tackle", "Ewar", "Support", "Booster", "Scout", "Command")
#: How good a status is, for picking a member's best character.
RANK = {"ready": 3, "can_fly": 2, "missing": 1, "unknown": 0}
#: Fitting skills at V: CPU Management and Power Grid Management (+5% ship output a level), Weapon Upgrades (-5% CPU
#: of turrets and launchers a level) and Advanced Weapon Upgrades (-2% their powergrid a level).
OUTPUT_BONUS, WEAPON_CPU, WEAPON_POWER = 1.25, 0.75, 0.9


class DoctrineError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_manage(user) -> bool:
    return user.has_perm("doctrines.manage_doctrines")


def can_see_readiness(user) -> bool:
    return user.has_perm("doctrines.view_readiness") or can_manage(user)


# --- skills --------------------------------------------------------------------------------------------------------


def fit_type_ids(fit: Fit) -> set[int]:
    ids = {fit.ship_type_id}
    for i in fit.items:
        ids.add(i["type_id"])
        if i.get("charge_id"):
            ids.add(i["charge_id"])
    return ids


class Skills:
    """Required and recommended skill steps of some fits, worked out once for a request."""

    def __init__(self, fits):
        fits = list(fits)
        all_ids = set().union(*(fit_type_ids(f) for f in fits)) if fits else set()
        reqs = dict(ItemType.objects.filter(pk__in=all_ids).values_list("id", "required_skills"))
        self.required: dict[int, dict[int, int]] = {}
        for f in fits:
            need: dict[int, int] = {}
            for tid in fit_type_ids(f):
                for sid, level in reqs.get(tid) or ():
                    need[sid] = max(need.get(sid, 0), level)
            self.required[f.pk] = need
        skill_ids = {s for need in self.required.values() for s in need} | {int(s) for f in fits for s, _ in f.recommended}
        self.info = training.skill_info(skill_ids)
        self.required_steps = {f.pk: training.plan(self.required[f.pk].items(), self.info) for f in fits}
        self.all_steps = {f.pk: training.plan([*self.required[f.pk].items(), *map(tuple, f.recommended)], self.info) for f in fits}
        self.required_levels = {pk: training.highest(s) for pk, s in self.required_steps.items()}
        self.all_levels = {pk: training.highest(s) for pk, s in self.all_steps.items()}

    def status(self, fit_id: int, state: dict) -> dict:
        levels = state["levels"]
        if not state["synced"] and not levels:
            return {"status": "unknown", "missing": None, "seconds": None}
        if training.meets(levels, self.all_levels[fit_id]):
            return {"status": "ready", "missing": 0, "seconds": 0}
        if training.meets(levels, self.required_levels[fit_id]):
            extra = training.progress(self.all_steps[fit_id], state, self.info)
            return {"status": "can_fly", "missing": 0, "seconds": extra["seconds_left"]}
        p = training.progress(self.required_steps[fit_id], state, self.info)
        return {"status": "missing", "missing": p["total"] - p["done"], "seconds": p["seconds_left"]}


def best(statuses: list[dict]) -> dict | None:
    """The best of several characters' statuses: highest rank, then least training."""
    return max(statuses, key=lambda s: (RANK[s["status"]], -(s["seconds"] or 0)), default=None)


def _chars_out(chars):
    return [{"id": c.pk, "name": c.name, "portrait": c.portrait} for c in chars]


# --- output --------------------------------------------------------------------------------------------------------


def _types(ids) -> dict[int, ItemType]:
    return {t.pk: t for t in ItemType.objects.filter(pk__in={int(i) for i in ids if i}).select_related("group__category")}


def _type_brief(tid: int | None, types) -> dict | None:
    if not tid:
        return None
    t = types.get(tid)
    return {"id": tid, "name": t.name if t else f"Type {tid}", "group": t.group.name if t else "", "icon": type_icon_url(tid)}


def doctrine_icon(d: Doctrine, first_ship: int | None) -> int | None:
    return d.icon_type_id or first_ship


def fit_brief(fit: Fit, types) -> dict:
    ship = types.get(fit.ship_type_id)
    return {
        "id": fit.pk,
        "name": fit.name,
        "role": fit.role,
        "ship": {"id": fit.ship_type_id, "name": ship.name if ship else f"Type {fit.ship_type_id}",
                 "group": ship.group.name if ship else "", "icon": type_icon_url(fit.ship_type_id),
                 "render": type_render_url(fit.ship_type_id, 128)},
    }


def overview(user) -> dict:
    doctrines = list(Doctrine.objects.prefetch_related("entries__fit"))
    fits = {e.fit_id: e.fit for d in doctrines for e in d.entries.all()}
    #: Fits that aren't in any doctrine are shown on their own, below the doctrines.
    loose = list(Fit.objects.filter(entries__isnull=True))
    fits |= {f.pk: f for f in loose}
    types = _types({f.ship_type_id for f in fits.values()} | {d.icon_type_id for d in doctrines})
    sk = Skills(fits.values())
    chars = list(Character.objects.filter(user=user))
    states = training.character_state(c.pk for c in chars)
    mine = {fid: best([sk.status(fid, states[c.pk]) for c in chars]) for fid in fits}
    out = []
    for d in doctrines:
        entries = list(d.entries.all())
        ships = []
        for e in entries:
            if e.fit.ship_type_id not in [s["id"] for s in ships]:
                ships.append({"id": e.fit.ship_type_id, "name": types[e.fit.ship_type_id].name if e.fit.ship_type_id in types else "",
                              "icon": type_icon_url(e.fit.ship_type_id)})
        icon = doctrine_icon(d, entries[0].fit.ship_type_id if entries else None)
        out.append({
            "id": d.pk, "name": d.name, "description": d.description, "active": d.active,
            "render": type_render_url(icon, 256) if icon else None,
            "ships": ships[:8], "fits": len(entries),
            "flyable": sum(1 for e in entries if mine.get(e.fit_id) and mine[e.fit_id]["status"] in ("ready", "can_fly")),
        })
    prices = prices_by_type(set().union(*(fit_type_ids(f) for f in loose)) if loose else set())
    other = [{**fit_brief(f, types), "value": fit_value(f, prices), "best": mine.get(f.pk)} for f in loose]
    return {"doctrines": out, "fits": other, "can_manage": can_manage(user), "can_see_readiness": can_see_readiness(user),
            "roles": ROLES}


def doctrine_detail(d: Doctrine, user) -> dict:
    entries = list(d.entries.select_related("fit"))
    fits = [e.fit for e in entries]
    types = _types({f.ship_type_id for f in fits} | {d.icon_type_id})
    sk = Skills(fits)
    chars = list(Character.objects.filter(user=user).order_by("name"))
    states = training.character_state(c.pk for c in chars)
    icon = doctrine_icon(d, fits[0].ship_type_id if fits else None)
    prices = prices_by_type(set().union(*(fit_type_ids(f) for f in fits)) if fits else set())
    out_fits = []
    for f in fits:
        per_char = [{"character": {"id": c.pk, "name": c.name, "portrait": c.portrait}, **sk.status(f.pk, states[c.pk])} for c in chars]
        out_fits.append({**fit_brief(f, types), "value": fit_value(f, prices), "characters": per_char,
                         "best": best([{k: v for k, v in p.items() if k != "character"} for p in per_char])})
    return {
        "id": d.pk, "name": d.name, "description": d.description, "active": d.active, "order": d.order,
        "icon_type_id": d.icon_type_id, "render": type_render_url(icon, 512) if icon else None,
        "fits": out_fits, "can_manage": can_manage(user),
    }


def fit_value(fit: Fit, prices) -> float:
    total = prices.get(fit.ship_type_id, 0)
    for i in fit.items:
        total += prices.get(i["type_id"], 0) * i["quantity"]
        if i.get("charge_id"):
            total += prices.get(i["charge_id"], 0)
    return total


def fit_view(fit: Fit) -> dict:
    """What the fitting ring and list need: slots, items, hardpoints, resources and value."""
    types = _types(fit_type_ids(fit))
    ship = types.get(fit.ship_type_id)
    subs = [types[i["type_id"]] for i in fit.items if i["slot"] == "sub" and i["type_id"] in types]
    slots = eft.ship_slots(ship, subs)
    prices = prices_by_type(fit_type_ids(fit))
    sf = (ship.fitting if ship else None) or {}
    used = {"cpu": 0.0, "power": 0.0, "calibration": 0.0}
    base_used = dict(used)
    turrets = launchers = 0
    items = []
    for i in sorted(fit.items, key=lambda i: (i["slot"], i["position"])):
        t = types.get(i["type_id"])
        f = (t.fitting if t else None) or {}
        if i["slot"] in eft.SLOTS:
            weapon = f.get("turret") or f.get("launcher")
            if not i.get("offline"):
                base_used["cpu"] += f.get("cpu", 0)
                base_used["power"] += f.get("power", 0)
                used["cpu"] += f.get("cpu", 0) * (WEAPON_CPU if weapon else 1)
                used["power"] += f.get("power", 0) * (WEAPON_POWER if weapon else 1)
            used["calibration"] += f.get("calibration", 0)
            base_used["calibration"] += f.get("calibration", 0)
            turrets += bool(f.get("turret"))
            launchers += bool(f.get("launcher"))
        items.append({**i, "type": _type_brief(i["type_id"], types), "charge": _type_brief(i.get("charge_id"), types),
                      "turret": bool(f.get("turret")), "launcher": bool(f.get("launcher")),
                      "category": t.group.category.name if t else ""})
    return {
        "ship": {**fit_brief(fit, types)["ship"], "render": type_render_url(fit.ship_type_id, 512)},
        "slots": slots,
        "known": ship is not None and ship.fitting is not None,
        "items": items,
        "hardpoints_used": {"turrets": turrets, "launchers": launchers},
        # With the fitting skills at V, like the game shows a fit for a trained pilot; base_* without any skills.
        "resources": [
            {"key": key, "label": label, "unit": unit, "used": round(used[key], 2), "total": round(sf.get(key, 0) * bonus, 2),
             "base_used": round(base_used[key], 2), "base_total": sf.get(key, 0)}
            for key, label, unit, bonus in (("cpu", "CPU", "tf", OUTPUT_BONUS), ("power", "Powergrid", "MW", OUTPUT_BONUS),
                                            ("calibration", "Calibration", "", 1))
        ],
        "value": fit_value(fit, prices),
    }


def _steps_out(steps, names):
    return [{"skill_id": sid, "name": names.get(sid, f"Skill {sid}"), "level": lvl} for sid, lvl in steps]


def fit_detail(fit: Fit, user) -> dict:
    sk = Skills([fit])
    req_steps, all_steps = sk.required_steps[fit.pk], sk.all_steps[fit.pk]
    names = dict(ItemType.objects.filter(pk__in={s for s, _ in all_steps}).values_list("id", "name"))
    types = _types(fit_type_ids(fit))
    chars = list(Character.objects.filter(user=user).select_related("token").order_by("name"))
    states = training.character_state(c.pk for c in chars)
    characters = []
    for c in chars:
        st = states[c.pk]
        status = sk.status(fit.pk, st)
        prog = training.progress(all_steps, st, sk.info)
        required = set(req_steps)
        missing = [{**s, "name": names.get(s["skill_id"], f"Skill {s['skill_id']}"), "required": (s["skill_id"], s["level"]) in required}
                   for s in prog["steps"] if s["status"] != "done"]
        token = getattr(c, "token", None)
        characters.append({
            "id": c.pk, "name": c.name, "portrait": c.portrait, **status, "missing_steps": missing,
            "can_save": bool(token and token.has_scopes(WRITE_SCOPE)),
        })
    required_levels, recommended = sk.required[fit.pk], [tuple(r) for r in fit.recommended]
    return {
        **fit_brief(fit, types),
        "notes": fit.notes,
        "recommended": [{"skill_id": s, "name": names.get(s) or _skill_name(s), "level": lvl} for s, lvl in recommended],
        "required": sorted(({"skill_id": s, "name": names.get(s, f"Skill {s}"), "level": lvl} for s, lvl in required_levels.items()),
                           key=lambda r: r["name"]),
        "required_steps": _steps_out(req_steps, names),
        "all_steps": _steps_out(all_steps, names),
        "eft": eft.export(fit, types),
        "view": fit_view(fit),
        "characters": characters,
        "doctrines": [{"id": d.pk, "name": d.name} for d in fit.doctrines.all()],
        "can_manage": can_manage(user),
        "items": fit.items,
        "updated_at": fit.updated_at.isoformat(),
    }


def _skill_name(sid: int) -> str:
    t = ItemType.objects.filter(pk=sid).first()
    return t.name if t else f"Skill {sid}"


def plan_text(fit: Fit, character_id: int | None, user) -> str:
    """Missing skills (all of the plan if no character) in the game's skill plan text."""
    sk = Skills([fit])
    steps = sk.all_steps[fit.pk]
    if character_id:
        char = Character.objects.filter(pk=character_id, user=user).first()
        if char is None:
            raise DoctrineError("Pick one of your own characters")
        st = training.character_state([char.pk])[char.pk]
        steps = [(s["skill_id"], s["level"]) for s in training.progress(steps, st, sk.info)["steps"] if s["status"] != "done"]
    return training.format_text(steps)


def character_fits(character: Character) -> list[dict]:
    """Every fit and whether this character can fly it (for the character sheet tab): by doctrine, then the fits
    that aren't in one under ``id`` None."""
    entries = list(DoctrineFit.objects.select_related("doctrine", "fit").order_by("doctrine__name", "order"))
    loose = list(Fit.objects.filter(entries__isnull=True))
    fits = {e.fit_id: e.fit for e in entries} | {f.pk: f for f in loose}
    sk = Skills(fits.values())
    types = _types({f.ship_type_id for f in fits.values()})
    state = training.character_state([character.pk])[character.pk]
    out = defaultdict(list)
    names = {}
    for e in entries:
        names[e.doctrine_id] = e.doctrine.name
        out[e.doctrine_id].append({**fit_brief(e.fit, types), **sk.status(e.fit_id, state)})
    groups = [{"id": did, "name": names[did], "fits": rows} for did, rows in out.items()]
    if loose:
        groups.append({"id": None, "name": "Other fits", "fits": [{**fit_brief(f, types), **sk.status(f.pk, state)} for f in loose]})
    return groups


def my_summary(user) -> dict:
    fits = list(Fit.objects.filter(doctrines__active=True).distinct())
    sk = Skills(fits)
    chars = list(Character.objects.filter(user=user).values_list("id", flat=True))
    states = training.character_state(chars)
    flyable = [f for f in fits if any(sk.status(f.pk, states[c])["status"] in ("ready", "can_fly") for c in chars)]
    types = _types({f.ship_type_id for f in flyable[:6]})
    return {"total": len(fits), "flyable": len(flyable), "ships": [fit_brief(f, types)["ship"] for f in flyable[:6]]}


# --- readiness -----------------------------------------------------------------------------------------------------


def readiness(doctrine: Doctrine, viewer=None) -> dict:
    """Every member against every fit of a doctrine: their best character for it.

    The character's name is only given when ``viewer`` may read that character's sheet anyway (the core sheet
    permissions): readiness alone mustn't reveal who owns which alt.
    """
    from conduit.access.services import site_members
    from conduit.sheet.access import can_view

    visible: dict[int, bool] = {}

    def shown(c) -> str | None:
        if viewer is None:
            return c.name
        if c.pk not in visible:
            visible[c.pk] = can_view(viewer, c)
        return c.name if visible[c.pk] else None

    fits = [e.fit for e in doctrine.entries.select_related("fit")]
    types = _types({f.ship_type_id for f in fits})
    sk = Skills(fits)
    users = list(site_members().select_related("main_character").order_by("main_character__name"))
    chars = defaultdict(list)
    for c in Character.objects.filter(user__in=users).only("id", "name", "user_id", "corporation_id", "alliance_id"):
        chars[c.user_id].append(c)
    states = training.character_state(c.pk for cs in chars.values() for c in cs)
    members = []
    for u in users:
        cells = {}
        for f in fits:
            options = [{**sk.status(f.pk, states[c.pk]), "_character": c} for c in chars[u.pk]]
            cell = best(options)
            if cell:
                cell = {k: v for k, v in cell.items() if k != "_character"} | {"character": shown(cell["_character"])}
            cells[str(f.pk)] = cell
        members.append({"id": u.pk, "name": u.display_name, "portrait": u.main_character.portrait if u.main_character else None,
                        "cells": cells, "flyable": sum(1 for c in cells.values() if c and c["status"] in ("ready", "can_fly"))})
    totals = {str(f.pk): sum(1 for m in members if m["cells"][str(f.pk)] and m["cells"][str(f.pk)]["status"] in ("ready", "can_fly"))
              for f in fits}
    return {"doctrine": {"id": doctrine.pk, "name": doctrine.name}, "fits": [fit_brief(f, types) for f in fits],
            "members": members, "totals": totals}


# --- saving --------------------------------------------------------------------------------------------------------


def save_to_eve(fit: Fit, character_id: int, user) -> int:
    """Add the fit to a character's saved fittings in the game. Returns the new in-game fitting id."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

    char = Character.objects.filter(pk=character_id, user=user).select_related("token").first()
    if char is None:
        raise DoctrineError("Pick one of your own characters")
    token = getattr(char, "token", None)
    if token is None or not token.has_scopes(WRITE_SCOPE):
        raise DoctrineError(f"{char.name} hasn't allowed saving fittings; log in with it again (Characters → Add character)")
    body = {
        "name": fit.name[:50],
        "description": (fit.notes or f"Doctrine fit from {', '.join(d.name for d in fit.doctrines.all()) or 'EvE Conduit'}")[:500],
        "ship_type_id": fit.ship_type_id,
        "items": eft.esi_items(fit),
    }
    try:
        data = esi().post(f"/characters/{char.pk}/fittings", body, character=char).data
    except TokenInvalid:
        raise DoctrineError(f"{char.name}'s login has stopped working; log in with it again") from None
    except EsiBackoff:
        raise DoctrineError("ESI is busy; try again in a minute", 503) from None
    except EsiError as exc:
        if exc.status == 400:
            raise DoctrineError("The game refused the fit (it may already have 500 fittings saved)") from None
        raise DoctrineError(f"ESI didn't take it ({exc.status}); try again in a moment") from None
    return int((data or {}).get("fitting_id") or 0)


def clean_recommended(raw) -> list[list[int]]:
    out, seen = [], set()
    for row in raw or []:
        try:
            sid, level = int(row[0]), int(row[1])
        except (TypeError, ValueError, IndexError):
            raise DoctrineError("Recommended skills must be [skill, level] pairs") from None
        if not 1 <= level <= 5:
            raise DoctrineError("Skill levels are 1 to 5")
        if sid not in seen:
            seen.add(sid)
            out.append([sid, level])
    known = set(ItemType.objects.filter(pk__in=seen, group__category_id=training.SKILL_CATEGORY).values_list("id", flat=True))
    if seen - known:
        raise DoctrineError("Some recommended skills aren't skills")
    return out


# --- search --------------------------------------------------------------------------------------------------------


def search(request, q, limit):
    """Ctrl+K: doctrines and fits by name or ship."""
    hits = [{"id": f"doctrine:{d.pk}", "title": d.name, "subtitle": "Doctrine", "icon": "swords", "url": f"/p/doctrines/{d.pk}"}
            for d in Doctrine.objects.filter(name__icontains=q)[:limit]]
    ship_ids = list(ItemType.objects.filter(name__icontains=q, group__category_id=eft.SHIP_CATEGORY).values_list("id", flat=True)[:50])
    fits = Fit.objects.filter(Q(name__icontains=q) | Q(ship_type_id__in=ship_ids))[: max(0, limit - len(hits))]
    types = _types({f.ship_type_id for f in fits})
    for f in fits:
        ship = types.get(f.ship_type_id)
        hits.append({"id": f"fit:{f.pk}", "title": f.name, "subtitle": f"{ship.name if ship else 'Fit'}{' · ' + f.role if f.role else ''}",
                     "image": type_icon_url(f.ship_type_id), "url": f"/p/doctrines/fit/{f.pk}"})
    return {"key": "doctrines", "label": "Doctrines", "hits": hits}
