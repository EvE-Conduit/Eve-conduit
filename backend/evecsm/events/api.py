"""Administration > Integrations: webhooks."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field, field_validator

from evecsm.audit.services import record
from evecsm.paging import page
from evecsm.permissions import require_perm

from . import bus
from .models import Webhook, WebhookDelivery, new_secret

router = Router(tags=["admin"])


class WebhookIn(Schema):
    name: str = Field(min_length=1, max_length=80)
    kind: str = "json"
    url: str = Field(max_length=500)
    events: list[str] = []
    enabled: bool = True

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
    return {
        "id": h.pk,
        "name": h.name,
        "kind": h.kind,
        "url": h.url,
        "events": h.events,
        "enabled": h.enabled,
        "secret": h.secret if with_secret and h.kind == "json" else None,
        "last_status": h.last_status,
        "last_error": h.last_error,
        "last_delivery_at": h.last_delivery_at.isoformat() if h.last_delivery_at else None,
        "failures": h.failures,
        "created_at": h.created_at.isoformat(),
    }


@router.get("/events")
@require_perm("site.manage_api")
def event_types(request):
    return [{"name": e.name, "label": e.label, "description": e.description, "module": e.module} for e in bus.EVENT_TYPES.values()]


@router.get("/webhooks")
@require_perm("site.manage_api")
def list_webhooks(request):
    return [hook_out(h, with_secret=True) for h in Webhook.objects.all()]


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
    return hook_out(hook, with_secret=True)


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
    event = bus.Event("webhook.test", {"title": "Webhook test", "summary": f"{request.user.display_name} sent a test from EVECSM.", "level": "success"})
    result = deliver.apply(args=[hook.pk, event.as_dict(), False], throw=False).result
    hook.refresh_from_db()
    return {"result": result if isinstance(result, str) else "failed", "webhook": hook_out(hook, with_secret=True)}


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
