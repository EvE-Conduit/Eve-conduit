"""Industry projects: what the corporation wants built, who claimed which part, and deliveries.

Managers (``projects.manage_projects``) put a project on the board with the items it needs. Members claim a share
of an item, build it, mark it delivered, and a manager confirms it. Confirming emits
``projects.contribution_delivered`` with the Corp Store points it earns; the Corp Store plugin, when installed, pays
them. Members' industry jobs for a claimed item are shown next to the claim as a hint, never as proof.
"""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime
from datetime import timezone as dt_timezone
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone

from conduit.audit.services import record
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm

from .models import Contribution, Item, Project

MANAGE_PERM = "projects.manage_projects"
MAX_ITEMS = 200
MAX_QUANTITY = 2_000_000_000
MAX_PASTE_LINES = 500
#: Manufacturing and reactions: the activities that make an item.
MAKING = (1, 9, 11)


class ProjectError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_manage(user) -> bool:
    return user.has_perm(MANAGE_PERM)


def _link(project: Project) -> str:
    return f"/p/projects/{project.pk}"


# --- who sees what --------------------------------------------------------------------------------------------------


def visible_to(user, qs=None):
    """Projects meant for this user; managers see every one."""
    qs = Project.objects.all() if qs is None else qs
    if can_manage(user):
        return qs
    group_ids = list(user.groups.values_list("pk", flat=True))
    audience = Q(states__isnull=True, groups__isnull=True) | Q(groups__in=group_ids)
    if user.state_id:
        audience |= Q(states=user.state_id)
    return qs.filter(audience).distinct()


def project_for(user, project_id: int) -> Project:
    project = visible_to(user).filter(pk=project_id).first()
    if project is None:
        raise ProjectError("No such project", 404)
    return project


def audience_users(project: Project):
    """Members a project is for, to tell them about it."""
    from conduit.access.services import site_members

    users = site_members()
    state_ids = list(project.states.values_list("pk", flat=True))
    group_ids = list(project.groups.values_list("pk", flat=True))
    if state_ids or group_ids:
        users = users.filter(Q(state_id__in=state_ids) | Q(groups__in=group_ids)).distinct()
    return users


# --- projects -------------------------------------------------------------------------------------------------------


def _parse_deadline(value) -> datetime | None:
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            raise ProjectError("The deadline isn't a date") from None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, dt_timezone.utc)
    return dt


def save_project(project: Project | None, data: dict, by, request=None) -> Project:
    from django.contrib.auth.models import Group

    from conduit.access.models import State

    name = str(data.get("name", "")).strip()[:120]
    if not name:
        raise ProjectError("Give the project a name")
    created = project is None
    with transaction.atomic():
        project = project or Project(created_by=by)
        project.name = name
        project.description = str(data.get("description", "")).strip()[:10000]
        project.location = str(data.get("location", "")).strip()[:200]
        project.deadline = _parse_deadline(data.get("deadline"))
        project.save()
        project.states.set(State.objects.filter(pk__in=data.get("states") or []))
        project.groups.set(Group.objects.filter(pk__in=data.get("groups") or []))
    record("projects.saved", f"{'started' if created else 'changed'} industry project {project.name}", request=request,
           actor=by, target_type="plugin", details={"project_id": project.pk})
    if created:
        bus.emit("projects.created", project_id=project.pk, project=project.name, by=by.display_name, link=_link(project),
                 title=f"New project: {project.name}", summary=project.location or project.description[:200], level="info")
        if data.get("notify", True):
            notify([u for u in audience_users(project) if u.pk != by.pk], f"New industry project: {project.name}",
                   "Claim a part of it and build it.", link=_link(project), category="p.projects")
    return project


