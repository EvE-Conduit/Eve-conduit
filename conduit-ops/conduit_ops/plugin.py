"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class OpsPlugin(Plugin):
    id = "ops"
    name = "Ops Calendar"
    version = "1.0.1"
    description = "CTAs, stratops, roams and mining ops on one calendar with countdowns, RSVPs, reminders and Discord pings."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-ops"
    app = "conduit_ops.apps.OpsConfig"
    api = "conduit_ops.api:router"
    frontend = "conduit_ops/plugin.js"
    # Members see the ops meant for them and answer them; FCs with ops.schedule_ops post ops and change their own;
    # ops.manage_ops changes anyone's and the settings.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"schedule_ops": "member", "manage_ops": "director"}
    nav = (NavItem("Ops calendar", "", "calendar"),)
    search = ("conduit_ops.services:search",)
    # Reminders go out when an op gets within the set number of minutes of starting.
    periodic_tasks = {"remind": {"task": "conduit_ops.tasks.remind_due", "schedule": 60.0}}
