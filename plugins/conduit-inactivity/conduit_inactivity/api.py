"""Mounted at /api/p/inactivity/. Only reachable while the plugin is enabled, and only by members.

Every member posts and cancels their own leave. The list of members and everyone's leave needs
inactivity.view_inactivity or inactivity.manage_leave; deciding leave and the settings need inactivity.manage_leave.
"""

from datetime import date

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .models import Leave
from .services import MANAGE_PERM, InactivityError

router = Router(tags=["inactivity"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except InactivityError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _list_perm(request):
    if not services.can_see_list(request.user):
        raise HttpError(403, "You don't have permission to do that")


# --- every member ------------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    return services.me(request.user)


class LeaveIn(Schema):
    start: date
    end: date
    reason: str = ""


@router.post("/leave")
def post_leave(request, payload: LeaveIn):
    leave = _run(services.post_leave, request.user, payload.start, payload.end, payload.reason, request=request)
    return services.leave_out(leave)


@router.post("/leave/{leave_id}/cancel")
def cancel_leave(request, leave_id: int):
    leave = get_object_or_404(Leave, pk=leave_id)
    if leave.user_id != request.user.pk:
        raise HttpError(404, "Not found")
    return services.leave_out(_run(services.cancel_leave, request.user, leave))


# --- HR ------------------------------------------------------------------------------------------------------------


@router.get("/members")
def members(request, filter: str = "all", q: str = ""):
    _list_perm(request)
    return {**services.member_rows(filter, q), "can_manage": request.user.has_perm(MANAGE_PERM)}


@router.get("/members.csv")
def members_csv(request, filter: str = "all", q: str = ""):
    _list_perm(request)
    resp = HttpResponse(services.members_csv(filter, q), content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = 'attachment; filename="inactivity.csv"'
    return resp


@router.get("/summary")
def summary(request):
    _list_perm(request)
    return services.summary()


@router.get("/leaves")
def leaves(request, status: str = "pending"):
    _list_perm(request)
    return {"items": services.leave_list(status), "can_manage": request.user.has_perm(MANAGE_PERM)}


class DecideIn(Schema):
    approve: bool
    note: str = ""


@router.post("/leaves/{leave_id}/decide")
@require_perm(MANAGE_PERM)
def decide(request, leave_id: int, payload: DecideIn):
    leave = get_object_or_404(Leave.objects.select_related("user"), pk=leave_id)
    _run(services.decide_leave, leave, request.user, payload.approve, payload.note, request=request)
    return services.leave_out(leave, with_user=True)


@router.get("/settings")
@require_perm(MANAGE_PERM)
def get_settings(request):
    return services.settings_out()


class SettingsIn(Schema):
    days: int
    use_site: bool
    use_game: bool
    use_fleets: bool
    states: list[int] = []
    groups: list[int] = []
    leave_needs_approval: bool
    max_leave_days: int
    notify_member: bool


@router.put("/settings")
@require_perm(MANAGE_PERM)
def put_settings(request, payload: SettingsIn):
    s = _run(services.save_settings, payload.dict(), request.user, request=request)
    return services.settings_out(s)


@router.post("/scan")
@require_perm(MANAGE_PERM)
def scan(request):
    """Check everyone again now. Doesn't notify: the daily check tells HR who went quiet."""
    services.scan(notify_people=False)
    return services.summary()
