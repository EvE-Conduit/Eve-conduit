from django.apps import AppConfig


class DiscordConfig(AppConfig):
    name = "conduit_discord"
    label = "discord"
    verbose_name = "Discord"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        from . import listeners  # noqa: F401

        register_category("p.discord", "Discord")
        bus.register("discord.linked", "Discord linked", "A member linked their Discord account and joined the server", plugin="discord")
        bus.register("discord.unlinked", "Discord unlinked", "A member's Discord account was unlinked or removed from the server", plugin="discord")
