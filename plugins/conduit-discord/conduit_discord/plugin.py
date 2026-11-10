"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class DiscordPlugin(Plugin):
    id = "discord"
    name = "Discord"
    version = "1.4.0"
    description = "Members link their Discord account and join your server; roles and nicknames follow their groups and state. Temporary access links let guests in for a while."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-discord"
    app = "conduit_discord.apps.DiscordConfig"
    api = "conduit_discord.api:router"
    # Temporary access links are opened by people without an account.
    public_api = "conduit_discord.public_api:router"
    public_pages = True
    frontend = "conduit_discord/plugin.js"
    # "Must be on the Discord server" (a setting) as part of compliance (EvE Conduit 0.5.20+).
    compliance = ("conduit_discord.services:compliance_problems",)
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"access_discord": "member", "create_guest_links": "member", "manage_discord": "director"}
    nav = (
        NavItem("Discord", "", "message-square"),
        NavItem("Temporary access", "guests", "clock", permission="discord.create_guest_links"),
    )
    # Who may link is decided by discord.access_discord (give it to states), so guests can be let in too.
    members_only = False
    # Group and state changes sync straight away; this catches anything missed (people who left the server,
    # roles changed by hand in Discord, permissions changed on a state).
    periodic_tasks = {
        "sync-all": {"task": "conduit_discord.tasks.sync_all", "schedule": 6 * 3600.0},
        # Guests leave when their link runs out; nothing is asked of Discord while there is nobody to remove.
        "guest-stays": {"task": "conduit_discord.tasks.end_guest_stays", "schedule": 120.0},
    }
