"""Recruitment: applying, the review queue, notes and messages, sheet access and accepting into groups."""

import pytest
from django.contrib.auth.models import Group, Permission

from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sheet.access import can_view
from conduit_recruitment import services
from conduit_recruitment.models import Application, Form
from tests.conftest import make_user

QUESTIONS = [
    {"id": "why", "label": "Why do you want to join?", "kind": "long", "required": True},
    {"id": "tz", "label": "Time zone", "kind": "choice", "choices": ["EU", "US", "AU"], "required": True},
    {"id": "alts", "label": "Do you have alts?", "kind": "yesno"},
]


@pytest.fixture
def setup(db):
    sync_installed()
    set_enabled("recruit", True)
    members = Group.objects.create(name="Members")
    form = Form.objects.create(name="Join Conduit Industries", questions=QUESTIONS)
    form.accept_groups.add(members)
    recruiter = make_user(90000050, "Recruiter Rae")
    recruiter.user_permissions.add(*Permission.objects.filter(content_type__app_label="recruit"))
    applicant = make_user(90000060, "Hopeful Pilot", member=False)  # applicants are guests; Recruitment is open to them
    return form, recruiter, applicant, members


def answers(**extra):
    return {"why": "Good people", "tz": "EU", "alts": True, **extra}


def test_apply_notifies_recruiters_and_announces(setup, api_client, monkeypatch):
    form, recruiter, applicant, _ = setup
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: emitted.append(name))
    api_client.force_login(applicant)
    me = api_client.call("get", "/api/p/recruit/me").json()
    assert [f["name"] for f in me["forms"]] == ["Join Conduit Industries"] and me["current"] is None

    bad = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": {"tz": "EU"}})
    assert bad.status_code == 400 and "Why do you want to join" in bad.json()["detail"]
    bad = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers(tz="Mars")})
    assert "Pick one of the choices" in bad.json()["detail"]

    ok = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()})
    assert ok.status_code == 200 and ok.json()["status"] == "new"
    assert "characters" not in ok.json()  # applicants don't get the recruiter's view
    assert Notification.objects.filter(user=recruiter, title="New application from Hopeful Pilot").exists()
    assert "recruit.application_submitted" in emitted
    again = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()})
    assert "already have an application" in again.json()["detail"]


def test_recruiters_see_the_queue_and_sheets_only_while_open(setup, api_client):
    form, recruiter, applicant, _ = setup
    stranger = make_user(90000070, "Stranger")
    char = applicant.main_character
    assert not can_view(recruiter, char)
    app = services.apply(applicant, form, answers())
    assert can_view(recruiter, char) and not can_view(stranger, char)

    api_client.force_login(recruiter)
    queue = api_client.call("get", "/api/p/recruit/applications").json()
    assert queue["counts"]["new"] == 1 and queue["items"][0]["user"]["name"] == "Hopeful Pilot"
    detail = api_client.call("get", f"/api/p/recruit/applications/{app.pk}").json()
    assert detail["characters"][0]["name"] == "Hopeful Pilot" and detail["questions"][1]["answer"] == "EU"
    assert api_client.call("get", f"/api/characters/{char.pk}").status_code == 200

    api_client.call("post", f"/api/p/recruit/applications/{app.pk}/decide", {"accept": False, "message": "Not right now"})
    assert not can_view(recruiter, char)
    api_client.force_login(stranger)
    assert api_client.call("get", "/api/p/recruit/applications").status_code == 403
    assert api_client.call("get", f"/api/p/recruit/applications/{app.pk}").status_code == 404


def test_internal_notes_stay_internal(setup, api_client):
    form, recruiter, applicant, _ = setup
    app = services.apply(applicant, form, answers())
    api_client.force_login(recruiter)
    api_client.call("post", f"/api/p/recruit/applications/{app.pk}/claim")
    api_client.call("post", f"/api/p/recruit/applications/{app.pk}/comments", {"text": "Checked killboard, fine", "internal": True})
    api_client.call("post", f"/api/p/recruit/applications/{app.pk}/comments", {"text": "When can you do a voice chat?"})
    assert Notification.objects.filter(user=applicant, title="A recruiter wrote to you").count() == 1

    api_client.force_login(applicant)
    seen = api_client.call("get", "/api/p/recruit/me").json()["current"]
    assert seen["status"] == "review" and seen["reviewer"] == "Recruiter Rae"
    assert [c["text"] for c in seen["comments"]] == ["When can you do a voice chat?"]
    api_client.call("post", f"/api/p/recruit/applications/{app.pk}/comments", {"text": "Tonight works", "internal": True})
    assert Notification.objects.filter(user=recruiter, title="Hopeful Pilot wrote on their application").exists()
    assert not app.comments.get(text="Tonight works").internal  # applicants can't write internal notes


def test_accepting_adds_the_groups(setup, api_client):
    form, recruiter, applicant, members = setup
    app = services.apply(applicant, form, answers())
    api_client.force_login(recruiter)
    out = api_client.call("post", f"/api/p/recruit/applications/{app.pk}/decide", {"accept": True, "message": "Welcome!"}).json()
    assert out["status"] == "accepted"
    assert applicant.groups.filter(pk=members.pk).exists()
    assert Notification.objects.get(user=applicant, title__startswith="Welcome aboard").body == "Welcome!"
    assert api_client.call("post", f"/api/p/recruit/applications/{app.pk}/decide", {"accept": False}).status_code == 400


