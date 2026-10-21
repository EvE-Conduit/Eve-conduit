import logging

from celery import shared_task
from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

from . import contracts

log = logging.getLogger(__name__)


@shared_task
def sync_all_contracts() -> int:
    """Every 15 minutes: read each service owner's contracts."""
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
        log.warning("The login of freight service owner %s no longer works; its contracts can't be read until they log in again", owner_id)
    except EsiError as exc:
        log.warning("Couldn't read the contracts of freight service owner %s: %s", owner_id, exc)
    return None
