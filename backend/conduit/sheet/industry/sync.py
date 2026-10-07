from decimal import Decimal

from conduit.sheet.locations import resolve
from conduit.sheet.util import parse_dt
from conduit.db import upsert

from .models import IndustryJob

FIELDS = [
    "activity_id",
    "status",
    "product_type_id",
    "runs",
    "licensed_runs",
    "successful_runs",
    "probability",
    "cost",
    "facility_id",
    "station_id",
    "output_location_id",
    "end_date",
    "pause_date",
    "completed_date",
]


def sync(character, esi):
    rows = esi.get(f"/characters/{character.pk}/industry/jobs", character=character, params={"include_completed": "true"}).data
    # ESI forgets jobs after a while; keep our history and update what it still returns.
    upsert(
        IndustryJob,
        [
            IndustryJob(
                character=character,
                job_id=r["job_id"],
                activity_id=r["activity_id"],
                status=r["status"],
                blueprint_id=r["blueprint_id"],
                blueprint_type_id=r["blueprint_type_id"],
                product_type_id=r.get("product_type_id"),
                runs=r["runs"],
                licensed_runs=r.get("licensed_runs"),
                successful_runs=r.get("successful_runs"),
                probability=r.get("probability"),
                cost=Decimal(str(r["cost"])) if r.get("cost") is not None else None,
                facility_id=r["facility_id"],
                station_id=r["station_id"],
                output_location_id=r["output_location_id"],
                start_date=parse_dt(r["start_date"]),
                end_date=parse_dt(r["end_date"]),
                pause_date=parse_dt(r.get("pause_date")),
                completed_date=parse_dt(r.get("completed_date")),
            )
            for r in rows
        ],
        unique_fields=["character", "job_id"],
        update_fields=FIELDS,
    )
    resolve({r["station_id"] for r in rows}, character=character, client=esi)
