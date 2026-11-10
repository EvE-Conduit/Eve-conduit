"""Temporary Discord access: making links, guests joining through them, and leaving when the link ends."""

import json
import re
from datetime import timedelta

import httpx
import pytest
from django.contrib.auth.models import Permission
from django.core.cache import cache
from django.test import Client
from django.utils import timezone

from conduit.audit.models import AuditEvent
from conduit_discord import discord_api, guests
from conduit_discord.models import DiscordAccount, DiscordSettings, Guest, GuestLink
from tests.conftest import make_user

from test_discord import BOT, GUILD, ME, R_CAPS, R_HIGH, FakeDiscord, link as link_member, setup  # noqa: F401

R_GUEST = "400000000000000009"
VISITOR, SECOND = "600000000000000001", "600000000000000002"
C_CAT, C_GENERAL, C_DIPLO, C_VOICE, C_DIRECTORS = (f"70000000000000000{n}" for n in range(1, 6))
PUBLIC, BASE = "/api/public/p/discord", "/api/p/discord"


class Visitors(FakeDiscord):
    """The fake server, where whoever signs in with Discord is ``visitor`` (the base class only knows the pilot)."""

    def __init__(self):
        super().__init__()
        self.visitor = VISITOR
        self.down = False
        self.roles.append({"id": R_GUEST, "name": "Guest", "position": 1, "permissions": "0", "color": 0})
        self.roles[0]["permissions"] = str(discord_api.VIEW_CHANNEL | discord_api.CONNECT)  # @everyone sees channels
        private = [{"id": GUILD, "type": 0, "allow": "0", "deny": str(discord_api.VIEW_CHANNEL)}]
        self.channels = [
            {"id": C_CAT, "type": 4, "name": "Public", "position": 0, "parent_id": None, "permission_overwrites": []},
            {"id": C_GENERAL, "type": 0, "name": "general", "position": 0, "parent_id": C_CAT, "permission_overwrites": []},
            {"id": C_DIPLO, "type": 0, "name": "diplo", "position": 1, "parent_id": C_CAT, "permission_overwrites": []},
            {"id": C_VOICE, "type": 2, "name": "Fleet", "position": 0, "parent_id": C_CAT, "permission_overwrites": []},
            {"id": C_DIRECTORS, "type": 0, "name": "directors", "position": 2, "parent_id": None, "permission_overwrites": private},
        ]
        self.locked: set[str] = set()  # channels where the bot may not change permissions

    def __call__(self, request):
        if self.down and request.headers.get("authorization", "").startswith("Bot "):
            return httpx.Response(500, json={"message": "Discord is having a moment"})
        if request.url.path.endswith("/users/@me") and request.headers.get("authorization") == "Bearer user-token":
            self.calls.append((request.method, "/users/@me"))
            return httpx.Response(200, json={"id": self.visitor, "username": f"guest{self.visitor[-1]}", "global_name": None, "avatar": None})
        path = request.url.path.removeprefix("/api/v10")
        if path == f"/guilds/{GUILD}/channels":
            self.calls.append((request.method, path))
            return httpx.Response(200, json=self.channels)
        m = re.fullmatch(r"/channels/(\d+)/permissions/(\d+)", path)
        if m:
            self.calls.append((request.method, path))
            channel = next(c for c in self.channels if c["id"] == m.group(1))
            if channel["id"] in self.locked:
                return httpx.Response(403, json={"message": "Missing Permissions", "code": 50013})
            rest = [o for o in channel["permission_overwrites"] if o["id"] != m.group(2)]
            if request.method == "PUT":
                rest.append({"id": m.group(2), **json.loads(request.content)})
            channel["permission_overwrites"] = rest
            return httpx.Response(204)
        return super().__call__(request)

    def sees(self, user_id: str, channel_id: str) -> bool:
        """Discord's own arithmetic for one member and one channel."""
        channel = next(c for c in self.channels if c["id"] == channel_id)
        roles = {r["id"]: int(r["permissions"]) for r in self.roles}
        mine = self.members[user_id]["roles"]
        perms = roles[GUILD]
        for r in mine:
            perms |= roles[r]
        over = {o["id"]: (int(o["allow"]), int(o["deny"])) for o in channel["permission_overwrites"]}
        allow, deny = over.get(GUILD, (0, 0))
        perms = (perms & ~deny) | allow
        allow = deny = 0
        for r in mine:
            allow |= over.get(r, (0, 0))[0]
            deny |= over.get(r, (0, 0))[1]
        perms = (perms & ~deny) | allow
        allow, deny = over.get(user_id, (0, 0))
        perms = (perms & ~deny) | allow
        return bool(perms & discord_api.VIEW_CHANNEL)


