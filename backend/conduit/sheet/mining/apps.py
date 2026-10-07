from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class MiningConfig(AppConfig):
    name = "conduit.sheet.mining"
    label = "mining"

    def ready(self):
        register(
            Section(
                key="mining",
                label="Mining",
                sync="conduit.sheet.mining.sync.sync",
                scopes=('esi-industry.read_character_mining.v1',),
                required_scopes=('esi-industry.read_character_mining.v1',),
                interval=3600,
                order=43,
            )
        )
        from . import api  # noqa: F401
