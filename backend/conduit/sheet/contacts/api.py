from conduit.eve.tasks import names_for
from conduit.sheet.api import router, viewable_character

from .models import Contact

IMAGES = {
    "character": "https://images.evetech.net/characters/{}/portrait?size=64",
    "corporation": "https://images.evetech.net/corporations/{}/logo?size=64",
    "alliance": "https://images.evetech.net/alliances/{}/logo?size=64",
    "faction": "https://images.evetech.net/corporations/{}/logo?size=64",
}


def entity_image(kind: str, entity_id: int) -> str:
    return IMAGES.get(kind, IMAGES["corporation"]).format(entity_id)


@router.get("/{character_id}/contacts")
def contacts(request, character_id: int):
    rows = list(Contact.objects.filter(character=viewable_character(request, character_id)))
    names = names_for({c.contact_id for c in rows})
    out = [
        {
            "id": c.contact_id,
            "type": c.contact_type,
            "name": names.get(c.contact_id, str(c.contact_id)),
            "image": entity_image(c.contact_type, c.contact_id),
            "standing": c.standing,
            "blocked": c.is_blocked,
            "watched": c.is_watched,
            "labels": c.labels,
        }
        for c in rows
    ]
    return sorted(out, key=lambda c: (-c["standing"], c["name"].lower()))
