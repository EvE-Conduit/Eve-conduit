"""Keep Mumble accounts in step with what happens to the site account."""

from conduit.events import bus


@bus.on("user.merged")
def follow_merge(event):
    """An administrator merged a member's second account into their main. The old account's Mumble login moves to the
    main account if that has none; otherwise it's deleted (the main's login stays)."""
    from conduit.plugins.services import is_enabled

    from . import services
    from .models import MumbleUser

    if not is_enabled("mumble"):
        return
    source, target = event.payload.get("from_user_id"), event.payload.get("to_user_id")
    acct = MumbleUser.objects.filter(user_id=source).select_related("user").first()
    if acct is None:
        return
    if MumbleUser.objects.filter(user_id=target).exists():
        services.delete_account(acct, reason="their account was merged into another")
        return
    acct.user_id = target
    acct.save(update_fields=["user"])
