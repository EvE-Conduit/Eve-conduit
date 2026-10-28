from django.apps import AppConfig


class TrackingConfig(AppConfig):
    name = "conduit_tracking"
    label = "tracking"
    verbose_name = "Activity Tracking"

    def ready(self):
        from conduit.notify.services import register_category

        # Only ever sent to whoever started the tracking, never to the member being tracked.
        register_category("p.tracking", "Activity Tracking")
