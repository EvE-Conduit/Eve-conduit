"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class TicketsPlugin(Plugin):
    id = "tickets"
    name = "Discord Tickets"
    version = "1.0.0"
    description = "Open a private Discord channel with a member you pick, and close it when you're done."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-tickets"
    app = "conduit_tickets.apps.TicketsConfig"
    api = "conduit_tickets.api:router"
    frontend = "conduit_tickets/plugin.js"
    # Uses the Discord plugin's bot, server and linked accounts.
    requires = ("discord",)
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"open_tickets": "hr", "manage_tickets": "director"}
    nav = (
        NavItem("Discord Tickets", "", "ticket", permission="tickets.open_tickets"),
        NavItem("Settings", "settings", "settings", permission="tickets.manage_tickets"),
    )
