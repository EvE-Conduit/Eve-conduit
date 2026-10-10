from celery import shared_task


@shared_task(ignore_result=True)
def cleanup():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("mumble"):
        return services.cleanup()
