from django.apps import AppConfig


class TeamSpeakConfig(AppConfig):
    name = "conduit_teamspeak"
    label = "teamspeak"
    verbose_name = "TeamSpeak"

    def ready(self):
        from django.db.models.signals import post_save

        from conduit.access.models import State
        from conduit.events import bus
        from conduit.notify.services import register_category

        from . import listeners  # noqa: F401
        from .defaults import grant_to_new_state

        post_save.connect(grant_to_new_state, sender=State, dispatch_uid="teamspeak_default_access")

        register_category("p.teamspeak", "TeamSpeak")
        bus.register("teamspeak.linked", "TeamSpeak linked", "A member linked their TeamSpeak identity", plugin="teamspeak")
        bus.register("teamspeak.unlinked", "TeamSpeak unlinked", "A member's TeamSpeak identity was unlinked", plugin="teamspeak")
