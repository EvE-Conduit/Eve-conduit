"""Finds installed modules. Safe to call from settings.py (no Django imports)."""

from __future__ import annotations

import importlib
import logging
import os
from functools import cache
from importlib.metadata import entry_points

from .base import DiscoveredModule, Module

log = logging.getLogger(__name__)

ENTRY_POINT_GROUP = "conduit.modules"


def _load(target: str) -> type[Module]:
    module_path, _, attr = target.partition(":")
    obj = getattr(importlib.import_module(module_path), attr)
    if not (isinstance(obj, type) and issubclass(obj, Module)):
        raise TypeError(f"{target} is not a Module subclass")
    return obj


def _sources() -> list[str]:
    targets = [ep.value for ep in entry_points(group=ENTRY_POINT_GROUP)]
    # Extra modules for development and tests, e.g. "pkg.module:MyModule,..."
    extra = os.environ.get("CONDUIT_EXTRA_MODULES", "")
    targets += [t.strip() for t in extra.split(",") if t.strip()]
    return targets


@cache
def discover() -> dict[str, DiscoveredModule]:
    found: dict[str, DiscoveredModule] = {}
    for target in _sources():
        try:
            mod = _load(target)()
        except Exception as exc:  # a broken module must not take the site down
            log.exception("Failed to load EvE Conduit module %s", target)
            found[f"!{target}"] = DiscoveredModule(Module(), target, [f"failed to load: {exc}"])
            continue
        entry = DiscoveredModule(mod, target, mod.validate())
        if mod.id in found:
            entry.problems.append(f"duplicate module id {mod.id!r} (also provided by {found[mod.id].source})")
            found[f"!{target}"] = entry
            continue
        found[mod.id] = entry

    for entry in found.values():
        for dep in entry.module.requires:
            if dep not in found or not found[dep].ok:
                entry.problems.append(f"requires module {dep!r}, which is not installed")
    return found


def installed() -> dict[str, Module]:
    """Modules that loaded cleanly and can be enabled."""
    return {mid: e.module for mid, e in discover().items() if e.ok}


def django_apps() -> list[str]:
    return [m.app for m in installed().values() if m.app]


def beat_schedule() -> dict:
    schedule = {}
    for mid, m in installed().items():
        for name, entry in (m.periodic_tasks or {}).items():
            schedule[f"{mid}:{name}"] = entry
    return schedule
