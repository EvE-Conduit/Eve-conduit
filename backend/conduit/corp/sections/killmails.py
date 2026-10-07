from conduit.esi.exceptions import EsiError
from conduit.eve.tasks import ensure_eve_names
from conduit.sheet.killmails.models import Killmail
from conduit.sheet.killmails.sync import FETCH_LIMIT, _value
from conduit.sheet.util import parse_dt

from ..models import CorporationKillmail


def _store(ref, esi) -> Killmail | None:
    try:
        data = esi.get(f"/killmails/{ref['killmail_id']}/{ref['killmail_hash']}").data
    except EsiError:
        return None
    victim = data["victim"]
    final = next((a for a in data.get("attackers", []) if a.get("final_blow")), {})
    km, _ = Killmail.objects.get_or_create(
        id=ref["killmail_id"],
        defaults={
            "hash": ref["killmail_hash"], "time": parse_dt(data["killmail_time"]), "solar_system_id": data["solar_system_id"],
            "victim_character_id": victim.get("character_id"), "victim_corporation_id": victim.get("corporation_id"),
            "victim_alliance_id": victim.get("alliance_id"), "victim_ship_type_id": victim["ship_type_id"],
            "damage_taken": victim.get("damage_taken", 0), "attacker_count": len(data.get("attackers", [])),
            "final_blow_character_id": final.get("character_id"), "value": _value(data), "data": data,
        },
    )
    ensure_eve_names({victim.get("character_id"), victim.get("corporation_id"), victim.get("alliance_id"), final.get("character_id")})
    return km


def sync(corporation, character, esi):
    recent = esi.get_all_pages(f"/corporations/{corporation.pk}/killmails/recent", character=character)
    known = {k.pk: k for k in Killmail.objects.filter(pk__in=[r["killmail_id"] for r in recent])}
    fetched = 0
    for ref in recent:
        km = known.get(ref["killmail_id"])
        if km is None:
            if fetched >= FETCH_LIMIT:
                continue
            km = _store(ref, esi)
            fetched += 1
            if km is None:
                continue
        CorporationKillmail.objects.get_or_create(
            corporation=corporation, killmail=km, defaults={"is_loss": km.victim_corporation_id == corporation.pk}
        )
