"""Contacts: SeAT's last copy of each character's contact list and contact labels."""

import json

from ..esi import drop_none, route
from . import SNAPSHOT, section

section("contacts", SNAPSHOT, ["character_contacts", "character_labels", "character_contact_character_label"],
        indexes={"character_contact_character_label": ("character_contact_id",)})


def _json_ids(value) -> list[int]:
    if not value:
        return []
    try:
        found = json.loads(value) if isinstance(value, str) else value
    except ValueError:
        return []
    return [int(i) for i in found or [] if str(i).lstrip("-").isdigit()]


@route("/characters/{cid}/contacts")
def contacts(ctx, params, cid):
    rows = ctx.store.rows("character_contacts", character_id=cid)
    # SeAT links contacts to labels by its own row ids; ESI by the label's EVE id.
    label_ids = {r["id"]: int(r["label_id"]) for r in ctx.store.rows("character_labels", character_id=cid)}
    linked: dict = {}
    for link in ctx.store.rows_in("character_contact_character_label", "character_contact_id", [r["id"] for r in rows]):
        label = label_ids.get(link["character_label_id"])
        if label is not None:
            linked.setdefault(link["character_contact_id"], []).append(label)
    out = []
    for r in rows:
        ids = list(dict.fromkeys(_json_ids(r["label_ids"]) + linked.get(r["id"], [])))
        out.append(drop_none({
            "contact_id": int(r["contact_id"]), "contact_type": r["contact_type"], "standing": float(r["standing"]),
            "is_blocked": bool(r["is_blocked"]) if r["is_blocked"] is not None else None,
            "is_watched": bool(r["is_watched"]) if r["is_watched"] is not None else None,
            "label_ids": ids or None,
        }))
    return out


@route("/characters/{cid}/contacts/labels")
def labels(ctx, params, cid):
    return [{"label_id": int(r["label_id"]), "label_name": r["name"]}
            for r in ctx.store.rows("character_labels", character_id=cid)]
