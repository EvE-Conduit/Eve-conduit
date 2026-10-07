from django.db import transaction

from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.locations import resolve

from ..models import CorpMarketOrder
from .common import dec, parse_dt


def sync(corporation, character, esi):
    rows = esi.get_all_pages(f"/corporations/{corporation.pk}/orders", character=character)
    with transaction.atomic():
        # Orders no longer listed have been filled, expired or cancelled.
        CorpMarketOrder.objects.filter(corporation=corporation, state="active").exclude(order_id__in=[o["order_id"] for o in rows]).update(state="closed")
        for o in rows:
            CorpMarketOrder.objects.update_or_create(
                corporation=corporation, order_id=o["order_id"],
                defaults={
                    "type_id": o["type_id"], "is_buy_order": o.get("is_buy_order", False), "price": dec(o["price"]),
                    "volume_total": o["volume_total"], "volume_remain": o["volume_remain"], "issued": parse_dt(o["issued"]),
                    "issued_by": o.get("issued_by"), "duration": o["duration"], "location_id": o["location_id"],
                    "region_id": o["region_id"], "wallet_division": o.get("wallet_division"), "escrow": dec(o.get("escrow")),
                    "state": "active",
                },
            )
    ensure_eve_names({o.get("issued_by") for o in rows})
    resolve({o["location_id"] for o in rows}, character=character, client=esi)
