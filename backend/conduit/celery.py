import os

from celery import Celery
from celery.signals import after_setup_logger, beat_init, worker_ready

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "conduit.settings")

app = Celery("conduit", task_cls="conduit.demo.tasks:Task")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@after_setup_logger.connect
def _keep_service_log(logger, **kwargs):
    """Celery replaces the root logger's handlers; add back the one that keeps warnings and errors
    for Administration > Logs."""
    from django.conf import settings

    if "database" in settings.LOGGING["root"]["handlers"]:
        from conduit.audit.logging import DatabaseLogHandler

        logger.addHandler(DatabaseLogHandler(level="WARNING"))


@worker_ready.connect
@beat_init.connect
def _watch_plugins(sender=None, **kwargs):
    """On Docker, plugins installed from Administration land on a shared volume; restart when they change so
    this process picks them up (the container comes back on the new virtualenv)."""
    from django.conf import settings

    if settings.CONDUIT_INSTALL_KIND == "docker" and settings.CONDUIT_PLUGINS_DIR:
        from conduit.plugins.docker_updater import start_watcher

        start_watcher(settings.CONDUIT_PLUGINS_DIR)


@worker_ready.connect
def _check_static_data(sender=None, **kwargs):
    """Import the static data again if this version reads more from it than the one that imported it."""
    try:
        from conduit.sde.tasks import update_sde_if_outdated

        update_sde_if_outdated.delay()
    except Exception:  # never stop a worker from starting
        import logging

        logging.getLogger(__name__).exception("Could not check the static data")
