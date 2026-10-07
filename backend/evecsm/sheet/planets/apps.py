from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class PlanetsConfig(AppConfig):
    name = "evecsm.sheet.planets"
    label = "planets"

    def ready(self):
        register(
            Section(
                key="planets",
                label="PI",
                sync="evecsm.sheet.planets.sync.sync",
                scopes=('esi-planets.manage_planets.v1',),
                required_scopes=('esi-planets.manage_planets.v1',),
                interval=3600,
                order=44,
            )
        )
        from . import api  # noqa: F401
