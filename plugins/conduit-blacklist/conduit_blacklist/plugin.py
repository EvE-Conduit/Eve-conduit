"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class BlacklistPlugin(Plugin):
    id = "blacklist"
    name = "Blacklist"
    version = "1.0.1"
    description = "Characters, corporations and alliances you don't want, with notes, and a warning when one links a character or applies."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-blacklist"
    app = "conduit_blacklist.apps.BlacklistConfig"
    api = "conduit_blacklist.api:router"
    frontend = "conduit_blacklist/plugin.js"
    # Only HR and leadership ever see it: members get no sidebar entry, no API and no search results.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_blacklist": "hr", "manage_blacklist": "hr"}
    nav = (NavItem("Blacklist", "", "shield", permission="blacklist.view_blacklist"),)
    search = ("conduit_blacklist.services:search",)
    # Corporations and alliances change: a member who joins a flagged corporation is caught on the next check.
    periodic_tasks = {"scan": {"task": "conduit_blacklist.tasks.scan_all", "schedule": 3600.0}}
