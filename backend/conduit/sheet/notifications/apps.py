from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class NotificationsConfig(AppConfig):
    name = "conduit.sheet.notifications"
    label = "sheet_notifications"

    def ready(self):
        register(
            Section(
                key="notifications",
                label="Notifications",
                sync="conduit.sheet.notifications.sync.sync",
                scopes=('esi-characters.read_notifications.v1',),
                required_scopes=('esi-characters.read_notifications.v1',),
                interval=1200,
                order=61,
            )
        )
        from . import api  # noqa: F401
