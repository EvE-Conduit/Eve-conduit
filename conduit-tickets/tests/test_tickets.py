"""Discord Tickets: who ends up in the channel, EVE mail and sending both, what stops a ticket opening, closing and
removing the channel, who may do what, and settings. Discord and ESI are faked."""

import json
import re
import time

import httpx
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from django.contrib.auth.models import Permission
from django.test import Client

from conduit.accounts.models import Character, Token
from conduit.audit.models import AuditEvent
from conduit.esi.exceptions import EsiBackoff, EsiError, TokenInvalid
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_discord import discord_api
from conduit_discord.models import DiscordAccount, DiscordSettings
from conduit_tickets import panels, services, tasks
from conduit_tickets.models import PanelButton, Ticket, TicketAttachment, TicketMessage, TicketPanel, TicketSettings
from tests.conftest import make_user

pytestmark = pytest.mark.django_db

BASE = "/api/p/tickets"
GUILD, BOT, OFFICER, PILOT = "100000000000000001", "200000000000000002", "300000000000000003", "300000000000000004"
CATEGORY, ROLE_STAFF, R_BOT, ROLE_HR = "500000000000000001", "400000000000000001", "400000000000000002", "400000000000000003"
PANEL_CHANNEL, OTHER_CHANNEL = "700000000000000001", "700000000000000002"


