from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class SessionQuerySet(models.QuerySet):
    def running(self):
        return self.filter(ended_at__isnull=True, ends_at__gt=timezone.now())


class Session(models.Model):
    """Following one member (every character they have, alts linked later included) for a set number of days."""

    #: The member being tracked. They are never told.
    target = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    #: Their main when tracking started, for the list once they've changed it.
    target_name = models.CharField(max_length=100)
    started_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reason = models.TextField(blank=True)
    days = models.PositiveSmallIntegerField()
    started_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField()
    #: When it finished: at ``ends_at``, or earlier when someone stopped it.
    ended_at = models.DateTimeField(null=True, blank=True)
    stopped_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    objects = SessionQuerySet.as_manager()

    class Meta:
        ordering = ["-started_at"]
        constraints = [
            # One running session per member; finished ones are kept for their reports.
            models.UniqueConstraint(fields=["target"], condition=Q(ended_at__isnull=True), name="tracking_one_open_session"),
        ]
        permissions = [("track_members", "Can track members' activity and read the reports")]

    def __str__(self):
        return f"Tracking {self.target_name}"

    @property
    def period_end(self):
        """Where the report stops: when it finished, or now while it runs."""
        return self.ended_at or min(timezone.now(), self.ends_at)

    @property
    def running(self) -> bool:
        return self.ended_at is None and self.ends_at > timezone.now()


class TrackedCharacter(models.Model):
    """One of the member's characters in a session, and how the last poll of it went."""

    class Status(models.TextChoices):
        OK = "ok", "Tracked"
        MISSING_SCOPES = "missing_scopes", "Missing ESI scopes"
        TOKEN_INVALID = "token_invalid", "Login no longer works"
        ERROR = "error", "ESI error"
        GONE = "gone", "No longer theirs"

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="characters")
    character_id = models.BigIntegerField()
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OK)
    status_detail = models.CharField(max_length=300, blank=True)
    online = models.BooleanField(null=True)
    first_polled_at = models.DateTimeField(null=True, blank=True)
    last_polled_at = models.DateTimeField(null=True, blank=True)
    #: The stint the last poll added to, while the character stays online.
    current_stint = models.ForeignKey("Stint", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["session", "character_id"], name="tracking_character_unique")]


class Stint(models.Model):
    """A stretch of time a character was online in one place in one ship. Each poll that finds it unchanged moves
    ``ended_at`` on; anything else starts a new stint."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="stints")
    character_id = models.BigIntegerField()
    solar_system_id = models.IntegerField()
    station_id = models.BigIntegerField(null=True, blank=True)
    structure_id = models.BigIntegerField(null=True, blank=True)
    ship_type_id = models.IntegerField(null=True, blank=True)
    ship_name = models.CharField(max_length=100, blank=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()

    class Meta:
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["session", "started_at"])]

    @property
    def docked_at(self) -> int | None:
        return self.station_id or self.structure_id

    def same_place(self, solar_system_id, station_id, structure_id, ship_type_id, ship_name) -> bool:
        return (self.solar_system_id, self.station_id, self.structure_id, self.ship_type_id, self.ship_name) == (
            solar_system_id, station_id, structure_id, ship_type_id, ship_name)
