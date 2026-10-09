"""Research agents: SeAT's last copy of a character's datacore research."""

from ..esi import esi_dt, route
from . import SNAPSHOT, section

section("research", SNAPSHOT, ["character_agent_research"])


@route("/characters/{cid}/agents_research")
def agents_research(ctx, params, cid):
    return [
        {
            "agent_id": r["agent_id"], "skill_type_id": r["skill_type_id"], "started_at": esi_dt(r["started_at"]),
            "points_per_day": r["points_per_day"], "remainder_points": r["remainder_points"],
        }
        for r in ctx.store.rows("character_agent_research", order="agent_id", character_id=cid)
    ]
