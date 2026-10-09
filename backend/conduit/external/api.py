"""The external API at /api/v1/ (API keys only, never browser sessions)."""

import importlib
import json
import logging
from datetime import datetime

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import Resolver404, resolve
from ninja import NinjaAPI, Router, Schema
from ninja.errors import HttpError

from conduit import __version__
from conduit.access.models import State
from conduit.access.services import admin_permissions_in, recompute_all_states
from conduit.accounts.models import Character, User
from conduit.audit.api import audit_out, filter_audit, filter_service, filter_snoop, service_out, snoop_out
from conduit.audit.models import AuditEvent, ServiceLog, SnoopEvent
from conduit.audit.services import record
from conduit.eve.models import EveAlliance, EveCorporation
from conduit.plugins import registry as plugin_registry
from conduit.paging import MAX_LIMIT, page
from conduit.schemas import alliance_out, character_brief, corp_out

from conduit.corp.external import router as corp_external_router

from . import areas
from .auth import ApiKeyAuth, check_scope, require_scope
from .models import ApiRequest

log = logging.getLogger(__name__)

external_api = NinjaAPI(
    title="EvE Conduit external API",
    version=__version__,
    description=(
        "For other services. Authenticate with an API key from Administration > API: "
        "`Authorization: Bearer evk_...`. Each API must be switched on by an admin and each route "
        "needs a scope on the key. Lists take `limit` (max 500) and `offset` and return `{items, count}`."
    ),
    urls_namespace="external",
    auth=ApiKeyAuth(),
)

router = Router()


# --- about the key -----------------------------------------------------------


@router.get("/me", tags=["key"])
def me(request):
    """The calling key: its scopes and which APIs are switched on."""
    key = request.api_key
    return {
        "name": key.name,
        "prefix": key.prefix,
        "scopes": sorted(key.scopes),
        "expires_at": key.expires_at.isoformat() if key.expires_at else None,
        "apis": {k: areas.is_on(k) for k in areas.all_areas()},
    }


# --- directory ----------------------------------------------------------------


def _user_out(u: User) -> dict:
    return {
        "id": u.pk,
        "name": u.display_name,
        "main": character_brief(u.main_character),
        "state": {"id": u.state.pk, "name": u.state.name} if u.state else None,
        "groups": [{"id": g.pk, "name": g.name} for g in u.groups.all()],
        "characters": [{"id": c.id, "name": c.name} for c in u.characters.all()],
        "joined": u.date_joined.isoformat(),
    }


def _users():
    return User.objects.select_related(
        "main_character__corporation", "main_character__alliance", "state"
    ).prefetch_related("groups", "characters").order_by("pk")


def _character_out(c: Character) -> dict:
    return {**character_brief(c), "user_id": c.user_id, "is_main": c.user.main_character_id == c.pk, "added_at": c.added_at.isoformat()}


@router.get("/users", tags=["directory"])
@require_scope("directory:read")
def list_users(request, state: int | None = None, group: int | None = None, corporation: int | None = None,
               alliance: int | None = None, q: str = "", limit: int = 100, offset: int = 0):
    """Everyone with an account. Filters match on the main character for corporation/alliance."""
    qs = _users()
    if state:
        qs = qs.filter(state_id=state)
    if group:
        qs = qs.filter(groups__id=group)
    if corporation:
        qs = qs.filter(main_character__corporation_id=corporation)
    if alliance:
        qs = qs.filter(main_character__alliance_id=alliance)
    if q:
        qs = qs.filter(characters__name__icontains=q).distinct()
    return page(qs, _user_out, limit, offset)


@router.get("/users/{user_id}", tags=["directory"])
@require_scope("directory:read")
def get_user(request, user_id: int):
    return _user_out(get_object_or_404(_users(), pk=user_id))


@router.get("/characters", tags=["directory"])
@require_scope("directory:read")
def list_characters(request, user: int | None = None, corporation: int | None = None, alliance: int | None = None,
                    q: str = "", limit: int = 100, offset: int = 0):
    qs = Character.objects.select_related("corporation", "alliance", "user").order_by("name")
    if user:
        qs = qs.filter(user_id=user)
    if corporation:
        qs = qs.filter(corporation_id=corporation)
    if alliance:
        qs = qs.filter(alliance_id=alliance)
    if q:
        qs = qs.filter(name__icontains=q)
    return page(qs, _character_out, limit, offset)


