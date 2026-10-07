from conduit.eve.models import corporation_logo_url
from conduit.eve.tasks import names_for
from conduit.sheet.api import router, viewable_character

from .models import LoyaltyPoints


@router.get("/{character_id}/loyalty")
def loyalty(request, character_id: int):
    rows = list(LoyaltyPoints.objects.filter(character=viewable_character(request, character_id)).order_by("-points"))
    names = names_for({r.corporation_id for r in rows})
    return {
        "total": sum(r.points for r in rows),
        "corporations": [
            {"id": r.corporation_id, "name": names.get(r.corporation_id, str(r.corporation_id)), "logo": corporation_logo_url(r.corporation_id), "points": r.points}
            for r in rows
            if r.points
        ],
    }
