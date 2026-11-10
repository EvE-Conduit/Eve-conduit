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

R_GUEST, R_TEMP = "400000000000000009", "400000000000000008"
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
        self.roles.append({"id": R_TEMP, "name": "tempaccess", "position": 1, "permissions": "0", "color": 0})
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
        self.audit: list[dict] = []  # newest first, as Discord gives it
        self.audit_allowed = True

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
        m = re.fullmatch(rf"/guilds/{GUILD}/members/(\d+)/roles/(\d+)", path)
        if m:
            self.calls.append((request.method, path))
            who = self.members.get(m.group(1))
            if who is None:
                return httpx.Response(404, json={"message": "Unknown Member", "code": 10007})
            who["roles"] = [r for r in who["roles"] if r != m.group(2)] + ([m.group(2)] if request.method == "PUT" else [])
            return httpx.Response(204)
        if path == f"/guilds/{GUILD}/audit-logs":
            if not self.audit_allowed:
                return httpx.Response(403, json={"message": "Missing Permissions", "code": 50013})
            q = request.url.params
            rows = [e for e in self.audit if str(e["action_type"]) == q["action_type"] and e["user_id"] == q["user_id"]
                    and ("before" not in q or int(e["id"]) < int(q["before"]))]
            return httpx.Response(200, json={"audit_log_entries": rows[:100]})
        m = re.fullmatch(r"/channels/(\d+)/permissions/(\d+)", path)
        if m:
            self.calls.append((request.method, path))
            channel = next(c for c in self.channels if c["id"] == m.group(1))
            if channel["id"] in self.locked:
                return httpx.Response(403, json={"message": "Missing Permissions", "code": 50013})
            old = next((o for o in channel["permission_overwrites"] if o["id"] == m.group(2)), None)
            rest = [o for o in channel["permission_overwrites"] if o["id"] != m.group(2)]
            if request.method == "PUT":
                new = json.loads(request.content)
                rest.append({"id": m.group(2), **new})
                changes = [{"key": k, "new_value": new[k], **({"old_value": old[k]} if old else {})}
                           for k in ("allow", "deny") if old is None or old[k] != new[k]]
                if changes:
                    self.audit.insert(0, {"id": str(900000000000000000 + len(self.audit)), "user_id": BOT, "target_id": channel["id"],
                                          "action_type": 14 if old else 13, "changes": changes,
                                          "options": {"id": m.group(2), "type": str(new["type"])}})
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


def left(discord, who=None) -> bool:
    """Whether their stay is over on Discord: off the server, or on it without the guest role."""
    who = who or VISITOR
    return who not in discord.members or R_GUEST not in discord.members[who]["roles"]


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
    assert discord.members[VISITOR] == {"roles": [R_GUEST], "nick": "[GUEST] guest1"}
    guest = Guest.objects.get()
    assert guest.discord_id == VISITOR and guest.ended_at is None

    # Nothing happens while the link is good; no call to Discord either.
    before = len(discord.calls)
    assert guests.end_due() == {"ended": 0, "waiting": 0} and len(discord.calls) == before

    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert left(discord)
    guest.refresh_from_db()
    assert guest.ended_reason == "expired" and guest.ended_at
    assert guests.end_due() == {"ended": 0, "waiting": 0}
    # And the link is closed to newcomers.
    discord.visitor = SECOND
    assert join(token).status_code == 410 and left(discord, SECOND)


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
    assert resp.status_code == 410 and left(discord, SECOND)
    assert Client().get(f"{PUBLIC}/guest/{token}").json()["status"] == "used_up"
    # Used up isn't over: the guest it let in stays until it runs out.
    assert guests.end_due() == {"ended": 0, "waiting": 0} and not left(discord)


def test_someone_already_on_the_server_gets_the_role_for_a_while_and_is_never_removed(fc, discord, api_client):
    DiscordSettings.objects.update(guest_end_action="kick")  # even when guests are removed
    discord.members[VISITOR] = {"roles": [R_HIGH], "nick": "Old Friend"}
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    assert join(token).status_code == 200
    assert discord.members[VISITOR] == {"roles": [R_HIGH, R_GUEST], "nick": "[GUEST] guest1"}
    guest = Guest.objects.get()
    assert guest.was_on_server and not guest.had_role and guest.previous_nick == "Old Friend"
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert discord.members[VISITOR] == {"roles": [R_HIGH], "nick": "Old Friend"}


