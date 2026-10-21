from django.conf import settings
from django.db import models


def default_reminders() -> list[int]:
    return [60, 15]


class OpsSettings(models.Model):
    """How the ops calendar works on this site. One row."""

    #: Minutes before an op starts at which reminders go out, e.g. [60, 15].
    reminder_minutes = models.JSONField(default=default_reminders, blank=True)
    #: How many days finished and cancelled ops stay on the calendar's list.
    keep_days = models.PositiveSmallIntegerField(default=14)
    #: Discord role ids new ops ping by default (when the Discord plugin is linked to a server).
    default_ping_roles = models.JSONField(default=list, blank=True)

    class Meta:
        permissions = [
            ("schedule_ops", "Can schedule ops and change or cancel the ones they made or lead"),
            ("manage_ops", "Can change and cancel any op and change the ops settings"),
        ]

    @classmethod
    def load(cls) -> "OpsSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Op(models.Model):
    """Something members are asked to turn up for at a set time."""

    class Kind(models.TextChoices):
        CTA = "cta", "CTA"
        STRATOP = "stratop", "Stratop"
        ROAM = "roam", "Roam"
        DEFENSE = "defense", "Home defense"
        MINING = "mining", "Mining"
        TRAINING = "training", "Training"
        SOCIAL = "social", "Social"
        OTHER = "other", "Other"

    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.ROAM)
    #: Form-up time, in EVE time (UTC).
    starts_at = models.DateTimeField(db_index=True)
    duration_minutes = models.PositiveIntegerField(default=120)
    #: The fleet commander, when they're on the site.
    fc = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: Who leads it, as typed, for FCs who aren't on the site (or "TBD").
    fc_name = models.CharField(max_length=100, blank=True)
    #: Where to form up, as typed ("Jita 4-4", "Home staging, fleet hangar").
    formup = models.CharField(max_length=120, blank=True)
    #: Comms, e.g. "Mumble: Ops 1".
    comms = models.CharField(max_length=120, blank=True)
    #: A doctrine from the Doctrines plugin. Not a foreign key, so this plugin works without it.
    doctrine_id = models.IntegerField(null=True, blank=True)
    #: The doctrine's name when it was picked (or a doctrine typed by hand), shown if the Doctrines plugin is gone.
    doctrine_name = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    #: Who it's for: users in any of these states or groups. Both empty means every member.
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    #: Everyone in the audience is expected: told when it's posted and reminded, even if they muted ops.
    important = models.BooleanField(default=False)
    #: Ask Discord webhooks to ping (their own mention, plus ``ping_roles``) when it's posted, moved and reminded.
    ping = models.BooleanField(default=False)
    #: Discord role ids to ping, on top of the webhook's own mention.
    ping_roles = models.JSONField(default=list, blank=True)
    cancelled = models.BooleanField(default=False)
    #: Reminder marks (minutes before) already sent.
    reminded = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]

    def __str__(self):
        return f"{self.title} ({self.get_kind_display()})"


class Rsvp(models.Model):
    """One member's answer to an op, with the character they'll bring."""

    class Answer(models.TextChoices):
        GOING = "going", "Going"
        MAYBE = "maybe", "Maybe"
        DECLINED = "declined", "Not going"

    op = models.ForeignKey(Op, on_delete=models.CASCADE, related_name="rsvps")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    answer = models.CharField(max_length=10, choices=Answer.choices)
    character = models.ForeignKey("accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: A short note for the FC ("logi if needed", "late by 20 min").
    note = models.CharField(max_length=120, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("op", "user")]
        ordering = ["updated_at"]
