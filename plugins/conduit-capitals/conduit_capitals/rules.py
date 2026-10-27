"""Group rules: can fly a capital of a class, and owns one."""

from conduit.access.rules import Param, register_rule

from .classes import CHOICES, label

FLY_SCOPES = (("main", "main character"), ("any", "any character"), ("all", "every character"))
OWN_SCOPES = FLY_SCOPES[:2]
SCOPE_WORDS = {"main": "on their main", "any": "on any character", "all": "on every character"}


def _can_fly(user, p):
    from .services import can_fly_class

    return can_fly_class(user, p["class"], p["scope"])


def _owns(user, p):
    from .services import owns_class

    return owns_class(user, p["class"], p["count"], p["scope"], p["skip_unavailable"])


def _explain_owns(p):
    what = label(p["class"])
    n = f"{p['count']:,} × {what}" if p["count"] != 1 else f"a {what}" if p["class"] != "any" else what
    extra = " (not counting hulls marked not available)" if p["skip_unavailable"] else ""
    return f"Owns {n} {SCOPE_WORDS[p['scope']]}{extra}"


register_rule(
    "capitals_can_fly", "Can fly a capital", _can_fly, plugin="capitals", category="Capitals",
    params=(
        Param("class", "choice", "Class", choices=CHOICES, default="any"),
        Param("scope", "choice", "On", choices=FLY_SCOPES, default="any"),
    ),
    description="Uses the synced skills of the character sheet against the required skills of every hull of the class "
                "(from the static data). Characters without synced skills can't fly anything.",
    explain=lambda p: f"Can fly {'a ' if p['class'] != 'any' else ''}{label(p['class'])} {SCOPE_WORDS[p['scope']]}",
)

register_rule(
    "capitals_owns", "Owns a capital", _owns, plugin="capitals", category="Capitals",
    params=(
        Param("class", "choice", "Class", choices=CHOICES, default="any"),
        Param("count", "int", "At least", default=1, min=1, max=1000),
        Param("scope", "choice", "On", choices=OWN_SCOPES, default="any"),
        Param("skip_unavailable", "bool", "Leave out hulls marked not available for ops", default=False),
    ),
    description="Uses the synced assets of the character sheet, assembled or packaged, wherever they are. Characters "
                "without the assets scope count as owning nothing.",
    explain=_explain_owns,
)
