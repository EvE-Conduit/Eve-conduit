"""Mounted at /api/p/blueprints/. Only reachable while the plugin is enabled."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from . import services
from .models import Request

router = Router(tags=["blueprints"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.LibraryError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _viewer(request):
    if not services.can_view(request.user):
        raise HttpError(403, "You can't see the blueprint library")


def _manager(request):
    if not services.can_manage(request.user):
        raise HttpError(403, "You can't handle blueprint requests")


def _request(request_id: int) -> Request:
    return get_object_or_404(Request.objects.select_related("user__main_character", "handled_by__main_character"), pk=request_id)


# --- the library ------------------------------------------------------------------------------------------------------


@router.get("/library")
def library(request, q: str = "", category: str = "", kind: str = "", me_min: int | None = None, source: str = "",
            corporation: int | None = None):
    _viewer(request)
    return services.library(request.user, q=q, category=category, kind=kind, me_min=me_min, source=source,
                            corporation_id=corporation)


@router.get("/library/{type_id}")
def library_type(request, type_id: int):
    _viewer(request)
    return _run(services.type_detail, request.user, type_id)


@router.get("/research")
def research(request):
    _viewer(request)
    return services.research(request.user)


# --- sharing one's own originals --------------------------------------------------------------------------------------


@router.get("/sharing")
def sharing(request):
    _viewer(request)
    return services.my_characters(request.user)


class ShareIn(Schema):
    shared: bool


@router.put("/sharing/{character_id}")
def set_sharing(request, character_id: int, payload: ShareIn):
    _viewer(request)
    _run(services.set_sharing, request.user, character_id, payload.shared)
    return services.my_characters(request.user)


# --- members' requests ------------------------------------------------------------------------------------------------


@router.get("/options")
def options(request):
    _viewer(request)
    return {"projects": services.projects_to_link(request.user), "can_manage": services.can_manage(request.user)}


class RequestIn(Schema):
    kind: str = "copy"
    type_id: int
    runs: int = 1
    copies: int = 1
    min_me: int | None = None
    min_te: int | None = None
    loan_days: int | None = None
    note: str = ""
    project_id: int | None = None


@router.post("/requests")
def create_request(request, payload: RequestIn):
    _viewer(request)
    return services.request_out(_run(services.create_request, request.user, payload.dict()))


@router.get("/requests")
def my_requests(request):
    _viewer(request)
    return services.my_requests(request.user)


@router.post("/requests/{request_id}/cancel")
def cancel(request, request_id: int):
    _viewer(request)
    return services.request_out(_run(services.cancel, _request(request_id), request.user))


# --- managers ---------------------------------------------------------------------------------------------------------


@router.get("/queue")
def queue(request, show: str = "active"):
    _manager(request)
    return {"requests": services.queue(show), "counts": services.queue_counts()}


class NoteIn(Schema):
    note: str = ""


@router.post("/requests/{request_id}/accept")
def accept(request, request_id: int, payload: NoteIn):
    _manager(request)
    return services.request_out(_run(services.accept, _request(request_id), request.user, payload.note, request=request))


@router.get("/requests/{request_id}/jobs")
def jobs(request, request_id: int):
    _manager(request)
    return services.copy_jobs(_request(request_id))


class StartIn(Schema):
    note: str = ""
    #: A corporation copying job; 0 unlinks the job, None leaves it as it is.
    job_id: int | None = None


@router.post("/requests/{request_id}/start")
def start(request, request_id: int, payload: StartIn):
    _manager(request)
    return services.request_out(_run(services.start, _request(request_id), request.user, payload.job_id, payload.note, request=request))


class DeliverIn(Schema):
    note: str = ""
    due_at: str | None = None


@router.post("/requests/{request_id}/deliver")
def deliver(request, request_id: int, payload: DeliverIn):
    _manager(request)
    return services.request_out(_run(services.deliver, _request(request_id), request.user, payload.note, payload.due_at,
                                     request=request))


@router.post("/requests/{request_id}/decline")
def decline(request, request_id: int, payload: NoteIn):
    _manager(request)
    return services.request_out(_run(services.decline, _request(request_id), request.user, payload.note, request=request))


@router.post("/requests/{request_id}/returned")
def returned(request, request_id: int):
    _manager(request)
    return services.request_out(_run(services.mark_returned, _request(request_id), request.user, request=request))


class DueIn(Schema):
    due_at: str


@router.post("/requests/{request_id}/due")
def due(request, request_id: int, payload: DueIn):
    _manager(request)
    return services.request_out(_run(services.extend, _request(request_id), request.user, payload.due_at, request=request))


@router.post("/sync")
def sync_now(request):
    """Read every corporation's blueprints again now."""
    from .sync import sync_all

    _manager(request)
    return {"queued": sync_all()}
