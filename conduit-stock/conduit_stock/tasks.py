from celery import shared_task


@shared_task
def check_stock() -> dict:
    """Hourly: tell the managers about targets that went low, and drop claims that ran out."""
    from . import services

    return services.check()
