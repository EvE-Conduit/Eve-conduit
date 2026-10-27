from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models


def default_thresholds() -> list[int]:
    return [168, 72, 24]


class StructuresSettings(models.Model):
    """Plugin-wide options. One row."""

    #: Warn when a structure's fuel falls below each of these, in hours (7, 3 and 1 days).
    thresholds = models.JSONField(default=default_thresholds)
    #: Who is told: members of these groups who may see the structure's corporation. None: everyone who may see it.
    groups = models.ManyToManyField(Group, blank=True, related_name="+")
    #: Send notifications at all (the events go out either way).
    notify = models.BooleanField(default=True)
    #: The fuel plan tops every structure up to this many days.
    plan_days = models.PositiveSmallIntegerField(default=30)
    #: How long "I'm refuelling this" lasts if the fuel never goes up.
    claim_hours = models.PositiveSmallIntegerField(default=48)

    class Meta:
        verbose_name_plural = "Structures settings"
        permissions = [("manage_structures", "Can set fuel warning thresholds, who is warned, and per-structure overrides")]

    @classmethod
    def load(cls) -> "StructuresSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class StructureFuel(models.Model):
    """What this plugin keeps about one of the core's structures: overrides, and which warnings went out.

    Keyed by the structure id rather than a foreign key, so a structure briefly missing from a corporation sync (and
    deleted by the core) keeps its overrides when it comes back.
    """

    structure_id = models.BigIntegerField(unique=True)
    #: Thresholds for this structure in hours; null uses the settings', [] means never warn.
    thresholds = models.JSONField(null=True, blank=True)
    #: Groups it with others on the fuel plan ("Home staging"); empty groups it by solar system.
    staging = models.CharField(max_length=100, blank=True)
    #: Thresholds (hours) already warned about. One is cleared once the fuel is back above it, so it warns again.
    warned = models.JSONField(default=list)
    #: The fuel expiry and burn seen by the last check, to tell a refuel from a service going offline.
    last_fuel_expires = models.DateTimeField(null=True, blank=True)
    last_burn = models.FloatField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class Claim(models.Model):
    """A member saying they're refuelling a structure. Cleared when its fuel goes up, or after ``claim_hours``."""

    structure_id = models.BigIntegerField(db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    note = models.CharField(max_length=200, blank=True)
    #: The structure's fuel expiry and burn when claimed: the fuel going up from here means it's done.
    fuel_expires = models.DateTimeField(null=True, blank=True)
    burn = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [models.UniqueConstraint(fields=["structure_id", "user"], name="structures_one_claim_per_member")]
