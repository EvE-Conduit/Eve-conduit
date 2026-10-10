from decimal import Decimal

from django.conf import settings
from django.db import models

D0 = Decimal("0")


class BuybackSettings(models.Model):
    """Prices and tracking for every program on this site. One row."""

    class Source(models.TextChoices):
        ESI = "esi", "ESI"
        FUZZWORK = "fuzzwork", "Fuzzwork"
        JANICE = "janice", "Janice"

    #: ESI, straight from CCP, unless the site prefers a third party.
    price_source = models.CharField(max_length=10, choices=Source.choices, default=Source.ESI)
    #: ESI and Fuzzwork market: a station, system or region id (Jita 4-4 by default), or for ESI a player structure.
    hub_id = models.BigIntegerField(default=60003760)
    hub_name = models.CharField(max_length=100, default="Jita 4-4")
    #: Best order prices instead of the average of the top 5% of orders.
    instant_prices = models.BooleanField(default=False)
    #: Janice prices Jita 4-4 only; it needs an API key.
    janice_api_key = models.CharField(max_length=100, blank=True)
    #: Reads a player structure's market for the ESI source (needs docking access there).
    esi_character = models.ForeignKey("accounts.Character", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    #: The last time the ESI source read the whole market, and what came of it.
    market_pulled_at = models.DateTimeField(null=True, blank=True)
    market_note = models.CharField(max_length=300, blank=True)
    #: Manipulation guard: a price this many percent above its recent traded average is suspect. Then the average is
    #: used if the item trades often enough to trust it, otherwise the lower price, and the item is checked by hand.
    guard_enabled = models.BooleanField(default=True)
    guard_threshold = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("20"))
    #: The average covers this many days of the hub region's market history...
    guard_days = models.PositiveSmallIntegerField(default=7)
    #: ...and is trusted when the item traded on at least this many of them.
    guard_min_days = models.PositiveSmallIntegerField(default=5)
    #: Prices far below the average are suspect too (off: only prices above it, which would make you overpay).
    guard_both_ways = models.BooleanField(default=False)
    #: Prices older than this are fetched again before a quote uses them, and by the hourly refresh.
    price_max_age_hours = models.PositiveIntegerField(default=24)
    #: Starts every tracking number unless a program has its own.
    tracking_prefix = models.CharField(max_length=20, default="bb-")
    #: Quotes no contract was made for are removed after this many hours (0: kept).
    unlinked_purge_hours = models.PositiveIntegerField(default=48)
    #: A paste with any item the program doesn't take gets no quote at all.
    reject_disallowed = models.BooleanField(default=False)
    #: Only the seller and the program's managers can open a quote; otherwise every member with its tracking number.
    restrict_quotes = models.BooleanField(default=True)

    @classmethod
    def load(cls) -> "BuybackSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Location(models.Model):
    """Where sellers make their contracts."""

    name = models.CharField(max_length=200)
    solar_system_id = models.IntegerField()
    #: The station or structure. With it, contracts made anywhere else are flagged.
    structure_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Program(models.Model):
    """A buyback desk: who buys, where, and how items are priced."""

    class PriceType(models.TextChoices):
        BUY = "buy", "Buy"
        SELL = "sell", "Sell"
        SPLIT = "split", "Split"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    #: Contracts go to this character, or to its corporation with ``is_corporation``. Its login reads them.
    owner = models.ForeignKey("accounts.Character", null=True, on_delete=models.SET_NULL, related_name="+")
    is_corporation = models.BooleanField(default=True)
    locations = models.ManyToManyField(Location, related_name="programs")
    #: People who run it: change it, see its contracts and statistics, and get told about new contracts.
    managers = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="buyback_programs")
    expiration_days = models.PositiveSmallIntegerField(default=14)
    price_type = models.CharField(max_length=5, choices=PriceType.choices, default=PriceType.BUY)
    #: Percent taken off every item's price.
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("10"))
    #: ISK per m³ taken off for hauling.
    hauling_fuel_cost = models.DecimalField(max_digits=12, decimal_places=2, default=D0)
    #: Items worth less than this per m³ pay ``price_density_tax`` on top.
    price_density_threshold = models.DecimalField(max_digits=16, decimal_places=2, default=D0)
    price_density_tax = models.DecimalField(max_digits=5, decimal_places=2, default=D0)
    #: Ore and ice count with their compressed volume for hauling and price density.
    compressed_volume = models.BooleanField(default=False)
    #: Everything is bought unless an item rule says no; otherwise only items with a rule.
    allow_all_items = models.BooleanField(default=True)
    #: Ore and ice: the best of the ticked ways to value them.
    use_raw = models.BooleanField(default=True)
    use_compressed = models.BooleanField(default=True)
    use_refined = models.BooleanField(default=True)
    refining_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("80"))
    #: Assembled (unpacked) ships and modules are bought.
    allow_unpacked = models.BooleanField(default=False)
    #: Sleeper and Triglavian loot at the NPC buy price instead of the market's.
    blue_loot_npc = models.BooleanField(default=False)
    red_loot_npc = models.BooleanField(default=False)
    #: Tech I and named modules at what reprocessing them gives.
    t1_refined = models.BooleanField(default=False)
    t1_refining_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("55"))
    #: Who may use it: these states or groups (both empty: every member).
    states = models.ManyToManyField("access.State", blank=True, related_name="+")
    groups = models.ManyToManyField("auth.Group", blank=True, related_name="+")
    #: Anyone can get a quote, without an account.
    public = models.BooleanField(default=False)
    notify_managers = models.BooleanField(default=True)
    #: Corporation wallet division whose balance the managers see (1-7).
    wallet_division = models.PositiveSmallIntegerField(null=True, blank=True)
    #: Starts its tracking numbers instead of the site-wide prefix.
    tracking_prefix = models.CharField(max_length=20, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        permissions = [
            ("view_leaderboard", "Can see who sold the most to the buyback programs they use"),
            ("manage_programs", "Can create buyback programs and run the ones they manage"),
            ("view_all_statistics", "Can see the contracts and statistics of every buyback program"),
            ("manage_all_programs", "Can run every buyback program and change buyback prices"),
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


class ItemRule(models.Model):
    """An item's own terms in a program: extra tax (may be negative), not bought at all, or a fixed price."""

    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="item_rules")
    type_id = models.IntegerField()
    #: Added to the program's tax.
    tax = models.DecimalField(max_digits=6, decimal_places=2, default=D0)
    disallowed = models.BooleanField(default=False)
    #: ISK per unit, with no tax or costs taken off.
    static_price = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["program", "type_id"], name="buyback_item_rule_unique")]


