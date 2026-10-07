"""Re-check smart groups and compliance when something about a user changes."""

from evecsm.events import bus


@bus.on("character.added", "character.removed", "character.main_changed", "user.state_changed", "token.invalid")
def _user_changed(event):
    user_id = event.payload.get("user_id")
    if user_id:
        from .tasks import update_user_groups

        update_user_groups.delay(user_id)
