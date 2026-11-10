from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("timers", "0003_corporation_only")]

    operations = [
        migrations.AddField(
            model_name="timersettings",
            name="notifications_handled",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
