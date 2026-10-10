"""Sync a member's server groups as soon as their groups, state or main character change."""

from conduit.events import bus


@bus.on("group.joined", "group.left", "user.state_changed", "character.main_changed")
def resync(event):
    from conduit.plugins.services import is_enabled

    from .models import TeamSpeakUser
    from .tasks import sync_user

    user_id = event.payload.get("user_id")
    if user_id and is_enabled("teamspeak") and TeamSpeakUser.objects.filter(user_id=user_id, cldbid__isnull=False).exists():
        sync_user.delay(user_id)


@bus.on("user.merged")
def follow_merge(event):
    """An administrator merged a member's second account into their main. The old account's TeamSpeak link moves to
    the main account if that has none; otherwise the old identity loses what this site gave it."""
    import logging

    from conduit.accounts.models import User
    from conduit.plugins.services import is_enabled

    from . import services
    from .models import TeamSpeakUser

    if not is_enabled("teamspeak"):
        return
    source, target = event.payload.get("from_user_id"), event.payload.get("to_user_id")
    acct = TeamSpeakUser.objects.filter(user_id=source).select_related("user").first()
    if acct is None:
        # Their records moved along: give the main account's identity the groups it's due now.
        if event.payload.get("records_moved") and TeamSpeakUser.objects.filter(user_id=target).exists():
            services.sync_user(User.objects.get(pk=target))
        return
    if TeamSpeakUser.objects.filter(user_id=target).exists() or acct.pending:
        try:
            services.unlink(acct.user, reason="their account was merged into another", notify_user=False)
        except services.TeamSpeakError as exc:
            logging.getLogger(__name__).warning("Couldn't unlink %s's TeamSpeak after a merge: %s", acct.user, exc)
        return
    acct.user_id = target
    acct.save(update_fields=["user"])
    services.sync_user(User.objects.get(pk=target))
