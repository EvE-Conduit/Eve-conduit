"""Panels: a message the bot posts in a channel, whose buttons let people open a ticket themselves.

Discord posts each click to the site and wants an answer within 3 seconds, so anything that calls Discord happens in a
background task, which then edits the answer. Only people who have linked Discord can open a ticket, and a click is only
trusted once its signature checks out against the application's public key.
"""

from __future__ import annotations

import logging
import time
from datetime import timedelta

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from django.conf import settings as django_settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.audit.services import record

from .models import PanelButton, Ticket, TicketPanel, TicketSettings
from .services import (MESSAGE_MAX, OPEN_PERM, SUBJECT_MAX, TicketError, _discord, _explain, _make_channel, _name, _role_out, application_info,
                       channel_url, close, pickable_roles)

log = logging.getLogger(__name__)

PING, COMPONENT, MODAL_SUBMIT = 1, 3, 5
PONG, REPLY, DEFERRED_REPLY, SHOW_MODAL = 1, 4, 5, 9
EPHEMERAL = 64
TEXT_CHANNEL, ANNOUNCEMENT_CHANNEL, CATEGORY = 0, 5, 4
MAX_BUTTONS, TITLE_MAX, TEXT_MAX, LABEL_MAX = 5, 100, 2000, 80
#: Discord says to reject old requests, so a recorded one can't be played back later.
MAX_REQUEST_AGE = 300
#: Between tickets from panels, per person, so nobody can fill the server with channels.
COOLDOWN = timedelta(seconds=60)
PREFIX = "tickets:"


def endpoint_url() -> str:
    return f"{django_settings.SITE_URL}/api/public/p/tickets/interactions"


# --- clicks --------------------------------------------------------------------------------------------------------


def signed_by_discord(body: bytes, signature: str, timestamp: str) -> bool:
    key = TicketSettings.load().public_key
    if not (key and signature and timestamp):
        return False
    try:
        if abs(time.time() - int(timestamp)) > MAX_REQUEST_AGE:
            return False
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(key)).verify(bytes.fromhex(signature), timestamp.encode() + body)
    except (ValueError, InvalidSignature):
        return False
    return True


def _say(text: str, components: list | None = None) -> dict:
    data = {"content": text, "flags": EPHEMERAL, "allowed_mentions": {"parse": []}}
    if components:
        data["components"] = components
    return {"type": REPLY, "data": data}


def handle(interaction: dict) -> dict:
    """What to answer a signed request with. Must stay quick: no calls to Discord in here."""
    from conduit_discord.models import DiscordAccount, DiscordSettings

    kind = interaction.get("type")
    if kind == PING:
        return {"type": PONG}
    if kind not in (COMPONENT, MODAL_SUBMIT):
        return _say("This bot doesn't do that.")
    if interaction.get("guild_id") != DiscordSettings.load().guild_id:
        return _say("Tickets only work on this site's own Discord server.")
    action, _, ident = (interaction.get("data", {}).get("custom_id") or "").removeprefix(PREFIX).partition(":")
    if not ident.isdigit():
        return _say("This button no longer works.")
    member = interaction.get("member") or {}
    account = DiscordAccount.objects.filter(discord_id=(member.get("user") or {}).get("id"), user__is_active=True).select_related("user__main_character").first()
    if account is None:
        return _say(f"Link your Discord account first: {django_settings.SITE_URL}/p/discord")
    user = account.user
    if action == "open":
        return _click_open(int(ident), user)
    if action == "form":
        return _submit_form(int(ident), user, interaction)
    if action in ("close", "closeyes"):
        return _click_close(action, int(ident), user, member.get("roles") or [], interaction)
    return _say("This button no longer works.")


def _panel_problem(button: PanelButton | None, user) -> str:
    if button is None:
        return "This button no longer works; ask staff for the current panel."
    theirs = Ticket.objects.filter(target=user, panel_button=button, closed_at__isnull=True).first()
    if theirs is not None:
        return f"You already have a ticket open for this: {channel_url(theirs) or 'it is being made'}"
    if Ticket.objects.filter(target=user, opened_at__gte=timezone.now() - COOLDOWN).exclude(panel_label="").exists():
        return "You've only just opened a ticket. Try again in a minute."
    return ""


