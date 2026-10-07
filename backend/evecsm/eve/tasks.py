"""Keeps characters' corporation and alliance up to date."""

import logging

from celery import shared_task
from django.utils import timezone

from evecsm.esi.client import esi
from evecsm.esi.exceptions import EsiBackoff
from evecsm.db import upsert

from .models import EveAlliance, EveCorporation, EveName, MarketPrice

log = logging.getLogger(__name__)
AFFILIATION_BATCH = 1000  # ESI accepts up to 1000 ids per call


@shared_task(bind=True, max_retries=5)
def update_affiliations(self, character_ids: list[int] | None = None):
    from evecsm.access.services import recompute_user_state
    from evecsm.accounts.models import Character

    qs = Character.objects.all()
    if character_ids:
        qs = qs.filter(pk__in=character_ids)
    ids = list(qs.values_list("pk", flat=True))

    try:
        rows = []
        for i in range(0, len(ids), AFFILIATION_BATCH):
            rows += esi().post("/characters/affiliation", ids[i : i + AFFILIATION_BATCH]).data
        resolve_entities(
            corporation_ids={r["corporation_id"] for r in rows},
            alliance_ids={r["alliance_id"] for r in rows if r.get("alliance_id")},
        )
    except EsiBackoff as exc:
        raise self.retry(countdown=exc.retry_after + 1) from exc

    changed_users = set()
    now = timezone.now()
    for row in rows:
        char = Character.objects.select_related("user").get(pk=row["character_id"])
        corp, alliance = row["corporation_id"], row.get("alliance_id")
        if char.corporation_id != corp or char.alliance_id != alliance:
            changed_users.add(char.user)
        char.corporation_id, char.alliance_id, char.affiliation_updated_at = corp, alliance, now
        char.save(update_fields=["corporation", "alliance", "affiliation_updated_at"])
        # Affiliation data is also the cheapest way to notice a corp changing alliance.
        EveCorporation.objects.filter(pk=corp).exclude(alliance_id=alliance).update(alliance_id=alliance)

    for user in changed_users:
        recompute_user_state(user)
    return len(rows)


def resolve_entities(corporation_ids: set[int], alliance_ids: set[int]):
    """Create or refresh the corporations and alliances we have not seen yet."""
    client = esi()
    for aid in alliance_ids - set(EveAlliance.objects.filter(pk__in=alliance_ids).values_list("pk", flat=True)):
        data = client.get(f"/alliances/{aid}").data
        EveAlliance.objects.update_or_create(id=aid, defaults={"name": data["name"], "ticker": data["ticker"]})
    known = set(EveCorporation.objects.filter(pk__in=corporation_ids).values_list("pk", flat=True))
    for cid in corporation_ids - known:
        data = client.get(f"/corporations/{cid}").data
        alliance_id = data.get("alliance_id")
        if alliance_id and not EveAlliance.objects.filter(pk=alliance_id).exists():
            resolve_entities(set(), {alliance_id})
        EveCorporation.objects.update_or_create(
            id=cid,
            defaults={
                "name": data["name"],
                "ticker": data["ticker"],
                "alliance_id": alliance_id,
                "member_count": data.get("member_count"),
            },
        )


def ensure_names(corporation_ids=(), alliance_ids=()):
    """Make sure corporations and alliances exist with at least a name (one bulk ESI call)."""
    corporation_ids = {int(i) for i in corporation_ids if i}
    alliance_ids = {int(i) for i in alliance_ids if i}
    missing = (
        corporation_ids - set(EveCorporation.objects.filter(pk__in=corporation_ids).exclude(name="").values_list("pk", flat=True))
    ) | (alliance_ids - set(EveAlliance.objects.filter(pk__in=alliance_ids).exclude(name="").values_list("pk", flat=True)))
    missing = sorted(missing)
    for i in range(0, len(missing), 1000):
        for row in esi().post("/universe/names", missing[i : i + 1000]).data:
            model = {"corporation": EveCorporation, "alliance": EveAlliance}.get(row["category"])
            if model:
                model.objects.update_or_create(id=row["id"], defaults={"name": row["name"]})


@shared_task(bind=True, max_retries=3)
def update_market_prices(self):
    try:
        rows = esi().get("/markets/prices").data
    except EsiBackoff as exc:
        raise self.retry(countdown=exc.retry_after + 1) from exc
    upsert(
        MarketPrice,
        [MarketPrice(type_id=r["type_id"], average_price=r.get("average_price"), adjusted_price=r.get("adjusted_price")) for r in rows],
        unique_fields=["type_id"],
        update_fields=["average_price", "adjusted_price"],
        batch_size=2000,
    )
    return len(rows)


def ensure_eve_names(ids) -> None:
    """Look up names for ids we haven't seen. Unknown or invalid ids are skipped."""
    from evecsm.esi.exceptions import EsiError

    wanted = {int(i) for i in ids if i and int(i) > 0}
    missing = sorted(wanted - set(EveName.objects.filter(pk__in=wanted).values_list("pk", flat=True)))
    for i in range(0, len(missing), 1000):
        chunk = missing[i : i + 1000]
        try:
            rows = esi().post("/universe/names", chunk).data
        except EsiError:
            # One bad id fails the whole batch; fall back to smaller batches.
            rows = []
            for j in range(0, len(chunk), 50):
                try:
                    rows += esi().post("/universe/names", chunk[j : j + 50]).data
                except EsiError:
                    continue
        upsert(
            EveName,
            [EveName(id=r["id"], name=r["name"], category=r["category"]) for r in rows],
            unique_fields=["id"],
            update_fields=["name", "category"],
        )


def names_for(ids) -> dict[int, str]:
    return dict(EveName.objects.filter(pk__in={i for i in ids if i}).values_list("id", "name"))
