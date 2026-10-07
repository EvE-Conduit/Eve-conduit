from celery import shared_task
from django.conf import settings


@shared_task
def check_plugin_updates():
    """Daily: refresh the plugin catalog, install updates for plugins set to update themselves, tell admins."""
    if not settings.CONDUIT_UPDATE_CHECK:
        return "off"
    from .installs import InstallError, check_for_updates

    try:
        return check_for_updates()
    except InstallError as exc:
        return f"failed: {exc}"


@shared_task
def collect_plugin_result():
    """Every couple of minutes: tell the admin who asked how the plugin install went."""
    from .installs import sync_result
    from .models import PluginInstaller

    sync_result(PluginInstaller.load())