class FakeDiscord:
    """Just enough of Discord's API, kept in memory."""

    def __init__(self):
        self.members = {BOT: {"roles": [R_BOT]}, OFFICER: {"roles": []}, PILOT: {"roles": []}}
        self.bot_perms = sum(bit for bit, _ in services.BOT_NEEDS) | discord_api.MANAGE_ROLES
        self.channels: dict[str, dict] = {CATEGORY: {"id": CATEGORY, "type": 4, "guild_id": GUILD}}
        self.overwrites: list[tuple[str, dict]] = []
        self.messages: list[tuple[str, dict]] = []
        self.fail_messages = False
        self.history: dict[str, list[dict]] = {}
        self.hide_text = False
        self.fail_delete = False
        self.files: dict[str, tuple[int, bytes]] = {}
        self.downloads: list[str] = []
        self.app_flags = 1 << 19
        self.refuse_channels = False
        self.verify_key = ""
        self.endpoint = None
        self.answers: list[str] = []
        self.panel_calls: list[tuple[str, str, dict | None]] = []
        self.panel_message_gone = False

    def __call__(self, request: httpx.Request) -> httpx.Response:
        if request.url.host == "cdn.discordapp.com":
            assert "authorization" not in request.headers, "the bot token stays away from file downloads"
            self.downloads.append(str(request.url))
            status, body = self.files.get(request.url.path, (404, b""))
            return httpx.Response(status, content=body)
        path, method = request.url.path.removeprefix("/api/v10"), request.method
        body = json.loads(request.content) if request.content else None
        if path == "/applications/@me":
            return httpx.Response(200, json={"id": "7", "flags": self.app_flags, "verify_key": self.verify_key, "interactions_endpoint_url": self.endpoint})
        if path.startswith("/webhooks/"):
            self.answers.append(body["content"])
            return httpx.Response(200, json={})
        if path == f"/guilds/{GUILD}/channels" and method == "GET":
            return httpx.Response(200, json=[{"id": c, "name": c, "type": 0} for c in (PANEL_CHANNEL, OTHER_CHANNEL)] + [{"id": CATEGORY, "name": "Tickets", "type": 4}])
        if path == "/users/@me":
            return httpx.Response(200, json={"id": BOT, "username": "Conduit"})
        if path == f"/guilds/{GUILD}/roles":
            return httpx.Response(200, json=[
                {"id": GUILD, "name": "@everyone", "position": 0, "permissions": "0"},
                {"id": ROLE_STAFF, "name": "Staff", "position": 1, "permissions": "0"},
                {"id": ROLE_HR, "name": "HR", "position": 3, "permissions": "0", "color": 5},
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
        if path.startswith("/channels/") and path.split("/")[2] in (PANEL_CHANNEL, OTHER_CHANNEL):
            self.panel_calls.append((method, path, body))
            if method == "PATCH" and self.panel_message_gone:
                return httpx.Response(404, json={"message": "Unknown Message", "code": 10008})
            return httpx.Response(200, json={"id": "900000000000000001"})
        if path.startswith("/channels/"):
            parts = path.split("/")
            cid = parts[2]
            if cid not in self.channels:
                return httpx.Response(404, json={"message": "Unknown Channel", "code": 10003})
            if len(parts) == 3 and method == "GET":
                return httpx.Response(200, json=self.channels[cid])
            if len(parts) == 3 and method == "DELETE" and self.fail_delete:
                return httpx.Response(403, json={"message": "Missing Permissions", "code": 50013})
            if len(parts) == 3 and method == "DELETE":
                del self.channels[cid]
                return httpx.Response(200, json={"id": cid})
            if parts[3] == "messages" and method == "GET":
                after, limit = int(request.url.params["after"]), int(request.url.params["limit"])
                # Discord's order within a page isn't one to rely on, so this gives newest first.
                found = sorted((m for m in self.history.get(cid, []) if int(m["id"]) > after), key=lambda m: int(m["id"]))[:limit]
                out = [{**m, "content": ""} if self.hide_text and not m["author"].get("bot") else m for m in reversed(found)]
                return httpx.Response(200, json=out)
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
    TicketSettings.objects.update_or_create(pk=1, defaults={"category_id": CATEGORY, "default_role_ids": [ROLE_STAFF]})
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


def test_closing_takes_the_member_out_straight_away(api_client, people, discord):
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
    assert resp.status_code == 200 and resp.json()["url"] is None


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
    assert [r["name"] for r in out["roles"]] == ["HR", "Staff"]
    permissions = int(dict(p.split("=") for p in out["invite_url"].split("?")[1].split("&"))["permissions"])
    assert permissions & services.MANAGE_CHANNELS and permissions & discord_api.MANAGE_ROLES

    put = lambda **b: api_client.call("put", f"{BASE}/settings", b)  # noqa: E731
    assert put(category_id="abc").status_code == 400
    assert put(category_id="999").status_code == 400
    assert put(default_role_ids=["999"]).status_code == 400
    resp = put(category_id=CATEGORY, default_role_ids=[ROLE_STAFF])
    assert resp.status_code == 200 and resp.json()["category_id"] == CATEGORY


# --- EVE mail ------------------------------------------------------------------------------------------------------


class FakeEsi:
    def __init__(self):
        self.mails = []
        self.fail = None

    def post(self, path, body, *, character=None):
        if self.fail:
            raise self.fail
        self.mails.append((path, body, character.pk))

        class R:
            data = 777

        return R()


@pytest.fixture
def esi(monkeypatch):
    fake = FakeEsi()
    monkeypatch.setattr("conduit.esi.client.esi", lambda: fake)
    return fake


@pytest.fixture
def can_mail(people):
    officer, _pilot = people
    Token.objects.filter(character=officer.main_character).update(scopes="publicData " + services.MAIL_SCOPE)


def test_mail_only_makes_no_channel_and_escapes_the_message(api_client, people, can_mail, discord, esi):
    officer, pilot = people
    DiscordAccount.objects.filter(user=pilot).delete()  # a mail doesn't need Discord
    resp = open_ticket(api_client, officer, pilot, via="mail", message="Mind the <gate>\nToday")
    assert resp.status_code == 200, resp.content
    out = resp.json()
    assert out["via"] == "mail" and out["mail_sent"] and out["url"] is None
    assert list(discord.channels) == [CATEGORY]
    path, body, sender = esi.mails[0]
    assert path == f"/characters/{officer.main_character_id}/mail" and sender == officer.main_character_id
    assert body["recipients"] == [{"recipient_id": pilot.main_character_id, "recipient_type": "character"}]
    assert body["subject"] == "A word" and body["body"].startswith("Mind the &lt;gate&gt;<br>Today<br><br>Ticket opened ") and body["body"].endswith("EVE time") and body["approved_cost"] == 0
    assert Ticket.objects.get().mail_id == 777
    assert AuditEvent.objects.get(action="tickets.opened").details["via"] == "mail"
    assert Notification.objects.filter(user=pilot, title="EVE mail: A word").exists()
    closed = api_client.call("post", f"{BASE}/tickets/{out['id']}/close").json()
    assert closed["closed_at"] and not discord.overwrites


def test_both_makes_the_channel_and_links_it_in_the_mail(api_client, people, can_mail, discord, esi):
    officer, pilot = people
    out = open_ticket(api_client, officer, pilot, via="both", message="Hello").json()
    assert out["url"] and out["mail_sent"] and out["mail_error"] == ""
    assert out["url"] in esi.mails[0][1]["body"] and "Hello" in esi.mails[0][1]["body"]
    assert discord.messages


def test_both_without_a_message_still_links_the_channel(api_client, people, can_mail, esi):
    officer, pilot = people
    out = open_ticket(api_client, officer, pilot, via="both").json()
    assert esi.mails[0][1]["body"].startswith("Private Discord channel:") and out["url"] in esi.mails[0][1]["body"]


def test_both_keeps_the_channel_and_says_so_when_the_mail_fails(api_client, people, can_mail, discord, esi):
    officer, pilot = people
    esi.fail = EsiError(520, "CSPA")
    resp = open_ticket(api_client, officer, pilot, via="both", message="Hello")
    assert resp.status_code == 200
    assert resp.json()["url"] and not resp.json()["mail_sent"] and "may charge" in resp.json()["mail_error"]
    assert len(discord.channels) == 2 and Ticket.objects.get().mail_error


def test_both_sends_no_mail_when_the_channel_fails(api_client, people, can_mail, discord, esi):
    officer, pilot = people
    discord.refuse_channels = True
    assert open_ticket(api_client, officer, pilot, via="both", message="Hello").status_code == 502
    assert esi.mails == [] and not Ticket.objects.exists()


@pytest.mark.parametrize("failure,status,word", [
    (EsiError(520, "CSPA"), 502, "may charge"),
    (EsiError(500, "boom"), 502, "didn't take"),
    (EsiBackoff(60, "paused"), 503, "busy"),
    (TokenInvalid(), 409, "log in"),
])
def test_a_failed_mail_only_ticket_leaves_nothing_behind(api_client, people, can_mail, esi, failure, status, word):
    officer, pilot = people
    esi.fail = failure
    resp = open_ticket(api_client, officer, pilot, via="mail", message="Hello")
    assert resp.status_code == status and word in resp.json()["detail"]
    assert not Ticket.objects.exists()


def test_mail_needs_the_scope_a_message_and_a_real_choice(api_client, people, esi):
    officer, pilot = people
    api_client.force_login(officer)
    assert not api_client.call("get", f"{BASE}/sender").json()["can_mail"]
    resp = open_ticket(api_client, officer, pilot, via="both", message="Hello")
    assert resp.status_code == 409 and "allowed sending mail" in resp.json()["detail"]
    assert not Ticket.objects.exists() and esi.mails == []
    Token.objects.filter(character=officer.main_character).update(scopes=services.MAIL_SCOPE)
    assert api_client.call("get", f"{BASE}/sender").json() == {"name": "Officer One", "can_mail": True, "problem": ""}
    assert "message" in open_ticket(api_client, officer, pilot, via="mail").json()["detail"]
    assert open_ticket(api_client, officer, pilot, via="pigeon").status_code == 400


def test_a_second_open_ticket_sends_no_second_mail(api_client, people, can_mail, esi):
    officer, pilot = people
    assert open_ticket(api_client, officer, pilot, via="mail", message="One").status_code == 200
    assert open_ticket(api_client, officer, pilot, via="mail", message="Two").status_code == 409
    assert len(esi.mails) == 1


def test_search_finds_members_without_discord(api_client, people):
    officer, pilot = people
    DiscordAccount.objects.filter(user=pilot).delete()
    api_client.force_login(officer)
    found = api_client.call("get", f"{BASE}/members?q=Pilot").json()["items"]
    assert found[0]["id"] == pilot.pk and found[0]["discord"] is None and found[0]["on_server"] is False


# --- transcripts ---------------------------------------------------------------------------------------------------


def said(n, author=PILOT, content="Hello", **extra):
    return {"id": str(700000000000000000 + n), "type": 0, "content": content, "timestamp": f"2026-10-30T12:{n // 60:02d}:{n % 60:02d}+00:00",
            "author": {"id": author, "username": f"user{author[-1]}", **extra.pop("author_extra", {})}, **extra}


def file(name, fid="1", size=4, kind="image/png", url=None):
    return {"id": fid, "filename": name, "size": size, "content_type": kind, "url": url or f"https://cdn.discordapp.com/f/{fid}/{name}?ex=abc"}


def closed_ticket(api_client, people, discord, history):
    officer, pilot = people
    out = open_ticket(api_client, officer, pilot).json()
    discord.history[only_channel(discord)["id"]] = history
    assert api_client.call("post", f"{BASE}/tickets/{out['id']}/close").status_code == 200
    return Ticket.objects.get(pk=out["id"])


def test_closing_saves_the_whole_channel_across_pages(api_client, people, discord):
    ticket = closed_ticket(api_client, people, discord, [said(n, content=f"Line {n}") for n in range(1, 251)])
    assert ticket.archive_state == "pending"
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "done" and ticket.archive_error == ""
    assert ticket.channel_gone and list(discord.channels) == [CATEGORY], "the channel goes once it's saved"
    assert AuditEvent.objects.filter(action="tickets.channel_deleted").exists()
    assert api_client.call("get", f"{BASE}/tickets").json()["items"][0]["url"] is None
    out = api_client.call("get", f"{BASE}/tickets/{ticket.pk}/messages?limit=500").json()
    assert out["count"] == 250
    assert [m["content"] for m in out["items"]] == [f"Line {n}" for n in range(1, 251)], "oldest first"
    tasks.archive_pending()
    assert TicketMessage.objects.count() == 250


def test_transcript_shows_character_names_files_and_skips_system_messages(api_client, people, discord):
    officer, _pilot = people
    ticket = closed_ticket(api_client, people, discord, [
        said(1, content=f"Hi <@{OFFICER}>", mentions=[{"id": OFFICER, "username": "officer"}]),
        said(2, author="399", content="", attachments=[file("fit.png")], author_extra={"global_name": "Stranger"}),
        said(3, author=BOT, content="Bot talk", author_extra={"bot": True}),
        {**said(4), "type": 6},
        said(5, embeds=[{"title": "T", "description": "D"}], edited_timestamp="2026-10-30T13:00:00+00:00"),
    ])
    tasks.archive_pending()
    items = api_client.call("get", f"{BASE}/tickets/{ticket.pk}/messages").json()["items"]
    assert [m["author"] for m in items] == ["Pilot Two", "Stranger", "user2", "Pilot Two"]
    assert items[0]["content"] == "Hi @Officer One"
    assert items[1]["attachments"][0]["name"] == "fit.png" and items[1]["attachments"][0]["state"] == "unavailable"
    assert items[2]["is_bot"] and items[3]["embeds"] == [{"title": "T", "description": "D"}] and items[3]["edited_at"]


def test_hidden_text_is_retried_until_the_intent_is_on(api_client, people, discord):
    ticket = closed_ticket(api_client, people, discord, [said(1, content="Secret")])
    discord.hide_text = True
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "pending" and "Message Content Intent" in ticket.archive_error
    assert len(discord.channels) == 2, "removing it would lose the text for good"
    discord.hide_text = False
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "done" and ticket.messages.get().content == "Secret"
    assert ticket.channel_gone and list(discord.channels) == [CATEGORY]


def test_a_failed_save_keeps_the_ticket_waiting(api_client, people, discord, monkeypatch):
    ticket = closed_ticket(api_client, people, discord, [said(1)])

    def down(*a, **k):
        raise discord_api.DiscordError(0, "Couldn't reach Discord")

    with monkeypatch.context() as m:
        m.setattr(discord_api, "call", down)
        tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "pending" and "reach Discord" in ticket.archive_error
    assert len(discord.channels) == 2, "the channel stays until its transcript is saved"
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "done" and ticket.archive_error == ""


def test_a_channel_deleted_on_discord_is_reported_lost(api_client, people, discord):
    ticket = closed_ticket(api_client, people, discord, [said(1)])
    del discord.channels[ticket.channel_id]
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "lost" and ticket.channel_gone and services.pending_archives() == []


def test_closing_a_channel_already_gone_is_lost_and_mail_only_has_nothing_to_save(api_client, people, can_mail, discord, esi):
    officer, pilot = people
    out = open_ticket(api_client, officer, pilot).json()
    del discord.channels[only_channel(discord)["id"]]
    assert api_client.call("post", f"{BASE}/tickets/{out['id']}/close").json()["archive_state"] == "lost"
    mail = open_ticket(api_client, officer, pilot, via="mail", message="The text").json()
    closed = api_client.call("post", f"{BASE}/tickets/{mail['id']}/close").json()
    assert closed["archive_state"] == ""
    assert api_client.call("get", f"{BASE}/tickets/{mail['id']}").json()["message"] == "The text"


def test_reading_is_audited_and_needs_the_permission(api_client, people, discord):
    officer, pilot = people
    ticket = closed_ticket(api_client, people, discord, [said(1)])
    assert api_client.call("get", f"{BASE}/tickets/{ticket.pk}").status_code == 200
    assert AuditEvent.objects.filter(action="tickets.transcript_read", actor_id=officer.pk).exists()
    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/tickets/{ticket.pk}").status_code == 403
    assert api_client.call("get", f"{BASE}/tickets/{ticket.pk}/messages").status_code == 403


def test_settings_warn_when_the_intent_is_off(api_client, people, discord):
    officer, _pilot = people
    officer.user_permissions.add(Permission.objects.get(codename="manage_tickets"))
    api_client.force_login(officer)
    discord.app_flags = 0
    assert "Message Content Intent" in api_client.call("get", f"{BASE}/settings").json()["problems"][0]


def test_removing_the_channel_is_tried_again_and_keeps_the_transcript(api_client, people, discord):
    ticket = closed_ticket(api_client, people, discord, [said(1)])
    discord.fail_delete = True
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "done" and not ticket.channel_gone and "isn't allowed" in ticket.archive_error
    assert ticket.messages.count() == 1
    discord.history[ticket.channel_id].append(said(2, content="One more"))
    discord.fail_delete = False
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.channel_gone and ticket.archive_error == "" and services.pending_archives() == []
    assert [m.content for m in ticket.messages.all()] == ["Hello", "One more"], "what was said meanwhile is kept too"


# --- attached files ------------------------------------------------------------------------------------------------


def only_file(api_client, ticket):
    return api_client.call("get", f"{BASE}/tickets/{ticket.pk}/messages").json()["items"][0]["attachments"][0]


def test_files_are_copied_before_the_channel_goes_and_can_be_fetched(api_client, people, discord):
    discord.files["/f/1/fit.png"] = (200, b"\x89PNG")
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[file("fit.png")])])
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.channel_gone
    a = only_file(api_client, ticket)
    assert a["state"] == "saved" and a["image"] and a["size"] == 4
    resp = api_client.call("get", f"{BASE}/attachments/{a['id']}")
    assert resp.status_code == 200 and resp.content == b"\x89PNG" and resp["Content-Type"] == "image/png"
    assert resp["Content-Disposition"].startswith("inline") and "sandbox" in resp["Content-Security-Policy"]


