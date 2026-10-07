"""Mounted at /api/p/recruit/. Only reachable while the plugin is enabled."""

from django.contrib.auth.models import Group
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.permissions import require_perm

from . import services
from .models import Application, Form
from .services import REVIEW_PERM, RecruitError

router = Router(tags=["recruit"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except RecruitError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _visible_application(request, application_id: int) -> Application:
    app = get_object_or_404(Application.objects.select_related("form", "user", "reviewer"), pk=application_id)
    if app.user_id != request.user.pk and not request.user.has_perm(REVIEW_PERM):
        raise HttpError(404, "Not found")
    return app


# --- applicants -----------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    """The open forms and the signed-in user's own applications."""
    mine = Application.objects.filter(user=request.user).select_related("form", "user", "reviewer")
    current = next((a for a in mine if a.is_open), None)
    return {
        "forms": [services.form_out(f) for f in Form.objects.filter(open=True)],
        "current": services.application_out(current, request.user, detail=True) if current else None,
        "past": [services.application_out(a, request.user) for a in mine if not a.is_open],
        "is_recruiter": request.user.has_perm(REVIEW_PERM),
    }


class ApplyIn(Schema):
    form_id: int
    answers: dict = {}


@router.post("/applications")
def apply(request, payload: ApplyIn):
    form = get_object_or_404(Form, pk=payload.form_id)
    app = _run(services.apply, request.user, form, payload.answers)
    return services.application_out(app, request.user, detail=True)


@router.post("/applications/{application_id}/withdraw")
def withdraw(request, application_id: int):
    app = _visible_application(request, application_id)
    _run(services.withdraw, request.user, app)
    return services.application_out(app, request.user, detail=True)


class CommentIn(Schema):
    text: str
    internal: bool = False


@router.post("/applications/{application_id}/comments")
def add_comment(request, application_id: int, payload: CommentIn):
    app = _visible_application(request, application_id)
    _run(services.comment, app, request.user, payload.text, payload.internal)
    return services.application_out(app, request.user, detail=True)


@router.get("/applications/{application_id}")
def application(request, application_id: int):
    return services.application_out(_visible_application(request, application_id), request.user, detail=True)


# --- recruiters --------------------------------------------------------------------------------------------------


@router.get("/applications")
@require_perm(REVIEW_PERM)
def queue(request, status: str = "open", q: str = ""):
    qs = Application.objects.select_related("form", "user", "reviewer")
    if status == "open":
        qs = qs.filter(status__in=Application.OPEN)
    elif status == "mine":
        qs = qs.filter(status__in=Application.OPEN, reviewer=request.user)
    elif status in Application.Status.values:
        qs = qs.filter(status=status)
    if q.strip():
        qs = qs.filter(Q(user__characters__name__icontains=q.strip()) | Q(form__name__icontains=q.strip())).distinct()
    counts = dict(Application.objects.values_list("status").annotate(n=Count("id")))
    return {
        "items": [services.application_out(a, request.user) for a in qs[:500]],
        "counts": {"open": counts.get("new", 0) + counts.get("review", 0), "new": counts.get("new", 0),
                   "mine": Application.objects.filter(status__in=Application.OPEN, reviewer=request.user).count(),
                   "accepted": counts.get("accepted", 0), "rejected": counts.get("rejected", 0),
                   "withdrawn": counts.get("withdrawn", 0)},
    }


@router.post("/applications/{application_id}/claim")
@require_perm(REVIEW_PERM)
def claim(request, application_id: int):
    app = _visible_application(request, application_id)
    _run(services.claim, app, request.user)
    return services.application_out(app, request.user, detail=True)


class DecideIn(Schema):
    accept: bool
    message: str = ""


@router.post("/applications/{application_id}/decide")
@require_perm(REVIEW_PERM)
def decide(request, application_id: int, payload: DecideIn):
    app = _visible_application(request, application_id)
    if app.user_id == request.user.pk:
        raise HttpError(403, "You can't decide your own application")
    _run(services.decide, app, request.user, payload.accept, payload.message, request=request)
    return services.application_out(app, request.user, detail=True)


# --- forms ---------------------------------------------------------------------------------------------------------


@router.get("/forms")
@require_perm("recruit.manage_forms")
def forms(request):
    return {
        "forms": [services.form_out(f, admin=True) for f in Form.objects.prefetch_related("accept_groups")],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
    }


class FormIn(Schema):
    name: str
    description: str = ""
    questions: list[dict] = []
    accept_groups: list[int] = []
    open: bool = True
    order: int = 0


@router.post("/forms")
@require_perm("recruit.manage_forms")
def create_form(request, payload: FormIn):
    form = _run(services.save_form, None, payload.dict(), request.user, request=request)
    return services.form_out(form, admin=True)


@router.put("/forms/{form_id}")
@require_perm("recruit.manage_forms")
def update_form(request, form_id: int, payload: FormIn):
    form = _run(services.save_form, get_object_or_404(Form, pk=form_id), payload.dict(), request.user, request=request)
    return services.form_out(form, admin=True)


@router.delete("/forms/{form_id}")
@require_perm("recruit.manage_forms")
def delete_form(request, form_id: int):
    form = get_object_or_404(Form, pk=form_id)
    if form.applications.exists():
        raise HttpError(400, "People have applied with this form; close it instead of deleting it")
    form.delete()
    return {"ok": True}
