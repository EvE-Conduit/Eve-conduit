from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class FittingsConfig(AppConfig):
    name = "conduit.sheet.fittings"
    label = "sheet_fittings"

    def ready(self):
        register(
            Section(
                key="fittings",
                label="Fittings",
                sync="conduit.sheet.fittings.sync.sync",
                scopes=('esi-fittings.read_fittings.v1',),
                required_scopes=('esi-fittings.read_fittings.v1',),
                interval=3600,
                order=66,
            )
        )
        from . import api  # noqa: F401