@pytest.mark.parametrize("name,kind", [("evil.html", "text/html"), ("evil.svg", "image/svg+xml"), ("evil.png", "text/html; charset=utf-8"), ("x", "")])
def test_anything_but_a_plain_image_only_downloads(api_client, people, discord, name, kind):
    discord.files[f"/f/1/{name}"] = (200, b"<script>alert(1)</script>")
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[file(name, kind=kind)])])
    tasks.archive_pending()
    a = only_file(api_client, ticket)
    assert not a["image"]
    resp = api_client.call("get", f"{BASE}/attachments/{a['id']}")
    assert resp["Content-Type"] == "application/octet-stream" and resp["Content-Disposition"].startswith("attachment")
    assert resp["X-Content-Type-Options"] == "nosniff"


def test_files_need_the_permission(api_client, people, discord):
    _officer, pilot = people
    discord.files["/f/1/fit.png"] = (200, b"data")
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[file("fit.png")])])
    tasks.archive_pending()
    a = only_file(api_client, ticket)
    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/attachments/{a['id']}").status_code == 403


def test_a_failed_download_keeps_the_channel_and_is_tried_again(api_client, people, discord):
    discord.files["/f/1/fit.png"] = (500, b"")
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[file("fit.png")])])
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.archive_state == "pending" and not ticket.channel_gone and "attached file" in ticket.archive_error
    discord.files["/f/1/fit.png"] = (200, b"data")
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.channel_gone and TicketAttachment.objects.get().state == "saved"


