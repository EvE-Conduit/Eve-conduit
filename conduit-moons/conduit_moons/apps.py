from django.apps import AppConfig


class MoonsConfig(AppConfig):
    name = "conduit_moons"
    label = "moons"
    verbose_name = "Moon mining ledger"

    def ready(self):
        from conduit.notify.services import register_category

        register_category("p.moons", "Moon tax")
