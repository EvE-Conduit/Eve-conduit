from decimal import Decimal

from django.db import models

D0 = Decimal("0")


class Service(models.Model):
    """A freight service: who hauls, for whom, and the routes it runs."""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    #: Courier contracts go to this character, or to its corporation with ``is_corporation``. Its login reads them.
    owner = models.ForeignKey("accounts.Character", null=True, on_delete=models.SET_NULL, related_name="+")
    is_corporation = models.BooleanField(default=True)
    #: What customers set in the contract: how long the hauler has once they accept, and how long it stays up.
    days_to_complete = models.PositiveSmallIntegerField(default=3)
    expiration_days = models.PositiveSmallIntegerField(default=7)
    #: Who may use it: these states or groups (both empty: every member).
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    #: Anyone can use the calculator, without an account.
    public = models.BooleanField(default=False)
    #: Haulers and freight managers hear about new contracts.
    notify = models.BooleanField(default=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        permissions = [
            ("view_contracts", "Can see the hauling queue: every courier contract to the freight services"),
            ("manage_freight", "Can create and change freight services, their routes and rates"),
        ]

    def __str__(self):
        return self.name

    @property
    def owner_corporation_id(self) -> int | None:
        return self.owner.corporation_id if self.owner else None

    @property
    def assignee_id(self) -> int | None:
        """Who contracts must be assigned to."""
        if not self.owner:
            return None
        return self.owner_corporation_id if self.is_corporation else self.owner_id


class Route(models.Model):
    """Where a service hauls between, and what it charges. Each end is a station or structure, or a whole system."""

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="routes")
    start_name = models.CharField(max_length=200)
    start_system_id = models.IntegerField()
    #: The station or structure. Without it, any pick-up in the system counts.
    start_location_id = models.BigIntegerField(null=True, blank=True)
    end_name = models.CharField(max_length=200)
    end_system_id = models.IntegerField()
    end_location_id = models.BigIntegerField(null=True, blank=True)
    #: Hauled the other way too, at the same rates.
    both_ways = models.BooleanField(default=True)
    #: Gate jumps between the two systems, from ESI's route finder or typed in; None: unknown.
    jumps = models.PositiveSmallIntegerField(null=True, blank=True)
    #: Reward = base + per m³ + per jump + percent of the collateral, and never under ``min_reward``.
    base_price = models.DecimalField(max_digits=16, decimal_places=2, default=D0)
    price_per_m3 = models.DecimalField(max_digits=12, decimal_places=2, default=D0)
    price_per_jump = models.DecimalField(max_digits=14, decimal_places=2, default=D0)
    collateral_percent = models.DecimalField(max_digits=5, decimal_places=2, default=D0)
    min_reward = models.DecimalField(max_digits=16, decimal_places=2, default=D0)
    #: Limits; 0: none.
    max_volume = models.FloatField(default=0)
    max_collateral = models.DecimalField(max_digits=20, decimal_places=2, default=D0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["start_name", "end_name"]

    def __str__(self):
        return f"{self.start_name} → {self.end_name}"


class Contract(models.Model):
    """A courier contract to a service's owner."""

    contract_id = models.BigIntegerField(unique=True)
    service = models.ForeignKey(Service, null=True, on_delete=models.CASCADE, related_name="contracts")
    #: The route it matches; empty when it matches none of the service's routes.
    route = models.ForeignKey(Route, null=True, blank=True, on_delete=models.SET_NULL, related_name="contracts")
    #: The assignee whose login found it.
    owner_id = models.BigIntegerField(db_index=True)
    issuer_id = models.BigIntegerField()
    issuer_corporation_id = models.BigIntegerField(null=True)
    assignee_id = models.BigIntegerField()
    acceptor_id = models.BigIntegerField(null=True)
    title = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=30, db_index=True)
    reward = models.DecimalField(max_digits=20, decimal_places=2, default=D0)
    collateral = models.DecimalField(max_digits=20, decimal_places=2, default=D0)
    volume = models.FloatField(default=0)
    days_to_complete = models.PositiveSmallIntegerField(null=True)
    start_location_id = models.BigIntegerField(null=True)
    end_location_id = models.BigIntegerField(null=True)
    date_issued = models.DateTimeField(db_index=True)
    date_expired = models.DateTimeField(null=True)
    date_accepted = models.DateTimeField(null=True)
    date_completed = models.DateTimeField(null=True)
    #: What the route charges for this volume and collateral; None without a route.
    expected_reward = models.DecimalField(max_digits=20, decimal_places=2, null=True)
    #: What the checks found: ``[{"code", "text", "severe"}]``.
    problems = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_issued"]

    @property
    def outstanding(self) -> bool:
        return self.status in ("outstanding", "in_progress")
