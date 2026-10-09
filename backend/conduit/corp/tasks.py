"""Keeps every corporation's sections fresh, running each as a member who may read it."""

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
from .models import CorpSyncStatus

log = logging.getLogger(__name__)
MAX_BACKOFF = timedelta(hours=6)
REFUSED = {401, 403}


def tracked_corporations():
    """Corporations with at least one registered character whose login still works."""
    from conduit.eve.models import EveCorporation

    return EveCorporation.objects.filter(characters__token__valid=True).distinct()


def candidates(corporation_id: int, section: registry.CorpSection, preferred_id: int | None = None) -> list:
    """Member characters able to sync the section: valid token with its scopes and a fitting role.
    The character that worked last time comes first."""
    from conduit.accounts.models import Character

    out = []
    for c in Character.objects.filter(corporation_id=corporation_id, token__valid=True).select_related("token", "info"):
        if not c.token.has_scopes(*section.scopes):
            continue
        info = getattr(c, "info", None)
        if not section.role_ok(info.roles if info else ()):
            continue
        out.append(c)
    out.sort(key=lambda c: (c.pk != preferred_id, c.name.lower()))
    return out


@shared_task
def schedule_syncs() -> int:
    """Queue every corporation section that is due, as many as the sync queue has room for.
    Runs every few minutes from beat."""
    now = timezone.now()
    corps = tracked_corporations()
    keys = list(registry.SECTIONS)
    for key in keys:  # rows for newly tracked corporations and newly installed sections
        missing = corps.exclude(sync_statuses__section=key).values_list("pk", flat=True)
        CorpSyncStatus.objects.bulk_create(
            [CorpSyncStatus(corporation_id=c, section=key, next_due=now) for c in missing], ignore_conflicts=True, batch_size=1000
        )
    due = list(
        CorpSyncStatus.objects.filter(next_due__lte=now, corporation__in=corps, section__in=keys)
        .order_by("next_due")
        .values_list("pk", "corporation_id", "section")[: sync_queue.room()]
    )
    by_section = defaultdict(list)
    for pk, _, key in due:
        by_section[key].append(pk)
    for key, pks in by_section.items():
        next_due = now + timedelta(seconds=registry.SECTIONS[key].interval)
        for i in range(0, len(pks), 1000):
            CorpSyncStatus.objects.filter(pk__in=pks[i : i + 1000]).update(next_due=next_due)
    for _, corporation_id, key in due:
        sync_section.delay(corporation_id, key)
    return len(due)


@shared_task(bind=True, max_retries=3)
def sync_section(self, corporation_id: int, section_key: str) -> str:
    from conduit.eve.models import EveCorporation

    section = registry.SECTIONS[section_key]
    corporation = EveCorporation.objects.filter(pk=corporation_id).first()
    if corporation is None:
        return "gone"
    status, _ = CorpSyncStatus.objects.get_or_create(corporation=corporation, section=section_key)
    status.last_attempt = timezone.now()
    run = section.sync_function()
    people = candidates(corporation_id, section, status.character_id)

    used, refused, public = None, [], False
    try:
        with esi_source(f"corp:{section_key}"):
            for character in people:
                try:
                    run(corporation, character, esi())
                except TokenInvalid:
                    refused.append(f"{character.name} (login expired)")
                    continue
                except EsiError as exc:
                    if exc.status in REFUSED:
                        refused.append(f"{character.name} (ESI {exc.status})")
                        continue
                    raise
                used = character
                break
            if used is None and not section.needs_character:
                run(corporation, None, esi())  # public data only
                public = True
    except EsiBackoff as exc:
        status.save(update_fields=["last_attempt"])
        raise self.retry(countdown=exc.retry_after + 5) from exc
    except EsiError as exc:
        log.warning("Corporation sync %s for %s failed: %s", section_key, corporation, exc)
        return _finish(status, CorpSyncStatus.Result.ERROR, str(exc)[:300], failed=True, interval=section.interval)
    except Exception as exc:
        log.exception("Corporation sync %s for %s crashed", section_key, corporation)
        return _finish(status, CorpSyncStatus.Result.ERROR, f"Internal error: {exc}"[:300], failed=True, interval=section.interval)

    if used is None and not public:
        if refused:
            msg = "ESI refused every member who should be able to read this: " + ", ".join(refused)
            return _finish(status, CorpSyncStatus.Result.ERROR, msg[:300], failed=True, interval=section.interval)
        scopes = ", ".join(section.scopes)
        msg = f"Needs a registered member with {'the ' + ' or '.join(section.roles) + ' role' if section.roles else 'a login'}" \
              + (f" whose login grants {scopes}" if scopes else "")
        status.character = None
        status.next_due = timezone.now() + timedelta(seconds=section.interval)
        return _finish(status, CorpSyncStatus.Result.NO_CHARACTER, msg[:300])

    status.character = used
    status.last_success = timezone.now()
    status.failures = 0
    status.next_due = status.last_success + timedelta(seconds=section.interval)
    return _finish(status, CorpSyncStatus.Result.OK, "")


def _finish(status: CorpSyncStatus, result: str, message: str, failed: bool = False, interval: int = 0) -> str:
    status.result = result
    status.message = message
    if failed:
        status.failures += 1
        delay = min(timedelta(seconds=interval * (2 ** min(status.failures, 6))), MAX_BACKOFF)
        status.next_due = timezone.now() + delay
    status.save()
    return result


def sync_now(corporation_id: int, sections: list[str] | None = None):
    for key in sections or registry.SECTIONS:
        CorpSyncStatus.objects.update_or_create(corporation_id=corporation_id, section=key, defaults={"next_due": timezone.now()})
        sync_section.apply_async((corporation_id, key), queue="default")  # ahead of the routine syncs