def _complete(project: Project, by=None, request=None) -> None:
    project.status = Project.Status.DONE
    project.closed_at = timezone.now()
    project.save(update_fields=["status", "closed_at", "updated_at"])
    contributors = set(Contribution.objects.filter(item__project=project, status=Contribution.Status.CONFIRMED)
                       .values_list("user_id", flat=True))
    notify(list(contributors), f"{project.name} is done", "Thanks for building for it.", link=_link(project),
           level="success", category="p.projects")
    bus.emit("projects.completed", project_id=project.pk, project=project.name, contributors=len(contributors),
             link=_link(project), title=f"Project done: {project.name}",
             summary=f"{len(contributors)} contributor{'s' if len(contributors) != 1 else ''}", level="success")
    record("projects.completed", f"closed industry project {project.name} as done", request=request, actor=by,
           target_type="plugin", details={"project_id": project.pk})


def close(project: Project, status: str, by, request=None) -> Project:
    if project.status != Project.Status.OPEN:
        raise ProjectError("This project is already closed")
    if status == Project.Status.DONE:
        _complete(project, by, request)
    elif status == Project.Status.CANCELLED:
        project.status = Project.Status.CANCELLED
        project.closed_at = timezone.now()
        project.save(update_fields=["status", "closed_at", "updated_at"])
        record("projects.cancelled", f"cancelled industry project {project.name}", request=request, actor=by,
               target_type="plugin", details={"project_id": project.pk})
    else:
        raise ProjectError("Close it as done or cancelled")
    return project


def reopen(project: Project, by, request=None) -> Project:
    if project.status == Project.Status.OPEN:
        raise ProjectError("This project is open")
    project.status = Project.Status.OPEN
    project.closed_at = None
    project.save(update_fields=["status", "closed_at", "updated_at"])
    record("projects.reopened", f"reopened industry project {project.name}", request=request, actor=by,
           target_type="plugin", details={"project_id": project.pk})
    return project


def delete_project(project: Project, by, request=None) -> None:
    if Contribution.objects.filter(item__project=project).exists():
        raise ProjectError("Members have claimed parts of this project; close it instead of deleting it")
    record("projects.deleted", f"deleted industry project {project.name}", request=request, actor=by,
           target_type="plugin", details={"project_id": project.pk})
    project.delete()


def _check_complete(project: Project) -> None:
    """Close the project as done once every item has all it needs confirmed."""
    if project.status != Project.Status.OPEN:
        return
    items = list(project.items.all())
    if not items:
        return
    done = _amounts(items)
    if all(done[i.pk]["confirmed"] >= i.quantity for i in items):
        _complete(project)


# --- items ----------------------------------------------------------------------------------------------------------


def _quantity(value, what="quantity", minimum=1) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise ProjectError(f"The {what} must be a whole number") from None
    if n < minimum or n > MAX_QUANTITY:
        raise ProjectError(f"The {what} must be between {minimum:,} and {MAX_QUANTITY:,}")
    return n


def _isk(value) -> Decimal:
    try:
        d = Decimal(str(value or 0))
    except InvalidOperation:
        raise ProjectError("The ISK per unit must be a number") from None
    if d < 0 or d >= Decimal("1e17"):
        raise ProjectError("The ISK per unit is out of range")
    return d.quantize(Decimal("0.01"))


def _require_open(project: Project) -> None:
    if project.status != Project.Status.OPEN:
        raise ProjectError("This project is closed")


def _item_type(type_id: int):
    from conduit.sde.models import ItemType

    t = ItemType.objects.filter(pk=type_id).first()
    if t is None:
        raise ProjectError("Unknown item")
    return t


def add_item(project: Project, type_id: int, quantity, points_per_unit=0, isk_per_unit=0, by=None, request=None) -> Item:
    _require_open(project)
    t = _item_type(type_id)
    quantity = _quantity(quantity)
    points = _quantity(points_per_unit, "points per unit", 0)
    isk = _isk(isk_per_unit)
    existing = project.items.filter(type_id=t.pk).first()
    if existing:
        existing.quantity = min(MAX_QUANTITY, existing.quantity + quantity)
        existing.save(update_fields=["quantity"])
        return existing
    if project.items.count() >= MAX_ITEMS:
        raise ProjectError(f"A project has up to {MAX_ITEMS} items")
    last = project.items.order_by("-order").values_list("order", flat=True).first() or 0
    return Item.objects.create(project=project, type_id=t.pk, name=t.name, quantity=quantity, points_per_unit=points,
                               isk_per_unit=isk, order=last + 1)