@router.get("/characters/{character_id}", tags=["directory"])
@require_scope("directory:read")
def get_character(request, character_id: int):
    return _character_out(get_object_or_404(Character.objects.select_related("corporation", "alliance", "user"), pk=character_id))


@router.get("/groups", tags=["directory"])
@require_scope("directory:read")
def list_groups(request):
    out = []
    for g in Group.objects.select_related("profile").annotate(n=Count("user")).order_by("name"):
        profile = getattr(g, "profile", None)
        out.append({
            "id": g.pk,
            "name": g.name,
            "description": profile.description if profile else "",
            "joinable": bool(profile and profile.joinable),
            "join_mode": profile.join_mode if profile else "closed",
            "auto": bool(profile and profile.auto),
            "hidden": bool(profile and profile.hidden),
            "member_count": g.n,
        })
    return out


@router.get("/groups/{group_id}/members", tags=["directory"])
@require_scope("directory:read")
def group_members(request, group_id: int, limit: int = 100, offset: int = 0):
    group = get_object_or_404(Group, pk=group_id)
    return page(_users().filter(groups=group), _user_out, limit, offset)


@router.get("/states", tags=["directory"])
@require_scope("directory:read")
def list_states(request):
    return [
        {
            "id": s.pk,
            "name": s.name,
            "priority": s.priority,
            "description": s.description,
            "public": s.public,
            "user_count": s.n,
            "member_characters": sorted(c.pk for c in s.member_characters.all()),
            "member_corporations": sorted(c.pk for c in s.member_corporations.all()),
            "member_alliances": sorted(a.pk for a in s.member_alliances.all()),
        }
        for s in State.objects.annotate(n=Count("users")).prefetch_related(
            "member_characters", "member_corporations", "member_alliances"
        )
    ]


@router.get("/corporations", tags=["directory"])
@require_scope("directory:read")
def list_corporations(request):
    """Corporations that registered characters belong to."""
    qs = EveCorporation.objects.annotate(n=Count("characters")).filter(n__gt=0).select_related("alliance").order_by("name")
    return [{**corp_out(c), "alliance_id": c.alliance_id, "character_count": c.n} for c in qs]


@router.get("/alliances", tags=["directory"])
@require_scope("directory:read")
def list_alliances(request):
    qs = EveAlliance.objects.annotate(n=Count("characters")).filter(n__gt=0).order_by("name")
    return [{**alliance_out(a), "character_count": a.n} for a in qs]


# --- character sheets ---------------------------------------------------------


def _sheet_keys(request) -> set[str]:
    return {s.split(":", 1)[1] for s in request.api_key.scopes if s.startswith("sheet:")}


@router.get("/characters/{character_id}/sheet", tags=["character sheet"])
def sheet_header(request, character_id: int):
    """Who the character is and how fresh each section is, listing the sections this key may read."""
    allowed = _sheet_keys(request)
    if not allowed:
        raise HttpError(403, "This API key has no sheet:<section> scope")
    check_scope(request, f"sheet:{min(allowed)}")  # also checks the API is switched on
    response = _internal(request, f"/api/characters/{character_id}")
    if response.status_code != 200:
        return response
    data = json.loads(response.content)
    data["sections"] = [s for s in data.get("sections", []) if s["key"] in allowed]
    data.pop("is_mine", None)
    return JsonResponse(data)


@router.get("/characters/{character_id}/sheet/{path:rest}", tags=["character sheet"])
def sheet_section(request, character_id: int, rest: str):
    """Any character sheet endpoint of the web UI, e.g. ``/sheet/skills`` or ``/sheet/wallet/journal``.
    Needs ``sheet:<section>``, where section is the first part of the path."""
    from conduit.sheet import registry

    section = rest.split("/", 1)[0]
    if section not in registry.SECTIONS:
        raise HttpError(404, f"No character sheet section {section!r}")
    check_scope(request, f"sheet:{section}")
    return _internal(request, f"/api/characters/{character_id}/{rest}")


def _internal(request, path: str):
    """Answer with the web UI's own character sheet view. request.user is the key's ApiPrincipal,
    which may view every character; the scope check has already happened."""
    try:
        match = resolve(path)
    except Resolver404:
        raise HttpError(404, "Not found") from None
    if not match.route.startswith("api/characters/") or ".." in path:
        raise HttpError(404, "Not found")  # only ever the character sheet, nothing else in the web UI's API
    return match.func(request, *match.args, **match.kwargs)


