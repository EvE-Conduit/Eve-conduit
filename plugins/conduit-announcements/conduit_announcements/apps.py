from django.apps import AppConfig


class AnnouncementsConfig(AppConfig):
    name = "conduit_announcements"
    label = "announcements"
    verbose_name = "Announcements"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.announcements", "Announcements")
        bus.register("announcements.published", "Announcement published", "An announcement went out to members", plugin="announcements")
