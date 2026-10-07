"""States decide what kind of member a person is; groups add roles on top."""

from django.contrib.auth.models import Group, Permission
from django.db import models
from django.utils import timezone

from evecsm.eve.models import EveAlliance, EveCorporation


class State(models.Model):
    """Membership tier such as Member, Blue or Guest, decided by the main character.

    A user gets the highest-priority state whose rules match their main character.
    A state marked ``public`` matches everyone and is the usual fallback (Guest).
    """

    name = models.CharField(max_length=50, unique=True)
    priority = models.IntegerField(unique=True, help_text="Higher wins when several states match")
    description = models.CharField(max_length=200, blank=True)
    color = models.CharField(max_length=7, default="#64748b")
    public = models.BooleanField(default=False, help_text="Matches every user")
    member_characters = models.ManyToManyField("accounts.Character", blank=True, related_name="+")
    member_corporations = models.ManyToManyField(EveCorporation, blank=True, related_name="+")
    member_alliances = models.ManyToManyField(EveAlliance, blank=True, related_name="+")
    permissions = models.ManyToManyField(Permission, blank=True, related_name="+")

    class Meta:
        ordering = ["-priority"]

    def __str__(self):
        return self.name

    def matches(self, character) -> bool:
        if self.public:
            return True
        if character is None:
            return False
        return (
            self.member_characters.filter(pk=character.pk).exists()
            or (character.corporation_id and self.member_corporations.filter(pk=character.corporation_id).exists())
            or (character.alliance_id and self.member_alliances.filter(pk=character.alliance_id).exists())
        )


class GroupProfile(models.Model):
    """Extra settings on top of a Django auth group."""

    class JoinMode(models.TextChoices):
        OPEN = "open", "Anyone allowed can join"
        REQUEST = "request", "Ask a group leader"
        CLOSED = "closed", "Only leaders and admins add members"

    class LeaveMode(models.TextChoices):
        OPEN = "open", "Members can leave"
        REQUEST = "request", "Ask a group leader"
        CLOSED = "closed", "Only leaders and admins remove members"

    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name="profile")
    description = models.CharField(max_length=300, blank=True)
    color = models.CharField(max_length=7, default="#38bdf8")
    join_mode = models.CharField(max_length=10, choices=JoinMode.choices, default=JoinMode.CLOSED)
    leave_mode = models.CharField(max_length=10, choices=LeaveMode.choices, default=LeaveMode.OPEN)
    hidden = models.BooleanField(default=False, help_text="Not listed to users who are not members")
    allowed_states = models.ManyToManyField(
        State, blank=True, related_name="groups", help_text="Leave empty to allow every state"
    )
    #: People who handle requests and members (but not the group's settings).
    leaders = models.ManyToManyField("accounts.User", blank=True, related_name="led_groups")
    #: Every member of these groups leads this one too.
    leader_groups = models.ManyToManyField(Group, blank=True, related_name="+")
    #: Rule set (see ``rules.py``) a user must pass to join or ask to join.
    requirements = models.JSONField(default=dict, blank=True)
    #: Smart group: membership is managed entirely by ``rules``.
    auto = models.BooleanField(default=False)
    rules = models.JSONField(default=dict, blank=True)
    #: Remove members who stop matching (otherwise smart groups only ever add).
    auto_remove = models.BooleanField(default=True)
    #: How long a member may fail the rules before being removed.
    grace_hours = models.PositiveIntegerField(default=0)
    last_evaluated = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.group.name

    # Older code and the external API speak of "joinable" groups.
    @property
    def joinable(self) -> bool:
        return self.join_mode == self.JoinMode.OPEN and not self.auto

    @joinable.setter
    def joinable(self, value: bool):
        self.join_mode = self.JoinMode.OPEN if value else self.JoinMode.CLOSED
        self.leave_mode = self.LeaveMode.OPEN if value else self.LeaveMode.CLOSED

    def allows(self, user) -> bool:
        if not self.pk or not self.allowed_states.exists():
            return True
        return user.state_id is not None and self.allowed_states.filter(pk=user.state_id).exists()

    def leader_users(self):
        from evecsm.accounts.models import User

        return User.objects.filter(
            models.Q(led_groups=self) | models.Q(groups__in=self.leader_groups.all()), is_active=True
        ).distinct()

    def is_leader(self, user) -> bool:
        if not user.is_authenticated:
            return False
        return self.leaders.filter(pk=user.pk).exists() or self.leader_groups.filter(user=user).exists()


class GroupRequest(models.Model):
    """A user asking to join or leave a group that needs a leader's approval."""

    class Kind(models.TextChoices):
        JOIN = "join"
        LEAVE = "leave"

    class Status(models.TextChoices):
        PENDING = "pending"
        APPROVED = "approved"
        REJECTED = "rejected"
        CANCELLED = "cancelled"

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="group_requests")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="requests")
    kind = models.CharField(max_length=5, choices=Kind.choices, default=Kind.JOIN)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True)
    message = models.CharField(max_length=500, blank=True)
    response = models.CharField(max_length=500, blank=True)
    decided_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(default=timezone.now)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "group", "kind"], condition=models.Q(status="pending"), name="one_pending_group_request"
            )
        ]

    def __str__(self):
        return f"{self.user} {self.kind} {self.group} ({self.status})"


class AutoGroupGrace(models.Model):
    """A smart-group member who stopped matching the rules, kept until the grace period ends."""

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="+")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="+")
    failing_since = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = [("user", "group")]


class ComplianceStatus(models.Model):
    """The last known compliance of a user, so changes can be announced."""

    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, primary_key=True, related_name="compliance")
    compliant = models.BooleanField(default=False)
    problems = models.JSONField(default=list, blank=True)
    warnings = models.JSONField(default=list, blank=True)
    checked_at = models.DateTimeField(default=timezone.now)
    changed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name_plural = "compliance statuses"
        permissions = [("view_compliance", "Can see which members' characters need attention")]
