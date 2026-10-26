"""Mounted at /api/p/projects/. Only reachable while the plugin is enabled."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from . import services
from .models import Contribution, Item

router = Router(tags=["projects"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.ProjectError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _manager(request):
    if not services.can_manage(request.user):
        raise HttpError(403, "You can't run industry projects")


def _item(request, item_id: int) -> Item:
    item = get_object_or_404(Item.objects.select_related("project"), pk=item_id)
    _run(services.project_for, request.user, item.project_id)
    return item


def _contribution(request, contribution_id: int) -> Contribution:
    c = get_object_or_404(Contribution.objects.select_related("item__project", "user__main_character"), pk=contribution_id)
    _run(services.project_for, request.user, c.item.project_id)
    return c


# --- members ---------------------------------------------------------------------------------------------------------


@router.get("/projects")
def projects(request, show: str = "open"):
    return services.projects_out(request.user, show)


@router.get("/projects/{project_id}")
def project(request, project_id: int):
    return services.project_out(_run(services.project_for, request.user, project_id), request.user)


@router.get("/me")
def me(request):
    return services.my_contributions(request.user)


class ClaimIn(Schema):
    quantity: int


@router.post("/items/{item_id}/claim")
def claim(request, item_id: int, payload: ClaimIn):
    item = _item(request, item_id)
    _run(services.claim, item, request.user, payload.quantity)
    return services.project_out(item.project, request.user)


@router.post("/contributions/{contribution_id}/release")
def release(request, contribution_id: int):
    c = _contribution(request, contribution_id)
    _run(services.release, c, request.user)
    return {"ok": True}


class DeliverIn(Schema):
    note: str = ""


@router.post("/contributions/{contribution_id}/deliver")
def deliver(request, contribution_id: int, payload: DeliverIn):
    c = _contribution(request, contribution_id)
    _run(services.deliver, c, request.user, payload.note)
    return {"ok": True}


# --- managers --------------------------------------------------------------------------------------------------------


@router.get("/queue")
def queue(request, status: str = "delivered"):
    _manager(request)
    return services.queue(status)


@router.post("/contributions/{contribution_id}/confirm")
def confirm(request, contribution_id: int):
    _manager(request)
    _run(services.confirm, _contribution(request, contribution_id), request.user, request=request)
    return {"ok": True}


class RejectIn(Schema):
    note: str = ""


@router.post("/contributions/{contribution_id}/reject")
def reject(request, contribution_id: int, payload: RejectIn):
    _manager(request)
    _run(services.reject, _contribution(request, contribution_id), request.user, payload.note, request=request)
    return {"ok": True}


@router.get("/options")
def options(request):
    from django.contrib.auth.models import Group

    from conduit.access.models import State

    _manager(request)
    return {
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


@router.get("/types")
def types(request, q: str = ""):
    _manager(request)
    return services.search_types(q)


class ProjectIn(Schema):
    name: str
    description: str = ""
    location: str = ""
    deadline: str | None = None
    states: list[int] = []
    groups: list[int] = []
    notify: bool = True


@router.post("/projects")
def create_project(request, payload: ProjectIn):
    _manager(request)
    p = _run(services.save_project, None, payload.dict(), request.user, request=request)
    return services.project_out(p, request.user)


@router.put("/projects/{project_id}")
def update_project(request, project_id: int, payload: ProjectIn):
    _manager(request)
    p = _run(services.save_project, _run(services.project_for, request.user, project_id), payload.dict(), request.user,
             request=request)
    return services.project_out(p, request.user)


class CloseIn(Schema):
    status: str


@router.post("/projects/{project_id}/close")
def close_project(request, project_id: int, payload: CloseIn):
    _manager(request)
    p = _run(services.close, _run(services.project_for, request.user, project_id), payload.status, request.user, request=request)
    return services.project_out(p, request.user)


@router.post("/projects/{project_id}/reopen")
def reopen_project(request, project_id: int):
    _manager(request)
    p = _run(services.reopen, _run(services.project_for, request.user, project_id), request.user, request=request)
    return services.project_out(p, request.user)


@router.delete("/projects/{project_id}")
def delete_project(request, project_id: int):
    _manager(request)
    _run(services.delete_project, _run(services.project_for, request.user, project_id), request.user, request=request)
    return {"ok": True}


class ItemIn(Schema):
    type_id: int
    quantity: int
    points_per_unit: int = 0
    isk_per_unit: float = 0


@router.post("/projects/{project_id}/items")
def add_item(request, project_id: int, payload: ItemIn):
    _manager(request)
    p = _run(services.project_for, request.user, project_id)
    _run(services.add_item, p, payload.type_id, payload.quantity, payload.points_per_unit, payload.isk_per_unit)
    return services.project_out(p, request.user)


class PasteIn(Schema):
    text: str
    points_per_unit: int = 0
    isk_per_unit: float = 0


@router.post("/projects/{project_id}/items/paste")
def paste_items(request, project_id: int, payload: PasteIn):
    _manager(request)
    p = _run(services.project_for, request.user, project_id)
    result = _run(services.add_from_paste, p, payload.text, payload.points_per_unit, payload.isk_per_unit, request.user,
                  request=request)
    return {**result, "project": services.project_out(p, request.user)}


class ItemUpdateIn(Schema):
    quantity: int
    points_per_unit: int = 0
    isk_per_unit: float = 0


@router.put("/items/{item_id}")
def update_item(request, item_id: int, payload: ItemUpdateIn):
    _manager(request)
    item = _item(request, item_id)
    _run(services.update_item, item, payload.quantity, payload.points_per_unit, payload.isk_per_unit)
    return services.project_out(item.project, request.user)


@router.delete("/items/{item_id}")
def delete_item(request, item_id: int):
    _manager(request)
    item = _item(request, item_id)
    _run(services.delete_item, item)
    return services.project_out(item.project, request.user)
