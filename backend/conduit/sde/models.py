"""CCP's Static Data Export (SDE): items, groups and the map.

Rows are written only by the importer (``manage.py sde_update``). Other apps
refer to them with ``db_constraint=False`` foreign keys so a fresh install
works before the first import finishes, and an SDE update never cascades into
member data.
"""

from django.db import models


class SdeVersion(models.Model):
    build_number = models.PositiveIntegerField(unique=True)
    release_date = models.DateTimeField(null=True, blank=True)
    imported_at = models.DateTimeField(auto_now_add=True)
    #: What the importer read from that build (``importer.SCHEMA``). An older value means a newer EvE Conduit
    #: imports more from the SDE, so the build is imported again.
    schema = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["-build_number"]

    def __str__(self):
        return f"SDE build {self.build_number}"

    @classmethod
    def current(cls) -> "SdeVersion | None":
        return cls.objects.first()


class ItemCategory(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    published = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "item categories"

    def __str__(self):
        return self.name


class ItemGroup(models.Model):
    id = models.IntegerField(primary_key=True)
    category = models.ForeignKey(ItemCategory, on_delete=models.DO_NOTHING, db_constraint=False, related_name="groups")
    name = models.CharField(max_length=100)
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class MarketGroup(models.Model):
    id = models.IntegerField(primary_key=True)
    parent = models.ForeignKey("self", null=True, on_delete=models.DO_NOTHING, db_constraint=False, related_name="children")
    name = models.CharField(max_length=100)
    has_types = models.BooleanField(default=False)
    icon_id = models.IntegerField(null=True)

    def __str__(self):
        return self.name


class MetaGroup(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class ItemType(models.Model):
    """Anything that exists in EVE: ships, plugins, skills, ores, blueprints..."""

    id = models.IntegerField(primary_key=True)
    group = models.ForeignKey(ItemGroup, on_delete=models.DO_NOTHING, db_constraint=False, related_name="types")
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    published = models.BooleanField(default=False)
    market_group = models.ForeignKey(MarketGroup, null=True, on_delete=models.DO_NOTHING, db_constraint=False, related_name="types")
    meta_group = models.ForeignKey(MetaGroup, null=True, on_delete=models.DO_NOTHING, db_constraint=False, related_name="types")
    volume = models.FloatField(null=True)
    packaged_volume = models.FloatField(null=True)
    capacity = models.FloatField(null=True)
    mass = models.FloatField(null=True)
    portion_size = models.IntegerField(default=1)
    base_price = models.FloatField(null=True)
    icon_id = models.IntegerField(null=True)
    race_id = models.IntegerField(null=True)
    tech_level = models.IntegerField(null=True)
    #: Skills needed to use it: [[skill_type_id, level], ...] (direct requirements only).
    required_skills = models.JSONField(default=list)
    #: Fitting data from dogma, for ships, modules and subsystems (None for everything else):
    #: ships ``{"hi", "med", "low", "rig", "sub", "service", "turrets", "launchers", "drone_bay", "drone_bandwidth",
    #: "cpu", "power", "calibration", "rig_size"}``; modules ``{"slot": "hi"|"med"|"low"|"rig"|"sub"|"service",
    #: "turret", "launcher", "cpu", "power", "calibration", "rig_size"}``; subsystems also have ``"adds"`` with the slots
    #: and hardpoints they give the ship.
    fitting = models.JSONField(null=True, default=None)

    def __str__(self):
        return self.name

    @property
    def icon_url(self) -> str:
        return type_icon_url(self.id)


class SkillInfo(models.Model):
    """Training data for skills, taken from the SDE's dogma attributes."""

    ATTRIBUTES = {164: "charisma", 165: "intelligence", 166: "memory", 167: "perception", 168: "willpower"}

    type = models.OneToOneField(ItemType, primary_key=True, on_delete=models.DO_NOTHING, db_constraint=False, related_name="skill_info")
    rank = models.FloatField(default=1)
    primary_attribute = models.CharField(max_length=12, blank=True)
    secondary_attribute = models.CharField(max_length=12, blank=True)
    #: [[skill_type_id, level], ...]
    required_skills = models.JSONField(default=list)


class Race(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Bloodline(models.Model):
    id = models.IntegerField(primary_key=True)
    race_id = models.IntegerField(null=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class PlanetSchematic(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)
    cycle_time = models.IntegerField(null=True)

    def __str__(self):
        return self.name


class Region(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Constellation(models.Model):
    id = models.IntegerField(primary_key=True)
    region = models.ForeignKey(Region, on_delete=models.DO_NOTHING, db_constraint=False, related_name="constellations")
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class SolarSystem(models.Model):
    id = models.IntegerField(primary_key=True)
    constellation = models.ForeignKey(Constellation, on_delete=models.DO_NOTHING, db_constraint=False, related_name="systems")
    region = models.ForeignKey(Region, on_delete=models.DO_NOTHING, db_constraint=False, related_name="systems")
    name = models.CharField(max_length=100, db_index=True)
    security_status = models.FloatField(default=0)
    security_class = models.CharField(max_length=4, blank=True)

    def __str__(self):
        return self.name

    @property
    def display_security(self) -> float:
        """Security as shown in game: rounded to one decimal, with 0.0-0.05 shown as 0.1."""
        sec = self.security_status
        return 0.1 if 0 < sec < 0.05 else round(sec, 1)


class Station(models.Model):
    """NPC stations. The SDE has no names for these; they are filled in from ESI on demand."""

    id = models.BigIntegerField(primary_key=True)
    solar_system = models.ForeignKey(SolarSystem, on_delete=models.DO_NOTHING, db_constraint=False, related_name="stations")
    type_id = models.IntegerField()
    owner_id = models.IntegerField(null=True)
    name = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name or str(self.id)


IMAGE_SERVER = "https://images.evetech.net"


def type_icon_url(type_id: int, size: int = 64) -> str:
    return f"{IMAGE_SERVER}/types/{type_id}/icon?size={size}"


def type_render_url(type_id: int, size: int = 256) -> str:
    return f"{IMAGE_SERVER}/types/{type_id}/render?size={size}"
