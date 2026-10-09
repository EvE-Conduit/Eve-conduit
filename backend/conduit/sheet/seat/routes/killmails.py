"""Killmails: every kill and loss SeAT kept. EVE only lists a character's recent ones.

SeAT has no per-character list: a character's killmails are the ones it appears on, as victim or attacker. Each
killmail is rebuilt into ESI's JSON from SeAT's details, victim, attackers and victim items. SeAT keeps victim items
flat, so items that were inside containers come over at the top level.
"""

from ..esi import drop_none, esi_dt, missing, route
from . import HISTORY, section

section(
    "killmails", HISTORY,
    ["killmails", "killmail_details", "killmail_victims", "killmail_attackers", "killmail_victim_items"],
    indexes={t: ("killmail_id",) for t in
             ("killmails", "killmail_details", "killmail_victims", "killmail_attackers", "killmail_victim_items")},
    limits=[("conduit.sheet.killmails.sync", "FETCH_LIMIT", 10**9)],
)


def _int(v):
    return None if v in (None, "") else int(v)


@route("/characters/{cid}/killmails/recent")
def recent(ctx, params, cid):
    # Killmails never change and the sync skips ones already stored, so the full list is safe even when synced.
    ids = {int(r["killmail_id"]) for t in ("killmail_victims", "killmail_attackers")
           for r in ctx.store.rows(t, character_id=cid)}
    hashes = {int(r["killmail_id"]): r["killmail_hash"] for r in ctx.store.rows_in("killmails", "killmail_id", sorted(ids))}
    return [{"killmail_id": k, "killmail_hash": hashes[k]} for k in sorted(ids, reverse=True) if hashes.get(k)]


@route("/killmails/{killmail_id}/{killmail_hash:str}")
def killmail(ctx, params, killmail_id, killmail_hash):
    store = ctx.store
    detail = store.one("killmail_details", killmail_id=killmail_id)
    victim = store.one("killmail_victims", killmail_id=killmail_id)
    if detail is None or victim is None:
        raise missing()
    position = None
    if victim["x"] is not None and victim["y"] is not None and victim["z"] is not None:
        position = {"x": float(victim["x"]), "y": float(victim["y"]), "z": float(victim["z"])}
    items = [
        drop_none({
            "item_type_id": int(i["item_type_id"]), "flag": int(i["flag"]), "singleton": int(i["singleton"]),
            "quantity_destroyed": _int(i["quantity_destroyed"]), "quantity_dropped": _int(i["quantity_dropped"]),
        })
        for i in store.rows("killmail_victim_items", killmail_id=killmail_id)
    ]
    attackers = [
        drop_none({
            "character_id": _int(a["character_id"]), "corporation_id": _int(a["corporation_id"]),
            "alliance_id": _int(a["alliance_id"]), "faction_id": _int(a["faction_id"]),
            "security_status": float(a["security_status"] or 0), "final_blow": bool(int(a["final_blow"] or 0)),
            "damage_done": int(a["damage_done"] or 0), "ship_type_id": _int(a["ship_type_id"]),
            "weapon_type_id": _int(a["weapon_type_id"]),
        })
        for a in store.rows("killmail_attackers", order="id", killmail_id=killmail_id)
    ]
    return drop_none({
        "killmail_id": killmail_id,
        "killmail_time": esi_dt(detail["killmail_time"]),
        "solar_system_id": int(detail["solar_system_id"]),
        "moon_id": _int(detail["moon_id"]),
        "war_id": _int(detail["war_id"]),
        "victim": drop_none({
            "character_id": _int(victim["character_id"]), "corporation_id": _int(victim["corporation_id"]),
            "alliance_id": _int(victim["alliance_id"]), "faction_id": _int(victim["faction_id"]),
            "damage_taken": int(victim["damage_taken"] or 0), "ship_type_id": int(victim["ship_type_id"]),
            "position": position, "items": items,
        }),
        "attackers": attackers,
    })

