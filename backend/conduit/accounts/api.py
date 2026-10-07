"""Endpoints for the signed-in user's own characters and groups."""

import json
from typing import Any
from zoneinfo import available_timezones

from django.contrib.auth.models import Group
from django.db.models import Count, Q
from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.access import groups
from conduit.access.models import GroupProfile, GroupRequest
from conduit.audit.services import record
from conduit.modules.services import required_scopes
from conduit.schemas import CharacterBrief, character_brief

from conduit.events import bus

from .models import Character, UserPreferences
from .services import remove_character, set_main

router = Router(tags=["me"])


class TokenStatus(Schema):
    valid: bool
    scopes: list[str]
    missing_scopes: list[str]


class MyCharacter(CharacterBrief):
    is_main: bool
    token: TokenStatus | None


class MyGroup(Schema):
    id: int
    name: str
    description: str
    color: str
    joinable: bool
    member: bool
    join_mode: str
    leave_mode: str
    auto: bool
    member_count: int
    #: Whether the user meets the state limits and requirements to join.
    eligible: bool
    requirements: list[dict]
    pending_request: dict | None
    leader: bool


def _my_character(char: Character, main_id: int | None, wanted: list[str]) -> dict:
    token = getattr(char, "token", None)
    granted = token.scope_set if token else set()
    return {
        **character_brief(char),
        "is_main": char.pk == main_id,
        "token": {
            "valid": token.valid,
            "scopes": sorted(granted),
            "missing_scopes": [s for s in wanted if s not in granted],
        }
        if token
        else None,
    }


@router.get("/characters", response=list[MyCharacter])
def my_characters(request):
    wanted = required_scopes()
    chars = request.user.characters.select_related("corporation", "alliance", "token")
    main_id = request.user.main_character_id
    return sorted(
        (_my_character(c, main_id, wanted) for c in chars),
        key=lambda c: (not c["is_main"], c["name"].lower()),
    )


@router.post("/characters/{character_id}/main")
def make_main(request, character_id: int):
    try:
        character = set_main(request.user, character_id)
    except Character.DoesNotExist:
        raise HttpError(404, "Character not found") from None
    record("character.main_changed", f"made {character.name} their main character", request=request, target=character)
    bus.emit("character.main_changed", user_id=request.user.pk, user=request.user.display_name, character_id=character.pk,
             character=character.name, summary=f"{request.user.display_name} made {character.name} their main")
    return {"ok": True}


@router.delete("/characters/{character_id}")
def unlink(request, character_id: int):
    character = Character.objects.filter(pk=character_id, user=request.user).first()
    try:
        remove_character(request.user, character_id)
    except Character.DoesNotExist:
        raise HttpError(404, "Character not found") from None
    except ValueError as exc:
        raise HttpError(400, str(exc)) from None
    record("character.removed", f"removed character {character.name}", request=request, target_type="character",
           details={"character_id": character_id, "name": character.name})
    bus.emit("character.removed", user_id=request.user.pk, user=request.user.display_name, character_id=character_id,
             character=character.name, summary=f"{request.user.display_name} removed {character.name}")
    return {"ok": True}


def _visible_groups(user):
    mine = Q(user=user)
    return (
        Group.objects.filter(mine | Q(profile__hidden=False, profile__isnull=False))
        .select_related("profile")
        .annotate(n=Count("user", distinct=True))
        .distinct()
        .order_by("name")
    )


@router.get("/groups", response=list[MyGroup])
def my_groups(request):
    user = request.user
    member_of = set(user.groups.values_list("pk", flat=True))
    pending = {
        r.group_id: r for r in GroupRequest.objects.filter(user=user, status=GroupRequest.Status.PENDING).order_by("created_at")
    }
    # Groups this user leads by name, not just through managing access.
    direct_led = set(GroupProfile.objects.filter(leaders=user).values_list("group_id", flat=True)) | set(
        GroupProfile.objects.filter(leader_groups__user=user).values_list("group_id", flat=True)
    )
    out = []
    for group in _visible_groups(user):
        profile = getattr(group, "profile", None)
        if group.pk not in member_of and profile and not profile.allows(user):
            continue
        checklist = groups.requirement_checklist(user, profile) if profile and group.pk not in member_of else []
        req = pending.get(group.pk)
        out.append(
            {
                "id": group.pk,
                "name": group.name,
                "description": profile.description if profile else "",
                "color": profile.color if profile else "#38bdf8",
                "joinable": bool(profile and profile.joinable),
                "member": group.pk in member_of,
                "join_mode": profile.join_mode if profile else "closed",
                "leave_mode": profile.leave_mode if profile else "closed",
                "auto": bool(profile and profile.auto),
                "member_count": group.n,
                "eligible": all(c["ok"] for c in checklist),
                "requirements": checklist,
                "pending_request": {"id": req.pk, "kind": req.kind, "message": req.message, "created_at": req.created_at.isoformat()}
                if req else None,
                "leader": group.pk in direct_led,
            }
        )
    return out


def _message(request) -> str:
    """The optional ``{"message": "..."}`` body of join/leave calls."""
    try:
        body = json.loads(request.body or b"{}")
    except ValueError:
        return ""
    return str(body.get("message", "") if isinstance(body, dict) else "")[:500].strip()


