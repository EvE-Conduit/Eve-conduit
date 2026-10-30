"""Discord Tickets: a private channel on the Discord server between whoever opens it, the member they pick and,
if one is set, a staff role.

Everything on Discord goes through the Discord plugin's bot and linked accounts, so both people must have linked
Discord and be on the server. Closing takes the member out of the channel and keeps it for staff to read; deleting
the channel is a separate step. Opening, closing and deleting go in the audit log.

Search by alt only reaches characters the viewer's sheet permissions cover, so tickets don't reveal whose alt is whose.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import urlencode

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.notify.services import notify
from conduit.sheet.access import viewable_characters

from .models import Ticket, TicketSettings

log = logging.getLogger(__name__)

OPEN_PERM = "tickets.open_tickets"
MANAGE_PERM = "tickets.manage_tickets"
SUBJECT_MAX, MESSAGE_MAX = 100, 1500

GUILD_TEXT, GUILD_CATEGORY = 0, 4
ROLE, MEMBER = 0, 1
UNKNOWN_CHANNEL = 10003

# Permission bits on top of what the Discord plugin's bot already asks for.
MANAGE_CHANNELS = 1 << 4
VIEW_CHANNEL = 1 << 10
SEND_MESSAGES = 1 << 11
EMBED_LINKS = 1 << 14
ATTACH_FILES = 1 << 15
READ_HISTORY = 1 << 16
#: What people in a ticket may do. Discord only lets the bot hand out what it has itself.
IN_TICKET = VIEW_CHANNEL | SEND_MESSAGES | EMBED_LINKS | ATTACH_FILES | READ_HISTORY
BOT_NEEDS = (
    (MANAGE_CHANNELS, "Manage Channels"), (VIEW_CHANNEL, "View Channels"), (SEND_MESSAGES, "Send Messages"),
    (EMBED_LINKS, "Embed Links"), (ATTACH_FILES, "Attach Files"), (READ_HISTORY, "Read Message History"),
)


class TicketError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _discord():
    """The Discord plugin's API and settings, only imported when used: it's a separate package."""
    from conduit_discord import discord_api
    from conduit_discord.models import DiscordSettings

    s = DiscordSettings.load()
    if not (s.bot_token and s.guild_id):
        raise TicketError("Set up the bot and server under Discord → Server setup first", 409)
    return discord_api, s


def _explain(exc) -> TicketError:
    if exc.status == 401:
        return TicketError("Discord refused the bot token; check it under Discord → Server setup", 502)
    if exc.status == 403 or exc.code == 50013:
        return TicketError("The bot isn't allowed to do that. Check Discord Tickets → Settings for what it's missing.", 502)
    if exc.code == 50035:
        return TicketError("Discord refused the channel. Check the category under Discord Tickets → Settings.", 502)
    return TicketError(str(exc), 503 if exc.status in (0, 429) else 502)


def _name(user) -> str:
    return user.main_character.name if user.main_character else user.display_name


def _user_out(user) -> dict | None:
    if user is None:
        return None
    main = user.main_character
    return {"id": user.pk, "name": _name(user), "portrait": portrait_url(main.pk, 64) if main else None,
            "corporation": main.corporation.name if main and main.corporation else None}


def channel_url(ticket: Ticket) -> str | None:
    if not ticket.channel_id or ticket.channel_gone:
        return None
    return f"https://discord.com/channels/{ticket.guild_id}/{ticket.channel_id}"


def ticket_out(t: Ticket, viewer) -> dict:
    return {
        "id": t.pk,
        "subject": t.subject,
        "target": _user_out(t.target),
        "target_name": t.target_name,
        "opened_by": t.opened_by_name,
        "opened_at": t.opened_at.isoformat(),
        "closed_at": t.closed_at.isoformat() if t.closed_at else None,
        "closed_by": _name(t.closed_by) if t.closed_by else None,
        "url": channel_url(t),
        "can_delete_channel": t.closed_at is not None and not t.channel_gone and bool(t.channel_id) and may_delete(t, viewer),
    }


def tickets_qs(state: str = ""):
    qs = Ticket.objects.select_related("target__main_character__corporation", "closed_by__main_character")
    if state == "open":
        return qs.filter(closed_at__isnull=True)
    if state == "closed":
        return qs.filter(closed_at__isnull=False)
    return qs


# --- picking a member ----------------------------------------------------------------------------------------------


def find_members(viewer, q: str) -> list[dict]:
    """Members with a linked Discord account, by main character, Discord name, or an alt the viewer may see."""
    from conduit_discord.models import DiscordAccount

    q = q.strip()
    if len(q) < 2:
        return []
    base = DiscordAccount.objects.exclude(user=viewer).select_related("user__main_character__corporation")
    accounts = {a.user_id: (a, None) for a in base.filter(Q(user__main_character__name__icontains=q) | Q(username__icontains=q))[:20]}
    alts = viewable_characters(viewer).filter(name__icontains=q, user__discord__isnull=False).exclude(user=viewer)[:50]
    missing = {c.user_id: c.name for c in alts if c.user_id not in accounts}
    for a in base.filter(user_id__in=missing):
        accounts[a.user_id] = (a, missing[a.user_id])
    picked = list(accounts.values())[:20]
    open_with = dict(Ticket.objects.filter(opened_by=viewer, closed_at__isnull=True, target__in=[a.user_id for a, _ in picked])
                     .values_list("target_id", "pk"))
    return [{**_user_out(a.user), "matched": alt, "discord": a.username, "on_server": a.on_server,
             "open_ticket": open_with.get(a.user_id)} for a, alt in picked]


# --- opening -------------------------------------------------------------------------------------------------------


def _channel_name(ticket: Ticket) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", ticket.target_name.lower()).strip("-")
    return f"ticket-{ticket.pk}-{slug}"[:100].rstrip("-")


def _on_server(api, s, discord_id: str, who: str) -> None:
    if api.member(s.bot_token, s.guild_id, discord_id) is None:
        raise TicketError(f"{who} on the Discord server", 409)


def open_ticket(viewer, target_id: int, subject: str, message: str = "", request=None) -> Ticket:
    from conduit_discord.models import DiscordAccount

    subject = " ".join(subject.split())
    message = message.strip()
    if not subject:
        raise TicketError("Give the ticket a subject")
    if len(subject) > SUBJECT_MAX:
        raise TicketError(f"Keep the subject to {SUBJECT_MAX} characters")
    if len(message) > MESSAGE_MAX:
        raise TicketError(f"Keep the message to {MESSAGE_MAX} characters")
    target = get_user_model().objects.filter(pk=target_id).select_related("main_character").first()
    if target is None:
        raise TicketError("That member no longer exists", 404)
    if target == viewer:
        raise TicketError("You can't open a ticket with yourself")
    theirs = DiscordAccount.objects.filter(user=target).first()
    if theirs is None:
        raise TicketError(f"{_name(target)} hasn't linked Discord", 409)
    mine = DiscordAccount.objects.filter(user=viewer).first()
    if mine is None:
        raise TicketError("Link your own Discord account first (on the Discord page)", 409)
    api, s = _discord()
    try:
        _on_server(api, s, theirs.discord_id, f"{_name(target)} isn't")
        _on_server(api, s, mine.discord_id, "You aren't")
        bot_id = api.bot_user(s.bot_token)["id"]
    except api.DiscordError as exc:
        raise _explain(exc) from None
    try:
        # Reserved first, so two clicks can't make two channels.
        with transaction.atomic():
            ticket = Ticket.objects.create(subject=subject, opened_by=viewer, opened_by_name=_name(viewer), target=target,
                                           target_name=_name(target), target_discord_id=theirs.discord_id, guild_id=s.guild_id)
    except IntegrityError:
        raise TicketError(f"You already have an open ticket with {_name(target)}", 409) from None
    try:
        _make_channel(api, s, ticket, bot_id, mine.discord_id, message)
    except api.DiscordError as exc:
        ticket.delete()
        raise _explain(exc) from None
    record("tickets.opened", f"opened a Discord ticket with {ticket.target_name}: {subject}", request=request, actor=viewer,
           target=target, details={"ticket": ticket.pk, "channel": ticket.channel_id})
    notify(target, f"Discord ticket: {subject}", f"{ticket.opened_by_name} opened a private channel with you on Discord.",
           link=channel_url(ticket) or "", category="p.tickets")
    return ticket


def _make_channel(api, s, ticket: Ticket, bot_id: str, opener_discord_id: str, message: str) -> None:
    settings = TicketSettings.load()
    allow = str(IN_TICKET)
    overwrites = [
        {"id": s.guild_id, "type": ROLE, "deny": str(VIEW_CHANNEL)},  # @everyone has the server's id
        {"id": bot_id, "type": MEMBER, "allow": allow},
        {"id": ticket.target_discord_id, "type": MEMBER, "allow": allow},
        {"id": opener_discord_id, "type": MEMBER, "allow": allow},
    ]
    if settings.staff_role_id:
        overwrites.append({"id": settings.staff_role_id, "type": ROLE, "allow": allow})
    body = {"name": _channel_name(ticket), "type": GUILD_TEXT, "topic": ticket.subject, "permission_overwrites": overwrites}
    if settings.category_id:
        body["parent_id"] = settings.category_id
    channel = api.call("POST", f"/guilds/{s.guild_id}/channels", bot_token=s.bot_token, json=body)
    try:
        text = f"<@{ticket.target_discord_id}>, <@{opener_discord_id}> opened this ticket.\n**{ticket.subject}**"
        if message:
            text += f"\n\n{message}"
        # Only the two people may be pinged, whatever the subject or message says.
        api.call("POST", f"/channels/{channel['id']}/messages", bot_token=s.bot_token, json={
            "content": text, "allowed_mentions": {"users": [ticket.target_discord_id, opener_discord_id]}})
    except api.DiscordError:
        try:
            api.call("DELETE", f"/channels/{channel['id']}", bot_token=s.bot_token)
        except api.DiscordError:
            log.warning("Couldn't remove channel %s after its first message failed", channel["id"])
        raise
    ticket.channel_id = channel["id"]
    ticket.save(update_fields=["channel_id"])


# --- closing -------------------------------------------------------------------------------------------------------


def close(ticket: Ticket, viewer, request=None) -> Ticket:
    """Take the member out of the channel. It stays for whoever opened it and the staff role."""
    if ticket.closed_at is not None:
        raise TicketError("This ticket is already closed")
    if ticket.channel_id and not ticket.channel_gone:
        api, s = _discord()
        try:
            api.call("PUT", f"/channels/{ticket.channel_id}/permissions/{ticket.target_discord_id}", bot_token=s.bot_token,
                     json={"type": MEMBER, "allow": "0", "deny": str(VIEW_CHANNEL)})
        except api.DiscordError as exc:
            if exc.status != 404:
                raise _explain(exc) from None
            ticket.channel_gone = True  # someone deleted it on Discord
        else:
            try:
                api.call("POST", f"/channels/{ticket.channel_id}/messages", bot_token=s.bot_token, json={
                    "content": f"Ticket closed by {_name(viewer)}. {ticket.target_name} can no longer see this channel.",
                    "allowed_mentions": {"parse": []}})
            except api.DiscordError as exc:
                log.warning("Couldn't say ticket %s closed: %s", ticket.pk, exc)
    ticket.closed_at = timezone.now()
    ticket.closed_by = viewer
    ticket.save(update_fields=["closed_at", "closed_by", "channel_gone"])
    record("tickets.closed", f"closed the Discord ticket with {ticket.target_name}: {ticket.subject}", request=request, actor=viewer,
           target=ticket.target, details={"ticket": ticket.pk})
    if ticket.target_id:
        notify(ticket.target_id, f"Discord ticket closed: {ticket.subject}", f"{_name(viewer)} closed your ticket.", category="p.tickets")
    return ticket


def may_delete(ticket: Ticket, viewer) -> bool:
    return ticket.opened_by_id == viewer.pk or viewer.has_perm(MANAGE_PERM)


def delete_channel(ticket: Ticket, viewer, request=None) -> Ticket:
    """Delete a closed ticket's channel for good. The ticket stays listed."""
    if not may_delete(ticket, viewer):
        raise TicketError("Only whoever opened the ticket or a tickets manager can delete its channel", 403)
    if ticket.closed_at is None:
        raise TicketError("Close the ticket first")
    if ticket.channel_id and not ticket.channel_gone:
        api, s = _discord()
        try:
            api.call("DELETE", f"/channels/{ticket.channel_id}", bot_token=s.bot_token)
        except api.DiscordError as exc:
            if exc.status != 404:
                raise _explain(exc) from None
    ticket.channel_gone = True
    ticket.save(update_fields=["channel_gone"])
    record("tickets.channel_deleted", f"deleted the Discord channel of the ticket with {ticket.target_name}: {ticket.subject}",
           request=request, actor=viewer, target=ticket.target, details={"ticket": ticket.pk})
    return ticket


