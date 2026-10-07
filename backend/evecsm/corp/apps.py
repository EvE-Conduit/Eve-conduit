from django.apps import AppConfig


class CorpConfig(AppConfig):
    name = "evecsm.corp"
    label = "corp"
    verbose_name = "Corporation sheet"

    def ready(self):
        from evecsm.events import bus

        bus.register("corp.structure_fuel_low", "Structure fuel low", "An Upwell structure has less than 72 hours of fuel left")
        bus.register("corp.structure_reinforced", "Structure reinforced", "An Upwell structure went into armor or hull reinforcement")
        bus.register("corp.structure_state_changed", "Structure state changed", "An Upwell structure changed state")
        from evecsm.notify.services import register_category

        register_category("corp.structures", "Corporation structures (fuel, reinforcement)")
        from . import api, search  # noqa: F401
