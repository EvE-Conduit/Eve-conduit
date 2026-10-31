"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class TicketsPlugin(Plugin):
    id = "tickets"
    name = "Discord Tickets"
    version = "1.1.0"
    description = "Reach a member you pick through a private Discord channel, an EVE mail or both, and close it when you're done."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-tickets"
    app = "conduit_tickets.apps.TicketsConfig"
    api = "conduit_tickets.api:router"
    frontend = "conduit_tickets/plugin.js"
    # Uses the Discord plugin's bot, server and linked accounts.
    requires = ("discord",)
    # EVE mail needs esi-mail.send_mail.v1, but only on the character of whoever sends one, and sign-in already asks
    # for every scope. Not listed in esi_scopes: that would make every member's login count as out of date without it.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    # Closing queues the transcript straight away; this picks up what failed or never got started.
    periodic_tasks = {"archive-pending": {"task": "conduit_tickets.tasks.archive_pending", "schedule": 900.0}}
    permission_tiers = {"open_tickets": "hr", "manage_tickets": "director"}
    nav = (
        NavItem("Discord Tickets", "", "ticket", permission="tickets.open_tickets"),
        NavItem("Settings", "settings", "settings", permission="tickets.manage_tickets"),
    )
