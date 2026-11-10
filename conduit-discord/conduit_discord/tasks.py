from celery import shared_task


@shared_task(ignore_result=True)
def sync_user(user_id: int):
    from conduit.accounts.models import User
    from conduit.plugins.services import is_enabled

    from . import services

    from .discord_api import allow_waiting

    user = User.objects.filter(pk=user_id).select_related("main_character__corporation", "main_character__alliance").first()
    if user is not None and is_enabled("discord"):
        with allow_waiting():
            services.sync_user(user)


@shared_task(ignore_result=True)
def sync_all():
    from conduit.plugins.services import is_enabled

    from . import services

    from .discord_api import allow_waiting

    if is_enabled("discord"):
        with allow_waiting():
            return services.sync_all()


@shared_task(ignore_result=True)
def end_guest_stays():
    """Remove guests whose temporary link ran out or was withdrawn."""
    from conduit.plugins.services import is_enabled

    from . import guests

    from .discord_api import allow_waiting

    if is_enabled("discord"):
        with allow_waiting():
            return guests.end_due()


@shared_task(ignore_result=True, bind=True, max_retries=5)
def hide_guest_channels(self):
    """Hide every channel guests shouldn't see from the guest role (finishing what saving the settings started)."""
    from conduit.plugins.services import is_enabled

    from . import guests
    from .discord_api import DiscordError, allow_waiting
    from .models import DiscordSettings

    if not is_enabled("discord"):
        return
    s = DiscordSettings.load()
    if not s.configured:
        return
    try:
        with allow_waiting():
            return guests.hide_other_channels(s)
    except DiscordError as exc:
        raise self.retry(countdown=60, exc=exc) from None
