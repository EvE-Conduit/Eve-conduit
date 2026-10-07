from django.db import models
from django.utils import timezone


class SyncStatus(models.Model):
    """When each section of each character last synced, and how it went."""

    class Result(models.TextChoices):
        PENDING = "pending"
        OK = "ok"
        ERROR = "error"
        MISSING_SCOPES = "missing_scopes"
        TOKEN_INVALID = "token_invalid"

    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="sync_statuses")
    section = models.CharField(max_length=40)
    result = models.CharField(max_length=20, choices=Result.choices, default=Result.PENDING)
    message = models.CharField(max_length=300, blank=True)
    last_attempt = models.DateTimeField(null=True, blank=True)
    last_success = models.DateTimeField(null=True, blank=True)
    next_due = models.DateTimeField(default=timezone.now, db_index=True)
    failures = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [("character", "section")]
        verbose_name_plural = "sync statuses"
        permissions = [
            ("view_all_characters", "Can view every member's character data"),
            ("view_alliance_characters", "Can view character data of their alliance"),
            ("view_corporation_characters", "Can view character data of their corporation"),
            ("refresh_characters", "Can refresh character data from ESI now (characters they can view)"),
        ]


class Location(models.Model):
    """Names for stations, structures and other places items and characters can be."""

    class Kind(models.TextChoices):
        STATION = "station"
        STRUCTURE = "structure"
        SOLAR_SYSTEM = "solar_system"
        UNKNOWN = "unknown"

    id = models.BigIntegerField(primary_key=True)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    name = models.CharField(max_length=200)
    solar_system_id = models.IntegerField(null=True)
    type_id = models.IntegerField(null=True)
    owner_id = models.IntegerField(null=True)
    #: Structures we may not see; we retry these occasionally.
    resolved = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
