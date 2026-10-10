from django.db import migrations

from conduit_teamspeak.defaults import access_permission


def grant_to_member_states(apps, schema_editor):
    perm = access_permission(apps.get_model("auth", "Permission"), apps.get_model("contenttypes", "ContentType"))
    for state in apps.get_model("access", "State").objects.filter(public=False):
        state.permissions.add(perm)


class Migration(migrations.Migration):
    """Every members' state may use TeamSpeak by default."""

    dependencies = [
        ("teamspeak", "0001_initial"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [migrations.RunPython(grant_to_member_states, migrations.RunPython.noop)]
