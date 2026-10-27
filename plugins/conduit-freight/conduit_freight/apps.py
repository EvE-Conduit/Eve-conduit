from django.apps import AppConfig


class FreightConfig(AppConfig):
    name = "conduit_freight"
    label = "freight"
    verbose_name = "Freight"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.freight", "Freight")
        bus.register("freight.contract_created", "Courier contract made", "Someone made a courier contract to a freight service", plugin="freight",
                     alert=True, manage="freight.manage_freight")
        bus.register("freight.contract_finished", "Courier contract settled",
                     "A courier contract was delivered, failed, rejected, deleted or expired", plugin="freight")
