from django.apps import AppConfig


class FinanceConfig(AppConfig):
    name = "conduit_finance"
    label = "finance"
    verbose_name = "Corp Finance"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.finance", "Corp finance reports")
        # Private: it carries the corporations' income and spending, so it only goes to webhooks that pick it by name.
        bus.register("finance.month_closed", "Finance month closed", "A month ended and its corporation finance report is ready",
                     plugin="finance", private=True)
