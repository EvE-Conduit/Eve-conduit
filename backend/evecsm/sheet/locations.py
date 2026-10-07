"""Turn location ids (stations, Upwell structures, systems) into names."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

from evecsm.esi.client import esi
from evecsm.esi.exceptions import EsiBackoff, EsiError, TokenInvalid
from evecsm.sde.models import SolarSystem, Station

from .models import Location

log = logging.getLogger(__name__)

STRUCTURE_SCOPE = "esi-universe.read_structures.v1"
RETRY_UNRESOLVED_AFTER = timedelta(days=1)
# ESI answers 403 when a character isn't on a structure's docking list. Every refusal counts against the
# app's ESI error limit, so remember it and don't ask with that character again for a week.
DENIED_FOR = timedelta(days=7)
DENIED_KEY = "esi:structure-denied:{structure}:{character}"
#: How many of the owner's characters to try for one structure in one go.
MAX_STRUCTURE_ATTEMPTS = 3


def _denied(structure_id: int, character_id: int) -> bool:
    return bool(cache.get(DENIED_KEY.format(structure=structure_id, character=character_id)))


def _deny(structure_id: int, character_id: int):
    cache.set(DENIED_KEY.format(structure=structure_id, character=character_id), 1, int(DENIED_FOR.total_seconds()))


def _structure_candidates(character):
    """The character first, then the owner's other characters that can read structures."""
    if character is None:
        return []
    from evecsm.accounts.models import Character

    others = Character.objects.filter(user_id=character.user_id).exclude(pk=character.pk).select_related("token")
    out = []
    for c in [character, *others]:
        token = getattr(c, "token", None)
        if token is not None and token.has_scopes(STRUCTURE_SCOPE):
            out.append(c)
    return out


def kind_of(location_id: int) -> str:
    if 30_000_000 <= location_id < 33_000_000:
        return Location.Kind.SOLAR_SYSTEM
    if 60_000_000 <= location_id < 64_000_000:
        return Location.Kind.STATION
    if location_id >= 1_000_000_000_000:
        return Location.Kind.STRUCTURE
    return Location.Kind.UNKNOWN


def resolve(location_ids, character=None, client=None) -> dict[int, Location]:
    """Known ``Location`` rows for the ids, looking up any we haven't seen.

    ``character`` is used to read structures (it needs docking access).
    """
    client = client or esi()
    ids = {int(i) for i in location_ids if i}
    found = {loc.id: loc for loc in Location.objects.filter(pk__in=ids)}
    stale = timezone.now() - RETRY_UNRESOLVED_AFTER
    todo = [i for i in ids if i not in found or (not found[i].resolved and found[i].updated_at < stale)]
    for location_id in todo:
        try:
            found[location_id] = _lookup(location_id, character, client)
        except EsiBackoff:
            break  # try the rest on the next sync
    return found


def _lookup(location_id: int, character, client) -> Location:
    kind = kind_of(location_id)
    defaults = {"kind": kind, "resolved": True}
    if kind == Location.Kind.SOLAR_SYSTEM:
        system = SolarSystem.objects.filter(pk=location_id).first()
        defaults.update(name=system.name if system else f"System {location_id}", solar_system_id=location_id)
    elif kind == Location.Kind.STATION:
        station = Station.objects.filter(pk=location_id).first()
        try:
            data = client.get(f"/universe/stations/{location_id}").data
            defaults.update(name=data["name"], solar_system_id=data["system_id"], type_id=data["type_id"], owner_id=data.get("owner"))
            if station and station.name != data["name"]:
                Station.objects.filter(pk=location_id).update(name=data["name"])
        except EsiError:
            defaults.update(name=f"Station {location_id}", solar_system_id=station.solar_system_id if station else None, resolved=False)
    elif kind == Location.Kind.STRUCTURE:
        defaults.update(name="Restricted structure", resolved=False)
        tries = [c for c in _structure_candidates(character) if not _denied(location_id, c.pk)][:MAX_STRUCTURE_ATTEMPTS]
        for candidate in tries:
            try:
                data = client.get(f"/universe/structures/{location_id}", character=candidate).data
            except TokenInvalid:
                continue
            except EsiError as exc:
                if exc.status in (401, 403):
                    _deny(location_id, candidate.pk)
                    continue
                if exc.status == 404:
                    defaults.update(name="Unknown structure")  # destroyed or unanchored
                break
            defaults.update(
                name=data["name"], solar_system_id=data["solar_system_id"], type_id=data.get("type_id"),
                owner_id=data.get("owner_id"), resolved=True,
            )
            break
    else:
        defaults.update(name="Unknown location", resolved=False)
    loc, _ = Location.objects.update_or_create(id=location_id, defaults=defaults)
    return loc


def describe(loc: Location | None) -> dict | None:
    """API shape for a location, including its system and security."""
    if loc is None:
        return None
    system = SolarSystem.objects.select_related("region").filter(pk=loc.solar_system_id).first() if loc.solar_system_id else None
    return {
        "id": loc.id,
        "name": loc.name,
        "kind": loc.kind,
        "system": {"id": system.id, "name": system.name, "security": system.display_security, "region": system.region.name}
        if system
        else None,
    }
