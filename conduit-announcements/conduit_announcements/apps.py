from django.apps import AppConfig


class AnnouncementsConfig(AppConfig):
    name = "conduit_announcements"
    label = "announcements"
    verbose_name = "Announcements"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.announcements", "Announcements")
        bus.register("announcements.published", "Announcement published", "An announcement for everyone went out", plugin="announcements")
        restricted = ("announcements.published_restricted", "Announcement published (some states or groups only)",
                      "An announcement only for some states or groups went out; send it to a channel only they can read")
        try:
            # Private (EvE Conduit 0.5.18+): never sent to "every event" webhooks, only to ones that pick it.
            bus.register(*restricted, plugin="announcements", private=True)
        except TypeError:
            bus.register(*restricted, plugin="announcements")
