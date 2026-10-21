from celery import shared_task


@shared_task(ignore_result=True)
def scan_all():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("blacklist"):
        services.check_all()


@shared_task(ignore_result=True)
def check_entry(entry_id: int):
    from . import services
    from .models import Entry

    entry = Entry.objects.filter(pk=entry_id).first()
    if entry is not None:
        services.check_entry(entry)


@shared_task(ignore_result=True)
def check_user(user_id: int, source: str):
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("blacklist"):
        services.check_user(user_id, source)