@pytest.fixture
def discord(monkeypatch):
    fake = Visitors()
    monkeypatch.setattr(discord_api, "_client", lambda: httpx.Client(transport=httpx.MockTransport(fake)))
    cache.clear()
    return fake


@pytest.fixture
def fc(setup):  # noqa: F811
    pilot, _ = setup
    DiscordSettings.objects.filter(pk=1).update(guest_enabled=True, guest_role_id=R_GUEST, guest_role_name="Guest", guild_name="Test Alliance")
    pilot.user_permissions.add(Permission.objects.get(codename="create_guest_links"))
    return pilot


def make_link(api_client, fc, **over):
    api_client.force_login(fc)
    resp = api_client.call("post", f"{BASE}/guests", {"label": "Diplo meeting", "hours": 4, **over})
    assert resp.status_code == 200, resp.content
    return resp.json()


def join(token, client=None):
    """A visitor without an account opens the link and signs in with Discord."""
    c = client or Client()
    shown = c.get(f"{PUBLIC}/guest/{token}")
    if shown.status_code != 200:
        return shown
    started = c.post(f"{PUBLIC}/guest/{token}/start", content_type="application/json")
    if started.status_code != 200:
        return started
    state = re.search(r"state=([^&]+)", started.json()["url"]).group(1)
    assert "redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fpublic%2Fp%2Fdiscord%2Fguest&" in started.json()["url"] or "public%2Fp%2Fdiscord%2Fguest" in started.json()["url"]
    return c.post(f"{PUBLIC}/guest-finish", {"code": "good-code", "state": state}, content_type="application/json")


def test_a_guest_joins_with_the_guest_role_and_leaves_when_the_link_runs_out(fc, discord, api_client):
    made = make_link(api_client, fc)
    token = made["url"].rsplit("/", 1)[1]
    assert made["status"] == "active" and made["role"] == "Guest" and "/public/p/discord/guest/" in made["url"]
    shown = Client().get(f"{PUBLIC}/guest/{token}").json()
    assert shown["label"] == "Diplo meeting" and shown["invited_by"] == "Pilot One" and shown["status"] == "active"

    resp = join(token)
    assert resp.status_code == 200, resp.content
    assert resp.json()["username"] == "guest1" and resp.json()["server_url"].endswith(GUILD)
    assert discord.members[VISITOR] == {"roles": [R_GUEST], "nick": None}
    guest = Guest.objects.get()
    assert guest.discord_id == VISITOR and guest.ended_at is None

    # Nothing happens while the link is good; no call to Discord either.
    before = len(discord.calls)
    assert guests.end_due() == {"ended": 0, "waiting": 0} and len(discord.calls) == before

    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert VISITOR not in discord.members
    guest.refresh_from_db()
    assert guest.ended_reason == "expired" and guest.ended_at
    assert guests.end_due() == {"ended": 0, "waiting": 0}
    # And the link is closed to newcomers.
    discord.visitor = SECOND
    assert join(token).status_code == 410 and SECOND not in discord.members


def test_only_people_with_the_permission_make_links_and_only_while_switched_on(fc, discord, api_client):
    other = make_user(90000002, "Pilot Two")
    api_client.force_login(other)
    assert api_client.call("post", f"{BASE}/guests", {"label": "x", "hours": 1}).status_code == 403
    assert api_client.call("get", f"{BASE}/guests").status_code == 403
    api_client.force_login(fc)
    for body, words in [({"label": " ", "hours": 1}, "what the link is for"), ({"label": "x", "hours": 0}, "how long"),
                        ({"label": "x", "hours": 73}, "at most 72 hours"), ({"label": "x", "hours": 1, "max_uses": -1}, "at most")]:
        resp = api_client.call("post", f"{BASE}/guests", body)
        assert resp.status_code == 400 and words in resp.json()["detail"], resp.content
    DiscordSettings.objects.update(guest_enabled=False)
    assert api_client.call("post", f"{BASE}/guests", {"label": "x", "hours": 1}).status_code == 404
    assert api_client.call("get", f"{BASE}/guests").json()["enabled"] is False
    assert AuditEvent.objects.filter(action="discord.guest_link").count() == 0


