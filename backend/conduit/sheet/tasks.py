"""Keeps every character's sections fresh."""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from conduit import sync_queue
from conduit.esi.calllog import esi_source
from conduit.esi.client import esi
from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

from . import registry
from .models import SyncStatus

log = logging.getLogger(__name__)
MAX_BACKOFF = timedelta(hours=6)
#: Announce ``sync.failed`` once a section has failed this many times in a row.
SYNC_FAILED_AFTER = 3


@shared_task
def schedule_syncs() -> int:
    """Queue the sections that are due, oldest first, as many as the sync queue has room for.
    Runs every couple of minutes from beat."""
    from conduit.accounts.models import Character

    now = timezone.now()
    keys = list(registry.synced())
    live = Character.objects.filter(token__valid=True)
    for key in keys:  # rows for newly linked characters and newly installed sections
        missing = live.exclude(sync_statuses__section=key).values_list("pk", flat=True)
        SyncStatus.objects.bulk_create(
            [SyncStatus(character_id=c, section=key, next_due=now) for c in missing], ignore_conflicts=True, batch_size=1000
        )
    due = list(
        SyncStatus.objects.filter(next_due__lte=now, character__token__valid=True, section__in=keys)
        .order_by("next_due")
        .values_list("pk", "character_id", "section")[: sync_queue.room()]
    )
    # Push next_due forward first so the next scheduler run doesn't queue them twice.
    by_section = defaultdict(list)
    for pk, _, key in due:
        by_section[key].append(pk)
    for key, pks in by_section.items():
        next_due = now + timedelta(seconds=registry.SECTIONS[key].interval)
        for i in range(0, len(pks), 1000):
            SyncStatus.objects.filter(pk__in=pks[i : i + 1000]).update(next_due=next_due)
    for _, character_id, key in due:
        sync_section.delay(character_id, key)
    return len(due)


@shared_task(bind=True, max_retries=3)
def sync_section(self, character_id: int, section_key: str) -> str:
    from conduit.accounts.models import Character

    section = registry.SECTIONS[section_key]
    if section.virtual:
        return "virtual"  # derived from other sections; nothing to fetch
    character = Character.objects.select_related("token").filter(pk=character_id).first()
    if character is None:
        return "gone"
    status, _ = SyncStatus.objects.get_or_create(character=character, section=section_key)
    now = timezone.now()
    status.last_attempt = now
    token = getattr(character, "token", None)

    if token is None or not token.valid:
        return _finish(status, SyncStatus.Result.TOKEN_INVALID, "Character needs to log in again")
    if not section.can_sync(token.scope_set):
        missing = sorted(set(section.required_scopes) - token.scope_set)
        return _finish(status, SyncStatus.Result.MISSING_SCOPES, "Missing " + ", ".join(missing))

    try:
        with esi_source(f"sheet:{section_key}"):
            section.sync_function()(character, esi())
    except EsiBackoff as exc:
        status.save(update_fields=["last_attempt"])
        raise self.retry(countdown=exc.retry_after + 5) from exc
    except TokenInvalid as exc:
        return _finish(status, SyncStatus.Result.TOKEN_INVALID, str(exc)[:300])
    except EsiError as exc:
        log.warning("Sync %s for %s failed: %s", section_key, character, exc)
        return _finish(status, SyncStatus.Result.ERROR, str(exc)[:300], failed=True, interval=section.interval)
    except Exception as exc:
        log.exception("Sync %s for %s crashed", section_key, character)
        return _finish(status, SyncStatus.Result.ERROR, f"Internal error: {exc}"[:300], failed=True, interval=section.interval)

    status.last_success = timezone.now()
    status.failures = 0
    status.next_due = status.last_success + timedelta(seconds=section.interval)
    return _finish(status, SyncStatus.Result.OK, "")


def _finish(status: SyncStatus, result: str, message: str, failed: bool = False, interval: int = 0) -> str:
    status.result = result
    status.message = message
    if failed:
        status.failures += 1
        # Back off on repeated failures: interval * 2^failures, capped.
        delay = min(timedelta(seconds=interval * (2 ** min(status.failures, 6))), MAX_BACKOFF)
        status.next_due = timezone.now() + delay
        if status.failures == SYNC_FAILED_AFTER:
            from conduit.events import bus

            character = status.character
            bus.emit("sync.failed", character_id=character.pk, character=character.name, user_id=character.user_id,
                     section=status.section, failures=status.failures, title="Character sync failing", level="warning",
                     summary=f"{character.name}: {status.section} failed {status.failures} times in a row ({message[:200]})",
                     link=f"/characters/{character.pk}")
    status.save()
    return result


def sync_now(character, sections: list[str] | None = None):
    """Queue an immediate sync, e.g. right after a character is linked."""
    for key in sections or registry.synced():
        SyncStatus.objects.update_or_create(character=character, section=key, defaults={"next_due": timezone.now()})
        # The default queue, so someone waiting for it doesn't queue behind the routine syncs.
        sync_section.apply_async((character.pk, key), queue="default")


@shared_task(time_limit=None, soft_time_limit=None)
def import_seat_history(run_id: str, character_ids: list[int], sections: list[str]):
    """Import SeAT character data the SeAT import program uploaded (see conduit.sheet.seat.runs)."""
    from .seat import runs

    runs.execute(run_id, character_ids, sections)
