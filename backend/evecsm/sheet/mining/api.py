from collections import defaultdict
from datetime import timedelta

from django.utils import timezone

from evecsm.sde.models import SolarSystem
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.util import prices_by_type, type_out, types_by_id

from .models import MiningEntry

DAYS = 30


@router.get("/{character_id}/mining")
def mining(request, character_id: int):
    character = viewable_character(request, character_id)
    today = timezone.now().date()
    rows = list(MiningEntry.objects.filter(character=character, date__gt=today - timedelta(days=DAYS)))
    types = types_by_id({r.type_id for r in rows})
    prices = prices_by_type({r.type_id for r in rows})
    systems = {s.id: s for s in SolarSystem.objects.filter(pk__in={r.solar_system_id for r in rows})}

    def volume(r):
        t = types.get(r.type_id)
        return r.quantity * ((t.volume or 0) if t else 0)

    by_type, by_system, by_day = defaultdict(lambda: [0, 0.0, 0.0]), defaultdict(lambda: [0.0, 0.0]), defaultdict(float)
    for r in rows:
        value = r.quantity * prices.get(r.type_id, 0)
        t = by_type[r.type_id]
        t[0] += r.quantity
        t[1] += volume(r)
        t[2] += value
        by_system[r.solar_system_id][0] += volume(r)
        by_system[r.solar_system_id][1] += value
        by_day[r.date] += value

    return {
        "days": DAYS,
        "total_value": sum(v[2] for v in by_type.values()),
        "total_volume": sum(v[1] for v in by_type.values()),
        "series": [{"date": (today - timedelta(days=i)).isoformat(), "value": by_day.get(today - timedelta(days=i), 0.0)} for i in range(DAYS - 1, -1, -1)],
        "ores": sorted(
            ({"type": type_out(tid, types), "quantity": q, "volume": v, "value": val} for tid, (q, v, val) in by_type.items()),
            key=lambda o: -o["value"],
        ),
        "systems": sorted(
            (
                {
                    "system": {"id": sid, "name": systems[sid].name if sid in systems else str(sid), "security": systems[sid].display_security if sid in systems else 0},
                    "volume": v,
                    "value": val,
                }
                for sid, (v, val) in by_system.items()
            ),
            key=lambda s: -s["value"],
        ),
    }