def update_item(item: Item, quantity, points_per_unit, isk_per_unit) -> Item:
    quantity = _quantity(quantity)
    taken = _amounts([item])[item.pk]
    if quantity < taken["confirmed"] + taken["claimed"]:
        raise ProjectError(f"{taken['confirmed'] + taken['claimed']:,} of these are claimed or delivered already; "
                           "it can't need fewer than that")
    item.quantity = quantity
    item.points_per_unit = _quantity(points_per_unit, "points per unit", 0)
    item.isk_per_unit = _isk(isk_per_unit)
    item.save(update_fields=["quantity", "points_per_unit", "isk_per_unit"])
    return item


def delete_item(item: Item) -> None:
    if item.contributions.exists():
        raise ProjectError("Members have claimed some of this item; lower what's needed instead")
    item.delete()


# Lines copied from the game, e.g. the materials list of the Industry window ("Tritanium<TAB>1 000 000"), an
# inventory, or typed as "Tritanium x 1000", "1000 x Tritanium", "1000 Tritanium" or "Tritanium 1000".
_SEPARATED = re.compile(r"^\d{1,3}(?:[,.'   ]\d{3})+$")
_QTY = r"(\d{1,3}(?:[,.'   ]\d{3})+|\d+)"
_PATTERNS = (
    (re.compile(rf"^(?P<name>.+?)\s+[xX×]\s*{_QTY}$"), 2),
    (re.compile(rf"^{_QTY}\s*[xX×]\s+(?P<name>.+)$"), 1),
    (re.compile(rf"^{_QTY}\s+(?P<name>\D.*)$"), 1),
    (re.compile(rf"^(?P<name>.*\D)\s+{_QTY}$"), 2),
)


def _number(text: str) -> int | None:
    text = text.strip()
    if _SEPARATED.match(text):
        text = re.sub(r"\D", "", text)
    return int(text) if text.isdigit() else None


def parse_paste(text: str) -> list[tuple[str, int]]:
    out = []
    for raw in (text or "").splitlines()[:MAX_PASTE_LINES]:
        line = raw.strip().rstrip("*").strip()
        if not line:
            continue
        if "\t" in raw:
            cells = [c.strip() for c in raw.split("\t")]
            name = cells[0].rstrip("*").strip()
            # The Industry window puts a header row first ("Item  Required  Available ..."): no number, so skipped.
            qty = next((q for q in (_number(c) for c in cells[1:]) if q is not None), None)
            if name and qty:
                out.append((name, qty))
            continue
        for pattern, group in _PATTERNS:
            m = pattern.match(line)
            if m and (qty := _number(m.group(group))):
                out.append((m.group("name").strip(), qty))
                break
        else:
            out.append((line, 1))
    return out


def add_from_paste(project: Project, text: str, points_per_unit=0, isk_per_unit=0, by=None, request=None) -> dict:
    """Add every line of a pasted list; the same item twice adds up. Returns what was added and the lines not known."""
    from conduit.sde.models import ItemType

    _require_open(project)
    lines = parse_paste(text)
    if not lines:
        raise ProjectError("Paste a list of items first")
    names = {n.lower() for n, _ in lines}
    types = {t.lname: t for t in ItemType.objects.annotate(lname=Lower("name")).filter(lname__in=names, published=True)}
    wanted: dict[int, int] = defaultdict(int)
    unknown = []
    for name, qty in lines:
        t = types.get(name.lower())
        if t is None:
            unknown.append(name)
        else:
            wanted[t.pk] += qty
    added = []
    with transaction.atomic():
        for type_id, qty in wanted.items():
            added.append(add_item(project, type_id, min(qty, MAX_QUANTITY), points_per_unit, isk_per_unit))
    if added:
        record("projects.items_added", f"added {len(added)} items to industry project {project.name}", request=request,
               actor=by, target_type="plugin", details={"project_id": project.pk, "items": len(added)})
    return {"added": len(added), "unknown": unknown[:50]}


