from datetime import date

from django.db import transaction

from conduit.eve.tasks import ensure_eve_names
from conduit.esi.exceptions import EsiError

from ..models import MiningObservation, MoonExtraction
from .common import parse_dt


def sync(corporation, character, esi):
    cid = corporation.pk
    extractions, observations = None, []
    # Extractions need Station_Manager, observers Accountant; read whatever this member may.
    try:
        extractions = esi.get_all_pages(f"/corporation/{cid}/mining/extractions", character=character)
    except EsiError as exc:
        if exc.status not in (401, 403):
            raise
    try:
        for obs in esi.get_all_pages(f"/corporation/{cid}/mining/observers", character=character):
            for row in esi.get_all_pages(f"/corporation/{cid}/mining/observers/{obs['observer_id']}", character=character):
                observations.append((obs["observer_id"], row))
    except EsiError as exc:
        if exc.status not in (401, 403) or extractions is None:
            raise
    with transaction.atomic():
        if extractions is not None:
            MoonExtraction.objects.filter(corporation=corporation).delete()
            MoonExtraction.objects.bulk_create(
                MoonExtraction(
                    corporation=corporation, structure_id=e["structure_id"], moon_id=e["moon_id"],
                    extraction_start_time=parse_dt(e["extraction_start_time"]), chunk_arrival_time=parse_dt(e["chunk_arrival_time"]),
                    natural_decay_time=parse_dt(e["natural_decay_time"]),
                )
                for e in extractions
            )
        for observer_id, r in observations:
            MiningObservation.objects.update_or_create(
                corporation=corporation, observer_id=observer_id, character_id=r["character_id"], type_id=r["type_id"],
                last_updated=date.fromisoformat(r["last_updated"]),
                defaults={"quantity": r["quantity"], "recorded_corporation_id": r.get("recorded_corporation_id")},
            )
    ensure_eve_names({r["character_id"] for _, r in observations})