def test_a_guest_role_given_by_hand_is_left_alone(fc, discord, api_client):
    discord.members[VISITOR] = {"roles": [R_GUEST], "nick": None}
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    assert join(token).status_code == 200 and Guest.objects.get().had_role
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    guests.end_due()
    assert discord.members[VISITOR]["roles"] == [R_GUEST] and discord.members[VISITOR]["nick"] is None


def test_when_a_link_ends_guests_lose_the_role_or_are_removed_as_the_site_chose(fc, discord, api_client):
    token = make_link(api_client, fc)["url"].rsplit("/", 1)[1]
    join(token)
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    guests.end_due()
    # By default they stay on the server, without the guest role and under their own name again.
    assert discord.members[VISITOR] == {"roles": [], "nick": None}
    assert Client().get(f"{PUBLIC}/guest/{token}").json()["leaves"] is False

    # They can come back through a new link, and with "remove" chosen a newcomer is taken off the server.
    DiscordSettings.objects.update(guest_end_action="kick")
    token = make_link(api_client, fc, label="Second visit")["url"].rsplit("/", 1)[1]
    assert Client().get(f"{PUBLIC}/guest/{token}").json()["leaves"] is True
    assert join(token).status_code == 200 and R_GUEST in discord.members[VISITOR]["roles"]
    discord.visitor = SECOND
    assert join(token).status_code == 200
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 2, "waiting": 0}
    assert discord.members[VISITOR] == {"roles": [], "nick": None}  # was here before this link: stays
    assert SECOND not in discord.members  # came in through it: removed


def test_guest_names(fc, discord, api_client):
    assert guests.guest_nickname("[GUEST] {name}", "x" * 40) == ("[GUEST] " + "x" * 40)[:32]
    assert guests.guest_nickname("", "Jane") is None and guests.guest_nickname("{nope}", "Jane") is None
    DiscordSettings.objects.update(guest_nickname_format="")
    join(make_link(api_client, fc)["url"].rsplit("/", 1)[1])
    assert discord.members[VISITOR]["nick"] is None and not Guest.objects.get().nick_set


def test_a_running_link_can_be_given_more_time(fc, discord, api_client):
    made = make_link(api_client, fc, hours=4)
    join(made["url"].rsplit("/", 1)[1])
    api_client.force_login(fc)
    resp = api_client.call("post", f"{BASE}/guests/{made['id']}/extend", {"hours": 8})
    assert resp.status_code == 200, resp.content
    link = GuestLink.objects.get()
    assert timedelta(hours=11, minutes=59) < link.expires_at - timezone.now() < timedelta(hours=12, minutes=1)
    assert guests.end_due() == {"ended": 0, "waiting": 0} and not left(discord)
    assert AuditEvent.objects.filter(action="discord.guest_link_extended").exists()
    # Never beyond the longest a link may last, counted from now.
    resp = api_client.call("post", f"{BASE}/guests/{made['id']}/extend", {"hours": 61})
    assert resp.status_code == 400 and "at most 72 hours from now" in resp.json()["detail"]
    assert api_client.call("post", f"{BASE}/guests/{made['id']}/extend", {"hours": 0}).status_code == 400
    # Somebody else's link can't be extended, nor one that has ended.
    other = make_user(90000002, "Pilot Two")
    other.user_permissions.add(Permission.objects.get(codename="create_guest_links"))
    api_client.force_login(other)
    assert api_client.call("post", f"{BASE}/guests/{made['id']}/extend", {"hours": 1}).status_code == 404
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    api_client.force_login(fc)
    resp = api_client.call("post", f"{BASE}/guests/{made['id']}/extend", {"hours": 1})
    assert resp.status_code == 400 and "has ended" in resp.json()["detail"]


