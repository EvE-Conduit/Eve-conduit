"""Mounted at /api/p/tickets/. Only reachable while the plugin is enabled. Everyone with tickets.open_tickets sees all
tickets; settings and panels need tickets.manage_tickets. Someone who opened a ticket from a panel can read that ticket;
a member a ticket was opened with uses Discord, not these routes."""

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.http import content_disposition_header
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.paging import page
from conduit.permissions import require_perm

from . import panels, services
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


def _readable(request, ticket: Ticket) -> Ticket:
    if not services.can_read(ticket, request.user):
        raise HttpError(403, "You can't read this ticket")
    return ticket


@router.get("/tickets")
@require_perm(OPEN_PERM)
def tickets(request, state: str = "", limit: int = 50, offset: int = 0):
    """Tickets, newest first: ``state`` is "open", "closed" or empty for both."""
    return page(services.tickets_qs(state), services.ticket_out, limit, offset)


@router.get("/mine")
def mine(request, limit: int = 50, offset: int = 0):
    """The tickets the viewer opened from a panel."""
    return page(services.tickets_qs().filter(target=request.user).exclude(panel_label=""), services.ticket_out, limit, offset)


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


@router.get("/roles")
@require_perm(OPEN_PERM)
def roles(request):
    """The Discord roles a new ticket can be shown to."""
    return services.roles_out()


class OpenIn(Schema):
    user_id: int
    subject: str
    message: str = ""
    via: str = "discord"
    #: Discord roles that see the channel; left out, the defaults from Settings.
    role_ids: list[str] | None = None


@router.post("/tickets")
@require_perm(OPEN_PERM)
def open_ticket(request, payload: OpenIn):
    t = _run(services.open_ticket, request.user, payload.user_id, payload.subject, payload.message, payload.via, payload.role_ids, request=request)
    return services.ticket_out(t)


@router.post("/tickets/{ticket_id}/close")
@require_perm(OPEN_PERM)
def close(request, ticket_id: int):
    return services.ticket_out(_run(services.close, _ticket(ticket_id), request.user, request=request))


@router.get("/tickets/{ticket_id}")
def read(request, ticket_id: int):
    """One ticket for its transcript page (audited)."""
    return services.read_ticket(_readable(request, _ticket(ticket_id)), request.user, request=request)


@router.get("/tickets/{ticket_id}/messages")
def messages(request, ticket_id: int, limit: int = 200, offset: int = 0):
    """The transcript, oldest first."""
    return page(services.messages_qs(_readable(request, _ticket(ticket_id))), services.message_out, limit, offset)


@router.get("/attachments/{attachment_id}")
def attachment(request, attachment_id: int):
    """A saved file. Anyone can attach anything, so it can't run as a page of this site: only plain images are shown,
    the rest download, and the sandbox stops scripts in whatever does get opened."""
    a = get_object_or_404(TicketAttachment.objects.select_related("message__ticket"), pk=attachment_id, state=TicketAttachment.SAVED)
    _readable(request, a.message.ticket)
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
    default_role_ids: list[str] = []


@router.put("/settings")
@require_perm(MANAGE_PERM)
def put_settings(request, payload: SettingsIn):
    _run(services.save_settings, payload.category_id, payload.default_role_ids, request.user, request=request)
    return services.settings_out()


class ButtonIn(Schema):
    #: Left out for a new button.
    id: int | None = None
    label: str
    role_ids: list[str]
    category_id: str = ""


class PanelIn(Schema):
    channel_id: str
    title: str
    text: str = ""
    buttons: list[ButtonIn]


@router.get("/panels")
@require_perm(MANAGE_PERM)
def get_panels(request):
    """The panels, what they can use on the server, and anything stopping clicks reaching the site."""
    return panels.panels_out()


@router.post("/panels")
@require_perm(MANAGE_PERM)
def create_panel(request, payload: PanelIn):
    return panels.panel_out(_run(panels.save_panel, None, payload.dict(), request.user, request=request))


@router.put("/panels/{panel_id}")
@require_perm(MANAGE_PERM)
def update_panel(request, panel_id: int, payload: PanelIn):
    return panels.panel_out(_run(panels.save_panel, panel_id, payload.dict(), request.user, request=request))


@router.delete("/panels/{panel_id}")
@require_perm(MANAGE_PERM)
def delete_panel(request, panel_id: int):
    _run(panels.delete_panel, panel_id, request.user, request=request)
    return {"ok": True}
