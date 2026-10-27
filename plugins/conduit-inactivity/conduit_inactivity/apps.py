from django.apps import AppConfig


class InactivityConfig(AppConfig):
    name = "conduit_inactivity"
    label = "inactivity"
    verbose_name = "Inactivity"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.inactivity", "Inactivity and leave of absence")
        # Private: they name members and their reasons, so they only go to webhooks that picked them by name.
        bus.register("inactivity.flagged", "Members went inactive", "Members passed the inactivity limit with no leave of absence",
                     plugin="inactivity", private=True, alert=True, manage="inactivity.manage_leave")
        bus.register("inactivity.leave_posted", "Leave of absence posted", "A member posted a leave of absence",
                     plugin="inactivity", private=True, alert=True, manage="inactivity.manage_leave")
