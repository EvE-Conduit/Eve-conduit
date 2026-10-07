"""Administration → Updates."""

from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.permissions import require_perm

from . import services
from .models import UpdateState

router = Router(tags=["admin"])


class VersionIn(Schema):
    version: str


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
