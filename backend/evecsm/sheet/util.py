from datetime import datetime

from evecsm.eve.models import MarketPrice
from evecsm.sde.models import ItemType, type_icon_url

BLUEPRINT_CATEGORY = 9


def parse_dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def types_by_id(type_ids) -> dict[int, ItemType]:
    ids = {int(t) for t in type_ids if t}
    return {t.id: t for t in ItemType.objects.filter(pk__in=ids).select_related("group__category")}


def prices_by_type(type_ids) -> dict[int, float]:
    ids = {int(t) for t in type_ids if t}
    return {p.type_id: p.price for p in MarketPrice.objects.filter(type_id__in=ids)}


def type_out(type_id: int, types: dict[int, ItemType], copy: bool = False) -> dict:
    t = types.get(type_id)
    # The image server has no "icon" for blueprints, only "bp" (original) and "bpc" (copy).
    is_blueprint = bool(t and t.group.category_id == BLUEPRINT_CATEGORY)
    icon = type_icon_url(type_id).replace("/icon?", "/bpc?" if copy else "/bp?") if is_blueprint else type_icon_url(type_id)
    return {
        "id": type_id,
        "name": t.name if t else f"Type {type_id}",
        "group": t.group.name if t else "",
        "category": t.group.category.name if t else "",
        "icon": icon,
    }
