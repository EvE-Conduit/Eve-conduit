"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class AnnouncementsPlugin(Plugin):
    id = "announcements"
    name = "Announcements"
    version = "1.1.1"
    description = "News from leadership for everyone or chosen states and groups, with pinning, scheduling and notifications."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-announcements"
    app = "conduit_announcements.apps.AnnouncementsConfig"
    api = "conduit_announcements.api:router"
    frontend = "conduit_announcements/plugin.js"
    # Everyone reads them; writing needs announcements.post_announcements.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"post_announcements": "director"}
    nav = (NavItem("Announcements", "", "bell"),)
    search = ("conduit_announcements.services:search",)
    # Announcements scheduled for later are announced (notifications, webhooks) once their time comes.
    periodic_tasks = {"publish-due": {"task": "conduit_announcements.tasks.publish_due", "schedule": 120.0}}
    default_enabled = True
