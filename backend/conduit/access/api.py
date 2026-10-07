"""Admin endpoints for states, groups, members and looking up EVE entities."""

from django.contrib.auth.models import Group, Permission
from django.db import IntegrityError, transaction
from django.db.models import Case, Count, Q, Value, When
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.pagination import paginate
from pydantic import Field

from conduit.accounts.models import Character, User
from conduit.audit.services import record
from conduit.eve.models import EveAlliance, EveCorporation, portrait_url
from conduit.eve.tasks import resolve_entities
from conduit.esi.client import esi
from conduit.esi.exceptions import EsiBackoff, EsiError
from conduit.permissions import require_perm
from conduit.schemas import EntityOut, StateBrief, alliance_out, character_brief, corp_out

from . import groups, rules
from .models import GroupProfile, GroupRequest, State
from .services import ADMIN_PERMISSIONS, recompute_all_states

router = Router(tags=["admin"])
COLOR = r"^#[0-9a-fA-F]{6}$"


# --- states ------------------------------------------------------------------


class StateIn(Schema):
    name: str = Field(min_length=1, max_length=50)
    priority: int
    description: str = Field("", max_length=200)
    color: str = Field("#64748b", pattern=COLOR)
    public: bool = False
    member_characters: list[int] = []
    member_corporations: list[int] = []
    member_alliances: list[int] = []
    permissions: list[str] = []  # "app_label.codename"


class StateOut(Schema):
    id: int
    name: str
    priority: int
    description: str
    color: str
    public: bool
    user_count: int
    member_characters: list[dict]
    member_corporations: list[EntityOut]
    member_alliances: list[EntityOut]
    permissions: list[str]


def _state_out(state: State) -> dict:
    return {
        "id": state.pk,
        "name": state.name,
        "priority": state.priority,
        "description": state.description,
        "color": state.color,
        "public": state.public,
        "user_count": state.users.count(),
        "member_characters": [
            {"id": c.id, "name": c.name, "portrait": portrait_url(c.id, 64)} for c in state.member_characters.all()
        ],
        "member_corporations": [corp_out(c) for c in state.member_corporations.all()],
        "member_alliances": [alliance_out(a) for a in state.member_alliances.all()],
        "permissions": sorted(f"{p.content_type.app_label}.{p.codename}" for p in state.permissions.all()),
    }


def _permissions(names: list[str]) -> list[Permission]:
    perms = []
    for name in names:
        app_label, _, codename = name.partition(".")
        perm = Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
        if perm is None:
            raise HttpError(400, f"Unknown permission {name}")
        perms.append(perm)
    return perms


def _ensure_entities(payload: StateIn):
    corp_ids = set(payload.member_corporations)
    alliance_ids = set(payload.member_alliances)
    missing_corps = corp_ids - set(EveCorporation.objects.filter(pk__in=corp_ids).values_list("pk", flat=True))
    missing_alliances = alliance_ids - set(EveAlliance.objects.filter(pk__in=alliance_ids).values_list("pk", flat=True))
    if missing_corps or missing_alliances:
        try:
            resolve_entities(missing_corps, missing_alliances)
        except (EsiError, EsiBackoff) as exc:
            raise HttpError(502, f"Could not look up those corporations/alliances: {exc}") from None


@transaction.atomic
def _save_state(state: State, payload: StateIn) -> State:
    _ensure_entities(payload)
    for field in ("name", "priority", "description", "color", "public"):
        setattr(state, field, getattr(payload, field))
    try:
        with transaction.atomic():
            state.save()
    except IntegrityError:
        raise HttpError(400, "Another state already uses that name or priority") from None
    state.member_characters.set(Character.objects.filter(pk__in=payload.member_characters))
    state.member_corporations.set(payload.member_corporations)
    state.member_alliances.set(payload.member_alliances)
    state.permissions.set(_permissions(payload.permissions))
    transaction.on_commit(recompute_all_states)
    return state


@router.get("/states", response=list[StateOut])
@require_perm("site.manage_access")
def list_states(request):
    return [_state_out(s) for s in State.objects.all()]


@router.post("/states", response=StateOut)
@require_perm("site.manage_access")
def create_state(request, payload: StateIn):
    state = _save_state(State(), payload)
    record("state.created", f"created state {state.name}", request=request, target=state, details=payload.dict())
    return _state_out(state)


@router.put("/states/{state_id}", response=StateOut)
@require_perm("site.manage_access")
def update_state(request, state_id: int, payload: StateIn):
    state = _save_state(get_object_or_404(State, pk=state_id), payload)
    record("state.updated", f"changed state {state.name}", request=request, target=state, details=payload.dict())
    return _state_out(state)


