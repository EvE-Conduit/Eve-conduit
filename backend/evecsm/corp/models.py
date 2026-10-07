"""Corporation sheet data. Every row hangs off an ``EveCorporation``."""

from django.db import models
from django.utils import timezone

CORP = "eve.EveCorporation"


class CorpSyncStatus(models.Model):
    """When each section of each corporation last synced, as whom, and how it went."""

    class Result(models.TextChoices):
        PENDING = "pending"
        OK = "ok"
        ERROR = "error"
        NO_CHARACTER = "no_character"

    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="sync_statuses")
    section = models.CharField(max_length=40)
    result = models.CharField(max_length=20, choices=Result.choices, default=Result.PENDING)
    message = models.CharField(max_length=300, blank=True)
    #: The member character the last successful sync ran as (tried first next time).
    character = models.ForeignKey("accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    last_attempt = models.DateTimeField(null=True, blank=True)
    last_success = models.DateTimeField(null=True, blank=True)
    next_due = models.DateTimeField(default=timezone.now, db_index=True)
    failures = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [("corporation", "section")]
        verbose_name_plural = "corporation sync statuses"
        permissions = [
            ("view_own_corporation", "Can view their own corporation's sheet"),
            ("view_alliance_corporations", "Can view the sheets of corporations in their alliance"),
            ("view_all_corporations", "Can view every corporation's sheet"),
            ("view_corporation_wallets", "Can view corporation finances (wallets, market, contracts)"),
        ]


class CorporationInfo(models.Model):
    corporation = models.OneToOneField(CORP, primary_key=True, on_delete=models.CASCADE, related_name="info")
    ceo_id = models.BigIntegerField(null=True)
    creator_id = models.BigIntegerField(null=True)
    date_founded = models.DateTimeField(null=True)
    description = models.TextField(blank=True)
    home_station_id = models.BigIntegerField(null=True)
    member_count = models.PositiveIntegerField(null=True)
    shares = models.BigIntegerField(null=True)
    tax_rate = models.FloatField(null=True)
    url = models.CharField(max_length=300, blank=True)
    faction_id = models.IntegerField(null=True)
    war_eligible = models.BooleanField(null=True)
    hangar_divisions = models.JSONField(default=list)  # [{division, name}]
    wallet_divisions = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)


class CorporationMember(models.Model):
    """One member. Tracking fields need a Director; the rest only the membership scope."""

    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="members")
    character_id = models.BigIntegerField(db_index=True)
    start_date = models.DateTimeField(null=True)
    logon_date = models.DateTimeField(null=True)
    logoff_date = models.DateTimeField(null=True)
    location_id = models.BigIntegerField(null=True)
    ship_type_id = models.IntegerField(null=True)
    base_id = models.IntegerField(null=True)
    roles = models.JSONField(default=list)
    titles = models.JSONField(default=list)  # [title name]
    tracked = models.BooleanField(default=False)

    class Meta:
        unique_together = [("corporation", "character_id")]


class Structure(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="structures")
    structure_id = models.BigIntegerField(unique=True)
    name = models.CharField(max_length=200, blank=True)
    type_id = models.IntegerField()
    system_id = models.IntegerField()
    profile_id = models.IntegerField(null=True)
    state = models.CharField(max_length=40)
    fuel_expires = models.DateTimeField(null=True)
    state_timer_start = models.DateTimeField(null=True)
    state_timer_end = models.DateTimeField(null=True)
    unanchors_at = models.DateTimeField(null=True)
    reinforce_hour = models.SmallIntegerField(null=True)
    next_reinforce_hour = models.SmallIntegerField(null=True)
    services = models.JSONField(default=list)  # [{name, state}]
    #: Set when owners were warned about low fuel; cleared once refuelled.
    fuel_warned = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]


class WalletDivision(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="wallet_divisions")
    division = models.SmallIntegerField()
    balance = models.DecimalField(max_digits=22, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("corporation", "division")]
        ordering = ["division"]


class CorpJournalEntry(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="journal")
    division = models.SmallIntegerField()
    ref_id = models.BigIntegerField()
    date = models.DateTimeField(db_index=True)
    ref_type = models.CharField(max_length=60, db_index=True)
    amount = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    balance = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    description = models.CharField(max_length=500, blank=True)
    reason = models.CharField(max_length=500, blank=True)
    first_party_id = models.BigIntegerField(null=True)
    second_party_id = models.BigIntegerField(null=True)
    tax = models.DecimalField(max_digits=22, decimal_places=2, null=True)

    class Meta:
        unique_together = [("corporation", "division", "ref_id")]
        ordering = ["-date", "-ref_id"]


