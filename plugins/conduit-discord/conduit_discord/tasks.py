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
