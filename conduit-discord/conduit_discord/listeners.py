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


@bus.on("user.merged")
def follow_merge(event):
    """An administrator merged a member's second account into their main (EvE Conduit 0.5.21+). The old account's
    Discord link moves to the main account if that has none; otherwise the old one loses what this site gave it."""
    import logging

    from conduit.accounts.models import User
    from conduit.plugins.services import is_enabled

    from . import services
    from .models import DiscordAccount

    if not is_enabled("discord"):
        return
    source, target = event.payload.get("from_user_id"), event.payload.get("to_user_id")
    acct = DiscordAccount.objects.filter(user_id=source).select_related("user").first()
    if acct is None:
        # Moved along with the rest of their records (EvE Conduit 0.5.22+): give the roles of the main account.
        if event.payload.get("records_moved") and DiscordAccount.objects.filter(user_id=target).exists():
            services.sync_user(User.objects.get(pk=target))
        return
    if DiscordAccount.objects.filter(user_id=target).exists():
        try:
            services.unlink(acct.user, reason="their account was merged into another", notify_user=False)
        except services.LinkError as exc:
            logging.getLogger(__name__).warning("Couldn't unlink %s's Discord after a merge: %s", acct.user, exc)
        return
    acct.user_id = target
    acct.save(update_fields=["user"])
    services.sync_user(User.objects.get(pk=target))
