"""Check a member's characters against the blacklist as soon as they link one, get one moved to them, or apply."""

from conduit.events import bus


def _check(user_id, source):
    from conduit.plugins.services import is_enabled

    from . import services

    if user_id and is_enabled("blacklist"):
        services.check_user(user_id, source)


@bus.on("character.added", "character.moved")
def character_linked(event):
    from .tasks import check_user

    user_id = event.payload.get("user_id")
    _check(user_id, "linked")
    # A newly linked character's corporation and alliance arrive a moment later, from ESI; look again then.
    if user_id:
        check_user.apply_async((user_id, "linked"), countdown=300)


@bus.on("user.state_changed")
def state_changed(event):
    _check(event.payload.get("user_id"), "linked")


# Emitted by the Recruitment plugin, when it's installed.
@bus.on("recruit.application_submitted")
def applied(event):
    _check(event.payload.get("user_id"), "applied")
