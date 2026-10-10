"""Mounted at /api/public/p/mumble/ for everyone, signed in or not: temporary access links.

Whoever has a link can get a guest login from it until it expires. The login is made for the visitor, never for a
signed-in member, so a link can't be used to act in a member's name.
"""

from django.core.cache import cache
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field

from conduit.audit.services import client_ip

from . import services
from .models import MumbleSettings, TempLink

router = Router(tags=["mumble (public)"])
#: Guest logins one visitor (by IP address) may make in ``WINDOW`` seconds.
REDEEM_LIMIT, WINDOW = 5, 600


def _link(token: str) -> TempLink:
    link = TempLink.objects.filter(token=token).select_related("created_by").first() if token else None
    if link is None or not (MumbleSettings.load().temp_enabled):
        raise HttpError(404, "No such link")
    return link


def _out(link: TempLink, s: MumbleSettings) -> dict:
    status = link.status()
    return {
        "label": link.label,
        "server": s.server_name or s.host,
        "host": s.host,
        "port": s.port,
        "expires_at": link.expires_at.isoformat(),
        "status": status,
        "invited_by": link.created_by.display_name if link.created_by else None,
    }


@router.get("/temp/{token}")
def show(request, token: str):
    link = _link(token)
    return _out(link, MumbleSettings.load())


class RedeemIn(Schema):
    name: str = Field(max_length=60)


def _count(request) -> None:
    key = f"mumble:public-redeem:{client_ip(request) or 'unknown'}"
    cache.add(key, 0, timeout=WINDOW)
    try:
        used = cache.incr(key)
    except ValueError:  # expired between add and incr
        cache.set(key, 1, timeout=WINDOW)
        used = 1
    if used > REDEEM_LIMIT:
        raise HttpError(429, "Too many logins made from here; wait a few minutes")


@router.post("/temp/{token}")
def redeem(request, token: str, payload: RedeemIn):
    """Make a guest login. The password is in the answer and nowhere else afterwards."""
    link = _link(token)
    s = MumbleSettings.load()
    _count(request)
    try:
        temp, password = services.redeem_temp_link(link, payload.name, client_ip(request), s)
    except services.MumbleError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return {
        **_out(link, s),
        "username": temp.username,
        "display_name": temp.display_name,
        "password": password,
        "url": services.connect_url(s, temp.username, password),
        "groups": link.groups,
    }
