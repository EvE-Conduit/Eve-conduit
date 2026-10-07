from decimal import Decimal

from django.conf import settings
from django.db import models


class SrpSettings(models.Model):
    """How ship replacement works on this site. One row."""

    #: Percent of the loss's value paid for ships without a rule.
    default_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("100.00"))
    #: Only ships (or ship groups) with a rule can be claimed.
    covered_only = models.BooleanField(default=False)
    #: Losses older than this can't be claimed.
    max_age_days = models.PositiveIntegerField(default=30)
    #: Members must say which fleet they lost the ship in.
    require_fleet = models.BooleanField(default=True)
    #: Corporation ids whose losses count; empty means every corporation.
    corporations = models.JSONField(default=list, blank=True)
    #: Shown to members, e.g. "Payouts go out every Sunday. Only doctrine fits on CTA fleets."
    rules_text = models.TextField(blank=True)

    @classmethod
    def load(cls) -> "SrpSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ShipRule(models.Model):
    """What a ship (or every ship in a group, e.g. all Logistics Cruisers) pays out.

    A rule for a ship wins over one for its group. ``payout`` is a fixed amount; otherwise ``percent`` of the loss's
    value. ``covered = False`` means it is never replaced (pods, shuttles...).
    """

    type_id = models.IntegerField(null=True, blank=True, unique=True)
    group_id = models.IntegerField(null=True, blank=True, unique=True)
    name = models.CharField(max_length=200)
    covered = models.BooleanField(default=True)
    payout = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(type_id__isnull=False, group_id__isnull=True) | models.Q(type_id__isnull=True, group_id__isnull=False),
                name="srp_rule_type_or_group",
            ),
        ]


class SrpRequest(models.Model):
    """A member asking for one loss to be replaced."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        PAID = "paid", "Paid"

    killmail = models.OneToOneField("sheet_killmails.Killmail", on_delete=models.CASCADE, related_name="srp_request")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="srp_requests")
    character_id = models.BigIntegerField()
    character_name = models.CharField(max_length=100)
    fleet = models.CharField(max_length=200, blank=True)
    fc = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    #: What the rules said when it was submitted (none: the ship isn't covered by a rule).
    suggested = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    #: What a reviewer approved.
    payout = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: Shown to the member, e.g. why it was rejected.
    decision_note = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("review_requests", "Can approve and reject SRP requests"),
            ("pay_requests", "Can see approved SRP requests and mark them paid"),
            ("manage_srp", "Can change SRP rules and payouts"),
        ]

    def __str__(self):
        return f"SRP #{self.pk} ({self.character_name})"
