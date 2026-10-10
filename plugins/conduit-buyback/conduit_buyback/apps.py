from django.apps import AppConfig


class BuybackConfig(AppConfig):
    name = "conduit_buyback"
    label = "buyback"
    verbose_name = "Buyback"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.buyback", "Buyback")
        bus.register("buyback.contract_created", "Buyback contract made", "A seller contracted items to a buyback program", plugin="buyback")
        bus.register("buyback.contract_finished", "Buyback contract settled",
                     "A buyback contract was accepted, rejected, deleted or expired", plugin="buyback")
