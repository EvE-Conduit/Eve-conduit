from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class NotificationsConfig(AppConfig):
    name = "evecsm.sheet.notifications"
    label = "sheet_notifications"

    def ready(self):
        register(
            Section(
                key="notifications",
                label="Notifications",
                sync="evecsm.sheet.notifications.sync.sync",
                scopes=('esi-characters.read_notifications.v1',),
                required_scopes=('esi-characters.read_notifications.v1',),
                interval=1200,
                order=61,
            )
        )
        from . import api  # noqa: F401
