from django.apps import AppConfig


class DiscordConfig(AppConfig):
    name = "conduit_discord"
    label = "discord"
    verbose_name = "Discord"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        from django.db.models.signals import post_save

        from conduit.access.models import State

        from . import listeners  # noqa: F401
        from .defaults import grant_to_new_state

        post_save.connect(grant_to_new_state, sender=State, dispatch_uid="discord_default_access")

        register_category("p.discord", "Discord")
        bus.register("discord.linked", "Discord linked", "A member linked their Discord account and joined the server", plugin="discord")
        bus.register("discord.unlinked", "Discord unlinked", "A member's Discord account was unlinked or removed from the server", plugin="discord")
