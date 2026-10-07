from django.apps import AppConfig


class FleetsConfig(AppConfig):
    name = "conduit_fleets"
    label = "fleets"
    verbose_name = "Fleets"

    def ready(self):
        from conduit.events import bus

        bus.register("fleets.created", "Fleet created", "An FC started a fleet", plugin="fleets")
        bus.register("fleets.ended", "Fleet ended", "A fleet ended, with how many pilots got a FAT", plugin="fleets")
