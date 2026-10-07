"""Turning events into webhook requests."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time

import httpx
from celery import shared_task
from django.conf import settings
from django.utils import timezone

from . import bus
from .safety import UnsafeUrl, check_url

log = logging.getLogger(__name__)
LEVEL_COLORS = {"info": 0x38BDF8, "success": 0x34D399, "warning": 0xFBBF24, "danger": 0xF43F5E}


def describe(event: dict) -> tuple[str, str, str]:
    """A human title, description and level for an event."""
    data = event.get("data", {})
    etype = bus.EVENT_TYPES.get(event["event"])
    title = data.get("title") or (etype.label if etype else event["event"])
    text = data.get("summary") or data.get("body") or ""
    if not text:
        text = ", ".join(f"{k}: {v}" for k, v in data.items() if isinstance(v, (str, int, float)) and not k.endswith("_id"))
    return title, text[:1800], data.get("level", "info")


def render(kind: str, event: dict) -> dict:
    if kind == "json":
        return event
    title, text, level = describe(event)
    site = settings.SITE_URL
    if kind == "discord":
        embed = {
            "title": title[:256],
            "description": text,
            "color": LEVEL_COLORS.get(level, LEVEL_COLORS["info"]),
            "timestamp": event["at"],
            "footer": {"text": f"EvE Conduit · {event['event']}"},
        }
        link = event.get("data", {}).get("link")
        if link:
            embed["url"] = site + link if link.startswith("/") else link
        return {"username": "EvE Conduit", "embeds": [embed]}
    # slack
    return {"text": f"*{title}*\n{text}" if text else f"*{title}*"}


def sign(secret: str, body: bytes) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


@bus.on("*")
def _queue(event: bus.Event):
    from .models import Webhook

    data = event.as_dict()
    for hook_id, events in Webhook.objects.filter(enabled=True).values_list("pk", "events"):
        if not events or event.name in events:
            deliver.delay(hook_id, data)


@shared_task(bind=True, max_retries=4)
def deliver(self, hook_id: int, event: dict, retry: bool = True) -> str:
    from .models import Webhook, WebhookDelivery

    hook = Webhook.objects.filter(pk=hook_id, enabled=True).first()
    if hook is None:
        return "gone"
    body = json.dumps(render(hook.kind, event), default=str).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "EvE-Conduit-Webhooks"}
    if hook.kind == "json":
        headers["X-Conduit-Event"] = event["event"]
        headers["X-Conduit-Signature"] = sign(hook.secret, body)
    started = time.monotonic()
    status, error, unsafe = None, "", False
    try:
        check_url(hook.url)
        # No redirects: a 3xx could bounce the request to an internal address.
        resp = httpx.post(hook.url, content=body, headers=headers, timeout=10, follow_redirects=False)
        status = resp.status_code
        if not resp.is_success:
            # Only the status, never the reply body: it would let admins read whatever the URL returns.
            error = f"HTTP {status}" + (" (redirects are not followed)" if resp.is_redirect else "")
    except UnsafeUrl as exc:
        error, unsafe = str(exc)[:300], True
    except httpx.TimeoutException:
        error = "timed out"
    except httpx.HTTPError as exc:
        error = f"connection failed ({exc.__class__.__name__})"
    ok = not error
    WebhookDelivery.objects.create(
        webhook=hook, event=event["event"], status=status, ok=ok, error=error,
        duration_ms=int((time.monotonic() - started) * 1000), attempt=self.request.retries + 1,
    )
    hook.last_status, hook.last_error, hook.last_delivery_at = status, error, timezone.now()
    hook.failures = 0 if ok else hook.failures + 1
    hook.save(update_fields=["last_status", "last_error", "last_delivery_at", "failures"])
    if retry and not ok and not unsafe and (status is None or status == 429 or status >= 500) and self.request.retries < self.max_retries:
        raise self.retry(countdown=30 * 2**self.request.retries)
    return "ok" if ok else "failed"
