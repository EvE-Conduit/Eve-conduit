from django.db import transaction

from conduit.esi.exceptions import EsiError
from conduit.sde.models import ItemType
from conduit.rows import replace_rows
from conduit.sheet.assets.sync import ASSET_FIELDS, CONTAINER_GROUPS, SHIP_CATEGORY, root_locations
from conduit.sheet.locations import resolve

from ..models import CorpAsset


def sync(corporation, character, esi):
    cid = corporation.pk
    rows = esi.get_all_pages(f"/corporations/{cid}/assets", character=character)
    roots = root_locations(rows)
    singleton_types = {r["type_id"] for r in rows if r["is_singleton"]}
    nameable = set(
        ItemType.objects.filter(pk__in=singleton_types).filter(group__category_id=SHIP_CATEGORY).values_list("pk", flat=True)
    ) | set(ItemType.objects.filter(pk__in=singleton_types, group_id__in=CONTAINER_GROUPS).values_list("pk", flat=True))
    to_name = [r["item_id"] for r in rows if r["is_singleton"] and r["type_id"] in nameable]
    names: dict[int, str] = {}
    for i in range(0, len(to_name), 1000):
        try:
            for n in esi.post(f"/corporations/{cid}/assets/names", to_name[i : i + 1000], character=character).data:
                if n["name"] and n["name"] != "None":
                    names[n["item_id"]] = n["name"]
        except EsiError:
            break
    with transaction.atomic():
        replace_rows(
            CorpAsset.objects.filter(corporation=corporation),
            (
                CorpAsset(
                    corporation=corporation, item_id=r["item_id"], type_id=r["type_id"], quantity=r["quantity"],
                    location_id=r["location_id"], location_type=r["location_type"], location_flag=r["location_flag"],
                    is_singleton=r["is_singleton"], is_blueprint_copy=r.get("is_blueprint_copy"),
                    name=names.get(r["item_id"], "")[:100], root_location_id=roots[r["item_id"]],
                )
                for r in rows
            ),
            "item_id",
            ASSET_FIELDS,
        )
    # Office folders sit "in" the station; anything else that isn't an item is a real location.
    resolve(set(roots.values()), character=character, client=esi)
