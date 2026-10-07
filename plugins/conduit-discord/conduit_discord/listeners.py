"""Sync a member's Discord roles as soon as their groups, state or main character change."""

from conduit.events import bus


@bus.on("group.joined", "group.left", "user.state_changed", "character.main_changed")
def resync(event):
    from conduit.plugins.services import is_enabled

    from .models import DiscordAccount
    from .tasks import sync_user

    user_id = event.payload.get("user_id")
    if user_id and is_enabled("discord") and DiscordAccount.objects.filter(user_id=user_id).exists():
        sync_user.delay(user_id)