# --- group and state membership --------------------------------------------------


@router.put("/groups/{group_id}/members/{user_id}", tags=["groups"])
@require_scope("groups:write")
def add_group_member(request, group_id: int, user_id: int):
    group = get_object_or_404(Group, pk=group_id)
    user = get_object_or_404(User, pk=user_id)
    profile = getattr(group, "profile", None)
    if profile and profile.auto:
        raise HttpError(400, "Membership of a smart group is managed by its rules")
    if admin_permissions_in(group.permissions.all()):
        raise HttpError(403, "This group grants administrator permissions; only an administrator can add members")
    if profile and not profile.allows(user):
        raise HttpError(400, "That user's state is not allowed in this group")
    from conduit.access.groups import add_member

    add_member(user, group, "api", request=request)
    return {"ok": True}


@router.delete("/groups/{group_id}/members/{user_id}", tags=["groups"])
@require_scope("groups:write")
def remove_group_member(request, group_id: int, user_id: int):
    group = get_object_or_404(Group, pk=group_id)
    user = get_object_or_404(User, pk=user_id)
    from conduit.access.groups import remove_member

    remove_member(user, group, "api", request=request)
    return {"ok": True}


class StateMemberIn(Schema):
    type: str  # character | corporation | alliance
    id: int


def _state_relation(state: State, kind: str):
    relations = {"character": state.member_characters, "corporation": state.member_corporations, "alliance": state.member_alliances}
    if kind not in relations:
        raise HttpError(400, "type must be character, corporation or alliance")
    return relations[kind]


def _entity(kind: str, entity_id: int):
    if kind == "character":
        return get_object_or_404(Character, pk=entity_id)
    model = EveCorporation if kind == "corporation" else EveAlliance
    entity = model.objects.filter(pk=entity_id).first()
    if entity is None:
        from conduit.esi.exceptions import EsiBackoff, EsiError
        from conduit.eve.tasks import resolve_entities

        try:
            resolve_entities({entity_id} if kind == "corporation" else set(), {entity_id} if kind == "alliance" else set())
        except (EsiError, EsiBackoff) as exc:
            raise HttpError(502, f"Could not look up that {kind}: {exc}") from None
        entity = model.objects.filter(pk=entity_id).first()
        if entity is None:
            raise HttpError(404, f"No such {kind}")
    return entity


@router.post("/states/{state_id}/members", tags=["states"])
@require_scope("states:write")
def add_state_member(request, state_id: int, payload: StateMemberIn):
    state = get_object_or_404(State, pk=state_id)
    if admin_permissions_in(state.permissions.all()):
        raise HttpError(403, "This state grants administrator permissions; only an administrator can change who is in it")
    entity = _entity(payload.type, payload.id)
    with transaction.atomic():
        _state_relation(state, payload.type).add(entity)
        transaction.on_commit(recompute_all_states)
    record("state.member_added", f"added {payload.type} {entity} to state {state.name}", request=request, target=state,
           details={"type": payload.type, "id": payload.id, "name": str(entity)})
    return {"ok": True}


@router.delete("/states/{state_id}/members/{kind}/{entity_id}", tags=["states"])
@require_scope("states:write")
def remove_state_member(request, state_id: int, kind: str, entity_id: int):
    state = get_object_or_404(State, pk=state_id)
    relation = _state_relation(state, kind)
    entity = relation.filter(pk=entity_id).first()
    if entity is not None:
        with transaction.atomic():
            relation.remove(entity)
            transaction.on_commit(recompute_all_states)
        record("state.member_removed", f"removed {kind} {entity} from state {state.name}", request=request, target=state,
               details={"type": kind, "id": entity_id, "name": str(entity)})
    return {"ok": True}


# --- logs ------------------------------------------------------------------------


def _incremental(qs, out, after_id: int, limit: int) -> dict:
    """Oldest first from after_id, so a poller can resume with next_after_id."""
    rows = list(qs.filter(pk__gt=after_id).order_by("pk")[: max(1, min(limit, MAX_LIMIT))])
    return {"items": [out(r) for r in rows], "next_after_id": rows[-1].pk if rows else after_id}


def request_out(r: ApiRequest) -> dict:
    return {
        "id": r.pk,
        "at": r.at.isoformat(),
        "key": {"id": r.key_id, "name": r.key.name, "prefix": r.key.prefix} if r.key else (
            {"id": None, "name": "(deleted key)", "prefix": r.key_prefix} if r.key_prefix else None),
        "method": r.method,
        "path": r.path,
        "query": r.query,
        "status": r.status,
        "duration_ms": r.duration_ms,
        "ip": r.ip,
        "user_agent": r.user_agent,
        "area": r.area,
    }


