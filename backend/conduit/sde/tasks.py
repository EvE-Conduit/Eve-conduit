from celery import shared_task
from django.core.cache import cache

from . import importer

#: Set while an import runs, so two workers don't import at once and Health can say it's busy.
IMPORTING_KEY = "sde:importing"


@shared_task(time_limit=3600)
def update_sde(force: bool = False):
    if not cache.add(IMPORTING_KEY, True, timeout=3600):
        return None
    try:
        version = importer.update(force=force)
    finally:
        cache.delete(IMPORTING_KEY)
    return version.build_number if version else None


def outdated() -> bool:
    """The static data was imported by an older EvE Conduit that read less from it."""
    from .models import SdeVersion

    current = SdeVersion.current()
    return current is not None and current.schema < importer.SCHEMA


@shared_task(ignore_result=True)
def update_sde_if_outdated():
    """Run when a worker starts. After an update, the import queued by conduit_init can be picked up by a worker
    still running the old version (which thinks the data is current), so the new workers check again."""
    if outdated():
        update_sde()
