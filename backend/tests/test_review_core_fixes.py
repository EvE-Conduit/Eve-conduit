"""Regression tests for the security review of the core (accounts, access, sso, site, external, events, search)."""

from types import SimpleNamespace

import httpx
import pytest
from django.contrib.auth.models import Group, Permission

from conduit.access.models import GroupProfile, State
from conduit.accounts.models import Character, User
from conduit.external.models import ApiRequest

from .conftest import make_user
from .test_external import call, make_key, on


def give(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(codename__in=codenames))
    return User.objects.get(pk=user.pk)


# --- SeAT import: a hashless alt is no proof of an account someone has signed in to ---------------------------------


@pytest.mark.django_db
def test_seat_import_does_not_join_an_account_through_a_hashless_alt(client):
    victim = make_user(91000001, "Victim")  # signed in here: owner hash known
    Character.objects.create(id=91000002, name="Old Alt", owner_hash="", user=victim)  # imported once, never used since
    on("import")
    key = make_key(["import:seat"])[1]
    payload = {"users": [{"seat_id": 1, "name": "x", "main_character_id": 91000002, "characters": [
        {"id": 91000002, "name": "Old Alt"},
        {"id": 95000009, "name": "Attacker Alt", "owner_hash": "attacker-hash"},
    ]}]}
    resp = call(client, "post", "/api/v1/import/seat/users", key, data=payload)
    assert resp.status_code == 200, resp.content
    assert not Character.objects.filter(pk=95000009).exists()
    assert [c["status"] for c in resp.json()["users"][0]["characters"]] == ["other_account", "owner_unknown"]


@pytest.mark.django_db
def test_seat_import_without_owner_hashes_still_finds_its_own_accounts(client):
    on("import")
    key = make_key(["import:seat"])[1]
    payload = {"users": [{"seat_id": 1, "name": "x", "main_character_id": 91000001, "characters": [
        {"id": 91000001, "name": "Main"}, {"id": 91000002, "name": "Alt"}]}]}
    first = call(client, "post", "/api/v1/import/seat/users", key, data=payload).json()["users"][0]
    payload["users"][0]["characters"].append({"id": 91000003, "name": "Later Alt"})
    again = call(client, "post", "/api/v1/import/seat/users", key, data=payload).json()["users"][0]
    assert again["user_id"] == first["user_id"] and not again["created"]
    assert [c["status"] for c in again["characters"]] == ["exists", "exists", "added"]


# --- rotate_token_key ------------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_rotate_token_key_covers_every_encrypted_column(settings, monkeypatch):
    """Plugins keep secrets in EncryptedTextField too (a Discord bot token); they must not stay on the old key."""
    from cryptography.fernet import Fernet
    from django.apps import apps
    from django.core.management import call_command
    from django.db import connection

    from conduit.accounts import crypto
    from conduit.notify.models import Notification

    old, new = Fernet.generate_key().decode(), Fernet.generate_key().decode()
    settings.CONDUIT_TOKEN_KEY = old
    crypto._fernet.cache_clear()
    note = Notification.objects.create(user=make_user(), title="t", body=crypto.encrypt("bot-token"))
    # Stands in for a plugin's model: a table with an encrypted column the command has never heard of.
    column = crypto.EncryptedTextField()
    column.column = "body"
    plugin_model = SimpleNamespace(_meta=SimpleNamespace(
        db_table=Notification._meta.db_table, pk=SimpleNamespace(column="id"), local_concrete_fields=[column]))
    models = [*apps.get_models(), plugin_model]
    monkeypatch.setattr(apps, "get_models", lambda *a, **k: models)

    settings.CONDUIT_TOKEN_KEY, settings.CONDUIT_TOKEN_KEY_PREVIOUS = new, [old]
    crypto._fernet.cache_clear()
    try:
        call_command("rotate_token_key", stdout=open("/dev/null", "w"))
        settings.CONDUIT_TOKEN_KEY_PREVIOUS = []  # the old key is retired, as the instructions say
        crypto._fernet.cache_clear()
        with connection.cursor() as cur:
            cur.execute(f"SELECT body FROM {Notification._meta.db_table} WHERE id = %s", [note.pk])
            assert crypto.decrypt(cur.fetchone()[0]) == "bot-token"
    finally:
        crypto._fernet.cache_clear()


# --- API request log -------------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_made_up_keys_on_unknown_paths_are_not_logged(client):
    for i in range(5):
        assert client.get(f"/api/v1/nope{i}", HTTP_X_API_KEY="x").status_code == 404
        assert client.get(f"/api/v1/nope{i}", HTTP_AUTHORIZATION="Bearer evk_deadbeef_nothing").status_code == 404
    assert ApiRequest.objects.count() == 0
    # A refused key on a real route is still on record (and rate-limited), and so is a real key on an unknown path.
    assert client.get("/api/v1/me", HTTP_X_API_KEY="x").status_code == 401
    key, secret = make_key([])
    assert call(client, "get", "/api/v1/nope", secret).status_code == 404
    rows = list(ApiRequest.objects.order_by("pk").values_list("status", "key_id"))
    assert rows == [(401, None), (404, key.pk)]


