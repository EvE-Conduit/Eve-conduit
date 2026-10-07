from decimal import Decimal

from django.conf import settings
from django.db import models


class MoonSettings(models.Model):
    """How moon tax works on this site. One row."""

    #: Percent of the mined ore's value members pay.
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("10.00"))
    #: Corporation ids whose moons count; empty means every corporation with mining data.
    corporations = models.JSONField(default=list, blank=True)
    #: Shown to members with what they owe, e.g. "Give the ISK to Moon Holding Corp, reason MOON-<month>".
    payment_instructions = models.TextField(blank=True)

    @classmethod
    def load(cls) -> "MoonSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class LedgerMonth(models.Model):
    """A finished month. Closing it fixes the ore prices and the tax rate, and creates what each member owes."""

    month = models.DateField(unique=True)  # first day of the month
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2)
    #: {type_id: ISK per unit} at closing, so the month's values never change afterwards.
    prices = models.JSONField(default=dict)
    closed_at = models.DateTimeField(auto_now_add=True)
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-month"]
        permissions = [
            ("view_ledger", "Can view everyone's moon mining"),
            ("manage_ledger", "Can set moon tax, close months and record payments"),
        ]


class Invoice(models.Model):
    """What one member owes in moon tax for a closed month."""

    month = models.ForeignKey(LedgerMonth, on_delete=models.CASCADE, related_name="invoices")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="moon_invoices")
    value = models.DecimalField(max_digits=20, decimal_places=2)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        unique_together = [("month", "user")]
        ordering = ["-month__month", "user_id"]
