from collections import defaultdict

from django.shortcuts import get_object_or_404

from evecsm.sde.models import type_render_url
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.util import prices_by_type, type_out, types_by_id

from .models import Fitting

# Order and labels for slot groups, as EFT lists them.
SLOTS = [("LoSlot", "Low slots"), ("MedSlot", "Mid slots"), ("HiSlot", "High slots"), ("RigSlot", "Rigs"), ("SubSystemSlot", "Subsystems"),
         ("DroneBay", "Drones"), ("FighterBay", "Fighters"), ("Cargo", "Cargo")]


def _slot(flag: str) -> str:
    for prefix, _ in SLOTS:
        if flag.startswith(prefix):
            return prefix
    return "Cargo"


def eft(fit: Fitting, types) -> str:
    """The fit in EFT format, which the game and most tools can import."""
    groups = defaultdict(list)
    for item in sorted(fit.items, key=lambda i: i["flag"]):
        groups[_slot(item["flag"])].append(item)
    blocks = []
    for prefix, _ in SLOTS:
        lines = []
        for item in groups.get(prefix, []):
            name = types[item["type_id"]].name if item["type_id"] in types else str(item["type_id"])
            multi = prefix in ("DroneBay", "FighterBay", "Cargo") or item["quantity"] > 1
            lines.append(f"{name} x{item['quantity']}" if multi else name)
        if lines:
            blocks.append("\n".join(lines))
    ship = types[fit.ship_type_id].name if fit.ship_type_id in types else str(fit.ship_type_id)
    return f"[{ship}, {fit.name}]\n" + "\n\n".join(blocks)


@router.get("/{character_id}/fittings")
def fittings(request, character_id: int):
    rows = list(Fitting.objects.filter(character=viewable_character(request, character_id)))
    types = types_by_id({f.ship_type_id for f in rows})
    out = [{"id": f.fitting_id, "name": f.name, "ship": type_out(f.ship_type_id, types), "modules": len(f.items)} for f in rows]
    return sorted(out, key=lambda f: (f["ship"]["group"], f["ship"]["name"], f["name"]))


@router.get("/{character_id}/fittings/{fitting_id}")
def fitting_detail(request, character_id: int, fitting_id: int):
    fit = get_object_or_404(Fitting, character=viewable_character(request, character_id), fitting_id=fitting_id)
    types = types_by_id({i["type_id"] for i in fit.items} | {fit.ship_type_id})
    prices = prices_by_type(types)
    slots = defaultdict(list)
    for item in sorted(fit.items, key=lambda i: i["flag"]):
        slots[_slot(item["flag"])].append({"type": type_out(item["type_id"], types), "quantity": item["quantity"]})
    value = prices.get(fit.ship_type_id, 0) + sum(prices.get(i["type_id"], 0) * i["quantity"] for i in fit.items)
    return {
        "id": fit.fitting_id,
        "name": fit.name,
        "description": fit.description,
        "ship": type_out(fit.ship_type_id, types),
        "render": type_render_url(fit.ship_type_id),
        "slots": [{"key": key, "label": label, "items": slots[key]} for key, label in SLOTS if slots.get(key)],
        "value": value,
        "eft": eft(fit, types),
    }
