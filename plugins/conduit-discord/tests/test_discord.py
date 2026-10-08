"""Discord: linking, role and nickname sync, losing access, the server check, and settings. Discord itself is faked."""

import json
import re

import httpx
import pytest
from django.contrib.auth.models import Group, Permission
from django.core.cache import cache

from conduit.access.groups import add_member, remove_member
from conduit.plugins.services import set_enabled, sync_installed
from conduit_discord import discord_api, services
from conduit_discord.models import DiscordAccount, DiscordSettings, RoleMapping
from tests.conftest import make_user

GUILD, BOT, ME = "100000000000000001", "200000000000000002", "300000000000000003"
R_CAPS, R_MEMBER, R_HAND, R_BOT, R_HIGH = "400000000000000001", "400000000000000002", "400000000000000003", "400000000000000004", "400000000000000005"


class FakeDiscord:
    """Just enough of Discord's API, kept in memory."""

    def __init__(self):
        self.members: dict[str, dict] = {BOT: {"roles": [R_BOT], "nick": None}}
        self.calls: list[tuple[str, str]] = []
        self.rate_limit_next = False
        self.roles = [
            {"id": GUILD, "name": "@everyone", "position": 0, "permissions": "0", "color": 0},
            {"id": R_MEMBER, "name": "Member", "position": 1, "permissions": "0", "color": 0},
            {"id": R_CAPS, "name": "Capitals", "position": 2, "permissions": "0", "color": 0x22D3EE},
            {"id": R_HAND, "name": "Given by hand", "position": 3, "permissions": "0", "color": 0},
            {"id": R_BOT, "name": "Conduit", "position": 5, "permissions": str(discord_api.BOT_PERMISSIONS), "color": 0, "managed": True},
            {"id": R_HIGH, "name": "Directors", "position": 9, "permissions": "8", "color": 0},
        ]

    def __call__(self, request: httpx.Request) -> httpx.Response:
        path, method = request.url.path.removeprefix("/api/v10"), request.method
        self.calls.append((method, path))
        if self.rate_limit_next:
            self.rate_limit_next = False
            return httpx.Response(429, json={"retry_after": 0.01})
        auth = request.headers.get("authorization", "")
        if path == "/oauth2/token":
            assert b"code=good-code" in request.content
            return httpx.Response(200, json={"access_token": "user-token"})
        if path == "/users/@me":
            if auth == "Bearer user-token":
                return httpx.Response(200, json={"id": ME, "username": "pilot", "global_name": "Pilot", "avatar": None})
            return httpx.Response(200, json={"id": BOT, "username": "Conduit"})
        assert auth == "Bot bot-token", auth
        if path == f"/guilds/{GUILD}":
            return httpx.Response(200, json={"id": GUILD, "name": "Test Alliance", "icon": None})
        if path == f"/guilds/{GUILD}/roles":
            return httpx.Response(200, json=self.roles)
        m = re.fullmatch(rf"/guilds/{GUILD}/members/(\d+)", path)
        if m:
            uid = m.group(1)
            body = json.loads(request.content) if request.content else {}
            if method == "GET":
                return httpx.Response(200, json=self.members[uid]) if uid in self.members else httpx.Response(404, json={"message": "Unknown Member", "code": 10007})
            if method == "PUT":
                if uid in self.members:
                    return httpx.Response(204)
                assert body["access_token"] == "user-token"
                self.members[uid] = {"roles": body.get("roles", []), "nick": body.get("nick")}
                return httpx.Response(201, json=self.members[uid])
            if method == "PATCH":
                self.members[uid].update(body)
                return httpx.Response(200, json=self.members[uid])
            if method == "DELETE":
                self.members.pop(uid, None)
                return httpx.Response(204)
        return httpx.Response(404, json={"message": "Unknown route"})


@pytest.fixture
def discord(monkeypatch):
    fake = FakeDiscord()
    monkeypatch.setattr(discord_api, "_client", lambda: httpx.Client(transport=httpx.MockTransport(fake)))
    return fake


@pytest.fixture
def setup(db, corp, discord):
    sync_installed()
    set_enabled("discord", True)
    DiscordSettings.objects.update_or_create(pk=1, defaults={"client_id": "500000000000000005", "client_secret": "secret", "bot_token": "bot-token", "guild_id": GUILD})
    caps = Group.objects.create(name="Capitals")
    RoleMapping.objects.create(group=caps, role_id=R_CAPS, role_name="Capitals")
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    pilot.user_permissions.add(Permission.objects.get(codename="access_discord"))
    return pilot, caps


