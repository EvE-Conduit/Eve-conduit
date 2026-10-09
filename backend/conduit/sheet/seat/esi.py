"""A stand-in for the ESI client that answers from a SeAT dump.

SeAT stores ESI's responses almost field for field, so each section's normal ``sync(character, esi)`` can run
against this instead of EVE: the data lands exactly as a live sync would store it, history merges by EVE's ids,
and nothing here needs to know how a section saves its data. Routes (in ``routes/``) turn SeAT rows back into the
JSON ESI would have sent.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone

from conduit.esi.client import EsiResponse
from conduit.esi.exceptions import EsiBackoff, EsiError

from .staging import Staging

_ROUTES: list[tuple[re.Pattern, Callable, frozenset]] = []  # (path, handler, names of {name:str} parts)


def route(pattern: str):
    """Register a handler for an ESI path such as ``/characters/{cid}/wallet``. ``{name}`` matches digits and is
    passed as an int keyword; ``{name:str}`` matches any one path segment (e.g. a killmail hash) as a str. The
    handler is called ``handler(ctx, params, **parts)`` and returns the JSON ESI would have; raising
    ``missing()`` makes the call fail like a 404."""
    def part(m):
        return f"(?P<{m[1]}>[^/]+)" if m[2] == ":str" else f"(?P<{m[1]}>\\d+)"
    regex = re.compile("^" + re.sub(r"\{(\w+)(:str)?\}", part, pattern.rstrip("/")) + "/?$")

    texts = frozenset(re.findall(r"\{(\w+):str\}", pattern))

    def register(fn):
        _ROUTES.append((regex, fn, texts))
        return fn
    return register


def missing(what: str = "not in the SeAT dump") -> EsiError:
    return EsiError(404, what)


def unavailable() -> EsiBackoff:
    """For lookups (structures, stations) SeAT didn't have: the caller gives up for now and a live sync retries."""
    return EsiBackoff(0, "not in the SeAT dump")


@dataclass
class Context:
    """What a route knows while answering for one character and section."""

    store: Staging
    character: object
    section: str
    #: The section has synced from EVE before, so Conduit's own data is newer: routes return only what's missing.
    synced: bool
    names: set = field(default_factory=set)
    #: Scratch space for routes that build something once per character and section (e.g. the mail list).
    cache: dict = field(default_factory=dict)

    @property
    def cid(self) -> int:
        return self.character.pk


def esi_dt(value) -> str | None:
    """A SeAT datetime ("2024-05-01 12:00:00", UTC) as ESI writes it ("2024-05-01T12:00:00Z")."""
    if value in (None, "", "0000-00-00 00:00:00"):
        return None
    if isinstance(value, datetime):
        value = value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    value = str(value).replace(" ", "T", 1).split(".")[0].rstrip("Z")
    if "T" not in value:  # a bare date ("2010-01-01")
        value += "T00:00:00"
    return value + "Z"


def drop_none(d: dict) -> dict:
    """ESI leaves optional fields out rather than sending null."""
    return {k: v for k, v in d.items() if v is not None}


class SeatEsi:
    """Quacks like ``conduit.esi.client.EsiClient`` for the calls character syncs make."""

    def __init__(self, ctx: Context):
        self.ctx = ctx

    def _answer(self, path: str, params: dict | None, body=None):
        path = path.split("?")[0].rstrip("/")
        for regex, fn, texts in _ROUTES:
            m = regex.match(path)
            if m:
                parts = {k: v if k in texts else int(v) for k, v in m.groupdict().items()}
                if body is not None:
                    parts["body"] = body
                return fn(self.ctx, params or {}, **parts)
        raise missing(f"{path} is not imported from SeAT")

    def get(self, path: str, *, character=None, params: dict | None = None) -> EsiResponse:
        return EsiResponse(self._answer(path, params), 200, {})

    def get_all_pages(self, path: str, *, character=None, params: dict | None = None) -> list:
        return list(self._answer(path, params))

    def post(self, path: str, body, *, character=None) -> EsiResponse:
        return EsiResponse(self._answer(path, None, body), 200, {})