def test_a_file_already_saved_is_not_fetched_again(api_client, people, discord):
    discord.files["/f/1/a.png"] = (200, b"data")
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[file("a.png")]), said(2, attachments=[file("b.png", fid="2")])])
    discord.files["/f/2/b.png"] = (500, b"")
    tasks.archive_pending()
    discord.files["/f/2/b.png"] = (200, b"more")
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.channel_gone and TicketAttachment.objects.count() == 2
    assert sum("/f/1/" in u for u in discord.downloads) == 1


def test_files_over_the_limits_are_listed_but_do_not_block_closing(api_client, people, discord, monkeypatch):
    monkeypatch.setattr(services, "MAX_FILE_BYTES", 10)
    monkeypatch.setattr(services, "MAX_TICKET_BYTES", 14)
    discord.files["/f/1/stated.bin"] = (200, b"x")
    discord.files["/f/2/lied.bin"] = (200, b"x" * 11)
    discord.files["/f/3/ok.bin"] = (200, b"x" * 9)
    discord.files["/f/4/full.bin"] = (200, b"x" * 9)
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[
        file("stated.bin", fid="1", size=11), file("lied.bin", fid="2", size=1), file("ok.bin", fid="3", size=9), file("full.bin", fid="4", size=9)])])
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.channel_gone
    assert list(TicketAttachment.objects.values_list("name", "state")) == [
        ("stated.bin", "too_big"), ("lied.bin", "too_big"), ("ok.bin", "saved"), ("full.bin", "too_big")]
    assert not any("stated" in u for u in discord.downloads), "not even fetched"


