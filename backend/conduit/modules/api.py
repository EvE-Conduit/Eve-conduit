from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.audit.services import record
from conduit.permissions import require_perm

from . import registry
from .services import ModuleError, enabled_ids, set_enabled, sync_installed

router = Router(tags=["admin"])


class ModuleOut(Schema):
    id: str
    source: str
    manifest: dict | None
    enabled: bool
    problems: list[str]


class ToggleIn(Schema):
    enabled: bool


@router.get("/modules", response=list[ModuleOut])
@require_perm("site.manage_modules")
def list_modules(request):
    sync_installed()
    on = enabled_ids()
    return [
        {
            "id": mid,
            "source": entry.source,
            "manifest": entry.module.manifest() if entry.ok else None,
            "enabled": mid in on,
            "problems": entry.problems,
        }
        for mid, entry in sorted(registry.discover().items())
    ]


@router.post("/modules/{module_id}")
@require_perm("site.manage_modules")
def toggle_module(request, module_id: str, payload: ToggleIn):
    try:
        set_enabled(module_id, payload.enabled)
    except ModuleError as exc:
        raise HttpError(400, str(exc)) from None
    record(f"module.{'enabled' if payload.enabled else 'disabled'}",
           f"{'enabled' if payload.enabled else 'disabled'} module {module_id}", request=request,
           target_type="module", details={"module": module_id})
    return {"ok": True, "enabled": payload.enabled}