def _click_open(button_id: int, user) -> dict:
    button = PanelButton.objects.filter(pk=button_id).first()
    if problem := _panel_problem(button, user):
        return _say(problem)
    field = {"type": 4, "custom_id": "subject", "label": "Subject", "style": 1, "max_length": SUBJECT_MAX, "required": True}
    body = {"type": 4, "custom_id": "message", "label": "Message", "style": 2, "max_length": MESSAGE_MAX, "required": False}
    return {"type": SHOW_MODAL, "data": {"custom_id": f"{PREFIX}form:{button.pk}", "title": button.label[:45],
                                         "components": [{"type": 1, "components": [field]}, {"type": 1, "components": [body]}]}}


def _form_values(interaction: dict) -> dict:
    return {c.get("custom_id"): c.get("value") or "" for row in interaction["data"].get("components", []) for c in row.get("components", [])}


def _queue(task, *args) -> dict:
    try:
        task.delay(*args)
    except Exception:
        log.exception("Couldn't queue a click on a panel")
        return _say("The site couldn't take that just now. Try again in a minute.")
    return {"type": DEFERRED_REPLY, "data": {"flags": EPHEMERAL}}


def _submit_form(button_id: int, user, interaction: dict) -> dict:
    from .tasks import open_from_panel

    values = _form_values(interaction)
    return _queue(open_from_panel, button_id, user.pk, values.get("subject", ""), values.get("message", ""), interaction["application_id"], interaction["token"])


def can_close(ticket: Ticket, user, role_ids: list[str]) -> bool:
    """Whoever opened it, anyone holding a role that can see it, and staff."""
    return ticket.opened_by_id == user.pk or any(r["id"] in role_ids for r in ticket.roles) or user.has_perm(OPEN_PERM)


def _click_close(action: str, ticket_id: int, user, role_ids: list[str], interaction: dict) -> dict:
    from .tasks import close_from_discord

    ticket = Ticket.objects.filter(pk=ticket_id).first()
    if ticket is None or ticket.closed_at is not None:
        return _say("This ticket is already closed.")
    if not can_close(ticket, user, role_ids):
        return _say("You can't close this ticket.")
    if action == "close":
        # A click can't be taken back: the channel goes for good.
        return _say("Close this ticket? The channel is saved as a transcript, then removed from Discord.", [{"type": 1, "components": [
            {"type": 2, "style": 4, "label": "Yes, close it", "custom_id": f"{PREFIX}closeyes:{ticket.pk}"}]}])
    return _queue(close_from_discord, ticket.pk, user.pk, interaction["application_id"], interaction["token"])


def _answer(api, application_id: str, token: str, text: str) -> None:
    """Fill in the answer to a click Discord is showing as "thinking". The token is the only credential this needs."""
    try:
        api.call("PATCH", f"/webhooks/{application_id}/{token}/messages/@original", json={"content": text, "allowed_mentions": {"parse": []}})
    except api.DiscordError as exc:
        log.warning("Couldn't answer a click on a panel: %s", exc)


def open_in_background(button_id: int, user_id: int, subject: str, message: str, application_id: str, token: str) -> None:
    from conduit_discord import discord_api as api

    with api.allow_waiting():
        try:
            ticket = open_from_panel(button_id, user_id, subject, message)
        except TicketError as exc:
            _answer(api, application_id, token, str(exc))
        else:
            _answer(api, application_id, token, f"Your ticket is open: {channel_url(ticket)}")


def close_in_background(ticket_id: int, user_id: int, application_id: str, token: str) -> None:
    from conduit_discord import discord_api as api

    ticket = Ticket.objects.filter(pk=ticket_id).first()
    user = get_user_model().objects.filter(pk=user_id).first()
    if ticket is None or user is None:
        return
    with api.allow_waiting():
        try:
            close(ticket, user)
        except TicketError as exc:
            _answer(api, application_id, token, str(exc))
        else:
            _answer(api, application_id, token, "Ticket closed.")


