"""Recruitment: applying, reviewing, deciding.

Anyone signed in can apply (usually guests who just logged in with EVE). People with
``recruit.review_applications`` see the queue, each applicant's characters (and, while the application is open,
their full character sheets), write internal notes or messages to the applicant, and accept or reject. Accepting
adds the applicant to the form's groups.
"""

from __future__ import annotations

import uuid

from django.contrib.auth.models import Group
from django.db import transaction
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.audit.services import record
from conduit.eve.models import portrait_url
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm

from .models import Application, Comment, Form

KINDS = ("text", "long", "yesno", "choice")
REVIEW_PERM = "recruit.review_applications"


class RecruitError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- character sheet access ----------------------------------------------------------------------------------


def recruiter_can_view(user, character) -> bool:
    """Recruiters may read the sheets of anyone with an open application (Plugin.sheet_access)."""
    return user.has_perm(REVIEW_PERM) and Application.objects.filter(user_id=character.user_id, status__in=Application.OPEN).exists()


# --- forms ---------------------------------------------------------------------------------------------------


def clean_questions(raw) -> list[dict]:
    if not isinstance(raw, list) or len(raw) > 50:
        raise RecruitError("A form has up to 50 questions")
    out = []
    for q in raw:
        if not isinstance(q, dict):
            raise RecruitError("Bad question")
        label = str(q.get("label", "")).strip()[:300]
        kind = q.get("kind", "text")
        if not label:
            raise RecruitError("Every question needs a label")
        if kind not in KINDS:
            raise RecruitError(f"Unknown question type {kind!r}")
        choices = [str(c).strip()[:100] for c in q.get("choices") or [] if str(c).strip()][:20] if kind == "choice" else []
        if kind == "choice" and len(choices) < 2:
            raise RecruitError(f"“{label}” needs at least two choices")
        qid = str(q.get("id") or "")[:40] or uuid.uuid4().hex[:8]
        out.append({"id": qid, "label": label, "help": str(q.get("help", "")).strip()[:300], "kind": kind,
                    "choices": choices, "required": bool(q.get("required"))})
    if len({q["id"] for q in out}) != len(out):
        raise RecruitError("Two questions have the same id")
    return out


def form_out(form: Form, *, admin: bool = False) -> dict:
    out = {"id": form.pk, "name": form.name, "description": form.description, "questions": form.questions, "open": form.open}
    if admin:
        out["accept_groups"] = [{"id": g.pk, "name": g.name} for g in form.accept_groups.all()]
        out["applications"] = form.applications.count()
        out["order"] = form.order
    return out


def save_form(form: Form | None, data: dict, by, request=None) -> Form:
    name = str(data.get("name", "")).strip()[:100]
    if not name:
        raise RecruitError("Give the form a name")
    questions = clean_questions(data.get("questions", []))
    groups = list(Group.objects.filter(pk__in=data.get("accept_groups") or []))
    with transaction.atomic():
        form = form or Form()
        form.name = name
        form.description = str(data.get("description", "")).strip()[:4000]
        form.questions = questions
        form.open = bool(data.get("open", True))
        form.order = int(data.get("order") or 0)
        form.save()
        form.accept_groups.set(groups)
    record("recruit.form_saved", f"saved recruitment form {form.name}", request=request, actor=by, target_type="plugin",
           details={"form_id": form.pk})
    return form


# --- applying -------------------------------------------------------------------------------------------------


def open_application(user) -> Application | None:
    return Application.objects.filter(user=user, status__in=Application.OPEN).select_related("form").first()


def clean_answers(form: Form, raw) -> dict:
    raw = raw if isinstance(raw, dict) else {}
    out = {}
    for q in form.questions:
        kind = q.get("kind", "text")
        value = raw.get(q["id"])
        if kind == "yesno":
            value = None if value in (None, "") else bool(value)
        elif value is not None:
            value = str(value).strip()[: 300 if kind != "long" else 10000]
            if kind == "choice" and value and value not in q.get("choices", []):
                raise RecruitError(f"Pick one of the choices for “{q['label']}”")
        if q.get("required") and value in (None, ""):
            raise RecruitError(f"Please answer “{q['label']}”")
        out[q["id"]] = value
    return out


