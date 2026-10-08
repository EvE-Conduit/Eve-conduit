"""The contract every EvE Conduit plugin implements.

A plugin is an installable Python package that exposes a ``Plugin`` subclass
through the ``conduit.plugins`` entry point group::

    [project.entry-points."conduit.plugins"]
    skills = "conduit_skills.plugin:SkillsModule"

The file holding the ``Plugin`` subclass is imported while Django settings are
being built, so it must not import models or anything that needs the app
registry. Point at those with dotted strings instead (``app``, ``api``).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

MODULE_ID_RE = re.compile(r"^[a-z][a-z0-9_]{1,39}$")


@dataclass(frozen=True)
class NavItem:
    """A sidebar entry. ``path`` is relative to the plugin's mount point."""

    label: str
    path: str = ""
    icon: str = "box"
    permission: str | None = None


class Plugin:
    #: Stable identifier, used in URLs and the database. Never change it.
    id: str = ""
    name: str = ""
    version: str = "0.0.0"
    description: str = ""
    author: str = ""
    url: str = ""

    #: Dotted path to the plugin's Django AppConfig, if it has models/tasks.
    app: str | None = None
    #: Dotted path to a ``ninja.Router``, mounted at ``/api/p/<id>/``.
    api: str | None = None
    #: Dotted path to a ``ninja.Router`` for external services (API keys), mounted at
    #: ``/api/v1/p/<id>/``. Guard each route with ``conduit.external.auth.require_scope``.
    external_api: str | None = None
    #: Scopes the external API offers, ``{"read": "Read fleet schedules", ...}``. Keys get them
    #: as ``p.<id>:<name>``; names containing ``write`` count as write access.
    external_scopes: dict = {}
    #: Path of the plugin's ES module bundle inside Django static files,
    #: e.g. ``"conduit_skills/plugin.js"``. It is loaded by the web UI at runtime.
    frontend: str | None = None

    #: Other plugin ids that must be installed and enabled first.
    requires: tuple[str, ...] = ()
    #: ESI scopes characters must grant for this plugin to work.
    esi_scopes: tuple[str, ...] = ()
    #: Sidebar entries (the frontend bundle can add richer UI on top). The first is the plugin's entry; any others
    #: (e.g. a settings page with a ``permission``) are listed under it while people are on the plugin's pages.
    nav: tuple[NavItem, ...] = ()
    #: Celery beat entries, merged into ``CELERY_BEAT_SCHEDULE``.
    periodic_tasks: dict = {}
    #: Global search providers, as dotted paths ``"pkg.search:find"`` to ``fn(request, q, limit)``
    #: returning ``{"key", "label", "hits": [...]}`` groups. See ``conduit.search.registry``.
    search: tuple[str, ...] = ()
    #: Dotted paths of files that call ``conduit.access.rules.register_rule`` when imported, adding
    #: rule types for group requirements and smart groups.
    group_rules: tuple[str, ...] = ()
    #: Dotted paths to ``fn(user, character) -> bool`` that let more people read a character's sheet, e.g.
    #: recruiters looking at an applicant. Asked only when the core rules say no, and only while enabled.
    sheet_access: tuple[str, ...] = ()
    #: Only members may use it: people whose state isn't the public (Guest) fallback, and administrators.
    #: Others don't get its pages, API or search results. Set False for plugins guests need, e.g. applying.
    members_only: bool = True
    #: Whether a fresh install enables this plugin automatically.
    default_enabled: bool = False

    def validate(self) -> list[str]:
        problems = []
        if not MODULE_ID_RE.match(self.id or ""):
            problems.append(
                f"invalid plugin id {self.id!r}: use 2-40 chars of a-z, 0-9 and _, starting with a letter"
            )
        if not self.name:
            problems.append("plugin has no name")
        return problems

    def manifest(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "author": self.author,
            "url": self.url,
            "requires": list(self.requires),
            "members_only": self.members_only,
            "esi_scopes": list(self.esi_scopes),
            "nav": [vars(n) for n in self.nav],
            "has_api": bool(self.api),
            "has_external_api": bool(self.external_api),
            "external_scopes": dict(self.external_scopes),
            "has_frontend": bool(self.frontend),
        }


@dataclass
class DiscoveredPlugin:
    plugin: Plugin
    source: str
    problems: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.problems