def test_files_are_only_fetched_from_discord(api_client, people, discord):
    ticket = closed_ticket(api_client, people, discord, [said(1, attachments=[file("a.png", url="https://169.254.169.254/latest")])])
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.channel_gone and TicketAttachment.objects.get().state == "unavailable" and discord.downloads == []
    a = TicketAttachment.objects.get()
    assert api_client.call("get", f"{BASE}/attachments/{a.pk}").status_code == 404


# --- who sees it, and when ------------------------------------------------------------------------------------------


def role_overwrites(discord):
    return {o["id"] for o in only_channel(discord)["permission_overwrites"] if o["type"] == 0 and o["id"] != GUILD}


def test_the_roles_picked_see_the_channel_instead_of_the_defaults(api_client, people, discord):
    officer, pilot = people
    TicketSettings.objects.update_or_create(pk=1, defaults={"default_role_ids": [ROLE_STAFF]})
    out = open_ticket(api_client, officer, pilot, role_ids=[ROLE_HR]).json()
    assert role_overwrites(discord) == {ROLE_HR}
    assert out["roles"] == [{"id": ROLE_HR, "name": "HR"}]


def test_no_roles_means_only_the_two_of_them(api_client, people, discord):
    officer, pilot = people
    TicketSettings.objects.update_or_create(pk=1, defaults={"default_role_ids": [ROLE_STAFF]})
    assert open_ticket(api_client, officer, pilot, role_ids=[]).status_code == 200
    assert role_overwrites(discord) == set()


def test_defaults_are_used_when_none_are_given_and_deleted_ones_left_off(api_client, people, discord):
    officer, pilot = people
    TicketSettings.objects.update_or_create(pk=1, defaults={"default_role_ids": [ROLE_STAFF, "999"]})
    assert open_ticket(api_client, officer, pilot).status_code == 200
    assert role_overwrites(discord) == {ROLE_STAFF}


@pytest.mark.parametrize("bad", [GUILD, R_BOT, "999"])
def test_everyone_bot_and_unknown_roles_cant_be_picked(api_client, people, discord, bad):
    officer, pilot = people
    resp = open_ticket(api_client, officer, pilot, role_ids=[bad])
    assert resp.status_code == 400 and not Ticket.objects.exists() and list(discord.channels) == [CATEGORY]


def test_openers_get_the_roles_to_pick_from(api_client, people, discord):
    officer, pilot = people
    TicketSettings.objects.update_or_create(pk=1, defaults={"default_role_ids": [ROLE_STAFF, "999"]})
    api_client.force_login(officer)
    out = api_client.call("get", f"{BASE}/roles").json()
    assert [r["id"] for r in out["roles"]] == [ROLE_HR, ROLE_STAFF] and out["defaults"] == [ROLE_STAFF] and out["error"] == ""
    api_client.force_login(pilot)
    assert api_client.call("get", f"{BASE}/roles").status_code == 403


def test_mail_only_ignores_roles_and_asks_discord_nothing(api_client, people, can_mail, esi, discord, monkeypatch):
    officer, pilot = people
    monkeypatch.setattr(discord_api, "roles", lambda *a: pytest.fail("no Discord call for a mail"))
    out = open_ticket(api_client, officer, pilot, via="mail", message="Hi", role_ids=[ROLE_HR]).json()
    assert out["roles"] == []


def test_times_are_on_the_ticket_in_discord_and_readable_in_the_transcript(api_client, people, discord):
    officer, pilot = people
    out = open_ticket(api_client, officer, pilot).json()
    assert out["opened_at"] and out["closed_at"] is None
    first = discord.messages[0][1]["content"]
    assert re.search(r"opened this ticket <t:\d+:F>", first)
    closed = api_client.call("post", f"{BASE}/tickets/{out['id']}/close").json()
    assert closed["closed_at"]
    assert re.search(r"closed by Officer One <t:\d+:F>", discord.messages[1][1]["content"])
    channel = only_channel(discord)["id"]
    discord.history[channel] = [said(1, author=BOT, content="Opened <t:1793000000:F> ok", author_extra={"bot": True})]
    tasks.archive_pending()
    assert TicketMessage.objects.get().content == "Opened 26 Oct 2026 07:33 EVE time ok"


