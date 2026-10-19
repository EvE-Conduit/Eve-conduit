"""Example data for demo mode (Plugin.demo_data): a made-up Mumble server (an address that can't resolve), group
mappings, accounts for most members and a few temporary access links with their guests. Nothing here reaches a real
server: the demo never calls out, and every password is unusable."""

from datetime import timedelta

from django.contrib.auth.hashers import make_password

from .models import GroupMapping, MumbleSettings, MumbleUser, TempLink, TempUser
from .services import sanitize_username

STATE_GROUPS = {"member": "member", "blue": "blue"}
GROUP_GROUPS = {"Fleet Commanders": "fc", "Directors": "director", "Logistics Wing": "logi", "Capital Pilots": "capitals",
                "Recruiters": "recruiter"}
# label, created (hours ago), lasts (hours), max uses, groups, revoked, guests
LINKS = (
    ("Diplo meeting with Meridian Pact", 3, 24, 5, ["temp", "diplo"], False, ("Sela Varn", "Odo Kestrin")),
    ("Joint op: Hek timer", 30, 12, 0, ["temp"], False, ("Garrow Pike", "Lune Marsh", "Tibbet Crane", "Ash Ravel")),
    ("Recruitment chat", 50, 48, 1, ["temp"], False, ("Penny Starlow",)),
    ("Old link, posted in the wrong channel", 80, 48, 0, ["temp"], True, ("Quin Darrow",)),
)


def seed(demo):
    s, _ = MumbleSettings.objects.update_or_create(pk=1, defaults={
        "host": "mumble.example.invalid", "port": 64738, "server_name": "Alliance comms (demo)",
        "username_format": "{character}", "display_format": "[{corp_ticker}] {character}",
        "authenticator_seen_at": demo.ago(minutes=4), "authenticator_version": "1.0.0",
    })
    mappings = [GroupMapping(state=demo.states[k], mumble_group=v) for k, v in STATE_GROUPS.items() if k in demo.states]
    mappings += [GroupMapping(group=demo.groups[k], mumble_group=v) for k, v in GROUP_GROUPS.items() if k in demo.groups]
    GroupMapping.objects.bulk_create(mappings)

    by_state = {demo.states[k].pk: v for k, v in STATE_GROUPS.items() if k in demo.states}
    by_group = {demo.groups[k].pk: v for k, v in GROUP_GROUPS.items() if k in demo.groups}
    unusable = make_password(None)  # nobody can log in with it; the demo has no Mumble server anyway
    with_access = [u for u in demo.users if u.state_id in by_state]
    accounts, stamps = [], []
    for user in [demo.admin] + demo.sample([u for u in with_access if u != demo.admin], int(len(with_access) * 0.75)):
        char = user.main_character
        group_ids = set(user.groups.values_list("pk", flat=True))
        groups = sorted({by_state[user.state_id]} | {v for k, v in by_group.items() if k in group_ids})
        created = max(user.date_joined, demo.ago(days=300)) + timedelta(days=demo.rng.uniform(0, 5))
        accounts.append(MumbleUser(
            user=user, username=sanitize_username(char.name), display_name=f"[{char.corporation.ticker}] {char.name}",
            password_hash=unusable, cert_hash="".join(demo.pick("0123456789abcdef") for _ in range(40)) if demo.chance(0.7) else "",
            password_changed_at=created, last_login_at=demo.recent(10) if demo.chance(0.85) else None, groups=groups,
        ))
        stamps.append(created)
    made = MumbleUser.objects.bulk_create(accounts)
    for acct, created in zip(made, stamps):
        MumbleUser.objects.filter(pk=acct.pk).update(created_at=created)

    makers = [demo.admin, *demo.sample(with_access[1:], 2)]
    for label, hours_ago, lasts, max_uses, groups, revoked, guests in LINKS:
        created = demo.ago(hours=hours_ago)
        link = TempLink.objects.create(
            token="demo" + "".join(demo.pick("abcdefghijkmnpqrstuvwxyz23456789") for _ in range(28)), label=label,
            created_by=demo.pick(makers), expires_at=created + timedelta(hours=lasts), max_uses=max_uses, groups=groups,
            revoked_at=created + timedelta(hours=2) if revoked else None,
        )
        TempLink.objects.filter(pk=link.pk).update(created_at=created)
        temps = TempUser.objects.bulk_create([
            TempUser(link=link, username=sanitize_username(f"temp_{name}"), display_name=s.temp_display_format.format(name=name),
                     password_hash=unusable, created_ip=f"192.0.2.{demo.rng.randint(1, 254)}", expires_at=link.expires_at,
                     last_login_at=created + timedelta(minutes=demo.rng.uniform(1, 90)),
                     revoked_at=demo.ago(hours=hours_ago - 1) if not revoked and i == 3 else None)
            for i, name in enumerate(guests)
        ])
        TempUser.objects.filter(pk__in=[t.pk for t in temps]).update(created_at=created + timedelta(minutes=5))
