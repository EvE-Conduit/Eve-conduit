"""Skill plans: who sees and edits which plan, and each character's progress.

All skill maths (prerequisites, skill points, training time, the in-game text format) is
``conduit.sheet.skills.training``; this file only decides what to ask it.
"""

from __future__ import annotations

from django.db.models import Q

from conduit.accounts.models import Character
from conduit.eve.models import portrait_url
from conduit.sde.models import ItemType, type_icon_url
from conduit.sheet.skills import training

from .models import SkillPlan

#: Longest plan we keep: all ~500 skills to V would be ~2500 steps; nothing sensible is near that.
MAX_STEPS = 1500


class PlanError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_manage(user) -> bool:
    return user.has_perm("skillplans.manage_plans")


def can_view_progress(user) -> bool:
    return user.has_perm("skillplans.view_progress")


def visible_plans(user):
    return SkillPlan.objects.filter(Q(shared=True) | Q(owner=user)).select_related("owner__main_character")


def can_edit(user, plan: SkillPlan) -> bool:
    return can_manage(user) if plan.shared else plan.owner_id == user.pk


def normalise(skills) -> list[list[int]]:
    """Wanted skill levels to ordered plan steps (prerequisites first). Unknown skills are an error."""
    targets = []
    for item in skills or []:
        try:
            sid, level = int(item[0]), int(item[1])
        except (TypeError, ValueError, IndexError):
            raise PlanError("Each skill must be [skill id, level]") from None
        if not 1 <= level <= 5:
            raise PlanError("Levels go from 1 to 5")
        targets.append((sid, level))
    info = training.skill_info(s for s, _ in targets)
    unknown = {s for s, _ in targets} - info.keys()
    if unknown:
        raise PlanError(f"Not a skill: {', '.join(str(s) for s in sorted(unknown))}")
    steps = training.plan(targets, info)
    if len(steps) > MAX_STEPS:
        raise PlanError(f"A plan can have at most {MAX_STEPS} skill levels")
    return [[s, lvl] for s, lvl in steps]


def save_plan(user, plan: SkillPlan | None, *, name: str, description: str = "", category: str = "", skills=(), shared: bool = False) -> SkillPlan:
    name = (name or "").strip()[:120]
    if not name:
        raise PlanError("Give the plan a name")
    if shared and not can_manage(user):
        raise PlanError("Only skill plan managers can share plans", 403)
    steps = normalise(skills)
    if plan is None:
        plan = SkillPlan(created_by=user)
    plan.name, plan.description, plan.category = name, (description or "").strip()[:4000], (category or "").strip()[:50]
    plan.skills, plan.shared = steps, bool(shared)
    plan.owner = None if shared else (plan.owner or user)
    plan.save()
    return plan


def copy_plan(user, plan: SkillPlan) -> SkillPlan:
    return SkillPlan.objects.create(name=f"{plan.name} (copy)"[:120], description=plan.description, category=plan.category,
                                    skills=plan.skills, owner=user, created_by=user)


# --- progress ------------------------------------------------------------------------------------------------------


def _steps(plan: SkillPlan) -> list[tuple[int, int]]:
    return [(int(s), int(lvl)) for s, lvl in plan.skills]


def plan_complete(user, plan_id: int, scope: str = "any") -> bool:
    """For the group rule: the plan's skills are trained on the main, any or every character."""
    plan = SkillPlan.objects.filter(pk=plan_id, shared=True).first()
    if plan is None:
        return False
    if scope == "main":
        chars = [user.main_character_id] if user.main_character_id else []
    else:
        chars = list(user.characters.values_list("pk", flat=True))
    if not chars:
        return False
    need = training.highest(_steps(plan))
    states = training.character_state(chars, need)
    done = [training.meets(states[c]["levels"], need) for c in chars]
    return all(done) if scope == "all" else any(done)


def _character_progress(steps, state, info, names) -> dict:
    p = training.progress(steps, state, info)
    missing = [(s["skill_id"], s["level"]) for s in p["steps"] if s["status"] != "done"]
    return {
        "percent": p["percent"], "done": p["done"], "total": p["total"], "complete": p["complete"],
        "sp_left": p["sp_left"], "seconds_left": p["seconds_left"], "seconds_missing": p["seconds_missing"],
        "steps": [{"status": s["status"], "seconds": s["seconds"]} for s in p["steps"]],
        "missing_text": training.format_text(missing, names),
    }


def my_progress(user, plans: list[SkillPlan]) -> dict[int, dict | None]:
    """Each plan's best character of ``user``: ``{plan_id: {"character", "percent", "complete", "seconds_left"}}``."""
    chars = list(Character.objects.filter(user=user).only("pk", "name"))
    if not chars:
        return {p.pk: None for p in plans}
    wanted = {s for p in plans for s, _ in _steps(p)}
    states = training.character_state((c.pk for c in chars), wanted)
    info = training.skill_info(wanted)
    out = {}
    for plan in plans:
        best = None
        for c in chars:
            p = training.progress(_steps(plan), states[c.pk], info)
            if best is None or (p["percent"], -p["seconds_left"]) > (best["percent"], -best["seconds_left"]):
                best = {"character": c.name, "percent": p["percent"], "complete": p["complete"], "seconds_left": p["seconds_left"]}
        out[plan.pk] = best
    return out


