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
# FATs nobody else vouches for don't pay: ones a member added by hand for their own characters (as the Fleets
# plugin's attendance counts), and the FC's or creator's own characters unless the in-game fleet tracking saw them.
@bus.on("fleets.ended")
def fleet(event):
    s = _settings()
    fleet_id = event.payload.get("fleet_id")
    if not (s and s.fleet_points and fleet_id):
        return
    try:
        from conduit_fleets.models import Fat, Fleet
    except ImportError:
        return
    from conduit.accounts.models import Character

    from .services import award

    runners = set(Fleet.objects.filter(pk=fleet_id).values_list("fc_id", "created_by_id").first() or ()) - {None}
    fats = list(Fat.objects.filter(fleet_id=fleet_id).values_list("character_id", "via", "added_by_id"))
    owner = dict(Character.objects.filter(pk__in={cid for cid, _, _ in fats}, user__isnull=False).values_list("pk", "user_id"))
    users = set()
    for cid, via, added_by in fats:
        user_id = owner.get(cid)
        if user_id is None:
            continue
        if via == Fat.Via.MANUAL and added_by == user_id:
            continue  # added by hand for their own character
        if user_id in runners and via != Fat.Via.ESI:
            continue  # the FC's own characters, by hand or through the fleet's own link
        users.add(user_id)
    users = sorted(users)
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


# Emitted by the Industry Projects plugin, which sets the points (at most MAX_POINTS for one delivery).
@bus.on("projects.contribution_delivered")
def project(event):
    p = event.payload
    s = _settings()
    try:
        points = int(p.get("points") or 0)
    except (TypeError, ValueError, OverflowError):
        return
    if s and s.projects_enabled and points > 0 and p.get("user_id") and p.get("contribution_id"):
        from .services import MAX_POINTS, award

        award(p["user_id"], min(points, MAX_POINTS), f"Delivered to {p.get('project') or 'an industry project'}", "projects",
              f"projects:{p['contribution_id']}")