def open_from_panel(button_id: int, user_id: int, subject: str, message: str) -> Ticket:
    from conduit_discord.models import DiscordAccount

    subject, message = " ".join(subject.split())[:SUBJECT_MAX], message.strip()[:MESSAGE_MAX]
    if not subject:
        raise TicketError("Give the ticket a subject")
    user = get_user_model().objects.filter(pk=user_id, is_active=True).select_related("main_character").first()
    account = DiscordAccount.objects.filter(user=user).first() if user else None
    if account is None:
        raise TicketError(f"Link your Discord account first: {django_settings.SITE_URL}/p/discord", 409)
    button = PanelButton.objects.filter(pk=button_id).first()
    if problem := _panel_problem(button, user):
        raise TicketError(problem, 409)
    api, s = _discord()
    try:
        bot_id = api.bot_user(s.bot_token)["id"]
        known = {r["id"]: r["name"] for r in pickable_roles(api.roles(s.bot_token, s.guild_id))}
    except api.DiscordError as exc:
        raise _explain(exc) from None
    roles = [{"id": i, "name": known[i]} for i in button.role_ids if i in known]
    if not roles:
        raise TicketError("The Discord roles of this button no longer exist; ask staff to fix the panel", 409)
    name = _name(user)
    try:
        with transaction.atomic():
            ticket = Ticket.objects.create(subject=subject, opened_by=user, opened_by_name=name, target=user, target_name=name,
                                           target_discord_id=account.discord_id, guild_id=s.guild_id, roles=roles,
                                           panel_button=button, panel_label=button.label)
    except IntegrityError:
        raise TicketError("You already have a ticket open for this", 409) from None
    try:
        _make_channel(api, s, ticket, bot_id, account.discord_id, message, category_id=button.category_id)
    except api.DiscordError as exc:
        ticket.delete()
        raise _explain(exc) from None
    record("tickets.opened", f"opened a Discord ticket from the panel button {button.label}: {subject}", actor=user, target=user,
           details={"ticket": ticket.pk, "via": ticket.via, "channel": ticket.channel_id, "panel": button.panel_id})
    return ticket


# --- managing panels -----------------------------------------------------------------------------------------------


def panel_out(p: TicketPanel) -> dict:
    return {"id": p.pk, "channel_id": p.channel_id, "title": p.title, "text": p.text,
            "buttons": [{"id": b.pk, "label": b.label, "role_ids": b.role_ids, "category_id": b.category_id} for b in p.buttons.all()]}


def panels_out() -> dict:
    """The panels, the server's channels and roles to pick from, and anything stopping clicks reaching the site."""
    out = {"panels": [panel_out(p) for p in TicketPanel.objects.prefetch_related("buttons")], "channels": [], "categories": [], "roles": [],
           "endpoint_url": endpoint_url(), "problems": []}
    try:
        api, s = _discord()
    except TicketError as exc:
        out["problems"].append(str(exc))
        return out
    try:
        application = application_info(api, s)
        channels = api.call("GET", f"/guilds/{s.guild_id}/channels", bot_token=s.bot_token)
        out["roles"] = [_role_out(r) for r in pickable_roles(api.roles(s.bot_token, s.guild_id))]
    except api.DiscordError as exc:
        out["problems"].append(str(_explain(exc)))
        return out
    channels = sorted(channels, key=lambda c: c.get("position", 0))
    out["channels"] = [{"id": c["id"], "name": c["name"]} for c in channels if c.get("type") in (TEXT_CHANNEL, ANNOUNCEMENT_CHANNEL)]
    out["categories"] = [{"id": c["id"], "name": c["name"]} for c in channels if c.get("type") == CATEGORY]
    if not out["endpoint_url"].startswith("https://"):
        out["problems"].append(f"Discord only sends clicks to a public https address, and this site's address is {django_settings.SITE_URL}.")
    elif application.get("interactions_endpoint_url") != out["endpoint_url"]:
        out["problems"].append("Buttons won't work yet: set the Interactions Endpoint URL below on your Discord application.")
    return out


def _panel_message(panel: TicketPanel) -> dict:
    buttons = [{"type": 2, "style": 1, "label": b.label, "custom_id": f"{PREFIX}open:{b.pk}"} for b in panel.buttons.all()]
    embed = {"title": panel.title}
    if panel.text:
        embed["description"] = panel.text
    return {"embeds": [embed], "components": [{"type": 1, "components": buttons}], "allowed_mentions": {"parse": []}}


