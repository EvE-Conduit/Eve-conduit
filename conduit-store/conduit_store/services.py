"""Corp Store: earning points, spending them, and handing orders over.

Points are a ledger (``PointEntry``): a member's balance is the sum of their entries. Earning comes from other
plugins' events (``listeners``) and from managers by hand; buying takes the points at once and refunds them if the
order is cancelled. Officers with ``store.fulfil_orders`` hand the items over in game and mark them done.
"""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.utils import timezone

from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm
from conduit.sde.models import ItemType, type_icon_url

from .models import Item, Order, PointEntry, StoreSettings

MANAGE_PERM = "store.manage_store"
FULFIL_PERM = "store.fulfil_orders"
MAX_POINTS = 1_000_000


class StoreError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _int(value, what: str, *, minimum: int = 0, maximum: int = MAX_POINTS, optional: bool = False) -> int | None:
    if optional and value in (None, ""):
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise StoreError(f"{what} must be a whole number") from None
    if not minimum <= n <= maximum:
        raise StoreError(f"{what} must be between {minimum:,} and {maximum:,}")
    return n


# --- points ----------------------------------------------------------------------------------------------------


def balance(user) -> int:
    return PointEntry.objects.filter(user=user).aggregate(n=Sum("points"))["n"] or 0


def award(user_id: int, points: int, reason: str, source: str, ref: str = "", by=None, *, quiet: bool = False) -> PointEntry | None:
    """Add points (or take them, if negative). With a ``ref``, only once: a second call returns None."""
    if not points or not get_user_model().objects.filter(pk=user_id, is_active=True).exists():
        return None
    if ref and PointEntry.objects.filter(source=source, ref=ref).exists():
        return None
    try:
        with transaction.atomic():
            entry = PointEntry.objects.create(user_id=user_id, points=points, reason=reason[:300], source=source, ref=ref[:80],
                                              created_by=by)
    except IntegrityError:  # the same thing paid at the same moment by another worker
        return None
    if not quiet:
        title = f"You earned {points:,} store points" if points > 0 else f"{-points:,} store points were taken off"
        notify(user_id, title, reason[:300], link="/p/store/me", level="success" if points > 0 else "info", category="p.store")
    return entry


def award_by_hand(by, user_id: int, points, reason: str, request=None) -> PointEntry:
    points = _int(points, "Points", minimum=-MAX_POINTS)
    reason = (reason or "").strip()
    if not points:
        raise StoreError("Give or take at least one point")
    if not reason:
        raise StoreError("Say what the points are for; the member sees it")
    if user_id == by.pk:
        raise StoreError("You can't give yourself points", 403)
    user = get_user_model().objects.filter(pk=user_id, is_active=True).first()
    if user is None:
        raise StoreError("No such member", 404)
    entry = award(user.pk, points, reason, PointEntry.Source.MANUAL, by=by)
    record("store.points_awarded", f"{'gave' if points > 0 else 'took'} {abs(points):,} store points {'to' if points > 0 else 'from'} {user.display_name}",
           request=request, actor=by, target=user, details={"points": points, "reason": reason[:300]})
    return entry


def leaderboard(limit: int = 10) -> dict:
    """Who earned most: positive entries only, so buying things doesn't drop you down, and refunds don't count."""
    earned = PointEntry.objects.filter(points__gt=0).exclude(source=PointEntry.Source.REFUND)
    start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def top(qs):
        rows = list(qs.values("user_id").annotate(n=Sum("points")).order_by("-n", "user_id")[:limit])
        users = get_user_model().objects.select_related("main_character").in_bulk([r["user_id"] for r in rows])
        return [{**member_out(users[r["user_id"]]), "points": r["n"]} for r in rows if r["user_id"] in users]

    return {"month": top(earned.filter(created_at__gte=start)), "all_time": top(earned)}


# --- items -------------------------------------------------------------------------------------------------------


def save_item(item: Item | None, data: dict, by, request=None) -> Item:
    name = str(data.get("name", "")).strip()[:100]
    if not name:
        raise StoreError("Give the item a name")
    type_id = _int(data.get("type_id"), "Item type", minimum=1, maximum=2**31 - 1, optional=True)
    if type_id and not ItemType.objects.filter(pk=type_id).exists():
        raise StoreError("No such EVE item")
    item = item or Item()
    item.name = name
    item.description = str(data.get("description", "")).strip()[:4000]
    item.type_id = type_id
    item.price = _int(data.get("price"), "Price", minimum=1)
    item.stock = _int(data.get("stock"), "Stock", optional=True)
    item.per_member_limit = _int(data.get("per_member_limit"), "Limit per member", minimum=1, optional=True)
    item.active = bool(data.get("active", True))
    item.order = _int(data.get("order") or 0, "Order", minimum=-10_000, maximum=10_000)
    item.save()
    record("store.item_saved", f"saved store item {item.name}", request=request, actor=by, target_type="plugin",
           details={"item_id": item.pk, "price": item.price})
    return item