@router.get("/logs/audit", tags=["logs"])
@require_scope("logs:audit")
def logs_audit(request, after_id: int = 0, limit: int = 100, action: str = "", since: datetime | None = None):
    """Audit events, oldest first after ``after_id``. Poll again with the returned ``next_after_id``."""
    return _incremental(filter_audit(AuditEvent.objects.all(), action=action, since=since), audit_out, after_id, limit)


@router.get("/logs/snooper", tags=["logs"])
@require_scope("logs:snooper")
def logs_snooper(request, after_id: int = 0, limit: int = 100, since: datetime | None = None):
    """Who looked at other members' character sheets, oldest first after ``after_id``."""
    return _incremental(filter_snoop(SnoopEvent.objects.all(), since=since), snoop_out, after_id, limit)


@router.get("/logs/requests", tags=["logs"])
@require_scope("logs:requests")
def logs_requests(request, after_id: int = 0, limit: int = 100, since: datetime | None = None):
    qs = ApiRequest.objects.select_related("key")
    if since:
        qs = qs.filter(at__gte=since)
    return _incremental(qs, request_out, after_id, limit)


@router.get("/logs/esi", tags=["logs"])
@require_scope("logs:esi")
def logs_esi(request, after_id: int = 0, limit: int = 100, outcome: str = "", since: datetime | None = None):
    from conduit.esi.api import call_out, filter_calls
    from conduit.esi.models import EsiCall

    qs = filter_calls(EsiCall.objects.all(), outcome=outcome)
    if since:
        qs = qs.filter(at__gte=since)
    return _incremental(qs, call_out, after_id, limit)


@router.get("/logs/service", tags=["logs"])
@require_scope("logs:service")
def logs_service(request, after_id: int = 0, limit: int = 100, level: str = "", since: datetime | None = None):
    qs = filter_service(ServiceLog.objects.all(), level=level)
    if since:
        qs = qs.filter(at__gte=since)
    return _incremental(qs, service_out, after_id, limit)


# --- notifications -----------------------------------------------------------


class NotificationIn(Schema):
    user_ids: list[int] = []
    character_ids: list[int] = []
    group_ids: list[int] = []
    title: str
    body: str = ""
    link: str = ""
    level: str = "info"
    category: str = "system"


@router.post("/notifications", tags=["notifications"])
@require_scope("notify:write")
def send_notification(request, payload: NotificationIn):
    """Send an in-app notification to users, the owners of characters, or every member of groups.
    Users who muted the category don't get it."""
    from conduit.notify.models import Notification
    from conduit.notify.services import notify

    if payload.level not in Notification.Level.values:
        raise HttpError(400, f"level must be one of {', '.join(Notification.Level.values)}")
    if not payload.title.strip():
        raise HttpError(400, "title is required")
    from conduit.notify.services import is_external_url, is_site_path

    if payload.link and not is_site_path(payload.link):
        if not is_external_url(payload.link):
            raise HttpError(400, "link must be a path on this site or an https:// URL")
        if "notify:links" not in request.api_key.scopes:
            raise HttpError(403, "Links to other sites need the notify:links scope on this key")
    ids = set(payload.user_ids)
    ids |= set(Character.objects.filter(pk__in=payload.character_ids).values_list("user_id", flat=True))
    ids |= set(User.objects.filter(groups__in=payload.group_ids).values_list("pk", flat=True))
    sent = notify(sorted(ids), payload.title.strip(), payload.body, link=payload.link, level=payload.level, category=payload.category)
    record("notification.sent", f"sent the notification \"{payload.title[:80]}\" to {len(sent)} users", request=request,
           target_type="notification", details={"users": len(sent), "category": payload.category})
    return {"sent": len(sent), "recipients": len(ids)}


# --- SeAT import (tools/seat-import) ----------------------------------------------


class SeatCharacterIn(Schema):
    id: int
    name: str
    owner_hash: str = ""
    refresh_token: str = ""
    scopes: list[str] = []


class SeatUserIn(Schema):
    seat_id: int
    name: str
    main_character_id: int
    characters: list[SeatCharacterIn]


class SeatUsersIn(Schema):
    users: list[SeatUserIn]


