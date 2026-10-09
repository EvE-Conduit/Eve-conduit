"""Skills: SeAT's last copy of the trained skills, attributes and queue, for characters EVE can't be asked about."""

from ..esi import drop_none, esi_dt, route
from . import SNAPSHOT, section

section("skills", SNAPSHOT, ["character_skills", "character_info_skills", "character_attributes",
                             "character_skill_queues"])


@route("/characters/{cid}/skills")
def skills(ctx, params, cid):
    totals = ctx.store.one("character_info_skills", character_id=cid) or {}
    return {
        "skills": [
            {"skill_id": r["skill_id"], "skillpoints_in_skill": r["skillpoints_in_skill"],
             "trained_skill_level": r["trained_skill_level"], "active_skill_level": r["active_skill_level"]}
            for r in ctx.store.rows("character_skills", order="skill_id", character_id=cid)
        ],
        "total_sp": totals.get("total_sp") or 0,
        "unallocated_sp": totals.get("unallocated_sp") or 0,
    }


@route("/characters/{cid}/attributes")
def attributes(ctx, params, cid):
    row = ctx.store.one("character_attributes", character_id=cid)
    if row is None:
        return {}
    return drop_none({
        **{a: row[a] for a in ("charisma", "intelligence", "memory", "perception", "willpower")},
        "bonus_remaps": row["bonus_remaps"], "last_remap_date": esi_dt(row["last_remap_date"]),
        "accrued_remap_cooldown_date": esi_dt(row["accrued_remap_cooldown_date"]),
    })


@route("/characters/{cid}/skillqueue")
def queue(ctx, params, cid):
    return [
        drop_none({
            "queue_position": r["queue_position"], "skill_id": r["skill_id"], "finished_level": r["finished_level"],
            "start_date": esi_dt(r["start_date"]), "finish_date": esi_dt(r["finish_date"]),
            "training_start_sp": r["training_start_sp"], "level_start_sp": r["level_start_sp"],
            "level_end_sp": r["level_end_sp"],
        })
        for r in ctx.store.rows("character_skill_queues", order="CAST(queue_position AS INTEGER)", character_id=cid)
    ]
