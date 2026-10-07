from django.db import transaction

from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.locations import resolve

from ..models import CorpIndustryJob
from .common import dec, parse_dt


def sync(corporation, character, esi):
    rows = esi.get_all_pages(f"/corporations/{corporation.pk}/industry/jobs", character=character, params={"include_completed": "true"})
    with transaction.atomic():
        for j in rows:
            CorpIndustryJob.objects.update_or_create(
                corporation=corporation, job_id=j["job_id"],
                defaults={
                    "installer_id": j["installer_id"], "activity_id": j["activity_id"], "status": j["status"],
                    "blueprint_type_id": j["blueprint_type_id"], "product_type_id": j.get("product_type_id"), "runs": j["runs"],
                    "cost": dec(j.get("cost")), "facility_id": j["facility_id"], "location_id": j.get("location_id") or j["facility_id"],
                    "start_date": parse_dt(j["start_date"]), "end_date": parse_dt(j["end_date"]),
                    "completed_date": parse_dt(j.get("completed_date")),
                },
            )
    ensure_eve_names({j["installer_id"] for j in rows})
    resolve({j.get("location_id") or j["facility_id"] for j in rows}, character=character, client=esi)
