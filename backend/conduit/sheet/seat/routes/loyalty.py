"""Loyalty points: SeAT's last copy of each character's LP per corporation."""

from ..esi import route
from . import SNAPSHOT, section

section("loyalty", SNAPSHOT, ["character_loyalty_points"])


@route("/characters/{cid}/loyalty/points")
def points(ctx, params, cid):
    totals: dict[int, int] = {}  # the table has no unique key; keep the latest row per corporation
    for r in ctx.store.rows("character_loyalty_points", order="updated_at", character_id=cid):
        totals[int(r["corporation_id"])] = int(r["amount"])
    return [{"corporation_id": corp, "loyalty_points": amount} for corp, amount in totals.items()]
