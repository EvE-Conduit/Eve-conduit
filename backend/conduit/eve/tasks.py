"""Keeps characters' corporation and alliance up to date."""

import logging
from collections import defaultdict

from celery import shared_task
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from conduit.esi.client import esi
from conduit.esi.exceptions import EsiBackoff, EsiError
from conduit.db import upsert

from .models import EveAlliance, EveCorporation, EveName, MarketPrice

log = logging.getLogger(__name__)
AFFILIATION_BATCH = 1000  # ESI accepts up to 1000 ids per call
# /universe/names answers 404 for a whole batch when one id in it has no name. An id that fails on its own is
# remembered, so it isn't asked for (and doesn't cost an ESI error) on every sync.
UNRESOLVABLE_KEY = "eve:name-unresolvable:{id}"
UNRESOLVABLE_FOR = 7 * 24 * 3600


@shared_task(bind=True, max_retries=5)
def update_affiliations(self, character_ids: list[int] | None = None):
    from conduit.access.services import recompute_user_state
    from conduit.accounts.models import Character

    qs = Character.objects.all()
    if character_ids:
        qs = qs.filter(pk__in=character_ids)
    ids = list(qs.values_list("pk", flat=True))

    try:
        rows = []
        for i in range(0, len(ids), AFFILIATION_BATCH):
            try:
                rows += esi().post("/characters/affiliation", ids[i : i + AFFILIATION_BATCH]).data
            except EsiError as exc:
                # One batch ESI can't answer must not keep everyone else's corporation (and so their access) stale.
                log.warning("Affiliations of %s characters not updated this run: %s", len(ids[i : i + AFFILIATION_BATCH]), exc)
        resolve_entities(
            corporation_ids={r["corporation_id"] for r in rows},
            alliance_ids={r["alliance_id"] for r in rows if r.get("alliance_id")},
        )
    except EsiBackoff as exc:
        raise self.retry(countdown=exc.retry_after + 1) from exc

    # A corporation or alliance ESI wouldn't describe this run is left for the next one; the rest go ahead.
    corps = set(EveCorporation.objects.filter(pk__in={r["corporation_id"] for r in rows}).values_list("pk", flat=True))
    alliances = set(EveAlliance.objects.filter(pk__in={r["alliance_id"] for r in rows if r.get("alliance_id")}).values_list("pk", flat=True))
    rows = [r for r in rows if r["corporation_id"] in corps and (not r.get("alliance_id") or r["alliance_id"] in alliances)]

    now = timezone.now()
    # Affiliation data is also the cheapest way to notice a corp changing alliance.
    for corp, alliance in {r["corporation_id"]: r.get("alliance_id") for r in rows}.items():
        EveCorporation.objects.filter(pk=corp).exclude(alliance_id=alliance).update(alliance_id=alliance)

    chars = {}
    for i in range(0, len(rows), AFFILIATION_BATCH):
        batch = [r["character_id"] for r in rows[i : i + AFFILIATION_BATCH]]
        chars.update((c.pk, c) for c in Character.objects.select_related("user").filter(pk__in=batch))
    by_user = defaultdict(list)
    for row in rows:
        char = chars.get(row["character_id"])
        if char is not None:  # None: unlinked while we were asking ESI
            by_user[char.user_id].append((char, row))

    for user_rows in by_user.values():
        user = user_rows[0][0].user
        try:
            # Saved and recomputed together: a crash can't leave a change that the next run would no longer see.
            with transaction.atomic():
                changed = False
                for char, row in user_rows:
                    corp, alliance = row["corporation_id"], row.get("alliance_id")
                    changed |= char.corporation_id != corp or char.alliance_id != alliance
                    char.corporation_id, char.alliance_id, char.affiliation_updated_at = corp, alliance, now
                    char.save(update_fields=["corporation", "alliance", "affiliation_updated_at"])
                if changed:
                    recompute_user_state(user)
        except Exception:
            log.exception("Updating the affiliations of %s failed", user)
    return len(rows)


def resolve_entities(corporation_ids: set[int], alliance_ids: set[int]):
    """Create or refresh the corporations and alliances we have not seen yet."""
    client = esi()
    for aid in alliance_ids - set(EveAlliance.objects.filter(pk__in=alliance_ids).values_list("pk", flat=True)):
        try:
            data = client.get(f"/alliances/{aid}").data
        except EsiError as exc:  # this one waits for the next run; the others still get created
            log.warning("Could not read alliance %s: %s", aid, exc)
            continue
        EveAlliance.objects.update_or_create(id=aid, defaults={"name": data["name"], "ticker": data["ticker"]})
    known = set(EveCorporation.objects.filter(pk__in=corporation_ids).values_list("pk", flat=True))
    for cid in corporation_ids - known:
        try:
            data = client.get(f"/corporations/{cid}").data
        except EsiError as exc:
            log.warning("Could not read corporation %s: %s", cid, exc)
            continue
        alliance_id = data.get("alliance_id")
        if alliance_id and not EveAlliance.objects.filter(pk=alliance_id).exists():
            resolve_entities(set(), {alliance_id})
            if not EveAlliance.objects.filter(pk=alliance_id).exists():
                continue  # its alliance couldn't be read either: try the corporation again next run
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
    wanted = {int(i) for i in ids if i and int(i) > 0}
    missing = sorted(wanted - set(EveName.objects.filter(pk__in=wanted).values_list("pk", flat=True)))
    if missing:
        bad = cache.get_many([UNRESOLVABLE_KEY.format(id=i) for i in missing])
        missing = [i for i in missing if UNRESOLVABLE_KEY.format(id=i) not in bad]
    # One bad id fails the whole batch (404). Halve a failed batch until the bad id is alone, so every other id
    # in it still gets its name; a few extra calls once, instead of two failing ones on every sync.
    todo = [missing[i : i + 1000] for i in range(0, len(missing), 1000)][::-1]
    while todo:
        chunk = todo.pop()
        try:
            rows = esi().post("/universe/names", chunk).data
        except EsiError as exc:
            if exc.status != 404:
                return  # ESI is in trouble, not the ids: don't pile more failing calls on; the next sync asks again
            if len(chunk) == 1:
                cache.set(UNRESOLVABLE_KEY.format(id=chunk[0]), 1, UNRESOLVABLE_FOR)
            else:
                half = len(chunk) // 2
                todo += [chunk[half:], chunk[:half]]
            continue
        upsert(
            EveName,
            [EveName(id=r["id"], name=r["name"], category=r["category"]) for r in rows],
            unique_fields=["id"],
            update_fields=["name", "category"],
        )


def names_for(ids) -> dict[int, str]:
    return dict(EveName.objects.filter(pk__in={i for i in ids if i}).values_list("id", "name"))
