"""Turning plugins on and off at runtime."""

from django.core.cache import cache
from django.db import transaction

from . import registry
from .models import PluginState

CACHE_KEY = "conduit:plugins:enabled"


class PluginError(Exception):
    pass


def enabled_ids() -> set[str]:
    ids = cache.get(CACHE_KEY)
    if ids is None:
        installed = registry.installed()
        ids = set(PluginState.objects.filter(enabled=True, plugin_id__in=installed).values_list("plugin_id", flat=True))
        cache.set(CACHE_KEY, ids, 300)
    return ids


def is_enabled(plugin_id: str) -> bool:
    return plugin_id in enabled_ids()


def can_use(user, plugin_id: str) -> bool:
    """Enabled, and either open to everyone or the user is a member (``Plugin.members_only``)."""
    if not is_enabled(plugin_id):
        return False
    plugin = registry.installed().get(plugin_id)
    if plugin is None or not plugin.members_only:
        return plugin is not None
    from conduit.access.services import is_site_member

    return is_site_member(user)


def sync_installed():
    """Record newly installed plugins, enabling those that ask to be on by default."""
    for mid, mod in registry.installed().items():
        state, created = PluginState.objects.get_or_create(
            plugin_id=mid, defaults={"enabled": mod.default_enabled, "installed_version": mod.version}
        )
        if not created and state.installed_version != mod.version:
            state.installed_version = mod.version
            state.save(update_fields=["installed_version"])
    cache.delete(CACHE_KEY)


@transaction.atomic
def set_enabled(plugin_id: str, enabled: bool):
    installed = registry.installed()
    if plugin_id not in installed:
        raise PluginError(f"plugin {plugin_id!r} is not installed")
    on = enabled_ids()
    if enabled:
        missing = [d for d in installed[plugin_id].requires if d not in on]
        if missing:
            raise PluginError(f"enable {', '.join(missing)} first")
    else:
        dependents = [m.id for m in installed.values() if plugin_id in m.requires and m.id in on]
        if dependents:
            raise PluginError(f"disable {', '.join(dependents)} first, they depend on it")
    PluginState.objects.update_or_create(
        plugin_id=plugin_id,
        defaults={"enabled": enabled, "installed_version": installed[plugin_id].version},
    )
    cache.delete(CACHE_KEY)


def required_scopes() -> list[str]:
    """Every ESI scope the character sheet and enabled plugins want."""
    from conduit.sheet.registry import all_scopes

    scopes: set[str] = set(all_scopes())
    for mid, mod in registry.installed().items():
        if mid in enabled_ids():
            scopes.update(mod.esi_scopes)
    return sorted(scopes)