@transaction.atomic
def apply(user, form: Form, answers) -> Application:
    if not form.open:
        raise RecruitError("This form isn't taking applications right now")
    if open_application(user):
        raise RecruitError("You already have an application in progress")
    app = Application.objects.create(user=user, form=form, answers=clean_answers(form, answers))
    reviewers = [u for u in users_with_perm(REVIEW_PERM) if u.pk != user.pk]
    notify(reviewers, f"New application from {user.display_name}", form.name, link=f"/p/recruit/applications/{app.pk}",
           category="p.recruit", data={"application_id": app.pk})
    bus.emit("recruit.application_submitted", user_id=user.pk, user=user.display_name, form=form.name, application_id=app.pk,
             link=f"/p/recruit/applications/{app.pk}", summary=f"{user.display_name} applied: {form.name}")
    record("recruit.applied", f"applied to {form.name}", actor=user, target_type="plugin", details={"application_id": app.pk})
    return app


def withdraw(user, app: Application) -> Application:
    if app.user_id != user.pk:
        raise RecruitError("Not your application", 403)
    if not app.is_open:
        raise RecruitError("This application is already closed")
    app.status = Application.Status.WITHDRAWN
    app.decided_at = timezone.now()
    app.save(update_fields=["status", "decided_at", "updated_at"])
    Comment.objects.create(application=app, author=user, text="Withdrew the application", event="withdrawn")
    if app.reviewer_id:
        notify(app.reviewer_id, f"{user.display_name} withdrew their application", link=f"/p/recruit/applications/{app.pk}", category="p.recruit")
    return app


# --- reviewing ---------------------------------------------------------------------------------------------------


def claim(app: Application, by) -> Application:
    if not app.is_open:
        raise RecruitError("This application is closed")
    app.reviewer = by
    app.status = Application.Status.REVIEW
    app.save(update_fields=["reviewer", "status", "updated_at"])
    Comment.objects.create(application=app, author=by, text="Took this application", internal=True, event="claimed")
    return app


def comment(app: Application, by, text: str, internal: bool) -> Comment:
    text = (text or "").strip()[:10000]
    if not text:
        raise RecruitError("Write something first")
    is_reviewer = by.has_perm(REVIEW_PERM)
    if app.user_id != by.pk and not is_reviewer:
        raise RecruitError("Not your application", 403)
    internal = internal and is_reviewer and app.user_id != by.pk
    c = Comment.objects.create(application=app, author=by, text=text, internal=internal)
    link = f"/p/recruit/applications/{app.pk}"
    if app.user_id == by.pk:
        targets = [app.reviewer_id] if app.reviewer_id else [u for u in users_with_perm(REVIEW_PERM) if u.pk != by.pk]
        notify(targets, f"{by.display_name} wrote on their application", text[:300], link=link, category="p.recruit")
    elif not internal:
        notify(app.user_id, "A recruiter wrote to you", text[:300], link="/p/recruit", category="p.recruit")
    return c


@transaction.atomic
def decide(app: Application, by, accept: bool, message: str = "", request=None) -> Application:
    from conduit.access import groups as access_groups

    if not app.is_open:
        raise RecruitError("This application is already closed")
    app.status = Application.Status.ACCEPTED if accept else Application.Status.REJECTED
    app.decided_at = timezone.now()
    app.decided_by = by
    app.reviewer = app.reviewer or by
    app.save()
    added = []
    if accept:
        for group in app.form.accept_groups.all():
            try:
                if access_groups.add_member(app.user, group, "admin", request=request, actor=by, note="accepted recruit"):
                    added.append(group.name)
            except access_groups.GroupError as exc:
                raise RecruitError(f"Couldn't add them to {group.name}: {exc}", 403) from None
    verb = "accepted" if accept else "rejected"
    Comment.objects.create(application=app, author=by, text=message.strip()[:10000] or verb.capitalize(), event=verb)
    title = "Welcome aboard! Your application was accepted" if accept else "Your application was not accepted"
    notify(app.user_id, title, message.strip()[:300] or app.form.name, link="/p/recruit", level="success" if accept else "info",
           category="p.recruit", force=True)
    bus.emit("recruit.application_decided", user_id=app.user_id, user=app.user.display_name, form=app.form.name,
             application_id=app.pk, accepted=accept, by=by.display_name, groups=added,
             summary=f"{by.display_name} {verb} {app.user.display_name} ({app.form.name})")
    record(f"recruit.{verb}", f"{verb} {app.user.display_name}'s application", request=request, actor=by, target=app.user,
           details={"application_id": app.pk, "groups": added})
    return app


