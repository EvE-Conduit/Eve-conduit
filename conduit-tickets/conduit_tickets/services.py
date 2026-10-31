"""Discord Tickets: whoever opens a ticket reaches the member they pick through a private channel on the Discord
server (with the Discord roles they choose), an EVE mail or both.

Everything on Discord goes through the Discord plugin's bot and linked accounts, so for a channel both people must have
linked Discord and be on the server. Mail goes from the opener's main character to the member's main, and can't be taken
back, so it's sent last: if the channel fails nothing has gone out, and if the mail of a "both" ticket fails the channel
stays and the ticket says so. Closing takes the member out of the channel straight away. A background task, because a long channel takes a while,
then copies its messages here as a transcript and only then removes the channel from Discord; both are tried again until
they work, and the channel is never removed before its transcript is complete. Attached files are copied too, into the
database, up to a size limit. Anyone can attach anything, so only plain image types are ever shown in the browser.
Opening, closing, removing a channel and reading a transcript go in the audit log.

Search by alt only reaches characters the viewer's sheet permissions cover, so tickets don't reveal whose alt is whose.
"""

from __future__ import annotations

import html
import logging
import re
from datetime import UTC, datetime
from urllib.parse import urlencode, urlsplit

import httpx
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Prefetch, Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.notify.services import notify
from conduit.sheet.access import viewable_characters

from .models import Ticket, TicketAttachment, TicketMessage, TicketSettings

log = logging.getLogger(__name__)

OPEN_PERM = "tickets.open_tickets"
MANAGE_PERM = "tickets.manage_tickets"
SUBJECT_MAX, MESSAGE_MAX = 100, 1500
MAIL_SCOPE = "esi-mail.send_mail.v1"

GUILD_TEXT, GUILD_CATEGORY = 0, 4
ROLE, MEMBER = 0, 1
UNKNOWN_CHANNEL = 10003
#: Application flags: without one of these, Discord blanks the text of messages the bot reads.
MESSAGE_CONTENT_INTENT = (1 << 18) | (1 << 19)
PAGE_SIZE = 100
#: Largest attached file kept, and most kept per ticket. They live in the database and so in every backup.
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_TICKET_BYTES = 200 * 1024 * 1024
#: Where Discord keeps attached files. Nothing is fetched from anywhere else, whatever a message says.
CDN_HOSTS = {"cdn.discordapp.com", "media.discordapp.net"}
#: Shown in the browser. Not SVG, which can run scripts. Everything else downloads as plain bytes.
INLINE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
#: Ordinary messages and replies. Others are "pinned a message" and the like.
TEXT_MESSAGE_TYPES = {0, 19}
HIDDEN_TEXT = ("Discord hid the messages' text from the bot. Turn on Message Content Intent on the Bot page of your "
               "Discord application; the transcript is then saved within 15 minutes and the channel removed.")

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


