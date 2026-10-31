"""Mounted at /api/p/tickets/. Only reachable while the plugin is enabled. Everyone with tickets.open_tickets sees all
tickets; settings need tickets.manage_tickets. The member a ticket is with uses Discord, not these routes."""

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.http import content_disposition_header
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.paging import page
from conduit.permissions import require_perm

from . import services
from .models import Ticket, TicketAttachment
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
    return page(services.tickets_qs(state), services.ticket_out, limit, offset)


@router.get("/members")
@require_perm(OPEN_PERM)
def members(request, q: str = ""):
    """Members to open a ticket with."""
    return {"items": services.find_members(request.user, q)}


@router.get("/sender")
@require_perm(OPEN_PERM)
def sender(request):
    """Which character the viewer's EVE mail goes from."""
    return services.mail_sender(request.user)


class OpenIn(Schema):
    user_id: int
    subject: str
    message: str = ""
    via: str = "discord"


@router.post("/tickets")
@require_perm(OPEN_PERM)
def open_ticket(request, payload: OpenIn):
    t = _run(services.open_ticket, request.user, payload.user_id, payload.subject, payload.message, payload.via, request=request)
    return services.ticket_out(t)


@router.post("/tickets/{ticket_id}/close")
@require_perm(OPEN_PERM)
def close(request, ticket_id: int):
    return services.ticket_out(_run(services.close, _ticket(ticket_id), request.user, request=request))


@router.get("/tickets/{ticket_id}")
@require_perm(OPEN_PERM)
def read(request, ticket_id: int):
    """One ticket for its transcript page (audited)."""
    return services.read_ticket(_ticket(ticket_id), request.user, request=request)


@router.get("/tickets/{ticket_id}/messages")
@require_perm(OPEN_PERM)
def messages(request, ticket_id: int, limit: int = 200, offset: int = 0):
    """The transcript, oldest first."""
    return page(services.messages_qs(_ticket(ticket_id)), services.message_out, limit, offset)


@router.get("/attachments/{attachment_id}")
@require_perm(OPEN_PERM)
def attachment(request, attachment_id: int):
    """A saved file. Anyone can attach anything, so it can't run as a page of this site: only plain images are shown,
    the rest download, and the sandbox stops scripts in whatever does get opened."""
    a = get_object_or_404(TicketAttachment, pk=attachment_id, state=TicketAttachment.SAVED)
    kind, inline = services.serve_type(a)
    resp = HttpResponse(bytes(a.content), content_type=kind)
    resp["Content-Disposition"] = content_disposition_header(not inline, a.name)
    resp["X-Content-Type-Options"] = "nosniff"
    resp["Content-Security-Policy"] = "default-src 'none'; sandbox"
    resp["Cache-Control"] = "private, max-age=3600"
    return resp


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