def test_the_uses_limit_holds(fc, discord, api_client):
    token = make_link(api_client, fc, max_uses=1)["url"].rsplit("/", 1)[1]
    assert join(token).status_code == 200
    discord.visitor = SECOND
    resp = join(token)
    assert resp.status_code == 410 and SECOND not in discord.members
    assert Client().get(f"{PUBLIC}/guest/{token}").json()["status"] == "used_up"
    # Used up isn't over: the guest it let in stays until it runs out.
    assert guests.end_due() == {"ended": 0, "waiting": 0} and VISITOR in discord.members


def test_someone_already_on_the_server_is_never_recorded_so_never_removed(fc, discord, api_client):
    discord.members[VISITOR] = {"roles": [R_HIGH], "nick": None}
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    resp = join(token)
    assert resp.status_code == 409 and "already on the server" in resp.json()["detail"]
    assert not Guest.objects.exists() and discord.members[VISITOR]["roles"] == [R_HIGH]
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    guests.end_due()
    assert VISITOR in discord.members


def test_a_members_own_discord_account_cant_come_in_as_a_guest(fc, discord, api_client):
    discord.visitor = ME
    DiscordAccount.objects.create(user=fc, discord_id=ME, username="Pilot")
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    resp = join(token)
    assert resp.status_code == 409 and "linked to a member" in resp.json()["detail"] and not Guest.objects.exists()


def test_withdrawing_a_link_removes_its_guests_and_only_its_maker_or_a_manager_may(fc, discord, api_client):
    made = make_link(api_client, fc)
    assert join(made["url"].rsplit("/", 1)[1]).status_code == 200
    other = make_user(90000002, "Pilot Two")
    other.user_permissions.add(Permission.objects.get(codename="create_guest_links"))
    api_client.force_login(other)
    assert api_client.call("delete", f"{BASE}/guests/{made['id']}").status_code == 404
    assert api_client.call("get", f"{BASE}/guests").json()["links"] == []  # only your own
    other.user_permissions.add(Permission.objects.get(codename="manage_discord"))
    other = type(other).objects.get(pk=other.pk)
    api_client.force_login(other)
    assert len(api_client.call("get", f"{BASE}/guests").json()["links"]) == 1
    resp = api_client.call("delete", f"{BASE}/guests/{made['id']}")
    assert resp.status_code == 200 and resp.json()["status"] == "revoked" and resp.json()["waiting"] == 0
    assert VISITOR not in discord.members and Guest.objects.get().ended_reason == "revoked"
    assert AuditEvent.objects.filter(action="discord.guest_link_revoked").exists()


def test_one_guest_can_be_removed_and_the_link_keeps_working(fc, discord, api_client):
    made = make_link(api_client, fc)
    token = made["url"].rsplit("/", 1)[1]
    join(token)
    discord.visitor = SECOND
    join(token)
    first = Guest.objects.get(discord_id=VISITOR)
    api_client.force_login(fc)
    resp = api_client.call("delete", f"{BASE}/guests/users/{first.pk}")
    assert resp.status_code == 200 and VISITOR not in discord.members and SECOND in discord.members
    assert [g["ended_reason"] for g in resp.json()["guests"]] == ["removed", ""]


def test_a_guest_stays_recorded_until_discord_can_be_reached(fc, discord, api_client):
    made = make_link(api_client, fc)
    join(made["url"].rsplit("/", 1)[1])
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    discord.down = True
    assert guests.end_due() == {"ended": 0, "waiting": 1}
    guest = Guest.objects.get()
    assert guest.ended_at is None and guest.error
    discord.down = False
    assert guests.end_due() == {"ended": 1, "waiting": 0} and VISITOR not in discord.members


