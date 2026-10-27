"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class BlueprintsPlugin(Plugin):
    id = "blueprints"
    name = "Blueprint Library"
    version = "1.0.0"
    description = "Every corporation blueprint and members' shared originals, copy and loan requests, and what still needs research."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-blueprints"
    # The core's own character blueprints app already has the label "blueprints".
    app = "conduit_blueprints.apps.BlueprintLibraryConfig"
    api = "conduit_blueprints.api:router"
    frontend = "conduit_blueprints/plugin.js"
    # The core doesn't read corporation blueprints; the plugin does, as a Director whose login grants this.
    esi_scopes = ("esi-corporations.read_blueprints.v1",)
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_library": "member", "manage_requests": "director"}
    nav = (
        NavItem("Blueprints", "", "scroll", permission="blueprint_library.view_library"),
        NavItem("My requests", "requests", "file-text", permission="blueprint_library.view_library"),
        NavItem("Share mine", "sharing", "briefcase", permission="blueprint_library.view_library"),
        NavItem("Research", "research", "flask-conical", permission="blueprint_library.view_library"),
        NavItem("Request queue", "queue", "wrench", permission="blueprint_library.manage_requests"),
    )
    periodic_tasks = {
        # Corporation blueprints, read from ESI (the core only reads characters' own).
        "sync": {"task": "conduit_blueprints.tasks.sync_libraries", "schedule": 3600.0 * 3},
        # Loans past their due date: remind the borrower.
        "overdue": {"task": "conduit_blueprints.tasks.remind_overdue", "schedule": crontab(hour=12, minute=10)},
    }
