"""Industry: every job SeAT kept. EVE forgets finished jobs after a while.

When the section has synced from EVE, only jobs Conduit doesn't have come over, so no status goes backwards.
"""

from conduit.sheet.industry.models import IndustryJob

from ..esi import drop_none, esi_dt, route
from . import HISTORY, section

section("industry", HISTORY, ["character_industry_jobs"])


def _int(v):
    return None if v in (None, "") else int(v)


def _num(v):
    return None if v in (None, "") else float(v)


@route("/characters/{cid}/industry/jobs")
def jobs(ctx, params, cid):
    rows = ctx.store.rows("character_industry_jobs", character_id=cid)
    have = set()
    if ctx.synced:
        have = set(IndustryJob.objects.filter(character_id=cid).values_list("job_id", flat=True))
    return [
        drop_none({
            "job_id": int(r["job_id"]), "installer_id": _int(r["installer_id"]), "facility_id": int(r["facility_id"]),
            "station_id": int(r["station_id"]), "activity_id": int(r["activity_id"]),
            "blueprint_id": int(r["blueprint_id"]), "blueprint_type_id": int(r["blueprint_type_id"]),
            "blueprint_location_id": _int(r["blueprint_location_id"]),
            "output_location_id": int(r["output_location_id"]), "runs": int(r["runs"]), "cost": _num(r["cost"]),
            "licensed_runs": _int(r["licensed_runs"]), "probability": _num(r["probability"]),
            "product_type_id": _int(r["product_type_id"]), "status": r["status"], "duration": _int(r["duration"]),
            "start_date": esi_dt(r["start_date"]), "end_date": esi_dt(r["end_date"]),
            "pause_date": esi_dt(r["pause_date"]), "completed_date": esi_dt(r["completed_date"]),
            "completed_character_id": _int(r["completed_character_id"]), "successful_runs": _int(r["successful_runs"]),
        })
        for r in rows if int(r["job_id"]) not in have
    ]
