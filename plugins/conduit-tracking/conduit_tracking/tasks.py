from celery import shared_task


@shared_task(ignore_result=True)
def poll():
    from conduit.plugins.services import is_enabled

    from . import services, tracker

    if is_enabled("tracking"):
        for session in tracker.finish_expired():
            services.tell_finished(session)
        tracker.poll_all()
