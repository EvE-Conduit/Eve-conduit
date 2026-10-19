"""Example Discord links for demo mode (see conduit.demo.seed): role mappings and most members' linked accounts.

No application, bot token or real server: the ids are made up (all zeros and a counter) and the settings' secrets
stay empty. ``DiscordSettings.configured`` treats the demo as set up, so the pages show; the demo is read-only, so
nothing ever reaches Discord."""

from .models import DiscordAccount, DiscordSettings, RoleMapping
from .services import nickname_for

ROLES = {
    # group or state -> Discord role name
    "member": "Member",
    "blue": "Ally",
    "Fleet Commanders": "FC",
    "Industrialists": "Industry",
    "Capital Pilots": "Capitals",
    "Recruiters": "Recruiter",
    "Directors": "Leadership",
    "Logistics Wing": "Logi",
}
ERRORS = (
    "Not on the server: join it again from the Discord page",
    "The bot's role is below the Leadership role, so it can't give it",
)


def _snowflake(n: int) -> str:
    """Obviously not a real Discord id."""
    return f"{n:018d}"


def seed(demo):
    s = DiscordSettings.load()
    s.guild_name = "Northern Lights Coalition (example server)"
    s.nickname_format = "[{corp_ticker}] {character}"
    s.last_full_sync = demo.ago(hours=demo.rng.uniform(1, 5))
    s.save()

    mappings = []
    for n, (target, role) in enumerate(ROLES.items(), start=1):
        state = demo.states.get(target)
        mappings.append(RoleMapping(state=state, group=None if state else demo.groups[target], role_id=_snowflake(n), role_name=role))
    RoleMapping.objects.bulk_create(mappings)

    # Everyone but a few has linked; one has left the server and one sync hit a role the bot can't give.
    linked = [demo.admin] + [u for u in demo.users[1:] if demo.chance(0.8)]
    trouble = demo.sample(linked[1:], 2)
    accounts = []
    for n, user in enumerate(linked, start=1):
        group_ids = set(user.groups.values_list("pk", flat=True))
        roles = [m.role_id for m in mappings if (m.group_id in group_ids) or (m.state_id and m.state_id == user.state_id)]
        name = user.main_character.name
        error = ERRORS[trouble.index(user)] if user in trouble else ""
        username = name.lower().replace(" ", "_") + demo.pick(("", "", "_eve", str(demo.rng.randint(1, 99))))
        accounts.append(DiscordAccount(
            user=user, discord_id=_snowflake(1000 + n), username=username,
            synced_at=demo.recent(0.25), sync_error=error, roles=[] if error.startswith("Not on") else roles,
            nickname=nickname_for(user, s.nickname_format) or "", on_server=not error.startswith("Not on"),
        ))
    DiscordAccount.objects.bulk_create(accounts)
    for acct in accounts:
        acct.linked_at = max(acct.user.date_joined, demo.recent(300))
    DiscordAccount.objects.bulk_update(accounts, ["linked_at"])
