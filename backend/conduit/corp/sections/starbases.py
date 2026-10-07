from django.db import transaction

from ..models import Starbase
from .common import parse_dt


def sync(corporation, character, esi):
    rows = esi.get_all_pages(f"/corporations/{corporation.pk}/starbases", character=character)
    with transaction.atomic():
        Starbase.objects.filter(corporation=corporation).delete()
        Starbase.objects.bulk_create(
            Starbase(
                corporation=corporation, starbase_id=r["starbase_id"], type_id=r["type_id"], system_id=r["system_id"],
                moon_id=r.get("moon_id"), state=r.get("state", ""), onlined_since=parse_dt(r.get("onlined_since")),
                reinforced_until=parse_dt(r.get("reinforced_until")), unanchor_at=parse_dt(r.get("unanchor_at")),
            )
            for r in rows
        )
