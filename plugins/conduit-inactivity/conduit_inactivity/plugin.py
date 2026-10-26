"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class InactivityPlugin(Plugin):
    id = "inactivity"
    name = "Inactivity"
    version = "1.0.0"
    description = "Members who have gone quiet, from site sign-ins, game logins and fleets, and leave of absence so nobody is chased by mistake."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-inactivity"
    app = "conduit_inactivity.apps.InactivityConfig"
    api = "conduit_inactivity.api:router"
    frontend = "conduit_inactivity/plugin.js"
    # Every member posts their own leave; the list of who has gone quiet needs inactivity.view_inactivity.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_inactivity": "hr", "manage_leave": "hr"}
    nav = (
        NavItem("Leave of absence", "", "calendar"),
        NavItem("Inactive members", "members", "moon", permission="inactivity.view_inactivity"),
    )
    group_rules = ("conduit_inactivity.rules",)
    # Recompute everyone's last activity and tell HR who went quiet, once a day.
    periodic_tasks = {"daily": {"task": "conduit_inactivity.tasks.daily", "schedule": crontab(hour=7, minute=20)}}
