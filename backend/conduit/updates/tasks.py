from celery import shared_task
from django.conf import settings


@shared_task
def check_for_updates():
    """Daily: look for newer releases on GitHub (notify only; nothing is downloaded or installed)."""
    if not settings.CONDUIT_UPDATE_CHECK:
        return "off"
    from .services import UpdateError, check

    try:
        state = check()
    except UpdateError as exc:
        return f"failed: {exc}"
    return state.releases[0]["version"] if state.releases else "up to date"


@shared_task
def download_release(version: str):
    from .services import download

    download(version)
    return version


@shared_task
def collect_install_result():
    """Every couple of minutes: tell the admin who asked how the install went."""
    from .models import UpdateState
    from .services import sync_install_result

    sync_install_result(UpdateState.load())
