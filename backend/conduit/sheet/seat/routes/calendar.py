"""Calendar: every event SeAT kept, with its details. EVE only serves upcoming events.

Attendee lists (``character_calendar_attendees``) have no place in Conduit and are not imported.
"""

from conduit.esi.exceptions import EsiError
from conduit.sheet.calendar.models import CalendarEvent

from ..esi import drop_none, esi_dt, missing, route
from . import HISTORY, section

section(
    "calendar", HISTORY, ["character_calendar_events", "character_calendar_event_details"],
    indexes={"character_calendar_event_details": ("event_id",)},
    limits=[("conduit.sheet.calendar.sync", "DETAIL_LIMIT", 10**9)],
)


@route("/characters/{cid}/calendar")
def events(ctx, params, cid):
    # Only events Conduit doesn't have: the sync overwrites date, title and response, and EVE's are newer.
    known = set(CalendarEvent.objects.filter(character_id=cid).values_list("event_id", flat=True))
    ctx.cache["known_events"] = known
    out = {}
    for r in ctx.store.rows("character_calendar_events", character_id=cid):
        eid = int(r["event_id"])
        if eid in known or eid in out:
            continue
        out[eid] = drop_none({
            "event_id": eid, "event_date": esi_dt(r["event_date"]), "title": r["title"] or "",
            "importance": int(r["importance"] or 0), "event_response": r["event_response"],
        })
    return list(out.values())


@route("/characters/{cid}/calendar/{event_id}")
def details(ctx, params, cid, event_id):
    if ctx.synced and event_id in ctx.cache.get("known_events", ()):
        raise EsiError(503, "left for a live sync")  # an event EVE gave; its details come from EVE
    d = ctx.store.one("character_calendar_event_details", event_id=event_id)
    e = ctx.store.one("character_calendar_events", character_id=cid, event_id=event_id)
    if d is None:
        raise missing()
    return drop_none({
        "event_id": event_id, "date": esi_dt(e["event_date"]) if e else None, "title": e["title"] if e else None,
        "importance": int(e["importance"] or 0) if e else None, "response": e["event_response"] if e else None,
        "duration": int(d["duration"]) if d["duration"] is not None else None, "owner_id": d["owner_id"],
        "owner_name": d["owner_name"] or "", "owner_type": d["owner_type"] or "", "text": d["text"] or "",
    })
