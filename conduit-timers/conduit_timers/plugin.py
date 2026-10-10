"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class TimersPlugin(Plugin):
    id = "timers"
    name = "Timers"
    version = "1.1.0"
    description = "Structure and sovereignty timers with live countdowns, who's going and reminders; read from your structures and notifications too."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-timers"
    app = "conduit_timers.apps.TimersConfig"
    api = "conduit_timers.api:router"
    frontend = "conduit_timers/plugin.js"
    # Every member sees the board and can say they're going; adding, editing and the settings need timers.manage_timers.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_timers": "director"}
    nav = (NavItem("Timers", "", "timer"),)
    search = ("conduit_timers.services:search",)
    periodic_tasks = {
        # Reminders go out when a timer gets within the set number of minutes.
        "remind": {"task": "conduit_timers.tasks.remind_due", "schedule": 60.0},
        # Timers from reinforced corporation structures and from characters' in-game notifications.
        "import": {"task": "conduit_timers.tasks.import_timers", "schedule": 300.0},
    }
