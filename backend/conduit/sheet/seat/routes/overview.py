"""Overview: SeAT's last copy of the character's public info, corporation history, whereabouts, clones and roles."""

import json

from conduit.sheet.overview.models import CharacterInfo

from ..esi import drop_none, esi_dt, route
from . import SNAPSHOT, section

section(
    "overview", SNAPSHOT,
    ["character_infos", "character_affiliations", "character_corporation_histories", "character_locations",
     "character_ships", "character_onlines", "character_clones", "character_jump_clones", "character_implants",
     "character_fatigues", "character_info_corporation_title", "corporation_titles", "character_roles"],
    indexes={"character_info_corporation_title": ("character_info_character_id",), "corporation_titles": ("id",)},
)

ROLE_SCOPES = ("roles", "roles_at_hq", "roles_at_base", "roles_at_other")


def _current(cid) -> CharacterInfo:
    """What Conduit has, for the few answers ESI can't leave empty when SeAT has no row."""
    return CharacterInfo.objects.filter(character_id=cid).first() or CharacterInfo()


def _iso(value):
    return value.strftime("%Y-%m-%dT%H:%M:%SZ") if value else None


@route("/characters/{cid}")
def public(ctx, params, cid):
    info = ctx.store.one("character_infos", character_id=cid)
    aff = ctx.store.one("character_affiliations", character_id=cid) or {}
    if info is None:
        cur = _current(cid)
        return drop_none({"birthday": _iso(cur.birthday), "gender": cur.gender, "race_id": cur.race_id,
                          "bloodline_id": cur.bloodline_id, "security_status": cur.security_status,
                          "description": cur.description, "title": cur.title, "faction_id": cur.faction_id})
    return drop_none({
        "name": info["name"], "birthday": esi_dt(info["birthday"]), "gender": info["gender"],
        "race_id": info["race_id"], "bloodline_id": info["bloodline_id"], "security_status": info["security_status"],
        "description": info["description"], "title": info["title"], "corporation_id": aff.get("corporation_id"),
        "alliance_id": aff.get("alliance_id"), "faction_id": aff.get("faction_id"),
    })


@route("/characters/{cid}/corporationhistory")
def corporation_history(ctx, params, cid):
    return [
        {"record_id": r["record_id"], "corporation_id": r["corporation_id"], "start_date": esi_dt(r["start_date"]),
         "is_deleted": bool(r["is_deleted"])}
        for r in ctx.store.rows("character_corporation_histories", order="CAST(record_id AS INTEGER) DESC",
                                character_id=cid)
    ]


@route("/characters/{cid}/location")
def location(ctx, params, cid):
    row = ctx.store.one("character_locations", character_id=cid)
    if row is None:
        cur = _current(cid)
        row = {"solar_system_id": cur.solar_system_id, "station_id": cur.station_id, "structure_id": cur.structure_id}
    return {"solar_system_id": row["solar_system_id"],
            **drop_none({"station_id": row["station_id"], "structure_id": row["structure_id"]})}


@route("/characters/{cid}/ship")
def ship(ctx, params, cid):
    row = ctx.store.one("character_ships", character_id=cid)
    if row is None:
        cur = _current(cid)
        return {"ship_type_id": cur.ship_type_id, "ship_name": cur.ship_name}
    return {"ship_item_id": row["ship_item_id"], "ship_name": row["ship_name"], "ship_type_id": row["ship_type_id"]}


@route("/characters/{cid}/online")
def online(ctx, params, cid):
    row = ctx.store.one("character_onlines", character_id=cid)
    if row is None:
        cur = _current(cid)
        return {"online": cur.online, **drop_none({"last_login": _iso(cur.last_login),
                                                   "last_logout": _iso(cur.last_logout), "logins": cur.logins})}
    return drop_none({"online": bool(row["online"]), "last_login": esi_dt(row["last_login"]),
                      "last_logout": esi_dt(row["last_logout"]), "logins": row["logins"]})


def _implants(value) -> list[int]:
    if value in (None, ""):
        return []
    found = json.loads(value) if isinstance(value, str) else value
    return [int(t) for t in found or []]


@route("/characters/{cid}/clones")
def clones(ctx, params, cid):
    row = ctx.store.one("character_clones", character_id=cid) or {}
    out = {
        "jump_clones": [
            drop_none({"jump_clone_id": r["jump_clone_id"], "location_id": r["location_id"],
                       "location_type": r["location_type"], "name": r["name"], "implants": _implants(r["implants"])})
            for r in ctx.store.rows("character_jump_clones", order="jump_clone_id", character_id=cid)
        ],
        **drop_none({"last_clone_jump_date": esi_dt(row.get("last_clone_jump_date")),
                     "last_station_change_date": esi_dt(row.get("last_station_change_date"))}),
    }
    if row.get("home_location_id"):
        out["home_location"] = drop_none({"location_id": row["home_location_id"],
                                          "location_type": row.get("home_location_type")})
    return out


@route("/characters/{cid}/implants")
def implants(ctx, params, cid):
    return [r["type_id"] for r in ctx.store.rows("character_implants", order="type_id", character_id=cid)]


@route("/characters/{cid}/fatigue")
def fatigue(ctx, params, cid):
    row = ctx.store.one("character_fatigues", character_id=cid) or {}
    return drop_none({k: esi_dt(row.get(k)) for k in ("jump_fatigue_expire_date", "last_jump_date",
                                                       "last_update_date")})


@route("/characters/{cid}/titles")
def titles(ctx, params, cid):
    # SeAT links characters to corporation_titles rows (by that table's own id), which hold EVE's title id and name.
    ids = [r["corporation_title_id"] for r in
           ctx.store.rows("character_info_corporation_title", character_info_character_id=cid)]
    return [{"title_id": t["title_id"], "name": t["name"]}
            for t in sorted(ctx.store.rows_in("corporation_titles", "id", ids), key=lambda t: t["title_id"])]


@route("/characters/{cid}/roles")
def roles(ctx, params, cid):
    out = {scope: [] for scope in ROLE_SCOPES}
    for r in ctx.store.rows("character_roles", order="role", character_id=cid):
        if r["scope"] in out:
            out[r["scope"]].append(r["role"])
    return out