# --- settings ------------------------------------------------------------------------------------------------------


def _bits(value) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def invite_url(api, s) -> str | None:
    """Inviting the bot again gives it what tickets need, on top of what the Discord plugin asks for."""
    if not s.client_id:
        return None
    return api.AUTHORIZE_URL + "?" + urlencode({
        "client_id": s.client_id, "scope": "bot", "permissions": str(api.BOT_PERMISSIONS | sum(bit for bit, _ in BOT_NEEDS)),
        "guild_id": s.guild_id, "disable_guild_select": "true",
    })


def settings_out() -> dict:
    """The settings, the server's roles to pick from, and anything that will stop tickets working."""
    settings = TicketSettings.load()
    out = {"category_id": settings.category_id, "staff_role_id": settings.staff_role_id, "roles": [], "invite_url": None, "problems": []}
    try:
        api, s = _discord()
    except TicketError as exc:
        out["problems"].append(str(exc))
        return out
    out["invite_url"] = invite_url(api, s)
    try:
        roles = api.roles(s.bot_token, s.guild_id)
        bot_member = api.member(s.bot_token, s.guild_id, api.bot_user(s.bot_token)["id"])
    except api.DiscordError as exc:
        out["problems"].append(str(_explain(exc)))
        return out
    by_id = {r["id"]: r for r in roles}
    out["roles"] = [{"id": r["id"], "name": r["name"]} for r in sorted(roles, key=lambda r: -r["position"])
                    if r["id"] != s.guild_id and not r.get("managed")]
    if bot_member is None:
        out["problems"].append("The bot isn't on the server. Invite it with the link below.")
        return out
    perms = _bits(by_id.get(s.guild_id, {}).get("permissions"))
    for rid in bot_member.get("roles", []):
        perms |= _bits(by_id.get(rid, {}).get("permissions"))
    if not perms & api.ADMINISTRATOR:
        for bit, label in (*BOT_NEEDS, (api.MANAGE_ROLES, "Manage Roles")):
            if not perms & bit:
                out["problems"].append(f"The bot's role is missing the {label} permission.")
    if settings.staff_role_id and settings.staff_role_id not in by_id:
        out["problems"].append("The staff role no longer exists on the server; pick another.")
    return out


