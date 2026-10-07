from django.utils import timezone

from conduit.eve.tasks import names_for
from conduit.sheet.api import router, viewable_character
from conduit.sheet.util import type_out, types_by_id

from .models import ResearchAgent


@router.get("/{character_id}/research")
def research(request, character_id: int):
    rows = list(ResearchAgent.objects.filter(character=viewable_character(request, character_id)))
    now = timezone.now()
    names = names_for({r.agent_id for r in rows})
    types = types_by_id({r.skill_type_id for r in rows})
    out = [
        {
            "agent": {"id": r.agent_id, "name": names.get(r.agent_id, f"Agent {r.agent_id}"), "portrait": f"https://images.evetech.net/characters/{r.agent_id}/portrait?size=64"},
            "field": type_out(r.skill_type_id, types),
            "started_at": r.started_at.isoformat(),
            "points_per_day": r.points_per_day,
            # Points keep accruing between syncs; work out today's total.
            "points": r.remainder_points + r.points_per_day * (now - r.started_at).total_seconds() / 86400,
        }
        for r in rows
    ]
    return {"agents": sorted(out, key=lambda a: -a["points"]), "points_per_day": sum(r.points_per_day for r in rows)}
