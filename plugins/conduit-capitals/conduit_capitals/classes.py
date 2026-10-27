"""The capital classes and their hulls, read from the static data (SDE) item groups.

Each class names the SDE ship groups it is made of, by id and, should CCP ever renumber one, by name. The hulls are
every published ship in those groups, so new hulls (a faction dreadnought, a new lancer) show up with the next SDE
import without a plugin update.
"""

from __future__ import annotations

from dataclasses import dataclass

from django.db.models import Q

SHIP_CATEGORY = 6


@dataclass(frozen=True)
class CapitalClass:
    key: str
    label: str
    group_ids: tuple[int, ...]
    group_names: tuple[str, ...]


CLASSES: tuple[CapitalClass, ...] = (
    CapitalClass("carrier", "Carrier", (547,), ("Carrier",)),
    CapitalClass("dreadnought", "Dreadnought", (485,), ("Dreadnought",)),
    CapitalClass("lancer", "Lancer Dreadnought", (4594,), ("Lancer Dreadnought",)),
    CapitalClass("fax", "Force Auxiliary", (1538,), ("Force Auxiliary",)),
    CapitalClass("supercarrier", "Supercarrier", (659,), ("Supercarrier",)),
    CapitalClass("titan", "Titan", (30,), ("Titan",)),
    CapitalClass("industrial", "Capital Industrial", (883,), ("Capital Industrial Ship",)),
    CapitalClass("jump_freighter", "Jump Freighter", (902,), ("Jump Freighter",)),
)
BY_KEY = {c.key: c for c in CLASSES}
#: For group rules and filters: a class, or any of them.
ANY = "any"
CHOICES = ((ANY, "Any capital"), *((c.key, c.label) for c in CLASSES))


def label(key: str) -> str:
    return "any capital" if key == ANY else BY_KEY[key].label if key in BY_KEY else key


@dataclass(frozen=True)
class Hull:
    id: int
    name: str
    cls: str
    group_id: int


def group_classes() -> dict[int, str]:
    """SDE ship group id -> class key."""
    from conduit.sde.models import ItemGroup

    out: dict[int, str] = {}
    for c in CLASSES:
        names = Q()
        for n in c.group_names:
            names |= Q(name__iexact=n)
        for gid in ItemGroup.objects.filter(Q(pk__in=c.group_ids) | names, category_id=SHIP_CATEGORY).values_list("pk", flat=True):
            out.setdefault(gid, c.key)
    return out


def hulls(cls: str | None = None) -> dict[int, Hull]:
    """Every published capital hull (type id -> Hull), optionally of one class, sorted by class then name."""
    from conduit.sde.models import ItemType

    groups = group_classes()
    if cls and cls != ANY:
        groups = {g: k for g, k in groups.items() if k == cls}
    order = {c.key: i for i, c in enumerate(CLASSES)}
    rows = ItemType.objects.filter(group_id__in=groups, published=True).values_list("pk", "name", "group_id")
    found = [Hull(pk, name, groups[gid], gid) for pk, name, gid in rows]
    found.sort(key=lambda h: (order[h.cls], h.name))
    return {h.id: h for h in found}
