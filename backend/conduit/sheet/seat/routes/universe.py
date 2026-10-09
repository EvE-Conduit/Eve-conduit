"""Lookups any section can trigger: stations and structures (for location names)."""

from ..esi import route, unavailable


@route("/universe/stations/{station_id}")
def station(ctx, params, station_id):
    s = ctx.store.one("universe_stations", station_id=station_id)
    if s is None:
        raise unavailable()
    return {"station_id": station_id, "name": s["name"], "system_id": s["system_id"], "type_id": s["type_id"],
            "owner": s["owner"]}


@route("/universe/structures/{structure_id}")
def structure(ctx, params, structure_id):
    s = ctx.store.one("universe_structures", structure_id=structure_id)
    if s is None:
        raise unavailable()
    return {"name": s["name"], "solar_system_id": s["solar_system_id"], "type_id": s["type_id"],
            "owner_id": s["owner_id"]}
