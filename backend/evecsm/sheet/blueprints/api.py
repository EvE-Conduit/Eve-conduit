from django.db.models import Q
from ninja.pagination import paginate

from evecsm.sde.models import ItemType
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.locations import describe
from evecsm.sheet.models import Location
from evecsm.sheet.util import type_out, types_by_id

from .models import Blueprint


@router.get("/{character_id}/blueprints", response=list[dict])
@paginate
def blueprints(request, character_id: int, q: str = "", kind: str = ""):
    """``kind``: "original", "copy" or empty for all."""
    qs = Blueprint.objects.filter(character=viewable_character(request, character_id))
    if kind == "original":
        qs = qs.exclude(quantity=-2)
    elif kind == "copy":
        qs = qs.filter(quantity=-2)
    if q:
        qs = qs.filter(type_id__in=ItemType.objects.filter(name__icontains=q).values("id"))
    rows = list(qs)
    types = types_by_id({r.type_id for r in rows})
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in={r.root_location_id for r in rows})}
    out = [
        {
            "item_id": r.item_id,
            "type": type_out(r.type_id, types, copy=r.is_copy),
            "copy": r.is_copy,
            "quantity": max(r.quantity, 1),
            "runs": r.runs,
            "me": r.material_efficiency,
            "te": r.time_efficiency,
            "location": describe(locations.get(r.root_location_id)),
        }
        for r in rows
    ]
    return sorted(out, key=lambda b: (b["type"]["name"], b["copy"], -b["me"]))


@router.get("/{character_id}/blueprints/summary")
def blueprint_summary(request, character_id: int):
    qs = Blueprint.objects.filter(character=viewable_character(request, character_id))
    return {
        "originals": qs.exclude(quantity=-2).count(),
        "copies": qs.filter(quantity=-2).count(),
        "researched": qs.exclude(quantity=-2).filter(Q(material_efficiency=10) & Q(time_efficiency=20)).count(),
    }
