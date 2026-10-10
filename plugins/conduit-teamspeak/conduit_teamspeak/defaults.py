"""Members may use TeamSpeak by default: every members' state (not the public Guest fallback) gets
``teamspeak.access_teamspeak``. Admins can take it away from a state afterwards (Administration → Access); only new
states get it again."""

CODENAME = "access_teamspeak"


def access_permission(Permission, ContentType):
    """The permission, created if Django hasn't yet (it does that only after all migrations ran)."""
    ct, _ = ContentType.objects.get_or_create(app_label="teamspeak", model="teamspeakuser")
    perm, _ = Permission.objects.get_or_create(
        content_type=ct, codename=CODENAME, defaults={"name": "Can link a TeamSpeak identity"}
    )
    return perm


def grant_to_new_state(sender, instance, created, raw=False, **kwargs):
    if not created or raw or instance.public:
        return
    from django.contrib.auth.models import Permission
    from django.contrib.contenttypes.models import ContentType
    from django.db import transaction

    # After the save is done: Administration → Access saves the state, then sets its permissions to the ones ticked
    # in the form, which would take this away again straight away.
    transaction.on_commit(lambda: instance.permissions.add(access_permission(Permission, ContentType)))