def save_settings(category_id: str, staff_role_id: str, viewer, request=None) -> TicketSettings:
    category_id, staff_role_id = category_id.strip(), staff_role_id.strip()
    if not all(v.isdigit() for v in (category_id, staff_role_id) if v):
        raise TicketError("Ids are numbers: with Developer Mode on, right-click the category and Copy Channel ID")
    api, s = _discord()
    try:
        if category_id:
            try:
                channel = api.call("GET", f"/channels/{category_id}", bot_token=s.bot_token)
            except api.DiscordError as exc:
                if exc.status == 404 or exc.code == UNKNOWN_CHANNEL:
                    raise TicketError("There's no such category on the server") from None
                raise
            if channel.get("type") != GUILD_CATEGORY or channel.get("guild_id") != s.guild_id:
                raise TicketError("That id isn't a category on this server")
        if staff_role_id and staff_role_id not in {r["id"] for r in api.roles(s.bot_token, s.guild_id)}:
            raise TicketError("There's no such role on the server")
    except api.DiscordError as exc:
        raise _explain(exc) from None
    settings = TicketSettings.load()
    settings.category_id, settings.staff_role_id = category_id, staff_role_id
    settings.save()
    record("tickets.settings", "changed the Discord ticket settings", request=request, actor=viewer,
           details={"category": category_id, "staff_role": staff_role_id})
    return settings
