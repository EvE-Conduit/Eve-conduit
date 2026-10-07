"""Turning modules on and off at runtime."""

from django.core.cache import cache
from django.db import transaction

from . import registry
from .models import ModuleState

CACHE_KEY = "conduit:modules:enabled"


class ModuleError(Exception):
    pass


def enabled_ids() -> set[str]:
    ids = cache.get(CACHE_KEY)
    if ids is None:
        installed = registry.installed()
        ids = set(ModuleState.objects.filter(enabled=True, module_id__in=installed).values_list("module_id", flat=True))
        cache.set(CACHE_KEY, ids, 300)
    return ids


def is_enabled(module_id: str) -> bool:
    return module_id in enabled_ids()


def sync_installed():
    """Record newly installed modules, enabling those that ask to be on by default."""
    for mid, mod in registry.installed().items():
        state, created = ModuleState.objects.get_or_create(
            module_id=mid, defaults={"enabled": mod.default_enabled, "installed_version": mod.version}
        )
        if not created and state.installed_version != mod.version:
            state.installed_version = mod.version
            state.save(update_fields=["installed_version"])
    cache.delete(CACHE_KEY)


@transaction.atomic
def set_enabled(module_id: str, enabled: bool):
    installed = registry.installed()
    if module_id not in installed:
        raise ModuleError(f"module {module_id!r} is not installed")
    on = enabled_ids()
    if enabled:
        missing = [d for d in installed[module_id].requires if d not in on]
        if missing:
            raise ModuleError(f"enable {', '.join(missing)} first")
    else:
        dependents = [m.id for m in installed.values() if module_id in m.requires and m.id in on]
        if dependents:
            raise ModuleError(f"disable {', '.join(dependents)} first, they depend on it")
    ModuleState.objects.update_or_create(
        module_id=module_id,
        defaults={"enabled": enabled, "installed_version": installed[module_id].version},
    )
    cache.delete(CACHE_KEY)


def required_scopes() -> list[str]:
    """Every ESI scope the character sheet and enabled modules want."""
    from conduit.sheet.registry import all_scopes

    scopes: set[str] = set(all_scopes())
    for mid, mod in registry.installed().items():
        if mid in enabled_ids():
            scopes.update(mod.esi_scopes)
    return sorted(scopes)
