"""Everyone may link Discord by default: every state gets ``discord.access_discord``. Admins can take it away
from a state afterwards (Administration → Access); only new states get it again."""

CODENAME = "access_discord"


def access_permission(Permission, ContentType):
    """The permission, created if Django hasn't yet (it does that only after all migrations ran)."""
    ct, _ = ContentType.objects.get_or_create(app_label="discord", model="discordaccount")
    perm, _ = Permission.objects.get_or_create(
        content_type=ct, codename=CODENAME, defaults={"name": "Can link a Discord account and join the server"}
    )
    return perm


def grant_to_new_state(sender, instance, created, raw=False, **kwargs):
    if not created or raw:
        return
    from django.contrib.auth.models import Permission
    from django.contrib.contenttypes.models import ContentType

    instance.permissions.add(access_permission(Permission, ContentType))
