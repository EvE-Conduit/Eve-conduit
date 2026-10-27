"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class PiPlugin(Plugin):
    id = "pi"
    name = "Planetary Industry"
    version = "1.0.1"
    description = "Every colony across your characters with extractor countdowns, output and its value, expiry reminders, and a corporation view for PI programs."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-pi"
    app = "conduit_pi.apps.PiConfig"
    api = "conduit_pi.api:router"
    frontend = "conduit_pi/plugin.js"
    # Colonies come from the character sheet's PI section, which already reads each planet's layout with this scope.
    esi_scopes = ("esi-planets.manage_planets.v1",)
    # Where its permission shows in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_corp_pi": "director"}
    nav = (
        NavItem("Planetary Industry", "", "globe"),
        NavItem("Corporation PI", "corp", "users", permission="pi.view_corp_pi"),
    )
    periodic_tasks = {
        # Extractors about to run out and ones that just did, every ten minutes (colonies sync hourly).
        "reminders": {"task": "conduit_pi.tasks.reminders", "schedule": 600.0},
        # The optional daily digest, after downtime.
        "digest": {"task": "conduit_pi.tasks.digest", "schedule": crontab(hour=11, minute=30)},
    }