# --- what pages show -----------------------------------------------------------------------------------------------


def characters_out(user) -> list[dict]:
    """The applicant's characters at a glance: corporation, skill points, wallet, age, security status, kills."""
    from conduit.sheet.killmails.models import CharacterKillmail

    chars = list(
        Character.objects.filter(user=user)
        .select_related("corporation", "alliance", "token", "skill_summary", "wallet", "info")
        .order_by("name")
    )
    kills = {}
    for cid, is_loss in CharacterKillmail.objects.filter(character__in=chars).values_list("character_id", "is_loss"):
        k = kills.setdefault(cid, [0, 0])
        k[1 if is_loss else 0] += 1
    out = []
    for c in chars:
        info = getattr(c, "info", None)
        skills = getattr(c, "skill_summary", None)
        wallet = getattr(c, "wallet", None)
        token = getattr(c, "token", None)
        out.append({
            "id": c.pk,
            "name": c.name,
            "portrait": portrait_url(c.pk, 64),
            "main": c.pk == user.main_character_id,
            "corporation": c.corporation.name if c.corporation else None,
            "alliance": c.alliance.name if c.alliance else None,
            "total_sp": skills.total_sp if skills else None,
            "wallet": float(wallet.balance) if wallet else None,
            "birthday": info.birthday.isoformat() if info and info.birthday else None,
            "security_status": info.security_status if info else None,
            "kills": kills.get(c.pk, [0, 0])[0],
            "losses": kills.get(c.pk, [0, 0])[1],
            "login_ok": bool(token and token.valid),
        })
    return out


def comment_out(c: Comment) -> dict:
    return {"id": c.pk, "author": c.author.display_name if c.author else "Someone", "author_id": c.author_id,
            "portrait": portrait_url(c.author.main_character_id, 64) if c.author and c.author.main_character_id else None,
            "text": c.text, "internal": c.internal, "event": c.event, "created_at": c.created_at.isoformat()}


def _decision_message(app: Application) -> str:
    """What the recruiter wrote when accepting or rejecting (the applicant sees it)."""
    if app.status not in (Application.Status.ACCEPTED, Application.Status.REJECTED):
        return ""
    c = app.comments.filter(event=app.status).order_by("-created_at").first()
    return c.text if c and c.text not in ("Accepted", "Rejected") else ""


def application_out(app: Application, viewer, *, detail: bool = False) -> dict:
    is_recruiter = viewer.has_perm(REVIEW_PERM) and viewer.pk != app.user_id
    out = {
        "id": app.pk,
        "status": app.status,
        "form": {"id": app.form_id, "name": app.form.name},
        "user": {"id": app.user_id, "name": app.user.display_name,
                 "portrait": portrait_url(app.user.main_character_id, 128) if app.user.main_character_id else None},
        "reviewer": app.reviewer.display_name if app.reviewer else None,
        "reviewer_id": app.reviewer_id,
        "created_at": app.created_at.isoformat(),
        "updated_at": app.updated_at.isoformat(),
        "decided_at": app.decided_at.isoformat() if app.decided_at else None,
        "decision_message": _decision_message(app),
    }
    if detail:
        out["questions"] = [{**q, "answer": app.answers.get(q["id"])} for q in app.form.questions]
        comments = app.comments.select_related("author").all()
        out["comments"] = [comment_out(c) for c in comments if is_recruiter or not c.internal]
        if is_recruiter:
            out["characters"] = characters_out(app.user)
            out["accept_groups"] = [g.name for g in app.form.accept_groups.all()]
            out["history"] = [
                {"id": a.pk, "status": a.status, "form": a.form.name, "created_at": a.created_at.isoformat()}
                for a in Application.objects.filter(user_id=app.user_id).exclude(pk=app.pk).select_related("form")
            ]
    return out
