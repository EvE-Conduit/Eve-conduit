from django.apps import AppConfig


class StoreConfig(AppConfig):
    name = "conduit_store"
    label = "store"
    verbose_name = "Corp Store"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        from . import listeners  # noqa: F401

        register_category("p.store", "Corp Store")
        bus.register("store.order_placed", "Store order placed", "A member bought something in the Corp Store", plugin="store",
                     alert=True, manage="store.manage_store")
        bus.register("store.order_fulfilled", "Store order fulfilled", "A Corp Store order was handed over", plugin="store")