def test_withdraw_and_reapply(setup, api_client):
    form, _, applicant, _ = setup
    api_client.force_login(applicant)
    app = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()}).json()
    assert api_client.call("post", f"/api/p/recruit/applications/{app['id']}/withdraw").json()["status"] == "withdrawn"
    me = api_client.call("get", "/api/p/recruit/me").json()
    assert me["current"] is None and me["past"][0]["status"] == "withdrawn"
    assert api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()}).status_code == 200


def test_forms_are_checked(setup, api_client):
    _, recruiter, _, members = setup
    api_client.force_login(recruiter)
    bad = api_client.call("post", "/api/p/recruit/forms", {"name": "X", "questions": [{"label": "Pick", "kind": "choice", "choices": ["only"]}]})
    assert "at least two choices" in bad.json()["detail"]
    ok = api_client.call("post", "/api/p/recruit/forms", {"name": "Blues", "questions": [{"label": "Who sent you?"}], "accept_groups": [members.pk]}).json()
    assert ok["questions"][0]["id"] and ok["accept_groups"] == [{"id": members.pk, "name": "Members"}]
    form = Form.objects.get(name="Join Conduit Industries")
    services.apply(make_user(90000080, "Another"), form, answers())
    assert "close it instead" in api_client.call("delete", f"/api/p/recruit/forms/{form.pk}").json()["detail"]
    assert api_client.call("delete", f"/api/p/recruit/forms/{ok['id']}").json()["ok"]
    assert Application.objects.count() == 1


@pytest.fixture
def discord_on(db, monkeypatch):
    """The Discord plugin on and set up; ``on_server`` holds the Discord ids the bot finds on the server."""
    from conduit_discord import discord_api
    from conduit_discord.models import DiscordSettings

    set_enabled("discord", True)
    DiscordSettings.objects.update_or_create(pk=1, defaults={"client_id": "1", "client_secret": "s", "bot_token": "t", "guild_id": "9"})
    on_server: set[str] = set()
    monkeypatch.setattr(discord_api, "member", lambda token, guild, uid: {"user": {"id": uid}} if uid in on_server else None)
    return on_server


def require_discord(api_client, recruiter, on=True):
    recruiter.user_permissions.add(Permission.objects.get(codename="manage_forms"))
    api_client.force_login(recruiter)
    resp = api_client.call("put", "/api/p/recruit/settings", {"require_discord": on})
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_require_discord_is_off_by_default(setup, discord_on, api_client):
    form, _, applicant, _ = setup
    api_client.force_login(applicant)
    assert api_client.call("get", "/api/p/recruit/me").json()["discord"] is None
    assert api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()}).status_code == 200


def test_applying_needs_discord_linked_and_on_the_server(setup, discord_on, api_client):
    from conduit_discord.models import DiscordAccount

    form, recruiter, applicant, _ = setup
    out = require_discord(api_client, recruiter)
    assert out == {"require_discord": True, "discord_plugin": {"installed": True, "enabled": True, "configured": True}}
    api_client.force_login(applicant)
    me = api_client.call("get", "/api/p/recruit/me").json()
    assert me["discord"] == {"linked": False, "username": None, "on_server": False, "error": "", "ok": False}
    resp = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()})
    assert resp.status_code == 403 and "Link your Discord" in resp.json()["detail"]

    DiscordAccount.objects.create(user=applicant, discord_id="555", username="hopeful")
    resp = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()})
    assert resp.status_code == 403 and "Join our Discord server" in resp.json()["detail"]

    discord_on.add("555")
    assert api_client.call("get", "/api/p/recruit/me").json()["discord"]["ok"]
    assert api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()}).status_code == 200


def test_not_checked_while_the_discord_plugin_is_off(setup, discord_on, api_client):
    form, recruiter, applicant, _ = setup
    require_discord(api_client, recruiter)
    set_enabled("discord", False)
    api_client.force_login(recruiter)
    plugin = api_client.call("get", "/api/p/recruit/forms").json()["settings"]["discord_plugin"]
    assert plugin == {"installed": True, "enabled": False, "configured": False}
    api_client.force_login(applicant)
    assert api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()}).status_code == 200


def test_cant_turn_on_without_the_discord_plugin_installed(setup, api_client, monkeypatch):
    from conduit.plugins import registry

    _, recruiter, _, _ = setup
    installed = {k: v for k, v in registry.installed().items() if k != "discord"}
    monkeypatch.setattr(registry, "installed", lambda: installed)
    recruiter.user_permissions.add(Permission.objects.get(codename="manage_forms"))
    api_client.force_login(recruiter)
    resp = api_client.call("put", "/api/p/recruit/settings", {"require_discord": True})
    assert resp.status_code == 400 and "Install the Discord plugin" in resp.json()["detail"]


def test_only_form_managers_change_settings(setup, api_client):
    _, _, applicant, _ = setup
    api_client.force_login(applicant)
    assert api_client.call("put", "/api/p/recruit/settings", {"require_discord": True}).status_code == 403


def test_discord_outage_blocks_with_a_retry_message(setup, discord_on, api_client, monkeypatch):
    from conduit_discord import discord_api
    from conduit_discord.models import DiscordAccount

    def down(*a):
        raise discord_api.DiscordError(502, "Bad gateway")

    form, recruiter, applicant, _ = setup
    require_discord(api_client, recruiter)
    DiscordAccount.objects.create(user=applicant, discord_id="555", username="hopeful")
    monkeypatch.setattr(discord_api, "member", down)
    api_client.force_login(applicant)
    resp = api_client.call("post", "/api/p/recruit/applications", {"form_id": form.pk, "answers": answers()})
    assert resp.status_code == 503 and "try again" in resp.json()["detail"]
