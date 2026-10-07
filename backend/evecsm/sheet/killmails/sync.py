from evecsm.esi.exceptions import EsiError
from evecsm.eve.tasks import ensure_eve_names
from evecsm.sheet.util import parse_dt, prices_by_type

from .models import CharacterKillmail, Killmail

FETCH_LIMIT = 100


def _value(data: dict) -> float:
    victim = data["victim"]
    items = victim.get("items", [])
    flat = items + [child for i in items for child in i.get("items", [])]
    prices = prices_by_type({victim["ship_type_id"], *(i["item_type_id"] for i in flat)})
    total = prices.get(victim["ship_type_id"], 0)
    for i in flat:
        total += prices.get(i["item_type_id"], 0) * ((i.get("quantity_destroyed") or 0) + (i.get("quantity_dropped") or 0))
    return total


def sync(character, esi):
    recent = esi.get_all_pages(f"/characters/{character.pk}/killmails/recent", character=character)
    known = set(Killmail.objects.filter(pk__in=[k["killmail_id"] for k in recent]).values_list("pk", flat=True))
    fetched = 0
    for ref in recent:
        if ref["killmail_id"] not in known:
            if fetched >= FETCH_LIMIT:
                continue
            try:
                data = esi.get(f"/killmails/{ref['killmail_id']}/{ref['killmail_hash']}").data
            except EsiError:
                continue
            fetched += 1
            victim = data["victim"]
            final = next((a for a in data.get("attackers", []) if a.get("final_blow")), {})
            Killmail.objects.create(
                id=ref["killmail_id"],
                hash=ref["killmail_hash"],
                time=parse_dt(data["killmail_time"]),
                solar_system_id=data["solar_system_id"],
                victim_character_id=victim.get("character_id"),
                victim_corporation_id=victim.get("corporation_id"),
                victim_alliance_id=victim.get("alliance_id"),
                victim_ship_type_id=victim["ship_type_id"],
                damage_taken=victim.get("damage_taken", 0),
                attacker_count=len(data.get("attackers", [])),
                final_blow_character_id=final.get("character_id"),
                value=_value(data),
                data=data,
            )
            ensure_eve_names(
                {victim.get("character_id"), victim.get("corporation_id"), victim.get("alliance_id"), final.get("character_id")}
            )
        km = Killmail.objects.filter(pk=ref["killmail_id"]).first()
        if km:
            CharacterKillmail.objects.get_or_create(
                character=character, killmail=km, defaults={"is_loss": km.victim_character_id == character.pk}
            )
