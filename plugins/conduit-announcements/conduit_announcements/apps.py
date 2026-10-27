from django.apps import AppConfig


class AnnouncementsConfig(AppConfig):
    name = "conduit_announcements"
    label = "announcements"
    verbose_name = "Announcements"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.announcements", "Announcements")
        # Alerts: writers can have them ping on Discord (the SDK's DiscordPings on the announcements page).
        alert = {"alert": True, "manage": "announcements.post_announcements"}
        bus.register("announcements.published", "Announcement published", "An announcement for everyone went out",
                     plugin="announcements", **alert)
        # Private: never sent to "every event" webhooks, only to ones that pick it.
        bus.register("announcements.published_restricted", "Announcement published (some states or groups only)",
                     "An announcement only for some states or groups went out; send it to a channel only they can read",
                     plugin="announcements", private=True, **alert)
