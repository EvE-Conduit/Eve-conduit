import logging

from celery import shared_task


@shared_task(ignore_result=True)
def daily():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("spycheck"):
        try:
            services.scan()
        except services.SpyCheckError as exc:  # Scan now is already running: that one covers today
            logging.getLogger(__name__).info("Skipped the daily Spy Check scan: %s", exc)
