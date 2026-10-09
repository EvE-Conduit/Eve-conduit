"""Who a permission is meant for, so the permission picker can group them: regular users, HR staff, directors and
admins. Plugins say where theirs belong with ``Plugin.permission_tiers``; anything else is shown under "Other".
"""

from __future__ import annotations

TIERS = (
    ("member", "Regular users", "Everyday things any member may do"),
    ("hr", "HR staff", "Recruiting, mentoring and looking after members and their characters"),
    ("director", "Directors", "Running the corporation or alliance: finances, fleets, doctrines, payouts"),
    ("admin", "Admins", "Running the site itself; give these to very few people"),
)

CORE = {
    "sheet.refresh_characters": "member",
    "site.view_members": "hr",
    "access.view_compliance": "hr",
    "sheet.view_corporation_characters": "hr",
    "sheet.view_alliance_characters": "hr",
    "sheet.view_all_characters": "hr",
    "sheet.use_member_audit": "hr",
    "corp.view_own_corporation": "director",
    "corp.view_alliance_corporations": "director",
    "corp.view_all_corporations": "director",
    "corp.view_corporation_wallets": "director",
    "corp.refresh_corporations": "director",
    "site.view_health": "admin",
    "site.view_logs": "admin",
}


def plugin_tiers() -> dict[str, str]:
    """``{"app.codename": tier}`` from every installed plugin's ``permission_tiers``."""
    from django.apps import apps

    from conduit.plugins import registry

    out = {}
    for plugin in registry.installed().values():
        declared = getattr(plugin, "permission_tiers", None) or {}
        label = None
        if plugin.app:
            config = next((c for c in apps.get_app_configs() if f"{c.__module__}.{c.__class__.__name__}" == plugin.app), None)
            label = config.label if config else None
        for codename, tier in declared.items():
            name = codename if "." in codename else f"{label or plugin.id}.{codename}"
            if tier in {t for t, _, _ in TIERS}:
                out[name] = tier
    return out


def tier_of(name: str, plugins: dict[str, str] | None = None) -> str | None:
    from .services import ADMIN_PERMISSIONS

    if name in ADMIN_PERMISSIONS:
        return "admin"
    if name in CORE:
        return CORE[name]
    return (plugins if plugins is not None else plugin_tiers()).get(name)