def search_types(q: str, limit: int = 20) -> list[dict]:
    """Published items whose name contains ``q``, names starting with it first."""
    from conduit.sde.models import ItemType, type_icon_url

    q = " ".join((q or "").split())
    if len(q) < 2:
        return []
    starts = list(ItemType.objects.filter(published=True, name__istartswith=q).order_by("name")[:limit])
    rest = list(ItemType.objects.filter(published=True, name__icontains=q).exclude(pk__in=[t.pk for t in starts])
                .order_by("name")[: max(0, limit - len(starts))])
    return [{"id": t.pk, "name": t.name, "icon": type_icon_url(t.pk, 32)} for t in [*starts, *rest]]


# --- claims and deliveries ------------------------------------------------------------------------------------------


def _amounts(items) -> dict[int, dict[str, int]]:
    """Per item: units confirmed, units claimed or delivered but not confirmed yet."""
    out = {i.pk: {"confirmed": 0, "claimed": 0, "delivered": 0} for i in items}
    for item_id, status, qty in Contribution.objects.filter(item__in=list(out)).values_list("item_id", "status", "quantity"):
        if status == Contribution.Status.CONFIRMED:
            out[item_id]["confirmed"] += qty
        else:
            out[item_id]["claimed"] += qty
            if status == Contribution.Status.DELIVERED:
                out[item_id]["delivered"] += qty
    return out


@transaction.atomic
def claim(item: Item, user, quantity) -> Contribution:
    """Claim ``quantity`` of an item, or change one's open claim to that much."""
    item = Item.objects.select_for_update().select_related("project").get(pk=item.pk)
    _require_open(item.project)
    quantity = _quantity(quantity)
    mine = item.contributions.filter(user=user, status__in=Contribution.OPEN).first()
    if mine and mine.status == Contribution.Status.DELIVERED:
        raise ProjectError("You've marked this delivered; wait for a manager, or ask them to send it back")
    taken = _amounts([item])[item.pk]
    free = item.quantity - taken["confirmed"] - taken["claimed"] + (mine.quantity if mine else 0)
    if quantity > free:
        raise ProjectError(f"Only {max(free, 0):,} left to claim" if free > 0 else "Everything is claimed already")
    if mine:
        mine.quantity = quantity
        mine.review_note = ""
        mine.save(update_fields=["quantity", "review_note"])
        return mine
    return Contribution.objects.create(item=item, user=user, quantity=quantity)


def _own_open(c: Contribution, user) -> None:
    if c.user_id != user.pk:
        raise ProjectError("Not your claim", 403)
    if c.status == Contribution.Status.CONFIRMED:
        raise ProjectError("This delivery is confirmed already")


def release(c: Contribution, user) -> None:
    _own_open(c, user)
    if c.status != Contribution.Status.CLAIMED:
        raise ProjectError("You've marked this delivered; ask a manager to send it back first")
    c.delete()


def deliver(c: Contribution, user, note: str = "") -> Contribution:
    _own_open(c, user)
    _require_open(c.item.project)
    if c.status == Contribution.Status.DELIVERED:
        raise ProjectError("You've marked this delivered already")
    c.status = Contribution.Status.DELIVERED
    c.note = (note or "").strip()[:500]
    c.review_note = ""
    c.delivered_at = timezone.now()
    c.save(update_fields=["status", "note", "review_note", "delivered_at"])
    project = c.item.project
    managers = [u for u in users_with_perm(MANAGE_PERM) if u.pk != user.pk]
    notify(managers, f"{user.display_name} delivered {c.quantity:,} × {c.item.name}", f"{project.name}. Confirm it when it's there.",
           link="/p/projects/queue", category="p.projects")
    return c


