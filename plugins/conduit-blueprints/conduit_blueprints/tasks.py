from celery import shared_task


@shared_task(ignore_result=True)
def sync_libraries():
    """Every few hours: read each corporation's blueprints as one of its Directors."""
    from conduit.plugins.services import is_enabled

    from . import sync

    if is_enabled("blueprints"):
        sync.sync_all()


@shared_task(ignore_result=True)
def sync_library(corporation_id: int):
    from . import sync

    sync.sync_corporation(corporation_id)


@shared_task(ignore_result=True)
def remind_overdue():
    """Daily: remind borrowers whose loan is past its due date."""
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("blueprints"):
        services.remind_overdue()
