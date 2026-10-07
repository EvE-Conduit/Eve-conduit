from django.conf import settings
from django.db import models

DEFAULT_FOCUS = ["PvP", "PvE", "Industry", "Mining", "Exploration", "Wormholes", "Logistics", "Fleet doctrine", "Trading"]


def default_focus():
    return list(DEFAULT_FOCUS)


class Program(models.Model):
    """Program-wide options. One row."""

    #: What mentors can help with and new members can ask about.
    focus_areas = models.JSONField(default=default_focus)
    #: Mentors may open their active mentees' character sheets.
    sheet_access = models.BooleanField(default=True)
    #: Members matching this rule set (and who never had a mentor) are invited to ask for one. Empty: nobody is.
    suggest_rules = models.JSONField(default=dict, blank=True)
    #: The default goals were created (once, so deleting them sticks).
    seeded = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Mentoring program"

    @classmethod
    def load(cls) -> "Program":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class MentorProfile(models.Model):
    """A mentor's card: shown to new members picking a mentor."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentor_profile")
    #: Paused mentors keep their mentees but take no new ones.
    active = models.BooleanField(default=True)
    capacity = models.PositiveSmallIntegerField(default=3)
    bio = models.TextField(blank=True)
    #: Time zone or play hours, in their own words ("EU evenings").
    play_time = models.CharField(max_length=100, blank=True)
    focus = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class Mentorship(models.Model):
    class Status(models.TextChoices):
        WAITING = "waiting", "Waiting for a mentor"
        ACTIVE = "active", "Being mentored"
        GRADUATED = "graduated", "Graduated"
        ENDED = "ended", "Ended"

    OPEN = (Status.WAITING, Status.ACTIVE)

    mentee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentorships")
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="mentees")
    #: The mentor the new member asked for by name, if any.
    requested_mentor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.WAITING, db_index=True)
    focus = models.JSONField(default=list, blank=True)
    note = models.TextField(blank=True)
    play_time = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    end_reason = models.TextField(blank=True)
    ended_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("mentor", "Can mentor new members"),
            ("manage_program", "Can run the mentoring program"),
        ]

    @property
    def is_open(self) -> bool:
        return self.status in self.OPEN


class Goal(models.Model):
    """Something every mentee works toward. With a rule set it ticks itself; without, the mentor ticks it."""

    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    #: A group rule set (conduit.access.rules); empty means it's ticked by hand.
    rules = models.JSONField(default=dict, blank=True)
    #: The mentee may tick it themselves (goals without rules only).
    mentee_can_tick = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self):
        return self.title


class GoalCheck(models.Model):
    """A goal ticked by hand for one mentorship (or marked done by the mentor although its rules don't pass yet)."""

    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name="checks")
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="+")
    done_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    done_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("mentorship", "goal")]


class Message(models.Model):
    """The thread between mentor and mentee. Private notes are for mentors and program managers only."""

    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    text = models.TextField()
    private = models.BooleanField(default=False)
    #: Status changes are logged too ("assigned", "graduated"...).
    event = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
