from celery import shared_task


@shared_task(ignore_result=True)
def check_month():
    """Hourly: report last month once, as soon as every corporation's wallets have synced past its end."""
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("finance"):
        services.report_closed_month()