@transaction.atomic
def confirm(c: Contribution, by, request=None) -> Contribution:
    c = Contribution.objects.select_for_update().select_related("item__project", "user").get(pk=c.pk)
    if c.status == Contribution.Status.CONFIRMED:
        raise ProjectError("This delivery is confirmed already")
    if c.user_id == by.pk:
        # Confirming pays Corp Store points; nobody pays themselves.
        raise ProjectError("Another manager has to confirm your own delivery", 403)
    project = c.item.project
    c.status = Contribution.Status.CONFIRMED
    c.confirmed_at = timezone.now()
    c.delivered_at = c.delivered_at or c.confirmed_at
    c.reviewed_by = by
    c.review_note = ""
    c.save(update_fields=["status", "confirmed_at", "delivered_at", "reviewed_by", "review_note"])
    points = c.quantity * c.item.points_per_unit
    what = f"{c.quantity:,} × {c.item.name}"
    notify(c.user_id, f"Delivery confirmed: {what}", f"{project.name}" + (f" · {points:,} points" if points else ""),
           link=_link(project), level="success", category="p.projects")
    bus.emit("projects.contribution_delivered", user_id=c.user_id, user=c.user.display_name, project_id=project.pk,
             project=project.name, contribution_id=c.pk, item=c.item.name, type_id=c.item.type_id, quantity=c.quantity,
             points=points, link=_link(project), title=f"{c.user.display_name} delivered {what}",
             summary=f"{project.name}" + (f" · {points:,} points" if points else ""), level="success")
    record("projects.confirmed", f"confirmed {c.user.display_name}'s delivery of {what}", request=request, actor=by,
           target=c.user, details={"project_id": project.pk, "contribution_id": c.pk, "points": points})
    _check_complete(project)
    return c


def reject(c: Contribution, by, note: str = "", request=None) -> Contribution:
    """Send a delivery back: it's a claim again, with the manager's reason."""
    if c.status != Contribution.Status.DELIVERED:
        raise ProjectError("Only a delivery waiting for a manager can be sent back")
    c.status = Contribution.Status.CLAIMED
    c.review_note = (note or "").strip()[:500] or "Not found where you said"
    c.reviewed_by = by
    c.delivered_at = None
    c.save(update_fields=["status", "review_note", "reviewed_by", "delivered_at"])
    notify(c.user_id, f"Delivery sent back: {c.quantity:,} × {c.item.name}", c.review_note, link=_link(c.item.project),
           level="warning", category="p.projects")
    record("projects.rejected", f"sent back {c.user.display_name}'s delivery of {c.item.name}", request=request, actor=by,
           target=c.user, details={"contribution_id": c.pk, "note": c.review_note})
    return c


# --- industry jobs, as a hint ---------------------------------------------------------------------------------------


