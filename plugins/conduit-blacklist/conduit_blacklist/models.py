from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class EntryQuerySet(models.QuerySet):
    def active(self):
        return self.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))


class Entry(models.Model):
    """A character, corporation or alliance on the blacklist."""

    class Kind(models.TextChoices):
        CHARACTER = "character", "Character"
        CORPORATION = "corporation", "Corporation"
        ALLIANCE = "alliance", "Alliance"

    class Severity(models.TextChoices):
        WATCH = "watch", "Watch"
        BANNED = "banned", "Banned"

    kind = models.CharField(max_length=12, choices=Kind.choices)
    eve_id = models.BigIntegerField()
    name = models.CharField(max_length=200)
    reason = models.TextField(blank=True)
    severity = models.CharField(max_length=8, choices=Severity.choices, default=Severity.BANNED)
    #: Left blank, the entry never runs out.
    expires_at = models.DateTimeField(null=True, blank=True)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = EntryQuerySet.as_manager()

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["kind", "eve_id"], name="blacklist_entry_unique")]
        permissions = [
            ("view_blacklist", "Can see the blacklist and its warnings"),
            ("manage_blacklist", "Can add to the blacklist, change and remove entries"),
        ]

    def __str__(self):
        return self.name

    @property
    def expired(self) -> bool:
        return self.expires_at is not None and self.expires_at <= timezone.now()


class Note(models.Model):
    """A message in an entry's notes thread."""

    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Match(models.Model):
    """A member's or applicant's character that matched an entry. Found once; HR marks it as dealt with."""

    class Source(models.TextChoices):
        LINKED = "linked", "Linked a character"
        APPLIED = "applied", "Applied"
        CHECK = "check", "Regular check"

    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name="matches")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blacklist_matches")
    character_id = models.BigIntegerField()
    character_name = models.CharField(max_length=100)
    source = models.CharField(max_length=8, choices=Source.choices)
    found_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["-found_at"]
        constraints = [models.UniqueConstraint(fields=["entry", "character_id"], name="blacklist_match_unique")]
