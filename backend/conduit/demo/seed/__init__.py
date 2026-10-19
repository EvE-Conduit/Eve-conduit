"""The example data: an alliance of three corporations, about thirty members with their alts, and something on
every page. Runs inside ``state.activate()`` (see database.build), so every save lands in the demo database.

Each area of the site has a module here with ``seed(demo)``; plugins add theirs with ``Plugin.demo_data``
(``"package.module:function"``, called the same way). They build on what ``core`` made, through ``Demo``.
Everything is drawn from a fixed random seed, so every demo database looks the same.

Ids: the example characters, corporations and alliances use ranges EVE doesn't (see ``Ids``), so no real
capsuleer's portrait or name ever shows up in the demo.
"""

from __future__ import annotations

import importlib
import logging
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from . import catalog

log = logging.getLogger(__name__)

#: The areas, in order: later ones build on earlier ones.
MODULES = (
    "core",
    "sheet_character", "sheet_skills", "sheet_wallet", "sheet_assets", "sheet_industry", "sheet_social",
    "sheet_combat", "corp", "admin",
)


class Ids:
    """Made-up EVE ids, outside the ranges EVE hands out."""

    CHARACTER = 1_700_000_000
    CORPORATION = 1_710_000_000
    ALLIANCE = 1_720_000_000
    STRUCTURE = 1_990_000_000_000
    #: Anything else that needs a unique id (killmails, contracts, journal entries, items...): ``demo.next_id()``.
    OTHER = 7_000_000_000


@dataclass
class Demo:
    rng: random.Random
    now: datetime
    #: Filled in by ``core``.
    alliance: object = None
    corporations: list = field(default_factory=list)  # the alliance's corporations; corporations[0] is the main one
    blue_corporation: object = None  # a friendly corporation outside the alliance
    admin: object = None  # the demo account (username demo), an administrator, CEO of corporations[0]
    users: list = field(default_factory=list)  # everyone, the demo account first
    characters: list = field(default_factory=list)  # every character, mains first
    states: dict = field(default_factory=dict)  # "member", "blue", "guest"
    groups: dict = field(default_factory=dict)  # name -> django Group
    #: Structures of the main corporation: [{"id", "name", "system_id", "type_id"}], also in sheet.Location.
    structures: list = field(default_factory=list)
    _next: int = Ids.OTHER

    # --- time ---------------------------------------------------------------------------------------------------

    def ago(self, days: float = 0, hours: float = 0, minutes: float = 0) -> datetime:
        return self.now - timedelta(days=days, hours=hours, minutes=minutes)

    def ahead(self, days: float = 0, hours: float = 0, minutes: float = 0) -> datetime:
        return self.now + timedelta(days=days, hours=hours, minutes=minutes)

    def recent(self, days: float = 30) -> datetime:
        """A random moment in the last ``days`` days."""
        return self.now - timedelta(seconds=self.rng.uniform(0, days * 86400))

    # --- picking ------------------------------------------------------------------------------------------------

    def pick(self, seq):
        return self.rng.choice(list(seq))

    def sample(self, seq, k: int):
        seq = list(seq)
        return self.rng.sample(seq, min(k, len(seq)))

    def chance(self, p: float) -> bool:
        return self.rng.random() < p

    def next_id(self) -> int:
        self._next += 1
        return self._next

    def mains(self) -> list:
        return [u.main_character for u in self.users if u.main_character_id]

    def characters_of(self, user) -> list:
        return [c for c in self.characters if c.user_id == user.pk]

    # --- static data ----------------------------------------------------------------------------------------------

    def type_ids(self, *, category: int | None = None, group: int | None = None, limit: int = 60) -> list[int]:
        """Published types of a category or group, from the static data (the copy of the real site's, or
        ``catalog``). Always a few, so callers can pick from it."""
        from conduit.sde.models import ItemType

        qs = ItemType.objects.filter(published=True)
        qs = qs.filter(group__category_id=category) if category is not None else qs.filter(group_id=group)
        ids = list(qs.order_by("id").values_list("id", flat=True)[:2000])
        if len(ids) > limit:
            ids = sorted(self.rng.sample(ids, limit))
        if ids:
            return ids
        return [tid for tid, (_, gid) in catalog.TYPES.items()
                if (group is not None and gid == group) or (category is not None and catalog.GROUPS[gid][1] == category)]

    def type_name(self, type_id: int) -> str:
        from conduit.sde.models import ItemType

        name = ItemType.objects.filter(pk=type_id).values_list("name", flat=True).first()
        return name or catalog.TYPES.get(type_id, (f"Type {type_id}",))[0]

    def system_ids(self) -> list[int]:
        return list(catalog.SYSTEMS)

    def station_ids(self) -> list[int]:
        return list(catalog.STATIONS)


def _ensure_static_data():
    """Fill in the bits of static data the example data refers to, where the copy doesn't have them."""
    from conduit.sde.models import Constellation, ItemCategory, ItemGroup, ItemType, Region, SolarSystem, Station

    ItemCategory.objects.bulk_create(
        [ItemCategory(id=i, name=n, published=True) for i, n in catalog.CATEGORIES.items()], ignore_conflicts=True
    )
    ItemGroup.objects.bulk_create(
        [ItemGroup(id=i, name=n, category_id=c, published=True) for i, (n, c) in catalog.GROUPS.items()], ignore_conflicts=True
    )
    ItemType.objects.bulk_create(
        [ItemType(id=i, name=n, group_id=g, published=True) for i, (n, g) in catalog.TYPES.items()], ignore_conflicts=True
    )
    Region.objects.bulk_create([Region(id=i, name=n) for i, n in catalog.REGIONS.items()], ignore_conflicts=True)
    Constellation.objects.bulk_create(
        [Constellation(id=i, name=n, region_id=r) for i, (n, r) in catalog.CONSTELLATIONS.items()], ignore_conflicts=True
    )
    SolarSystem.objects.bulk_create(
        [SolarSystem(id=i, name=n, constellation_id=c, region_id=r, security_status=s) for i, (n, c, r, s) in catalog.SYSTEMS.items()],
        ignore_conflicts=True,
    )
    Station.objects.bulk_create(
        [Station(id=i, solar_system_id=s, type_id=1529) for i, (_, s) in catalog.STATIONS.items()], ignore_conflicts=True
    )


def _plugin_seeders():
    from conduit.plugins import registry

    for plugin_id, plugin in registry.installed().items():
        path = getattr(plugin, "demo_data", None)
        if path:
            yield f"plugin {plugin_id}", path


def run():
    demo = Demo(rng=random.Random(20031), now=timezone.now())
    with transaction.atomic(using="demo"):
        _ensure_static_data()
    steps = [(name, f"{__name__}.{name}:seed") for name in MODULES] + list(_plugin_seeders())
    for name, path in steps:
        module_path, _, attr = path.partition(":")
        try:
            with transaction.atomic(using="demo"):
                getattr(importlib.import_module(module_path), attr)(demo)
        except ModuleNotFoundError as exc:
            if exc.name != module_path or not module_path.startswith(__name__):
                log.exception("Demo data for %s failed", name)
            # else: an area without example data yet
        except Exception:
            if name == "core":
                raise  # nothing else works without it
            # One area's example data failing leaves that area empty, not the whole demo.
            log.exception("Demo data for %s failed", name)
    return demo
