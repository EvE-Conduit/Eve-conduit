from django.apps import AppConfig


class BlueprintLibraryConfig(AppConfig):
    name = "conduit_blueprints"
    label = "blueprint_library"
    verbose_name = "Blueprint Library"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.blueprints", "Blueprint library")
        bus.register("blueprints.request_created", "Blueprint requested", "A member asked for blueprint copies or to borrow an original",
                     plugin="blueprints")
        bus.register("blueprints.request_delivered", "Blueprint request delivered",
                     "A library manager delivered copies or lent out an original", plugin="blueprints")
        bus.register("blueprints.loan_overdue", "Blueprint loan overdue", "A borrowed original is past its due date", plugin="blueprints")
