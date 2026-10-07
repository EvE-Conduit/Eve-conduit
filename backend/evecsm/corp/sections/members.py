from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names
from evecsm.esi.exceptions import EsiError
from evecsm.sheet.locations import resolve

from ..models import CorporationMember
from .common import has, parse_dt


def _optional(fn):
    try:
        return fn()
    except EsiError as exc:
        if exc.status in (401, 403):
            return None
        raise


def sync(corporation, character, esi):
    cid = corporation.pk
    ids = esi.get(f"/corporations/{cid}/members", character=character).data
    tracking = {t["character_id"]: t for t in esi.get(f"/corporations/{cid}/membertracking", character=character).data}
    roles = {r["character_id"]: r.get("roles", []) for r in _optional(lambda: esi.get(f"/corporations/{cid}/roles", character=character).data) or []}
    titles: dict[int, list[str]] = {}
    if has(character, "esi-corporations.read_titles.v1"):
        names = {t["title_id"]: t.get("name", "") for t in _optional(lambda: esi.get(f"/corporations/{cid}/titles", character=character).data) or []}
        for row in _optional(lambda: esi.get(f"/corporations/{cid}/members/titles", character=character).data) or []:
            titles[row["character_id"]] = [names[t] for t in row.get("titles", []) if names.get(t)]

    with transaction.atomic():
        CorporationMember.objects.filter(corporation=corporation).exclude(character_id__in=ids).delete()
        existing = {m.character_id: m for m in CorporationMember.objects.filter(corporation=corporation)}
        new = []
        for char_id in ids:
            m = existing.get(char_id) or CorporationMember(corporation=corporation, character_id=char_id)
            t = tracking.get(char_id)
            m.tracked = t is not None
            if t:
                m.start_date = parse_dt(t.get("start_date"))
                m.logon_date = parse_dt(t.get("logon_date"))
                m.logoff_date = parse_dt(t.get("logoff_date"))
                m.location_id = t.get("location_id")
                m.ship_type_id = t.get("ship_type_id")
                m.base_id = t.get("base_id")
            m.roles = sorted(roles.get(char_id, []))
            m.titles = titles.get(char_id, [])
            if m.pk:
                m.save()
            else:
                new.append(m)
        CorporationMember.objects.bulk_create(new, batch_size=1000)
    ensure_eve_names(ids)
    resolve({t.get("location_id") for t in tracking.values()} - {None}, character=character, client=esi)
