from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class KillmailsConfig(AppConfig):
    name = "evecsm.sheet.killmails"
    label = "sheet_killmails"

    def ready(self):
        register(
            Section(
                key="killmails",
                label="Killmails",
                sync="evecsm.sheet.killmails.sync.sync",
                scopes=('esi-killmails.read_killmails.v1',),
                required_scopes=('esi-killmails.read_killmails.v1',),
                interval=1800,
                order=67,
            )
        )
        from . import api  # noqa: F401
