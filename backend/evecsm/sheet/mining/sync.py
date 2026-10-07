from datetime import date
from evecsm.db import upsert

from .models import MiningEntry


def sync(character, esi):
    rows = esi.get_all_pages(f"/characters/{character.pk}/mining", character=character)
    # The ledger covers 30 days and today's numbers grow; upsert so history beyond 30 days is kept.
    upsert(
        MiningEntry,
        [
            MiningEntry(
                character=character,
                date=date.fromisoformat(r["date"]),
                solar_system_id=r["solar_system_id"],
                type_id=r["type_id"],
                quantity=r["quantity"],
            )
            for r in rows
        ],
        unique_fields=["character", "date", "solar_system_id", "type_id"],
        update_fields=["quantity"],
        batch_size=2000,
    )
