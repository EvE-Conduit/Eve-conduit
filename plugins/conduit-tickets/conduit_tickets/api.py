"""Mounted at /api/p/tickets/. Only reachable while the plugin is enabled. Everyone with tickets.open_tickets sees all
tickets; settings need tickets.manage_tickets. The member a ticket is with uses Discord, not these routes."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.paging import page
from conduit.permissions import require_perm

from . import services
from .models import Ticket
from .services import MANAGE_PERM, OPEN_PERM, TicketError

router = Router(tags=["tickets"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except TicketError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _ticket(ticket_id: int) -> Ticket:
    return get_object_or_404(services.tickets_qs(), pk=ticket_id)


@router.get("/tickets")
@require_perm(OPEN_PERM)
def tickets(request, state: str = "", limit: int = 50, offset: int = 0):
    """Tickets, newest first: ``state`` is "open", "closed" or empty for both."""
    return page(services.tickets_qs(state), lambda t: services.ticket_out(t, request.user), limit, offset)


@router.get("/members")
@require_perm(OPEN_PERM)
def members(request, q: str = ""):
    """Members to open a ticket with."""
    return {"items": services.find_members(request.user, q)}


class OpenIn(Schema):
    user_id: int
    subject: str
    message: str = ""


@router.post("/tickets")
@require_perm(OPEN_PERM)
def open_ticket(request, payload: OpenIn):
    t = _run(services.open_ticket, request.user, payload.user_id, payload.subject, payload.message, request=request)
    return services.ticket_out(t, request.user)


@router.post("/tickets/{ticket_id}/close")
@require_perm(OPEN_PERM)
def close(request, ticket_id: int):
    return services.ticket_out(_run(services.close, _ticket(ticket_id), request.user, request=request), request.user)


@router.delete("/tickets/{ticket_id}/channel")
@require_perm(OPEN_PERM)
def delete_channel(request, ticket_id: int):
    return services.ticket_out(_run(services.delete_channel, _ticket(ticket_id), request.user, request=request), request.user)


@router.get("/settings")
@require_perm(MANAGE_PERM)
def get_settings(request):
    return services.settings_out()


class SettingsIn(Schema):
    category_id: str = ""
    staff_role_id: str = ""


@router.put("/settings")
@require_perm(MANAGE_PERM)
def put_settings(request, payload: SettingsIn):
    _run(services.save_settings, payload.category_id, payload.staff_role_id, request.user, request=request)
    return services.settings_out()
