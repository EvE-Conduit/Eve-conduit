from django.apps import AppConfig


class BlacklistConfig(AppConfig):
    name = "conduit_blacklist"
    label = "blacklist"
    verbose_name = "Blacklist"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        from . import listeners  # noqa: F401

        register_category("p.blacklist", "Blacklist warnings")
        # Private: it names who was flagged, so it only goes to webhooks that picked it by name.
        bus.register("blacklist.match", "Blacklisted character found", "A member or applicant has a blacklisted character",
                     plugin="blacklist", private=True, alert=True, manage="blacklist.manage_blacklist")