def test_history_lists_who_came_through_which_link(fc, discord, api_client):
    first = make_link(api_client, fc, label="Diplo meeting")
    join(first["url"].rsplit("/", 1)[1])
    discord.visitor = SECOND
    join(make_link(api_client, fc, label="Fleet night")["url"].rsplit("/", 1)[1])
    api_client.force_login(fc)
    body = api_client.call("get", f"{BASE}/guests/history").json()
    assert body["count"] == 2 and [r["link"]["label"] for r in body["items"]] == ["Fleet night", "Diplo meeting"]
    assert body["items"][0]["invited_by"] == "Pilot One" and body["items"][0]["username"] == "guest2"
    assert [r["username"] for r in api_client.call("get", f"{BASE}/guests/history?q=diplo").json()["items"]] == ["guest1"]
    assert api_client.call("get", f"{BASE}/guests/history?q={SECOND}").json()["count"] == 1
    assert api_client.call("get", f"{BASE}/guests/history?q=guest1").json()["count"] == 1
    # Someone else who may make links sees only their own guests; a manager sees everyone's.
    other = make_user(90000002, "Pilot Two")
    other.user_permissions.add(Permission.objects.get(codename="create_guest_links"))
    api_client.force_login(other)
    assert api_client.call("get", f"{BASE}/guests/history").json()["count"] == 0
    other.user_permissions.add(Permission.objects.get(codename="manage_discord"))
    api_client.force_login(type(other).objects.get(pk=other.pk))
    assert api_client.call("get", f"{BASE}/guests/history").json()["count"] == 2
    nobody = make_user(90000004, "Pilot Four")
    api_client.force_login(nobody)
    assert api_client.call("get", f"{BASE}/guests/history").status_code == 403


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
    assert left(discord) and Guest.objects.get().ended_reason == "revoked"
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
    assert resp.status_code == 200 and left(discord) and not left(discord, SECOND)
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
    assert guests.end_due() == {"ended": 1, "waiting": 0} and left(discord)


def test_guests_go_when_the_maker_may_no_longer_hand_out_access(fc, discord, api_client):
    made = make_link(api_client, fc)
    join(made["url"].rsplit("/", 1)[1])
    fc.user_permissions.remove(Permission.objects.get(codename="create_guest_links"))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert Guest.objects.get().ended_reason == "creator_lost" and left(discord)


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
    assert resp.status_code == 400 and not Guest.objects.exists() and left(discord)
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
    assert left(discord) and Client().get(f"{PUBLIC}/guest/{token}").status_code == 404


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


def test_a_link_opens_its_channels_to_its_guests_and_no_roles_settings_are_changed(manager, discord, api_client):
    api_client.force_login(manager)
    offered = api_client.call("get", f"{BASE}/admin/channels").json()
    assert [(c["name"], c["kind"], c["category"]) for c in offered] == [
        ("directors", "text", ""), ("general", "text", "Public"), ("diplo", "text", "Public"), ("Fleet", "voice", "Public")]
    body = choose(api_client, manager, [C_DIRECTORS, C_VOICE])
    assert [c["name"] for c in body["settings"]["guest_channels"]] == ["directors", "Fleet"]
    # Told what guests see through their roles besides; nothing is written to Discord.
    assert body["guest_channels_seen"] == ["#general", "#diplo"]
    assert not discord.audit

    made = make_link(api_client, manager, channels=[C_DIRECTORS])
    assert [c["name"] for c in made["channels"]] == ["directors"]
    assert join(made["url"].rsplit("/", 1)[1]).status_code == 200
    # What anyone sees, and the private channel their link opened.
    assert {c["name"] for c in discord.channels if discord.sees(VISITOR, c["id"])} == {"Public", "general", "diplo", "Fleet", "directors"}
    # The only settings made are the guest's own.
    assert {(e["options"]["id"], e["options"]["type"]) for e in discord.audit} == {(VISITOR, "1")}

    # Leaving takes the personal access along.
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert not discord.sees(VISITOR, C_DIRECTORS)
    assert not any(o["id"] in (VISITOR, R_GUEST) for c in discord.channels for o in c["permission_overwrites"])


def test_a_link_cant_open_a_channel_that_isnt_offered(manager, discord, api_client):
    choose(api_client, manager, [C_DIPLO])
    resp = api_client.call("post", f"{BASE}/guests", {"label": "x", "hours": 1, "channels": [C_DIRECTORS]})
    assert resp.status_code == 400 and "choose from the ones offered" in resp.json()["detail"]
    assert api_client.call("get", f"{BASE}/guests").json()["channels"] == [{"id": C_DIPLO, "name": "diplo", "kind": "text"}]
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "channels": ["700000000000000099"]}).status_code == 400


def test_a_guest_whose_channels_cant_be_opened_isnt_left_on_the_server(manager, discord, api_client):
    choose(api_client, manager, [C_DIPLO])
    token = make_link(api_client, manager)["url"].rsplit("/", 1)[1]
    discord.locked = {C_DIPLO}  # hidden already, but the bot can't open it to anyone now
    resp = join(token)
    assert resp.status_code == 502 and left(discord) and not Guest.objects.exists()