class WatchRule(models.Model):
    """Items (or a whole item group) a manager checks by hand before accepting: officer modules, rare loot..."""

    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="watch_rules")
    type_id = models.IntegerField(null=True, blank=True)
    group_id = models.IntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(type_id__isnull=False, group_id__isnull=True) | models.Q(type_id__isnull=True, group_id__isnull=False),
                name="buyback_watch_type_or_group",
            ),
        ]


class ItemPrice(models.Model):
    """Market prices at the hub, per unit, from the configured source."""

    type_id = models.IntegerField(primary_key=True)
    buy = models.DecimalField(max_digits=20, decimal_places=2, default=D0)
    sell = models.DecimalField(max_digits=20, decimal_places=2, default=D0)
    updated_at = models.DateTimeField()

    def price(self, kind: str) -> Decimal:
        if kind == "buy":
            return self.buy
        if kind == "sell":
            return self.sell
        if self.buy and self.sell:
            return (self.buy + self.sell) / 2
        return self.buy or self.sell


class PriceHistory(models.Model):
    """Recent daily trading of a type in the hub's region, from ESI: the manipulation guard's yardstick."""

    type_id = models.IntegerField(primary_key=True)
    region_id = models.IntegerField()
    #: ``[[date, average, volume], ...]``, last 30 days with trades, oldest first.
    days = models.JSONField(default=list)
    updated_at = models.DateTimeField()


class Quote(models.Model):
    """What a program offered for a paste. Its tracking number is the contract's title."""

    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="quotes")
    #: Who asked; empty for public quotes from people without an account.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="buyback_quotes")
    tracking_number = models.CharField(max_length=40, unique=True)
    #: Every pasted line as priced: ``[{type_id, name, quantity, accepted, method, unit_price, tax, value, notes, ...}]``.
    lines = models.JSONField(default=list)
    value = models.DecimalField(max_digits=20, decimal_places=2)
    volume = models.FloatField(default=0)
    #: Has items on the program's manual review list.
    flagged = models.BooleanField(default=False)
    public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]


class Contract(models.Model):
    """An item exchange contract to a program's owner carrying a tracking number (or the program's prefix)."""

    contract_id = models.BigIntegerField(unique=True)
    #: Unknown for contracts with a prefix but no quote behind it.
    program = models.ForeignKey(Program, null=True, on_delete=models.CASCADE, related_name="contracts")
    quote = models.ForeignKey(Quote, null=True, blank=True, on_delete=models.SET_NULL, related_name="contracts")
    #: The program owner whose login found it.
    owner_id = models.BigIntegerField(db_index=True)
    issuer_id = models.BigIntegerField()
    issuer_corporation_id = models.BigIntegerField(null=True)
    assignee_id = models.BigIntegerField()
    for_corporation = models.BooleanField(default=False)
    title = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=30, db_index=True)
    price = models.DecimalField(max_digits=20, decimal_places=2, default=D0)
    volume = models.FloatField(null=True)
    start_location_id = models.BigIntegerField(null=True)
    date_issued = models.DateTimeField(db_index=True)
    date_expired = models.DateTimeField(null=True)
    date_completed = models.DateTimeField(null=True)
    #: ``[[type_id, quantity, included], ...]``; None until fetched.
    items = models.JSONField(null=True, default=None)
    #: What the checks found: ``[{"code", "text", "severe"}]``.
    problems = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_issued"]

    @property
    def outstanding(self) -> bool:
        return self.status in ("outstanding", "in_progress")
