from django.db import transaction

from evecsm.sheet.assets.models import Asset
from evecsm.sheet.locations import resolve

from .models import Blueprint


def sync(character, esi):
    rows = esi.get_all_pages(f"/characters/{character.pk}/blueprints", character=character)
    # Blueprints inside containers point at the container; use the asset tree to find the station.
    containers = dict(
        Asset.objects.filter(character=character, item_id__in={r["location_id"] for r in rows}).values_list("item_id", "root_location_id")
    )
    with transaction.atomic():
        Blueprint.objects.filter(character=character).delete()
        Blueprint.objects.bulk_create(
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
            batch_size=2000,
        )
    resolve(
        set(containers.values()) | {r["location_id"] for r in rows if r["location_id"] not in containers}, character=character, client=esi
    )
