from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mentors", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="goal",
            name="focus",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
