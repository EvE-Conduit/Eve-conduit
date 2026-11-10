from celery import shared_task


#: A sync that couldn't reach the server is tried again after 1, 2, 4, 8 and 15 minutes; after that the 6-hourly
#: full sync has it. Without this, someone who lost access while the server was busy or down kept their groups
#: until then.
RETRIES = 5


@shared_task(ignore_result=True, bind=True, max_retries=RETRIES)
def sync_user(self, user_id: int):
    from conduit.accounts.models import User
    from conduit.plugins.services import is_enabled

    from . import services

    user = User.objects.filter(pk=user_id).select_related("main_character__corporation", "main_character__alliance", "state").first()
    if user is None or not is_enabled("teamspeak"):
        return
    with services.patient():
        _error, again = services.sync_user_result(user)
    # Not when tasks run inline (no Redis): a retry would run straight away, inside the request.
    if again and not self.request.is_eager and self.request.retries < RETRIES:
        raise self.retry(countdown=min(60 * 2 ** self.request.retries, 900))


@shared_task(ignore_result=True)
def sync_all():
    from conduit.plugins.services import is_enabled

    from . import services

    if is_enabled("teamspeak"):
        with services.patient():
            return services.sync_all()
