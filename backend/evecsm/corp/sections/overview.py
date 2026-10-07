import re

from django.db import transaction

from evecsm.eve.tasks import ensure_eve_names, ensure_names
from evecsm.esi.exceptions import EsiError
from evecsm.eve.models import EveCorporation

from ..models import CorporationInfo
from .common import has, parse_dt

TAG_RE = re.compile(r"<[^>]+>")


def sync(corporation, character, esi):
    cid = corporation.pk
    data = esi.get(f"/corporations/{cid}").data
    divisions = None
    if has(character, "esi-corporations.read_divisions.v1"):
        try:
            divisions = esi.get(f"/corporations/{cid}/divisions", character=character).data
        except EsiError as exc:
            if exc.status not in (401, 403):
                raise
    with transaction.atomic():
        info, _ = CorporationInfo.objects.get_or_create(corporation=corporation)
        info.ceo_id = data.get("ceo_id")
        info.creator_id = data.get("creator_id")
        info.date_founded = parse_dt(data.get("date_founded"))
        info.description = TAG_RE.sub("", data.get("description") or "").strip()
        info.home_station_id = data.get("home_station_id")
        info.member_count = data.get("member_count")
        info.shares = data.get("shares")
        info.tax_rate = data.get("tax_rate")
        info.url = (data.get("url") or "")[:300]
        info.faction_id = data.get("faction_id")
        info.war_eligible = data.get("war_eligible")
        if divisions is not None:
            info.hangar_divisions = divisions.get("hangar", [])
            info.wallet_divisions = divisions.get("wallet", [])
        info.save()
    if data.get("alliance_id"):
        ensure_names(alliance_ids={data["alliance_id"]})
    EveCorporation.objects.filter(pk=cid).update(
        name=data["name"], ticker=data["ticker"], member_count=data.get("member_count"), alliance_id=data.get("alliance_id")
    )
    ensure_eve_names({data.get("ceo_id"), data.get("creator_id")})
