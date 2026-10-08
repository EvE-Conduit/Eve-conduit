from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.audit.api import filter_service, service_out
from conduit.audit.models import ServiceLog
from conduit.audit.services import record
from conduit.paging import page
from conduit.permissions import require_perm

from . import installs, registry
from .services import PluginError, enabled_ids, set_enabled, sync_installed

router = Router(tags=["admin"])


class ModuleOut(Schema):
    id: str
    source: str
    manifest: dict | None
    enabled: bool
    problems: list[str]
    #: Warnings and errors in the plugin's log over the last 24 hours.
    log_warnings: int
    log_errors: int


class ToggleIn(Schema):
    enabled: bool


@router.get("/plugins", response=list[ModuleOut])
@require_perm("site.manage_plugins")
def list_modules(request):
    sync_installed()
    on = enabled_ids()
    counts = {
        row["plugin"]: row
        for row in ServiceLog.objects.filter(at__gte=timezone.now() - timedelta(hours=24)).exclude(plugin="")
        .values("plugin")
        .annotate(warnings=Count("id", filter=Q(level="WARNING")), errors=Count("id", filter=Q(level__in=("ERROR", "CRITICAL"))))
    }
    return [
        {
            "id": mid,
            "source": entry.source,
            "manifest": entry.plugin.manifest() if entry.ok else None,
            "enabled": mid in on,
            "problems": entry.problems,
            "log_warnings": counts.get(mid, {}).get("warnings", 0),
            "log_errors": counts.get(mid, {}).get("errors", 0),
        }
        for mid, entry in sorted(registry.discover().items())
    ]


@router.post("/plugins/{plugin_id}")
@require_perm("site.manage_plugins")
def toggle_module(request, plugin_id: str, payload: ToggleIn):
    try:
        set_enabled(plugin_id, payload.enabled)
    except PluginError as exc:
        raise HttpError(400, str(exc)) from None
    record(f"plugin.{'enabled' if payload.enabled else 'disabled'}",
           f"{'enabled' if payload.enabled else 'disabled'} plugin {plugin_id}", request=request,
           target_type="plugin", details={"plugin": plugin_id})
    return {"ok": True, "enabled": payload.enabled}


@router.get("/plugins/{plugin_id}/logs")
@require_perm("site.manage_plugins")
def module_logs(request, plugin_id: str, level: str = "", q: str = "", limit: int = 50, offset: int = 0):
    """Everything the plugin logged: its own messages from CONDUIT_PLUGIN_LOG_LEVEL up, plus installs,
    updates and switching it on and off."""
    return page(filter_service(ServiceLog.objects.filter(plugin=plugin_id), level, q=q), service_out, limit, offset)


# --- installing from the catalog or git (Administration → Plugins → Browse) ------------------------------


class InstallAction(Schema):
    op: str
    package: str | None = None
    url: str | None = None


class InstallIn(Schema):
    actions: list[InstallAction]
    #: Switch new catalog plugins on once they're installed.
    enable: bool = True
    #: Let new catalog plugins install their own updates.
    auto_update: bool = True


class AutoUpdateIn(Schema):
    package: str
    enabled: bool


def _installs(fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except installs.InstallError as exc:
        raise HttpError(400, str(exc)) from None
    return installs.overview()


@router.get("/plugin-installs")
@require_perm("site.manage_plugins")
def install_overview(request):
    return installs.overview()


@router.post("/plugin-installs/refresh")
@require_perm("site.manage_plugins")
def refresh_catalog(request):
    return _installs(installs.refresh_catalog, True)


@router.post("/plugin-installs")
@require_perm("site.manage_plugins")
def request_install(request, payload: InstallIn):
    actions = [a.dict(exclude_none=True) for a in payload.actions]
    _installs(installs.request, request.user, actions, enable=payload.enable)
    for a in actions:
        if a["op"] == "install" and a.get("package"):
            installs.set_auto_update(a["package"], payload.auto_update)
    return installs.overview()


@router.post("/plugin-installs/cancel")
@require_perm("site.manage_plugins")
def cancel_install(request):
    return _installs(installs.cancel)


@router.post("/plugin-installs/auto-update")
@require_perm("site.manage_plugins")
def auto_update(request, payload: AutoUpdateIn):
    record(f"plugin.auto_update_{'on' if payload.enabled else 'off'}",
           f"turned automatic updates {'on' if payload.enabled else 'off'} for {payload.package}", request=request,
           target_type="plugin", details={"package": payload.package})
    return _installs(installs.set_auto_update, payload.package, payload.enabled)
