"""Search providers.

A provider is ``fn(request, q, limit) -> dict | list[dict] | None`` returning one or more groups::

    {"key": "fleets", "label": "Fleets", "hits": [
        {"id": "fleet:12", "title": "Sunday roam", "subtitle": "Fleet · 19:00", "icon": "rocket", "url": "/m/fleets/12"},
    ]}

``url`` is a path inside the site or an absolute https:// URL. A hit has an ``image`` URL (portrait,
logo, item icon) or an ``icon`` (a Lucide icon name). Providers must only return what the user may see.

Core providers register here; modules list theirs as dotted paths in ``Module.search`` and are only
asked while the module is enabled.
"""

from __future__ import annotations

import importlib
import logging
from collections.abc import Callable
from dataclasses import dataclass

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Provider:
    key: str
    fn: Callable
    order: int = 100
    module: str | None = None


PROVIDERS: dict[str, Provider] = {}


def register(key: str, order: int = 100, module: str | None = None):
    def decorator(fn):
        PROVIDERS[key] = Provider(key, fn, order, module)
        return fn

    return decorator


def _module_providers() -> list[Provider]:
    from conduit.modules import registry as modules
    from conduit.modules.services import enabled_ids

    out = []
    on = enabled_ids()
    for mid, mod in modules.installed().items():
        if mid not in on:
            continue
        for i, target in enumerate(getattr(mod, "search", ()) or ()):
            path, _, attr = target.partition(":")
            try:
                out.append(Provider(f"m.{mid}.{i}", getattr(importlib.import_module(path), attr), 500, mid))
            except Exception:
                log.exception("Could not load search provider %s of module %s", target, mid)
    return out


def search(request, q: str, limit: int = 8) -> list[dict]:
    from . import providers  # noqa: F401  (registers the core providers)

    q = q.strip()
    if len(q) < 2:
        return []
    groups = []
    for provider in sorted([*PROVIDERS.values(), *_module_providers()], key=lambda p: p.order):
        try:
            result = provider.fn(request, q, limit)
        except Exception:  # one broken provider must not break search
            log.exception("Search provider %s failed", provider.key)
            continue
        for group in [result] if isinstance(result, dict) else (result or []):
            hits = list(group.get("hits") or [])[:limit]
            if hits:
                groups.append({"key": group["key"], "label": group["label"], "hits": hits})
    return groups
