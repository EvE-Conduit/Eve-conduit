from django.conf import settings
from django.db import models

CORP = "eve.EveCorporation"


class CorpBlueprint(models.Model):
    """One blueprint (or stack of originals) a corporation owns, read from ``/corporations/{id}/blueprints``."""

    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="+")
    item_id = models.BigIntegerField()
    type_id = models.IntegerField(db_index=True)
    location_id = models.BigIntegerField()
    #: The station, structure or system it ultimately sits in (through offices and containers).
    root_location_id = models.BigIntegerField()
    location_flag = models.CharField(max_length=60)
    #: Corporation hangar division (1-7) when it's in one, directly or inside a container.
    division = models.SmallIntegerField(null=True)
    #: -1 = original, -2 = copy, >0 = a stack of originals
    quantity = models.IntegerField()
    #: -1 = infinite (original)
    runs = models.IntegerField()
    material_efficiency = models.SmallIntegerField()
    time_efficiency = models.SmallIntegerField()

    class Meta:
        unique_together = [("corporation", "item_id")]
        permissions = [
            ("view_library", "Can see the blueprint library and request copies or loans"),
            ("manage_requests", "Can handle blueprint copy and loan requests"),
        ]

    @property
    def is_copy(self) -> bool:
        return self.quantity == -2


class LibrarySync(models.Model):
    """When a corporation's blueprints were last read, as whom, and how it went."""

    class Result(models.TextChoices):
        OK = "ok"
        ERROR = "error"
        NO_CHARACTER = "no_character"

    corporation = models.OneToOneField(CORP, primary_key=True, on_delete=models.CASCADE, related_name="+")
    result = models.CharField(max_length=20, choices=Result.choices, default=Result.OK)
    message = models.CharField(max_length=300, blank=True)
    #: The Director the last successful read ran as (tried first next time).
    character = models.ForeignKey("accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    last_attempt = models.DateTimeField(null=True, blank=True)
    last_success = models.DateTimeField(null=True, blank=True)
    blueprints = models.PositiveIntegerField(default=0)


class SharedCharacter(models.Model):
    """A member's character whose own originals show in the library (the member opted in)."""

    character = models.OneToOneField("accounts.Character", on_delete=models.CASCADE, related_name="+")
    #: Who shared it. Sharing only counts while the character still belongs to them.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)


class Request(models.Model):
    """A member asking for copies of a blueprint, or to borrow an original for a while."""

    class Kind(models.TextChoices):
        COPY = "copy", "Copies"
        LOAN = "loan", "Borrow the original"

    class Status(models.TextChoices):
        OPEN = "open", "Waiting for a manager"
        ACCEPTED = "accepted", "Accepted"
        IN_PROGRESS = "in_progress", "In progress"
        DELIVERED = "delivered", "Delivered"
        RETURNED = "returned", "Returned"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled"

    #: Still waiting on a manager to do something.
    ACTIVE = (Status.OPEN, Status.ACCEPTED, Status.IN_PROGRESS)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blueprint_requests")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.COPY)
    #: The blueprint asked for, and its name when asked, so the page works before the static data is imported.
    type_id = models.IntegerField()
    name = models.CharField(max_length=200)
    #: Copies: runs per copy and how many copies. Loans leave them at 1.
    runs = models.PositiveIntegerField(default=1)
    copies = models.PositiveIntegerField(default=1)
    #: Research wanted on the copies (None: whatever the library has).
    min_me = models.SmallIntegerField(null=True, blank=True)
    min_te = models.SmallIntegerField(null=True, blank=True)
    #: Loans: how many days the member wants it for; the due date is set when it's handed over.
    loan_days = models.PositiveSmallIntegerField(null=True, blank=True)
    note = models.CharField(max_length=500, blank=True)
    #: An Industry Projects project it's for (that plugin's id; no foreign key, it may not be installed).
    project_id = models.IntegerField(null=True, blank=True)
    project_name = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN, db_index=True)
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: What the manager said last ("ready in Jita hangar 3", "we don't copy capitals").
    response = models.CharField(max_length=500, blank=True)
    #: The corporation copying job doing it, from the core's corporation industry jobs.
    job_corporation_id = models.BigIntegerField(null=True, blank=True)
    job_id = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    #: When the borrower was last reminded that a loan is overdue.
    reminded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_active(self) -> bool:
        return self.status in self.ACTIVE

    @property
    def on_loan(self) -> bool:
        return self.kind == self.Kind.LOAN and self.status == self.Status.DELIVERED
