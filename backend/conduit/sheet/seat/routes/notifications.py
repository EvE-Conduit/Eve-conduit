"""Notifications: every notification SeAT kept. EVE only serves the last few hundred."""

from conduit.sheet.notifications.models import Notification

from ..esi import drop_none, esi_dt, route
from . import HISTORY, section

section("notifications", HISTORY, ["character_notifications"])


@route("/characters/{cid}/notifications")
def notifications(ctx, params, cid):
    # Only ones Conduit doesn't have: the sync updates is_read on known ones, and EVE's is newer.
    known = set(Notification.objects.filter(character_id=cid).values_list("notification_id", flat=True))
    out = {}
    for r in ctx.store.rows("character_notifications", character_id=cid):
        nid = int(r["notification_id"])
        if nid in known or nid in out or not r["timestamp"]:
            continue  # SeAT can hold the same notification twice
        out[nid] = drop_none({
            "notification_id": nid, "type": r["type"], "sender_id": int(r["sender_id"]),
            "sender_type": r["sender_type"], "timestamp": esi_dt(r["timestamp"]),
            "is_read": bool(int(r["is_read"] or 0)), "text": r["text"],
        })
    return list(out.values())
