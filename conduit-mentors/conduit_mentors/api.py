"""Mounted at /api/p/mentors/. Only reachable while the plugin is enabled."""

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.accounts.models import User
from conduit.permissions import require_perm

from . import services
from .models import Goal, Mentorship, Program
from .services import MANAGE_PERM, MENTOR_PERM, MentorError

router = Router(tags=["mentors"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except MentorError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _visible(request, mentorship_id: int) -> Mentorship:
    m = get_object_or_404(Mentorship.objects.select_related("mentee", "mentor", "requested_mentor"), pk=mentorship_id)
    if services.role(m, request.user) is None:
        raise HttpError(404, "Not found")
    return m


def _detail(request, m: Mentorship) -> dict:
    m.refresh_from_db()
    return services.detail(m, request.user)


# --- everyone --------------------------------------------------------------------------------------------------


@router.get("")
def overview(request):
    """My own mentorship (or the mentors I can ask), and for mentors their mentees and the waiting list."""
    return services.overview(request.user)


@router.get("/widget")
def widget(request):
    return services.widget(request.user)


class RequestIn(Schema):
    focus: list[str] = []
    note: str = ""
    play_time: str = ""
    #: Ask for this mentor by name; none means anyone.
    mentor_id: int | None = None


@router.post("/request")
def ask(request, payload: RequestIn):
    m = _run(services.request_mentor, request.user, focus=payload.focus, note=payload.note, play_time=payload.play_time,
             mentor_id=payload.mentor_id)
    return services.detail(m, request.user)


@router.get("/m/{mentorship_id}")
def mentorship(request, mentorship_id: int):
    return services.detail(_visible(request, mentorship_id), request.user)


@router.post("/m/{mentorship_id}/withdraw")
def withdraw(request, mentorship_id: int):
    m = _visible(request, mentorship_id)
    _run(services.withdraw, m, request.user)
    return _detail(request, m)


class MessageIn(Schema):
    text: str
    private: bool = False


@router.post("/m/{mentorship_id}/messages")
def add_message(request, mentorship_id: int, payload: MessageIn):
    m = _visible(request, mentorship_id)
    _run(services.message, m, request.user, payload.text, payload.private)
    return _detail(request, m)


class TickIn(Schema):
    done: bool


@router.post("/m/{mentorship_id}/goals/{goal_id}")
def tick(request, mentorship_id: int, goal_id: int, payload: TickIn):
    m = _visible(request, mentorship_id)
    _run(services.tick, m, get_object_or_404(Goal, pk=goal_id), request.user, payload.done)
    return _detail(request, m)


# --- mentors ---------------------------------------------------------------------------------------------------------


@router.post("/m/{mentorship_id}/claim")
@require_perm(MENTOR_PERM)
def claim(request, mentorship_id: int):
    m = _visible(request, mentorship_id)
    if m.status != Mentorship.Status.WAITING:
        raise HttpError(400, "Someone already took this request")
    _run(services.assign, m, request.user, request.user, request=request)
    return _detail(request, m)


class CloseIn(Schema):
    text: str = ""


@router.post("/m/{mentorship_id}/graduate")
def graduate(request, mentorship_id: int, payload: CloseIn):
    m = _visible(request, mentorship_id)
    _run(services.graduate, m, request.user, payload.text, request=request)
    return _detail(request, m)


@router.post("/m/{mentorship_id}/end")
def end(request, mentorship_id: int, payload: CloseIn):
    m = _visible(request, mentorship_id)
    _run(services.end, m, request.user, payload.text, request=request)
    return _detail(request, m)


@router.post("/m/{mentorship_id}/reopen")
@require_perm(MANAGE_PERM)
def reopen(request, mentorship_id: int):
    m = _visible(request, mentorship_id)
    _run(services.reopen, m, request.user, request=request)
    return _detail(request, m)


class ProfileIn(Schema):
    active: bool = True
    capacity: int = 3
    bio: str = ""
    play_time: str = ""
    focus: list[str] = []


@router.put("/profile")
@require_perm(MENTOR_PERM)
def save_profile(request, payload: ProfileIn):
    return services.profile_out(_run(services.save_profile, request.user, payload.dict()))


# --- program managers ------------------------------------------------------------------------------------------------


class AssignIn(Schema):
    mentor_id: int


@router.post("/m/{mentorship_id}/assign")
@require_perm(MANAGE_PERM)
def assign(request, mentorship_id: int, payload: AssignIn):
    m = _visible(request, mentorship_id)
    mentor = get_object_or_404(User, pk=payload.mentor_id)
    _run(services.assign, m, mentor, request.user, request=request)
    return _detail(request, m)


@router.get("/program")
@require_perm(MANAGE_PERM)
def program(request, status: str = "open"):
    qs = Mentorship.objects.select_related("mentee", "mentor", "requested_mentor")
    if status == "open":
        qs = qs.filter(status__in=Mentorship.OPEN)
    elif status in Mentorship.Status.values:
        qs = qs.filter(status=status)
    goal_list = services.goals()
    return {
        "mentorships": [services.brief(m, goal_list) for m in qs[:500]],
        "mentors": services.mentors_out(),
        "stats": services.stats(),
        "settings": services.program_out(Program.load()),
        "goals": [services.goal_out(g) for g in goal_list],
        "can_edit_rules": request.user.has_perm(services.RULES_PERM),
    }


class SettingsIn(Schema):
    focus_areas: list[str] | None = None
    sheet_access: bool | None = None
    suggest_rules: dict | None = None


@router.put("/program/settings")
@require_perm(MANAGE_PERM)
def save_settings(request, payload: SettingsIn):
    data = {k: v for k, v in payload.dict().items() if v is not None}
    return services.program_out(_run(services.save_program, data, request.user, request=request))


class GoalIn(Schema):
    title: str
    description: str = ""
    rules: dict = {}
    mentee_can_tick: bool = False
    focus: list[str] = []


@router.post("/program/goals")
@require_perm(MANAGE_PERM)
def create_goal(request, payload: GoalIn):
    services.goals()  # seed first, so a new site's first goal doesn't stop the defaults
    return services.goal_out(_run(services.save_goal, None, payload.dict(), request.user, request=request))


@router.put("/program/goals/{goal_id}")
@require_perm(MANAGE_PERM)
def update_goal(request, goal_id: int, payload: GoalIn):
    goal = get_object_or_404(Goal, pk=goal_id)
    return services.goal_out(_run(services.save_goal, goal, payload.dict(), request.user, request=request))


@router.delete("/program/goals/{goal_id}")
@require_perm(MANAGE_PERM)
def delete_goal(request, goal_id: int):
    get_object_or_404(Goal, pk=goal_id).delete()
    return {"ok": True}


class OrderIn(Schema):
    ids: list[int]


@router.post("/program/goals/order")
@require_perm(MANAGE_PERM)
def order_goals(request, payload: OrderIn):
    services.reorder_goals(payload.ids)
    return [services.goal_out(g) for g in services.goals()]
