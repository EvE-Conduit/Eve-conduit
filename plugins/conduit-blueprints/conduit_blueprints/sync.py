"""Reads corporation blueprints from ESI. The core reads characters' own blueprints and corporation assets and
industry jobs, but not ``/corporations/{id}/blueprints``, which is the only place with a corporation blueprint's
ME, TE and runs.

ESI only answers a Director whose login grants ``esi-corporations.read_blueprints.v1``. Members who could do it are
picked the way the core picks them for its corporation sections (``conduit.corp.tasks.candidates``); the one that
worked last time goes first.
"""

from __future__ import annotations

import logging

from django.db import transaction
from django.utils import timezone

from conduit.corp.registry import DIRECTOR, CorpSection

from .models import CorpBlueprint, LibrarySync

log = logging.getLogger(__name__)

SCOPE = "esi-corporations.read_blueprints.v1"
#: Not registered with the core: only used to pick a member who may read it.
SECTION = CorpSection("blueprint_library", "Blueprint library", "conduit_blueprints.sync.sync_rows", (SCOPE,), (DIRECTOR,))
REFUSED = {401, 403}
FIELDS = ["type_id", "location_id", "root_location_id", "location_flag", "division", "quantity", "runs",
          "material_efficiency", "time_efficiency"]


def division_of(flag: str) -> int | None:
    """``CorpSAG3`` -> 3. The first hangar is ``CorpSAG1`` too (``Hangar`` in some places)."""
    if flag.startswith("CorpSAG") and flag[7:].isdigit():
        return int(flag[7:])
    return 1 if flag == "Hangar" else None


def sync_rows(corporation, character, esi) -> int:
    """Replace the corporation's blueprints with what ESI says now. Returns how many there are."""
    from conduit.corp.models import CorpAsset
    from conduit.rows import replace_rows
    from conduit.sheet.locations import resolve

    rows = esi.get_all_pages(f"/corporations/{corporation.pk}/blueprints", character=character)
    # Blueprints sit in office folders or containers; the corporation's assets say where those are.
    holders = {a["item_id"]: a for a in CorpAsset.objects.filter(corporation=corporation, item_id__in={r["location_id"] for r in rows})
               .values("item_id", "root_location_id", "location_flag")}
    with transaction.atomic():
        replace_rows(
            CorpBlueprint.objects.filter(corporation=corporation),
            (
                CorpBlueprint(
                    corporation=corporation,
                    item_id=r["item_id"],
                    type_id=r["type_id"],
                    location_id=r["location_id"],
                    root_location_id=holders[r["location_id"]]["root_location_id"] if r["location_id"] in holders else r["location_id"],
                    location_flag=r["location_flag"][:60],
                    # In a container, the container's flag says which hangar it's in.
                    division=division_of(r["location_flag"]) or (division_of(holders[r["location_id"]]["location_flag"])
                                                                if r["location_id"] in holders else None),
                    quantity=r["quantity"],
                    runs=r["runs"],
                    material_efficiency=r["material_efficiency"],
                    time_efficiency=r["time_efficiency"],
                )
                for r in rows
            ),
            "item_id",
            FIELDS,
        )
    roots = {h["root_location_id"] for h in holders.values()} | {r["location_id"] for r in rows if r["location_id"] not in holders}
    resolve(roots, character=character, client=esi)
    return len(rows)


def sync_corporation(corporation_id: int, esi_client=None) -> str:
    """Read one corporation's blueprints as the first member able to. Returns the result recorded."""
    from conduit.corp.tasks import candidates
    from conduit.esi.calllog import esi_source
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid
    from conduit.eve.models import EveCorporation

    corporation = EveCorporation.objects.filter(pk=corporation_id).first()
    if corporation is None:
        return "gone"
    status, _ = LibrarySync.objects.get_or_create(corporation=corporation)
    status.last_attempt = timezone.now()
    client = esi_client or esi()
    refused = []
    try:
        with esi_source("plugin:blueprints"):
            for character in candidates(corporation_id, SECTION, status.character_id):
                try:
                    count = sync_rows(corporation, character, client)
                except TokenInvalid:
                    refused.append(f"{character.name} (login expired)")
                    continue
                except EsiError as exc:
                    if exc.status in REFUSED:
                        refused.append(f"{character.name} (ESI {exc.status})")
                        continue
                    raise
                status.character, status.blueprints = character, count
                status.last_success = timezone.now()
                return _finish(status, LibrarySync.Result.OK, "")
    except EsiBackoff:
        status.save(update_fields=["last_attempt"])
        return "backoff"  # the next run tries again
    except EsiError as exc:
        log.warning("Reading the blueprints of %s failed: %s", corporation, exc)
        return _finish(status, LibrarySync.Result.ERROR, str(exc))
    if refused:
        return _finish(status, LibrarySync.Result.ERROR, "ESI refused every Director who should be able to read them: " + ", ".join(refused))
    status.character = None
    return _finish(status, LibrarySync.Result.NO_CHARACTER, f"Needs a registered Director whose login grants {SCOPE}")


def _finish(status: LibrarySync, result: str, message: str) -> str:
    status.result = result
    status.message = message[:300]
    status.save()
    return result


def sync_all() -> int:
    """Queue a read of every corporation with a working login on the site. Corporations without a Director who can
    read them are only recorded as such."""
    from conduit.corp.tasks import tracked_corporations

    from .tasks import sync_library

    ids = list(tracked_corporations().values_list("pk", flat=True))
    for corporation_id in ids:
        sync_library.delay(corporation_id)
    return len(ids)