@pytest.mark.django_db(transaction=True)
def test_upgrading_keeps_the_staff_role():
    from django.db import connection
    from django.db.migrations.executor import MigrationExecutor

    executor = MigrationExecutor(connection)
    executor.migrate([("tickets", "0003_transcripts")])
    old = executor.loader.project_state([("tickets", "0003_transcripts")]).apps
    old.get_model("tickets", "TicketSettings").objects.create(pk=1, staff_role_id=ROLE_STAFF)
    fields = {"subject": "s", "opened_by_name": "a", "target_name": "b"}
    old.get_model("tickets", "Ticket").objects.create(channel_id="1", **fields)
    old.get_model("tickets", "Ticket").objects.create(via="mail", **fields)

    executor = MigrationExecutor(connection)
    executor.migrate([("tickets", "0005_panels")])
    assert TicketSettings.load().default_role_ids == [ROLE_STAFF]
    assert Ticket.objects.get(channel_id="1").roles == [{"id": ROLE_STAFF, "name": "Staff role"}]
    assert Ticket.objects.get(via="mail").roles == []


# --- panels -----------------------------------------------------------------------------------------------------------

URL = "/api/public/p/tickets/interactions"
KEY = Ed25519PrivateKey.generate()


@pytest.fixture
def signed(people):
    TicketSettings.objects.update_or_create(pk=1, defaults={"public_key": KEY.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw).hex()})


def post(payload, key=KEY, age=0, signature=None):
    body, stamp = json.dumps(payload), str(int(time.time()) - age)
    sig = signature if signature is not None else key.sign(stamp.encode() + body.encode()).hex()
    return Client(enforce_csrf_checks=True).post(URL, body, content_type="application/json", headers={"X-Signature-Ed25519": sig, "X-Signature-Timestamp": stamp})


def clicked(custom_id, who=PILOT, roles=(), kind=3, **data):
    return {"type": kind, "guild_id": GUILD, "application_id": "7", "token": "tok", "member": {"user": {"id": who}, "roles": list(roles)},
            "data": {"custom_id": custom_id, **data}}


def form(button, subject="Help", message="Please"):
    rows = [{"type": 1, "components": [{"custom_id": "subject", "value": subject}]}, {"type": 1, "components": [{"custom_id": "message", "value": message}]}]
    return clicked(f"tickets:form:{button.pk}", kind=5, components=rows)


def make_button(role_ids=(ROLE_STAFF,), category_id=""):
    panel = TicketPanel.objects.create(channel_id=PANEL_CHANNEL, message_id="9", title="Help")
    return PanelButton.objects.create(panel=panel, label="Recruitment", role_ids=list(role_ids), category_id=category_id)


@pytest.fixture
def run_tasks(monkeypatch):
    monkeypatch.setattr(tasks.open_from_panel, "delay", lambda *a: tasks.open_from_panel(*a))
    monkeypatch.setattr(tasks.close_from_discord, "delay", lambda *a: tasks.close_from_discord(*a))


@pytest.mark.parametrize("attempt", [
    {"key": Ed25519PrivateKey.generate()}, {"signature": ""}, {"signature": "zz"}, {"age": 3600},
])
def test_clicks_without_discords_signature_are_refused(signed, attempt):
    assert post({"type": 1}, **attempt).status_code == 401


def test_no_key_yet_refuses_everything(people):
    assert post({"type": 1}).status_code == 401


def test_discords_ping_is_answered(signed):
    resp = post({"type": 1})
    assert resp.status_code == 200 and resp.json() == {"type": 1}


def test_clicking_asks_for_a_subject(signed):
    button = make_button()
    data = post(clicked(f"tickets:open:{button.pk}")).json()
    assert data["type"] == panels.SHOW_MODAL and data["data"]["custom_id"] == f"tickets:form:{button.pk}"


def test_people_who_have_not_linked_are_told_to_link(signed, discord, run_tasks):
    button = make_button()
    for attempt in (clicked(f"tickets:open:{button.pk}", who="999"), {**form(button), "member": {"user": {"id": "999"}}}):
        data = post(attempt).json()
        assert data["type"] == panels.REPLY and data["data"]["flags"] == panels.EPHEMERAL and "/p/discord" in data["data"]["content"]
    assert not Ticket.objects.exists()


def test_another_server_is_refused(signed):
    button = make_button()
    assert "own Discord server" in post({**clicked(f"tickets:open:{button.pk}"), "guild_id": "1"}).json()["data"]["content"]


def test_submitting_opens_a_private_channel_and_pings_the_roles(signed, people, discord, run_tasks):
    _officer, pilot = people
    button = make_button(role_ids=[ROLE_STAFF, "400000000000000099"], category_id=CATEGORY)
    assert post(form(button, message="Help @everyone")).json()["type"] == panels.DEFERRED_REPLY
    ticket = Ticket.objects.get()
    assert (ticket.opened_by, ticket.target, ticket.panel_label) == (pilot, pilot, "Recruitment")
    assert ticket.roles == [{"id": ROLE_STAFF, "name": "Staff"}], "a role since deleted is left off"
    channel = only_channel(discord)
    assert channel["parent_id"] == CATEGORY
    assert sorted(o["id"] for o in channel["permission_overwrites"]) == sorted([GUILD, BOT, PILOT, ROLE_STAFF]), "one overwrite each"
    _cid, message = discord.messages[0]
    assert message["allowed_mentions"] == {"users": [PILOT], "roles": [ROLE_STAFF]}
    assert message["components"][0]["components"][0]["custom_id"] == f"tickets:close:{ticket.pk}"
    assert discord.answers == [f"Your ticket is open: {services.channel_url(ticket)}"]


