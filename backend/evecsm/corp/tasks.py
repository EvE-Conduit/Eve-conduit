"""Keeps every corporation's sections fresh, running each as a member who may read it."""

from __future__ import annotations

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from evecsm.esi.calllog import esi_source
from evecsm.esi.client import esi
from evecsm.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

from . import registry
from .models import CorpSyncStatus

log = logging.getLogger(__name__)
MAX_BACKOFF = timedelta(hours=6)
REFUSED = {401, 403}


def tracked_corporations():
    """Corporations with at least one registered character whose login still works."""
    from evecsm.eve.models import EveCorporation

    return EveCorporation.objects.filter(characters__token__valid=True).distinct()


def candidates(corporation_id: int, section: registry.CorpSection, preferred_id: int | None = None) -> list:
    """Member characters able to sync the section: valid token with its scopes and a fitting role.
    The character that worked last time comes first."""
    from evecsm.accounts.models import Character

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
def schedule_syncs(limit: int = 300) -> int:
    """Queue every corporation section that is due. Runs every few minutes from beat."""
    now = timezone.now()
    corps = list(tracked_corporations().values_list("pk", flat=True))
    existing = set(CorpSyncStatus.objects.filter(corporation_id__in=corps).values_list("corporation_id", "section"))
    CorpSyncStatus.objects.bulk_create(
        [CorpSyncStatus(corporation_id=c, section=k, next_due=now) for c in corps for k in registry.SECTIONS if (c, k) not in existing],
        ignore_conflicts=True,
    )
    queued = 0
    due = CorpSyncStatus.objects.filter(next_due__lte=now, corporation_id__in=corps, section__in=list(registry.SECTIONS))
    for status in due.order_by("next_due")[:limit]:
        status.next_due = now + timedelta(seconds=registry.SECTIONS[status.section].interval)
        status.save(update_fields=["next_due"])
        sync_section.delay(status.corporation_id, status.section)
        queued += 1
    return queued


@shared_task(bind=True, max_retries=3)
def sync_section(self, corporation_id: int, section_key: str) -> str:
    from evecsm.eve.models import EveCorporation

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
        sync_section.delay(corporation_id, key)
