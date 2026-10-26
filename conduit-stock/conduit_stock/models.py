from django.conf import settings
from django.db import models


class StockSettings(models.Model):
    """Stock-wide options. One row."""

    #: How long a member's "I'll seed N" lasts before it's dropped.
    claim_days = models.PositiveSmallIntegerField(default=7)

    class Meta:
        verbose_name_plural = "Stock settings"
        permissions = [("manage_stock", "Can set up staging locations and stock targets")]

    @classmethod
    def load(cls) -> "StockSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Place(models.Model):
    """A staging station or structure where things should be for sale."""

    #: Station or structure id; the name comes from the core's locations.
    location_id = models.BigIntegerField(unique=True)
    name = models.CharField(max_length=200)
    #: What people call it ("Main staging", "Deployment"), optional.
    label = models.CharField(max_length=100, blank=True)
    solar_system_id = models.IntegerField(null=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.label or self.name


class Target(models.Model):
    """How many of one ship or item should be for sale at a place."""

    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="targets")
    type_id = models.IntegerField()
    #: A Doctrines fit (when that plugin is installed); ``type_id`` is then its hull. Not a foreign key, so this plugin
    #: works without Doctrines.
    fit_id = models.IntegerField(null=True, blank=True)
    quantity = models.PositiveIntegerField()
    #: Alert below this many; empty means the target itself.
    low = models.PositiveIntegerField(null=True, blank=True)
    note = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    #: Set when the managers were told it's low; cleared once it's back above the low mark.
    alerted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "pk"]

    @property
    def low_mark(self) -> int:
        return self.quantity if self.low is None else self.low


class Claim(models.Model):
    """A member saying they'll put N up for sale. One per member and target."""

    target = models.ForeignKey(Target, on_delete=models.CASCADE, related_name="claims")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [models.UniqueConstraint(fields=["target", "user"], name="stock_one_claim_per_member")]
