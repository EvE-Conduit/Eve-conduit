"""Assets: SeAT's last copy of a character's items, with the names it kept for ships and containers."""

from ..esi import route
from . import SNAPSHOT, section

section("assets", SNAPSHOT, ["character_assets"], indexes={"character_assets": ("item_id",)})


@route("/characters/{cid}/assets")
def assets(ctx, params, cid):
    return [
        {
            "item_id": r["item_id"], "type_id": r["type_id"], "quantity": r["quantity"],
            "location_id": r["location_id"], "location_type": r["location_type"],
            "location_flag": r["location_flag"], "is_singleton": bool(r["is_singleton"]),
            **({} if r["is_blueprint_copy"] is None else {"is_blueprint_copy": bool(r["is_blueprint_copy"])}),
        }
        for r in ctx.store.rows("character_assets", order="item_id", character_id=cid)
    ]


@route("/characters/{cid}/assets/names")
def names(ctx, params, cid, body=None):
    # ESI answers every id asked for, with "None" for items nobody named.
    return [
        {"item_id": r["item_id"], "name": r["name"] or "None"}
        for r in ctx.store.rows_in("character_assets", "item_id", body or [])
        if r["character_id"] == cid
    ]
