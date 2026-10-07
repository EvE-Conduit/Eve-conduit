from django.db import migrations

from conduit_discord.defaults import access_permission


def grant_to_every_state(apps, schema_editor):
    perm = access_permission(apps.get_model("auth", "Permission"), apps.get_model("contenttypes", "ContentType"))
    for state in apps.get_model("access", "State").objects.all():
        state.permissions.add(perm)


class Migration(migrations.Migration):
    """Linking Discord is allowed for every state by default, guests included (they need it to apply)."""

    dependencies = [
        ("discord", "0001_initial"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [migrations.RunPython(grant_to_every_state, migrations.RunPython.noop)]
