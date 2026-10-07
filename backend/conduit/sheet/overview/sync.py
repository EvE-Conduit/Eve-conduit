import re

from django.db import transaction

from conduit.eve.tasks import ensure_names
from conduit.sheet.locations import resolve
from conduit.sheet.util import parse_dt

from .models import CharacterInfo, CorporationHistory

TAG_RE = re.compile(r"<[^>]+>")


def sync(character, esi):
    cid = character.pk
    has = character.token.has_scopes
    info, _ = CharacterInfo.objects.get_or_create(character=character)

    public = esi.get(f"/characters/{cid}").data
    info.birthday = parse_dt(public.get("birthday"))
    info.gender = public.get("gender", "")
    info.race_id = public.get("race_id")
    info.bloodline_id = public.get("bloodline_id")
    info.security_status = public.get("security_status")
    # In-game bios are HTML-ish (<font>, <a>); keep plain text.
    info.description = TAG_RE.sub("", public.get("description") or "").strip()
    info.title = TAG_RE.sub("", public.get("title") or "")
    info.faction_id = public.get("faction_id")

    history = esi.get(f"/characters/{cid}/corporationhistory").data
    ensure_names(corporation_ids={h["corporation_id"] for h in history})

    locations = set()
    if has("esi-location.read_location.v1"):
        loc = esi.get(f"/characters/{cid}/location", character=character).data
        info.solar_system_id = loc["solar_system_id"]
        info.station_id = loc.get("station_id")
        info.structure_id = loc.get("structure_id")
        locations |= {info.station_id, info.structure_id}
    if has("esi-location.read_ship_type.v1"):
        ship = esi.get(f"/characters/{cid}/ship", character=character).data
        info.ship_type_id, info.ship_name = ship["ship_type_id"], ship["ship_name"]
    if has("esi-location.read_online.v1"):
        online = esi.get(f"/characters/{cid}/online", character=character).data
        info.online = online["online"]
        info.last_login = parse_dt(online.get("last_login"))
        info.last_logout = parse_dt(online.get("last_logout"))
        info.logins = online.get("logins")
    if has("esi-clones.read_clones.v1"):
        clones = esi.get(f"/characters/{cid}/clones", character=character).data
        info.home_location_id = (clones.get("home_location") or {}).get("location_id")
        info.last_clone_jump_date = parse_dt(clones.get("last_clone_jump_date"))
        info.jump_clones = [
            {
                "jump_clone_id": c["jump_clone_id"],
                "location_id": c["location_id"],
                "name": c.get("name", ""),
                "implants": c.get("implants", []),
            }
            for c in clones.get("jump_clones", [])
        ]
        locations |= {info.home_location_id, *(c["location_id"] for c in info.jump_clones)}
    if has("esi-clones.read_implants.v1"):
        info.implants = esi.get(f"/characters/{cid}/implants", character=character).data
    if has("esi-characters.read_fatigue.v1"):
        fatigue = esi.get(f"/characters/{cid}/fatigue", character=character).data
        info.jump_fatigue_expires = parse_dt(fatigue.get("jump_fatigue_expire_date"))
        info.last_jump_date = parse_dt(fatigue.get("last_jump_date"))
    if has("esi-characters.read_titles.v1"):
        info.titles = [TAG_RE.sub("", t["name"]) for t in esi.get(f"/characters/{cid}/titles", character=character).data if t.get("name")]
    if has("esi-characters.read_corporation_roles.v1"):
        info.roles = sorted(esi.get(f"/characters/{cid}/roles", character=character).data.get("roles", []))

    resolve(locations - {None}, character=character, client=esi)

    with transaction.atomic():
        info.save()
        CorporationHistory.objects.filter(character=character).delete()
        CorporationHistory.objects.bulk_create(
            CorporationHistory(
                character=character,
                record_id=h["record_id"],
                corporation_id=h["corporation_id"],
                start_date=parse_dt(h["start_date"]),
                is_deleted=h.get("is_deleted", False),
            )
            for h in history
        )
