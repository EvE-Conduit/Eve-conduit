from evecsm.eve.models import EveCorporation, corporation_logo_url
from evecsm.sde.models import Bloodline, Race, SolarSystem, type_render_url
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.locations import describe
from evecsm.sheet.models import Location
from evecsm.sheet.util import type_out, types_by_id

from .models import CharacterInfo


def _iso(dt):
    return dt.isoformat() if dt else None


@router.get("/{character_id}/overview")
def overview(request, character_id: int):
    character = viewable_character(request, character_id)
    info = CharacterInfo.objects.filter(character=character).first()
    history = list(character.corporation_history.all())
    corps = {c.id: c for c in EveCorporation.objects.filter(pk__in={h.corporation_id for h in history})}
    out = {
        "synced": info is not None,
        "corporation_history": [
            {
                "corporation": {
                    "id": h.corporation_id,
                    "name": corps[h.corporation_id].name if h.corporation_id in corps else str(h.corporation_id),
                    "logo": corporation_logo_url(h.corporation_id),
                },
                "start_date": _iso(h.start_date),
                "is_deleted": h.is_deleted,
            }
            for h in history
        ],
    }
    if info is None:
        return out

    implant_ids = set(info.implants) | {i for c in info.jump_clones for i in c["implants"]}
    types = types_by_id(implant_ids | {info.ship_type_id})
    loc_ids = {info.station_id, info.structure_id, info.home_location_id, *(c["location_id"] for c in info.jump_clones)}
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in={i for i in loc_ids if i})}
    system = SolarSystem.objects.select_related("region").filter(pk=info.solar_system_id).first()
    docked = info.station_id or info.structure_id

    out.update(
        {
            "birthday": _iso(info.birthday),
            "gender": info.gender,
            "race": Race.objects.filter(pk=info.race_id).values_list("name", flat=True).first(),
            "bloodline": Bloodline.objects.filter(pk=info.bloodline_id).values_list("name", flat=True).first(),
            "security_status": info.security_status,
            "description": info.description,
            "title": info.title,
            "location": {
                "system": {"id": system.id, "name": system.name, "security": system.display_security, "region": system.region.name}
                if system
                else None,
                "docked_at": describe(locations.get(docked)) if docked else None,
            }
            if info.solar_system_id
            else None,
            "ship": {"type": type_out(info.ship_type_id, types), "name": info.ship_name, "render": type_render_url(info.ship_type_id)}
            if info.ship_type_id
            else None,
            "online": {"online": info.online, "last_login": _iso(info.last_login), "last_logout": _iso(info.last_logout), "logins": info.logins}
            if info.online is not None
            else None,
            "home": describe(locations.get(info.home_location_id)),
            "implants": [type_out(i, types) for i in info.implants],
            "jump_clones": [
                {"id": c["jump_clone_id"], "name": c["name"], "location": describe(locations.get(c["location_id"])), "implants": [type_out(i, types) for i in c["implants"]]}
                for c in info.jump_clones
            ],
            "last_clone_jump": _iso(info.last_clone_jump_date),
            "jump_fatigue_expires": _iso(info.jump_fatigue_expires),
            "last_jump": _iso(info.last_jump_date),
            "titles": info.titles,
            "roles": info.roles,
            "updated_at": _iso(info.updated_at),
        }
    )
    return out
