from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models


class SpySettings(models.Model):
    """Who is told about new findings and what the scan looks at. One row."""

    #: Told about new findings (those of its members who hold spycheck.view_findings). None: everyone who holds it.
    notify_group = models.ForeignKey(Group, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: Also watch the Blacklist plugin's entries, when it's installed and on.
    use_blacklist = models.BooleanField(default=True)
    #: Blacklist entries marked "watch" count too, not only "banned".
    blacklist_watch_entries = models.BooleanField(default=True)
    #: A contact counts when its standing is above this (0: any positive standing).
    min_standing = models.FloatField(default=0)
    #: Kinds of finding the scan leaves out (``Finding.Kind`` values).
    skip_kinds = models.JSONField(default=list, blank=True)
    #: What the last scan did, for the page.
    last_scan_at = models.DateTimeField(null=True, blank=True)
    last_scan_characters = models.PositiveIntegerField(default=0)
    last_scan_new = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Spy Check settings"

    @classmethod
    def load(cls) -> "SpySettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class WatchEntry(models.Model):
    """A character, corporation or alliance Spy Check looks for, kept here so it works without the Blacklist plugin."""

    class Kind(models.TextChoices):
        CHARACTER = "character", "Character"
        CORPORATION = "corporation", "Corporation"
        ALLIANCE = "alliance", "Alliance"

    kind = models.CharField(max_length=12, choices=Kind.choices)
    #: EVE ids don't repeat across characters, corporations and alliances, so the id alone is unique.
    eve_id = models.BigIntegerField(unique=True)
    name = models.CharField(max_length=200)
    reason = models.TextField(blank=True)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Finding(models.Model):
    """One member character's dealings of one kind with one watched entity, kept up to date by every scan."""

    class Kind(models.TextChoices):
        JOURNAL = "journal", "Wallet journal"
        MARKET = "market", "Market transactions"
        CONTRACT = "contract", "Contracts"
        MAIL = "mail", "Mail"
        CONTACT = "contact", "Contact with good standing"
        CORP_HISTORY = "corp_history", "Corporation history"

    class State(models.TextChoices):
        NEW = "new", "New"
        ACKNOWLEDGED = "acknowledged", "Acknowledged"
        DISMISSED = "dismissed", "Dismissed"

    class Source(models.TextChoices):
        BLACKLIST = "blacklist", "Blacklist"
        WATCH = "watch", "Watch list"

    #: Who owned the character at the last scan.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="spycheck_findings")
    character_id = models.BigIntegerField()
    character_name = models.CharField(max_length=100)
    kind = models.CharField(max_length=12, choices=Kind.choices)
    entity_id = models.BigIntegerField()
    entity_kind = models.CharField(max_length=12)
    entity_name = models.CharField(max_length=200)
    source = models.CharField(max_length=10, choices=Source.choices)
    #: The evidence: how many records, the ISK in them (a contact's standing), and the dates of the first and last
    #: one (none for contacts, which have no date).
    count = models.PositiveIntegerField(default=0)
    amount = models.DecimalField(max_digits=22, decimal_places=2, default=0)
    first_seen = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    #: Whether the last scan still found it (the entity may have left the watch list, or the data aged out).
    present = models.BooleanField(default=True)
    state = models.CharField(max_length=12, choices=State.choices, default=State.NEW, db_index=True)
    note = models.TextField(blank=True)
    decided_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    decided_at = models.DateTimeField(null=True, blank=True)
    #: The evidence as it was when someone acknowledged or dismissed it: newer evidence than this reopens a dismissal.
    decided_last_seen = models.DateTimeField(null=True, blank=True)
    decided_amount = models.DecimalField(max_digits=22, decimal_places=2, null=True, blank=True)
    found_at = models.DateTimeField(auto_now_add=True)
    #: When the scan last made it new (found it, or found newer evidence after a dismissal).
    flagged_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-flagged_at", "-pk"]
        constraints = [models.UniqueConstraint(fields=["character_id", "entity_id", "kind"], name="spycheck_finding_unique")]
        indexes = [models.Index(fields=["user", "state"])]
        permissions = [
            ("view_findings", "Can see Spy Check findings and their evidence, and acknowledge or dismiss them"),
            ("manage_spycheck", "Can change the Spy Check watch list and settings and start a scan"),
        ]
