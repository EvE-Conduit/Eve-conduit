from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names

from .models import Standing


def sync(character, esi):
    rows = esi.get(f"/characters/{character.pk}/standings", character=character).data
    with transaction.atomic():
        Standing.objects.filter(character=character).delete()
        Standing.objects.bulk_create(
            Standing(character=character, from_id=r["from_id"], from_type=r["from_type"], standing=r["standing"]) for r in rows
        )
    ensure_eve_names({r["from_id"] for r in rows})
