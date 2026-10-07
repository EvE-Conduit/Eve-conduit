from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.util import parse_dt
from conduit.db import upsert

from .models import Notification


def sync(character, esi):
    rows = esi.get(f"/characters/{character.pk}/notifications", character=character).data
    upsert(
        Notification,
        [
            Notification(
                character=character,
                notification_id=r["notification_id"],
                type=r["type"],
                sender_id=r["sender_id"],
                sender_type=r["sender_type"],
                timestamp=parse_dt(r["timestamp"]),
                is_read=r.get("is_read", False),
                text=r.get("text", ""),
            )
            for r in rows
        ],
        unique_fields=["character", "notification_id"],
        update_fields=["is_read"],
    )
    ensure_eve_names({r["sender_id"] for r in rows if r["sender_type"] != "other"})
