from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class BlueprintsConfig(AppConfig):
    name = "evecsm.sheet.blueprints"
    label = "blueprints"

    def ready(self):
        register(
            Section(
                key="blueprints",
                label="Blueprints",
                sync="evecsm.sheet.blueprints.sync.sync",
                scopes=('esi-characters.read_blueprints.v1',),
                required_scopes=('esi-characters.read_blueprints.v1',),
                interval=3600,
                order=40,
            )
        )
        from . import api  # noqa: F401