def test_guests_go_when_the_maker_may_no_longer_hand_out_access(fc, discord, api_client):
    made = make_link(api_client, fc)
    join(made["url"].rsplit("/", 1)[1])
    fc.user_permissions.remove(Permission.objects.get(codename="create_guest_links"))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert Guest.objects.get().ended_reason == "creator_lost" and VISITOR not in discord.members


def test_a_guest_who_became_a_member_keeps_their_place_and_loses_the_guest_role(fc, discord, api_client):
    made = make_link(api_client, fc)
    join(made["url"].rsplit("/", 1)[1])
    newcomer = make_user(90000003, "New Member")
    DiscordAccount.objects.create(user=newcomer, discord_id=VISITOR, username="guest1")
    discord.members[VISITOR]["roles"] = [R_GUEST, R_CAPS]
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert discord.members[VISITOR]["roles"] == [R_CAPS] and Guest.objects.get().ended_reason == "member"


def test_the_answer_from_discord_only_counts_in_the_browser_that_asked(fc, discord, api_client):
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    asker = Client()
    url = asker.post(f"{PUBLIC}/guest/{token}/start", content_type="application/json").json()["url"]
    state = re.search(r"state=([^&]+)", url).group(1)
    resp = Client().post(f"{PUBLIC}/guest-finish", {"code": "good-code", "state": state}, content_type="application/json")
    assert resp.status_code == 400 and not Guest.objects.exists() and VISITOR not in discord.members
    assert Client().get(f"{PUBLIC}/guest/nope").status_code == 404


def test_setting_it_up(fc, discord, api_client):
    api_client.force_login(fc)
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST}).status_code == 403
    fc.user_permissions.add(Permission.objects.get(codename="manage_discord"))
    fc = type(fc).objects.get(pk=fc.pk)
    api_client.force_login(fc)
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": ""}).status_code == 400
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": GUILD}).status_code == 400
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "max_hours": 9999}).status_code == 400
    body = api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "role_name": "Guest", "max_hours": 24}).json()
    assert body["settings"]["guest_enabled"] and body["settings"]["guest_max_hours"] == 24
    assert body["guest_redirect_uri"].endswith("/public/p/discord/guest")
    # The check points out a guest role the bot can't give.
    DiscordSettings.objects.update(guest_role_id=R_HIGH)
    problems = api_client.call("post", f"{BASE}/admin/check").json()["problems"]
    assert any("guest role" in p for p in problems)
    # Switching it off sends the guests home.
    DiscordSettings.objects.update(guest_role_id=R_GUEST)
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    join(token)
    api_client.force_login(fc)
    api_client.call("put", f"{BASE}/admin/guests", {"enabled": False, "role_id": R_GUEST, "max_hours": 24})
    assert VISITOR not in discord.members and Client().get(f"{PUBLIC}/guest/{token}").status_code == 404


# --- only the channels chosen ---------------------------------------------------------------------------------------


@pytest.fixture
def manager(fc):
    fc.user_permissions.add(Permission.objects.get(codename="manage_discord"))
    return type(fc).objects.get(pk=fc.pk)