def link(api_client, pilot):
    api_client.force_login(pilot)
    url = api_client.call("post", "/api/p/discord/link").json()["url"]
    state = re.search(r"state=([^&]+)", url).group(1)
    assert "scope=identify+guilds.join" in url and "redirect_uri=" in url
    return api_client.call("post", "/api/p/discord/link/finish", {"code": "good-code", "state": state})


def test_linking_joins_the_server_with_roles_and_nickname(setup, discord, api_client):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    resp = link(api_client, pilot)
    assert resp.status_code == 200, resp.content
    body = resp.json()
    assert body["account"]["username"] == "Pilot" and body["roles"] == ["Capitals"]
    assert discord.members[ME] == {"roles": [R_CAPS], "nick": "[TCORP] Pilot One"}
    assert DiscordAccount.objects.get(user=pilot).discord_id == ME


def test_state_from_another_session_is_refused(setup, api_client):
    pilot, _ = setup
    api_client.force_login(pilot)
    api_client.call("post", "/api/p/discord/link")
    resp = api_client.call("post", "/api/p/discord/link/finish", {"code": "good-code", "state": "forged"})
    assert resp.status_code == 400 and "expired" in resp.json()["detail"]
    assert not DiscordAccount.objects.exists()


def test_no_access_no_link(setup, api_client):
    pilot, _ = setup
    pilot.user_permissions.clear()
    pilot.state.permissions.clear()  # every state may link by default; this admin took it away
    api_client.force_login(pilot)
    assert api_client.call("post", "/api/p/discord/link").status_code == 403


def test_group_changes_sync_roles_and_keep_hand_given_ones(setup, discord, api_client, django_capture_on_commit_callbacks):
    pilot, caps = setup
    link(api_client, pilot)
    discord.members[ME]["roles"].append(R_HAND)
    with django_capture_on_commit_callbacks(execute=True):
        add_member(pilot, caps, "admin")
    assert sorted(discord.members[ME]["roles"]) == sorted([R_CAPS, R_HAND])
    with django_capture_on_commit_callbacks(execute=True):
        remove_member(pilot, caps, "admin")
    assert discord.members[ME]["roles"] == [R_HAND]


def test_losing_access_strips_roles_or_kicks(setup, discord, api_client):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    link(api_client, pilot)
    pilot.user_permissions.clear()
    pilot.state.permissions.clear()
    pilot = type(pilot).objects.get(pk=pilot.pk)  # drop the permission cache
    assert services.sync_user(pilot) == ""
    assert discord.members[ME]["roles"] == []
    DiscordSettings.objects.filter(pk=1).update(kick_without_access=True)
    services.sync_user(pilot)
    assert ME not in discord.members and not DiscordAccount.objects.exists()


def test_rejoining_after_leaving_the_server(setup, discord, api_client):
    pilot, _ = setup
    link(api_client, pilot)
    discord.members.pop(ME)
    assert "Not on the server" in services.sync_user(pilot)
    assert link(api_client, pilot).status_code == 200 and ME in discord.members


def test_one_discord_account_per_member(setup, api_client, corp):
    pilot, _ = setup
    link(api_client, pilot)
    other = make_user(90000002, "Other Pilot", corporation=corp)
    other.user_permissions.add(Permission.objects.get(codename="access_discord"))
    assert link(api_client, other).status_code == 409


def test_unlink_takes_managed_roles_away(setup, discord, api_client):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    link(api_client, pilot)
    discord.members[ME]["roles"].append(R_HAND)
    assert api_client.call("post", "/api/p/discord/unlink").json()["account"] is None
    assert discord.members[ME]["roles"] == [R_HAND]


def test_rate_limits_are_waited_out_only_in_background_tasks(setup, discord):
    discord.rate_limit_next = True
    with discord_api.allow_waiting():
        assert discord_api.guild("bot-token", GUILD)["name"] == "Test Alliance"
    assert discord.calls.count(("GET", f"/guilds/{GUILD}")) == 2
    # In a web request a rate limit fails straight away: sleeping there would tie up the site's workers.
    discord.rate_limit_next = True
    with pytest.raises(discord_api.DiscordError) as err:
        discord_api.guild("bot-token", GUILD)
    assert err.value.status == 429 and discord.calls.count(("GET", f"/guilds/{GUILD}")) == 3


