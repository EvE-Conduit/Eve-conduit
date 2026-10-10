"""Mounted at /api/public/p/wiki/ for everyone, signed in or not. Only pages marked public show up here, and nothing
here writes, so ``request.user`` is never consulted."""

from ninja import Router
from ninja.errors import HttpError

from . import services

router = Router(tags=["wiki (public)"])


@router.get("/pages")
def pages(request):
    rows = list(services.public_pages().select_related("parent").order_by("order", "title"))
    return {"tree": services.tree(rows), "count": len(rows)}


@router.get("/pages/{slug}")
def page(request, slug: str):
    p = services.public_pages().filter(slug=slug).select_related("parent").prefetch_related("children").first()
    if p is None:
        raise HttpError(404, "No such page")
    row = services.out(p)
    # Who wrote it is members' business.
    row.pop("created_by", None)
    row.pop("updated_by", None)
    return row
