from celery import shared_task


@shared_task
def check_fuel() -> dict:
    """Every 15 minutes: fuel warnings at the thresholds, refuels, and claims that are done or ran out."""
    from . import services

    return services.check()
