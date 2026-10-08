"""Fits in and out: EFT text (what the game's fitting window copies and imports, and what Pyfa uses), the game's own
saved fittings, and ESI's fitting format.

Modules go in the slot their dogma says (``ItemType.fitting["slot"]``), not the section they were pasted in, so a
fit pasted in any order lands right. Strategic Cruisers get their slots from their subsystems.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict

from django.db.models.functions import Lower

from conduit.sde.models import ItemType

#: Fitted slots, in the order EFT lists them.
SLOTS = ("low", "med", "hi", "rig", "sub", "service")
BAYS = ("drone", "fighter", "cargo")
SLOT_LABEL = {"hi": "high", "med": "mid", "low": "low", "rig": "rig", "sub": "subsystem", "service": "service"}
EMPTY = {"low": "[Empty Low slot]", "med": "[Empty Med slot]", "hi": "[Empty High slot]", "rig": "[Empty Rig slot]",
         "sub": "[Empty Subsystem slot]", "service": "[Empty Service slot]"}
#: ESI item flags.
FLAG_PREFIX = {"hi": "HiSlot", "med": "MedSlot", "low": "LoSlot", "rig": "RigSlot", "sub": "SubSystemSlot", "service": "ServiceSlot"}
BAY_FLAG = {"drone": "DroneBay", "fighter": "FighterBay", "cargo": "Cargo"}
SHIP_CATEGORY, DRONE_CATEGORY, FIGHTER_CATEGORY = 6, 18, 87

_HEADER = re.compile(r"^\[\s*(?P<ship>[^,\]]+?)\s*(?:,\s*(?P<name>.*?))?\s*\]$")
_QUANTITY = re.compile(r"^(?P<name>.+?)\s+x(?P<qty>\d+)$", re.IGNORECASE)
_OFFLINE = re.compile(r"\s*/\s*offline$", re.IGNORECASE)


class FitError(ValueError):
    pass


def types_by_name(names) -> dict[str, ItemType]:
    """Lower-cased name to type; published types win over unpublished ones with the same name."""
    lowered = {n.strip().lower() for n in names if n and n.strip()}
    out: dict[str, ItemType] = {}
    rows = ItemType.objects.annotate(lname=Lower("name")).filter(lname__in=lowered).select_related("group")
    for t in sorted(rows, key=lambda t: t.published):
        out[t.name.lower()] = t
    return out


def ship_slots(ship: ItemType | None, subsystems=()) -> dict:
    """How many of each slot (and hardpoints) a ship has, counting what its subsystems add."""
    f = (ship.fitting if ship else None) or {}
    out = {s: int(f.get(s) or 0) for s in SLOTS} | {"turrets": int(f.get("turrets") or 0), "launchers": int(f.get("launchers") or 0)}
    for sub in subsystems:
        for key, n in ((sub.fitting or {}).get("adds") or {}).items():
            if key in out:
                out[key] += int(n)
    return out


def _bay_for(t: ItemType) -> str:
    category = t.group.category_id if t.group_id else None
    return {DRONE_CATEGORY: "drone", FIGHTER_CATEGORY: "fighter"}.get(category, "cargo")


def check(ship: ItemType, items: list[dict], types: dict[int, ItemType]) -> list[str]:
    """What stops the fit being fitted: too many modules for a slot or hardpoint, rigs of the wrong size."""
    problems = []
    subs = [types[i["type_id"]] for i in items if i["slot"] == "sub" and i["type_id"] in types]
    slots = ship_slots(ship, subs)
    if ship.fitting is None:
        return ["This site's EVE static data has no fitting data yet, so modules can't be put in their slots. It's imported "
                "again by itself after updating EvE Conduit (about a minute); if this stays, an administrator can press "
                "Import again under Administration → Health."]
    counts = Counter(i["slot"] for i in items if i["slot"] in SLOTS)
    for slot, n in counts.items():
        if n > slots[slot]:
            problems.append(f"{n} {SLOT_LABEL[slot]} slot modules, but the {ship.name} has {slots[slot]} {SLOT_LABEL[slot]} slots")
    for kind, flag in (("turrets", "turret"), ("launchers", "launcher")):
        n = sum(1 for i in items if i["slot"] == "hi" and (types.get(i["type_id"]) and (types[i["type_id"]].fitting or {}).get(flag)))
        if n > slots[kind]:
            problems.append(f"{n} {kind}, but the {ship.name} has {slots[kind]} {kind[:-1]} hardpoints")
    ship_size = (ship.fitting or {}).get("rig_size")
    for i in items:
        t = types.get(i["type_id"])
        size = (t.fitting or {}).get("rig_size") if t else None
        if i["slot"] == "rig" and ship_size and size and size != ship_size:
            problems.append(f"{t.name} is for a different ship size")
    return problems


def parse(text: str) -> dict:
    """Read an EFT fit. Raises ``FitError`` if there's no ship; returns the fit with any ``unknown`` lines and
    ``problems`` (things that stop it being fitted)."""
    lines = [line.strip() for line in (text or "").replace("\r", "").split("\n")]
    lines = [line for line in lines if line]
    if not lines:
        raise FitError("Paste a fit: the first line looks like [Rifter, My Rifter]")
    header = _HEADER.match(lines[0])
    if not header:
        raise FitError("The first line must be the ship and fit name, like [Rifter, My Rifter]")

    entries = []  # (name, charge, quantity or None, offline, line)
    unknown = []
    for line in lines[1:]:
        if line.startswith("["):
            if not line.lower().startswith("[empty"):
                unknown.append(line)
            continue
        offline = bool(_OFFLINE.search(line))
        line_clean = _OFFLINE.sub("", line)
        qty = _QUANTITY.match(line_clean)
        if qty:
            entries.append((qty["name"].strip(), None, int(qty["qty"]), offline, line))
        else:
            name, _, charge = line_clean.partition(",")
            entries.append((name.strip(), charge.strip() or None, None, offline, line))

    names = types_by_name([header["ship"]] + [e[0] for e in entries] + [e[1] for e in entries if e[1]])
    ship = names.get(header["ship"].strip().lower())
    if ship is None or ship.group.category_id != SHIP_CATEGORY:
        raise FitError(f"{header['ship'].strip()} isn't a ship")

    items, positions, bays = [], defaultdict(int), {}
    for name, charge_name, quantity, offline, line in entries:
        t = names.get(name.lower())
        if t is None:
            unknown.append(line)
            continue
        slot = (t.fitting or {}).get("slot") if quantity is None else None
        if slot in SLOTS:
            charge = names.get(charge_name.lower()) if charge_name else None
            if charge_name and charge is None:
                unknown.append(f"{charge_name} (loaded in {t.name})")
            items.append({"slot": slot, "position": positions[slot], "type_id": t.pk, "charge_id": charge.pk if charge else None,
                          "quantity": 1, "offline": offline})
            positions[slot] += 1
        else:
            bay = _bay_for(t)
            key = (bay, t.pk)
            if key in bays:
                bays[key]["quantity"] += quantity or 1
            else:
                bays[key] = {"slot": bay, "position": len(bays), "type_id": t.pk, "charge_id": None, "quantity": quantity or 1, "offline": False}
                items.append(bays[key])

    types = {t.pk: t for t in names.values()}
    return {
        "ship_type_id": ship.pk,
        "name": (header["name"] or "").strip()[:100] or ship.name,
        "items": items,
        "unknown": unknown,
        "problems": check(ship, items, types),
    }


def from_ingame(fitting) -> dict:
    """A character's saved in-game fitting (``sheet.fittings.Fitting``) as a fit."""
    ids = {i["type_id"] for i in fitting.items} | {fitting.ship_type_id}
    types = {t.pk: t for t in ItemType.objects.filter(pk__in=ids).select_related("group")}
    items, bays = [], {}
    for i in sorted(fitting.items, key=lambda i: i["flag"]):
        flag, t = i["flag"], types.get(i["type_id"])
        slot = next((s for s, prefix in FLAG_PREFIX.items() if flag.startswith(prefix)), None)
        if slot:
            pos = int(re.sub(r"\D", "", flag) or 0)
            items.append({"slot": slot, "position": pos, "type_id": i["type_id"], "charge_id": None, "quantity": 1, "offline": False})
            continue
        bay = {"DroneBay": "drone", "FighterBay": "fighter"}.get(flag) or (_bay_for(t) if t and flag != "Cargo" else "cargo")
        key = (bay, i["type_id"])
        if key in bays:
            bays[key]["quantity"] += i["quantity"]
        else:
            bays[key] = {"slot": bay, "position": len(bays), "type_id": i["type_id"], "charge_id": None, "quantity": i["quantity"], "offline": False}
            items.append(bays[key])
    ship = types.get(fitting.ship_type_id)
    return {"ship_type_id": fitting.ship_type_id, "name": fitting.name[:100], "items": items, "unknown": [],
            "problems": check(ship, items, types) if ship else []}


