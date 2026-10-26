from django.apps import AppConfig


class StockConfig(AppConfig):
    name = "conduit_stock"
    label = "stock"
    verbose_name = "Doctrine Stock"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.stock", "Doctrine stock")
        bus.register("stock.shortage", "Stock running low", "A ship or item at a staging location fell below its low mark", plugin="stock")
