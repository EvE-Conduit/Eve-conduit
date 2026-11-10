"""Mounted at /api/public/p/discord/ for everyone, signed in or not: temporary access links.

Whoever has a link can join the Discord server through it until it expires, by signing in with Discord. The site
learns their Discord name and id from that and nothing else.
"""

from django.core.cache import cache
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field

from conduit.audit.services import client_ip

from . import guests
from .models import DiscordSettings, GuestLink
from .services import LinkError

router = Router(tags=["discord (public)"])
#: Tries to join one visitor (by IP address) may make in ``WINDOW`` seconds. Each one calls Discord with the
#: bot's token, so this also keeps a stranger from getting the bot rate limited.
JOIN_LIMIT, WINDOW = 10, 600


def _run(fn, *args):
    try:
        return fn(*args)
    except LinkError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _count(request) -> None:
    key = f"discord:public-join:{client_ip(request) or 'unknown'}"
    cache.add(key, 0, timeout=WINDOW)
    try:
        used = cache.incr(key)
    except ValueError:  # expired between add and incr
        cache.set(key, 1, timeout=WINDOW)
        used = 1
    if used > JOIN_LIMIT:
        raise HttpError(429, "Too many tries from here; wait a few minutes")


def _out(link: GuestLink, s: DiscordSettings) -> dict:
    return {
        "label": link.label,
        "server": s.guild_name,
        "expires_at": link.expires_at.isoformat(),
        "status": guests.status(link),
        "invited_by": link.created_by.display_name if link.created_by else None,
    }


@router.get("/guest/{token}")
def show(request, token: str):
    return _out(_run(guests.get_link, token), DiscordSettings.load())


@router.post("/guest/{token}/start")
def start(request, token: str):
    """Where to send the visitor to sign in with Discord."""
    link = _run(guests.get_link, token)
    _count(request)
    return {"url": _run(guests.start, request, link)}


class FinishIn(Schema):
    code: str = Field(max_length=200)
    state: str = Field(max_length=200)


@router.post("/guest-finish")
def finish(request, payload: FinishIn):
    """Discord sent the visitor back: put them on the server."""
    _count(request)
    guest = _run(guests.finish, request, payload.code, payload.state)
    s = DiscordSettings.load()
    return {**_out(guest.link, s), "username": guest.username, "avatar": guest.avatar_url,
            "server_url": f"https://discord.com/channels/{s.guild_id}"}
