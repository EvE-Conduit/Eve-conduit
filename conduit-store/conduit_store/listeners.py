"""Points from what happens in other plugins. Each one is paid once, whatever repeats the event."""

from conduit.events import bus


def _settings():
    from conduit.plugins.services import is_enabled

    from .models import StoreSettings

    return StoreSettings.load() if is_enabled("store") else None


# Emitted by the Recruitment plugin, when it's installed.
@bus.on("recruit.application_decided")
def referral(event):
    p = event.payload
    s = _settings()
    if s and s.referral_points and p.get("accepted") and p.get("referrer_id"):
        from .services import award

        award(p["referrer_id"], s.referral_points, f"Referred {p.get('user') or 'a recruit'}, who was accepted", "referral",
              f"recruit:{p.get('application_id')}")


# Emitted by the Fleets plugin. Everyone with a FAT gets the points once, however many characters they brought.
@bus.on("fleets.ended")
def fleet(event):
    s = _settings()
    fleet_id = event.payload.get("fleet_id")
    if not (s and s.fleet_points and fleet_id):
        return
    try:
        from conduit_fleets.models import Fat
    except ImportError:
        return
    from conduit.accounts.models import Character

    from .services import award

    chars = Fat.objects.filter(fleet_id=fleet_id).values_list("character_id", flat=True)
    users = sorted(set(Character.objects.filter(pk__in=chars).values_list("user_id", flat=True)))
    name = event.payload.get("fleet") or "a fleet"
    for user_id in users:
        award(user_id, s.fleet_points, f"Flew in {name}", "fleet", f"fleet:{fleet_id}:{user_id}")


# Emitted by the Mentoring plugin.
@bus.on("mentors.graduated")
def mentor(event):
    p = event.payload
    s = _settings()
    if s and s.mentor_points and p.get("mentor_id"):
        from .services import award

        award(p["mentor_id"], s.mentor_points, f"Mentored {p.get('user') or 'a new member'} to graduation", "mentor",
              f"mentor:{p.get('mentorship_id')}")


# Emitted by the Industry Projects plugin, which sets the points.
@bus.on("projects.contribution_delivered")
def project(event):
    p = event.payload
    s = _settings()
    try:
        points = int(p.get("points") or 0)
    except (TypeError, ValueError):
        return
    if s and s.projects_enabled and points > 0 and p.get("user_id") and p.get("contribution_id"):
        from .services import award

        award(p["user_id"], points, f"Delivered to {p.get('project') or 'an industry project'}", "projects",
              f"projects:{p['contribution_id']}")
