from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class FittingsConfig(AppConfig):
    name = "evecsm.sheet.fittings"
    label = "sheet_fittings"

    def ready(self):
        register(
            Section(
                key="fittings",
                label="Fittings",
                sync="evecsm.sheet.fittings.sync.sync",
                scopes=('esi-fittings.read_fittings.v1',),
                required_scopes=('esi-fittings.read_fittings.v1',),
                interval=3600,
                order=66,
            )
        )
        from . import api  # noqa: F401
