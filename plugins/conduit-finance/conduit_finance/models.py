from django.conf import settings
from django.db import models


class FinanceSettings(models.Model):
    """Finance-wide options. One row."""

    #: Corporation ids whose wallets count; empty means every corporation with synced wallets.
    corporations = models.JSONField(default=list, blank=True)
    #: Told when a month's report is ready (those of them with finance.view_finance); empty tells nobody.
    report_group = models.ForeignKey("auth.Group", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        verbose_name_plural = "Finance settings"
        permissions = [
            ("view_finance", "Can view corporation finance reports (for corporations whose wallets they may see)"),
            ("manage_finance", "Can set finance categories, counterparty tags and the monthly report"),
        ]

    @classmethod
    def load(cls) -> "FinanceSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class CategoryOverride(models.Model):
    """An officer moved a journal ref type to another category than the built-in table says."""

    ref_type = models.CharField(max_length=60, unique=True)
    category = models.CharField(max_length=60)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["ref_type"]


class CounterpartyRule(models.Model):
    """Money to or from someone goes in a category, e.g. "paid to SRP Holding = SRP payouts". Wins over ref types."""

    class Direction(models.TextChoices):
        IN = "in", "Money from them"
        OUT = "out", "Money to them"
        BOTH = "both", "Both ways"

    #: A character, corporation or alliance id.
    party_id = models.BigIntegerField(db_index=True)
    #: Its name when the rule was made, in case the name lookup doesn't know it.
    party_name = models.CharField(max_length=200, blank=True)
    direction = models.CharField(max_length=4, choices=Direction.choices, default=Direction.BOTH)
    category = models.CharField(max_length=60)
    #: Only in this corporation's wallets; empty means every corporation.
    corporation_id = models.BigIntegerField(null=True, blank=True)
    note = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "party_name", "pk"]


class MonthReport(models.Model):
    """A month whose report went out. Stops it being announced twice; ``totals`` is what was announced."""

    month = models.DateField(unique=True)  # first day of the month
    sent_at = models.DateTimeField(auto_now_add=True)
    totals = models.JSONField(default=dict)

    class Meta:
        ordering = ["-month"]
