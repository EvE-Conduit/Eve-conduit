from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("timers", "0002_ping"),
    ]

    operations = [
        migrations.AddField(
            model_name="timer",
            name="corporation_id",
            field=models.BigIntegerField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="timersettings",
            name="notifications_seen_id",
            field=models.BigIntegerField(blank=True, null=True),
        ),
    ]
