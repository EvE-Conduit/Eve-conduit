from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recruit", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="form",
            name="require_discord",
            field=models.BooleanField(default=True),
        ),
    ]
