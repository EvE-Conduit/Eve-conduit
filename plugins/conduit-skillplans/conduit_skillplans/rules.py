"""Group rule: a member's character(s) have trained every skill of a shared skill plan."""

from conduit.access.rules import SCOPE_CHOICES, SCOPE_WORDS, Param, register_rule


def _plans():
    from .models import SkillPlan

    return [(str(pk), name) for pk, name in SkillPlan.objects.filter(shared=True).order_by("name").values_list("pk", "name")]


def _complete(user, p):
    from .services import plan_complete

    return plan_complete(user, int(p["plan"]), p["scope"])


def _explain(p):
    from .models import SkillPlan

    name = SkillPlan.objects.filter(pk=int(p["plan"])).values_list("name", flat=True).first() or f"#{p['plan']} (deleted)"
    return f"Completed the skill plan “{name}” {SCOPE_WORDS[p['scope']]}"


register_rule(
    "skillplan_complete", "Completed skill plan", _complete, plugin="skillplans", category="Character",
    params=(
        Param("plan", "choice", "Skill plan", choices=_plans, help="Shared skill plans only."),
        Param("scope", "choice", "On", choices=SCOPE_CHOICES, default="any"),
    ),
    description="Every skill of the plan is trained to its level, using the synced skills of the character sheet.",
    explain=_explain,
)
