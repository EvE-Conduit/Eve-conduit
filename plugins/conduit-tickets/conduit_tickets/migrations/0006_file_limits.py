from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0005_panels"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketsettings",
            name="file_keep_days",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="ticketsettings",
            name="file_storage_mb",
            field=models.PositiveIntegerField(default=5000),
        ),
    ]