# --- states: no stripping administrators, no opening groups ---------------------------------------------------------


@pytest.fixture
def admin_group_by_state(db, corp):
    """Plugin Admins grants manage_plugins and only allows the Member state, which the corporation is in."""
    member = State.objects.create(name="Member", priority=10)
    member.member_corporations.add(corp)
    group = Group.objects.create(name="Plugin Admins")
    group.permissions.add(Permission.objects.get(codename="manage_plugins"))
    GroupProfile.objects.create(group=group).allowed_states.add(member)
    plugin_admin = make_user(90000021, "Plugin Admin", corporation=corp)
    plugin_admin.state = member
    plugin_admin.save()
    plugin_admin.groups.add(group)
    manager = give(make_user(90000022, "Access Manager"), "manage_access")
    return member, group, plugin_admin, manager


def _state_body(state, **changes):
    return {"name": state.name, "priority": state.priority, "member_corporations": [], "member_alliances": [],
            "member_characters": [], "permissions": [], **changes}


def test_state_edit_cant_strip_an_administrator_of_what_the_editor_lacks(admin_group_by_state, api_client, admin_user):
    member, group, plugin_admin, manager = admin_group_by_state
    api_client.force_login(manager)
    resp = api_client.call("put", f"/api/admin/states/{member.pk}", _state_body(member))  # the corporation taken out
    assert resp.status_code == 403 and "manage_plugins" in resp.json()["detail"]
    assert plugin_admin.groups.filter(pk=group.pk).exists() and member.member_corporations.count() == 1
    assert User.objects.get(pk=plugin_admin.pk).state_id == member.pk
    # A state that outranks theirs does the same thing.
    resp = api_client.call("post", "/api/admin/states", {"name": "Blue", "priority": 99, "member_corporations": [98000001]})
    assert resp.status_code == 403 and not State.objects.filter(name="Blue").exists()
    # Edits that leave administrators alone still work, and an administrator may do all of it.
    assert api_client.call("put", f"/api/admin/states/{member.pk}",
                           _state_body(member, member_corporations=[98000001], description="x")).status_code == 200
    api_client.force_login(admin_user)
    assert api_client.call("put", f"/api/admin/states/{member.pk}", _state_body(member)).status_code == 200
    assert not plugin_admin.groups.filter(pk=group.pk).exists()


def test_deleting_a_state_doesnt_open_the_groups_limited_to_it(admin_group_by_state, api_client, admin_user):
    member, group, plugin_admin, manager = admin_group_by_state
    api_client.force_login(admin_user)
    resp = api_client.call("delete", f"/api/admin/states/{member.pk}")
    assert resp.status_code == 400 and "Plugin Admins" in resp.json()["detail"]
    assert State.objects.filter(pk=member.pk).exists()
    group.profile.allowed_states.add(State.objects.create(name="Other", priority=11))
    # No longer the only state, but deleting it would still drop the plugin admin from the group.
    api_client.force_login(manager)
    assert api_client.call("delete", f"/api/admin/states/{member.pk}").status_code == 403
    assert State.objects.filter(pk=member.pk).exists() and plugin_admin.groups.filter(pk=group.pk).exists()
    api_client.force_login(admin_user)
    assert api_client.call("delete", f"/api/admin/states/{member.pk}").status_code == 200


# --- search ----------------------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_search_hides_groups_the_users_state_may_not_be_in(client):
    member = State.objects.create(name="Member", priority=10)
    limited = Group.objects.create(name="Capital Hunters")
    GroupProfile.objects.create(group=limited, join_mode="open").allowed_states.add(member)
    GroupProfile.objects.create(group=Group.objects.create(name="Capital Newbros"), join_mode="open")

    def found(user):
        client.force_login(user)
        return [h["title"] for g in client.get("/api/search?q=Capital").json()["groups"] if g["key"] == "groups" for h in g["hits"]]

    guest = make_user(91000002, "Guest", member=False)
    assert found(guest) == ["Capital Newbros"]
    insider = make_user(91000003, "Insider")
    insider.state = member
    insider.save()
    assert found(insider) == ["Capital Hunters", "Capital Newbros"]
    guest.groups.add(limited)  # a member of it sees it whatever their state
    assert found(guest) == ["Capital Hunters", "Capital Newbros"]


@pytest.mark.django_db
def test_search_leaves_out_switched_off_accounts(client):
    gone = make_user(91000004, "Merged Away")
    gone.is_active = False
    gone.save()
    make_user(91000005, "Merged Into")
    client.force_login(give(make_user(91000006, "HR"), "view_members"))
    hits = [h["title"] for g in client.get("/api/search?q=Merged").json()["groups"] if g["key"] == "members" for h in g["hits"]]
    assert hits == ["Merged Into"]


