# The smallest text size is now the default. Rows still on the old default (0) move with it; a size anyone
# picked other than the old default stays.

from django.db import migrations, models


def smallest_by_default(apps, schema_editor):
    apps.get_model("accounts", "UserPreferences").objects.filter(text_scale=0).update(text_scale=-2)


def back_to_normal(apps, schema_editor):
    apps.get_model("accounts", "UserPreferences").objects.filter(text_scale=-2).update(text_scale=0)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_text_scale_smaller"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userpreferences",
            name="text_scale",
            field=models.SmallIntegerField(default=-2),
        ),
        migrations.RunPython(smallest_by_default, back_to_normal),
    ]
