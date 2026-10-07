"""``/api/me/notifications``: the bell in the top bar."""

from django.utils import timezone
from ninja import Router

from evecsm.paging import page

from .models import Notification
from .services import unread_count

router = Router(tags=["me"])


def notification_out(n: Notification) -> dict:
    return {
        "id": n.pk,
        "created_at": n.created_at.isoformat(),
        "level": n.level,
        "category": n.category,
        "title": n.title,
        "body": n.body,
        "link": n.link,
        "read": n.read_at is not None,
    }


@router.get("/notifications")
def list_notifications(request, unread: bool = False, category: str = "", limit: int = 30, offset: int = 0):
    qs = Notification.objects.filter(user=request.user)
    if unread:
        qs = qs.filter(read_at__isnull=True)
    if category:
        qs = qs.filter(category=category)
    result = page(qs, notification_out, limit, offset)
    result["unread"] = unread_count(request.user)
    return result


@router.get("/notifications/unread")
def unread(request):
    return {"unread": unread_count(request.user)}


@router.post("/notifications/{notification_id}/read")
def mark_read(request, notification_id: int):
    Notification.objects.filter(user=request.user, pk=notification_id, read_at__isnull=True).update(read_at=timezone.now())
    return {"unread": unread_count(request.user)}


@router.post("/notifications/{notification_id}/unread")
def mark_unread(request, notification_id: int):
    Notification.objects.filter(user=request.user, pk=notification_id).update(read_at=None)
    return {"unread": unread_count(request.user)}


@router.post("/notifications/read-all")
def mark_all_read(request):
    Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
    return {"unread": 0}


@router.delete("/notifications/{notification_id}")
def delete(request, notification_id: int):
    Notification.objects.filter(user=request.user, pk=notification_id).delete()
    return {"unread": unread_count(request.user)}


@router.delete("/notifications")
def clear_read(request):
    """Delete every notification already read."""
    Notification.objects.filter(user=request.user, read_at__isnull=False).delete()
    return {"unread": unread_count(request.user)}
