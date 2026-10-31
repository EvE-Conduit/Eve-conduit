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


@shared_task(ignore_result=True)
def open_from_panel(button_id: int, user_id: int, subject: str, message: str, application_id: str, token: str):
    from conduit.plugins.services import is_enabled

    from . import panels

    if is_enabled("tickets"):
        panels.open_in_background(button_id, user_id, subject, message, application_id, token)


@shared_task(ignore_result=True)
def close_from_discord(ticket_id: int, user_id: int, application_id: str, token: str):
    from conduit.plugins.services import is_enabled

    from . import panels

    if is_enabled("tickets"):
        panels.close_in_background(ticket_id, user_id, application_id, token)
