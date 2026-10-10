import logging
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
    """Every 30 minutes, for the ESI source: read the hub's whole order book."""
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
    """Hourly: refresh the market history of items quoted before, a slice at a time (history changes daily)."""
    from .models import PriceHistory

    s = BuybackSettings.load()
    region = market.hub_region(s)
    if not s.guard_enabled or region is None:
        return 0
    stale = PriceHistory.objects.filter(updated_at__lt=timezone.now() - timedelta(hours=20))
    ids = list(stale.order_by("updated_at").values_list("type_id", flat=True)[:500])
    try:
        return market.fetch_history(ids, region) if ids else 0
    except EsiBackoff:
        return 0


@shared_task
def cleanup() -> int:
    """Remove quotes nobody made a contract for."""
    hours = BuybackSettings.load().unlinked_purge_hours
    if not hours:
        return 0
    deleted, _ = Quote.objects.filter(created_at__lt=timezone.now() - timedelta(hours=hours), contracts__isnull=True).delete()
    return deleted
