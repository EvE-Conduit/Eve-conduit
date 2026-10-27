from django.apps import AppConfig


class SpyCheckConfig(AppConfig):
    name = "conduit_spycheck"
    label = "spycheck"
    verbose_name = "Spy Check"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.spycheck", "Spy Check findings")
        # Private: it names members and who they dealt with, so it only goes to webhooks that picked it by name.
        bus.register("spycheck.findings", "Spy Check findings", "The scan found members dealing with blacklisted or watched entities",
                     plugin="spycheck", private=True)
