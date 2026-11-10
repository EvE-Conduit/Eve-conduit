from django.db import migrations, models


def already_told(apps, schema_editor):
    """Members flagged before this update count as told about (when they were flagged), so the first daily check
    after it doesn't announce everyone who is inactive today all over again."""
    Activity = apps.get_model("inactivity", "Activity")
    Activity.objects.filter(inactive=True, inactive_since__isnull=False).update(notified_at=models.F("inactive_since"))


class Migration(migrations.Migration):

    dependencies = [
        ("inactivity", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="activity",
            name="notified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(already_told, migrations.RunPython.noop),
    ]
