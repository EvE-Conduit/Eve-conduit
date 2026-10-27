"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class SpyCheckPlugin(Plugin):
    id = "spycheck"
    name = "Spy Check"
    version = "1.0.0"
    description = "A daily scan of members' synced data for dealings with blacklisted and watched characters, corporations and alliances, with findings HR reviews."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-spycheck"
    app = "conduit_spycheck.apps.SpyCheckConfig"
    api = "conduit_spycheck.api:router"
    frontend = "conduit_spycheck/plugin.js"
    # Only HR ever sees it: members get no sidebar entry, no API and no widget. It reads the Blacklist plugin's
    # entries when that is installed and on, but doesn't need it (it has its own watch list).
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_findings": "hr", "manage_spycheck": "hr"}
    nav = (NavItem("Spy Check", "", "radar", permission="spycheck.view_findings"),)
    # Look through everyone's synced data once a day, after the night's syncs.
    periodic_tasks = {"daily": {"task": "conduit_spycheck.tasks.daily", "schedule": crontab(hour=6, minute=40)}}
