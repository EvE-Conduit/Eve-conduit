"""The Celery queue character and corporation syncs wait in, apart from other background jobs.

Beat's schedulers top this queue up to ``CONDUIT_SYNC_QUEUE_MAX`` jobs instead of queueing a fixed number per
run: with any number of characters they queue all that is due while the workers keep up, and stop piling jobs
into Redis when they don't. Everything else (webhooks, a newly linked character's first sync, imports) runs on
the default queue, so it never waits behind thousands of routine syncs.
"""

from __future__ import annotations

import logging

from django.conf import settings

log = logging.getLogger(__name__)

QUEUE = "sync"


def waiting() -> int | None:
    """Jobs waiting in the sync queue, or None when that can't be read (no broker, Redis down)."""
    if settings.CELERY_TASK_ALWAYS_EAGER:
        return 0
    from conduit.celery import app

    try:
        with app.connection_for_read() as conn:
            return conn.default_channel.client.llen(QUEUE)
    except Exception as exc:
        log.warning("Could not read the length of the sync queue: %s", exc)
        return None


def room() -> int:
    """How many more sync jobs may be queued now."""
    queued = waiting()
    if queued is None:
        return 0  # don't add to a queue we can't see; the next run tries again
    return max(0, settings.CONDUIT_SYNC_QUEUE_MAX - queued)
