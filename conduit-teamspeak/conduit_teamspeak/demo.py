"""Example data for demo mode (Plugin.demo_data): a made-up TeamSpeak server (addresses that can't resolve, no
ServerQuery password), its server groups and mappings, members' linked identities and a couple of pending links.
Nothing here reaches a real server: the demo never calls out."""

import string
from datetime import timedelta

from .models import GroupMapping, TeamSpeakSettings, TeamSpeakUser

REGISTERED = 7
SERVER_GROUPS = [
    {"sgid": 6, "name": "Server Admin"}, {"sgid": REGISTERED, "name": "Registered"}, {"sgid": 9, "name": "Member"},
    {"sgid": 10, "name": "Blue"}, {"sgid": 11, "name": "FC"}, {"sgid": 12, "name": "Director"}, {"sgid": 13, "name": "Logi"},
    {"sgid": 14, "name": "Capitals"}, {"sgid": 8, "name": "Guest"},
]
STATE_GROUPS = {"member": 9, "blue": 10}
GROUP_GROUPS = {"Fleet Commanders": 11, "Directors": 12, "Logistics Wing": 13, "Capital Pilots": 14}
B64 = string.ascii_letters + string.digits + "+/"


def seed(demo):
    names = {g["sgid"]: g["name"] for g in SERVER_GROUPS}
    s, _ = TeamSpeakSettings.objects.update_or_create(pk=1, defaults={
        # The ServerQuery password is a secret, so it stays empty (the admin page shows it as not set).
        "query_host": "ts-query.example.invalid", "query_port": 10011, "query_user": "conduit_demo", "query_password": "",
        "public_host": "voice.example.invalid", "public_port": 9987, "server_name": "Alliance TeamSpeak (demo)",
        "registered_sgid": REGISTERED, "server_groups": sorted(SERVER_GROUPS, key=lambda g: g["name"].lower()),
        "virtual_server_name": "Northern Lights Comms", "server_version": "3.13.7 Linux",
        "checked_at": demo.ago(hours=3), "last_full_sync": demo.ago(hours=2),
    })
    mappings = [GroupMapping(state=demo.states[k], sgid=v, sg_name=names[v]) for k, v in STATE_GROUPS.items() if k in demo.states]
    mappings += [GroupMapping(group=demo.groups[k], sgid=v, sg_name=names[v]) for k, v in GROUP_GROUPS.items() if k in demo.groups]
    GroupMapping.objects.bulk_create(mappings)

    by_state = {demo.states[k].pk: v for k, v in STATE_GROUPS.items() if k in demo.states}
    by_group = {demo.groups[k].pk: v for k, v in GROUP_GROUPS.items() if k in demo.groups}
    with_access = [u for u in demo.users if u.state_id in by_state]
    others = demo.sample([u for u in with_access if u != demo.admin], int(len(with_access) * 0.7))
    pending = others[-2:]
    linked = [demo.admin] + others[:-2]
    broken = demo.pick(linked[1:]) if len(linked) > 1 else None

    accounts, stamps, cldbid = [], [], 100
    for user in linked:
        cldbid += demo.rng.randint(1, 4)  # ids of identities that came and went sit in between
        char = user.main_character
        group_ids = set(user.groups.values_list("pk", flat=True))
        groups = sorted({by_state[user.state_id]} | {v for k, v in by_group.items() if k in group_ids})
        created = max(user.date_joined, demo.ago(days=300)) + timedelta(days=demo.rng.uniform(0, 5))
        accounts.append(TeamSpeakUser(
            user=user, cldbid=cldbid, uid="".join(demo.pick(B64) for _ in range(27)) + "=",
            nickname=f"[{char.corporation.ticker}] {char.name}", verify_code="", verified_at=created,
            synced_at=demo.ago(hours=2), groups=groups, last_connected_at=demo.recent(14) if demo.chance(0.85) else None,
            sync_error="The server says this identity is in a group the site doesn't know about" if user == broken else "",
        ))
        stamps.append(created)
    for user in pending:
        accounts.append(TeamSpeakUser(
            user=user, privilege_key="demo" + "".join(demo.pick(B64[:62]) for _ in range(36)),
            verify_code="".join(demo.pick(string.hexdigits.lower()[:16]) for _ in range(32)),
        ))
        stamps.append(demo.ago(hours=demo.rng.uniform(1, 40)))
    made = TeamSpeakUser.objects.bulk_create(accounts)
    for acct, created in zip(made, stamps):
        TeamSpeakUser.objects.filter(pk=acct.pk).update(created_at=created)
