"""Discord pings for plugin alerts.

A plugin marks the events worth a ping as alerts (``bus.register(..., alert=True, manage="stock.manage_stock")``) and
puts the SDK's ``<DiscordPings plugin="stock" />`` on its settings page. People with the ``manage`` permission (or
``site.manage_api``) then switch pinging on per alert and pick Discord roles. When such an event goes out, Discord
webhooks that receive it ping their own mention (Administration → Integrations, if set) and the chosen roles, the
same way an op or a timer that asks for a ping does. An event that says for itself whether it pings (``ping`` in its
payload) is left alone.
"""

from __future__ import annotations

import logging

from . import bus

log = logging.getLogger(__name__)
ROLES_CACHE = 600


def clean_roles(roles) -> list[str]:
    return list(dict.fromkeys(str(r) for r in (roles or []) if str(r).isdigit() and len(str(r)) <= 32))[:10]


def can_manage(user, et: bus.EventType) -> bool:
    return et.alert and (user.has_perm("site.manage_api") or bool(et.manage and user.has_perm(et.manage)))


def discord_hooks(name: str) -> list:
    """The enabled Discord webhooks that receive the event (the "every event" ones leave private events out)."""
    from .models import Webhook

    return [h for h in Webhook.objects.filter(enabled=True, kind=Webhook.Kind.DISCORD)
            if (not h.events and not bus.is_private(name)) or name in h.events]


def apply(event: dict) -> dict:
    """The event as webhooks should get it: with ``ping`` and ``mention_roles`` from the alert's ping setting."""
    from .models import EventPing

    et = bus.EVENT_TYPES.get(event["event"])
    data = event.get("data") or {}
    if et is None or not et.alert or "ping" in data:
        return event
    setting = EventPing.objects.filter(event=et.name, ping=True).first()
    if setting is None:
        return event
    return {**event, "data": {**data, "ping": True, "mention_roles": clean_roles(setting.roles)}}


def discord_roles() -> dict:
    """The Discord server's roles (through the Discord plugin, when it's on and linked to a server), for picking who
    an alert pings. ``available`` is False without it; then only the webhooks' own mentions ping."""
    from django.apps import apps
    from django.core.cache import cache

    from conduit.plugins.services import is_enabled

    if not (apps.is_installed("conduit_discord") and is_enabled("discord")):
        return {"available": False, "roles": []}
    from conduit_discord import discord_api
    from conduit_discord.models import DiscordSettings

    s = DiscordSettings.load()
    if not (s.bot_token and s.guild_id):
        return {"available": False, "roles": []}
    roles = cache.get("events:discord_roles")
    if roles is None:
        try:
            raw = discord_api.roles(s.bot_token, s.guild_id)
        except Exception as exc:  # noqa: BLE001 - Discord being down mustn't break a settings page
            log.warning("Couldn't read the Discord roles: %s", exc)
            return {"available": True, "roles": [], "error": "Discord couldn't be reached; the roles aren't available right now."}
        roles = [{"id": str(r["id"]), "name": r["name"], "color": r.get("color") or 0}
                 for r in sorted(raw, key=lambda r: -r.get("position", 0)) if str(r["id"]) != str(s.guild_id) and not r.get("managed")]
        cache.set("events:discord_roles", roles, ROLES_CACHE)
    return {"available": True, "roles": roles}
