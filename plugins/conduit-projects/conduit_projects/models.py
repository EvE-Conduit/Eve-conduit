from django.conf import settings
from django.db import models


class Project(models.Model):
    """Something the corporation wants built, e.g. "20 Hurricanes for the deployment"."""

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        DONE = "done", "Done"
        CANCELLED = "cancelled", "Cancelled"

    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    #: Where to deliver, e.g. "Corp hangar, 1DQ1-A Keepstar".
    location = models.CharField(max_length=200, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN, db_index=True)
    #: Who it's for: users in any of these states or groups. Both empty means every member.
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [("manage_projects", "Can run industry projects and confirm deliveries")]

    def __str__(self):
        return self.name


class Item(models.Model):
    """One thing a project needs, and how much of it."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="items")
    type_id = models.IntegerField()
    #: The type's name when it was added, so the page works before the static data is imported.
    name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    #: Corp Store points per unit delivered (paid by the Corp Store plugin, when it's installed).
    points_per_unit = models.PositiveIntegerField(default=0)
    #: ISK the corporation pays per unit delivered. Only shown: paying it is up to the corporation.
    isk_per_unit = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "pk"]


class Contribution(models.Model):
    """A member's share of an item: claimed, then delivered, then confirmed by a manager."""

    class Status(models.TextChoices):
        CLAIMED = "claimed", "Claimed"
        DELIVERED = "delivered", "Delivered, waiting for a manager"
        CONFIRMED = "confirmed", "Confirmed"

    OPEN = (Status.CLAIMED, Status.DELIVERED)

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="contributions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_contributions")
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CLAIMED, db_index=True)
    #: What the member wrote when delivering ("in the corp hangar, 2nd division").
    note = models.CharField(max_length=500, blank=True)
    #: Why a manager sent a delivery back.
    review_note = models.CharField(max_length=500, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            # One open claim per member and item; once confirmed they can claim more.
            models.UniqueConstraint(fields=["item", "user"], condition=models.Q(status__in=["claimed", "delivered"]),
                                    name="projects_one_open_claim"),
        ]

    @property
    def is_open(self) -> bool:
        return self.status in self.OPEN
