"""Demo mode (see conduit.demo.seed). This plugin keeps no data of its own, so ``seed`` has nothing to write; it's
here to show plugin authors where example data goes. Plugins with models create rows in it with the normal ORM
(it runs against the demo database), building on the example members in ``demo``: ``demo.users``,
``demo.characters``, ``demo.corporations``, and ``demo.rng`` / ``demo.now`` for anything random or dated.

The demo never calls ESI, so the status page shows ``status()`` instead of Tranquility's real one."""

from datetime import timedelta

from django.utils import timezone


def seed(demo):
    """Nothing to store: the status page is answered by ``status()`` while the demo is on."""


def status() -> dict:
    """A made-up Tranquility status: up since the last daily downtime (11:00 EVE time)."""
    now = timezone.now()
    start = now.replace(hour=11, minute=0, second=0, microsecond=0)
    if start > now:
        start -= timedelta(days=1)
    # A quiet morning, a busy evening.
    players = 18_000 + int(9_000 * min(1.0, (now - start).total_seconds() / 36_000))
    return {"players": players, "server_version": "2984521", "start_time": start.isoformat(), "vip": False}
