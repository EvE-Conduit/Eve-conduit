import conduit.accounts.crypto
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("site", "0010_site_images"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="esi_client_id",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="esi_secret_key",
            field=conduit.accounts.crypto.EncryptedTextField(blank=True, default=""),
        ),
    ]
