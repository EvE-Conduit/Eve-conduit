from django.db import transaction

from conduit.rows import replace_rows
from conduit.sheet.assets.models import Asset
from conduit.sheet.locations import resolve

from .models import Blueprint


def sync(character, esi):
    rows = esi.get_all_pages(f"/characters/{character.pk}/blueprints", character=character)
    # Blueprints inside containers point at the container; use the asset tree to find the station.
    containers = dict(
        Asset.objects.filter(character=character, item_id__in={r["location_id"] for r in rows}).values_list("item_id", "root_location_id")
    )
    with transaction.atomic():
        replace_rows(
            Blueprint.objects.filter(character=character),
            (
                Blueprint(
                    character=character,
                    item_id=r["item_id"],
                    type_id=r["type_id"],
                    location_id=r["location_id"],
                    root_location_id=containers.get(r["location_id"], r["location_id"]),
                    location_flag=r["location_flag"],
                    quantity=r["quantity"],
                    runs=r["runs"],
                    material_efficiency=r["material_efficiency"],
                    time_efficiency=r["time_efficiency"],
                )
                for r in rows
            ),
            "item_id",
            ["type_id", "location_id", "root_location_id", "location_flag", "quantity", "runs", "material_efficiency", "time_efficiency"],
        )
    resolve(
        set(containers.values()) | {r["location_id"] for r in rows if r["location_id"] not in containers}, character=character, client=esi
    )
