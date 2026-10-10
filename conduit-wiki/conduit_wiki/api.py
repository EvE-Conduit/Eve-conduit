"""Mounted at /api/p/wiki/. Only reachable while the plugin is enabled."""

from django.contrib.auth.models import Group
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth
from pydantic import Field

from conduit.access.models import State
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import Page

router = Router(tags=["wiki"], auth=django_auth)


@router.get("")
def overview(request):
    """The page tree the user may read, the home page if there is one, and what they may do."""
    return services.overview(request.user)


@router.get("/audience")
@require_perm("wiki.manage_wiki")
def audience(request):
    return {
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


def _get(request, slug: str) -> Page:
    try:
        return services.get_page(request.user, slug)
    except services.WikiError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _editable(request, slug: str) -> Page:
    p = _get(request, slug)
    if not services.can_edit_page(request.user, p):
        raise HttpError(403, "This page is locked" if p.locked else "You can't edit wiki pages")
    return p


def _one(request, p: Page) -> dict:
    p = Page.objects.select_related("parent", "created_by__main_character", "updated_by__main_character").prefetch_related("states", "groups", "children").get(pk=p.pk)
    return services.out(p, request.user, editor=services.can_manage(request.user))


@router.get("/pages/{slug}")
def page(request, slug: str):
    return _one(request, _get(request, slug))


class PageIn(Schema):
    title: str
    body: str = Field("", max_length=services.MAX_BODY)
    slug: str | None = None
    parent: int | None = None
    note: str = ""
    # Managers only; ignored for everyone else.
    states: list[int] | None = None
    groups: list[int] | None = None
    public: bool | None = None
    locked: bool | None = None


def _save(request, p: Page | None, payload: PageIn) -> Page:
    data = payload.model_dump()
    if not services.can_manage(request.user):
        for key in ("states", "groups", "public", "locked"):
            data[key] = None
    try:
        return services.save(p, request.user, **data)
    except services.WikiError as exc:
        raise HttpError(exc.status, str(exc)) from None


@router.post("/pages")
def create(request, payload: PageIn):
    if not services.can_edit(request.user):
        raise HttpError(403, "You can't write wiki pages")
    p = _save(request, None, payload)
    record("wiki.create", f"wrote the wiki page \"{p.title}\"", request=request, target=p)
    return _one(request, p)


@router.put("/pages/{slug}")
def update(request, slug: str, payload: PageIn):
    p = _save(request, _editable(request, slug), payload)
    record("wiki.update", f"edited the wiki page \"{p.title}\"", request=request, target=p)
    return _one(request, p)


@router.delete("/pages/{slug}")
@require_perm("wiki.manage_wiki")
def delete(request, slug: str):
    p = _get(request, slug)
    record("wiki.delete", f"deleted the wiki page \"{p.title}\"", request=request, target=p)
    services.delete(p)
    return {"ok": True}


@router.get("/pages/{slug}/history")
def history(request, slug: str):
    p = _get(request, slug)
    return {"page": {"slug": p.slug, "title": p.title}, "revisions": services.history(p), "can_edit": services.can_edit_page(request.user, p)}


@router.get("/pages/{slug}/history/{number}")
def revision(request, slug: str, number: int):
    p = _get(request, slug)
    r = p.revisions.select_related("author__main_character").filter(number=number).first()
    if r is None:
        raise HttpError(404, "No such revision")
    return services.revision_out(r)


@router.post("/pages/{slug}/restore/{number}")
def restore(request, slug: str, number: int):
    p = _editable(request, slug)
    try:
        p = services.restore(p, number, request.user)
    except services.WikiError as exc:
        raise HttpError(exc.status, str(exc)) from None
    record("wiki.restore", f"restored revision {number} of the wiki page \"{p.title}\"", request=request, target=p)
    return _one(request, p)


class ReorderIn(Schema):
    parent: int | None = None
    ids: list[int]


@router.post("/reorder")
@require_perm("wiki.manage_wiki")
def reorder(request, payload: ReorderIn):
    try:
        services.reorder(request.user, payload.parent, payload.ids)
    except services.WikiError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return {"ok": True}
