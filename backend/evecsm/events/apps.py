from django.apps import AppConfig


class EventsConfig(AppConfig):
    name = "evecsm.events"
    label = "events"
    verbose_name = "Events and webhooks"

    def ready(self):
        from . import webhooks  # noqa: F401  (registers the webhook listener)
