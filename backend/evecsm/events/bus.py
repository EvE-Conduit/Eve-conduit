"""A small in-process event bus.

Core and modules announce things that happened with ``emit``; anything can listen with ``on``::

    from evecsm.events import bus

    @bus.on("group.joined")
    def welcome(event):
        ...  # event.name, event.payload, event.at

    bus.emit("group.joined", user_id=1, user="Pilot One", group_id=3, group="Capitals")

Handlers run after the surrounding transaction commits, so they never see rolled-back changes, and
a failing handler is logged without breaking the code that emitted the event. Admins can also send
events to Discord, Slack or any URL as webhooks (see ``models.Webhook``).

Modules declare the events they emit with ``register`` so they show up in the webhook editor.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime

from django.db import transaction
from django.utils import timezone

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class EventType:
    name: str
    label: str
    description: str = ""
    module: str | None = None


@dataclass
class Event:
    name: str
    payload: dict
    at: datetime = field(default_factory=timezone.now)

    def as_dict(self) -> dict:
        return {"event": self.name, "at": self.at.isoformat(), "data": self.payload}


EVENT_TYPES: dict[str, EventType] = {}
_handlers: dict[str, list[Callable[[Event], None]]] = defaultdict(list)


def register(name: str, label: str, description: str = "", module: str | None = None) -> EventType:
    """Declare an event so admins can pick it for webhooks."""
    EVENT_TYPES[name] = EventType(name, label, description, module)
    return EVENT_TYPES[name]


def on(*names: str):
    """Decorator: call the function for each of the events (``"*"`` means every event)."""

    def decorator(fn):
        for name in names:
            if fn not in _handlers[name]:
                _handlers[name].append(fn)
        return fn

    return decorator


def off(name: str, fn):
    if fn in _handlers.get(name, []):
        _handlers[name].remove(fn)


def _dispatch(event: Event):
    for fn in [*_handlers.get(event.name, []), *_handlers.get("*", [])]:
        try:
            fn(event)
        except Exception:  # one broken listener must not stop the others
            log.exception("Event handler %s failed for %s", getattr(fn, "__qualname__", fn), event.name)


def emit(name: str, **payload) -> Event:
    """Announce that something happened. Payload values must be JSON-serialisable."""
    event = Event(name, payload)
    transaction.on_commit(lambda: _dispatch(event))
    return event


CORE_EVENTS = [
    ("user.created", "User created", "Someone signed in for the first time"),
    ("user.state_changed", "State changed", "A user's membership state changed"),
    ("character.added", "Character added", "A character was linked to an account"),
    ("character.removed", "Character removed", "A character was unlinked"),
    ("character.main_changed", "Main changed", "A user picked a different main character"),
    ("token.invalid", "Token lost", "A character's ESI token stopped working and needs a new login"),
    ("group.joined", "Joined group", "A user joined a group (by themselves, by request, by an admin or automatically)"),
    ("group.left", "Left group", "A user left or was removed from a group"),
    ("group.request_created", "Group request", "A user asked to join or leave a group"),
    ("group.request_decided", "Group request decided", "A group leader approved or rejected a request"),
    ("sync.failed", "Sync failing", "A character sheet section failed several times in a row"),
    ("compliance.changed", "Compliance changed", "A user became compliant or non-compliant"),
    ("notification.created", "Notification", "A notification was sent to a user"),
    ("webhook.test", "Webhook test", "Sent when an admin presses Test on a webhook"),
]
for _name, _label, _desc in CORE_EVENTS:
    register(_name, _label, _desc)
