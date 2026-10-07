from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names
from evecsm.sheet.locations import resolve

from ..models import CorpContract
from .common import dec, parse_dt


def sync(corporation, character, esi):
    rows = esi.get_all_pages(f"/corporations/{corporation.pk}/contracts", character=character)
    with transaction.atomic():
        for c in rows:
            CorpContract.objects.update_or_create(
                corporation=corporation, contract_id=c["contract_id"],
                defaults={
                    "type": c["type"], "status": c["status"], "availability": c.get("availability", ""), "title": (c.get("title") or "")[:200],
                    "issuer_id": c["issuer_id"], "assignee_id": c.get("assignee_id") or None, "acceptor_id": c.get("acceptor_id") or None,
                    "for_corporation": c.get("for_corporation", False), "price": dec(c.get("price")), "reward": dec(c.get("reward")),
                    "collateral": dec(c.get("collateral")), "volume": c.get("volume"), "date_issued": parse_dt(c["date_issued"]),
                    "date_expired": parse_dt(c.get("date_expired")), "date_completed": parse_dt(c.get("date_completed")),
                    "start_location_id": c.get("start_location_id"), "end_location_id": c.get("end_location_id"),
                },
            )
    ensure_eve_names({c["issuer_id"] for c in rows} | {c.get("assignee_id") for c in rows} | {c.get("acceptor_id") for c in rows})
    resolve({c.get("start_location_id") for c in rows} | {c.get("end_location_id") for c in rows} - {None}, character=character, client=esi)
