import re

from ninja.pagination import paginate

from conduit.eve.tasks import names_for
from conduit.sheet.api import router, viewable_character
from conduit.sheet.text import parse_notification

from .models import Notification

CATEGORIES = {
    "structure": re.compile(r"Struc|Tower|Sov|Orbital|Moon|Entosis|Skyhook|Infrastructure", re.I),
    "war": re.compile(r"War|Ally|Surrender|Mercenary|Declare", re.I),
    "corporation": re.compile(r"Corp|Char(App|Left)|Member|Director|Ceo|Vote|Title|Roles", re.I),
    "kills": re.compile(r"Kill|Bounty|Insurance", re.I),
}


def category_of(kind: str) -> str:
    for name, pattern in CATEGORIES.items():
        if pattern.search(kind):
            return name
    return "other"


def _title(kind: str) -> str:
    """"StructureUnderAttack" -> "Structure under attack"."""
    words = re.sub(r"(?<!^)(?=[A-Z][a-z])", " ", kind).split()
    return " ".join([words[0], *(w.lower() if not w.isupper() else w for w in words[1:])]) if words else kind


@router.get("/{character_id}/notifications", response=list[dict])
@paginate
def notifications(request, character_id: int, category: str = ""):
    rows = list(Notification.objects.filter(character=viewable_character(request, character_id))[:3000])
    if category:
        rows = [n for n in rows if category_of(n.type) == category]
    names = names_for({n.sender_id for n in rows})
    return [
        {
            "id": n.notification_id,
            "type": n.type,
            "title": _title(n.type),
            "category": category_of(n.type),
            "sender": names.get(n.sender_id, n.sender_type.title()),
            "timestamp": n.timestamp.isoformat(),
            "is_read": n.is_read,
            "details": parse_notification(n.text),
        }
        for n in rows
    ]