def test_fix_my_roles_is_throttled(setup, api_client):
    pilot, _ = setup
    link(api_client, pilot)
    cache.clear()
    assert api_client.call("post", "/api/p/discord/sync").status_code == 200
    resp = api_client.call("post", "/api/p/discord/sync")
    assert resp.status_code == 429 and "try again" in resp.json()["detail"]


def test_unlinking_keeps_the_link_when_discord_cant_take_the_roles_away(setup, discord, api_client):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    link(api_client, pilot)
    discord.rate_limit_next = True  # Discord refuses the clean-up
    resp = api_client.call("post", "/api/p/discord/unlink")
    assert resp.status_code == 502 and "stays linked" in resp.json()["detail"]
    assert DiscordAccount.objects.filter(user=pilot).exists() and R_CAPS in discord.members[ME]["roles"]
    # Once Discord answers again it works; an administrator can also force it.
    assert api_client.call("post", "/api/p/discord/unlink").json()["account"] is None
    assert discord.members[ME]["roles"] == []
    link(api_client, pilot)
    admin = make_user(90000009, "Admin")
    admin.user_permissions.add(Permission.objects.get(codename="manage_discord"))
    api_client.force_login(type(admin).objects.get(pk=admin.pk))
    discord.rate_limit_next = True
    assert api_client.call("delete", f"/api/p/discord/admin/members/{pilot.pk}").status_code == 502
    discord.rate_limit_next = True
    assert api_client.call("delete", f"/api/p/discord/admin/members/{pilot.pk}?force=true").status_code == 200
    assert not DiscordAccount.objects.filter(user=pilot).exists()


def test_server_check_spots_roles_the_bot_cant_give(setup):
    RoleMapping.objects.create(state=None, group=Group.objects.create(name="Directors"), role_id=R_HIGH, role_name="")
    result = services.server_check()
    assert result["guild"]["name"] == "Test Alliance" and result["bot"]["on_server"]
    assert any("Directors is above the bot" in p for p in result["problems"])
    roles = {r["name"]: r["assignable"] for r in result["roles"]}
    assert roles["Capitals"] and not roles["Directors"] and not roles["Conduit"]
    assert RoleMapping.objects.get(role_id=R_HIGH).role_name == "Directors"


def test_settings_never_send_secrets_back(setup, api_client, admin_user):
    api_client.force_login(admin_user)
    data = api_client.call("get", "/api/p/discord/admin").json()
    assert data["settings"]["bot_token_set"] and "bot-token" not in json.dumps(data)
    assert data["redirect_uri"].endswith("/p/discord/callback")
    body = {"client_id": "500000000000000005", "guild_id": GUILD, "nickname_format": "{character} [{alliance_ticker}]"}
    assert api_client.call("put", "/api/p/discord/admin/settings", body).status_code == 200
    assert DiscordSettings.load().bot_token == "bot-token"  # left out: kept
    bad = api_client.call("put", "/api/p/discord/admin/settings", {**body, "nickname_format": "{name}"})
    assert bad.status_code == 400 and "placeholder" in bad.json()["detail"]
    pilot, _ = setup
    assert services.nickname_for(pilot, "{character} [{alliance_ticker}]") == "Pilot One [TEST]"


def test_mappings_api(setup, api_client, admin_user):
    pilot, caps = setup
    api_client.force_login(admin_user)
    from conduit.access.models import State

    member_state = State.objects.create(name="Member", priority=10)
    resp = api_client.call("put", "/api/p/discord/admin/mappings", {"mappings": [
        {"kind": "group", "target_id": caps.pk, "role_id": R_CAPS, "role_name": "Capitals"},
        {"kind": "state", "target_id": member_state.pk, "role_id": R_MEMBER, "role_name": "Member"},
    ]})
    assert resp.status_code == 200 and len(resp.json()["mappings"]) == 2
    pilot.state = member_state
    pilot.save()
    assert services.desired_roles(pilot) == {R_MEMBER}


