from celery import shared_task


@shared_task(ignore_result=True)
def remind_due():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("secretsanta"):
        services.remind_due()
