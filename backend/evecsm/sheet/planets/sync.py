from django.db import transaction

from evecsm.esi.exceptions import EsiError
from evecsm.sheet.util import parse_dt

from .models import Colony


def sync(character, esi):
    cid = character.pk
    planets = esi.get(f"/characters/{cid}/planets", character=character).data
    known = dict(Colony.objects.filter(character=character).values_list("planet_id", "planet_name"))
    colonies = []
    for p in planets:
        layout = esi.get(f"/characters/{cid}/planets/{p['planet_id']}", character=character).data
        name = known.get(p["planet_id"]) or ""
        if not name:
            try:
                name = esi.get(f"/universe/planets/{p['planet_id']}").data["name"]
            except EsiError:
                name = ""
        colonies.append(
            Colony(
                character=character,
                planet_id=p["planet_id"],
                planet_name=name,
                planet_type=p["planet_type"],
                solar_system_id=p["solar_system_id"],
                upgrade_level=p["upgrade_level"],
                num_pins=p["num_pins"],
                last_update=parse_dt(p["last_update"]),
                layout=layout,
            )
        )
    with transaction.atomic():
        Colony.objects.filter(character=character).delete()
        Colony.objects.bulk_create(colonies)
