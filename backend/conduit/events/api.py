"""Administration > Integrations: webhooks."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field, field_validator

from conduit.audit.services import record
from conduit.paging import page
from conduit.permissions import require_perm

from . import bus
from .models import Webhook, WebhookDelivery, new_secret

router = Router(tags=["admin"])


class WebhookIn(Schema):
    name: str = Field(min_length=1, max_length=80)
    kind: str = "json"
    url: str = Field(max_length=500)
    events: list[str] = []
    enabled: bool = True
    #: Discord: "" (nobody), "here", "everyone" or a role id.
    mention: str = ""
    mention_always: bool = False

    @field_validator("mention")
    @classmethod
    def _mention(cls, v):
        v = (v or "").strip().lstrip("@")
        if v and v not in ("here", "everyone") and not (v.isdigit() and len(v) <= 32):
            raise ValueError("mention must be empty, here, everyone or a Discord role id")
        return v

    @field_validator("kind")
    @classmethod
    def _kind(cls, v):
        if v not in Webhook.Kind.values:
            raise ValueError(f"kind must be one of {', '.join(Webhook.Kind.values)}")
        return v

    @field_validator("url")
    @classmethod
    def _url(cls, v):
        from .safety import UnsafeUrl, check_url

        try:
            check_url(v.strip())
        except UnsafeUrl as exc:
            raise ValueError(str(exc)) from None
        return v.strip()

    @field_validator("events")
    @classmethod
    def _events(cls, v):
        unknown = [e for e in v if e not in bus.EVENT_TYPES]
        if unknown:
            raise ValueError(f"unknown events: {', '.join(unknown)}")
        return v


def hook_out(h: Webhook, with_secret: bool = False) -> dict:
    """``secret`` is only filled in by the calls that make one (create, rotate); it is shown once. Every other
    answer says whether there is one (``has_secret``) and nothing more."""
    return {
        "id": h.pk,
        "name": h.name,
        "kind": h.kind,
        "url": h.url,
        "events": h.events,
        "enabled": h.enabled,
        "mention": h.mention,
        "mention_always": h.mention_always,
        "secret": h.secret if with_secret and h.kind == "json" else None,
        "has_secret": h.kind == "json" and bool(h.secret),
        "last_status": h.last_status,
        "last_error": h.last_error,
        "last_delivery_at": h.last_delivery_at.isoformat() if h.last_delivery_at else None,
        "failures": h.failures,
        "created_at": h.created_at.isoformat(),
    }


@router.get("/events")
@require_perm("site.manage_api")
def event_types(request):
    return [{"name": e.name, "label": e.label, "description": e.description, "plugin": e.plugin, "private": e.private, "alert": e.alert}
            for e in bus.EVENT_TYPES.values()]


@router.get("/webhooks")
@require_perm("site.manage_api")
def list_webhooks(request):
    return [hook_out(h) for h in Webhook.objects.all()]


@router.post("/webhooks")
@require_perm("site.manage_api")
def create_webhook(request, payload: WebhookIn):
    hook = Webhook.objects.create(**payload.dict())
    record("webhook.created", f"created webhook {hook.name}", request=request, target=hook,
           details={"kind": hook.kind, "events": hook.events})
    return hook_out(hook, with_secret=True)


@router.put("/webhooks/{hook_id}")
@require_perm("site.manage_api")
def update_webhook(request, hook_id: int, payload: WebhookIn):
    hook = get_object_or_404(Webhook, pk=hook_id)
    for k, v in payload.dict().items():
        setattr(hook, k, v)
    hook.save()
    record("webhook.updated", f"changed webhook {hook.name}", request=request, target=hook,
           details={"kind": hook.kind, "events": hook.events, "enabled": hook.enabled})
    return hook_out(hook)


@router.delete("/webhooks/{hook_id}")
@require_perm("site.manage_api")
def delete_webhook(request, hook_id: int):
    hook = get_object_or_404(Webhook, pk=hook_id)
    record("webhook.deleted", f"deleted webhook {hook.name}", request=request, target=hook)
    hook.delete()
    return {"ok": True}


@router.post("/webhooks/{hook_id}/rotate-secret")
@require_perm("site.manage_api")
def rotate_secret(request, hook_id: int):
    """A new signing secret, shown in this answer only; the old one stops working at once."""
    hook = get_object_or_404(Webhook, pk=hook_id)
    hook.secret = new_secret()
    hook.save(update_fields=["secret"])
    record("webhook.secret_rotated", f"rotated the secret of webhook {hook.name}", request=request, target=hook)
    return hook_out(hook, with_secret=True)


@router.post("/webhooks/{hook_id}/test")
@require_perm("site.manage_api")
def test_webhook(request, hook_id: int):
    from .webhooks import deliver

    hook = get_object_or_404(Webhook, pk=hook_id)
    if not hook.enabled:
        raise HttpError(400, "Switch the webhook on first")
    event = bus.Event("webhook.test", {"title": "Webhook test", "summary": f"{request.user.display_name} sent a test from EvE Conduit.", "level": "success"})
    result = deliver.apply(args=[hook.pk, event.as_dict(), False], throw=False).result
    hook.refresh_from_db()
    return {"result": result if isinstance(result, str) else "failed", "webhook": hook_out(hook)}


@router.get("/webhooks/{hook_id}/deliveries")
@require_perm("site.manage_api")
def deliveries(request, hook_id: int, limit: int = 50, offset: int = 0):
    get_object_or_404(Webhook, pk=hook_id)
    return page(
        WebhookDelivery.objects.filter(webhook_id=hook_id),
        lambda d: {"id": d.pk, "at": d.at.isoformat(), "event": d.event, "status": d.status, "ok": d.ok,
                   "error": d.error, "duration_ms": d.duration_ms, "attempt": d.attempt},
        limit, offset,
    )


# --- Discord pings for plugin alerts (shown on each plugin's settings page) ---------------------------------------

pings_router = Router(tags=["pings"])


class PingIn(Schema):
    ping: bool = False
    roles: list[str] = []


def _ping_out(et: bus.EventType, setting) -> dict:
    from .pings import discord_hooks

    hooks = discord_hooks(et.name)
    return {"event": et.name, "label": et.label, "description": et.description, "ping": bool(setting and setting.ping),
            "roles": list(setting.roles or []) if setting else [],
            # How many Discord webhooks get it, and whether any pings someone of its own (@here, a role).
            "webhooks": len(hooks), "webhook_mentions": sum(1 for h in hooks if h.mention)}


@pings_router.get("")
def list_pings(request, plugin: str):
    """The plugin's alerts the user may set pings for. ``configured`` is False while there's no Discord webhook
    (Administration → Integrations); the settings page then shows nothing."""
    from .models import EventPing, Webhook
    from .pings import can_manage, discord_roles

    alerts = [et for et in bus.EVENT_TYPES.values() if et.plugin == plugin and can_manage(request.user, et)]
    configured = Webhook.objects.filter(enabled=True, kind=Webhook.Kind.DISCORD).exists()
    if not alerts or not configured:
        return {"configured": configured, "events": [], "discord": {"available": False, "roles": []}}
    settings_ = {p.event: p for p in EventPing.objects.filter(event__in=[et.name for et in alerts])}
    return {"configured": True, "events": [_ping_out(et, settings_.get(et.name)) for et in alerts], "discord": discord_roles()}


@pings_router.put("/{event}")
def set_ping(request, event: str, payload: PingIn):
    from django.utils import timezone

    from .models import EventPing
    from .pings import can_manage, clean_roles

    et = bus.EVENT_TYPES.get(event)
    if et is None or not et.alert:
        raise HttpError(404, "There's no such alert")
    if not can_manage(request.user, et):
        raise HttpError(403, "You do not have permission to do that")
    setting, _ = EventPing.objects.update_or_create(
        event=et.name, defaults={"ping": payload.ping, "roles": clean_roles(payload.roles), "updated_at": timezone.now()})
    record("webhook.ping_changed", f"{'switched on' if setting.ping else 'switched off'} Discord pings for {et.label}",
           request=request, target=setting, details={"event": et.name, "ping": setting.ping, "roles": setting.roles})
    return _ping_out(et, setting)
