from django.apps import AppConfig


class PiConfig(AppConfig):
    name = "conduit_pi"
    label = "pi"
    verbose_name = "Planetary Industry"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.pi", "Planetary Industry reminders")
        # Private: they name the member and their planets, so they only go to webhooks that picked them by name.
        bus.register("pi.extractors_expiring", "Extractors about to expire", "A member's extractor programs end within their reminder time",
                     plugin="pi", private=True)
        bus.register("pi.extractors_expired", "Extractors expired", "A member's extractor programs ended", plugin="pi", private=True)
