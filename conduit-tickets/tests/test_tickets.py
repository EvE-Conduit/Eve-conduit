"""Discord Tickets: who ends up in the channel, what stops a ticket opening, closing, deleting the channel, who may do
what, and settings. Discord itself is faked."""

import json

import httpx
import pytest
from django.contrib.auth.models import Permission

from conduit.accounts.models import Character
from conduit.audit.models import AuditEvent
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_discord import discord_api
from conduit_discord.models import DiscordAccount, DiscordSettings
from conduit_tickets import services
from conduit_tickets.models import Ticket, TicketSettings
from tests.conftest import make_user

pytestmark = pytest.mark.django_db

BASE = "/api/p/tickets"
GUILD, BOT, OFFICER, PILOT = "100000000000000001", "200000000000000002", "300000000000000003", "300000000000000004"
CATEGORY, ROLE_STAFF, R_BOT = "500000000000000001", "400000000000000001", "400000000000000002"


class FakeDiscord:
    """Just enough of Discord's API, kept in memory."""

    def __init__(self):
        self.members = {BOT: {"roles": [R_BOT]}, OFFICER: {"roles": []}, PILOT: {"roles": []}}
        self.bot_perms = sum(bit for bit, _ in services.BOT_NEEDS) | discord_api.MANAGE_ROLES
        self.channels: dict[str, dict] = {CATEGORY: {"id": CATEGORY, "type": 4, "guild_id": GUILD}}
        self.overwrites: list[tuple[str, dict]] = []
        self.messages: list[tuple[str, dict]] = []
        self.fail_messages = False
        self.refuse_channels = False

    def __call__(self, request: httpx.Request) -> httpx.Response:
        path, method = request.url.path.removeprefix("/api/v10"), request.method
        body = json.loads(request.content) if request.content else None
        if path == "/users/@me":
            return httpx.Response(200, json={"id": BOT, "username": "Conduit"})
        if path == f"/guilds/{GUILD}/roles":
            return httpx.Response(200, json=[
                {"id": GUILD, "name": "@everyone", "position": 0, "permissions": "0"},
                {"id": ROLE_STAFF, "name": "Staff", "position": 1, "permissions": "0"},
                {"id": R_BOT, "name": "Conduit", "position": 2, "permissions": str(self.bot_perms), "managed": True},
            ])
        if path.startswith(f"/guilds/{GUILD}/members/"):
            member = self.members.get(path.rsplit("/", 1)[1])
            return httpx.Response(200, json=member) if member else httpx.Response(404, json={"message": "Unknown Member", "code": 10007})
        if path == f"/guilds/{GUILD}/channels" and method == "POST":
            if self.refuse_channels:
                return httpx.Response(403, json={"message": "Missing Permissions", "code": 50013})
            cid = str(600000000000000000 + len(self.channels))
            self.channels[cid] = {"id": cid, **body}
            return httpx.Response(201, json=self.channels[cid])
        if path.startswith("/channels/"):
            parts = path.split("/")
            cid = parts[2]
            if cid not in self.channels:
                return httpx.Response(404, json={"message": "Unknown Channel", "code": 10003})
            if len(parts) == 3 and method == "GET":
                return httpx.Response(200, json=self.channels[cid])
            if len(parts) == 3 and method == "DELETE":
                del self.channels[cid]
                return httpx.Response(200, json={"id": cid})
            if parts[3] == "messages":
                if self.fail_messages:
                    return httpx.Response(403, json={"message": "Missing Access", "code": 50001})
                self.messages.append((cid, body))
                return httpx.Response(200, json={"id": "1"})
            if parts[3] == "permissions":
                self.overwrites.append((parts[4], body))
                return httpx.Response(204)
        raise AssertionError(f"{method} {path}")


@pytest.fixture
def discord(monkeypatch):
    fake = FakeDiscord()
    monkeypatch.setattr(discord_api, "_client", lambda: httpx.Client(transport=httpx.MockTransport(fake)))
    return fake


@pytest.fixture
def people(db, corp, discord):
    sync_installed()
    set_enabled("discord", True)
    set_enabled("tickets", True)
    DiscordSettings.objects.update_or_create(pk=1, defaults={"client_id": "7", "client_secret": "s", "bot_token": "bot-token", "guild_id": GUILD})
    officer = make_user(90000001, "Officer One", corporation=corp)
    officer.user_permissions.add(Permission.objects.get(codename="open_tickets"))
    pilot = make_user(90000002, "Pilot Two", corporation=corp)
    DiscordAccount.objects.create(user=officer, discord_id=OFFICER, username="officer")
    DiscordAccount.objects.create(user=pilot, discord_id=PILOT, username="pilot")
    return officer, pilot


