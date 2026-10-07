"""Group rules: where a member is in the mentoring program, and whether they're an active mentor."""

from conduit.access.rules import Param, register_rule

STATUSES = (("active", "being mentored"), ("waiting", "waiting for a mentor"), ("graduated", "graduated"))


def _mentee(user, p):
    from conduit_mentors.models import Mentorship

    return Mentorship.objects.filter(mentee=user, status=p["status"]).exists()


def _mentor(user, p):
    from conduit_mentors.services import is_active_mentor

    return is_active_mentor(user)


register_rule(
    "mentors_mentee", "Mentoring status", _mentee, plugin="mentors", category="Mentoring",
    params=(Param("status", "choice", "Is", choices=STATUSES, default="active"),),
    description="Where the member is in the mentoring program, e.g. for a New bro role while they're being mentored.",
    explain=lambda p: f"Is {dict(STATUSES).get(p['status'], p['status'])} in the mentoring program",
)
register_rule(
    "mentors_is_mentor", "Is an active mentor", _mentor, plugin="mentors", category="Mentoring",
    description="Has the mentor permission and their mentor profile isn't paused.",
    explain=lambda p: "Is an active mentor",
)
