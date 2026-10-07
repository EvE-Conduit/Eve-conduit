from ninja import Router

from .registry import search

router = Router(tags=["core"])


@router.get("/search")
def global_search(request, q: str = "", limit: int = 8):
    """Everything matching ``q`` that the user may see, in groups (characters, members, items...)."""
    return {"groups": search(request, q, max(1, min(limit, 25)))}
