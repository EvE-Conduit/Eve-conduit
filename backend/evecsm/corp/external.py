"""``/api/v1/corporations/...``: corporation sheets for API keys, one ``corp:<section>`` scope per section."""

import json

from django.http import JsonResponse
from django.urls import Resolver404, resolve
from ninja import Router
from ninja.errors import HttpError

from evecsm.external.auth import check_scope

from . import registry

router = Router(tags=["corporation sheet"])
VIEW_ALL = {"corp.view_all_corporations"}
FINANCES = {"corp.view_corporation_wallets"}


def _keys(request) -> set[str]:
    return {s.split(":", 1)[1] for s in request.api_key.scopes if s.startswith("corp:")}


def _grant(request, sections: set[str]):
    """Let the key's principal see what its scopes allow, then reuse the web UI's views."""
    extra = set(VIEW_ALL)
    if any(registry.SECTIONS[k].financial for k in sections if k in registry.SECTIONS):
        extra |= FINANCES
    request.user._perms = set(request.user._perms) | extra


def _internal(request, path: str):
    try:
        match = resolve(path)
    except Resolver404:
        raise HttpError(404, "Not found") from None
    if not match.route.startswith("api/corporations/") or ".." in path:
        raise HttpError(404, "Not found")
    return match.func(request, *match.args, **match.kwargs)


@router.get("/{corporation_id}/sheet")
def corporation_sheet(request, corporation_id: int):
    """The corporation and how fresh each section is, listing the sections this key may read."""
    allowed = _keys(request)
    if not allowed:
        raise HttpError(403, "This API key has no corp:<section> scope")
    check_scope(request, f"corp:{min(allowed)}")
    _grant(request, set())
    response = _internal(request, f"/api/corporations/{corporation_id}")
    if response.status_code != 200:
        return response
    data = json.loads(response.content)
    data["sections"] = [s for s in data.get("sections", []) if s["key"] in allowed]
    return JsonResponse(data)


@router.get("/{corporation_id}/sheet/{path:rest}")
def corporation_section(request, corporation_id: int, rest: str):
    """Any corporation sheet endpoint of the web UI, e.g. ``/sheet/structures`` or ``/sheet/wallets/journal``."""
    section = rest.split("/", 1)[0]
    if section not in registry.SECTIONS:
        raise HttpError(404, f"No corporation sheet section {section!r}")
    check_scope(request, f"corp:{section}")
    _grant(request, {section})
    return _internal(request, f"/api/corporations/{corporation_id}/{rest}")
