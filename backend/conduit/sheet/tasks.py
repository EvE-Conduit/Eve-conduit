"""Keeps every character's sections fresh."""

from __future__ import annotations

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

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
def schedule_syncs(limit: int = 500) -> int:
    """Queue every section that is due. Runs every couple of minutes from beat."""
    from conduit.accounts.models import Character

    now = timezone.now()
    queued = 0
    characters = Character.objects.filter(token__valid=True).values_list("pk", flat=True)
    existing = set(SyncStatus.objects.filter(character_id__in=characters).values_list("character_id", "section"))
    SyncStatus.objects.bulk_create(
        [
            SyncStatus(character_id=c, section=key, next_due=now)
            for c in characters
            for key in registry.synced()
            if (c, key) not in existing
        ],
        ignore_conflicts=True,
    )
    due = SyncStatus.objects.filter(next_due__lte=now, character__token__valid=True, section__in=list(registry.synced()))
    for status in due.order_by("next_due")[:limit]:
        # Push next_due forward now so the next scheduler run doesn't queue it twice.
        status.next_due = now + timedelta(seconds=registry.SECTIONS[status.section].interval)
        status.save(update_fields=["next_due"])
        sync_section.delay(status.character_id, status.section)
        queued += 1
    return queued


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
        sync_section.delay(character.pk, key)
