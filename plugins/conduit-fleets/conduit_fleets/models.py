import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class FleetType(models.Model):
    """A kind of fleet, e.g. CTA, Stratop, Roam. Group rules can count only some kinds."""

    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#38bdf8")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


def new_link_code() -> str:
    return secrets.token_urlsafe(9)


class Fleet(models.Model):
    name = models.CharField(max_length=120)
    fleet_type = models.ForeignKey(FleetType, null=True, blank=True, on_delete=models.SET_NULL, related_name="fleets")
    #: Shown with the fleet: doctrine, comms, staging.
    notes = models.TextField(blank=True)
    fc = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    started_at = models.DateTimeField(default=timezone.now, db_index=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    # Tracking the FC's in-game fleet through ESI.
    tracking_character = models.ForeignKey("accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    esi_fleet_id = models.BigIntegerField(null=True, blank=True)
    tracking = models.BooleanField(default=False, db_index=True)
    last_tracked_at = models.DateTimeField(null=True, blank=True)
    #: Why tracking stopped or isn't working; shown to the FC.
    tracking_error = models.CharField(max_length=300, blank=True)
    #: While tracking, add the FAT lines to the bottom of the in-game fleet's MOTD (``esi-fleets.write_fleet.v1``).
    motd = models.BooleanField(default=True)
    #: The FAT lines last written to the MOTD, so it's only written again when they change.
    motd_written = models.TextField(blank=True)
    #: Why the MOTD couldn't be written; shown to the FC.
    motd_error = models.CharField(max_length=300, blank=True)

    # The FAT link: pilots open /p/fleets/fat/<code> and register.
    link_code = models.CharField(max_length=20, default=new_link_code, unique=True)
    link_open = models.BooleanField(default=True)
    link_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
        permissions = [
            ("run_fleets", "Can start fleets, track them and hand out FAT links"),
            ("manage_fleets", "Can edit and delete any fleet, its FATs and fleet types, and see everyone's attendance"),
        ]

    def __str__(self):
        return self.name

    @property
    def link_active(self) -> bool:
        return self.link_open and self.ended_at is None and (self.link_expires_at is None or self.link_expires_at > timezone.now())


class Fat(models.Model):
    """One character was in one fleet."""

    class Via(models.TextChoices):
        ESI = "esi", "In-game fleet"
        LINK = "link", "FAT link"
        MANUAL = "manual", "Added by the FC"

    fleet = models.ForeignKey(Fleet, on_delete=models.CASCADE, related_name="fats")
    character_id = models.BigIntegerField(db_index=True)
    character_name = models.CharField(max_length=100)
    ship_type_id = models.IntegerField(null=True, blank=True)
    solar_system_id = models.IntegerField(null=True, blank=True)
    via = models.CharField(max_length=10, choices=Via.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        unique_together = [("fleet", "character_id")]
        ordering = ["character_name"]
