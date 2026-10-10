from django.apps import AppConfig


class TimersConfig(AppConfig):
    name = "conduit_timers"
    label = "timers"
    verbose_name = "Timers"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.timers", "Timers")
        bus.register("timers.created", "Timer added", "A timer was added to the board", plugin="timers")
        bus.register("timers.updated", "Timer changed", "A timer's time or details were changed", plugin="timers")
        bus.register("timers.deleted", "Timer removed", "A timer was taken off the board", plugin="timers")
        bus.register("timers.reminder", "Timer reminder", "A timer is about to come out", plugin="timers")
