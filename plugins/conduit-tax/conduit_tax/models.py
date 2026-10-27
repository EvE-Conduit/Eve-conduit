from decimal import Decimal

from django.conf import settings
from django.db import models

#: Journal entries that are tax the corporation took from a member's income, and what to call them.
TAX_REF_TYPES = {
    "bounty_prizes": "Bounties",
    "ess_escrow_transfer": "ESS payouts",
    "agent_mission_reward": "Mission rewards",
    "agent_mission_time_bonus_reward": "Mission time bonuses",
}
DEFAULT_REF_TYPES = ["bounty_prizes", "ess_escrow_transfer"]


def default_ref_types():
    return list(DEFAULT_REF_TYPES)


class TaxSettings(models.Model):
    """How corp tax works on this site. One row."""

    #: Percent of the tax the corporation took in-game that members owe on top (100 = the same again).
    rate = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    #: Bills smaller than this many ISK aren't sent.
    minimum = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0.00"))
    #: Corporation ids whose wallets count; empty means every corporation with synced wallets.
    corporations = models.JSONField(default=list, blank=True)
    #: Which journal ref types count (keys of TAX_REF_TYPES).
    ref_types = models.JSONField(default=default_ref_types, blank=True)
    #: Shown to members with what they owe, e.g. "Give the ISK to Holding Corp with the reason on your bill".
    payment_instructions = models.TextField(blank=True)
    #: Donations to a tax corporation whose reason has this word in it are counted as tax payments; empty switches it off.
    payment_reason = models.CharField(max_length=40, blank=True, default="TAX")
    #: Remind members with unpaid bills every this many days; 0 never.
    reminder_days = models.PositiveSmallIntegerField(default=7)

    @classmethod
    def load(cls) -> "TaxSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class LedgerMonth(models.Model):
    """A finished month. Closing it fixes the rate and creates what each member owes."""

    month = models.DateField(unique=True)  # first day of the month
    rate = models.DecimalField(max_digits=6, decimal_places=2)
    minimum = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0.00"))
    closed_at = models.DateTimeField(auto_now_add=True)
    closed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-month"]
        permissions = [
            ("view_ledger", "Can view everyone's corp tax"),
            ("manage_ledger", "Can set corp tax, close months and record payments"),
        ]


class Invoice(models.Model):
    """What one member owes for a closed month."""

    month = models.ForeignKey(LedgerMonth, on_delete=models.CASCADE, related_name="invoices")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tax_invoices")
    #: The tax the corporation took from the member that month.
    collected = models.DecimalField(max_digits=20, decimal_places=2)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    #: Who marked it; empty when a payment from the wallet journal settled it.
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reminded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("month", "user")]
        ordering = ["-month__month", "user_id"]


class Payment(models.Model):
    """A donation to a tax corporation that was taken as a member's tax payment."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tax_payments")
    #: The corporation wallet journal entry (``conduit.corp.models.CorpJournalEntry``) it came from.
    journal_entry_id = models.BigIntegerField(unique=True)
    corporation_id = models.BigIntegerField()
    character_id = models.BigIntegerField()
    date = models.DateTimeField()
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    #: What's left of it after settling bills.
    remaining = models.DecimalField(max_digits=20, decimal_places=2)
    reason = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["date", "pk"]


class Settlement(models.Model):
    """How much of a payment went to a bill, so marking the bill unpaid can give it back."""

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="settlements")
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="settlements")
    amount = models.DecimalField(max_digits=20, decimal_places=2)
