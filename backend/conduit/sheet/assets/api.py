from collections import defaultdict

from django.db.models import Q
from ninja.errors import HttpError

from conduit.sde.models import ItemType
from conduit.sheet.api import me_router, my_characters, router, viewable_character
from conduit.sheet.locations import describe
from conduit.sheet.models import Location
from conduit.sheet.util import prices_by_type, type_out, types_by_id

from .models import Asset

SEARCH_LIMIT = 500


def _value(a: Asset, prices: dict[int, float]) -> float:
    return 0.0 if a.is_blueprint_copy else prices.get(a.type_id, 0.0) * a.quantity


def _locations(qs) -> list[dict]:
    """Every root location with item count and estimated value, most valuable first."""
    rows = list(qs.only("root_location_id", "type_id", "quantity", "is_blueprint_copy"))
    prices = prices_by_type({r.type_id for r in rows})
    stats = defaultdict(lambda: {"items": 0, "value": 0.0})
    for r in rows:
        s = stats[r.root_location_id]
        s["items"] += 1
        s["value"] += _value(r, prices)
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in=stats)}
    out = [
        {
            "location": describe(locations.get(lid)) or {"id": lid, "name": "Unknown location", "kind": "unknown", "system": None},
            "item_count": s["items"],
            "value": round(s["value"], 2),
        }
        for lid, s in stats.items()
    ]
    return sorted(out, key=lambda x: -x["value"])


def _tree(qs, location_id: int, with_character: bool) -> list[dict]:
    rows = list(qs.filter(root_location_id=location_id).select_related("character"))
    types = types_by_id({r.type_id for r in rows})
    prices = prices_by_type({r.type_id for r in rows})
    children = defaultdict(list)
    ids = {r.item_id for r in rows}

    def node(a: Asset) -> dict:
        kids = [node(c) for c in children.get(a.item_id, [])]
        out = {
            "item_id": a.item_id,
            "type": type_out(a.type_id, types, copy=bool(a.is_blueprint_copy)),
            "name": a.name,
            "quantity": a.quantity,
            "flag": a.location_flag,
            "singleton": a.is_singleton,
            "bpc": bool(a.is_blueprint_copy),
            "value": round(_value(a, prices) + sum(k["value"] for k in kids), 2),
            "children": sorted(kids, key=lambda k: (k["flag"], k["type"]["name"])),
        }
        if with_character:
            out["character"] = {"id": a.character_id, "name": a.character.name}
        return out

    top = []
    for r in rows:
        if r.location_type == "item" and r.location_id in ids:
            children[r.location_id].append(r)
        else:
            top.append(r)
    return sorted((node(r) for r in top), key=lambda n: -n["value"])


def _container_label(parent: Asset | None, types) -> str | None:
    if parent is None:
        return None
    if parent.name:
        return parent.name
    t = types.get(parent.type_id)
    return t.name if t else "Container"


def _search(qs, q: str, with_character: bool) -> dict:
    q = q.strip()
    if len(q) < 2:
        raise HttpError(400, "Type at least two characters")
    type_ids = list(ItemType.objects.filter(name__icontains=q).values_list("id", flat=True)[:2000])
    matches = list(qs.filter(Q(type_id__in=type_ids) | Q(name__icontains=q)).select_related("character")[: SEARCH_LIMIT + 1])
    parents = {a.item_id: a for a in qs.filter(item_id__in={m.location_id for m in matches if m.location_type == "item"})}
    types = types_by_id({m.type_id for m in matches} | {p.type_id for p in parents.values()})
    prices = prices_by_type({m.type_id for m in matches})
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in={m.root_location_id for m in matches})}
    results = []
    for m in matches[:SEARCH_LIMIT]:
        parent = parents.get(m.location_id)
        row = {
            "item_id": m.item_id,
            "type": type_out(m.type_id, types, copy=bool(m.is_blueprint_copy)),
            "name": m.name,
            "quantity": m.quantity,
            "flag": m.location_flag,
            "value": round(_value(m, prices), 2),
            "inside": _container_label(parent, types),
            "location": describe(locations.get(m.root_location_id)),
        }
        if with_character:
            row["character"] = {"id": m.character_id, "name": m.character.name}
        results.append(row)
    return {"results": results, "truncated": len(matches) > SEARCH_LIMIT}


@router.get("/{character_id}/assets/locations")
def character_locations(request, character_id: int):
    return _locations(Asset.objects.filter(character=viewable_character(request, character_id)))


@router.get("/{character_id}/assets/locations/{location_id}")
def character_location_items(request, character_id: int, location_id: int):
    return _tree(Asset.objects.filter(character=viewable_character(request, character_id)), location_id, False)


@router.get("/{character_id}/assets/search")
def character_search(request, character_id: int, q: str):
    return _search(Asset.objects.filter(character=viewable_character(request, character_id)), q, False)


@me_router.get("/assets/locations")
def my_locations(request):
    return _locations(Asset.objects.filter(character__in=my_characters(request)))


@me_router.get("/assets/locations/{location_id}")
def my_location_items(request, location_id: int):
    return _tree(Asset.objects.filter(character__in=my_characters(request)), location_id, True)


@me_router.get("/assets/search")
def my_search(request, q: str):
    return _search(Asset.objects.filter(character__in=my_characters(request)), q, True)