def export(fit, types: dict[int, ItemType]) -> str:
    """The fit as EFT, as the game copies it: low, mid, high, rigs, subsystems with empty-slot lines, then drones,
    fighters and cargo."""
    ship = types.get(fit.ship_type_id)

    def name(tid):
        return types[tid].name if tid in types else f"Type {tid}"

    subs = [types[i["type_id"]] for i in fit.items if i["slot"] == "sub" and i["type_id"] in types]
    slots = ship_slots(ship, subs)
    by_slot = defaultdict(list)
    for i in fit.items:
        by_slot[i["slot"]].append(i)
    blocks = []
    for slot in SLOTS:
        fitted = sorted(by_slot.get(slot, []), key=lambda i: i["position"])
        total = max(slots[slot], len(fitted))
        if not total:
            continue
        lines = []
        for i in fitted:
            line = name(i["type_id"])
            if i.get("charge_id"):
                line += f", {name(i['charge_id'])}"
            if i.get("offline"):
                line += " /OFFLINE"
            lines.append(line)
        lines += [EMPTY[slot]] * (total - len(fitted))
        blocks.append("\n".join(lines))
    for bay in BAYS:
        rows = sorted(by_slot.get(bay, []), key=lambda i: i["position"])
        if rows:
            blocks.append("\n".join(f"{name(i['type_id'])} x{i['quantity']}" for i in rows))
    ship_name = ship.name if ship else f"Type {fit.ship_type_id}"
    return f"[{ship_name}, {fit.name}]\n" + "\n\n".join(blocks) + "\n"


def esi_items(fit) -> list[dict]:
    """The fit's items in ESI's fitting format. Loaded charges go to the cargo, one per module."""
    out, cargo = [], Counter()
    for i in fit.items:
        if i["slot"] in FLAG_PREFIX:
            out.append({"flag": f"{FLAG_PREFIX[i['slot']]}{i['position']}", "quantity": 1, "type_id": i["type_id"]})
            if i.get("charge_id"):
                cargo[i["charge_id"]] += 1
        elif i["slot"] == "cargo":
            cargo[i["type_id"]] += i["quantity"]
        else:
            out.append({"flag": BAY_FLAG[i["slot"]], "quantity": i["quantity"], "type_id": i["type_id"]})
    out += [{"flag": "Cargo", "quantity": n, "type_id": tid} for tid, n in cargo.items()]
    return out


def normalise(items: list[dict]) -> list[dict]:
    """Renumber slot positions 0.. in their current order, so ESI flags and the fitting ring line up."""
    out, positions = [], defaultdict(int)
    for i in sorted(items, key=lambda i: (i["slot"], i.get("position", 0))):
        out.append({**i, "position": positions[i["slot"]]})
        positions[i["slot"]] += 1
    return out
