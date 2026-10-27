from celery import shared_task


@shared_task(ignore_result=True)
def daily():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("spycheck"):
        services.scan()
