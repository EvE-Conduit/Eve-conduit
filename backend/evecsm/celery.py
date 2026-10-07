import os

from celery import Celery
from celery.signals import after_setup_logger

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "evecsm.settings")

app = Celery("evecsm")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@after_setup_logger.connect
def _keep_service_log(logger, **kwargs):
    """Celery replaces the root logger's handlers; add back the one that keeps warnings and errors
    for Administration > Logs."""
    from django.conf import settings

    if "database" in settings.LOGGING["root"]["handlers"]:
        from evecsm.audit.logging import DatabaseLogHandler

        logger.addHandler(DatabaseLogHandler(level="WARNING"))
