from django.utils import timezone
from ninja.pagination import paginate

from conduit.sheet.api import router, viewable_character
from conduit.sheet.locations import describe
from conduit.sheet.models import Location
from conduit.sheet.util import type_out, types_by_id

from .models import IndustryJob

OPEN = ("active", "paused", "ready")


def _rows(jobs):
    now = timezone.now()
    types = types_by_id({j.blueprint_type_id for j in jobs} | {j.product_type_id for j in jobs if j.product_type_id})
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in={j.station_id for j in jobs})}
    out = []
    for j in jobs:
        total = (j.end_date - j.start_date).total_seconds()
        status = "ready" if j.status == "active" and j.end_date <= now else j.status
        out.append(
            {
                "job_id": j.job_id,
                "activity": j.activity,
                "activity_id": j.activity_id,
                "status": status,
                "blueprint": type_out(j.blueprint_type_id, types),
                "product": type_out(j.product_type_id, types) if j.product_type_id else None,
                "runs": j.runs,
                "successful_runs": j.successful_runs,
                "probability": j.probability,
                "cost": float(j.cost) if j.cost is not None else None,
                "start_date": j.start_date.isoformat(),
                "end_date": j.end_date.isoformat(),
                "progress": 1.0 if status != "active" or total <= 0 else max(0.0, min(1.0, (now - j.start_date).total_seconds() / total)),
                "location": describe(locations.get(j.station_id)),
            }
        )
    return out


@router.get("/{character_id}/industry")
def industry(request, character_id: int):
    character = viewable_character(request, character_id)
    open_jobs = list(IndustryJob.objects.filter(character=character, status__in=OPEN).order_by("end_date"))
    rows = _rows(open_jobs)
    return {
        "active": [r for r in rows if r["status"] in ("active", "paused")],
        "ready": [r for r in rows if r["status"] == "ready"],
        "total_jobs": IndustryJob.objects.filter(character=character).count(),
    }


@router.get("/{character_id}/industry/history", response=list[dict])
@paginate
def industry_history(request, character_id: int):
    character = viewable_character(request, character_id)
    return _rows(list(IndustryJob.objects.filter(character=character).exclude(status__in=OPEN)[:2000]))