def test_without_chosen_channels_nothing_on_the_server_is_changed(fc, discord, api_client):
    made = make_link(api_client, fc)
    assert made["channels"] == [] and join(made["url"].rsplit("/", 1)[1]).status_code == 200
    assert all(c["permission_overwrites"] in ([], c["permission_overwrites"]) and not any(o["id"] in (R_GUEST, VISITOR) for o in c["permission_overwrites"]) for c in discord.channels)
    assert not any(path.endswith("/channels") for _m, path in discord.calls)


def test_end_action_and_guest_name_settings(manager, discord, api_client):
    api_client.force_login(manager)
    body = api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "end_action": "kick"}).json()
    assert body["settings"]["guest_end_action"] == "kick"
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "end_action": "burn"}).status_code == 400
    assert api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "nickname_format": "{who}"}).status_code == 400
    body = api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, "nickname_format": "{name} (guest)"}).json()
    assert body["settings"]["guest_nickname_format"] == "{name} (guest)" and body["settings"]["guest_end_action"] == "kick"


# --- two roles: the guest role is kept, tempaccess is for the time ---------------------------------------------------


@pytest.fixture
def two_roles(manager):
    DiscordSettings.objects.update(guest_temp_role_id=R_TEMP, guest_temp_role_name="tempaccess")
    return manager


def test_guests_get_both_roles_and_keep_the_guest_role_when_the_link_ends(two_roles, discord, api_client):
    made = make_link(api_client, two_roles)
    assert made["role"] == "tempaccess"
    overview = api_client.call("get", f"{BASE}/guests").json()
    assert overview["role"] == "tempaccess" and overview["kept_role"] == "Guest"
    assert join(made["url"].rsplit("/", 1)[1]).status_code == 200
    assert discord.members[VISITOR] == {"roles": [R_GUEST, R_TEMP], "nick": "[GUEST] guest1"}
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert discord.members[VISITOR] == {"roles": [R_GUEST], "nick": None}

    # A former guest comes back through a new link, and loses only tempaccess again.
    again = make_link(api_client, two_roles, label="Second visit")
    assert join(again["url"].rsplit("/", 1)[1]).status_code == 200
    assert sorted(discord.members[VISITOR]["roles"]) == sorted([R_GUEST, R_TEMP])
    api_client.force_login(two_roles)
    assert api_client.call("delete", f"{BASE}/guests/{again['id']}").status_code == 200
    assert discord.members[VISITOR]["roles"] == [R_GUEST]
    assert Guest.objects.filter(ended_at__isnull=False).count() == 2


def test_tempaccess_given_by_hand_is_left_and_removing_guests_still_removes_them(two_roles, discord, api_client):
    discord.members[VISITOR] = {"roles": [R_TEMP], "nick": None}
    made = make_link(api_client, two_roles)
    join(made["url"].rsplit("/", 1)[1])
    discord.visitor = SECOND
    DiscordSettings.objects.update(guest_end_action="kick")
    join(made["url"].rsplit("/", 1)[1])
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 2, "waiting": 0}
    assert sorted(discord.members[VISITOR]["roles"]) == sorted([R_GUEST, R_TEMP]) and SECOND not in discord.members


def test_choosing_channels_changes_nothing_about_the_roles(two_roles, discord, api_client):
    general = next(c for c in discord.channels if c["id"] == C_GENERAL)
    general["permission_overwrites"].append({"id": R_TEMP, "type": 0, "allow": str(discord_api.VIEW_CHANNEL), "deny": "0"})
    import copy

    before = copy.deepcopy(discord.channels)
    choose(api_client, two_roles, [C_DIPLO, C_VOICE])
    join(make_link(api_client, two_roles, channels=[C_DIPLO])["url"].rsplit("/", 1)[1])
    guests.end_due()
    GuestLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert guests.end_due() == {"ended": 1, "waiting": 0}
    assert discord.channels == before and discord.members[VISITOR]["roles"] == [R_GUEST]
    assert not any(e["options"]["type"] == "0" for e in discord.audit)


