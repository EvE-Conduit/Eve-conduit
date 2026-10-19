"""The people: an alliance of three corporations and a friendly one outside it, about thirty members with their
alts, states, groups and the demo account itself."""

from datetime import timedelta

from django.contrib.auth.models import Group

from conduit.access.models import GroupProfile, GroupRequest, State
from conduit.accounts.models import Character, Token, User, UserPreferences
from conduit.eve.models import EveAlliance, EveCorporation, EveName
from conduit.sheet.models import Location, SyncStatus

from .. import state
from . import Ids, catalog

FIRST = (
    "Aria", "Kael", "Mira", "Dax", "Sora", "Talon", "Nyx", "Orrin", "Vesna", "Jarek", "Lyra", "Corvin", "Isel", "Brannoc",
    "Tamsin", "Rook", "Elara", "Varis", "Seren", "Hollis", "Kiri", "Maddox", "Wren", "Ilya", "Thessa", "Garrick", "Noor",
    "Fenn", "Calla", "Ostrin", "Yara", "Bastian", "Liora", "Quill", "Rhea", "Soren", "Taryn", "Ulric", "Vale", "Zephyr",
)
LAST = (
    "Valen", "Ashgrove", "Korhonen", "Starweaver", "Vex", "Halloran", "Draven", "Ostrander", "Kestrel", "Marr", "Solvane",
    "Thorne", "Ironwood", "Calder", "Nightingale", "Aurelian", "Brask", "Duskmere", "Fairwind", "Grimsby", "Holt", "Ivers",
    "Jansen", "Krayt", "Lindqvist", "Moreau", "Novak", "Okonkwo", "Pryce", "Quorra", "Rasmussen", "Sablewood", "Tarkanian",
)

ALLIANCE = ("Northern Lights Coalition", "NLC")
CORPORATIONS = (("Aurora Industries", "AURI"), ("Starfall Vanguard", "SFV"), ("Deep Void Logistics", "DVLOG"))
BLUE_ALLIANCE = ("Meridian Pact", "MRDN")
BLUE_CORPORATION = ("Crimson Meridian", "CRMR")
GUEST_CORPORATION = ("Lone Star Prospecting", "LSPRO")

STRUCTURES = (
    ("Perimeter - Aurora Forge", 30000144, 35825),
    ("Perimeter - Northern Lights Keepstar Market", 30000144, 35833),
    ("Hek - Deep Void Refinery", 30002053, 35835),
    ("Rens - Starfall Staging", 30002510, 35832),
)

GROUPS = (
    # name, description, color, join mode, hidden, auto
    ("Fleet Commanders", "Lead the alliance's fleets. Ask an FC lead to join.", "#f97316", "request", False, False),
    ("Industrialists", "Builders, miners and haulers. Everyone welcome.", "#22c55e", "open", False, False),
    ("Capital Pilots", "Everyone who can fly a carrier or dreadnought, kept up to date by rules.", "#a855f7", "closed", False, True),
    ("Recruiters", "Talk to new pilots and review applications.", "#38bdf8", "closed", False, False),
    ("Directors", "Corporation and alliance leadership.", "#ef4444", "closed", True, False),
    ("Logistics Wing", "Logi pilots for the main doctrine fleets.", "#14b8a6", "open", False, False),
)


def _names(demo, count):
    names = []  # a list, not a set: its order (and so who gets which name) mustn't depend on string hashing
    while len(names) < count:
        name = f"{demo.pick(FIRST)} {demo.pick(LAST)}"
        if name not in names:
            names.append(name)
    return names


