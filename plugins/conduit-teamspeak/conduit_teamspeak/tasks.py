from celery import shared_task


@shared_task(ignore_result=True)
def sync_user(user_id: int):
    from conduit.accounts.models import User
    from conduit.plugins.services import is_enabled

    from . import services

    user = User.objects.filter(pk=user_id).select_related("main_character__corporation", "main_character__alliance", "state").first()
    if user is not None and is_enabled("teamspeak"):
        services.sync_user(user)


@shared_task(ignore_result=True)
def sync_all():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("teamspeak"):
        return services.sync_all()
