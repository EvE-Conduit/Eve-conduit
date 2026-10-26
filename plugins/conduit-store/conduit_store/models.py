from django.conf import settings
from django.db import models
from django.db.models import Q


class StoreSettings(models.Model):
    """How many points each thing earns. One row; 0 switches a source off."""

    #: To the member named as referrer when the recruit is accepted (Recruitment plugin).
    referral_points = models.PositiveIntegerField(default=0)
    #: To each member in a fleet, once per fleet, when it ends (Fleets plugin).
    fleet_points = models.PositiveIntegerField(default=0)
    #: To the mentor when their mentee graduates (Mentoring plugin).
    mentor_points = models.PositiveIntegerField(default=0)
    #: Industry Projects sets the points per delivery itself; this only switches it off.
    projects_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Store settings"

    @classmethod
    def load(cls) -> "StoreSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Item(models.Model):
    """Something members can buy with points. Officers hand it over in game."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    #: An EVE type, for its icon.
    type_id = models.IntegerField(null=True, blank=True)
    price = models.PositiveIntegerField()
    #: None: as many as people want.
    stock = models.PositiveIntegerField(null=True, blank=True)
    #: None: no limit. Counts every order that wasn't cancelled.
    per_member_limit = models.PositiveIntegerField(null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]
        permissions = [
            ("manage_store", "Can set up the Corp Store: items, how points are earned, and awarding points by hand"),
            ("fulfil_orders", "Can hand over Corp Store orders and cancel them"),
        ]

    def __str__(self):
        return self.name


class PointEntry(models.Model):
    """One line of a member's points. Their balance is the sum."""

    class Source(models.TextChoices):
        REFERRAL = "referral", "Referral"
        FLEET = "fleet", "Fleet"
        MENTOR = "mentor", "Mentoring"
        PROJECTS = "projects", "Industry project"
        MANUAL = "manual", "Awarded by hand"
        ORDER = "order", "Order"
        REFUND = "refund", "Refund"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="store_points")
    points = models.IntegerField()
    reason = models.CharField(max_length=300)
    source = models.CharField(max_length=20, choices=Source.choices, db_index=True)
    #: What it was for, e.g. "fleet:12:34". The same thing is never paid twice.
    ref = models.CharField(max_length=80, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name_plural = "point entries"
        constraints = [models.UniqueConstraint(fields=["source", "ref"], condition=~Q(ref=""), name="store_point_once")]


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Waiting"
        FULFILLED = "fulfilled", "Handed over"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="store_orders")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="orders")
    quantity = models.PositiveIntegerField(default=1)
    #: What it cost in all, at the price of the day.
    points = models.PositiveIntegerField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True)
    #: From whoever handed it over or cancelled it, to the member.
    note = models.TextField(blank=True)
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    handled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
