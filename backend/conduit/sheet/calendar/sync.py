from django.db.models import F

from conduit.esi.exceptions import EsiError
from conduit.sheet.text import plain_text
from conduit.sheet.util import parse_dt
from conduit.db import upsert

from .models import CalendarEvent

DETAIL_LIMIT = 30
#: Failed fetches after which an event's details are no longer asked for.
MAX_FETCH_FAILURES = 5


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
                response=(r.get("event_response") or "")[:20],
            )
            for r in rows
        ],
        unique_fields=["character", "event_id"],
        update_fields=["date", "title", "importance", "response"],
    )
    # Fewest failures first, then the newest, so events ESI keeps refusing can't hold up the others; give up
    # after a few (every refusal counts against the app's ESI error limit).
    pending = (
        CalendarEvent.objects.filter(character=character, detail_fetched=False, fetch_failures__lt=MAX_FETCH_FAILURES)
        .order_by("fetch_failures", "-date", "event_id")[:DETAIL_LIMIT]
    )
    for event in pending:
        try:
            d = esi.get(f"/characters/{cid}/calendar/{event.event_id}", character=character).data
        except EsiError as exc:
            if exc.status != 404:
                CalendarEvent.objects.filter(pk=event.pk).update(fetch_failures=F("fetch_failures") + 1)
                if exc.status == 0 or exc.status >= 500:
                    break  # ESI is in trouble: don't burn its shared error limit on the rest
                continue
            d = {}  # 404: the event is gone from EVE; stop asking
        event.duration = d.get("duration")
        event.owner_name = (d.get("owner_name") or "")[:200]
        event.owner_type = (d.get("owner_type") or "")[:20]
        event.text = plain_text(d.get("text"))
        event.detail_fetched = True
        event.save(update_fields=["duration", "owner_name", "owner_type", "text", "detail_fetched"])