def test_one_open_ticket_per_button_and_a_cooldown(signed, people, discord, run_tasks):
    button = make_button()
    post(form(button))
    assert "already have a ticket" in post(clicked(f"tickets:open:{button.pk}")).json()["data"]["content"]
    other = PanelButton.objects.create(panel=button.panel, label="Other", role_ids=[ROLE_STAFF])
    assert "only just" in post(clicked(f"tickets:open:{other.pk}")).json()["data"]["content"]
    post(form(button))
    assert Ticket.objects.count() == 1 and "already have a ticket" in discord.answers[-1]
    Ticket.objects.update(opened_at=Ticket.objects.get().opened_at - panels.COOLDOWN)
    post(form(other))
    assert Ticket.objects.count() == 2, "another button can have its own"


def test_panel_tickets_and_staff_tickets_do_not_block_each_other(api_client, signed, people, discord, run_tasks):
    officer, pilot = people
    assert open_ticket(api_client, officer, pilot).status_code == 200
    post(form(make_button()))
    assert Ticket.objects.count() == 2


def test_a_refused_channel_is_explained_and_leaves_nothing(signed, discord, run_tasks):
    discord.refuse_channels = True
    post(form(make_button()))
    assert not Ticket.objects.exists() and "isn't allowed" in discord.answers[0]


def test_buttons_without_roles_left_say_so(signed, discord, run_tasks):
    post(form(make_button(role_ids=["400000000000000099"])))
    assert not Ticket.objects.exists() and "ask staff" in discord.answers[0]


def test_deleted_button_says_it_no_longer_works(signed):
    assert "no longer works" in post(clicked("tickets:open:12345")).json()["data"]["content"]
    assert "no longer works" in post(clicked("tickets:nonsense")).json()["data"]["content"]


def open_panel_ticket(button=None):
    post(form(button or make_button()))
    return Ticket.objects.get()


def test_closing_from_discord_asks_first(signed, discord, run_tasks):
    ticket = open_panel_ticket()
    data = post(clicked(f"tickets:close:{ticket.pk}")).json()
    assert data["data"]["components"][0]["components"][0]["custom_id"] == f"tickets:closeyes:{ticket.pk}"
    ticket.refresh_from_db()
    assert ticket.closed_at is None
    assert post(clicked(f"tickets:closeyes:{ticket.pk}")).json()["type"] == panels.DEFERRED_REPLY
    tasks.archive_pending()
    ticket.refresh_from_db()
    assert ticket.closed_at and ticket.archive_state == Ticket.ARCHIVE_DONE and ticket.channel_gone
    assert not Notification.objects.filter(title__startswith="Discord ticket closed").exists(), "they closed it themselves"
    assert "already closed" in post(clicked(f"tickets:closeyes:{ticket.pk}")).json()["data"]["content"]


def test_who_can_close_from_discord(signed, people, discord, run_tasks):
    officer, pilot = people
    officer.user_permissions.clear()
    stranger = make_user(90000003, "Third Pilot")
    DiscordAccount.objects.create(user=stranger, discord_id="333", username="third")
    ticket = open_panel_ticket()
    assert "can't close" in post(clicked(f"tickets:closeyes:{ticket.pk}", who="333")).json()["data"]["content"]
    ticket.refresh_from_db()
    assert ticket.closed_at is None
    assert post(clicked(f"tickets:close:{ticket.pk}", who="333", roles=[ROLE_STAFF])).json()["data"]["components"], "holds a role of the ticket"
    stranger.user_permissions.add(Permission.objects.get(codename="open_tickets"))
    assert post(clicked(f"tickets:close:{ticket.pk}", who="333")).json()["data"]["components"], "staff"


def test_a_member_staff_opened_a_ticket_with_cannot_close_it(api_client, signed, people, discord):
    officer, pilot = people
    ticket = open_ticket(api_client, officer, pilot).json()
    assert "can't close" in post(clicked(f"tickets:close:{ticket['id']}")).json()["data"]["content"]


def test_people_read_their_own_panel_tickets_only(api_client, signed, people, discord, run_tasks):
    officer, pilot = people
    staff_ticket = open_ticket(api_client, officer, pilot).json()
    post(form(make_button()))
    ticket = Ticket.objects.exclude(panel_label="").get()
    api_client.force_login(pilot)
    assert [t["id"] for t in api_client.call("get", f"{BASE}/mine").json()["items"]] == [ticket.pk]
    assert api_client.call("get", f"{BASE}/tickets/{ticket.pk}").json()["mine"] is True
    assert api_client.call("get", f"{BASE}/tickets/{ticket.pk}/messages").status_code == 200
    assert api_client.call("get", f"{BASE}/tickets/{staff_ticket['id']}").status_code == 403
    other = make_user(90000003, "Third Pilot")
    api_client.force_login(other)
    assert api_client.call("get", f"{BASE}/mine").json()["items"] == []
    assert api_client.call("get", f"{BASE}/tickets/{ticket.pk}").status_code == 403


