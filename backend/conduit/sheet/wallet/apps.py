from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class WalletConfig(AppConfig):
    name = "conduit.sheet.wallet"
    label = "wallet"

    def ready(self):
        register(
            Section(
                key="wallet",
                label="Wallet",
                sync="conduit.sheet.wallet.sync.sync",
                scopes=("esi-wallet.read_character_wallet.v1",),
                required_scopes=("esi-wallet.read_character_wallet.v1",),
                interval=1800,
                order=20,
            )
        )
        from . import api  # noqa: F401
