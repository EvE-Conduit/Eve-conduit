"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class TrackingPlugin(Plugin):
    id = "tracking"
    name = "Activity Tracking"
    version = "1.0.1"
    description = "Follow a member and all their alts for 1 to 60 days, with a report of the systems they were in, the ships they flew, what they earned and when they played."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-tracking"
    app = "conduit_tracking.apps.TrackingConfig"
    api = "conduit_tracking.api:router"
    frontend = "conduit_tracking/plugin.js"
    # Where a character is and what it flies, read every minute while it's online. The core asks for these too.
    esi_scopes = ("esi-location.read_location.v1", "esi-location.read_online.v1", "esi-location.read_ship_type.v1")
    # Only HR ever sees it: the tracked member gets no sidebar entry, no notification and no API.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"track_members": "hr"}
    nav = (NavItem("Activity Tracking", "", "radar", permission="tracking.track_members"),)
    # ESI caches whether a character is online for 60 seconds, so polling more often gains nothing.
    periodic_tasks = {"poll": {"task": "conduit_tracking.tasks.poll", "schedule": 60.0}}
