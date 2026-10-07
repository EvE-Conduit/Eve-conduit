from conduit.eve.tasks import names_for
from conduit.sheet.api import router, viewable_character

from .models import Standing

IMAGE = {
    "faction": "https://images.evetech.net/corporations/{}/logo?size=64",
    "npc_corp": "https://images.evetech.net/corporations/{}/logo?size=64",
    "agent": "https://images.evetech.net/characters/{}/portrait?size=64",
}


@router.get("/{character_id}/standings")
def standings(request, character_id: int):
    rows = list(Standing.objects.filter(character=viewable_character(request, character_id)))
    names = names_for({r.from_id for r in rows})
    groups = {"faction": [], "npc_corp": [], "agent": []}
    for r in sorted(rows, key=lambda r: -r.standing):
        groups.setdefault(r.from_type, []).append(
            {"id": r.from_id, "name": names.get(r.from_id, str(r.from_id)), "standing": round(r.standing, 2), "image": IMAGE.get(r.from_type, IMAGE["npc_corp"]).format(r.from_id)}
        )
    return {"factions": groups["faction"], "corporations": groups["npc_corp"], "agents": groups["agent"]}