def test_undoing_puts_every_channel_back_as_it_was(two_roles, discord, api_client):
    import copy

    # The guest role was allowed into one channel by hand, and has a setting of its own in another.
    by = {c["id"]: c for c in discord.channels}
    by[C_GENERAL]["permission_overwrites"].append({"id": R_GUEST, "type": 0, "allow": str(discord_api.VIEW_CHANNEL | 2048), "deny": "0"})
    by[C_DIRECTORS]["permission_overwrites"].append({"id": R_GUEST, "type": 0, "allow": "0", "deny": "2048"})
    # What 1.4.0 did to the temporary role: its View Channel was taken away.
    by[C_DIPLO]["permission_overwrites"].append({"id": R_TEMP, "type": 0, "allow": str(discord_api.VIEW_CHANNEL), "deny": "0"})
    original = copy.deepcopy(discord.channels)
    discord_api.set_overwrite("bot-token", C_DIPLO, R_TEMP, member=False, allow=0, deny=0)
    # And to the guest role: denied wherever it could see, twice over where a later look found more to do.
    V = discord_api.VIEW_CHANNEL
    discord_api.set_overwrite("bot-token", C_GENERAL, R_GUEST, member=False, allow=0, deny=V)
    discord_api.set_overwrite("bot-token", C_GENERAL, R_GUEST, member=False, allow=2048, deny=V)
    for cid in (C_CAT, C_DIPLO, C_VOICE):
        discord_api.set_overwrite("bot-token", cid, R_GUEST, member=False, allow=0, deny=V)
    choose(api_client, two_roles, [C_DIPLO, C_VOICE])
    assert discord.channels != original
    # A guest who is here keeps their own channels.
    join(make_link(api_client, two_roles)["url"].rsplit("/", 1)[1])
    api_client.force_login(two_roles)

    discord.audit_allowed = False
    resp = api_client.call("post", f"{BASE}/admin/guests/undo-channels")
    assert resp.status_code == 409 and "View Audit Log" in resp.json()["detail"]
    assert DiscordSettings.load().guest_channels  # nothing was changed yet
    discord.audit_allowed = True
    body = api_client.call("post", f"{BASE}/admin/guests/undo-channels").json()
    assert body["undo"] == {"restored": 5, "failed": [], "running": False} and body["settings"]["guest_channels"] == []
    strip = lambda rows: [{**c, "permission_overwrites": sorted((o for o in c["permission_overwrites"] if o["id"] not in (VISITOR,)), key=lambda o: o["id"])} for c in rows]  # noqa: E731
    assert strip(discord.channels) == strip(original)
    assert any(o["id"] == VISITOR for c in discord.channels for o in c["permission_overwrites"])
    # Again changes nothing.
    assert api_client.call("post", f"{BASE}/admin/guests/undo-channels").json()["undo"]["restored"] == 0
    assert strip(discord.channels) == strip(original)


def test_a_guest_who_links_their_account_stops_being_a_guest_at_once(two_roles, discord, api_client):
    made = make_link(api_client, two_roles)
    assert join(made["url"].rsplit("/", 1)[1]).status_code == 200
    # The pilot signs in with that same Discord account as a member.
    assert link_member(api_client, two_roles).status_code == 200
    guest = Guest.objects.get()
    assert guest.ended_reason == "member" and guest.ended_at is not None
    assert R_GUEST in discord.members[VISITOR]["roles"] and R_TEMP not in discord.members[VISITOR]["roles"]
    assert discord.members[VISITOR]["nick"] != "[GUEST] guest1"


def test_the_two_roles_have_to_differ(two_roles, discord, api_client):
    api_client.force_login(two_roles)
    put = lambda **body: api_client.call("put", f"{BASE}/admin/guests", {"enabled": True, "role_id": R_GUEST, **body})  # noqa: E731
    assert put(temp_role_id=R_GUEST).status_code == 400 and put(temp_role_id=GUILD).status_code == 400
    assert put().json()["settings"]["guest_temp_role_id"] == R_TEMP  # not said: left as it is
    body = put(temp_role_id=R_TEMP, temp_role_name="tempaccess").json()
    assert body["settings"]["guest_temp_role_name"] == "tempaccess"
    DiscordSettings.objects.update(guest_temp_role_id="400000000000000077")
    assert any("temporary role" in p for p in api_client.call("post", f"{BASE}/admin/check").json()["problems"])
    assert put(temp_role_id="").json()["settings"]["guest_temp_role_id"] == ""
