"""Group rule: attended at least N fleets in the last D days (optionally only some fleet types)."""

from conduit.access.rules import Param, register_rule


def _types(p) -> list[str]:
    return [t.strip() for t in (p.get("types") or "").split(",") if t.strip()]


def _attended(user, p):
    from .services import fleets_attended

    return fleets_attended(user, p["days"], _types(p) or None, p.get("min_pilots") or 1) >= p["count"]


def _explain(p):
    types = _types(p)
    kinds = f" {' / '.join(types)}" if types else ""
    size = f" of {p['min_pilots']}+ pilots" if (p.get("min_pilots") or 1) > 1 else ""
    return f"Flew in at least {p['count']}{kinds} fleet{'s' if p['count'] != 1 else ''}{size} (FATs) in the last {p['days']} days"


register_rule(
    "fleets_attended", "Fleet attendance (FATs)", _attended, plugin="fleets", category="Fleets",
    params=(
        Param("count", "int", "At least (fleets)", default=1, min=1),
        Param("days", "int", "In the last (days)", default=30, min=1, max=3650),
        Param("types", "str", "Only these fleet types", default="", help="Comma separated, e.g. CTA, Stratop. Empty counts every fleet."),
        Param("min_pilots", "int", "Only fleets with at least (pilots)", default=1, min=1, max=1000,
              help="Fleets with fewer pilots don't count, so nobody can pass with small fleets they ran for themselves."),
    ),
    description="Counts fleets the member flew in with any of their characters (two characters in one fleet count once). "
                "FATs someone added by hand for their own characters don't count.",
    explain=_explain,
)
