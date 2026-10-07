from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class KillmailsConfig(AppConfig):
    name = "conduit.sheet.killmails"
    label = "sheet_killmails"

    def ready(self):
        register(
            Section(
                key="killmails",
                label="Killmails",
                sync="conduit.sheet.killmails.sync.sync",
                scopes=('esi-killmails.read_killmails.v1',),
                required_scopes=('esi-killmails.read_killmails.v1',),
                interval=1800,
                order=67,
            )
        )
        from . import api  # noqa: F401