@router.delete("/states/{state_id}")
@require_perm("site.manage_access")
def delete_state(request, state_id: int):
    state = get_object_or_404(State, pk=state_id)
    record("state.deleted", f"deleted state {state.name}", request=request, target=state)
    state.delete()
    transaction.on_commit(recompute_all_states)
    return {"ok": True}


# --- groups ------------------------------------------------------------------


class GroupIn(Schema):
    name: str = Field(min_length=1, max_length=150)
    description: str = Field("", max_length=300)
    color: str = Field("#38bdf8", pattern=COLOR)
    #: Older clients send only ``joinable``; it's used when ``join_mode`` is missing.
    joinable: bool = False
    join_mode: str | None = None
    leave_mode: str | None = None
    hidden: bool = False
    allowed_states: list[int] = []
    permissions: list[str] = []
    leaders: list[int] = []
    leader_groups: list[int] = []
    requirements: dict = {}
    auto: bool = False
    rules: dict = {}
    auto_remove: bool = True
    grace_hours: int = Field(0, ge=0, le=24 * 90)


class GroupOut(Schema):
    id: int
    name: str
    description: str
    color: str
    joinable: bool
    join_mode: str
    leave_mode: str
    hidden: bool
    allowed_states: list[StateBrief]
    permissions: list[str]
    member_count: int
    leaders: list[dict]
    leader_groups: list[dict]
    requirements: dict
    requirements_text: list[str]
    auto: bool
    rules: dict
    rules_text: str
    auto_remove: bool
    grace_hours: int
    last_evaluated: str | None
    pending_requests: int


def _user_brief(u) -> dict:
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None}


def _group_out(group: Group) -> dict:
    profile, _ = GroupProfile.objects.get_or_create(group=group)
    return {
        "id": group.pk,
        "name": group.name,
        "description": profile.description,
        "color": profile.color,
        "joinable": profile.joinable,
        "join_mode": profile.join_mode,
        "leave_mode": profile.leave_mode,
        "hidden": profile.hidden,
        "allowed_states": [{"id": s.pk, "name": s.name, "color": s.color} for s in profile.allowed_states.all()],
        "permissions": sorted(f"{p.content_type.app_label}.{p.codename}" for p in group.permissions.all()),
        "member_count": group.user_set.count(),
        "leaders": [_user_brief(u) for u in profile.leaders.select_related("main_character")],
        "leader_groups": [{"id": g.pk, "name": g.name} for g in profile.leader_groups.all()],
        "requirements": profile.requirements or {},
        "requirements_text": [rules.explain_rule(r) for r in (profile.requirements or {}).get("rules", [])],
        "auto": profile.auto,
        "rules": profile.rules or {},
        "rules_text": rules.describe_ruleset(profile.rules),
        "auto_remove": profile.auto_remove,
        "grace_hours": profile.grace_hours,
        "last_evaluated": profile.last_evaluated.isoformat() if profile.last_evaluated else None,
        "pending_requests": GroupRequest.objects.filter(group=group, status=GroupRequest.Status.PENDING).count(),
    }


def _admin_permission_problem(payload: "GroupIn", join_mode: str) -> str | None:
    granted = sorted(ADMIN_PERMISSIONS & set(payload.permissions))
    if not granted:
        return None
    if payload.leaders or payload.leader_groups:
        why = "group leaders could hand them to anyone"
    elif join_mode == "open":
        why = "anyone could join it"
    elif payload.auto:
        why = "its rules would hand them out automatically"
    else:
        return None
    return (f"This group grants administrator permissions ({', '.join(granted)}) and {why}. "
            "Remove those permissions, or make it a closed group without leaders or rules.")