def _group_or_404(group_id: int) -> Group:
    group = Group.objects.filter(pk=group_id, profile__isnull=False).first()
    if group is None:
        raise HttpError(404, "Group not found")
    return group


@router.post("/groups/{group_id}/join")
def join_group(request, group_id: int):
    """Join an open group, or ask to join one that needs a leader's approval."""
    try:
        result, req = groups.join(request.user, _group_or_404(group_id), _message(request), request=request)
    except groups.GroupError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return {"ok": True, "result": result, "request_id": req.pk if req else None}


@router.post("/groups/{group_id}/leave")
def leave_group(request, group_id: int):
    try:
        result, req = groups.leave(request.user, _group_or_404(group_id), _message(request), request=request)
    except groups.GroupError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return {"ok": True, "result": result, "request_id": req.pk if req else None}


@router.get("/group-requests")
def my_group_requests(request):
    from conduit.access.leader_api import request_out

    qs = GroupRequest.objects.filter(user=request.user).select_related(
        "group__profile", "user__main_character__corporation", "user__main_character__alliance", "user__state", "decided_by__main_character"
    )
    return [request_out(r) for r in qs[:100]]


@router.post("/group-requests/{request_id}/cancel")
def cancel_group_request(request, request_id: int):
    req = GroupRequest.objects.select_related("group").filter(pk=request_id, user=request.user).first()
    if req is None:
        raise HttpError(404, "Request not found")
    try:
        groups.cancel(req, request.user, request=request)
    except groups.GroupError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return {"ok": True}


@router.get("/leadership")
def my_leadership(request):
    """Whether to show "Manage groups": the groups I lead and how many requests wait for me."""
    ids = groups.led_group_ids(request.user)
    return {
        "leads_groups": bool(ids),
        "group_count": len(ids),
        "pending_requests": GroupRequest.objects.filter(group_id__in=ids, status=GroupRequest.Status.PENDING).count(),
    }


@router.get("/compliance")
def my_compliance(request):
    """What, if anything, the current user needs to fix on their characters."""
    from conduit.access.compliance import check_user

    return check_user(request.user)


# --- preferences ----------------------------------------------------------------


class PreferencesIO(Schema):
    theme: str = "dark"
    density: str = "comfortable"
    timezone: str = "UTC"
    clock_24h: bool = True
    reduce_motion: bool = False
    text_scale: int = 0
    high_contrast: bool = False
    muted_categories: list[str] = []
    dashboard: dict = {}


PREF_FIELDS = tuple(PreferencesIO.model_fields)
# Settings are small; refuse anything bigger rather than let one account fill the database.
MAX_SETTINGS_BYTES = 64 * 1024


def _too_big(value) -> bool:
    import json

    return len(json.dumps(value, default=str)) > MAX_SETTINGS_BYTES


def preferences_out(prefs: UserPreferences) -> dict:
    return {f: getattr(prefs, f) for f in PREF_FIELDS}


@router.get("/preferences", response=PreferencesIO)
def get_preferences(request):
    return preferences_out(UserPreferences.for_user(request.user))


@router.put("/preferences", response=PreferencesIO)
def put_preferences(request, payload: PreferencesIO):
    if payload.theme not in UserPreferences.Theme.values:
        raise HttpError(400, "theme must be system, dark or light")
    if payload.density not in UserPreferences.Density.values:
        raise HttpError(400, "density must be comfortable or compact")
    if payload.timezone not in available_timezones():
        raise HttpError(400, "Unknown time zone")
    if not 0 <= payload.text_scale <= 2:
        raise HttpError(400, "text_scale must be 0, 1 or 2")
    if len(payload.muted_categories) > 200 or _too_big(payload.dashboard):
        raise HttpError(400, "Those settings are too large")
    prefs = UserPreferences.for_user(request.user)
    for f in PREF_FIELDS:
        setattr(prefs, f, getattr(payload, f))
    prefs.save()
    return preferences_out(prefs)


@router.get("/preferences/categories")
def notification_categories(request):
    from conduit.notify.services import CATEGORIES

    return [{"key": k, "label": v} for k, v in CATEGORIES.items()]


@router.get("/preferences/modules/{module_id}")
def get_module_preferences(request, module_id: str):
    """A module's own per-user settings (any JSON value; ``null`` until first saved)."""
    return {"value": UserPreferences.for_user(request.user).modules.get(module_id)}


class ModulePrefsIn(Schema):
    value: Any = None


@router.put("/preferences/modules/{module_id}")
def put_module_preferences(request, module_id: str, payload: ModulePrefsIn):
    from conduit.modules import registry

    if module_id not in registry.installed():
        raise HttpError(404, "Module not installed")
    if _too_big(payload.value):
        raise HttpError(400, f"Module settings are limited to {MAX_SETTINGS_BYTES // 1024} KB")
    prefs = UserPreferences.for_user(request.user)
    prefs.modules[module_id] = payload.value
    prefs.save(update_fields=["modules", "updated_at"])
    return {"value": prefs.modules[module_id]}
