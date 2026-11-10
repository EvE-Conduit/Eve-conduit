"""How each character sheet section is rebuilt from a SeAT dump.

Every module here registers its section with ``section(...)`` (or ``corp_section(...)`` for a corporation sheet
section) and answers the ESI paths that section's sync calls with ``@route``. Modules are found and loaded
automatically.
"""

from __future__ import annotations

import importlib
import pkgutil
from collections.abc import Callable
from dataclasses import dataclass, field

#: Sections that are history (rows with EVE ids, merged into what Conduit has) or a snapshot (current state,
#: only imported while Conduit has never synced the section from EVE; EVE's own data is always newer).
HISTORY, SNAPSHOT = "history", "snapshot"


@dataclass(frozen=True)
class SectionImport:
    key: str
    kind: str
    #: SeAT tables the routes read. Each is indexed on character_id when it has one.
    tables: tuple[str, ...]
    #: More indexes the routes need, {table: (column, ...)}.
    indexes: dict = field(default_factory=dict)
    #: Per-run caps in the section's sync to lift while importing everything: (module, attribute, value).
    limits: tuple = ()
    #: A corporation sheet section (``conduit.corp.registry``), keyed ``corp.<section>``, run once per corporation.
    corporation: bool = False
    #: ``after(ctx)``, run inside the section's transaction once its sync is done, for what the sync can't store
    #: itself (e.g. closed market orders, which a live sync never sees).
    after: Callable | None = None

    @property
    def sheet_key(self) -> str:
        """The section's key in its own sheet's registry."""
        return self.key.removeprefix(CORP_PREFIX)


SECTIONS: dict[str, SectionImport] = {}
CORP_PREFIX = "corp."

#: Tables every import reads, whatever the sections.
BASE_TABLES = ("refresh_tokens", "universe_names", "universe_stations", "universe_structures")
BASE_INDEXES = {"universe_stations": ("station_id",), "universe_structures": ("structure_id",)}

def section(key: str, kind: str, tables, indexes=None, limits=()) -> SectionImport:
    imp = SectionImport(key, kind, tuple(tables), dict(indexes or {}), tuple(limits))
    SECTIONS[key] = imp
    return imp


def corp_section(key: str, kind: str, tables, indexes=None, limits=(), after=None) -> SectionImport:
    """Register the import of corporation sheet section ``key`` (as ``corp.<key>``)."""
    imp = SectionImport(CORP_PREFIX + key, kind, tuple(tables), dict(indexes or {}), tuple(limits), corporation=True,
                        after=after)
    SECTIONS[imp.key] = imp
    return imp


def load() -> dict[str, SectionImport]:
    for info in pkgutil.iter_modules(__path__):
        importlib.import_module(f"{__name__}.{info.name}")
    return SECTIONS
