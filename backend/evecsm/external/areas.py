"""The catalogue of external APIs. Each one is switched on or off separately (all start off),
and each offers scopes that keys are granted. Module APIs come from ``Module.external_api``."""

from __future__ import annotations

from dataclasses import dataclass

from django.core.cache import cache

CACHE_KEY = "evecsm:external:enabled"


@dataclass(frozen=True)
class Scope:
    scope: str
    label: str
    description: str = ""
    write: bool = False


@dataclass(frozen=True)
class Area:
    key: str
    label: str
    description: str
    base_path: str
    scopes: tuple[Scope, ...]
    module: str | None = None


def _sheet_scopes() -> tuple[Scope, ...]:
    from evecsm.sheet import registry

    return tuple(
        Scope(f"sheet:{s.key}", s.label, f"Read the {s.label.lower()} section of any character's sheet")
        for s in registry.ordered()
    )


def _corp_scopes() -> tuple[Scope, ...]:
    from evecsm.corp import registry

    return tuple(
        Scope(f"corp:{s.key}", s.label, f"Read the {s.label.lower()} section of any corporation's sheet")
        for s in registry.ordered()
    )


def core_areas() -> list[Area]:
    return [
        Area(
            "directory",
            "Directory",
            "Members, their main and alt characters, corporations, alliances, states and group memberships. "
            "What Discord/TeamSpeak/Mumble bots need to sync roles.",
            "/api/v1/users, /characters, /groups, /states, /corporations, /alliances",
            (Scope("directory:read", "Read the directory", "Users, characters, corporations, alliances, states and groups"),),
        ),
        Area(
            "sheet",
            "Character sheets",
            "Synced character data (skills, wallet, assets, mail...), one scope per section. Gives access to every "
            "registered character, so grant only the sections a service really needs.",
            "/api/v1/characters/{id}/sheet/...",
            _sheet_scopes(),
        ),
        Area(
            "corp",
            "Corporation sheets",
            "Synced corporation data (members, structures, wallets, assets...), one scope per section. Gives access "
            "to every corporation with registered members.",
            "/api/v1/corporations/{id}/sheet/...",
            _corp_scopes(),
        ),
        Area(
            "groups",
            "Group membership",
            "Add users to groups and remove them, e.g. from a recruitment or applications tool. "
            "Group state restrictions still apply.",
            "/api/v1/groups/{id}/members/{user_id}",
            (Scope("groups:write", "Change group members", "Add and remove users from groups", write=True),),
        ),
        Area(
            "states",
            "State membership",
            "Add or remove characters, corporations and alliances from a state's membership rules. "
            "Users' states are recalculated straight away.",
            "/api/v1/states/{id}/members",
            (Scope("states:write", "Change state membership", "Edit which characters, corporations and alliances a state includes", write=True),),
        ),
        Area(
            "notify",
            "Notifications",
            "Send in-app notifications to users, character owners or whole groups, e.g. fleet pings from a bot. "
            "They appear under the bell and go out through any webhooks listening for notifications.",
            "/api/v1/notifications",
            (
                Scope("notify:write", "Send notifications", "Notify users, character owners and group members", write=True),
                Scope("notify:links", "Link to other sites", "Let notifications link outside this site (people are asked "
                      "before they leave it). Without it, links must be paths on this site.", write=True),
            ),
        ),
        Area(
            "logs",
            "Logs",
            "Pull the audit log, the API request log, the service log and the ESI call log, e.g. into a SIEM or a "
            "Discord log channel. "
            "Supports incremental polling with after_id.",
            "/api/v1/logs/audit, /logs/requests, /logs/service, /logs/esi",
            (
                Scope("logs:audit", "Read the audit log", "Who changed what: logins, characters, groups, states, modules, API keys"),
                Scope("logs:requests", "Read the API request log", "Every call made to this API, by any key"),
                Scope("logs:service", "Read the service log", "Warnings and errors the server logged"),
                Scope("logs:esi", "Read the ESI call log", "Every request the server sent to ESI and how it went"),
            ),
        ),
    ]


def module_areas() -> list[Area]:
    from evecsm.modules import registry

    out = []
    for mid, mod in sorted(registry.installed().items()):
        if not mod.external_api:
            continue
        scopes = tuple(
            Scope(f"m.{mid}:{name}", name, str(desc), write="write" in name) for name, desc in mod.external_scopes.items()
        )
        out.append(Area(f"m.{mid}", mod.name, mod.description or f"API of the {mod.name} module", f"/api/v1/m/{mid}/", scopes, module=mid))
    return out


def all_areas() -> dict[str, Area]:
    return {a.key: a for a in [*core_areas(), *module_areas()]}


def known_scopes() -> dict[str, Scope]:
    return {s.scope: s for a in all_areas().values() for s in a.scopes}


def area_of_scope(scope: str) -> str:
    return scope.partition(":")[0]


def enabled_keys() -> set[str]:
    keys = cache.get(CACHE_KEY)
    if keys is None:
        from .models import ApiArea

        keys = set(ApiArea.objects.filter(enabled=True).values_list("key", flat=True))
        cache.set(CACHE_KEY, keys, 300)
    return keys


def is_available(area: Area) -> bool:
    """A module's API only works while the module itself is enabled."""
    if area.module is None:
        return True
    from evecsm.modules.services import is_enabled

    return is_enabled(area.module)


def is_on(key: str) -> bool:
    area = all_areas().get(key)
    return area is not None and key in enabled_keys() and is_available(area)


def set_enabled(key: str, enabled: bool):
    from .models import ApiArea

    ApiArea.objects.update_or_create(key=key, defaults={"enabled": enabled})
    cache.delete(CACHE_KEY)