def seed(demo):
    from conduit.esi.scopes import ALL_SCOPES
    from conduit.sheet import registry as sheet_registry

    alliance = EveAlliance.objects.create(id=Ids.ALLIANCE + 1, name=ALLIANCE[0], ticker=ALLIANCE[1])
    blue_alliance = EveAlliance.objects.create(id=Ids.ALLIANCE + 2, name=BLUE_ALLIANCE[0], ticker=BLUE_ALLIANCE[1])
    corporations = [
        EveCorporation.objects.create(id=Ids.CORPORATION + i + 1, name=name, ticker=ticker, alliance=alliance)
        for i, (name, ticker) in enumerate(CORPORATIONS)
    ]
    blue = EveCorporation.objects.create(id=Ids.CORPORATION + 10, name=BLUE_CORPORATION[0], ticker=BLUE_CORPORATION[1],
                                         alliance=blue_alliance, member_count=212)
    guest_corp = EveCorporation.objects.create(id=Ids.CORPORATION + 11, name=GUEST_CORPORATION[0], ticker=GUEST_CORPORATION[1],
                                               member_count=4)
    demo.alliance, demo.corporations, demo.blue_corporation = alliance, corporations, blue

    member = State.objects.create(name="Member", priority=100, color="#22d3ee", description="Pilots of the alliance")
    member.member_alliances.add(alliance)
    blue_state = State.objects.create(name="Blue", priority=50, color="#3b82f6", description="Allies in the Meridian Pact")
    blue_state.member_alliances.add(blue_alliance)
    guest = State.objects.create(name="Guest", priority=0, public=True, description="Anyone who signs in")
    demo.states = {"member": member, "blue": blue_state, "guest": guest}

    # Who's where: (corporation, number of people). The demo account comes first, in the main corporation.
    plan = [(corporations[0], 14), (corporations[1], 9), (corporations[2], 6), (blue, 3), (guest_corp, 2)]
    names = _names(demo, 80)
    scopes = " ".join(sorted(set(ALL_SCOPES)))
    next_char = Ids.CHARACTER
    next_user = 1_000_000
    for corp, people in plan:
        for n in range(people):
            next_user += 1
            is_admin = next_user == 1_000_001
            user = User(id=next_user, username=state.USERNAME if is_admin else f"char_{next_char + 1}",
                        is_superuser=is_admin, is_staff=is_admin, date_joined=demo.recent(400),
                        last_login=demo.recent(1 if is_admin else 20))
            if is_admin:
                user.set_password(state.PASSWORD)
            else:
                user.set_unusable_password()
            user.save()
            alts = 3 if is_admin else demo.rng.choices([1, 2, 3, 4], weights=[4, 4, 2, 1])[0]
            chars = []
            for a in range(alts):
                next_char += 1
                # Alts mostly sit in the same corporation; some park in the main one.
                alt_corp = corp if a == 0 or demo.chance(0.7) else corporations[0] if corp.alliance_id == alliance.pk else corp
                chars.append(Character.objects.create(
                    id=next_char, name=names.pop(), owner_hash=f"demo-{next_char}", user=user, corporation=alt_corp,
                    alliance=alt_corp.alliance, added_at=user.date_joined + timedelta(days=a * demo.rng.uniform(1, 60)),
                    affiliation_updated_at=demo.recent(0.2),
                ))
            user.main_character = chars[0]
            user.save(update_fields=["main_character"])
            demo.users.append(user)
            demo.characters.extend(chars)
    demo.admin = demo.users[0]
    demo.characters.sort(key=lambda c: (c.pk != c.user.main_character_id, c.pk))

    for corp in corporations:
        corp.member_count = sum(1 for c in demo.characters if c.corporation_id == corp.pk)
        corp.save(update_fields=["member_count"])
    EveName.objects.bulk_create(
        [EveName(id=c.pk, name=c.name, category="character") for c in demo.characters]
        + [EveName(id=c.pk, name=c.name, category="corporation") for c in (*corporations, blue, guest_corp)]
        + [EveName(id=a.pk, name=a.name, category="alliance") for a in (alliance, blue_alliance)]
    )

    # Tokens with every scope, so every tab of the sheet has something to show. Two have lapsed, for Compliance.
    lapsed = {c.pk for c in demo.sample(demo.characters[len(demo.users):], 2)}
    Token.objects.bulk_create([
        Token(character=c, access_token="demo", refresh_token="demo", expires_at=demo.ahead(minutes=20), scopes=scopes,
              valid=c.pk not in lapsed)
        for c in demo.characters
    ])
    UserPreferences.objects.bulk_create([UserPreferences(user=u) for u in demo.users])

    from conduit.access.services import recompute_user_state

    for user in demo.users:
        recompute_user_state(user)

    sections = list(sheet_registry.synced())
    SyncStatus.objects.bulk_create([
        SyncStatus(character=c, section=s, result="ok", last_attempt=demo.recent(0.1), last_success=demo.recent(0.1),
                   next_due=demo.ahead(hours=1))
        for c in demo.characters for s in sections
    ])

    Location.objects.bulk_create(
        [Location(id=i, kind="station", name=n, solar_system_id=s, type_id=1529) for i, (n, s) in catalog.STATIONS.items()]
        + [Location(id=i, kind="solar_system", name=n, solar_system_id=i) for i, (n, *_) in catalog.SYSTEMS.items()],
        ignore_conflicts=True,
    )
    for i, (name, system_id, type_id) in enumerate(STRUCTURES):
        sid = Ids.STRUCTURE + i + 1
        Location.objects.create(id=sid, kind="structure", name=name, solar_system_id=system_id, type_id=type_id,
                                owner_id=corporations[0].pk if i < 2 else corporations[2 if i == 2 else 1].pk)
        demo.structures.append({"id": sid, "name": name, "system_id": system_id, "type_id": type_id})

    _groups(demo)


def _groups(demo):
    members = [u for u in demo.users if u.state_id == demo.states["member"].pk]
    for name, description, color, join_mode, hidden, auto in GROUPS:
        group = Group.objects.create(name=name)
        profile = GroupProfile.objects.create(group=group, description=description, color=color, join_mode=join_mode,
                                              hidden=hidden, auto=auto, last_evaluated=demo.recent(0.1) if auto else None)
        profile.allowed_states.add(demo.states["member"])
        if auto:
            # Any character with Capital Ships (sheet_skills gives them to the capital pilots).
            profile.rules = {"match": "all", "rules": [{"type": "skill", "params": {"skill": 20533, "level": 1, "scope": "any"}}]}
            profile.save(update_fields=["rules"])
        picked = [demo.admin] if name in ("Directors", "Fleet Commanders") else []
        picked += demo.sample([u for u in members if u not in picked], {"Directors": 3}.get(name, demo.rng.randint(4, 10)))
        group.user_set.add(*picked)
        if name in ("Fleet Commanders", "Recruiters", "Industrialists"):
            profile.leaders.add(demo.admin if name == "Fleet Commanders" else picked[0])
        demo.groups[name] = group

    fc = demo.groups["Fleet Commanders"]
    outsiders = [u for u in members if not u.groups.filter(pk=fc.pk).exists()]
    messages = ("Been flying logi for a year, ready to lead small gangs.", "Ran the Sunday roams in my old corp.",
                "Would like to start FCing home defence fleets.")
    for user, message in zip(demo.sample(outsiders, 3), messages):
        GroupRequest.objects.create(user=user, group=fc, message=message, created_at=demo.recent(4))