@transaction.atomic
def _save_group(group: Group, payload: GroupIn) -> Group:
    join_mode = payload.join_mode or ("open" if payload.joinable else "closed")
    leave_mode = payload.leave_mode or ("open" if payload.joinable else "closed")
    if join_mode not in GroupProfile.JoinMode.values:
        raise HttpError(400, "join_mode must be open, request or closed")
    if leave_mode not in GroupProfile.LeaveMode.values:
        raise HttpError(400, "leave_mode must be open, request or closed")
    try:
        requirements = rules.validate_ruleset(payload.requirements)
        ruleset = rules.validate_ruleset(payload.rules)
    except rules.RuleError as exc:
        raise HttpError(400, str(exc)) from None
    if payload.auto and not ruleset:
        raise HttpError(400, "A smart group needs at least one rule")
    problem = _admin_permission_problem(payload, join_mode)
    if problem:
        raise HttpError(400, problem)
    group.name = payload.name
    try:
        with transaction.atomic():
            group.save()
    except IntegrityError:
        raise HttpError(400, "Another group already uses that name") from None
    if group.pk in payload.leader_groups:
        raise HttpError(400, "A group can't lead itself")
    profile, _ = GroupProfile.objects.get_or_create(group=group)
    for field in ("description", "color", "hidden", "auto", "auto_remove", "grace_hours"):
        setattr(profile, field, getattr(payload, field))
    profile.join_mode, profile.leave_mode = join_mode, leave_mode
    profile.requirements, profile.rules = requirements, ruleset
    profile.save()
    profile.allowed_states.set(State.objects.filter(pk__in=payload.allowed_states))
    profile.leaders.set(User.objects.filter(pk__in=payload.leaders))
    profile.leader_groups.set(Group.objects.filter(pk__in=payload.leader_groups))
    group.permissions.set(_permissions(payload.permissions))
    if profile.auto:
        from .tasks import update_smart_groups

        transaction.on_commit(lambda: update_smart_groups.delay())
    return group


@router.get("/groups", response=list[GroupOut])
@require_perm("site.manage_access")
def list_groups(request):
    return [_group_out(g) for g in Group.objects.order_by("name")]


@router.post("/groups", response=GroupOut)
@require_perm("site.manage_access")
def create_group(request, payload: GroupIn):
    group = _save_group(Group(), payload)
    record("group.created", f"created group {group.name}", request=request, target=group, details=payload.dict())
    return _group_out(group)


@router.put("/groups/{group_id}", response=GroupOut)
@require_perm("site.manage_access")
def update_group(request, group_id: int, payload: GroupIn):
    group = _save_group(get_object_or_404(Group, pk=group_id), payload)
    record("group.updated", f"changed group {group.name}", request=request, target=group, details=payload.dict())
    return _group_out(group)


@router.delete("/groups/{group_id}")
@require_perm("site.manage_access")
def delete_group(request, group_id: int):
    group = get_object_or_404(Group, pk=group_id)
    record("group.deleted", f"deleted group {group.name}", request=request, target=group)
    group.delete()
    return {"ok": True}


@router.post("/groups/{group_id}/members/{user_id}")
@require_perm("site.manage_access")
def add_member(request, group_id: int, user_id: int):
    group = get_object_or_404(Group, pk=group_id)
    user = get_object_or_404(User, pk=user_id)
    profile = getattr(group, "profile", None)
    if profile and profile.auto:
        raise HttpError(400, "Membership of a smart group is managed by its rules")
    if profile and not profile.allows(user):
        raise HttpError(400, "That user's state is not allowed in this group")
    groups.add_member(user, group, "admin", request=request)
    return {"ok": True}


@router.delete("/groups/{group_id}/members/{user_id}")
@require_perm("site.manage_access")
def remove_member(request, group_id: int, user_id: int):
    user = get_object_or_404(User, pk=user_id)
    group = get_object_or_404(Group, pk=group_id)
    groups.remove_member(user, group, "admin", request=request)
    return {"ok": True}


@router.post("/groups/{group_id}/evaluate")
@require_perm("site.manage_access")
def evaluate_group_now(request, group_id: int):
    """Apply a smart group's rules right now instead of waiting for the next run."""
    profile = get_object_or_404(GroupProfile, group_id=group_id)
    if not profile.auto:
        raise HttpError(400, "That isn't a smart group")
    result = groups.evaluate_group(profile)
    record("group.evaluated", f"re-applied the rules of {profile.group.name}", request=request, target=profile.group, details=result)
    return result


# --- rules -------------------------------------------------------------------------


@router.get("/rules/types")
@require_perm("site.manage_access")
def rule_types(request):
    return [t.spec() for t in sorted(rules.RULE_TYPES.values(), key=lambda t: (t.category, t.label))]


class PreviewIn(Schema):
    rules: dict
    allowed_states: list[int] = []


@router.post("/rules/preview")
@require_perm("site.manage_access")
def preview_rules(request, payload: PreviewIn):
    """Who would match these rules right now."""
    try:
        ruleset = rules.validate_ruleset(payload.rules)
    except rules.RuleError as exc:
        raise HttpError(400, str(exc)) from None
    return {**groups.preview(ruleset, payload.allowed_states), "text": rules.describe_ruleset(ruleset)}


