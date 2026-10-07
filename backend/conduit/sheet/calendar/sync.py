from conduit.esi.exceptions import EsiError
from conduit.sheet.text import plain_text
from conduit.sheet.util import parse_dt
from conduit.db import upsert

from .models import CalendarEvent

DETAIL_LIMIT = 30


def sync(character, esi):
    cid = character.pk
    rows = [r for r in esi.get(f"/characters/{cid}/calendar", character=character).data if r.get("event_id") and r.get("event_date")]
    upsert(
        CalendarEvent,
        [
            CalendarEvent(
                character=character,
                event_id=r["event_id"],
                date=parse_dt(r["event_date"]),
                title=(r.get("title") or "")[:200],
                importance=r.get("importance") or 0,
                response=r.get("event_response", ""),
            )
            for r in rows
        ],
        unique_fields=["character", "event_id"],
        update_fields=["date", "title", "importance", "response"],
    )
    for event in CalendarEvent.objects.filter(character=character, detail_fetched=False)[:DETAIL_LIMIT]:
        try:
            d = esi.get(f"/characters/{cid}/calendar/{event.event_id}", character=character).data
        except EsiError:
            continue
        event.duration = d.get("duration")
        event.owner_name = d.get("owner_name", "")
        event.owner_type = d.get("owner_type", "")
        event.text = plain_text(d.get("text"))
        event.detail_fetched = True
        event.save(update_fields=["duration", "owner_name", "owner_type", "text", "detail_fetched"])
