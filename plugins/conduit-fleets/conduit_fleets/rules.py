"""Group rule: attended at least N fleets in the last D days (optionally only some fleet types)."""

from conduit.access.rules import Param, register_rule


def _types(p) -> list[str]:
    return [t.strip() for t in (p.get("types") or "").split(",") if t.strip()]


def _attended(user, p):
    from .services import fleets_attended

    return fleets_attended(user, p["days"], _types(p) or None) >= p["count"]


def _explain(p):
    types = _types(p)
    kinds = f" {' / '.join(types)}" if types else ""
    return f"Flew in at least {p['count']}{kinds} fleet{'s' if p['count'] != 1 else ''} (FATs) in the last {p['days']} days"


register_rule(
    "fleets_attended", "Fleet attendance (FATs)", _attended, plugin="fleets", category="Fleets",
    params=(
        Param("count", "int", "At least (fleets)", default=1, min=1),
        Param("days", "int", "In the last (days)", default=30, min=1, max=3650),
        Param("types", "str", "Only these fleet types", default="", help="Comma separated, e.g. CTA, Stratop. Empty counts every fleet."),
    ),
    description="Counts fleets the member flew in with any of their characters (two characters in one fleet count once).",
    explain=_explain,
)
