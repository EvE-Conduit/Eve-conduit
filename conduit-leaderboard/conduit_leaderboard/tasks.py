from celery import shared_task


@shared_task(ignore_result=True)
def award_finished_months():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("leaderboard"):
        services.award_finished_months()
