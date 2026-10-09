"""Fittings: SeAT's last copy of a character's saved fits. SeAT keeps the items apart, by fitting id."""

from collections import defaultdict

from ..esi import route
from . import SNAPSHOT, section

section("fittings", SNAPSHOT, ["character_fittings", "character_fitting_items"],
        indexes={"character_fitting_items": ("fitting_id",)})


@route("/characters/{cid}/fittings")
def fittings(ctx, params, cid):
    fits = ctx.store.rows("character_fittings", order="fitting_id", character_id=cid)
    items = defaultdict(list)
    for i in sorted(ctx.store.rows_in("character_fitting_items", "fitting_id", {f["fitting_id"] for f in fits}),
                    key=lambda i: i["id"]):
        items[i["fitting_id"]].append({"flag": i["flag"], "quantity": i["quantity"], "type_id": i["type_id"]})
    return [
        {
            "fitting_id": f["fitting_id"], "name": f["name"], "description": f["description"] or "",
            "ship_type_id": f["ship_type_id"], "items": items[f["fitting_id"]],
        }
        for f in fits
    ]
