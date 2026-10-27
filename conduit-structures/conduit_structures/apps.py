from django.apps import AppConfig


class StructuresConfig(AppConfig):
    name = "conduit_structures"
    label = "structures"
    verbose_name = "Structures & Fuel"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.structures", "Structure fuel warnings")
        bus.register("structures.fuel_low", "Structure fuel below a threshold",
                     "An Upwell structure's fuel fell below one of the warning thresholds set in Structures & Fuel", plugin="structures",
                     alert=True, manage="structures.manage_structures")
        bus.register("structures.refuelled", "Structure refuelled", "An Upwell structure's fuel went up", plugin="structures")
        bus.register("structures.refuel_claimed", "Refuel claimed", "A member said they're refuelling a structure", plugin="structures")
