"""Administration → Updates and Backups."""

from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.permissions import require_perm

from . import backups, services
from .models import UpdateState

router = Router(tags=["admin"])


class VersionIn(Schema):
    version: str


class RestoreIn(Schema):
    name: str
    confirm: str


def _run(fn, *args):
    try:
        fn(*args)
        return services.state_out(UpdateState.load())
    except services.UpdateError as exc:
        raise HttpError(400, str(exc)) from None


@router.get("/updates")
@require_perm("site.manage_site")
def status(request):
    return services.state_out(UpdateState.load())


@router.post("/updates/check")
@require_perm("site.manage_site")
def check_now(request):
    return _run(services.check, True)


@router.post("/updates/download")
@require_perm("site.manage_site")
def download(request, payload: VersionIn):
    return _run(services.start_download, payload.version)


@router.post("/updates/install")
@require_perm("site.manage_site")
def install(request):
    return _run(services.request_install, request.user)


@router.post("/updates/cancel")
@require_perm("site.manage_site")
def cancel(request):
    return _run(services.cancel_install)


def _backup_run(fn, *args):
    try:
        fn(*args)
        return backups.status_out()
    except services.UpdateError as exc:
        raise HttpError(400, str(exc)) from None


@router.get("/backups")
@require_perm("site.manage_site")
def backup_status(request):
    return backups.status_out()


@router.post("/backups/backup")
@require_perm("site.manage_site")
def backup_now(request):
    return _backup_run(backups.request_backup, request.user)


@router.post("/backups/restore")
@require_perm("site.manage_site")
def restore(request, payload: RestoreIn):
    return _backup_run(backups.request_restore, request.user, payload.name, payload.confirm)


@router.post("/backups/cancel")
@require_perm("site.manage_site")
def backup_cancel(request):
    return _backup_run(backups.cancel)
