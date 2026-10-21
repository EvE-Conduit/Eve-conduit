"""Mounted at /api/p/ops/. Only reachable while the plugin is enabled."""

from datetime import date, datetime

from django.contrib.auth.models import Group
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.access.models import State
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import Op, OpsSettings

router = Router(tags=["ops"], auth=django_auth)


@router.get("")
def board(request):
    """Upcoming ops and recent ones the user may see, their characters for answering, and what they may do."""
    return services.board(request.user)


@router.get("/month")
def month(request, month: str):
    """Ops starting in ``month`` (``YYYY-MM``, by EVE time), for the calendar."""
    try:
        first = date.fromisoformat(f"{month}-01")
    except ValueError:
        raise HttpError(400, "Give the month as YYYY-MM") from None
    return services.month(request.user, first)


def _scheduler(request):
    if not services.can_schedule(request.user):
        raise HttpError(403, "You can't schedule ops")


@router.get("/options")
def options(request):
    """What the editor offers: states and groups for the audience, and doctrines (with the Doctrines plugin)."""
    _scheduler(request)
    return {
        "states": [{"id": s.pk, "name": s.name, "color": s.color} for s in State.objects.all()],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "doctrines": services.doctrine_choices(),
        "default_ping_roles": list(OpsSettings.load().default_ping_roles or []),
    }


@router.get("/fcs")
def fcs(request, q: str = ""):
    """Members matching ``q``, for picking the FC."""
    _scheduler(request)
    return services.fc_search(q)


@router.get("/discord-roles")
def discord_roles(request):
    """The Discord server's roles an op can ping (needs the Discord plugin, linked to a server)."""
    _scheduler(request)
    return services.discord_roles()


# --- settings (ops.manage_ops) ------------------------------------------------------------------------------------


def settings_out(s: OpsSettings) -> dict:
    return {"reminder_minutes": list(s.reminder_minutes), "keep_days": s.keep_days, "default_ping_roles": list(s.default_ping_roles or [])}


class SettingsIn(Schema):
    reminder_minutes: list[int] = [60, 15]
    keep_days: int = 14
    default_ping_roles: list[str] = []


@router.get("/settings")
@require_perm("ops.manage_ops")
def get_settings(request):
    return settings_out(OpsSettings.load())


@router.put("/settings")
@require_perm("ops.manage_ops")
def put_settings(request, payload: SettingsIn):
    marks = sorted({m for m in payload.reminder_minutes if 1 <= m <= 7 * 24 * 60}, reverse=True)
    if len(marks) > 6:
        raise HttpError(400, "Up to six reminders")
    if not 1 <= payload.keep_days <= 90:
        raise HttpError(400, "Keep past ops for 1 to 90 days")
    s = OpsSettings.load()
    s.reminder_minutes, s.keep_days = marks, payload.keep_days
    s.default_ping_roles = services.clean_roles(payload.default_ping_roles)
    s.save()
    record("ops.settings", "changed the ops calendar settings", request=request, target_type="plugin", details={"plugin": "ops"})
    return settings_out(s)


# --- ops ----------------------------------------------------------------------------------------------------------


def _get(request, pk: int) -> Op:
    op = services.visible_to(request.user, Op.objects.filter(pk=pk)).first()
    if op is None:
        raise HttpError(404, "No such op")
    return op


def _editable(request, pk: int) -> Op:
    op = _get(request, pk)
    if not services.can_edit(request.user, op):
        raise HttpError(403, "You can't change this op")
    return op


def _one(request, pk: int) -> dict:
    return services.out(services._rows(Op.objects.filter(pk=pk)).get(), request.user)


class OpIn(Schema):
    title: str
    kind: str = "roam"
    starts_at: datetime
    duration_minutes: int = 120
    #: The FC's user id, when they're on the site; otherwise ``fc_name``.
    fc: int | None = None
    fc_name: str = ""
    formup: str = ""
    comms: str = ""
    #: A doctrine from the Doctrines plugin; otherwise ``doctrine_name`` as typed.
    doctrine_id: int | None = None
    doctrine_name: str = ""
    description: str = ""
    states: list[int] = []
    groups: list[int] = []
    important: bool = False
    #: Tell the audience under the bell when it's posted (webhooks always hear about it).
    notify: bool = True
    #: Discord webhooks ping (their mention and these roles) when it's posted, moved and reminded.
    ping: bool = False
    ping_roles: list[str] = []


def _save(request, op, payload: OpIn):
    try:
        return services.save(op, request.user, **payload.model_dump())
    except services.OpError as exc:
        raise HttpError(exc.status, str(exc)) from None


@router.post("")
def create(request, payload: OpIn):
    _scheduler(request)
    op = _save(request, None, payload)
    record("ops.create", f"scheduled the op \"{op.title}\" for {op.starts_at:%Y-%m-%d %H:%M} ET", request=request, target=op)
    return _one(request, op.pk)


@router.put("/{op_id}")
def update(request, op_id: int, payload: OpIn):
    op = _save(request, _editable(request, op_id), payload)
    record("ops.update", f"changed the op \"{op.title}\"", request=request, target=op)
    return _one(request, op.pk)


@router.post("/{op_id}/cancel")
def cancel(request, op_id: int):
    op = _editable(request, op_id)
    services.cancel(op, request.user)
    record("ops.cancel", f"cancelled the op \"{op.title}\"", request=request, target=op)
    return _one(request, op.pk)


@router.delete("/{op_id}")
def delete(request, op_id: int):
    op = _editable(request, op_id)
    record("ops.delete", f"deleted the op \"{op.title}\"", request=request, target=op)
    services.delete(op)
    return {"ok": True}


class RsvpIn(Schema):
    #: ``going``, ``maybe`` or ``declined``; empty takes the answer back.
    answer: str | None = None
    character_id: int | None = None
    note: str = ""


@router.post("/{op_id}/rsvp")
def rsvp(request, op_id: int, payload: RsvpIn):
    op = _get(request, op_id)
    try:
        services.set_rsvp(op, request.user, payload.answer, payload.character_id, payload.note)
    except services.OpError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return _one(request, op.pk)
