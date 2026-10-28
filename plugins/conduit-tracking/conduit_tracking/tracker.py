"""Polling: where every character of every tracked member is, and what it flies, once a minute while it's online.

ESI only tells us where a character is *now*, so this is the one source of ship and system history. Each poll that
finds a character online credits the time since the previous poll to what it sees now: unchanged, the character's
current ``Stint`` grows; changed (another system, docking, another ship), a new stint starts. A character seen online
after being offline, or after a gap longer than ``MAX_GAP`` (a stalled worker, ESI trouble), starts from this poll,
so time we didn't watch is never counted.

Polls are a minute apart, so a ship swap or a system flown through between two polls can be missed: time per
system and ship is reliable, the exact route isn't.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.esi.calllog import esi_source
from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

from .models import Session, Stint, TrackedCharacter

log = logging.getLogger(__name__)

ONLINE_SCOPE = "esi-location.read_online.v1"
LOCATION_SCOPE = "esi-location.read_location.v1"
SHIP_SCOPE = "esi-location.read_ship_type.v1"
SCOPES = (ONLINE_SCOPE, LOCATION_SCOPE, SHIP_SCOPE)
#: Two polls further apart than this don't join up: the time between them wasn't watched.
MAX_GAP = timedelta(minutes=5)
#: Held while a round of polls runs, so a slow round and the next one don't overlap.
LOCK = "tracking:poll"
LOCK_SECONDS = 300


def finish_expired() -> list[Session]:
    """Close sessions whose time is up. Returns them, so whoever started them can be told."""
    now = timezone.now()
    done = list(Session.objects.filter(ended_at__isnull=True, ends_at__lte=now).select_related("started_by"))
    if done:
        Session.objects.filter(pk__in=[s.pk for s in done]).update(ended_at=F("ends_at"))
        TrackedCharacter.objects.filter(session__in=done).update(current_stint=None)
    return done


def poll_all() -> int:
    """One round: every character of every running session. Returns how many characters were polled."""
    from conduit.esi.client import esi

    if not cache.add(LOCK, 1, LOCK_SECONDS):
        return 0
    try:
        client = esi()
        polled = 0
        with esi_source("plugin:tracking"):
            for session in Session.objects.running():
                for character in Character.objects.filter(user_id=session.target_id).select_related("token"):
                    try:
                        poll(session, character, client)
                    except EsiBackoff:
                        return polled  # ESI asked us to slow down: the rest wait for the next round
                    polled += 1
                # Characters moved to another account since the last round stop being followed.
                TrackedCharacter.objects.filter(session=session).exclude(
                    character_id__in=Character.objects.filter(user_id=session.target_id).values("pk")
                ).exclude(status=TrackedCharacter.Status.GONE).update(status=TrackedCharacter.Status.GONE, status_detail="",
                                                                       online=None, current_stint=None)
        return polled
    finally:
        cache.delete(LOCK)


def _set_status(tc: TrackedCharacter, status: str, detail: str = "") -> None:
    tc.status, tc.status_detail = status, detail[:300]
    tc.online, tc.current_stint = None, None
    tc.save(update_fields=["status", "status_detail", "online", "current_stint", "name"])


def poll(session: Session, character: Character, client) -> Stint | None:
    """Look at one character once. Returns the stint the poll added to, or None when it's offline or can't be read.
    Lets ``EsiBackoff`` through so the caller stops the round."""
    tc, _ = TrackedCharacter.objects.get_or_create(session=session, character_id=character.pk, defaults={"name": character.name})
    tc.name = character.name
    token = getattr(character, "token", None)
    if token is None or not token.valid:
        _set_status(tc, TrackedCharacter.Status.TOKEN_INVALID, "The character needs to log in to the site again")
        return None
    missing = [s for s in SCOPES if not token.has_scopes(s)]
    if missing:
        _set_status(tc, TrackedCharacter.Status.MISSING_SCOPES, "Missing " + ", ".join(missing))
        return None

    cid = character.pk
    try:
        online = client.get(f"/characters/{cid}/online", character=character).data
        if online.get("online"):
            loc = client.get(f"/characters/{cid}/location", character=character).data
            ship = client.get(f"/characters/{cid}/ship", character=character).data
    except TokenInvalid:
        _set_status(tc, TrackedCharacter.Status.TOKEN_INVALID, "The character needs to log in to the site again")
        return None
    except EsiError as exc:
        log.info("Couldn't poll %s: %s", character.name, exc)
        _set_status(tc, TrackedCharacter.Status.ERROR, str(exc))
        return None

    now = timezone.now()
    tc.status, tc.status_detail = TrackedCharacter.Status.OK, ""
    tc.first_polled_at = tc.first_polled_at or now
    if not online.get("online"):
        tc.online, tc.current_stint, tc.last_polled_at = False, None, now
        tc.save()
        return None

    place = (loc["solar_system_id"], loc.get("station_id"), loc.get("structure_id"), ship.get("ship_type_id"), (ship.get("ship_name") or "")[:100])
    joined = tc.online and tc.last_polled_at is not None and now - tc.last_polled_at <= MAX_GAP
    stint = tc.current_stint if joined else None
    with transaction.atomic():
        if stint is not None and stint.same_place(*place):
            stint.ended_at = now
            stint.save(update_fields=["ended_at"])
        else:
            stint = Stint.objects.create(
                session=session, character_id=cid, solar_system_id=place[0], station_id=place[1], structure_id=place[2],
                ship_type_id=place[3], ship_name=place[4], started_at=tc.last_polled_at if joined else now, ended_at=now,
            )
            _name_location(stint, character, client)
        tc.online, tc.current_stint, tc.last_polled_at = True, stint, now
        tc.save()
    return stint


def _name_location(stint: Stint, character: Character, client) -> None:
    """Look up the station or structure's name once, so the report can show where they were docked."""
    if not stint.docked_at:
        return
    from conduit.sheet.locations import resolve

    try:
        resolve({stint.docked_at}, character=character, client=client)
    except (EsiBackoff, EsiError, TokenInvalid):
        pass  # the report shows the id until a later poll names it