# --- impersonation ---------------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_impersonation_ends_when_it_would_no_longer_be_allowed(api_client):
    from django.core.cache import cache

    from conduit.audit.models import AuditEvent

    helper = give(make_user(90000010, "Helper"), "impersonate_users")
    plain = make_user(90000012, "Plain")
    api_client.force_login(helper)
    assert api_client.call("post", f"/api/admin/impersonate/{plain.pk}").status_code == 200
    assert api_client.get("/api/core/bootstrap").json()["user"]["id"] == plain.pk
    give(plain, "manage_plugins")  # now holds something the helper doesn't
    cache.clear()  # the answer is reused for a minute
    resp = api_client.get("/api/me/characters")
    assert resp.status_code == 403 and resp.json()["impersonation_ended"] is True
    me = api_client.get("/api/core/bootstrap").json()["user"]
    assert me["id"] == helper.pk and me["impersonated_by"] is None
    assert AuditEvent.objects.filter(action="auth.impersonation_stopped").exists()


@pytest.mark.django_db
def test_impersonation_ends_when_the_permission_is_taken_away(api_client):
    from django.core.cache import cache

    helper = give(make_user(90000010, "Helper"), "impersonate_users")
    plain = make_user(90000012, "Plain")
    api_client.force_login(helper)
    assert api_client.call("post", f"/api/admin/impersonate/{plain.pk}").status_code == 200
    assert api_client.get("/api/me/characters").status_code == 200  # still fine
    helper.user_permissions.clear()
    cache.clear()
    assert api_client.get("/api/me/characters").status_code == 403
    assert api_client.get("/api/core/bootstrap").json()["user"]["id"] == helper.pk


# --- answers instead of crashes --------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_sso_callback_survives_eve_sso_being_down(client, monkeypatch):
    from conduit.sso import views

    def down(code, verifier):
        raise httpx.ConnectTimeout("no answer")

    monkeypatch.setattr(views, "exchange_code", down)
    client.get("/sso/login?next=/wallet")
    resp = client.get(f"/sso/callback?code=abc&state={client.session['conduit_sso']['state']}")
    assert resp.status_code == 302 and resp["Location"] == "/wallet?error=sso_failed"


def test_api_key_expiry_without_a_time_zone_is_utc(admin_user, api_client):
    api_client.force_login(admin_user)
    resp = api_client.call("post", "/api/admin/api/keys", {"name": "k", "expires_at": "2099-01-01T00:00:00"})
    assert resp.status_code == 200, resp.content
    assert resp.json()["secret"] and resp.json()["key"]["expires_at"] == "2099-01-01T00:00:00+00:00"
    key_id = resp.json()["key"]["id"]
    resp = api_client.call("put", f"/api/admin/api/keys/{key_id}", {"name": "k", "expires_at": "2000-01-01T00:00:00"})
    assert resp.status_code == 200 and resp.json()["status"] == "expired"


def test_compliance_overview_takes_a_negative_offset(admin_user, api_client):
    api_client.force_login(admin_user)
    assert api_client.call("get", "/api/admin/compliance?offset=-5").status_code == 200


def test_malformed_rules_are_refused_not_crashed_on(admin_user, api_client):
    api_client.force_login(admin_user)
    for rule in ({"type": "state", "params": [1]}, {"type": ["state"]}, {"type": {"a": 1}, "params": "x"}):
        resp = api_client.call("post", "/api/admin/rules/preview", {"rules": {"rules": [rule]}})
        assert resp.status_code == 400, (rule, resp.content)


def test_site_settings_refuse_texts_longer_than_their_columns(admin_user, api_client):
    api_client.force_login(admin_user)
    base = {"name": "Site", "accent": "#112233"}
    assert api_client.call("put", "/api/admin/site", {**base, "tagline": "t" * 121}).status_code == 422
    assert api_client.call("put", "/api/admin/site", {**base, "logo_url": "https://x.example/" + "a" * 200}).status_code == 422
    assert api_client.call("put", "/api/admin/site", {**base, "tagline": "t" * 120}).status_code == 200


# --- Discord ---------------------------------------------------------------------------------------------------------


def test_discord_shows_typed_links_as_text():
    from conduit.events.webhooks import render

    event = {"event": "group.request_created", "at": "2026-01-01T00:00:00+00:00", "data": {
        "title": "[Free ISK](https://evil.example)",
        "summary": "Pilot asked to join Caps: “[Verify **here**](<https://evil.example>)”\n- stays a list"}}
    embed = render("discord", event)["embeds"][0]
    assert "](" not in embed["title"] and "](" not in embed["description"]
    # Everything is still there to read, and other formatting is left alone.
    assert embed["description"].replace("​", "") == event["data"]["summary"]
    assert "**here**" in embed["description"] and "\n- stays a list" in embed["description"]
    # Signed JSON goes out untouched; Slack has its own escaping.
    assert render("json", event) == event
