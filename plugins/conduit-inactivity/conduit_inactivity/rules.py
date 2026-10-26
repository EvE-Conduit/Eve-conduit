"""Group rules: active within N days (or on leave), and on leave of absence."""

from conduit.access.rules import Param, register_rule


def _active(user, p):
    from .services import active_within

    return active_within(user, p["days"])


def _on_leave(user, p):
    from .services import current_leave

    return current_leave(user) is not None


register_rule(
    "inactivity_active", "Active recently", _active, plugin="inactivity", category="HR",
    params=(Param("days", "int", "Active in the last (days)", default=30, min=1, max=3650),),
    description="Passes when the member signed in, played or flew in a fleet (the signals switched on under Inactivity → "
                "Settings) in the last days, or is on an approved leave of absence. Checked once a day.",
    explain=lambda p: f"Active in the last {p['days']} day{'s' if p['days'] != 1 else ''}, or on leave",
)

register_rule(
    "inactivity_on_leave", "On leave of absence", _on_leave, plugin="inactivity", category="HR",
    description="Passes while the member has an approved leave of absence running today.",
    explain=lambda p: "On leave of absence",
)
