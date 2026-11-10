from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sheet_calendar", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="calendarevent",
            name="fetch_failures",
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]
