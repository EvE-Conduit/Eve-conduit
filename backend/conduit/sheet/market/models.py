from django.db import models


class MarketOrder(models.Model):
    class State(models.TextChoices):
        OPEN = "open"
        CLOSED = "closed"  # filled or otherwise gone from ESI's open list
        CANCELLED = "cancelled"
        EXPIRED = "expired"

    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="market_orders")
    order_id = models.BigIntegerField()
    type_id = models.IntegerField()
    is_buy = models.BooleanField()
    is_corporation = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=20, decimal_places=2)
    volume_total = models.IntegerField()
    volume_remain = models.IntegerField()
    min_volume = models.IntegerField(null=True)
    escrow = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    issued = models.DateTimeField()
    duration = models.IntegerField()
    location_id = models.BigIntegerField()
    region_id = models.IntegerField()
    range = models.CharField(max_length=20)
    state = models.CharField(max_length=12, choices=State.choices, default=State.OPEN, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("character", "order_id")]
        ordering = ["-issued"]
