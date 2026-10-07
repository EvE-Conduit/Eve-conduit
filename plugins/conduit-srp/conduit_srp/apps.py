from django.apps import AppConfig


class SrpConfig(AppConfig):
    name = "conduit_srp"
    label = "srp"
    verbose_name = "Ship replacement"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.srp", "Ship replacement")
        bus.register("srp.request_created", "SRP requested", "A member asked for a loss to be replaced", plugin="srp")
        bus.register("srp.request_decided", "SRP decided", "An SRP request was approved or rejected", plugin="srp")
        bus.register("srp.request_paid", "SRP paid", "An approved SRP request was paid out", plugin="srp")
