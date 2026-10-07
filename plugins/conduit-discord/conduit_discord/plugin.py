"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class DiscordPlugin(Plugin):
    id = "discord"
    name = "Discord"
    version = "1.0.0"
    description = "Members link their Discord account and join your server; roles and nicknames follow their groups and state."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-discord"
    app = "conduit_discord.apps.DiscordConfig"
    api = "conduit_discord.api:router"
    frontend = "conduit_discord/plugin.js"
    nav = (NavItem("Discord", "", "message-square"),)
    # Group and state changes sync straight away; this catches anything missed (people who left the server,
    # roles changed by hand in Discord, permissions changed on a state).
    periodic_tasks = {"sync-all": {"task": "conduit_discord.tasks.sync_all", "schedule": 6 * 3600.0}}
