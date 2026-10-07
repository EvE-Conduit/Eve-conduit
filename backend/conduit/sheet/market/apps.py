from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class MarketConfig(AppConfig):
    name = "conduit.sheet.market"
    label = "market"

    def ready(self):
        register(
            Section(
                key="market",
                label="Market",
                sync="conduit.sheet.market.sync.sync",
                scopes=('esi-markets.read_character_orders.v1',),
                required_scopes=('esi-markets.read_character_orders.v1',),
                interval=1200,
                order=45,
            )
        )
        from . import api  # noqa: F401
