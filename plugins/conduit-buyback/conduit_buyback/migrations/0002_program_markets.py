# Programs pick their own market, so prices and history are kept per market. Both are caches: they're dropped and
# read again (ESI) or fetched when next needed (Fuzzwork, Janice).
from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("buyback", "0001_initial"),
    ]

    operations = [
        migrations.AddField(model_name="program", name="hub_id", field=models.BigIntegerField(blank=True, null=True)),
        migrations.AddField(model_name="program", name="hub_name", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="quote", name="hub_name", field=models.CharField(blank=True, max_length=100)),
        migrations.RemoveField(model_name="buybacksettings", name="market_pulled_at"),
        migrations.RemoveField(model_name="buybacksettings", name="market_note"),
        migrations.CreateModel(
            name="MarketRead",
            fields=[
                ("hub_id", models.BigIntegerField(primary_key=True, serialize=False)),
                ("pulled_at", models.DateTimeField(blank=True, null=True)),
                ("note", models.CharField(blank=True, max_length=300)),
            ],
        ),
        migrations.DeleteModel(name="ItemPrice"),
        migrations.CreateModel(
            name="ItemPrice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("hub_id", models.BigIntegerField(default=60003760)),
                ("type_id", models.IntegerField()),
                ("buy", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=20)),
                ("sell", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=20)),
                ("updated_at", models.DateTimeField()),
            ],
            options={"constraints": [models.UniqueConstraint(fields=("hub_id", "type_id"), name="buyback_item_price_unique")]},
        ),
        migrations.DeleteModel(name="PriceHistory"),
        migrations.CreateModel(
            name="PriceHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("region_id", models.IntegerField()),
                ("type_id", models.IntegerField()),
                ("days", models.JSONField(default=list)),
                ("updated_at", models.DateTimeField()),
            ],
            options={"constraints": [models.UniqueConstraint(fields=("region_id", "type_id"), name="buyback_price_history_unique")]},
        ),
    ]
