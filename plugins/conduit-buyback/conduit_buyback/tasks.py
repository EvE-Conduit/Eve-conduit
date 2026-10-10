import logging
from collections import defaultdict
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

from . import contracts, market, prices
from .models import BuybackSettings, Quote

log = logging.getLogger(__name__)


@shared_task
def sync_all_contracts() -> int:
    """Every 15 minutes: read each program owner's contracts."""
    owners = contracts.sync_due_owners()
    for owner_id in owners:
        sync_owner_contracts.delay(owner_id)
    return len(owners)


@shared_task(bind=True, max_retries=3)
def sync_owner_contracts(self, owner_id: int) -> dict | None:
    try:
        return contracts.sync_owner(owner_id)
    except EsiBackoff as exc:
        raise self.retry(countdown=exc.retry_after + 1) from exc
    except TokenInvalid:
        log.warning("The login of program owner %s no longer works; its contracts can't be read until they log in again", owner_id)
    except EsiError as exc:
        log.warning("Couldn't read the contracts of program owner %s: %s", owner_id, exc)
    return None


@shared_task
def update_prices() -> int:
    """Hourly: refresh stored prices older than the maximum age."""
    try:
        return prices.refresh_stale()
    except prices.PriceError as exc:
        log.warning("%s", exc)
        return 0


@shared_task
def pull_market() -> int | None:
    """Every 30 minutes, for the ESI source: read the whole order book of every hub in use."""
    return market.pull_once()


@shared_task(bind=True, max_retries=3)
def fetch_history_later(self, type_ids: list[int], region_id: int) -> int:
    """Market history a quote didn't wait for."""
    try:
        return market.fetch_history(type_ids, region_id)
    except EsiBackoff as exc:
        raise self.retry(countdown=exc.retry_after + 1) from exc


@shared_task
def refresh_history() -> int:
    """Hourly: refresh the market history of items quoted before, in the regions of the hubs in use, a slice at a
    time (history changes daily)."""
    from .models import PriceHistory

    s = BuybackSettings.load()
    if not s.guard_enabled:
        return 0
    regions = {r for r in (market.hub_region(h.id) for h in market.hubs_in_use(s)) if r}
    stale = PriceHistory.objects.filter(region_id__in=regions, updated_at__lt=timezone.now() - timedelta(hours=20))
    todo = defaultdict(list)
    for region, type_id in stale.order_by("updated_at").values_list("region_id", "type_id")[:500]:
        todo[region].append(type_id)
    done = 0
    for region, ids in todo.items():
        try:
            done += market.fetch_history(ids, region)
        except EsiBackoff:
            break
    return done


@shared_task
def cleanup() -> int:
    """Remove quotes nobody made a contract for, and the prices of markets nothing uses any more."""
    market.prune()
    hours = BuybackSettings.load().unlinked_purge_hours
    if not hours:
        return 0
    deleted, _ = Quote.objects.filter(created_at__lt=timezone.now() - timedelta(hours=hours), contracts__isnull=True).delete()
    return deleted