def open_ticket(api_client, officer, pilot, **extra):
    api_client.force_login(officer)
    return api_client.call("post", f"{BASE}/tickets", {"user_id": pilot.pk, "subject": "A word", **extra})


def only_channel(discord) -> dict:
    return next(c for cid, c in discord.channels.items() if cid != CATEGORY)


def test_channel_is_private_to_the_two_of_them(api_client, people, discord):
    officer, pilot = people
    resp = open_ticket(api_client, officer, pilot, message="Please read @everyone")
    assert resp.status_code == 200, resp.content
    channel = only_channel(discord)
    assert channel["name"] == f"ticket-{resp.json()['id']}-pilot-two" and "parent_id" not in channel
    by_id = {o["id"]: o for o in channel["permission_overwrites"]}
    assert set(by_id) == {GUILD, BOT, OFFICER, PILOT}
    assert int(by_id[GUILD]["deny"]) & services.VIEW_CHANNEL
    assert by_id[PILOT]["type"] == 1 and int(by_id[PILOT]["allow"]) == services.IN_TICKET
    _cid, message = discord.messages[0]
    assert "Please read" in message["content"] and f"<@{PILOT}>" in message["content"]
    assert message["allowed_mentions"] == {"users": [PILOT, OFFICER]}, "only the two of them can be pinged"
    assert resp.json()["url"] == f"https://discord.com/channels/{GUILD}/{channel['id']}"
    assert AuditEvent.objects.filter(action="tickets.opened").exists()
    assert Notification.objects.filter(user=pilot, category="p.tickets", link=resp.json()["url"]).exists()


def test_category_and_staff_role_are_used(api_client, people, discord):
    officer, pilot = people
    TicketSettings.objects.update_or_create(pk=1, defaults={"category_id": CATEGORY, "staff_role_id": ROLE_STAFF})
    assert open_ticket(api_client, officer, pilot).status_code == 200
    channel = only_channel(discord)
    assert channel["parent_id"] == CATEGORY
    staff = next(o for o in channel["permission_overwrites"] if o["id"] == ROLE_STAFF)
    assert staff["type"] == 0 and int(staff["allow"]) == services.IN_TICKET


@pytest.mark.parametrize("gone,word", [(PILOT, "isn't"), (OFFICER, "You aren't")])
def test_both_must_be_on_the_server(api_client, people, discord, gone, word):
    officer, pilot = people
    del discord.members[gone]
    resp = open_ticket(api_client, officer, pilot)
    assert resp.status_code == 409 and word in resp.json()["detail"]
    assert not Ticket.objects.exists() and len(discord.channels) == 1


def test_both_must_have_linked(api_client, people):
    officer, pilot = people
    DiscordAccount.objects.filter(user=pilot).delete()
    assert "hasn't linked" in open_ticket(api_client, officer, pilot).json()["detail"]
    DiscordAccount.objects.create(user=pilot, discord_id=PILOT, username="pilot")
    DiscordAccount.objects.filter(user=officer).delete()
    assert "Link your own" in open_ticket(api_client, officer, pilot).json()["detail"]


def test_no_ticket_with_yourself_and_no_second_open_one(api_client, people, discord):
    officer, pilot = people
    assert open_ticket(api_client, officer, officer).status_code == 400
    assert open_ticket(api_client, officer, pilot).status_code == 200
    assert open_ticket(api_client, officer, pilot).status_code == 409
    assert len(discord.channels) == 2, "the refused one made no channel"
    api_client.call("post", f"{BASE}/tickets/{Ticket.objects.get().pk}/close")
    assert open_ticket(api_client, officer, pilot).status_code == 200


def test_a_refused_channel_leaves_nothing_behind(api_client, people, discord):
    officer, pilot = people
    discord.refuse_channels = True
    resp = open_ticket(api_client, officer, pilot)
    assert resp.status_code == 502 and "Settings" in resp.json()["detail"]
    assert not Ticket.objects.exists()


def test_a_failed_first_message_removes_the_channel(api_client, people, discord):
    officer, pilot = people
    discord.fail_messages = True
    assert open_ticket(api_client, officer, pilot).status_code == 502
    assert not Ticket.objects.exists() and list(discord.channels) == [CATEGORY]