def choose(api_client, manager, channels):
    api_client.force_login(manager)
    resp = api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "role_name": "Guest", "channels": channels})
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_guests_only_see_the_channels_their_link_opens(manager, discord, api_client):
    offered = api_client_channels = None
    api_client.force_login(manager)
    offered = api_client.call("get", f"{BASE}/admin/channels").json()
    assert [(c["name"], c["kind"], c["category"]) for c in offered] == [
        ("directors", "text", ""), ("general", "text", "Public"), ("diplo", "text", "Public"), ("Fleet", "voice", "Public")]
    body = choose(api_client, manager, [C_DIPLO, C_VOICE])
    assert [c["name"] for c in body["settings"]["guest_channels"]] == ["diplo", "Fleet"]
    assert body["guest_channels_seen"] == [] and body["guest_channels_hiding"] is False
    # Hidden from the guest role everywhere it could see; the private channel needed nothing.
    hidden = {c["name"] for c in discord.channels if any(o["id"] == R_GUEST for o in c["permission_overwrites"])}
    assert hidden == {"Public", "general", "diplo", "Fleet"}

    made = make_link(api_client, manager, channels=[C_DIPLO])
    assert [c["name"] for c in made["channels"]] == ["diplo"]
    assert join(made["url"].rsplit("/", 1)[1]).status_code == 200
    assert {c["name"] for c in discord.channels if discord.sees(VISITOR, c["id"])} == {"diplo"}

    # A link that doesn't say which opens every channel offered.
    discord.visitor = SECOND
    everything = make_link(api_client, manager, label="Fleet night")
    assert join(everything["url"].rsplit("/", 1)[1]).status_code == 200
    assert {c["name"] for c in discord.channels if discord.sees(SECOND, c["id"])} == {"diplo", "Fleet"}

    # Members are untouched: someone with no roles still sees the open channels.
    discord.members["999"] = {"roles": [], "nick": None}
    assert {c["name"] for c in discord.channels if discord.sees("999", c["id"])} == {"Public", "general", "diplo", "Fleet"}

    # Leaving takes the personal access along.
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 2, "waiting": 0}
    assert not any(o["id"] in (VISITOR, SECOND) for c in discord.channels for o in c["permission_overwrites"])


def test_a_link_cant_open_a_channel_that_isnt_offered(manager, discord, api_client):
    choose(api_client, manager, [C_DIPLO])
    resp = api_client.call("post", f"{BASE}/guests", {"label": "x", "hours": 1, "channels": [C_DIRECTORS]})
    assert resp.status_code == 400 and "choose from the ones offered" in resp.json()["detail"]
    assert api_client.call("get", f"{BASE}/guests").json()["channels"] == [{"id": C_DIPLO, "name": "diplo", "kind": "text"}]
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "channels": ["700000000000000099"]}).status_code == 400


def test_nobody_is_let_in_while_a_channel_cant_be_hidden(manager, discord, api_client):
    discord.locked = {C_GENERAL}
    body = choose(api_client, manager, [C_DIPLO])
    assert body["guest_channels_seen"] == ["#general"]
    problems = api_client.call("post", f"{BASE}/admin/check").json()["problems"]
    assert any("#general" in p for p in problems)
    token = make_link(api_client, manager)["url"].rsplit("/", 1)[1]
    resp = join(token)
    assert resp.status_code == 503 and VISITOR not in discord.members and not Guest.objects.exists()
    discord.locked = set()
    assert join(token).status_code == 200
    assert {c["name"] for c in discord.channels if discord.sees(VISITOR, c["id"])} == {"diplo"}


def test_a_channel_made_later_is_hidden_from_the_guests_who_are_here(manager, discord, api_client):
    choose(api_client, manager, [C_DIPLO])
    join(make_link(api_client, manager)["url"].rsplit("/", 1)[1])
    discord.channels.append({"id": "700000000000000042", "type": 0, "name": "new-plans", "position": 9, "parent_id": None, "permission_overwrites": []})
    assert discord.sees(VISITOR, "700000000000000042")
    guests.end_due()
    assert not discord.sees(VISITOR, "700000000000000042")
    # Once everything is in order, looking costs two questions and changes nothing.
    before = len(discord.calls)
    guests.end_due()
    assert [c for c in discord.calls[before:] if c[0] != "GET"] == []


def test_a_guest_whose_channels_cant_be_opened_isnt_left_on_the_server(manager, discord, api_client):
    choose(api_client, manager, [C_DIPLO])
    token = make_link(api_client, manager)["url"].rsplit("/", 1)[1]
    discord.locked = {C_DIPLO}  # hidden already, but the bot can't open it to anyone now
    resp = join(token)
    assert resp.status_code == 502 and VISITOR not in discord.members and not Guest.objects.exists()


def test_without_chosen_channels_nothing_on_the_server_is_changed(fc, discord, api_client):
    made = make_link(api_client, fc)
    assert made["channels"] == [] and join(made["url"].rsplit("/", 1)[1]).status_code == 200
    assert all(c["permission_overwrites"] in ([], c["permission_overwrites"]) and not any(o["id"] in (R_GUEST, VISITOR) for o in c["permission_overwrites"]) for c in discord.channels)
    assert not any(path.endswith("/channels") for _m, path in discord.calls)
