from django.apps import AppConfig


class TaxConfig(AppConfig):
    name = "conduit_tax"
    label = "tax"
    verbose_name = "Corp tax"

    def ready(self):
        from conduit.notify.services import register_category

        register_category("p.tax", "Corp tax")
