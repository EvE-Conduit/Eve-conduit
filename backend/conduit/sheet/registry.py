from __future__ import annotations

import importlib
from collections.abc import Callable
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Section:
    key: str
    label: str
    #: Dotted path to ``sync(character, esi_client)``.
    sync: str
    #: Scopes requested when members authorise characters.
    scopes: tuple[str, ...] = ()
    #: Scopes without which the section can't sync at all (subset of ``scopes``).
    required_scopes: tuple[str, ...] = ()
    #: Seconds between syncs. ESI caching makes shorter intervals pointless.
    interval: int = 3600
    order: int = 100
    description: str = ""
    #: Derived from other sections' data; never synced. ``sources`` lists those sections.
    virtual: bool = False
    sources: tuple[str, ...] = ()
    extra: dict = field(default_factory=dict)

    def sync_function(self) -> Callable:
        path, _, attr = self.sync.rpartition(".")
        return getattr(importlib.import_module(path), attr)

    def can_sync(self, granted: set[str]) -> bool:
        return set(self.required_scopes) <= granted


SECTIONS: dict[str, Section] = {}


def register(section: Section) -> Section:
    SECTIONS[section.key] = section
    return section


def all_scopes() -> list[str]:
    return sorted({s for section in SECTIONS.values() for s in section.scopes})


def ordered() -> list[Section]:
    return sorted(SECTIONS.values(), key=lambda s: (s.order, s.key))


def synced() -> dict[str, Section]:
    """Sections the scheduler syncs (everything except virtual ones)."""
    return {k: s for k, s in SECTIONS.items() if not s.virtual}
