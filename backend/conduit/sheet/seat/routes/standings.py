"""Standings: SeAT's last copy of each character's NPC standings."""

from ..esi import route
from . import SNAPSHOT, section

section("standings", SNAPSHOT, ["character_standings"])


@route("/characters/{cid}/standings")
def standings(ctx, params, cid):
    return [{"from_id": int(r["from_id"]), "from_type": r["from_type"], "standing": float(r["standing"])}
            for r in ctx.store.rows("character_standings", character_id=cid)]
