from django.db import migrations, models


def staff_role_to_roles(apps, schema_editor):
    """The one staff role becomes the default, and is what tickets with a channel so far were visible to."""
    settings = apps.get_model("tickets", "TicketSettings").objects.filter(pk=1).first()
    if settings is None or not settings.staff_role_id:
        return
    settings.default_role_ids = [settings.staff_role_id]
    settings.save(update_fields=["default_role_ids"])
    apps.get_model("tickets", "Ticket").objects.exclude(channel_id="").update(roles=[{"id": settings.staff_role_id, "name": "Staff role"}])


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0003_transcripts"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketsettings",
            name="default_role_ids",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="ticket",
            name="roles",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(staff_role_to_roles, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="ticketsettings",
            name="staff_role_id",
        ),
    ]
