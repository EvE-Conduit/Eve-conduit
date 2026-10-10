from django.apps import AppConfig


class MumbleConfig(AppConfig):
    name = "conduit_mumble"
    label = "mumble"
    verbose_name = "Mumble"

    def ready(self):
        from django.db.models.signals import post_save

        from conduit.access.models import State
        from conduit.events import bus
        from conduit.notify.services import register_category

        from . import listeners  # noqa: F401
        from .defaults import grant_to_new_state

        post_save.connect(grant_to_new_state, sender=State, dispatch_uid="mumble_default_access")

        register_category("p.mumble", "Mumble")
        bus.register("mumble.account_created", "Mumble account created", "A member created their Mumble account", plugin="mumble")
        bus.register("mumble.account_deleted", "Mumble account deleted", "A member's Mumble account was deleted", plugin="mumble")
        bus.register("mumble.temp_link_created", "Mumble temporary link created", "Someone made a temporary Mumble access link", plugin="mumble")
        bus.register("mumble.temp_access_used", "Mumble temporary access used", "A guest got temporary Mumble access through a link", plugin="mumble")