def delete_item(item: Item, by, request=None) -> None:
    if item.orders.exists():
        raise StoreError("People have ordered this item; hide it instead of deleting it")
    record("store.item_deleted", f"deleted store item {item.name}", request=request, actor=by, target_type="plugin",
           details={"item_id": item.pk})
    item.delete()


def search_types(q: str, limit: int = 20) -> list[dict]:
    q = (q or "").strip()
    if len(q) < 2:
        return []
    qs = ItemType.objects.filter(published=True, name__icontains=q).select_related("group").order_by("name")[:limit]
    return [{"id": t.pk, "name": t.name, "subtitle": t.group.name, "icon": type_icon_url(t.pk, 32)} for t in qs]


def save_settings(data: dict, by, request=None) -> StoreSettings:
    s = StoreSettings.load()
    s.referral_points = _int(data.get("referral_points") or 0, "Points for a referral")
    s.fleet_points = _int(data.get("fleet_points") or 0, "Points for a fleet")
    s.mentor_points = _int(data.get("mentor_points") or 0, "Points for a graduation")
    s.projects_enabled = bool(data.get("projects_enabled", True))
    s.save()
    record("store.settings_saved", "changed how Corp Store points are earned", request=request, actor=by, target_type="plugin",
           details={"referral": s.referral_points, "fleet": s.fleet_points, "mentor": s.mentor_points, "projects": s.projects_enabled})
    return s


# --- orders ------------------------------------------------------------------------------------------------------


def bought(user, item: Item) -> int:
    """How many of the item the member has ordered, cancelled orders aside."""
    return (Order.objects.filter(user=user, item=item).exclude(status=Order.Status.CANCELLED)
            .aggregate(n=Sum("quantity"))["n"] or 0)


@transaction.atomic
def buy(user, item_id: int, quantity, request=None) -> Order:
    quantity = _int(quantity, "Quantity", minimum=1, maximum=1000)
    # Lock the buyer's row so two orders sent at once can't both spend the same points, and the item's for its stock.
    get_user_model().objects.select_for_update().filter(pk=user.pk).first()
    item = Item.objects.select_for_update().filter(pk=item_id, active=True).first()
    if item is None:
        raise StoreError("That item isn't in the store", 404)
    if item.stock is not None and item.stock < quantity:
        raise StoreError(f"Only {item.stock} left" if item.stock else "Sold out")
    if item.per_member_limit is not None and bought(user, item) + quantity > item.per_member_limit:
        left = max(item.per_member_limit - bought(user, item), 0)
        raise StoreError(f"You can have {item.per_member_limit} of these in all; {left} more" if left else
                         f"You already have the most you can order ({item.per_member_limit})")
    cost = item.price * quantity
    have = balance(user)
    if cost > have:
        raise StoreError(f"That costs {cost:,} points and you have {have:,}")
    order = Order.objects.create(user=user, item=item, quantity=quantity, points=cost)
    PointEntry.objects.create(user=user, points=-cost, reason=f"Bought {quantity} × {item.name}", source=PointEntry.Source.ORDER,
                              ref=f"order:{order.pk}")
    if item.stock is not None:
        item.stock -= quantity
        item.save(update_fields=["stock"])
    staff = [u for u in users_with_perm(FULFIL_PERM) if u.pk != user.pk]
    label = f"{quantity} × {item.name}"
    notify(staff, f"Store order from {user.display_name}", label, link="/p/store/orders", category="p.store", data={"order_id": order.pk})
    bus.emit("store.order_placed", user_id=user.pk, user=user.display_name, item=item.name, quantity=quantity, points=cost,
             order_id=order.pk, link="/p/store/orders", summary=f"{user.display_name} bought {label} for {cost:,} points")
    record("store.order_placed", f"bought {label} in the Corp Store", request=request, actor=user, target_type="plugin",
           details={"order_id": order.pk, "points": cost})
    return order


def _locked(order: Order) -> Order:
    order = Order.objects.select_for_update().select_related("item", "user").get(pk=order.pk)
    if order.status != Order.Status.PENDING:
        raise StoreError(f"This order was already {order.get_status_display().lower()}")
    return order


@transaction.atomic
def fulfil(order: Order, by, note: str = "", request=None) -> Order:
    order = _locked(order)
    order.status = Order.Status.FULFILLED
    order.note = (note or "").strip()[:2000]
    order.handled_by = by
    order.handled_at = timezone.now()
    order.save()
    label = f"{order.quantity} × {order.item.name}"
    notify(order.user_id, f"Your store order is ready: {label}", order.note[:300] or f"Handed over by {by.display_name}",
           link="/p/store/me", level="success", category="p.store")
    bus.emit("store.order_fulfilled", user_id=order.user_id, user=order.user.display_name, item=order.item.name,
             quantity=order.quantity, order_id=order.pk, by=by.display_name, link="/p/store/orders", level="success",
             summary=f"{by.display_name} handed {label} to {order.user.display_name}")
    record("store.order_fulfilled", f"handed over {order.user.display_name}'s store order ({label})", request=request, actor=by,
           target=order.user, details={"order_id": order.pk})
    return order