def ticket_out(t: Ticket) -> dict:
    return {
        "id": t.pk,
        "via": t.via,
        "subject": t.subject,
        "mail_sent": t.mail_id is not None,
        "mail_error": t.mail_error,
        "archive_state": t.archive_state,
        "archive_error": t.archive_error,
        "target": _user_out(t.target),
        "target_name": t.target_name,
        "roles": t.roles,
        "panel": t.panel_label,
        "opened_by": t.opened_by_name,
        "opened_at": t.opened_at.isoformat(),
        "closed_at": t.closed_at.isoformat() if t.closed_at else None,
        "closed_by": _name(t.closed_by) if t.closed_by else None,
        "url": channel_url(t),
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
    """Members with a main character, by main, Discord name, or an alt the viewer may see. Those without a linked
    Discord account can still get a mail."""
    q = q.strip()
    if len(q) < 2:
        return []
    base = get_user_model().objects.filter(is_active=True, main_character__isnull=False).exclude(pk=viewer.pk).select_related(
        "main_character__corporation", "discord")
    users = {u.pk: (u, None) for u in base.filter(Q(main_character__name__icontains=q) | Q(discord__username__icontains=q))[:20]}
    alts = viewable_characters(viewer).filter(name__icontains=q).exclude(user=viewer)[:50]
    missing = {c.user_id: c.name for c in alts if c.user_id not in users}
    for u in base.filter(pk__in=missing):
        users[u.pk] = (u, missing[u.pk])
    picked = list(users.values())[:20]
    open_with = dict(Ticket.objects.filter(opened_by=viewer, closed_at__isnull=True, target__in=[u.pk for u, _ in picked])
                     .values_list("target_id", "pk"))
    out = []
    for u, alt in picked:
        account = getattr(u, "discord", None)
        out.append({**_user_out(u), "matched": alt, "discord": account.username if account else None,
                    "on_server": bool(account and account.on_server), "open_ticket": open_with.get(u.pk)})
    return out


def mail_sender(viewer) -> dict:
    """The character the viewer's mail goes from, and why it can't if it can't."""
    main = viewer.main_character
    if main is None:
        return {"name": None, "can_mail": False, "problem": "Pick a main character first"}
    token = getattr(main, "token", None)
    if token is None or not token.has_scopes(MAIL_SCOPE):
        return {"name": main.name, "can_mail": False,
                "problem": f"{main.name} hasn't allowed sending mail; log in with it again (Characters → Add character)"}
    return {"name": main.name, "can_mail": True, "problem": ""}


# --- opening -------------------------------------------------------------------------------------------------------


def _eve_time(when: datetime) -> str:
    return when.astimezone(UTC).strftime("%d %b %Y %H:%M EVE time")


def _discord_time(when: datetime) -> str:
    """A date and time Discord shows in each reader's own time zone."""
    return f"<t:{int(when.timestamp())}:F>"


def _channel_name(ticket: Ticket) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", ticket.target_name.lower()).strip("-")
    return f"ticket-{ticket.pk}-{slug}"[:100].rstrip("-")


def _on_server(api, s, discord_id: str, who: str) -> None:
    if api.member(s.bot_token, s.guild_id, discord_id) is None:
        raise TicketError(f"{who} on the Discord server", 409)


def _pick_roles(api, s, role_ids: list[str] | None) -> list[dict]:
    """The roles that will see the channel, checked against the server. ``None`` means the defaults from Settings,
    leaving out any since deleted on Discord. @everyone is never one of them, so a ticket can't be made public."""
    known = {r["id"]: r["name"] for r in pickable_roles(api.roles(s.bot_token, s.guild_id))}
    if role_ids is None:
        return [{"id": i, "name": known[i]} for i in TicketSettings.load().default_role_ids if i in known]
    if unknown := [i for i in role_ids if i not in known]:
        raise TicketError(f"That Discord role isn't available any more ({unknown[0]}); pick again")
    return [{"id": i, "name": known[i]} for i in dict.fromkeys(role_ids)]


def open_ticket(viewer, target_id: int, subject: str, message: str = "", via: str = Ticket.DISCORD, role_ids: list[str] | None = None,
                request=None) -> Ticket:
    from conduit_discord.models import DiscordAccount

    subject = " ".join(subject.split())
    message = message.strip()
    if via not in {v for v, _ in Ticket.VIA_CHOICES}:
        raise TicketError("Choose Discord, EVE mail or both")
    if not subject:
        raise TicketError("Give the ticket a subject")
    if len(subject) > SUBJECT_MAX:
        raise TicketError(f"Keep the subject to {SUBJECT_MAX} characters")
    if len(message) > MESSAGE_MAX:
        raise TicketError(f"Keep the message to {MESSAGE_MAX} characters")
    if via == Ticket.MAIL and not message:
        raise TicketError("Write the mail's message")
    target = get_user_model().objects.filter(pk=target_id).select_related("main_character").first()
    if target is None:
        raise TicketError("That member no longer exists", 404)
    if target == viewer:
        raise TicketError("You can't open a ticket with yourself")
    if via != Ticket.DISCORD:
        if target.main_character is None:
            raise TicketError(f"{_name(target)} has no main character to mail")
        sender = mail_sender(viewer)
        if not sender["can_mail"]:
            raise TicketError(sender["problem"], 409)
    theirs = mine = bot_id = api = s = None
    roles = []
    if via != Ticket.MAIL:
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
            roles = _pick_roles(api, s, role_ids)
        except api.DiscordError as exc:
            raise _explain(exc) from None
    try:
        # Reserved first, so two clicks can't make two channels or send two mails.
        with transaction.atomic():
            ticket = Ticket.objects.create(via=via, subject=subject, opened_by=viewer, opened_by_name=_name(viewer), target=target,
                                           target_name=_name(target), target_discord_id=theirs.discord_id if theirs else "",
                                           guild_id=s.guild_id if s else "", message=message if via != Ticket.DISCORD else "", roles=roles)
    except IntegrityError:
        raise TicketError(f"You already have an open ticket with {_name(target)}", 409) from None
    if via != Ticket.MAIL:
        try:
            _make_channel(api, s, ticket, bot_id, mine.discord_id, message)
        except api.DiscordError as exc:
            ticket.delete()
            raise _explain(exc) from None
    if via != Ticket.DISCORD:
        try:
            _send_mail(viewer, target, ticket, message)
        except TicketError as exc:
            if via == Ticket.MAIL:
                ticket.delete()
                raise
            ticket.mail_error = str(exc)[:300]
            ticket.save(update_fields=["mail_error"])
    where = {Ticket.DISCORD: "a Discord ticket", Ticket.MAIL: "an EVE mail ticket", Ticket.BOTH: "a Discord and EVE mail ticket"}[via]
    record("tickets.opened", f"opened {where} with {ticket.target_name}: {subject}", request=request, actor=viewer, target=target,
           details={"ticket": ticket.pk, "via": via, "channel": ticket.channel_id, "mail": ticket.mail_id, "mail_error": ticket.mail_error})
    if via == Ticket.MAIL:
        notify(target, f"EVE mail: {subject}", f"{ticket.opened_by_name} sent you an EVE mail.", category="p.tickets")
    else:
        notify(target, f"Discord ticket: {subject}", f"{ticket.opened_by_name} opened a private channel with you on Discord.",
               link=channel_url(ticket) or "", category="p.tickets")
    return ticket


def _send_mail(viewer, target, ticket: Ticket, message: str) -> None:
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid

    sender = viewer.main_character
    # A mail's body is the game's own markup, so what was typed is escaped and only line breaks and the link are added.
    parts = [html.escape(message).replace("\n", "<br>")] if message else []
    url = channel_url(ticket)
    if url:
        parts.append(f'Private Discord channel: <a href="{html.escape(url)}">{html.escape(url)}</a>')
    parts.append(f"Ticket opened {_eve_time(ticket.opened_at)}")
    payload = {"approved_cost": 0, "body": "<br><br>".join(parts), "subject": ticket.subject,
               "recipients": [{"recipient_id": target.main_character_id, "recipient_type": "character"}]}
    try:
        data = esi().post(f"/characters/{sender.pk}/mail", payload, character=sender).data
    except TokenInvalid:
        raise TicketError(f"{sender.name}'s login has stopped working; log in with it again", 409) from None
    except EsiBackoff:
        raise TicketError("ESI is busy; try again in a minute", 503) from None
    except EsiError as exc:
        if exc.status == 520:
            raise TicketError(f"The game refused the mail: {_name(target)} may charge to be mailed, or too many mails went out recently", 502) from None
        raise TicketError(f"ESI didn't take the mail ({exc.status}); try again in a moment", 502) from None
    ticket.mail_id = int(data) if isinstance(data, int) else None
    ticket.save(update_fields=["mail_id"])


def close_button(ticket: Ticket) -> list[dict]:
    return [{"type": 1, "components": [{"type": 2, "style": 4, "label": "Close ticket", "custom_id": f"tickets:close:{ticket.pk}"}]}]


def _make_channel(api, s, ticket: Ticket, bot_id: str, opener_discord_id: str, message: str, category_id: str | None = None) -> None:
    allow = str(IN_TICKET)
    people = list(dict.fromkeys([ticket.target_discord_id, opener_discord_id]))  # one person when opened from a panel
    overwrites = [
        {"id": s.guild_id, "type": ROLE, "deny": str(VIEW_CHANNEL)},  # @everyone has the server's id
        {"id": bot_id, "type": MEMBER, "allow": allow},
    ]
    overwrites += [{"id": i, "type": MEMBER, "allow": allow} for i in people]
    overwrites += [{"id": r["id"], "type": ROLE, "allow": allow} for r in ticket.roles]
    category_id = category_id or TicketSettings.load().category_id
    body = {"name": _channel_name(ticket), "type": GUILD_TEXT, "topic": ticket.subject, "permission_overwrites": overwrites}
    if category_id:
        body["parent_id"] = category_id
    channel = api.call("POST", f"/guilds/{s.guild_id}/channels", bot_token=s.bot_token, json=body)
    try:
        # Only the people in the ticket may be pinged, whatever the subject or message says. Nobody picked the staff on
        # a panel ticket, so their roles are pinged too; Staff opening a ticket are already there.
        mentions = {"users": people}
        if ticket.panel_label:
            mentions["roles"] = [r["id"] for r in ticket.roles]
            pings = " ".join(f"<@&{r['id']}>" for r in ticket.roles)
            text = f"{pings}\n<@{opener_discord_id}> opened this ticket {_discord_time(ticket.opened_at)} ({ticket.panel_label}).\n**{ticket.subject}**"
        else:
            text = f"<@{ticket.target_discord_id}>, <@{opener_discord_id}> opened this ticket {_discord_time(ticket.opened_at)}.\n**{ticket.subject}**"
        if message:
            text += f"\n\n{message}"
        api.call("POST", f"/channels/{channel['id']}/messages", bot_token=s.bot_token, json={
            "content": text, "allowed_mentions": mentions, "components": close_button(ticket)})
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
    """Take the member out of the channel. The background task then saves the transcript and removes the channel."""
    if ticket.closed_at is not None:
        raise TicketError("This ticket is already closed")
    if ticket.channel_id and not ticket.channel_gone:
        api, s = _discord()
        ticket.archive_state = Ticket.ARCHIVE_PENDING
        try:
            api.call("PUT", f"/channels/{ticket.channel_id}/permissions/{ticket.target_discord_id}", bot_token=s.bot_token,
                     json={"type": MEMBER, "allow": "0", "deny": str(VIEW_CHANNEL)})
        except api.DiscordError as exc:
            if exc.status != 404:
                raise _explain(exc) from None
            ticket.channel_gone = True  # someone deleted it on Discord
            ticket.archive_state = Ticket.ARCHIVE_LOST
        else:
            try:
                api.call("POST", f"/channels/{ticket.channel_id}/messages", bot_token=s.bot_token, json={
                    "content": f"Ticket closed by {_name(viewer)} {_discord_time(timezone.now())}. {ticket.target_name} can no longer see this channel, and it's removed once its transcript is saved.",
                    "allowed_mentions": {"parse": []}})
            except api.DiscordError as exc:
                log.warning("Couldn't say ticket %s closed: %s", ticket.pk, exc)
    ticket.closed_at = timezone.now()
    ticket.closed_by = viewer
    ticket.save(update_fields=["closed_at", "closed_by", "channel_gone", "archive_state"])
    if ticket.archive_state == Ticket.ARCHIVE_PENDING:
        transaction.on_commit(lambda: _queue_archive(ticket.pk))
    record("tickets.closed", f"closed the Discord ticket with {ticket.target_name}: {ticket.subject}", request=request, actor=viewer,
           target=ticket.target, details={"ticket": ticket.pk})
    if ticket.target_id and ticket.target_id != viewer.pk:
        notify(ticket.target_id, f"Discord ticket closed: {ticket.subject}", f"{_name(viewer)} closed your ticket.", category="p.tickets")
    return ticket


# --- transcripts ---------------------------------------------------------------------------------------------------


def _queue_archive(ticket_id: int) -> None:
    from .tasks import archive_ticket

    try:
        archive_ticket.delay(ticket_id)
    except Exception:  # the ticket is closed either way, and archive_pending picks it up
        log.exception("Couldn't queue the transcript of ticket %s", ticket_id)


def _unfinished():
    """Closed tickets whose transcript isn't saved yet, or whose channel is still to be removed."""
    return Ticket.objects.filter(Q(archive_state=Ticket.ARCHIVE_PENDING) | Q(archive_state=Ticket.ARCHIVE_DONE, channel_gone=False))


def pending_archives() -> list[int]:
    return list(_unfinished().values_list("pk", flat=True))


def archive_in_background(ticket_id: int) -> None:
    """Save a transcript and remove the channel, from a background task, where waiting out Discord's rate limits is
    allowed. The channel goes only once the transcript is complete."""
    ticket = _unfinished().filter(pk=ticket_id).first()
    if ticket is None:
        return
    try:
        api, s = _discord()
    except TicketError as exc:
        ticket.archive_error = str(exc)[:300]
        ticket.save(update_fields=["archive_error"])
        return
    with api.allow_waiting():
        try:
            archive(ticket)
            if ticket.archive_state == Ticket.ARCHIVE_DONE and not ticket.channel_gone:
                _remove_channel(api, s, ticket)
        except api.DiscordError as exc:
            log.warning("Couldn't finish closing ticket %s: %s", ticket.pk, exc)
            ticket.archive_error = str(_explain(exc))[:300]
            ticket.save(update_fields=["archive_error"])


def _remove_channel(api, s, ticket: Ticket) -> None:
    try:
        api.call("DELETE", f"/channels/{ticket.channel_id}", bot_token=s.bot_token)
    except api.DiscordError as exc:
        if exc.status != 404:
            raise
    ticket.channel_gone = True
    ticket.archive_error = ""
    ticket.save(update_fields=["channel_gone", "archive_error"])
    record("tickets.channel_deleted", f"removed the Discord channel of the ticket with {ticket.target_name}: {ticket.subject}",
           actor=ticket.closed_by, target=ticket.target, details={"ticket": ticket.pk})


def archive(ticket: Ticket) -> None:
    """Copy the channel's messages. A finished transcript only fetches what's new; an unfinished one starts over, which
    also fills in text Discord was hiding. Raises DiscordError if it can't finish."""
    api, s = _discord()
    done_before = ticket.archive_state == Ticket.ARCHIVE_DONE
    last = ticket.messages.order_by("-sent_at").values_list("message_id", flat=True).first() if done_before else None
    after, hidden = last or "0", False
    while True:
        try:
            page = api.call("GET", f"/channels/{ticket.channel_id}/messages?limit={PAGE_SIZE}&after={after}", bot_token=s.bot_token)
        except api.DiscordError as exc:
            if exc.status != 404:
                raise
            # Deleted on Discord. What was already saved stays.
            ticket.channel_gone = True
            ticket.archive_state = Ticket.ARCHIVE_DONE if done_before else Ticket.ARCHIVE_LOST
            ticket.archive_error = ""
            ticket.save(update_fields=["channel_gone", "archive_state", "archive_error"])
            return
        if not page:
            break
        hidden = _store_messages(ticket, page) or hidden
        after = str(max(int(m["id"]) for m in page))
        if len(page) < PAGE_SIZE:
            break
    ticket.archive_state = Ticket.ARCHIVE_PENDING if hidden else Ticket.ARCHIVE_DONE
    ticket.archive_error = HIDDEN_TEXT[:300] if hidden else ""
    ticket.save(update_fields=["archive_state", "archive_error"])


def _store_messages(ticket: Ticket, page: list[dict]) -> bool:
    """Save a page of messages. True if Discord hid the text of any of them."""
    from conduit_discord.models import DiscordAccount

    wanted = [m for m in page if m.get("type", 0) in TEXT_MESSAGE_TYPES]
    ids = {m["author"]["id"] for m in wanted} | {u["id"] for m in wanted for u in m.get("mentions", [])}
    names = {a.discord_id: _name(a.user) for a in DiscordAccount.objects.filter(discord_id__in=ids).select_related("user__main_character")}
    hidden = False
    rows = []
    for m in wanted:
        author = m["author"]
        content = m.get("content") or ""
        for u in m.get("mentions", []):
            label = names.get(u["id"]) or u.get("global_name") or u.get("username") or u["id"]
            content = content.replace(f"<@{u['id']}>", f"@{label}").replace(f"<@!{u['id']}>", f"@{label}")
        for r in ticket.roles:
            content = content.replace(f"<@&{r['id']}>", f"@{r['name']}")
        content = re.sub(r"<t:(\d+)(?::\w)?>", lambda t: _eve_time(datetime.fromtimestamp(int(t[1]), UTC)), content)
        embeds = [{"title": e.get("title", ""), "description": e.get("description", "")} for e in m.get("embeds", [])
                  if e.get("title") or e.get("description")]
        if not (content or m.get("attachments") or m.get("embeds") or m.get("sticker_items") or m.get("poll") or author.get("bot")):
            hidden = True
        rows.append(TicketMessage(
            ticket=ticket, message_id=m["id"], author_id=author["id"], is_bot=bool(author.get("bot")),
            author_name=(names.get(author["id"]) or author.get("global_name") or author.get("username") or "Unknown")[:100],
            content=content, embeds=embeds, sent_at=parse_datetime(m["timestamp"]),
            edited_at=parse_datetime(m["edited_timestamp"]) if m.get("edited_timestamp") else None,
        ))
    TicketMessage.objects.bulk_create(rows, update_conflicts=True, unique_fields=["ticket", "message_id"],
                                      update_fields=["author_name", "is_bot", "content", "embeds", "edited_at"])
    pks = dict(ticket.messages.filter(message_id__in=[m["id"] for m in wanted]).values_list("message_id", "pk"))
    for m in wanted:
        for a in m.get("attachments", []):
            _store_attachment(ticket, pks[m["id"]], a)
    return hidden


def _store_attachment(ticket: Ticket, message_pk: int, a: dict) -> None:
    """Copy one file. Raises DiscordError if it's worth trying again, which keeps the channel until it's done."""
    if TicketAttachment.objects.filter(message_id=message_pk, attachment_id=a["id"]).exists():
        return
    used = TicketAttachment.objects.filter(message__ticket=ticket).aggregate(total=Sum("size"))["total"] or 0
    room = min(MAX_FILE_BYTES, MAX_TICKET_BYTES - used)
    state, content = TicketAttachment.TOO_BIG, None
    if a.get("size", 0) <= room:
        state, content = _download(a.get("url") or "", room)
    TicketAttachment.objects.create(message_id=message_pk, attachment_id=a["id"], name=(a.get("filename") or "file")[:255],
                                    content_type=(a.get("content_type") or "")[:100], state=state, content=content,
                                    size=len(content) if content is not None else 0)


def _download(url: str, limit: int) -> tuple[str, bytes | None]:
    api, _s = _discord()
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.hostname not in CDN_HOSTS:
        return TicketAttachment.UNAVAILABLE, None
    chunks, total = [], 0
    try:
        # The Discord plugin's client: no bot token goes to the CDN, and it doesn't follow redirects.
        with api._client() as client, client.stream("GET", url) as resp:
            if resp.status_code in (403, 404):  # the links are fresh from Discord, so this one's gone for good
                return TicketAttachment.UNAVAILABLE, None
            if resp.status_code != 200:
                raise api.DiscordError(resp.status_code, f"Couldn't copy an attached file (HTTP {resp.status_code}); trying again soon")
            for chunk in resp.iter_bytes():
                total += len(chunk)
                if total > limit:  # Discord's stated size is only a hint
                    return TicketAttachment.TOO_BIG, None
                chunks.append(chunk)
    except httpx.HTTPError as exc:
        raise api.DiscordError(0, f"Couldn't copy an attached file ({exc.__class__.__name__}); trying again soon") from None
    return TicketAttachment.SAVED, b"".join(chunks)


def serve_type(a: TicketAttachment) -> tuple[str, bool]:
    """What to serve a file as: its type, and whether a browser may show it rather than download it."""
    kind = a.content_type.split(";")[0].strip().lower()
    return (kind, True) if kind in INLINE_TYPES else ("application/octet-stream", False)


def messages_qs(ticket: Ticket):
    return ticket.messages.prefetch_related(Prefetch("files", queryset=TicketAttachment.objects.defer("content")))


def message_out(m: TicketMessage) -> dict:
    files = [{"id": a.pk, "name": a.name, "size": a.size, "state": a.state, "image": serve_type(a)[1]} for a in m.files.all()]
    return {"id": m.pk, "author": m.author_name, "is_bot": m.is_bot, "content": m.content, "attachments": files,
            "embeds": m.embeds, "sent_at": m.sent_at.isoformat(), "edited_at": m.edited_at.isoformat() if m.edited_at else None}


def read_ticket(ticket: Ticket, viewer, request=None) -> dict:
    """A ticket with its mail, for its transcript page. Tickets can be private, so reading one is audited."""
    record("tickets.transcript_read", f"read the ticket with {ticket.target_name}: {ticket.subject}", request=request, actor=viewer,
           target=ticket.target, details={"ticket": ticket.pk})
    return {**ticket_out(ticket), "message": ticket.message, "mine": can_read_as_owner(ticket, viewer)}


def can_read_as_owner(ticket: Ticket, viewer) -> bool:
    """People who opened a ticket from a panel can read it. Tickets staff opened with a member stay with staff."""
    return bool(ticket.panel_label) and ticket.target_id == viewer.pk


def can_read(ticket: Ticket, viewer) -> bool:
    return viewer.has_perm(OPEN_PERM) or can_read_as_owner(ticket, viewer)


# --- settings ------------------------------------------------------------------------------------------------------


def application_info(api, s) -> dict:
    """The bot's application. Its public key is kept, to check that clicks on panels really come from Discord."""
    application = api.call("GET", "/applications/@me", bot_token=s.bot_token)
    settings = TicketSettings.load()
    key = application.get("verify_key") or ""
    if key != settings.public_key:
        settings.public_key = key
        settings.save(update_fields=["public_key"])
    return application


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


def pickable_roles(roles: list[dict]) -> list[dict]:
    """Roles a ticket can be shown to, top of the server first. Not @everyone (position 0), nor bots' own roles."""
    return sorted((r for r in roles if r.get("position") and not r.get("managed")), key=lambda r: -r["position"])


def _role_out(r: dict) -> dict:
    return {"id": r["id"], "name": r["name"], "color": r.get("color", 0)}


def roles_out() -> dict:
    """The roles to pick from when opening a ticket, with those ticked by default."""
    try:
        api, s = _discord()
    except TicketError as exc:
        return {"roles": [], "defaults": [], "error": str(exc)}
    try:
        roles = [_role_out(r) for r in pickable_roles(api.roles(s.bot_token, s.guild_id))]
    except api.DiscordError as exc:
        return {"roles": [], "defaults": [], "error": str(_explain(exc))}
    known = {r["id"] for r in roles}
    return {"roles": roles, "defaults": [i for i in TicketSettings.load().default_role_ids if i in known], "error": ""}


def settings_out() -> dict:
    """The settings, the server's roles to pick from, and anything that will stop tickets working."""
    settings = TicketSettings.load()
    out = {"category_id": settings.category_id, "default_role_ids": settings.default_role_ids, "roles": [], "invite_url": None, "problems": []}
    try:
        api, s = _discord()
    except TicketError as exc:
        out["problems"].append(str(exc))
        return out
    out["invite_url"] = invite_url(api, s)
    try:
        roles = api.roles(s.bot_token, s.guild_id)
        bot_member = api.member(s.bot_token, s.guild_id, api.bot_user(s.bot_token)["id"])
        application = application_info(api, s)
    except api.DiscordError as exc:
        out["problems"].append(str(_explain(exc)))
        return out
    if not _bits(application.get("flags")) & MESSAGE_CONTENT_INTENT:
        out["problems"].append("Transcripts will be blank: turn on Message Content Intent on the Bot page of your Discord application.")
    by_id = {r["id"]: r for r in roles}
    out["roles"] = [_role_out(r) for r in pickable_roles(roles)]
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
    if any(i not in by_id for i in settings.default_role_ids):
        out["problems"].append("A default role no longer exists on the server; it's left off new tickets. Save to clear it.")
    return out


def save_settings(category_id: str, role_ids: list[str], viewer, request=None) -> TicketSettings:
    category_id = category_id.strip()
    if category_id and not category_id.isdigit():
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
        pickable = {r["id"] for r in pickable_roles(api.roles(s.bot_token, s.guild_id))}
        if any(i not in pickable for i in role_ids):
            raise TicketError("There's no such role on the server")
    except api.DiscordError as exc:
        raise _explain(exc) from None
    settings = TicketSettings.load()
    settings.category_id, settings.default_role_ids = category_id, list(dict.fromkeys(role_ids))
    settings.save()
    record("tickets.settings", "changed the Discord ticket settings", request=request, actor=viewer,
           details={"category": category_id, "default_roles": settings.default_role_ids})
    return settings
