from ninja.pagination import paginate

from evecsm.eve.tasks import names_for
from evecsm.sde.models import SolarSystem
from evecsm.sheet.api import router, viewable_character
from evecsm.sheet.util import type_out, types_by_id

from .models import CharacterKillmail


@router.get("/{character_id}/killmails", response=list[dict])
@paginate
def killmails(request, character_id: int, kind: str = ""):
    qs = CharacterKillmail.objects.filter(character=viewable_character(request, character_id)).select_related("killmail").order_by("-killmail__time")
    if kind == "kills":
        qs = qs.filter(is_loss=False)
    elif kind == "losses":
        qs = qs.filter(is_loss=True)
    links = list(qs[:2000])
    kms = [link.killmail for link in links]
    types = types_by_id({k.victim_ship_type_id for k in kms})
    names = names_for({k.victim_character_id for k in kms} | {k.victim_corporation_id for k in kms} | {k.final_blow_character_id for k in kms})
    systems = {s.id: s for s in SolarSystem.objects.filter(pk__in={k.solar_system_id for k in kms}).select_related("region")}
    out = []
    for link, k in zip(links, kms):
        system = systems.get(k.solar_system_id)
        out.append(
            {
                "id": k.id,
                "time": k.time.isoformat(),
                "is_loss": link.is_loss,
                "ship": type_out(k.victim_ship_type_id, types),
                "victim": names.get(k.victim_character_id) or "Structure / NPC",
                "victim_corporation": names.get(k.victim_corporation_id),
                "final_blow": names.get(k.final_blow_character_id),
                "attackers": k.attacker_count,
                "value": k.value,
                "system": {"id": k.solar_system_id, "name": system.name, "security": system.display_security, "region": system.region.name} if system else None,
                "zkillboard": f"https://zkillboard.com/kill/{k.id}/",
            }
        )
    return out


@router.get("/{character_id}/killmails/summary")
def killmail_summary(request, character_id: int):
    links = list(CharacterKillmail.objects.filter(character=viewable_character(request, character_id)).select_related("killmail"))
    kills = [link.killmail.value for link in links if not link.is_loss]
    losses = [link.killmail.value for link in links if link.is_loss]
    return {"kills": len(kills), "losses": len(losses), "isk_destroyed": sum(kills), "isk_lost": sum(losses)}
