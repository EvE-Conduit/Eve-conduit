# Text size can now go below normal (-2 and -1), so the column must accept negatives.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_more_themes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userpreferences",
            name="text_scale",
            field=models.SmallIntegerField(default=0),
        ),
    ]