@transaction.atomic
def cancel(order: Order, by, reason: str = "", request=None) -> Order:
    own = order.user_id == by.pk
    if not own and not by.has_perm(FULFIL_PERM):
        raise StoreError("Not your order", 403)
    order = _locked(order)
    reason = (reason or "").strip()[:2000]
    if not own and not reason:
        raise StoreError("Tell the member why it's cancelled")
    order.status = Order.Status.CANCELLED
    order.note = reason
    order.handled_by = by
    order.handled_at = timezone.now()
    order.save()
    label = f"{order.quantity} × {order.item.name}"
    PointEntry.objects.create(user_id=order.user_id, points=order.points, reason=f"Refund: {label}", source=PointEntry.Source.REFUND,
                              ref=f"refund:{order.pk}", created_by=by)
    item = Item.objects.select_for_update().get(pk=order.item_id)
    if item.stock is not None:
        item.stock += order.quantity
        item.save(update_fields=["stock"])
    if not own:
        notify(order.user_id, f"Your store order was cancelled: {label}", f"{reason[:250]} Your {order.points:,} points are back.",
               link="/p/store/me", category="p.store")
    whose = "their" if own else f"{order.user.display_name}'s"
    record("store.order_cancelled", f"cancelled {whose} store order ({label})",
           request=request, actor=by, target=order.user, details={"order_id": order.pk, "refund": order.points})
    return order


# --- members -------------------------------------------------------------------------------------------------------


def search_members(q: str, by) -> list[dict]:
    """Members by main character name, for awarding points. Not yourself."""
    from conduit.access.services import site_members

    q = (q or "").strip()
    if len(q) < 2:
        return []
    qs = (site_members().filter(main_character__name__icontains=q).exclude(pk=by.pk)
          .select_related("main_character").order_by("main_character__name")[:10])
    return [member_out(u) for u in qs]


# --- what pages show -----------------------------------------------------------------------------------------------


def member_out(u) -> dict:
    return {"id": u.pk, "name": u.display_name,
            "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None}


def item_out(item: Item, user=None) -> dict:
    out = {"id": item.pk, "name": item.name, "description": item.description, "type_id": item.type_id,
           "icon": type_icon_url(item.type_id, 64) if item.type_id else None, "price": item.price, "stock": item.stock,
           "per_member_limit": item.per_member_limit, "active": item.active, "order": item.order}
    if user is not None and item.per_member_limit is not None:
        out["bought"] = bought(user, item)
    return out


def with_type_names(items: list[dict]) -> list[dict]:
    """Adds each item's EVE type name (the manage page shows it next to the picture)."""
    names = dict(ItemType.objects.filter(pk__in={i["type_id"] for i in items if i["type_id"]}).values_list("pk", "name"))
    return [{**i, "type_name": names.get(i["type_id"])} for i in items]


def entry_out(e: PointEntry) -> dict:
    return {"id": e.pk, "points": e.points, "reason": e.reason, "source": e.source,
            "by": e.created_by.display_name if e.created_by else None, "created_at": e.created_at.isoformat()}


def order_out(o: Order, *, staff: bool = False) -> dict:
    out = {"id": o.pk, "item": {"id": o.item_id, "name": o.item.name, "icon": type_icon_url(o.item.type_id, 64) if o.item.type_id else None},
           "quantity": o.quantity, "points": o.points, "status": o.status, "note": o.note,
           "handled_by": o.handled_by.display_name if o.handled_by else None, "created_at": o.created_at.isoformat(),
           "handled_at": o.handled_at.isoformat() if o.handled_at else None}
    if staff:
        out["user"] = member_out(o.user)
    return out


def sources_out() -> dict:
    """The plugins points come from, and whether each is installed and switched on."""
    from conduit.plugins import registry
    from conduit.plugins.services import is_enabled

    installed = registry.installed()
    return {pid: {"installed": pid in installed, "enabled": pid in installed and is_enabled(pid)}
            for pid in ("recruit", "fleets", "mentors", "projects")}


def settings_out() -> dict:
    s = StoreSettings.load()
    return {"referral_points": s.referral_points, "fleet_points": s.fleet_points, "mentor_points": s.mentor_points,
            "projects_enabled": s.projects_enabled, "sources": sources_out()}


def recent_awards(limit: int = 50) -> list[dict]:
    qs = PointEntry.objects.filter(source=PointEntry.Source.MANUAL).select_related("user__main_character", "created_by__main_character")[:limit]
    return [{**entry_out(e), "user": member_out(e.user)} for e in qs]


def pending_count() -> int:
    return Order.objects.filter(status=Order.Status.PENDING).count()


def month_earned(user) -> int:
    since = timezone.now() - timedelta(days=30)
    return (PointEntry.objects.filter(user=user, points__gt=0, created_at__gte=since).exclude(source=PointEntry.Source.REFUND)
            .aggregate(n=Sum("points"))["n"] or 0)

