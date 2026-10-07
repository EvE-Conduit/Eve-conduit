from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class StandingsConfig(AppConfig):
    name = "conduit.sheet.standings"
    label = "sheet_standings"

    def ready(self):
        register(
            Section(
                key="standings",
                label="Standings",
                sync="conduit.sheet.standings.sync.sync",
                scopes=('esi-characters.read_standings.v1',),
                required_scopes=('esi-characters.read_standings.v1',),
                interval=3600,
                order=64,
            )
        )
        from . import api  # noqa: F401
