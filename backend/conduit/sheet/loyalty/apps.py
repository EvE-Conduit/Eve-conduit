from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class LoyaltyConfig(AppConfig):
    name = "conduit.sheet.loyalty"
    label = "sheet_loyalty"

    def ready(self):
        register(
            Section(
                key="loyalty",
                label="Loyalty Points",
                sync="conduit.sheet.loyalty.sync.sync",
                scopes=('esi-characters.read_loyalty.v1',),
                required_scopes=('esi-characters.read_loyalty.v1',),
                interval=3600,
                order=65,
            )
        )
        from . import api  # noqa: F401
