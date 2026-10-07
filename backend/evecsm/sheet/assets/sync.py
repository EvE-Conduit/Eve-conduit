from django.db import transaction

from evecsm.esi.exceptions import EsiError
from evecsm.sde.models import ItemType
from evecsm.sheet.locations import resolve

from .models import Asset

SHIP_CATEGORY = 6
CONTAINER_GROUPS = {12, 340, 448, 649}  # cargo, secure, audit-log and freight containers


def root_locations(rows: list[dict]) -> dict[int, int]:
    """item_id -> id of the station/structure/system the item ultimately sits in."""
    by_item = {r["item_id"]: r for r in rows}
    roots: dict[int, int] = {}
    for r in rows:
        seen, current = [], r
        while current["location_type"] == "item" and current["location_id"] in by_item and len(seen) < 20:
            seen.append(current["item_id"])
            current = by_item[current["location_id"]]
        root = current["location_id"]
        roots[r["item_id"]] = root
    return roots


def sync(character, esi):
    cid = character.pk
    rows = esi.get_all_pages(f"/characters/{cid}/assets", character=character)
    roots = root_locations(rows)

    nameable_types = set(
        ItemType.objects.filter(pk__in={r["type_id"] for r in rows if r["is_singleton"]})
        .filter(group__category_id=SHIP_CATEGORY)
        .values_list("pk", flat=True)
    ) | set(ItemType.objects.filter(pk__in={r["type_id"] for r in rows}, group_id__in=CONTAINER_GROUPS).values_list("pk", flat=True))
    to_name = [r["item_id"] for r in rows if r["is_singleton"] and r["type_id"] in nameable_types]
    names: dict[int, str] = {}
    for i in range(0, len(to_name), 1000):
        try:
            for n in esi.post(f"/characters/{cid}/assets/names", to_name[i : i + 1000], character=character).data:
                if n["name"] and n["name"] != "None":
                    names[n["item_id"]] = n["name"]
        except EsiError:
            break  # names are nice to have

    with transaction.atomic():
        Asset.objects.filter(character=character).delete()
        Asset.objects.bulk_create(
            (
                Asset(
                    character=character,
                    item_id=r["item_id"],
                    type_id=r["type_id"],
                    quantity=r["quantity"],
                    location_id=r["location_id"],
                    location_type=r["location_type"],
                    location_flag=r["location_flag"],
                    is_singleton=r["is_singleton"],
                    is_blueprint_copy=r.get("is_blueprint_copy"),
                    name=names.get(r["item_id"], "")[:100],
                    root_location_id=roots[r["item_id"]],
                )
                for r in rows
            ),
            batch_size=2000,
        )
    resolve(set(roots.values()), character=character, client=esi)