def job_hints(contributions) -> dict[int, dict]:
    """For each open claim: the claimant's jobs making that item, started after the claim (their own and corporation
    jobs they installed). Read-only; it never confirms anything."""
    from conduit.accounts.models import Character
    from conduit.corp.models import CorpIndustryJob
    from conduit.sheet.industry.models import IndustryJob

    open_claims = [c for c in contributions if c.is_open]
    if not open_claims:
        return {}
    user_ids = {c.user_id for c in open_claims}
    type_ids = {c.item.type_id for c in open_claims}
    since = min(c.created_at for c in open_claims)
    chars = dict(Character.objects.filter(user_id__in=user_ids).values_list("pk", "user_id"))
    jobs: dict[tuple[int, int], dict[int, dict]] = defaultdict(dict)  # (user, type) -> job_id -> job
    for row in IndustryJob.objects.filter(character_id__in=chars, product_type_id__in=type_ids, activity_id__in=MAKING,
                                          start_date__gte=since).values("job_id", "character_id", "product_type_id", "runs",
                                                                       "status", "start_date", "end_date"):
        jobs[(chars[row["character_id"]], row["product_type_id"])][row["job_id"]] = row
    for row in CorpIndustryJob.objects.filter(installer_id__in=chars, product_type_id__in=type_ids, activity_id__in=MAKING,
                                              start_date__gte=since).values("job_id", "installer_id", "product_type_id", "runs",
                                                                           "status", "start_date", "end_date"):
        jobs[(chars[row["installer_id"]], row["product_type_id"])].setdefault(row["job_id"], row)
    out = {}
    now = timezone.now()
    for c in open_claims:
        rows = [j for j in jobs.get((c.user_id, c.item.type_id), {}).values() if j["start_date"] >= c.created_at]
        if not rows:
            continue
        running = [j for j in rows if j["status"] in ("active", "paused") and j["end_date"] > now]
        ready = [j for j in rows if j["status"] == "ready" or (j["status"] == "active" and j["end_date"] <= now)]
        delivered = [j for j in rows if j["status"] == "delivered"]
        out[c.pk] = {
            "jobs": len(rows),
            "runs_in_production": sum(j["runs"] for j in running),
            "runs_ready": sum(j["runs"] for j in ready),
            "runs_delivered": sum(j["runs"] for j in delivered),
            "ends_at": max(j["end_date"] for j in running).isoformat() if running else None,
        }
    return out


# --- what pages show ------------------------------------------------------------------------------------------------


def _person(u) -> dict:
    from conduit.eve.models import portrait_url

    return {"id": u.pk, "name": u.display_name,
            "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None}


def _progress(items, amounts) -> dict:
    """Each item counts the same, whatever its quantity: 1 Titan and 1,000,000 Tritanium are both one line."""
    if not items:
        return {"done": 0.0, "claimed": 0.0, "items": 0, "items_done": 0}
    done = [min(1.0, amounts[i.pk]["confirmed"] / i.quantity) for i in items]
    claimed = [min(1.0, (amounts[i.pk]["confirmed"] + amounts[i.pk]["claimed"]) / i.quantity) for i in items]
    return {"done": sum(done) / len(items), "claimed": sum(claimed) / len(items), "items": len(items),
            "items_done": sum(1 for d in done if d >= 1)}


def _project_base(p: Project, items, amounts) -> dict:
    return {
        "id": p.pk,
        "name": p.name,
        "description": p.description,
        "location": p.location,
        "deadline": p.deadline.isoformat() if p.deadline else None,
        "status": p.status,
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in p.states.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in p.groups.all()],
        "created_by": p.created_by.display_name if p.created_by else None,
        "created_at": p.created_at.isoformat(),
        "closed_at": p.closed_at.isoformat() if p.closed_at else None,
        "progress": _progress(items, amounts),
    }


def projects_out(user, show: str = "open") -> dict:
    qs = visible_to(user).select_related("created_by__main_character").prefetch_related("states", "groups", "items")
    qs = qs.filter(status=Project.Status.OPEN) if show == "open" else qs.exclude(status=Project.Status.OPEN)
    projects = list(qs.order_by("deadline", "-created_at") if show == "open" else qs.order_by("-closed_at")[:100])
    items = [i for p in projects for i in p.items.all()]
    amounts = _amounts(items)
    mine = set(Contribution.objects.filter(user=user, item__project__in=projects, status__in=Contribution.OPEN)
               .values_list("item__project_id", flat=True))
    out = []
    for p in projects:
        row = _project_base(p, list(p.items.all()), amounts)
        row["my_open_claims"] = p.pk in mine
        out.append(row)
    return {"projects": out, "can_manage": can_manage(user)}


def contribution_out(c: Contribution, hints: dict) -> dict:
    return {
        "id": c.pk,
        "item_id": c.item_id,
        "user": _person(c.user),
        "quantity": c.quantity,
        "status": c.status,
        "note": c.note,
        "review_note": c.review_note,
        "created_at": c.created_at.isoformat(),
        "delivered_at": c.delivered_at.isoformat() if c.delivered_at else None,
        "confirmed_at": c.confirmed_at.isoformat() if c.confirmed_at else None,
        "industry": hints.get(c.pk),
    }


