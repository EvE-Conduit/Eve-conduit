"""Mounted at /api/m/example/. Only reachable while the module is enabled."""

from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.esi.client import esi
from conduit.esi.exceptions import EsiBackoff, EsiError

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
    except (EsiError, EsiBackoff) as exc:
        raise HttpError(503, f"Tranquility status unavailable: {exc}") from None
