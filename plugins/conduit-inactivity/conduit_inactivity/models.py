from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models


class InactivitySettings(models.Model):
    """What counts as activity and who is checked. One row."""

    #: Members with no activity for this many days are inactive.
    days = models.PositiveIntegerField(default=30)
    #: Signals: a member is active when any switched-on one is within ``days``.
    use_site = models.BooleanField(default=True)
    use_game = models.BooleanField(default=True)
    use_fleets = models.BooleanField(default=True)
    #: Who is checked: members in any of these states (none: every member) and any of these groups (none: no limit).
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField(Group, blank=True, related_name="+")
    leave_needs_approval = models.BooleanField(default=True)
    max_leave_days = models.PositiveIntegerField(default=90)
    #: Send the member a notification when they're first flagged.
    notify_member = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Inactivity settings"
        permissions = [
            ("view_inactivity", "Can see which members are inactive and every leave of absence"),
            ("manage_leave", "Can approve leave of absence and change the inactivity settings"),
        ]

    @classmethod
    def load(cls) -> "InactivitySettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Leave(models.Model):
    """A member's leave of absence. While an approved one runs they aren't flagged."""

    class Status(models.TextChoices):
        PENDING = "pending", "Waiting for approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    LIVE = (Status.PENDING, Status.APPROVED)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inactivity_leaves")
    start = models.DateField()
    end = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True)
    #: What the manager wrote when deciding.
    note = models.TextField(blank=True)
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start", "-pk"]


class Activity(models.Model):
    """A member's last activity per signal, worked out by the daily check so the list loads fast."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inactivity")
    last_site = models.DateTimeField(null=True)
    last_game = models.DateTimeField(null=True)
    last_fleet = models.DateTimeField(null=True)
    #: The latest of the switched-on signals, and never earlier than when they joined the site.
    last_active = models.DateTimeField(null=True)
    inactive = models.BooleanField(default=False, db_index=True)
    #: When they were first flagged; cleared when they're active again (so the next time is told again).
    inactive_since = models.DateTimeField(null=True, blank=True)
    checked_at = models.DateTimeField(auto_now=True)