def _clean_panel(api, s, data: dict) -> dict:
    title, text = " ".join(data["title"].split()), data["text"].strip()
    if not title or len(title) > TITLE_MAX:
        raise TicketError(f"Give the panel a title of up to {TITLE_MAX} characters")
    if len(text) > TEXT_MAX:
        raise TicketError(f"Keep the panel's text to {TEXT_MAX} characters")
    if not 1 <= len(data["buttons"]) <= MAX_BUTTONS:
        raise TicketError(f"A panel has 1 to {MAX_BUTTONS} buttons")
    channels = api.call("GET", f"/guilds/{s.guild_id}/channels", bot_token=s.bot_token)
    if not any(c["id"] == data["channel_id"] and c.get("type") in (TEXT_CHANNEL, ANNOUNCEMENT_CHANNEL) for c in channels):
        raise TicketError("Pick a text channel on the server")
    categories = {c["id"] for c in channels if c.get("type") == CATEGORY}
    roles = {r["id"] for r in pickable_roles(api.roles(s.bot_token, s.guild_id))}
    buttons = []
    for b in data["buttons"]:
        label = " ".join(b["label"].split())
        if not label or len(label) > LABEL_MAX:
            raise TicketError(f"Give every button a label of up to {LABEL_MAX} characters")
        # Without a role nobody but the person who clicked would ever see the ticket.
        if not b["role_ids"]:
            raise TicketError(f"Pick the Discord roles that see tickets from {label}")
        if any(i not in roles for i in b["role_ids"]):
            raise TicketError(f"{label} has a role that's not on the server")
        if b["category_id"] and b["category_id"] not in categories:
            raise TicketError(f"{label} has a category that's not on the server")
        buttons.append({**b, "label": label, "role_ids": list(dict.fromkeys(b["role_ids"]))})
    return {"channel_id": data["channel_id"], "title": title, "text": text, "buttons": buttons}


def save_panel(panel_id: int | None, data: dict, viewer, request=None) -> TicketPanel:
    """Save a panel and post it, or edit the message already posted. Nothing is saved if Discord refuses."""
    api, s = _discord()
    try:
        clean = _clean_panel(api, s, data)
        with transaction.atomic():
            panel = TicketPanel() if panel_id is None else TicketPanel.objects.select_for_update().filter(pk=panel_id).first()
            if panel is None:
                raise TicketError("No such panel", 404)
            old_channel, old_message = panel.channel_id, panel.message_id
            panel.channel_id, panel.title, panel.text = clean["channel_id"], clean["title"], clean["text"]
            panel.save()
            kept = []
            for b in clean["buttons"]:
                button = panel.buttons.filter(pk=b["id"]).first() if b.get("id") else None
                button = button or PanelButton(panel=panel)
                button.label, button.role_ids, button.category_id = b["label"], b["role_ids"], b["category_id"]
                button.save()
                kept.append(button.pk)
            panel.buttons.exclude(pk__in=kept).delete()
            _post_panel(api, s, panel, old_channel, old_message)
    except api.DiscordError as exc:
        raise _explain(exc) from None
    record("tickets.panel_saved", f"saved the ticket panel {panel.title}", request=request, actor=viewer, details={"panel": panel.pk, "channel": panel.channel_id})
    return panel


def _post_panel(api, s, panel: TicketPanel, old_channel: str, old_message: str) -> None:
    body = _panel_message(panel)
    if old_message and old_channel == panel.channel_id:
        try:
            api.call("PATCH", f"/channels/{panel.channel_id}/messages/{old_message}", bot_token=s.bot_token, json=body)
            return
        except api.DiscordError as exc:
            if exc.status != 404:  # deleted on Discord: post it again
                raise
    panel.message_id = api.call("POST", f"/channels/{panel.channel_id}/messages", bot_token=s.bot_token, json=body)["id"]
    panel.save(update_fields=["message_id"])
    if old_message and old_channel != panel.channel_id:
        _delete_message(api, s, old_channel, old_message)


def _delete_message(api, s, channel_id: str, message_id: str) -> None:
    try:
        api.call("DELETE", f"/channels/{channel_id}/messages/{message_id}", bot_token=s.bot_token)
    except api.DiscordError as exc:  # its buttons say they no longer work
        log.warning("Couldn't remove the panel message %s: %s", message_id, exc)


def delete_panel(panel_id: int, viewer, request=None) -> None:
    """Open tickets from it carry on; only the message and its buttons go."""
    panel = TicketPanel.objects.filter(pk=panel_id).first()
    if panel is None:
        raise TicketError("No such panel", 404)
    api, s = _discord()
    if panel.message_id:
        _delete_message(api, s, panel.channel_id, panel.message_id)
    title = panel.title
    panel.delete()
    record("tickets.panel_deleted", f"deleted the ticket panel {title}", request=request, actor=viewer, details={"panel": panel_id})