def panel_body(**extra):
    return {"channel_id": PANEL_CHANNEL, "title": "Need help?", "text": "Click below", "buttons": [{"label": "Recruitment", "role_ids": [ROLE_STAFF]}], **extra}


@pytest.fixture
def manager(people):
    officer, _pilot = people
    officer.user_permissions.add(Permission.objects.get(codename="manage_tickets"))
    return officer


def test_panels_need_the_permission(api_client, people):
    officer, _pilot = people
    api_client.force_login(officer)
    assert api_client.call("get", f"{BASE}/panels").status_code == 403
    assert api_client.call("post", f"{BASE}/panels", panel_body()).status_code == 403


def test_posting_a_panel(api_client, manager, discord):
    api_client.force_login(manager)
    resp = api_client.call("post", f"{BASE}/panels", panel_body())
    assert resp.status_code == 200, resp.content
    button = PanelButton.objects.get()
    method, path, body = discord.panel_calls[-1]
    assert (method, path) == ("POST", f"/channels/{PANEL_CHANNEL}/messages")
    assert body["embeds"][0] == {"title": "Need help?", "description": "Click below"}
    assert body["components"][0]["components"][0]["custom_id"] == f"tickets:open:{button.pk}"
    assert TicketPanel.objects.get().message_id == "900000000000000001"
    assert AuditEvent.objects.filter(action="tickets.panel_saved").exists()


@pytest.mark.parametrize("change,word", [
    ({"title": " "}, "title"), ({"text": "x" * 2001}, "text"), ({"buttons": []}, "buttons"), ({"channel_id": CATEGORY}, "channel"),
    ({"buttons": [{"label": "A", "role_ids": []}]}, "roles"), ({"buttons": [{"label": "", "role_ids": [ROLE_STAFF]}]}, "label"),
    ({"buttons": [{"label": "A", "role_ids": [GUILD]}]}, "role"), ({"buttons": [{"label": "A", "role_ids": [R_BOT]}]}, "role"),
    ({"buttons": [{"label": "A", "role_ids": [ROLE_STAFF], "category_id": "1"}]}, "category"),
    ({"buttons": [{"label": str(i), "role_ids": [ROLE_STAFF]} for i in range(6)]}, "buttons"),
])
def test_bad_panels_are_refused(api_client, manager, change, word):
    api_client.force_login(manager)
    resp = api_client.call("post", f"{BASE}/panels", panel_body(**change))
    assert resp.status_code == 400 and word in resp.json()["detail"]
    assert not TicketPanel.objects.exists()


def test_editing_keeps_the_message_and_button_ids(api_client, manager, discord):
    api_client.force_login(manager)
    panel = api_client.call("post", f"{BASE}/panels", panel_body()).json()
    kept = panel["buttons"][0]["id"]
    resp = api_client.call("put", f"{BASE}/panels/{panel['id']}", panel_body(title="New", buttons=[
        {"id": kept, "label": "Renamed", "role_ids": [ROLE_HR]}, {"label": "Added", "role_ids": [ROLE_STAFF]}]))
    assert resp.status_code == 200, resp.content
    assert discord.panel_calls[-1][0] == "PATCH" and PanelButton.objects.get(pk=kept).label == "Renamed" and PanelButton.objects.count() == 2


def test_editing_posts_again_if_the_message_was_deleted(api_client, manager, discord):
    api_client.force_login(manager)
    panel = api_client.call("post", f"{BASE}/panels", panel_body()).json()
    discord.panel_message_gone = True
    assert api_client.call("put", f"{BASE}/panels/{panel['id']}", panel_body()).status_code == 200
    assert [c[0] for c in discord.panel_calls[-2:]] == ["PATCH", "POST"]


def test_moving_a_panel_removes_the_old_message(api_client, manager, discord):
    api_client.force_login(manager)
    panel = api_client.call("post", f"{BASE}/panels", panel_body()).json()
    assert api_client.call("put", f"{BASE}/panels/{panel['id']}", panel_body(channel_id=OTHER_CHANNEL)).status_code == 200
    assert discord.panel_calls[-1][:2] == ("DELETE", f"/channels/{PANEL_CHANNEL}/messages/900000000000000001")


def test_deleting_a_panel_leaves_its_tickets_open(api_client, signed, manager, discord, run_tasks):
    button = make_button()
    post(form(button))
    api_client.force_login(manager)
    assert api_client.call("delete", f"{BASE}/panels/{button.panel_id}").status_code == 200
    ticket = Ticket.objects.get()
    assert ticket.closed_at is None and ticket.panel_button is None and ticket.panel_label == "Recruitment"


def test_the_page_remembers_the_key_and_warns_about_the_address(api_client, manager, discord, settings):
    settings.SITE_URL = "https://corp.example"
    discord.verify_key = "ab" * 32
    api_client.force_login(manager)
    data = api_client.call("get", f"{BASE}/panels").json()
    assert TicketSettings.load().public_key == "ab" * 32
    assert data["endpoint_url"] == f"https://corp.example{URL}" and any("Interactions Endpoint" in p for p in data["problems"])
    discord.endpoint = data["endpoint_url"]
    assert api_client.call("get", f"{BASE}/panels").json()["problems"] == []
    settings.SITE_URL = "http://localhost:5173"
    assert any("public https" in p for p in api_client.call("get", f"{BASE}/panels").json()["problems"])