def plan_brief(plan: SkillPlan, mine: dict | None = None) -> dict:
    return {
        "id": plan.pk,
        "name": plan.name,
        "description": plan.description,
        "category": plan.category,
        "shared": plan.shared,
        "owner": plan.owner.display_name if plan.owner_id else None,
        "skills": len({s for s, _ in plan.skills}),
        "steps": len(plan.skills),
        "updated_at": plan.updated_at.isoformat(),
        "me": mine,
    }


def named_steps(steps: list[tuple[int, int]], info=None) -> tuple[list[dict], int]:
    """Steps with names, groups and skill points, and the plan's total skill points."""
    info = info if info is not None else training.skill_info(s for s, _ in steps)
    types = {t.pk: t for t in ItemType.objects.filter(pk__in={s for s, _ in steps}).select_related("group")}
    out, total = [], 0
    for sid, level in steps:
        rank = info[sid].rank if sid in info else 1
        sp = training.sp_for_level(rank, level) - training.sp_for_level(rank, level - 1)
        total += sp
        t = types.get(sid)
        out.append({"skill_id": sid, "level": level, "name": t.name if t else f"Skill {sid}", "group": t.group.name if t else "",
                    "rank": rank, "sp": sp, "icon": type_icon_url(sid, 32)})
    return out, total


def plan_detail(plan: SkillPlan, user) -> dict:
    steps = _steps(plan)
    info = training.skill_info(s for s, _ in steps)
    named, total_sp = named_steps(steps, info)
    names = {s["skill_id"]: s["name"] for s in named}
    chars = list(Character.objects.filter(user=user).order_by("name"))
    states = training.character_state((c.pk for c in chars), info)
    characters = [{"id": c.pk, "name": c.name, "portrait": c.portrait, "synced": states[c.pk]["synced"],
                   **_character_progress(steps, states[c.pk], info, names)} for c in chars]
    characters.sort(key=lambda c: (-c["percent"], c["seconds_left"]))
    return {
        **plan_brief(plan),
        "steps_detail": named,
        "total_sp": total_sp,
        "text": training.format_text(steps, names),
        "characters": characters,
        "can_edit": can_edit(user, plan),
        "can_view_progress": plan.shared and can_view_progress(user),
        "created_by": plan.created_by.display_name if plan.created_by_id else None,
    }


def members_progress(plan: SkillPlan) -> list[dict]:
    """Every member's best character on a plan, closest to done first."""
    from conduit.access.services import site_members

    users = list(site_members().filter(characters__isnull=False).distinct().select_related("main_character"))
    chars = list(Character.objects.filter(user__in=users).values_list("pk", "name", "user_id"))
    steps = _steps(plan)
    info = training.skill_info(s for s, _ in steps)
    states = training.character_state((c for c, _, _ in chars), {s for s, _ in steps})
    best: dict[int, dict] = {}
    for cid, name, uid in chars:
        p = training.progress(steps, states[cid], info)
        row = {"character": name, "character_id": cid, "percent": p["percent"], "complete": p["complete"],
               "seconds_left": p["seconds_left"], "synced": states[cid]["synced"]}
        if uid not in best or (row["percent"], -row["seconds_left"]) > (best[uid]["percent"], -best[uid]["seconds_left"]):
            best[uid] = row
    out = []
    for u in users:
        row = best.get(u.pk)
        if row:
            out.append({"user_id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id, 64) if u.main_character_id else None,
                        **row})
    return sorted(out, key=lambda m: (not m["complete"], -m["percent"], m["seconds_left"], m["name"].lower()))


# --- lookups for the editor ----------------------------------------------------------------------------------------


def find_skills(q: str, limit: int = 25) -> list[dict]:
    q = q.strip()
    if not q:
        return []
    qs = ItemType.objects.filter(group__category_id=training.SKILL_CATEGORY, published=True, name__icontains=q).select_related("group")
    return [{"id": t.pk, "name": t.name, "group": t.group.name, "icon": type_icon_url(t.pk, 32)} for t in qs.order_by("name")[:limit]]


def find_types(q: str, limit: int = 25) -> list[dict]:
    """Ships, modules and other items that need skills."""
    q = q.strip()
    if len(q) < 2:
        return []
    qs = (ItemType.objects.filter(published=True, name__icontains=q).exclude(group__category_id=training.SKILL_CATEGORY)
          .exclude(required_skills=[]).select_related("group"))
    return [{"id": t.pk, "name": t.name, "group": t.group.name, "icon": type_icon_url(t.pk, 32)} for t in qs.order_by("name")[:limit]]


def search(request, q, limit):
    """Ctrl+K: skill plans the user can see."""
    rows = visible_plans(request.user).filter(name__icontains=q).order_by("name")[:limit]
    return {
        "key": "skillplans",
        "label": "Skill plans",
        "hits": [{"id": f"skillplan:{p.pk}", "title": p.name, "subtitle": "Shared plan" if p.shared else "My plan",
                  "icon": "graduation-cap", "url": f"/p/skillplans/{p.pk}"} for p in rows],
    }
