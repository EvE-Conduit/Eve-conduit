"""Mounted at /api/p/skillplans/. Only reachable while the plugin is enabled."""

import csv

from django.http import HttpResponse
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.audit.services import record
from conduit.sde.models import ItemType
from conduit.sheet.skills import training

from . import services
from .models import SkillPlan

router = Router(tags=["skillplans"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.PlanError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _plan(request, pk: int) -> SkillPlan:
    plan = services.visible_plans(request.user).filter(pk=pk).first()
    if plan is None:
        raise HttpError(404, "No such skill plan")
    return plan


def _editable(request, pk: int) -> SkillPlan:
    plan = _plan(request, pk)
    if not services.can_edit(request.user, plan):
        raise HttpError(403, "Only skill plan managers can change shared plans")
    return plan


# --- everyone ------------------------------------------------------------------------------------------------------


@router.get("")
def overview(request):
    """Shared plans and my own, with my best character's progress on each."""
    plans = list(services.visible_plans(request.user))
    mine = services.my_progress(request.user, plans)
    return {
        "plans": [services.plan_brief(p, mine.get(p.pk)) for p in plans],
        "can_manage": services.can_manage(request.user),
        "can_view_progress": services.can_view_progress(request.user),
    }


@router.get("/me")
def me(request):
    """For the dashboard: the shared plan I'm closest to finishing (that isn't finished yet)."""
    plans = list(services.visible_plans(request.user).filter(shared=True))
    mine = services.my_progress(request.user, plans)
    open_plans = [(p, mine[p.pk]) for p in plans if mine.get(p.pk) and not mine[p.pk]["complete"]]
    best = max(open_plans, key=lambda pm: pm[1]["percent"], default=None)
    return {
        "plans": len(plans),
        "complete": sum(1 for p in plans if mine.get(p.pk) and mine[p.pk]["complete"]),
        "next": services.plan_brief(best[0], best[1]) if best else None,
    }


@router.get("/skills")
def skills(request, q: str = ""):
    return services.find_skills(q)


@router.get("/types")
def types(request, q: str = ""):
    return services.find_types(q)


@router.get("/types/{type_id}/requirements")
def type_requirements(request, type_id: int):
    """What a ship or item needs, as plan targets, to add to a plan."""
    t = ItemType.objects.filter(pk=type_id).first()
    if t is None:
        raise HttpError(404, "No such item")
    return {"name": t.name, "skills": [[s, lvl] for s, lvl in training.requirements_of_types([type_id]).items()]}


class SkillsIn(Schema):
    skills: list[list[int]] = []


@router.post("/normalise")
def normalise(request, payload: SkillsIn):
    """The editor's skills in plan order, with prerequisites added, names and skill points."""
    steps = _run(services.normalise, payload.skills)
    named, total = services.named_steps([(s, lvl) for s, lvl in steps])
    return {"steps": named, "total_sp": total}


class TextIn(Schema):
    text: str


@router.post("/parse")
def parse(request, payload: TextIn):
    """Read a skill list pasted from the game. Returns what was understood and the lines that weren't."""
    steps, problems = training.parse_text(payload.text[:100_000])
    return {"skills": [[s, lvl] for s, lvl in steps], "problems": problems[:50]}


class PlanIn(Schema):
    name: str
    description: str = ""
    category: str = ""
    skills: list[list[int]] = []
    shared: bool = False


@router.post("/plans")
def create(request, payload: PlanIn):
    """Create a plan. Other plugins (Doctrines, Mentors) use this too; the page for it is /p/skillplans/<id>."""
    plan = _run(services.save_plan, request.user, None, **payload.model_dump())
    if plan.shared:
        record("skillplans.create", f"created the shared skill plan \"{plan.name}\"", request=request, target=plan)
    return services.plan_detail(plan, request.user)


@router.get("/plans/{plan_id}")
def detail(request, plan_id: int):
    return services.plan_detail(_plan(request, plan_id), request.user)


@router.put("/plans/{plan_id}")
def edit(request, plan_id: int, payload: PlanIn):
    plan = _editable(request, plan_id)
    if payload.shared != plan.shared and not services.can_manage(request.user):
        raise HttpError(403, "Only skill plan managers can share plans")
    plan = _run(services.save_plan, request.user, plan, **payload.model_dump())
    if plan.shared:
        record("skillplans.edit", f"changed the shared skill plan \"{plan.name}\"", request=request, target=plan)
    return services.plan_detail(plan, request.user)


@router.post("/plans/{plan_id}/copy")
def copy(request, plan_id: int):
    """A personal copy of any plan I can see."""
    return services.plan_detail(services.copy_plan(request.user, _plan(request, plan_id)), request.user)


@router.delete("/plans/{plan_id}")
def delete(request, plan_id: int):
    plan = _editable(request, plan_id)
    if plan.shared:
        record("skillplans.delete", f"deleted the shared skill plan \"{plan.name}\"", request=request, target=plan)
    plan.delete()
    return {"ok": True}


# --- leadership ----------------------------------------------------------------------------------------------------


def _progress_plan(request, plan_id: int) -> SkillPlan:
    if not services.can_view_progress(request.user):
        raise HttpError(403, "You do not have permission to do that")
    plan = SkillPlan.objects.filter(pk=plan_id, shared=True).first()
    if plan is None:
        raise HttpError(404, "No such shared skill plan")
    return plan


@router.get("/plans/{plan_id}/members")
def members(request, plan_id: int):
    plan = _progress_plan(request, plan_id)
    return {"plan": services.plan_brief(plan), "members": services.members_progress(plan)}


@router.get("/plans/{plan_id}/members.csv")
def members_csv(request, plan_id: int):
    plan = _progress_plan(request, plan_id)
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="skill-plan-{plan.pk}.csv"'
    out = csv.writer(resp)
    out.writerow(["Member", "Best character", "Percent", "Complete", "Hours left"])
    for m in services.members_progress(plan):
        out.writerow([m["name"], m["character"], m["percent"], "yes" if m["complete"] else "no", round(m["seconds_left"] / 3600, 1)])
    return resp
