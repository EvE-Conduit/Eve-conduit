"""Public EVE entities shared by every module."""

from django.db import models


class EveAlliance(models.Model):
    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=100, blank=True)
    ticker = models.CharField(max_length=10, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name or str(self.id)


class EveCorporation(models.Model):
    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=100, blank=True)
    ticker = models.CharField(max_length=10, blank=True)
    alliance = models.ForeignKey(
        EveAlliance, null=True, blank=True, on_delete=models.SET_NULL, related_name="corporations"
    )
    member_count = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name or str(self.id)


class EveName(models.Model):
    """Name of any EVE id (character, corporation, alliance, faction, ...), from /universe/names."""

    id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class MarketPrice(models.Model):
    """CCP's universe-wide average and adjusted prices, refreshed hourly."""

    type_id = models.IntegerField(primary_key=True)
    average_price = models.FloatField(null=True)
    adjusted_price = models.FloatField(null=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def price(self) -> float:
        return self.average_price or self.adjusted_price or 0.0


IMAGE_SERVER = "https://images.evetech.net"


def portrait_url(character_id: int, size: int = 128) -> str:
    return f"{IMAGE_SERVER}/characters/{character_id}/portrait?size={size}"


def corporation_logo_url(corporation_id: int, size: int = 64) -> str:
    return f"{IMAGE_SERVER}/corporations/{corporation_id}/logo?size={size}"


def alliance_logo_url(alliance_id: int, size: int = 64) -> str:
    return f"{IMAGE_SERVER}/alliances/{alliance_id}/logo?size={size}"
