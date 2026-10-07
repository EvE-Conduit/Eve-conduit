import time

from celery import shared_task
from django.core.cache import cache

HEARTBEAT_KEY = "conduit:heartbeat"


@shared_task
def heartbeat():
    """Beat queues this every minute; a worker running it proves both are alive."""
    cache.set(HEARTBEAT_KEY, time.time(), 3600)
    return True
