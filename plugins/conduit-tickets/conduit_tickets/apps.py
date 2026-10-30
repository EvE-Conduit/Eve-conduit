from django.apps import AppConfig


class TicketsConfig(AppConfig):
    name = "conduit_tickets"
    label = "tickets"
    verbose_name = "Discord Tickets"

    def ready(self):
        from conduit.notify.services import register_category

        register_category("p.tickets", "Discord Tickets")
