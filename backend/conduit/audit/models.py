from django.db import models
from django.utils import timezone


class AuditEvent(models.Model):
    """Something a person, an API key or the system changed. Names are copied in, so events
    stay readable after the user, key or group is gone."""

    class Actor(models.TextChoices):
        USER = "user"
        API_KEY = "api_key"
        SYSTEM = "system"

    at = models.DateTimeField(default=timezone.now, db_index=True)
    action = models.CharField(max_length=60, db_index=True)  # e.g. "group.member_added"
    summary = models.CharField(max_length=400)
    actor_type = models.CharField(max_length=10, choices=Actor.choices, default=Actor.SYSTEM)
    actor_id = models.BigIntegerField(null=True, blank=True)
    actor_name = models.CharField(max_length=150, blank=True)
    target_type = models.CharField(max_length=40, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    target_name = models.CharField(max_length=200, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]
        indexes = [models.Index(fields=["actor_type", "actor_id"])]

    def __str__(self):
        return self.summary


class ServiceLog(models.Model):
    """A warning or error the application logged (see logging.DatabaseLogHandler)."""

    at = models.DateTimeField(default=timezone.now, db_index=True)
    level = models.CharField(max_length=10, db_index=True)
    logger = models.CharField(max_length=200)
    message = models.TextField()
    traceback = models.TextField(blank=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return f"{self.level} {self.logger}: {self.message[:80]}"


class SnoopEvent(models.Model):
    """Someone opened another member's character sheet (HR, recruiters, directors...).
    Looking at your own characters is never recorded. Names are copied in, like AuditEvent."""

    at = models.DateTimeField(default=timezone.now, db_index=True)
    viewer_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    viewer_name = models.CharField(max_length=150)
    # Set while an admin is signed in as someone else: who they were signed in as.
    impersonating = models.CharField(max_length=150, blank=True)
    character_id = models.BigIntegerField(db_index=True)
    character_name = models.CharField(max_length=200)
    owner_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    owner_name = models.CharField(max_length=150, blank=True)
    section = models.CharField(max_length=40)  # "sheet" for the header, otherwise e.g. "wallet"
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-id"]
        indexes = [models.Index(fields=["viewer_id", "character_id", "section", "at"])]

    def __str__(self):
        return f"{self.viewer_name} viewed {self.character_name} ({self.section})"
