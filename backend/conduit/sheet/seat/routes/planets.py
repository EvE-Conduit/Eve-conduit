"""Planets: SeAT's last copy of a character's colonies, with each layout put back into ESI's nested shape."""

from collections import defaultdict

from ..esi import drop_none, esi_dt, missing, route
from . import SNAPSHOT, section

LAYOUT_TABLES = ("character_planet_pins", "character_planet_extractors", "character_planet_factories",
                 "character_planet_heads", "character_planet_contents", "character_planet_links",
                 "character_planet_routes", "character_planet_route_waypoints")

section("planets", SNAPSHOT, ["character_planets", "planets", *LAYOUT_TABLES],
        indexes={**{t: ("planet_id",) for t in LAYOUT_TABLES}, "planets": ("planet_id",)})


def _int(value):
    return None if value is None else int(value)


@route("/characters/{cid}/planets")
def planets(ctx, params, cid):
    return [
        {
            "planet_id": r["planet_id"], "planet_type": r["planet_type"], "solar_system_id": r["solar_system_id"],
            "upgrade_level": r["upgrade_level"], "num_pins": r["num_pins"], "last_update": esi_dt(r["last_update"]),
            "owner_id": cid,
        }
        for r in ctx.store.rows("character_planets", order="planet_id", character_id=cid)
    ]


@route("/characters/{cid}/planets/{planet_id}")
def layout(ctx, params, cid, planet_id):
    def rows(table, order="id"):
        return ctx.store.rows(table, order=order, character_id=cid, planet_id=planet_id)

    extractors = {r["pin_id"]: r for r in rows("character_planet_extractors", "pin_id")}
    factories = {r["pin_id"]: r for r in rows("character_planet_factories", "pin_id")}
    heads, contents, waypoints = defaultdict(list), defaultdict(list), defaultdict(list)
    for h in rows("character_planet_heads"):
        heads[h["extractor_id"]].append({"head_id": h["head_id"], "latitude": h["latitude"],
                                         "longitude": h["longitude"]})
    for c in rows("character_planet_contents"):
        contents[c["pin_id"]].append({"type_id": c["type_id"], "amount": c["amount"]})
    for w in rows("character_planet_route_waypoints"):
        waypoints[w["route_id"]].append(w["pin_id"])

    pins = []
    for p in rows("character_planet_pins", "pin_id"):
        pin = drop_none({
            "pin_id": p["pin_id"], "type_id": p["type_id"], "schematic_id": _int(p["schematic_id"]),
            "latitude": p["latitude"], "longitude": p["longitude"], "install_time": esi_dt(p["install_time"]),
            "expiry_time": esi_dt(p["expiry_time"]), "last_cycle_start": esi_dt(p["last_cycle_start"]),
        })
        if contents[p["pin_id"]]:
            pin["contents"] = contents[p["pin_id"]]
        ex = extractors.get(p["pin_id"])
        if ex:
            pin["extractor_details"] = drop_none({
                "product_type_id": ex["product_type_id"], "cycle_time": ex["cycle_time"],
                "head_radius": ex["head_radius"], "qty_per_cycle": ex["qty_per_cycle"],
                "heads": heads[p["pin_id"]],
            })
        fa = factories.get(p["pin_id"])
        if fa and fa["schematic_id"] is not None:
            pin["factory_details"] = {"schematic_id": int(fa["schematic_id"])}
        pins.append(pin)

    links = [{"source_pin_id": r["source_pin_id"], "destination_pin_id": r["destination_pin_id"],
              "link_level": r["link_level"]} for r in rows("character_planet_links")]
    routes = [
        {
            "route_id": r["route_id"], "source_pin_id": r["source_pin_id"],
            "destination_pin_id": r["destination_pin_id"], "content_type_id": r["content_type_id"],
            "quantity": r["quantity"], **({"waypoints": waypoints[r["route_id"]]} if waypoints[r["route_id"]] else {}),
        }
        for r in rows("character_planet_routes", "route_id")
    ]
    return {"links": links, "pins": pins, "routes": routes}


@route("/universe/planets/{planet_id}")
def planet(ctx, params, planet_id):
    p = ctx.store.one("planets", planet_id=planet_id)
    if p is None:
        raise missing()  # the sync leaves the name blank and a live sync fills it in
    return {"planet_id": planet_id, "name": p["name"], "system_id": p["system_id"], "type_id": p["type_id"],
            "position": {"x": p["x"], "y": p["y"], "z": p["z"]}}
