from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.audit.services import record
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


class ToggleIn(Schema):
    enabled: bool


@router.get("/plugins", response=list[ModuleOut])
@require_perm("site.manage_plugins")
def list_modules(request):
    sync_installed()
    on = enabled_ids()
    return [
        {
            "id": mid,
            "source": entry.source,
            "manifest": entry.plugin.manifest() if entry.ok else None,
            "enabled": mid in on,
            "problems": entry.problems,
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