class SeatSquadIn(Schema):
    name: str
    description: str = ""
    hidden: bool = False
    member_mains: list[int] = []
    moderator_mains: list[int] = []


class SeatVerifyIn(Schema):
    character_ids: list[int]


#: Users per request; the tool sends 25 at a time (with tokens and scopes that stays well under Django's 2.5 MB).
SEAT_BATCH_MAX = 100


def _seat_users(payload: SeatUsersIn):
    from conduit.accounts.seat_import import SeatCharacter, SeatUser

    if len(payload.users) > SEAT_BATCH_MAX:
        raise HttpError(400, f"Send at most {SEAT_BATCH_MAX} users per request")
    return [
        SeatUser(u.seat_id, u.name, u.main_character_id, [SeatCharacter(**c.dict()) for c in u.characters])
        for u in payload.users
    ]


@router.get("/import/seat/info", tags=["import"])
@require_scope("import:seat")
def seat_import_info(request):
    """What the tool checks before importing: this site's EVE application and the scopes its features need."""
    from django.conf import settings

    from conduit.accounts.seat_import import wanted_scopes
    from conduit.esi.tokens import sso_configured

    return {
        "version": __version__,
        "sso_configured": sso_configured(),
        # Public anyway (it is in every login link); the tool compares it with the one SeAT's tokens were issued to.
        "client_id": settings.ESI_CLIENT_ID,
        "wanted_scopes": sorted(wanted_scopes()),
        "users": User.objects.count(),
    }


@router.post("/import/seat/preview", tags=["import"])
@require_scope("import:seat")
def seat_import_preview(request, payload: SeatUsersIn):
    """What importing these users would do. Changes nothing; the tool sends no tokens here."""
    from conduit.accounts.seat_import import preview

    return {"users": preview(_seat_users(payload))}


@router.post("/import/seat/users", tags=["import"])
@require_scope("import:seat")
def seat_import_users(request, payload: SeatUsersIn):
    """Import a batch of users with their characters and tokens. Characters already here stay where they are."""
    from conduit.accounts.seat_import import import_user

    results = [import_user(u) for u in _seat_users(payload)]
    added = sum(1 for r in results for c in r["characters"] if c["status"] == "added")
    created = sum(1 for r in results if r["created"])
    record("seat.imported", f"imported {len(results)} SeAT users ({created} new accounts, {added} characters added)",
           request=request, target_type="import", details={"users": len(results), "created": created, "characters": added})
    return {"users": results}


@router.post("/import/seat/squads", tags=["import"])
@require_scope("import:seat")
def seat_import_squad(request, payload: SeatSquadIn):
    """Turn one SeAT squad into a group, adding the imported members by their SeAT main character."""
    from conduit.accounts.seat_import import SquadError, import_squad

    if not payload.name.strip():
        raise HttpError(400, "name is required")
    try:
        return import_squad(payload.name.strip(), payload.description, payload.hidden, payload.member_mains,
                            payload.moderator_mains, request=request)
    except SquadError as exc:
        raise HttpError(409, str(exc)) from None


@router.post("/import/seat/verify", tags=["import"])
@require_scope("import:seat")
def seat_import_verify(request, payload: SeatVerifyIn):
    """Start refreshing these characters' tokens once, in the background. Poll the returned run for results."""
    import secrets

    from conduit.accounts.tasks import verify_seat_tokens

    ids = list(Character.objects.filter(pk__in=payload.character_ids).values_list("pk", flat=True))
    run_id = secrets.token_hex(8)
    verify_seat_tokens.delay(run_id, ids)
    return {"run_id": run_id, "total": len(ids)}


@router.get("/import/seat/verify/{run_id}", tags=["import"])
@require_scope("import:seat")
def seat_import_verify_status(request, run_id: str):
    from django.core.cache import cache

    from conduit.accounts.tasks import verify_key

    state = cache.get(verify_key(run_id))
    if state is None:
        return {"started": False, "finished": False}
    return {"started": True, **state}


external_api.add_router("/", router)
external_api.add_router("/corporations", corp_external_router)

for plugin_id, plugin in plugin_registry.installed().items():
    if not plugin.external_api:
        continue
    try:
        path, _, attr = plugin.external_api.partition(":")
        external_api.add_router(f"/p/{plugin_id}", getattr(importlib.import_module(path), attr), tags=[plugin.name])
    except Exception:
        log.exception("Could not mount the external API of plugin %s", plugin_id)
