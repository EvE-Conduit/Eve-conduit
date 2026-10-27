from celery import shared_task


@shared_task(ignore_result=True)
def reminders():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("pi"):
        services.send_reminders()


@shared_task(ignore_result=True)
def digest():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("pi"):
        services.send_digests()
