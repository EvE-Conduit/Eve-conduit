from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class ContractsConfig(AppConfig):
    name = "evecsm.sheet.contracts"
    label = "contracts"

    def ready(self):
        register(
            Section(
                key="contracts",
                label="Contracts",
                sync="evecsm.sheet.contracts.sync.sync",
                scopes=('esi-contracts.read_character_contracts.v1',),
                required_scopes=('esi-contracts.read_character_contracts.v1',),
                interval=1800,
                order=46,
            )
        )
        from . import api  # noqa: F401
