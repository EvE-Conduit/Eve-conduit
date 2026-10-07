from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class StandingsConfig(AppConfig):
    name = "evecsm.sheet.standings"
    label = "sheet_standings"

    def ready(self):
        register(
            Section(
                key="standings",
                label="Standings",
                sync="evecsm.sheet.standings.sync.sync",
                scopes=('esi-characters.read_standings.v1',),
                required_scopes=('esi-characters.read_standings.v1',),
                interval=3600,
                order=64,
            )
        )
        from . import api  # noqa: F401
