from celery import shared_task

from . import importer


@shared_task(time_limit=3600)
def update_sde(force: bool = False):
    version = importer.update(force=force)
    return version.build_number if version else None
