"""Blueprints: SeAT's last copy of a character's blueprints (ME/TE, runs, where they are)."""

from ..esi import route
from . import SNAPSHOT, section

section("blueprints", SNAPSHOT, ["character_blueprints"])


@route("/characters/{cid}/blueprints")
def blueprints(ctx, params, cid):
    return [
        {
            "item_id": r["item_id"], "type_id": r["type_id"], "location_id": r["location_id"],
            "location_flag": r["location_flag"], "quantity": r["quantity"], "runs": r["runs"],
            "material_efficiency": r["material_efficiency"], "time_efficiency": r["time_efficiency"],
        }
        for r in ctx.store.rows("character_blueprints", order="item_id", character_id=cid)
    ]