class CorpTransaction(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="transactions")
    division = models.SmallIntegerField()
    transaction_id = models.BigIntegerField()
    date = models.DateTimeField(db_index=True)
    type_id = models.IntegerField()
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=22, decimal_places=2)
    is_buy = models.BooleanField()
    client_id = models.BigIntegerField()
    location_id = models.BigIntegerField()
    journal_ref_id = models.BigIntegerField(null=True)

    class Meta:
        unique_together = [("corporation", "division", "transaction_id")]
        ordering = ["-date", "-transaction_id"]


class CorpAsset(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="assets")
    item_id = models.BigIntegerField()
    type_id = models.IntegerField(db_index=True)
    quantity = models.IntegerField()
    location_id = models.BigIntegerField()
    location_type = models.CharField(max_length=20)
    location_flag = models.CharField(max_length=60)
    is_singleton = models.BooleanField()
    is_blueprint_copy = models.BooleanField(null=True)
    name = models.CharField(max_length=100, blank=True)
    root_location_id = models.BigIntegerField(db_index=True)

    class Meta:
        unique_together = [("corporation", "item_id")]


class CorpIndustryJob(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="industry_jobs")
    job_id = models.BigIntegerField()
    installer_id = models.BigIntegerField()
    activity_id = models.SmallIntegerField()
    status = models.CharField(max_length=20, db_index=True)
    blueprint_type_id = models.IntegerField()
    product_type_id = models.IntegerField(null=True)
    runs = models.IntegerField()
    cost = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    facility_id = models.BigIntegerField()
    location_id = models.BigIntegerField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(db_index=True)
    completed_date = models.DateTimeField(null=True)

    class Meta:
        unique_together = [("corporation", "job_id")]
        ordering = ["-start_date"]


class CorpContract(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="contracts")
    contract_id = models.BigIntegerField()
    type = models.CharField(max_length=20)
    status = models.CharField(max_length=30, db_index=True)
    availability = models.CharField(max_length=20)
    title = models.CharField(max_length=200, blank=True)
    issuer_id = models.BigIntegerField()
    assignee_id = models.BigIntegerField(null=True)
    acceptor_id = models.BigIntegerField(null=True)
    for_corporation = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    reward = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    collateral = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    volume = models.FloatField(null=True)
    date_issued = models.DateTimeField(db_index=True)
    date_expired = models.DateTimeField(null=True)
    date_completed = models.DateTimeField(null=True)
    start_location_id = models.BigIntegerField(null=True)
    end_location_id = models.BigIntegerField(null=True)

    class Meta:
        unique_together = [("corporation", "contract_id")]
        ordering = ["-date_issued"]


class CorpMarketOrder(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="market_orders")
    order_id = models.BigIntegerField()
    type_id = models.IntegerField()
    is_buy_order = models.BooleanField()
    price = models.DecimalField(max_digits=22, decimal_places=2)
    volume_total = models.IntegerField()
    volume_remain = models.IntegerField()
    issued = models.DateTimeField()
    issued_by = models.BigIntegerField(null=True)
    duration = models.IntegerField()
    location_id = models.BigIntegerField()
    region_id = models.IntegerField()
    wallet_division = models.SmallIntegerField(null=True)
    escrow = models.DecimalField(max_digits=22, decimal_places=2, null=True)
    state = models.CharField(max_length=20, default="active")

    class Meta:
        unique_together = [("corporation", "order_id")]
        ordering = ["-issued"]


class MoonExtraction(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="extractions")
    structure_id = models.BigIntegerField()
    moon_id = models.IntegerField()
    extraction_start_time = models.DateTimeField()
    chunk_arrival_time = models.DateTimeField()
    natural_decay_time = models.DateTimeField()

    class Meta:
        unique_together = [("corporation", "structure_id", "extraction_start_time")]
        ordering = ["chunk_arrival_time"]


class MiningObservation(models.Model):
    """What one character mined from one observer (moon drill) on one day."""

    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="mining_observations")
    observer_id = models.BigIntegerField()
    character_id = models.BigIntegerField(db_index=True)
    recorded_corporation_id = models.BigIntegerField(null=True)
    type_id = models.IntegerField()
    quantity = models.BigIntegerField()
    last_updated = models.DateField(db_index=True)

    class Meta:
        unique_together = [("corporation", "observer_id", "character_id", "type_id", "last_updated")]


class Starbase(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="starbases")
    starbase_id = models.BigIntegerField(unique=True)
    type_id = models.IntegerField()
    system_id = models.IntegerField()
    moon_id = models.IntegerField(null=True)
    state = models.CharField(max_length=20, blank=True)
    onlined_since = models.DateTimeField(null=True)
    reinforced_until = models.DateTimeField(null=True)
    unanchor_at = models.DateTimeField(null=True)


class CorporationKillmail(models.Model):
    corporation = models.ForeignKey(CORP, on_delete=models.CASCADE, related_name="killmails")
    killmail = models.ForeignKey("sheet_killmails.Killmail", on_delete=models.CASCADE, related_name="corporations")
    is_loss = models.BooleanField()

    class Meta:
        unique_together = [("corporation", "killmail")]