def project_out(p: Project, user) -> dict:
    from conduit.plugins.services import is_enabled
    from conduit.sde.models import type_icon_url

    items = list(p.items.all())
    amounts = _amounts(items)
    contributions = list(Contribution.objects.filter(item__project=p).select_related("item", "user__main_character"))
    manager = can_manage(user)
    # Everyone sees who's building what; the hint from someone's industry jobs is for them and the managers.
    hints = job_hints([c for c in contributions if manager or c.user_id == user.pk])
    by_item = defaultdict(list)
    for c in contributions:
        by_item[c.item_id].append(contribution_out(c, hints))
    out = _project_base(p, items, amounts)
    out["items"] = [
        {
            "id": i.pk,
            "type_id": i.type_id,
            "name": i.name,
            "icon": type_icon_url(i.type_id, 32),
            "quantity": i.quantity,
            "points_per_unit": i.points_per_unit,
            "isk_per_unit": float(i.isk_per_unit),
            "confirmed": amounts[i.pk]["confirmed"],
            "claimed": amounts[i.pk]["claimed"],
            "delivered": amounts[i.pk]["delivered"],
            "free": max(0, i.quantity - amounts[i.pk]["confirmed"] - amounts[i.pk]["claimed"]),
            "contributions": by_item[i.pk],
        }
        for i in items
    ]
    totals: dict[int, dict] = {}
    for c in contributions:
        t = totals.setdefault(c.user_id, {"user": _person(c.user), "confirmed_units": 0, "open_units": 0, "points": 0})
        if c.status == Contribution.Status.CONFIRMED:
            t["confirmed_units"] += c.quantity
            t["points"] += c.quantity * c.item.points_per_unit
        else:
            t["open_units"] += c.quantity
    out["contributors"] = sorted(totals.values(), key=lambda t: (-t["points"], -t["confirmed_units"], t["user"]["name"]))
    out["can_manage"] = manager
    out["store_enabled"] = is_enabled("store")
    return out


def my_contributions(user) -> dict:
    rows = list(Contribution.objects.filter(user=user).select_related("item__project", "user__main_character")
                .order_by("-created_at")[:500])
    hints = job_hints(rows)
    out = []
    for c in rows:
        row = contribution_out(c, hints)
        row["item"] = c.item.name
        row["type_id"] = c.item.type_id
        row["project"] = {"id": c.item.project_id, "name": c.item.project.name, "status": c.item.project.status}
        row["points"] = c.quantity * c.item.points_per_unit
        out.append(row)
    confirmed = [r for r in out if r["status"] == Contribution.Status.CONFIRMED]
    return {
        "contributions": out,
        "totals": {
            "open": sum(1 for r in out if r["status"] != Contribution.Status.CONFIRMED),
            "confirmed": len(confirmed),
            "points": sum(r["points"] for r in confirmed),
            "projects": len({r["project"]["id"] for r in confirmed}),
        },
    }


def queue(status: str = "delivered") -> list[dict]:
    """Deliveries waiting for a manager (or every open claim, with ``status="claimed"``)."""
    wanted = [Contribution.Status.DELIVERED] if status == "delivered" else list(Contribution.OPEN)
    rows = list(Contribution.objects.filter(status__in=wanted, item__project__status=Project.Status.OPEN)
                .select_related("item__project", "user__main_character").order_by("delivered_at", "created_at")[:500])
    hints = job_hints(rows)
    out = []
    for c in rows:
        row = contribution_out(c, hints)
        row["item"] = c.item.name
        row["type_id"] = c.item.type_id
        row["project"] = {"id": c.item.project_id, "name": c.item.project.name, "location": c.item.project.location}
        row["points"] = c.quantity * c.item.points_per_unit
        out.append(row)
    return out
