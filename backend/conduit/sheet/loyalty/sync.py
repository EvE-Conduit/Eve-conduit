from django.db import transaction

from conduit.eve.tasks import ensure_eve_names

from .models import LoyaltyPoints


def sync(character, esi):
    rows = esi.get(f"/characters/{character.pk}/loyalty/points", character=character).data
    with transaction.atomic():
        LoyaltyPoints.objects.filter(character=character).delete()
        LoyaltyPoints.objects.bulk_create(
            LoyaltyPoints(character=character, corporation_id=r["corporation_id"], points=r["loyalty_points"]) for r in rows
        )
    ensure_eve_names({r["corporation_id"] for r in rows})
