from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names
from evecsm.sheet.util import parse_dt

from .models import ResearchAgent


def sync(character, esi):
    rows = esi.get(f"/characters/{character.pk}/agents_research", character=character).data
    with transaction.atomic():
        ResearchAgent.objects.filter(character=character).delete()
        ResearchAgent.objects.bulk_create(
            ResearchAgent(
                character=character,
                agent_id=r["agent_id"],
                skill_type_id=r["skill_type_id"],
                started_at=parse_dt(r["started_at"]),
                points_per_day=r["points_per_day"],
                remainder_points=r["remainder_points"],
            )
            for r in rows
        )
    ensure_eve_names({r["agent_id"] for r in rows})