def test_every_state_may_link_discord_by_default(db):
    import importlib

    from django.apps import apps

    from conduit.access.models import State

    new = State.objects.create(name="Blue", priority=5)
    assert new.permissions.filter(codename="access_discord").exists()

    old = State.objects.create(name="Old", priority=6)
    old.permissions.clear()  # as if made before the plugin was installed
    importlib.import_module("conduit_discord.migrations.0002_default_access").grant_to_every_state(apps, None)
    assert old.permissions.filter(codename="access_discord").exists()
    old.permissions.clear()
    old.save()  # taking it away sticks: only new states get it
    assert not old.permissions.filter(codename="access_discord").exists()


def test_admins_see_mains_and_the_alts_they_may_see(setup, api_client, corp):
    """Discord managers see each member's main; alts only if they may open those characters' sheets."""
    from conduit.accounts.models import Character

    pilot, _ = setup
    assert link(api_client, pilot).status_code == 200
    Character.objects.create(id=90000002, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=corp)
    manager = make_user(90000050, "Discord Admin")
    manager.user_permissions.add(Permission.objects.get(codename="manage_discord"))
    api_client.force_login(manager)
    row = api_client.call("get", "/api/p/discord/admin/members").json()[0]
    assert [(c["name"], c["main"]) for c in row["characters"]] == [("Pilot One", True)]
    # Someone who may view every character (here an administrator) sees the alt too, with links to the sheets.
    api_client.force_login(admin := make_user(90000051, "Site Admin"))
    admin.is_superuser = True
    admin.save()
    row = api_client.call("get", "/api/p/discord/admin/members").json()[0]
    assert [(c["name"], c["main"], c["viewable"]) for c in row["characters"]] == [("Pilot One", True, True), ("Pilot Alt", False, True)]


def test_must_be_on_the_server_to_be_compliant(setup, discord, api_client, admin_user, monkeypatch, django_capture_on_commit_callbacks):
    """With the setting on, members who may link Discord are only compliant while linked and on the server."""
    from conduit.access import tasks as access_tasks
    from conduit.access.compliance import check_user

    rechecked = []
    monkeypatch.setattr(access_tasks.update_user_groups, "delay", lambda uid: rechecked.append(uid))
    pilot, _ = setup
    discord_problems = lambda: [p for p in check_user(pilot)["problems"] if p.startswith("Discord")]  # noqa: E731
    assert discord_problems() == []  # off by default

    api_client.force_login(admin_user)
    s = api_client.call("get", "/api/p/discord/admin").json()["settings"]
    body = {k: s[k] for k in ("client_id", "guild_id", "nickname_format", "kick_without_access")} | {"require_for_compliance": True}
    assert api_client.call("put", "/api/p/discord/admin/settings", body).json()["settings"]["require_for_compliance"]
    assert discord_problems() == ["Discord: not linked (link it and join the server on the Discord page)"]

    assert link(api_client, pilot).status_code == 200
    assert discord_problems() == []
    discord.members.pop(ME)  # left the server; noticed at the next sync
    with django_capture_on_commit_callbacks(execute=True):
        services.sync_user(pilot)
    assert discord_problems() == ["Discord: not on the server (join it again on the Discord page)"]
    assert DiscordAccount.objects.get().on_server is False and pilot.pk in rechecked

    # People who may not link Discord (every state may by default; take it away) aren't asked to.
    from conduit.access.models import State

    for state in State.objects.all():
        state.permissions.remove(Permission.objects.get(codename="access_discord"))
    pilot.user_permissions.clear()
    pilot = type(pilot).objects.get(pk=pilot.pk)
    assert [p for p in check_user(pilot)["problems"] if p.startswith("Discord")] == []


def test_a_merged_account_takes_its_discord_link_along(setup, discord, api_client, corp, django_capture_on_commit_callbacks):
    from conduit.accounts.models import Character
    from conduit.accounts.services import move_characters

    pilot, _ = setup  # their second account, which linked Discord
    assert link(api_client, pilot).status_code == 200
    main = make_user(90000060, "Real Main", corporation=corp)
    admin = make_user(90000061, "Admin")
    admin.is_superuser = True
    admin.save()
    with django_capture_on_commit_callbacks(execute=True):
        move_characters(admin, pilot, main, list(Character.objects.filter(user=pilot).values_list("pk", flat=True)))
    assert DiscordAccount.objects.get().user_id == main.pk
