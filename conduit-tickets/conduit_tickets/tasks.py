from celery import shared_task


@shared_task(ignore_result=True)
def archive_ticket(ticket_id: int):
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("tickets"):
        services.archive_in_background(ticket_id)


@shared_task(ignore_result=True)
def archive_pending():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("tickets"):
        for ticket_id in services.pending_archives():
            services.archive_in_background(ticket_id)
