"""Finds installed plugins. Safe to call from settings.py (no Django imports)."""

from __future__ import annotations

import importlib
import logging
import os
from functools import cache
from importlib.metadata import entry_points

from .base import DiscoveredPlugin, Plugin

log = logging.getLogger(__name__)

ENTRY_POINT_GROUP = "conduit.plugins"


def _load(target: str) -> type[Plugin]:
    module_path, _, attr = target.partition(":")
    obj = getattr(importlib.import_module(module_path), attr)
    if not (isinstance(obj, type) and issubclass(obj, Plugin)):
        raise TypeError(f"{target} is not a Plugin subclass")
    return obj


def _sources() -> list[str]:
    targets = [ep.value for ep in entry_points(group=ENTRY_POINT_GROUP)]
    # Extra plugins for development and tests, e.g. "pkg.plugin:MyModule,..."
    extra = os.environ.get("CONDUIT_EXTRA_PLUGINS", "")
    targets += [t.strip() for t in extra.split(",") if t.strip()]
    return targets


@cache
def discover() -> dict[str, DiscoveredPlugin]:
    found: dict[str, DiscoveredPlugin] = {}
    for target in _sources():
        try:
            mod = _load(target)()
        except Exception as exc:  # a broken plugin must not take the site down
            log.exception("Failed to load EvE Conduit plugin %s", target)
            found[f"!{target}"] = DiscoveredPlugin(Plugin(), target, [f"failed to load: {exc}"])
            continue
        entry = DiscoveredPlugin(mod, target, mod.validate())
        if mod.id in found:
            entry.problems.append(f"duplicate plugin id {mod.id!r} (also provided by {found[mod.id].source})")
            found[f"!{target}"] = entry
            continue
        found[mod.id] = entry

    for entry in found.values():
        for dep in entry.plugin.requires:
            if dep not in found or not found[dep].ok:
                entry.problems.append(f"requires plugin {dep!r}, which is not installed")
    return found


def installed() -> dict[str, Plugin]:
    """Plugins that loaded cleanly and can be enabled."""
    return {mid: e.plugin for mid, e in discover().items() if e.ok}


def django_apps() -> list[str]:
    return [m.app for m in installed().values() if m.app]


def beat_schedule() -> dict:
    schedule = {}
    for mid, m in installed().items():
        for name, entry in (m.periodic_tasks or {}).items():
            schedule[f"{mid}:{name}"] = entry
    return schedule


@cache
def _logger_prefixes() -> tuple[tuple[str, str], ...]:
    """(package, plugin id), longest package first: a plugin's logs are everything logged under the package
    holding its ``Plugin`` subclass, e.g. ``conduit_discord.services`` for ``conduit_discord.plugin:DiscordModule``."""
    prefixes = []
    for mid, m in installed().items():
        module = type(m).__module__
        prefixes.append((module.rpartition(".")[0] or module, mid))
    return tuple(sorted(prefixes, key=lambda p: -len(p[0])))


def plugin_for_logger(name: str) -> str:
    """The id of the plugin a logger belongs to, or ""."""
    for package, mid in _logger_prefixes():
        if name == package or name.startswith(package + "."):
            return mid
    return ""
