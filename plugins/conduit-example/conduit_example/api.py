"""Mounted at /api/p/example/. Only reachable while the plugin is enabled.

The core mounts every plugin router behind the session login (``auth=django_auth``, with CSRF checks on POST/PUT/
DELETE), and members-only plugins are closed to everyone else. That's all it checks: a route that only some people
may use still needs ``@require_perm("<app label>.<permission>")`` (``conduit.permissions``), and a route that takes an
id must check the object is the caller's to see.
"""

import logging

from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.esi.client import esi
from conduit.esi.exceptions import EsiBackoff, EsiError

log = logging.getLogger(__name__)
router = Router(tags=["example"])


class StatusOut(Schema):
    players: int
    server_version: str
    start_time: str
    vip: bool = False


@router.get("/status", response=StatusOut)
def status(request):
    # The core client handles caching, error limits and rate limits for us.
    try:
        return esi().get("/status").data
    except (EsiError, EsiBackoff):
        # Log the details; don't send error text from ESI or the network to the browser.
        log.warning("ESI /status failed", exc_info=True)
        raise HttpError(503, "Tranquility's status isn't available right now") from None
