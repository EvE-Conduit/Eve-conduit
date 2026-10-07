from django.db import transaction

from .models import Fitting


def sync(character, esi):
    rows = esi.get(f"/characters/{character.pk}/fittings", character=character).data
    with transaction.atomic():
        Fitting.objects.filter(character=character).delete()
        Fitting.objects.bulk_create(
            Fitting(
                character=character,
                fitting_id=r["fitting_id"],
                name=r["name"],
                description=r.get("description", ""),
                ship_type_id=r["ship_type_id"],
                items=r.get("items", []),
            )
            for r in rows
        )
