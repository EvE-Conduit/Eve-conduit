"""Mounted at /api/p/timers/. Only reachable while the plugin is enabled."""

from datetime import datetime

from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record
from conduit.permissions import require_perm
from conduit.sde.models import SolarSystem

from . import services
from .models import Timer, TimerSettings

router = Router(tags=["timers"], auth=django_auth)


@router.get("")
def board(request):
    """Upcoming timers (and the hour after each), recent past ones, and what the user may do."""
    return services.board(request.user)


@router.get("/systems")
def systems(request, q: str = ""):
    """Solar systems whose name starts with (or contains) ``q``, for the editor."""
    q = q.strip()
    if len(q) < 2:
        return []
    qs = SolarSystem.objects.filter(name__icontains=q).select_related("region")
    rows = sorted(qs[:40], key=lambda s: (not s.name.lower().startswith(q.lower()), s.name.lower()))[:10]
    return [{"id": s.pk, "name": s.name, "region": services.region_name(s), "security": round(s.display_security, 1)} for s in rows]


@router.get("/types")
def structure_types(request):
    return [{"name": name, "type_id": type_id} for name, type_id in services.STRUCTURE_TYPES.items()]


@router.get("/structures")
@require_perm("timers.manage_timers")
def structures(request, q: str = ""):
    """Structures the site knows by name, matching ``q`` by name, system or type, to fill in the editor. Yours first."""
    return services.structure_search(request.user, q)


# --- settings (timers.manage_timers) ------------------------------------------------------------------------------


def settings_out(s: TimerSettings) -> dict:
    return {
        "reminder_minutes": list(s.reminder_minutes),
        "import_structures": s.import_structures,
        "import_notifications": s.import_notifications,
        "keep_days": s.keep_days,
        "notifications_seen_until": s.notifications_seen_until.isoformat() if s.notifications_seen_until else None,
        "default_ping_roles": list(s.default_ping_roles or []),
    }


class SettingsIn(Schema):
    reminder_minutes: list[int] = [60, 15]
    import_structures: bool = True
    import_notifications: bool = True
    keep_days: int = 14
    default_ping_roles: list[str] = []


@router.get("/settings")
@require_perm("timers.manage_timers")
def get_settings(request):
    return settings_out(TimerSettings.load())


@router.put("/settings")
@require_perm("timers.manage_timers")
def put_settings(request, payload: SettingsIn):
    marks = sorted({m for m in payload.reminder_minutes if 1 <= m <= 7 * 24 * 60}, reverse=True)
    if len(marks) > 6:
        raise HttpError(400, "Up to six reminders")
    if not 1 <= payload.keep_days <= 90:
        raise HttpError(400, "Keep past timers for 1 to 90 days")
    s = TimerSettings.load()
    s.reminder_minutes, s.import_structures, s.import_notifications, s.keep_days = marks, payload.import_structures, payload.import_notifications, payload.keep_days
    s.default_ping_roles = services.clean_roles(payload.default_ping_roles)
    s.save()
    record("timers.settings", "changed the timer settings", request=request, target_type="plugin", details={"plugin": "timers"})
    return settings_out(s)


@router.get("/discord-roles")
@require_perm("timers.manage_timers")
def discord_roles(request):
    """The Discord server's roles a timer can ping (needs the Discord plugin, linked to a server)."""
    return services.discord_roles()


@router.post("/import")
@require_perm("timers.manage_timers")
def import_now(request):
    """Look at the corporation structures and notifications right away instead of waiting for the next run."""
    return services.import_all()


def _get(pk: int) -> Timer:
    t = Timer.objects.select_related("system").filter(pk=pk).first()
    if t is None:
        raise HttpError(404, "No such timer")
    return t


def _one(request, pk: int) -> dict:
    t = Timer.objects.select_related("system__region", "created_by__main_character").prefetch_related("going__main_character").get(pk=pk)
    return services.out(t, request.user)


class TimerIn(Schema):
    name: str
    structure_type: str = ""
    system: int
    kind: str = "armor"
    side: str = "friendly"
    owner: str = ""
    ends_at: datetime
    notes: str = ""
    important: bool = False
    #: Tell members under the bell when it's added (webhooks always hear about it).
    notify: bool = True
    #: The in-game structure id when the timer was picked from our own structures.
    structure_id: int | None = None
    #: Discord webhooks ping (their mention and these roles) when it's added, moved and reminded.
    ping: bool = False
    ping_roles: list[str] = []


def _save(request, t, payload: TimerIn):
    try:
        return services.save(t, request.user, **payload.model_dump())
    except services.TimerError as exc:
        raise HttpError(exc.status, str(exc)) from None


@router.post("")
@require_perm("timers.manage_timers")
def create(request, payload: TimerIn):
    t = _save(request, None, payload)
    record("timers.create", f"added the timer \"{t.name}\" in {t.system.name}", request=request, target=t)
    return _one(request, t.pk)


@router.put("/{timer_id}")
@require_perm("timers.manage_timers")
def update(request, timer_id: int, payload: TimerIn):
    t = _save(request, _get(timer_id), payload)
    record("timers.update", f"changed the timer \"{t.name}\" in {t.system.name}", request=request, target=t)
    return _one(request, t.pk)


@router.delete("/{timer_id}")
@require_perm("timers.manage_timers")
def delete(request, timer_id: int):
    t = _get(timer_id)
    record("timers.delete", f"removed the timer \"{t.name}\" in {t.system.name}", request=request, target=t)
    services.delete(t)
    return {"ok": True}


class GoingIn(Schema):
    going: bool


@router.post("/{timer_id}/going")
def going(request, timer_id: int, payload: GoingIn):
    t = _get(timer_id)
    count = services.set_going(t, request.user, payload.going)
    return {"going": payload.going, "going_count": count}


