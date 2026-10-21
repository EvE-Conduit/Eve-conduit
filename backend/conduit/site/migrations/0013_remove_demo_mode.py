from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("site", "0012_demo_mode"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="sitesettings",
            name="demo_mode",
        ),
    ]
