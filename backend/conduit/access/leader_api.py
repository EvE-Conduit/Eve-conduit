"""``/api/groups/...``: what group leaders do: answer requests and look after members."""

from django.contrib.auth.models import Group
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from pydantic import Field

from conduit.accounts.models import User
from conduit.schemas import character_brief

from . import groups
from .models import GroupProfile, GroupRequest

router = Router(tags=["groups"])


def _led_profile(request, group_id: int) -> GroupProfile:
    profile = get_object_or_404(GroupProfile.objects.select_related("group"), group_id=group_id)
    if not groups.can_manage(request.user, profile):
        raise HttpError(403, "You don't lead this group")
    return profile


def _member_out(u: User, profile: GroupProfile | None = None) -> dict:
    return {
        "id": u.pk,
        "name": u.display_name,
        "main": character_brief(u.main_character),
        "state": {"id": u.state.pk, "name": u.state.name, "color": u.state.color} if u.state_id else None,
        "is_leader": bool(profile and profile.is_leader(u)),
    }


def request_out(r: GroupRequest) -> dict:
    return {
        "id": r.pk,
        "kind": r.kind,
        "status": r.status,
        "message": r.message,
        "response": r.response,
        "created_at": r.created_at.isoformat(),
        "decided_at": r.decided_at.isoformat() if r.decided_at else None,
        "decided_by": r.decided_by.display_name if r.decided_by_id else None,
        "group": {"id": r.group_id, "name": r.group.name, "color": getattr(getattr(r.group, "profile", None), "color", "#38bdf8")},
        "user": _member_out(r.user),
    }


def _with_checks(r: GroupRequest) -> dict:
    out = request_out(r)
    if r.kind == GroupRequest.Kind.JOIN and r.status == GroupRequest.Status.PENDING:
        profile = groups.profile_of(r.group)
        out["requirements"] = groups.requirement_checklist(r.user, profile)
    else:
        out["requirements"] = []
    return out


REQUEST_RELATED = ("user__main_character__corporation", "user__main_character__alliance", "user__state", "group__profile", "decided_by__main_character")


@router.get("/led")
def my_led_groups(request):
    """Groups the current user leads (every group for people who manage access)."""
    ids = groups.led_group_ids(request.user)
    qs = (
        Group.objects.filter(pk__in=ids)
        .select_related("profile")
        .annotate(
            members=Count("user", distinct=True),
            pending=Count("requests", filter=Q(requests__status=GroupRequest.Status.PENDING), distinct=True),
        )
        .order_by("name")
    )
    return [
        {
            "id": g.pk,
            "name": g.name,
            "description": g.profile.description,
            "color": g.profile.color,
            "join_mode": g.profile.join_mode,
            "leave_mode": g.profile.leave_mode,
            "auto": g.profile.auto,
            "member_count": g.members,
            "pending_requests": g.pending,
        }
        for g in qs
    ]


@router.get("/requests")
def pending_requests(request, status: str = "pending", group: int | None = None):
    """Requests for the groups I lead (``status``: pending, decided or all)."""
    ids = groups.led_group_ids(request.user)
    qs = GroupRequest.objects.filter(group_id__in=ids).select_related(*REQUEST_RELATED)
    if group:
        qs = qs.filter(group_id=group)
    if status == "pending":
        qs = qs.filter(status=GroupRequest.Status.PENDING).order_by("created_at")
    elif status == "decided":
        qs = qs.exclude(status=GroupRequest.Status.PENDING).order_by("-decided_at")
    return [_with_checks(r) for r in qs[:200]]


class DecisionIn(Schema):
    response: str = Field("", max_length=500)


def _decide(request, request_id: int, approve: bool, payload: DecisionIn):
    req = get_object_or_404(GroupRequest.objects.select_related("group", "user"), pk=request_id)
    try:
        groups.decide(req, request.user, approve, payload.response, request=request)
    except groups.GroupError as exc:
        raise HttpError(exc.status, str(exc)) from None
    return request_out(req)


@router.post("/requests/{request_id}/approve")
def approve(request, request_id: int, payload: DecisionIn):
    return _decide(request, request_id, True, payload)


@router.post("/requests/{request_id}/reject")
def reject(request, request_id: int, payload: DecisionIn):
    return _decide(request, request_id, False, payload)


@router.get("/{group_id}/members")
def members(request, group_id: int, q: str = ""):
    profile = _led_profile(request, group_id)
    qs = profile.group.user_set.select_related("main_character__corporation", "main_character__alliance", "state")
    if q:
        qs = qs.filter(characters__name__icontains=q).distinct()
    return {
        "group": {"id": profile.group_id, "name": profile.group.name, "color": profile.color, "auto": profile.auto,
                  "join_mode": profile.join_mode, "leave_mode": profile.leave_mode},
        "members": [_member_out(u, profile) for u in qs.order_by("main_character__name")],
    }


@router.get("/{group_id}/candidates")
def candidates(request, group_id: int, q: str = ""):
    """Users a leader could add: not yet members, matching ``q``, with whether they're eligible."""
    profile = _led_profile(request, group_id)
    if len(q.strip()) < 2:
        return []
    qs = (
        User.objects.filter(is_active=True, characters__name__icontains=q.strip())
        .exclude(groups=profile.group)
        .select_related("main_character__corporation", "main_character__alliance", "state")
        .distinct()[:20]
    )
    return [{**_member_out(u), "problems": groups.failed_requirements(u, profile)} for u in qs]


@router.post("/{group_id}/members/{user_id}")
def add(request, group_id: int, user_id: int):
    profile = _led_profile(request, group_id)
    if profile.auto:
        raise HttpError(400, "Membership of a smart group is managed by its rules")
    user = get_object_or_404(User, pk=user_id)
    problems = groups.failed_requirements(user, profile)
    if problems and not request.user.has_perm("site.manage_access"):
        raise HttpError(400, f"{user.display_name} doesn't meet the requirements: " + "; ".join(problems))
    if not profile.allows(user):
        raise HttpError(400, "That user's state is not allowed in this group")
    try:
        groups.add_member(user, profile.group, "leader", request=request)
    except groups.GroupError as exc:
        raise HttpError(exc.status, str(exc)) from None
    from conduit.notify import notify

    notify(user, f"You've been added to {profile.group.name}", f"{request.user.display_name} added you.", link="/groups",
           level="success", category="groups")
    return {"ok": True}


@router.delete("/{group_id}/members/{user_id}")
def remove(request, group_id: int, user_id: int):
    profile = _led_profile(request, group_id)
    if profile.auto:
        raise HttpError(400, "Membership of a smart group is managed by its rules")
    user = get_object_or_404(User, pk=user_id)
    if groups.remove_member(user, profile.group, "leader", request=request):
        from conduit.notify import notify

        notify(user, f"You've been removed from {profile.group.name}", f"{request.user.display_name} removed you.",
               link="/groups", level="warning", category="groups")
    return {"ok": True}