@router.get("/rules/options")
@require_perm("site.manage_access")
def rule_options(request, type: str, q: str = "", ids: str = ""):
    """Choices for rule parameters: ``type`` is skill, corporation or alliance. Search by ``q`` or look up ``ids``."""
    from conduit.sde.models import ItemType

    wanted = [int(i) for i in ids.split(",") if i.strip().isdigit()]
    if type == "skill":
        qs = ItemType.objects.filter(group__category_id=16, published=True)
        qs = qs.filter(pk__in=wanted) if wanted else qs.filter(name__icontains=q.strip()) if q.strip() else qs.none()
        return [{"id": t.pk, "name": t.name, "hint": t.group.name} for t in qs.select_related("group").order_by("name")[:25]]
    if type in ("corporation", "alliance"):
        model = EveCorporation if type == "corporation" else EveAlliance
        qs = model.objects.filter(pk__in=wanted) if wanted else model.objects.filter(Q(name__icontains=q.strip()) | Q(ticker__iexact=q.strip())) if q.strip() else model.objects.none()
        return [{"id": e.pk, "name": e.name, "hint": e.ticker} for e in qs.order_by("name")[:25]]
    raise HttpError(400, "type must be skill, corporation or alliance")


@router.get("/users/lookup")
@require_perm("site.manage_access")
def user_lookup(request, q: str = "", ids: str = ""):
    """Find users by any of their characters' names (for picking group leaders)."""
    wanted = [int(i) for i in ids.split(",") if i.strip().isdigit()]
    qs = User.objects.select_related("main_character")
    if wanted:
        qs = qs.filter(pk__in=wanted)
    elif len(q.strip()) >= 2:
        qs = qs.filter(characters__name__icontains=q.strip()).distinct()
    else:
        return []
    return [_user_brief(u) for u in qs.order_by("main_character__name")[:20]]


# --- permissions, members, EVE lookup ---------------------------------------


class PermissionOut(Schema):
    name: str
    label: str
    app: str


@router.get("/permissions", response=list[PermissionOut])
@require_perm("site.manage_access")
def list_permissions(request):
    """Permissions worth granting: the site's own and every module's, not Django internals."""
    from django.apps import apps

    hidden = {"admin", "auth", "contenttypes", "sessions"}
    core = {a.label for a in apps.get_app_configs() if a.name.startswith("conduit.")}
    # Core apps only expose their deliberate permissions, not Django's automatic add/change/delete/view ones.
    qs = Permission.objects.select_related("content_type").exclude(content_type__app_label__in=hidden)

    def automatic(p):
        return p.content_type.app_label in core and p.codename in {f"{a}_{p.content_type.model}" for a in ("add", "change", "delete", "view")}

    return [
        {"name": f"{p.content_type.app_label}.{p.codename}", "label": p.name, "app": p.content_type.app_label}
        for p in qs.order_by("content_type__app_label", "codename")
        if not automatic(p)
    ]


class MemberOut(Schema):
    id: int
    name: str
    main: dict | None
    state: StateBrief | None
    character_count: int
    groups: list[str]
    is_admin: bool
    last_login: str | None


@router.get("/members", response=list[MemberOut])
@require_perm("site.view_members")
@paginate
def list_members(request, q: str = "", state: int | None = None):
    qs = (
        User.objects.select_related("main_character__corporation", "main_character__alliance", "state")
        .prefetch_related("groups")
        .annotate(character_count=Count("characters"))
        .order_by("main_character__name")
    )
    if q:
        qs = qs.filter(Q(characters__name__icontains=q) | Q(main_character__corporation__name__icontains=q)).distinct()
    if state:
        qs = qs.filter(state_id=state)
    return [
        {
            "id": u.pk,
            "name": u.display_name,
            "main": character_brief(u.main_character),
            "state": {"id": u.state.pk, "name": u.state.name, "color": u.state.color} if u.state else None,
            "character_count": u.character_count,
            "groups": [g.name for g in u.groups.all()],
            "is_admin": u.is_superuser,
            "last_login": u.last_login.isoformat() if u.last_login else None,
        }
        for u in qs
    ]


class EntityHit(Schema):
    category: str
    id: int
    name: str