def test_closing_takes_the_member_out_and_keeps_the_channel(api_client, people, discord):
    officer, pilot = people
    ticket = open_ticket(api_client, officer, pilot).json()
    resp = api_client.call("post", f"{BASE}/tickets/{ticket['id']}/close")
    assert resp.status_code == 200 and resp.json()["closed_at"] and resp.json()["url"]
    who, overwrite = discord.overwrites[0]
    assert who == PILOT and int(overwrite["deny"]) & services.VIEW_CHANNEL
    assert len(discord.channels) == 2
    assert api_client.call("post", f"{BASE}/tickets/{ticket['id']}/close").status_code == 400
    assert Notification.objects.filter(user=pilot, title__startswith="Discord ticket closed").exists()


def test_closing_works_after_the_member_unlinked_or_the_channel_went(api_client, people, discord):
    officer, pilot = people
    ticket = open_ticket(api_client, officer, pilot).json()
    DiscordAccount.objects.filter(user=pilot).delete()
    del discord.channels[only_channel(discord)["id"]]
    resp = api_client.call("post", f"{BASE}/tickets/{ticket['id']}/close")
    assert resp.status_code == 200 and resp.json()["url"] is None and not resp.json()["can_delete_channel"]


def test_deleting_the_channel(api_client, people, corp, discord):
    officer, pilot = people
    ticket = open_ticket(api_client, officer, pilot).json()
    url = f"{BASE}/tickets/{ticket['id']}/channel"
    assert api_client.call("delete", url).status_code == 400, "close it first"
    assert api_client.call("post", f"{BASE}/tickets/{ticket['id']}/close").json()["can_delete_channel"]

    colleague = make_user(90000003, "Colleague", corporation=corp)
    colleague.user_permissions.add(Permission.objects.get(codename="open_tickets"))
    api_client.force_login(colleague)
    assert api_client.call("delete", url).status_code == 403
    assert len(discord.channels) == 2

    api_client.force_login(officer)
    resp = api_client.call("delete", url)
    assert resp.status_code == 200 and resp.json()["url"] is None
    assert list(discord.channels) == [CATEGORY] and Ticket.objects.count() == 1


def test_routes_need_the_permissions(api_client, people):
    officer, pilot = people
    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/tickets").status_code == 403
    assert api_client.call("post", f"{BASE}/tickets", {"user_id": officer.pk, "subject": "x"}).status_code == 403
    api_client.force_login(officer)
    assert api_client.call("get", f"{BASE}/tickets").status_code == 200
    assert api_client.call("get", f"{BASE}/settings").status_code == 403


def test_search_finds_mains_and_discord_names_but_not_alts_out_of_reach(api_client, people):
    officer, pilot = people
    Character.objects.create(id=90000009, name="Hidden Alt", owner_hash="h9", user=pilot)
    api_client.force_login(officer)
    found = lambda q: api_client.call("get", f"{BASE}/members?q={q}").json()["items"]  # noqa: E731
    assert [m["id"] for m in found("Pilot")] == [pilot.pk]
    assert found("pilo")[0]["discord"] == "pilot"
    assert found("Officer") == [], "not yourself"
    assert found("Hidden") == [], "an alt the viewer can't see stays hidden"
    officer.user_permissions.add(Permission.objects.get(codename="view_all_characters"))
    assert found("Hidden")[0]["matched"] == "Hidden Alt"


def test_settings_show_problems_and_are_checked(api_client, people, discord):
    officer, _pilot = people
    officer.user_permissions.add(Permission.objects.get(codename="manage_tickets"))
    api_client.force_login(officer)
    assert api_client.call("get", f"{BASE}/settings").json()["problems"] == []
    discord.bot_perms &= ~services.MANAGE_CHANNELS
    out = api_client.call("get", f"{BASE}/settings").json()
    assert out["problems"] == ["The bot's role is missing the Manage Channels permission."]
    assert [r["name"] for r in out["roles"]] == ["Staff"]
    permissions = int(dict(p.split("=") for p in out["invite_url"].split("?")[1].split("&"))["permissions"])
    assert permissions & services.MANAGE_CHANNELS and permissions & discord_api.MANAGE_ROLES

    put = lambda **b: api_client.call("put", f"{BASE}/settings", b)  # noqa: E731
    assert put(category_id="abc").status_code == 400
    assert put(category_id="999").status_code == 400
    assert put(staff_role_id="999").status_code == 400
    resp = put(category_id=CATEGORY, staff_role_id=ROLE_STAFF)
    assert resp.status_code == 200 and resp.json()["category_id"] == CATEGORY
