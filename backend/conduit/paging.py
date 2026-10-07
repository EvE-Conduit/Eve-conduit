"""Limit/offset pages in the same shape as ninja's paginator ({"items": [...], "count": n}),
converting only the rows on the page."""

from collections.abc import Callable

from ninja.errors import HttpError

MAX_LIMIT = 500


def page(qs, out: Callable, limit: int = 50, offset: int = 0) -> dict:
    if limit < 1 or offset < 0:
        raise HttpError(400, "limit must be at least 1 and offset at least 0")
    limit = min(limit, MAX_LIMIT)
    return {"count": qs.count(), "items": [out(row) for row in qs[offset : offset + limit]]}