@router.get("/eve/search", response=list[EntityHit])
@require_perm("site.manage_access")
def eve_search(request, q: str):
    """Exact-name lookup of characters, corporations and alliances via ESI."""
    q = q.strip()
    if len(q) < 3:
        return []
    try:
        data = esi().post("/universe/ids", [q]).data or {}
    except (EsiError, EsiBackoff) as exc:
        raise HttpError(502, f"ESI lookup failed: {exc}") from None
    hits = []
    for category in ("characters", "corporations", "alliances"):
        for row in data.get(category, []):
            hits.append({"category": category.rstrip("s"), "id": row["id"], "name": row["name"]})
    return hits


# --- compliance -------------------------------------------------------------------------


def _require_compliance(request):
    if not request.user.has_perm("access.view_compliance"):
        raise HttpError(403, "You don't have permission to do that")


@router.get("/compliance")
def compliance_overview(request, q: str = "", state: int | None = None, corporation: int | None = None,
                        status: str = "", limit: int = 50, offset: int = 0):
    """Every member's stored compliance, with KPIs. ``status``: compliant, noncompliant or unchecked."""
    from django.db.models import Max

    from .models import ComplianceStatus

    _require_compliance(request)
    users = User.objects.filter(is_active=True)
    if state:
        users = users.filter(state_id=state)
    if corporation:
        users = users.filter(characters__corporation_id=corporation).distinct()
    if q:
        users = users.filter(characters__name__icontains=q).distinct()
    base = users
    if status == "compliant":
        users = users.filter(compliance__compliant=True)
    elif status == "noncompliant":
        users = users.filter(compliance__compliant=False)
    elif status == "unchecked":
        users = users.filter(compliance__isnull=True)
    # Problems first, then not yet checked, then fine.
    rank = Case(When(compliance__compliant=False, then=Value(0)), When(compliance__compliant=True, then=Value(2)), default=Value(1))
    users = users.select_related("main_character__corporation", "main_character__alliance", "state", "compliance").order_by(
        rank, "main_character__name"
    )
    total = base.count()
    compliant = base.filter(compliance__compliant=True).count()
    noncompliant = base.filter(compliance__compliant=False).count()

    chars = Character.objects.filter(user__in=base)
    invalid = chars.filter(Q(token__isnull=True) | Q(token__valid=False)).count()
    last = ComplianceStatus.objects.aggregate(at=Max("checked_at"))["at"]

    def row(u):
        c = getattr(u, "compliance", None)
        return {
            "id": u.pk,
            "name": u.display_name,
            "main": character_brief(u.main_character),
            "state": {"id": u.state.pk, "name": u.state.name, "color": u.state.color} if u.state_id else None,
            "compliant": c.compliant if c else None,
            "problems": c.problems if c else [],
            "warnings": c.warnings if c else [],
            "checked_at": c.checked_at.isoformat() if c else None,
            "changed_at": c.changed_at.isoformat() if c else None,
        }

    count = users.count()
    limit = max(1, min(limit, 500))
    return {
        "summary": {
            "users": total,
            "compliant": compliant,
            "noncompliant": noncompliant,
            "unchecked": total - compliant - noncompliant,
            "characters": chars.count(),
            "invalid_tokens": invalid,
            "rate": round(compliant / total * 100, 1) if total else None,
            "last_checked": last.isoformat() if last else None,
        },
        "count": count,
        "items": [row(u) for u in users[offset : offset + limit]],
    }


@router.get("/compliance/users/{user_id}")
def compliance_user(request, user_id: int):
    """Live, per-character detail for one user."""
    from .compliance import check_user

    _require_compliance(request)
    user = get_object_or_404(User, pk=user_id)
    return {"id": user.pk, "name": user.display_name, **check_user(user)}


@router.post("/compliance/refresh")
def compliance_refresh(request):
    from .compliance import refresh_all

    _require_compliance(request)
    return {"checked": refresh_all()}


@router.get("/compliance/corporations")
def compliance_corporations(request):
    """Corporations with linked characters, and how many members are registered (when known)."""
    from .compliance import unregistered_members

    _require_compliance(request)
    corps = (
        EveCorporation.objects.filter(characters__isnull=False)
        .annotate(registered=Count("characters", distinct=True))
        .select_related("alliance")
        .order_by("-registered")[:100]
    )
    out = []
    for c in corps:
        missing = unregistered_members(c.pk)
        out.append({
            **corp_out(c),
            "registered": c.registered,
            "member_count": c.member_count,
            "unregistered": len(missing) if missing is not None else None,
        })
    return out


@router.get("/compliance/corporations/{corporation_id}/unregistered")
def compliance_unregistered(request, corporation_id: int):
    from .compliance import unregistered_members

    _require_compliance(request)
    missing = unregistered_members(corporation_id)
    return {"available": missing is not None, "characters": missing or []}
