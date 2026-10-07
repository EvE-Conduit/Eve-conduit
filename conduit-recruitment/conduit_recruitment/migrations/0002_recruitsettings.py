from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("recruit", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RecruitSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("require_discord", models.BooleanField(default=False)),
            ],
            options={"verbose_name_plural": "Recruitment settings"},
        ),
    ]
