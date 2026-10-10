from django.conf import settings
from django.db import models


def default_reminders() -> list[int]:
    return [60, 15]


class TimerSettings(models.Model):
    """How timers work on this site. One row."""

    #: Minutes before a timer comes out at which reminders go out, e.g. [60, 15].
    reminder_minutes = models.JSONField(default=default_reminders, blank=True)
    #: Add timers for your corporations' reinforced structures (from the corporation sheet).
    import_structures = models.BooleanField(default=True)
    #: Add timers from members' in-game notifications (structure lost shields/armor, sovereignty, customs offices).
    import_notifications = models.BooleanField(default=True)
    #: How many days timers that have come out stay on the board.
    keep_days = models.PositiveSmallIntegerField(default=14)
    #: Notifications older than this were already looked at.
    notifications_seen_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        permissions = [("manage_timers", "Can add, edit and delete timers and change the timer settings")]

    @classmethod
    def load(cls) -> "TimerSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Timer(models.Model):
    """Something that comes out of reinforcement (or finishes anchoring) at a known time."""

    class Kind(models.TextChoices):
        ARMOR = "armor", "Armor"
        HULL = "hull", "Hull"
        ANCHORING = "anchoring", "Anchoring"
        UNANCHORING = "unanchoring", "Unanchoring"
        SOV = "sov", "Sovereignty"
        MOON = "moon", "Moon extraction"
        OTHER = "other", "Other"

    class Side(models.TextChoices):
        FRIENDLY = "friendly", "Ours"
        HOSTILE = "hostile", "Hostile"
        NEUTRAL = "neutral", "Neutral"

    class Source(models.TextChoices):
        MANUAL = "manual", "Added by hand"
        STRUCTURE = "structure", "Corporation structure"
        NOTIFICATION = "notification", "In-game notification"

    #: The structure's name as shown in game (or what to call the timer).
    name = models.CharField(max_length=200)
    #: Structure type by name ("Fortizar", "Customs Office"); free text so anything can be entered.
    structure_type = models.CharField(max_length=60, blank=True)
    #: The type's id when known, for its icon.
    type_id = models.IntegerField(null=True, blank=True)
    system = models.ForeignKey("sde.SolarSystem", on_delete=models.DO_NOTHING, db_constraint=False, related_name="+")
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.ARMOR)
    side = models.CharField(max_length=10, choices=Side.choices, default=Side.FRIENDLY)
    #: Who owns the structure (corporation or alliance name).
    owner = models.CharField(max_length=120, blank=True)
    ends_at = models.DateTimeField(db_index=True)
    notes = models.TextField(blank=True)
    #: Everyone is expected: members are notified when it's added and reminded before it comes out.
    important = models.BooleanField(default=False)
    source = models.CharField(max_length=14, choices=Source.choices, default=Source.MANUAL)
    #: The in-game structure id, for timers read from structures and notifications.
    structure_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    #: Reminder marks (minutes before) already sent.
    reminded = models.JSONField(default=list, blank=True)
    going = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="+")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["ends_at"]

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"
