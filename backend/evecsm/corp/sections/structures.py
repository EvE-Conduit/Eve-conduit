from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from evecsm.events import bus
from evecsm.sheet.models import Location

from ..models import Structure
from .common import parse_dt

FUEL_WARNING = timedelta(hours=72)
REINFORCED = {"armor_reinforce", "hull_reinforce"}


def sync(corporation, character, esi):
    rows = esi.get_all_pages(f"/corporations/{corporation.pk}/structures", character=character)
    now = timezone.now()
    alerts = []
    with transaction.atomic():
        Structure.objects.filter(corporation=corporation).exclude(structure_id__in=[r["structure_id"] for r in rows]).delete()
        old = {s.structure_id: s for s in Structure.objects.filter(corporation=corporation)}
        for r in rows:
            s = old.get(r["structure_id"]) or Structure(corporation=corporation, structure_id=r["structure_id"])
            previous_state = s.state if s.pk else None
            s.name = (r.get("name") or "")[:200]
            s.type_id = r["type_id"]
            s.system_id = r["system_id"]
            s.profile_id = r.get("profile_id")
            s.state = r.get("state", "unknown")
            s.fuel_expires = parse_dt(r.get("fuel_expires"))
            s.state_timer_start = parse_dt(r.get("state_timer_start"))
            s.state_timer_end = parse_dt(r.get("state_timer_end"))
            s.unanchors_at = parse_dt(r.get("unanchors_at"))
            s.reinforce_hour = r.get("reinforce_hour")
            s.next_reinforce_hour = r.get("next_reinforce_hour")
            s.services = [{"name": x["name"], "state": x["state"]} for x in r.get("services", [])]
            low = s.fuel_expires is not None and s.fuel_expires - now < FUEL_WARNING
            if low and not s.fuel_warned:
                s.fuel_warned = True
                alerts.append(("fuel", s))
            elif not low and s.fuel_expires is not None:
                s.fuel_warned = False  # refuelled: warn again next time it runs low
            if previous_state and previous_state != s.state:
                alerts.append(("reinforced" if s.state in REINFORCED else "state", s, previous_state))
            s.save()
            # Our own structures' names come with this list: no need to ask (and be refused) per character.
            if s.name:
                Location.objects.update_or_create(
                    id=s.structure_id,
                    defaults={"kind": Location.Kind.STRUCTURE, "name": s.name, "solar_system_id": s.system_id,
                              "type_id": s.type_id, "owner_id": corporation.pk, "resolved": True},
                )
    for alert in alerts:
        _announce(corporation, *alert)


def _announce(corporation, kind, s, previous_state=None):
    from evecsm.notify.services import notify

    from ..access import viewers

    link = f"/corporations/{corporation.pk}?tab=structures"
    name = s.name or f"Structure {s.structure_id}"
    if kind == "fuel":
        hours = max(0, int((s.fuel_expires - timezone.now()).total_seconds() // 3600))
        title, body, level, event = f"{name} is low on fuel", f"About {hours} hours of fuel left.", "warning", "corp.structure_fuel_low"
    elif kind == "reinforced":
        until = s.state_timer_end.strftime("%Y-%m-%d %H:%M ET") if s.state_timer_end else "unknown"
        title, body, level, event = f"{name} was reinforced", f"Now {s.state.replace('_', ' ')}, timer ends {until}.", "danger", "corp.structure_reinforced"
    else:
        title, body, level, event = f"{name}: {s.state.replace('_', ' ')}", f"Was {previous_state.replace('_', ' ')}.", "info", "corp.structure_state_changed"
    bus.emit(event, corporation_id=corporation.pk, corporation=corporation.name, structure_id=s.structure_id, structure=name,
             state=s.state, fuel_expires=s.fuel_expires.isoformat() if s.fuel_expires else None,
             title=title, summary=f"{corporation.name}: {body}", level=level, link=link)
    if kind != "state":
        notify(viewers(corporation), title, body, link=link, level=level, category="corp.structures",
               data={"corporation_id": corporation.pk, "structure_id": s.structure_id})
