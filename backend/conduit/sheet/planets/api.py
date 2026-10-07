from collections import defaultdict

from django.utils import timezone

from conduit.sde.models import PlanetSchematic, SolarSystem
from conduit.sheet.api import router, viewable_character
from conduit.sheet.util import parse_dt, type_out, types_by_id

from .models import Colony


@router.get("/{character_id}/planets")
def planets(request, character_id: int):
    colonies = list(Colony.objects.filter(character=viewable_character(request, character_id)))
    now = timezone.now()
    type_ids = set()
    for c in colonies:
        for pin in c.layout.get("pins", []):
            type_ids.add(pin["type_id"])
            type_ids.update(x["type_id"] for x in pin.get("contents", []))
            if (pin.get("extractor_details") or {}).get("product_type_id"):
                type_ids.add(pin["extractor_details"]["product_type_id"])
    types = types_by_id(type_ids)
    schematics = dict(PlanetSchematic.objects.values_list("id", "name"))
    systems = {s.id: s for s in SolarSystem.objects.filter(pk__in={c.solar_system_id for c in colonies})}

    out = []
    for c in colonies:
        extractors, factories, storage = [], defaultdict(int), defaultdict(int)
        for pin in c.layout.get("pins", []):
            ex = pin.get("extractor_details")
            if ex:
                expiry = parse_dt(pin.get("expiry_time"))
                extractors.append(
                    {
                        "product": type_out(ex["product_type_id"], types) if ex.get("product_type_id") else None,
                        "qty_per_cycle": ex.get("qty_per_cycle"),
                        "cycle_time": ex.get("cycle_time"),
                        "heads": len(ex.get("heads", [])),
                        "expiry": expiry.isoformat() if expiry else None,
                        "expired": bool(expiry and expiry <= now),
                    }
                )
            sid = pin.get("schematic_id") or (pin.get("factory_details") or {}).get("schematic_id")
            if sid:
                factories[schematics.get(sid, f"Schematic {sid}")] += 1
            for x in pin.get("contents", []):
                storage[x["type_id"]] += x["amount"]
        system = systems.get(c.solar_system_id)
        expiries = [e["expiry"] for e in extractors if e["expiry"]]
        out.append(
            {
                "planet_id": c.planet_id,
                "name": c.planet_name or f"Planet {c.planet_id}",
                "type": c.planet_type,
                "image": f"https://images.evetech.net/types/{_planet_type_id(c.planet_type)}/icon?size=64",
                "system": {"id": c.solar_system_id, "name": system.name if system else "", "security": system.display_security if system else 0},
                "upgrade_level": c.upgrade_level,
                "pins": c.num_pins,
                "last_update": c.last_update.isoformat(),
                "extractors": extractors,
                "next_expiry": min(expiries) if expiries else None,
                "any_expired": any(e["expired"] for e in extractors),
                "factories": [{"schematic": k, "count": v} for k, v in sorted(factories.items())],
                "storage": sorted(({"type": type_out(t, types), "amount": a} for t, a in storage.items()), key=lambda s: -s["amount"])[:12],
            }
        )
    return sorted(out, key=lambda c: (not c["any_expired"], c["next_expiry"] or "9999"))


PLANET_TYPES = {"temperate": 11, "ice": 12, "gas": 13, "oceanic": 2014, "lava": 2015, "barren": 2016, "storm": 2017, "plasma": 2063}


def _planet_type_id(kind: str) -> int:
    return PLANET_TYPES.get(kind, 11)
