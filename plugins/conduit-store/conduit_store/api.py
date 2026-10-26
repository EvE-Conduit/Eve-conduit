"""Mounted at /api/p/store/. Only reachable by members while the plugin is enabled."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .models import Item, Order, PointEntry
from .services import FULFIL_PERM, MANAGE_PERM, StoreError

router = Router(tags=["store"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except StoreError as exc:
        raise HttpError(exc.status, str(exc)) from None


# --- members -------------------------------------------------------------------------------------------------------


@router.get("/balance")
def balance(request):
    """For the dashboard widget."""
    return {"balance": services.balance(request.user), "month": services.month_earned(request.user)}


@router.get("/me")
def store(request):
    """The store page: your balance, what's for sale and the points leaderboard."""
    user = request.user
    can_fulfil = user.has_perm(FULFIL_PERM)
    return {
        "balance": services.balance(user),
        "items": [services.item_out(i, user) for i in Item.objects.filter(active=True)],
        "leaderboard": services.leaderboard(),
        "can_manage": user.has_perm(MANAGE_PERM),
        "can_fulfil": can_fulfil,
        "pending": services.pending_count() if can_fulfil else None,
    }


@router.get("/me/history")
def history(request):
    user = request.user
    return {
        "balance": services.balance(user),
        "entries": [services.entry_out(e) for e in PointEntry.objects.filter(user=user).select_related("created_by__main_character")[:300]],
        "orders": [services.order_out(o) for o in Order.objects.filter(user=user).select_related("item", "handled_by__main_character")[:200]],
    }


class BuyIn(Schema):
    item_id: int
    quantity: int = 1


@router.post("/orders")
def buy(request, payload: BuyIn):
    order = _run(services.buy, request.user, payload.item_id, payload.quantity, request=request)
    return {"order": services.order_out(order), "balance": services.balance(request.user)}


class NoteIn(Schema):
    note: str = ""


@router.post("/orders/{order_id}/cancel")
def cancel(request, order_id: int, payload: NoteIn):
    order = get_object_or_404(Order, pk=order_id)
    if order.user_id != request.user.pk and not request.user.has_perm(FULFIL_PERM):
        raise HttpError(404, "Not found")
    order = _run(services.cancel, order, request.user, payload.note, request=request)
    return services.order_out(order, staff=order.user_id != request.user.pk)


# --- officers --------------------------------------------------------------------------------------------------------


@router.get("/orders")
@require_perm(FULFIL_PERM)
def orders(request, status: str = "pending"):
    qs = Order.objects.select_related("item", "user__main_character", "handled_by__main_character")
    if status in Order.Status.values:
        qs = qs.filter(status=status)
    if status == Order.Status.PENDING:
        qs = qs.order_by("created_at")
    counts = {s: Order.objects.filter(status=s).count() for s in Order.Status.values}
    return {"items": [services.order_out(o, staff=True) for o in qs[:500]], "counts": counts}


@router.post("/orders/{order_id}/fulfil")
@require_perm(FULFIL_PERM)
def fulfil(request, order_id: int, payload: NoteIn):
    order = _run(services.fulfil, get_object_or_404(Order, pk=order_id), request.user, payload.note, request=request)
    return services.order_out(order, staff=True)


@router.get("/manage")
@require_perm(MANAGE_PERM)
def manage(request):
    return {
        "items": services.with_type_names([services.item_out(i) for i in Item.objects.all()]),
        "settings": services.settings_out(),
        "awards": services.recent_awards(),
    }


class ItemIn(Schema):
    name: str
    description: str = ""
    type_id: int | None = None
    price: int
    stock: int | None = None
    per_member_limit: int | None = None
    active: bool = True
    order: int = 0


@router.post("/items")
@require_perm(MANAGE_PERM)
def create_item(request, payload: ItemIn):
    return services.item_out(_run(services.save_item, None, payload.dict(), request.user, request=request))


@router.put("/items/{item_id}")
@require_perm(MANAGE_PERM)
def update_item(request, item_id: int, payload: ItemIn):
    item = get_object_or_404(Item, pk=item_id)
    return services.item_out(_run(services.save_item, item, payload.dict(), request.user, request=request))


@router.delete("/items/{item_id}")
@require_perm(MANAGE_PERM)
def delete_item(request, item_id: int):
    _run(services.delete_item, get_object_or_404(Item, pk=item_id), request.user, request=request)
    return {"ok": True}


class SettingsIn(Schema):
    referral_points: int = 0
    fleet_points: int = 0
    mentor_points: int = 0
    projects_enabled: bool = True


@router.put("/settings")
@require_perm(MANAGE_PERM)
def update_settings(request, payload: SettingsIn):
    _run(services.save_settings, payload.dict(), request.user, request=request)
    return services.settings_out()


@router.get("/types")
@require_perm(MANAGE_PERM)
def types(request, q: str = ""):
    return services.search_types(q)


@router.get("/members")
@require_perm(MANAGE_PERM)
def members(request, q: str = ""):
    return services.search_members(q, request.user)


class AwardIn(Schema):
    user_id: int
    points: int
    reason: str


@router.post("/awards")
@require_perm(MANAGE_PERM)
def award(request, payload: AwardIn):
    _run(services.award_by_hand, request.user, payload.user_id, payload.points, payload.reason, request=request)
    return {"awards": services.recent_awards()}
