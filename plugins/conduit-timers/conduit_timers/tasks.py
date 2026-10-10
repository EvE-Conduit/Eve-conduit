from celery import shared_task


@shared_task(ignore_result=True)
def remind_due():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("timers"):
        services.remind_due()


@shared_task(ignore_result=True)
def import_timers():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("timers"):
        services.import_all()
