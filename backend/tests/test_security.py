"""Regression tests for the security review of 2026-10-07."""

import json
import socket

import httpx
import pytest
from django.contrib.auth.models import Group, Permission
from django.test import override_settings

from conduit.access.models import GroupProfile, State
from conduit.events.models import Webhook
from conduit.events.safety import UnsafeUrl, check_url
from conduit.notify.models import Notification
from conduit.notify.services import notify

from .conftest import make_user


def grant(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(codename__in=codenames))
    return type(user).objects.get(pk=user.pk)


# --- impersonation ------------------------------------------------------------------


@pytest.mark.django_db
def test_helper_cannot_impersonate_someone_more_powerful(api_client):
    helper = grant(make_user(90000010, "Helper"), "impersonate_users")
    officer = grant(make_user(90000011, "Officer"), "manage_access")
    plain = make_user(90000012, "Plain")
    api_client.force_login(helper)
    resp = api_client.call("post", f"/api/admin/impersonate/{officer.pk}")
    assert resp.status_code == 403 and "site.manage_access" in resp.json()["detail"]
    assert api_client.call("post", f"/api/admin/impersonate/{plain.pk}").status_code == 200


@pytest.mark.django_db
def test_admin_changes_are_blocked_while_impersonating(admin_user, user, api_client):
    api_client.force_login(admin_user)
    assert api_client.call("post", f"/api/admin/impersonate/{user.pk}").status_code == 200
    resp = api_client.call("post", "/api/admin/states", {"name": "X", "priority": 5})
    assert resp.status_code == 403 and "Return to your own account" in resp.json()["detail"]
    assert api_client.call("post", f"/api/admin/impersonate/{admin_user.pk}").status_code == 403
    assert api_client.get("/sso/add-character").status_code == 403
    assert api_client.call("get", "/api/me/characters").status_code == 200  # looking around is fine
    assert api_client.call("post", "/api/core/impersonate/stop").status_code == 200
    assert api_client.call("post", "/api/admin/states", {"name": "X", "priority": 5}).status_code == 200


# --- webhooks ---------------------------------------------------------------------------


@pytest.mark.parametrize("url", [
    "http://hooks.example/x",
    "https://127.0.0.1/x",
    "https://10.0.0.5/x",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/x",
    "https://[::ffff:192.168.1.1]/x",
    "https://localhost/x",
    "https://db.internal/x",
    "https://user:pw@hooks.example/x",
])
def test_unsafe_webhook_urls_are_refused(url):
    with pytest.raises(UnsafeUrl):
        check_url(url)


def test_hostname_resolving_to_private_address_is_refused(monkeypatch):
    monkeypatch.setattr("conduit.events.safety.socket.getaddrinfo",
                        lambda *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.1.2.3", 443))])
    with pytest.raises(UnsafeUrl):
        check_url("https://sneaky.example/x")


def test_public_webhook_url_is_fine():
    check_url("https://discord.example/api/webhooks/1/abc")


@override_settings(CONDUIT_WEBHOOK_ALLOW_PRIVATE=True)
def test_private_addresses_can_be_allowed_explicitly():
    check_url("https://10.0.0.5/x")


@pytest.mark.django_db
def test_api_refuses_internal_webhook(admin_user, api_client):
    api_client.force_login(admin_user)
    resp = api_client.call("post", "/api/admin/webhooks", {"name": "x", "url": "https://169.254.169.254/", "kind": "json"})
    assert resp.status_code == 422


@pytest.mark.django_db
def test_delivery_rechecks_dns_and_never_stores_reply_bodies(monkeypatch):
    from conduit.events.webhooks import deliver

    hook = Webhook.objects.create(name="H", kind="json", url="https://hooks.example/x")
    calls = []

    def fake_post(url, **kwargs):
        calls.append(kwargs)
        return httpx.Response(500, text="root:x:0:0:secret-internal-data")

    monkeypatch.setattr("conduit.events.webhooks.httpx.post", fake_post)
    deliver.apply(args=[hook.pk, {"event": "webhook.test", "at": "x", "data": {}}, False])
    hook.refresh_from_db()
    assert calls[0]["follow_redirects"] is False
    assert hook.last_error == "HTTP 500" and "secret" not in hook.last_error

    # DNS now points inside: refused before any request is made.
    monkeypatch.setattr("conduit.events.safety.socket.getaddrinfo",
                        lambda *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.0.10", 443))])
    deliver.apply(args=[hook.pk, {"event": "webhook.test", "at": "x", "data": {}}, True])
    hook.refresh_from_db()
    assert len(calls) == 1 and "private" in hook.last_error


# --- groups that carry administrator permissions -------------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize("extra", [{"leaders": "LEADER"}, {"join_mode": "open"}, {
    "auto": True, "rules": {"match": "all", "rules": [{"type": "character_count", "params": {"op": "gte", "count": 1}}]}}])
def test_admin_permission_groups_cannot_be_handed_out(admin_user, user, api_client, extra):
    api_client.force_login(admin_user)
    extra = {k: ([user.pk] if v == "LEADER" else v) for k, v in extra.items()}
    body = {"name": "Officers", "permissions": ["site.manage_access"], **extra}
    resp = api_client.call("post", "/api/admin/groups", body)
    assert resp.status_code == 400 and "administrator permissions" in resp.json()["detail"]
    closed = api_client.call("post", "/api/admin/groups", {"name": "Officers", "permissions": ["site.manage_access"]})
    assert closed.status_code == 200


@pytest.fixture
def legacy_admin_group(db):
    """A group saved before the rule existed: open, led, and granting manage_access."""
    group = Group.objects.create(name="Old officers")
    group.permissions.add(Permission.objects.get(codename="manage_access"))
    return group, GroupProfile.objects.create(group=group, join_mode="open")


@pytest.mark.django_db
def test_legacy_admin_group_cannot_be_joined_or_filled_by_leaders(legacy_admin_group, user, api_client):
    group, profile = legacy_admin_group
    leader = make_user(90000020, "Leader")
    profile.leaders.add(leader)
    api_client.force_login(user)
    assert api_client.call("post", f"/api/me/groups/{group.pk}/join").status_code == 403
    api_client.force_login(leader)
    assert api_client.call("post", f"/api/groups/{group.pk}/members/{user.pk}").status_code == 403
    assert not user.groups.filter(pk=group.pk).exists()


@pytest.mark.django_db
def test_api_keys_cannot_fill_admin_groups_or_states(client, user, legacy_admin_group):
    from conduit.external import areas
    from conduit.external.models import ApiKey

    group, _ = legacy_admin_group
    state = State.objects.create(name="Officers", priority=50)
    state.permissions.add(Permission.objects.get(codename="manage_api"))
    areas.set_enabled("groups", True)
    areas.set_enabled("states", True)
    _, secret = ApiKey.issue(name="Bot", scopes=["groups:write", "states:write"])
    h = {"HTTP_AUTHORIZATION": f"Bearer {secret}", "content_type": "application/json"}
    assert client.put(f"/api/v1/groups/{group.pk}/members/{user.pk}", **h).status_code == 403
    assert client.post(f"/api/v1/states/{state.pk}/members", {"type": "character", "id": user.main_character_id}, **h).status_code == 403


# --- notification links ---------------------------------------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize("link,kept", [
    ("/groups", True), ("https://zkillboard.com/", True), ("javascript:alert(1)", False), ("//evil.example", False),
    ("/\\evil.example", False), ("http://plain.example", False), ("data:text/html,x", False),
])
def test_notify_drops_unsafe_links(user, link, kept):
    n = notify(user, "x", link=link)[0]
    assert (n.link == link) is kept and (kept or n.link == "")


@pytest.mark.django_db
def test_external_links_need_their_own_scope(client, user):
    from conduit.external import areas
    from conduit.external.models import ApiKey

    areas.set_enabled("notify", True)
    _, plain = ApiKey.issue(name="Bot", scopes=["notify:write"])
    _, linked = ApiKey.issue(name="Trusted bot", scopes=["notify:write", "notify:links"])
    body = {"user_ids": [user.pk], "title": "Free ISK", "link": "https://phish.example/login"}

    def post(secret, data):
        return client.post("/api/v1/notifications", data, HTTP_AUTHORIZATION=f"Bearer {secret}", content_type="application/json")

    assert post(plain, body).status_code == 403
    assert post(plain, {**body, "link": "//phish.example"}).status_code == 400
    assert post(plain, {**body, "link": "/p/fleets"}).status_code == 200
    assert post(linked, body).status_code == 200
    assert Notification.objects.count() == 2


# --- preferences size ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_settings_are_size_limited(user, api_client):
    api_client.force_login(user)
    prefs = api_client.call("get", "/api/me/preferences").json()
    huge = {"order": ["x" * 1000] * 100}
    assert api_client.call("put", "/api/me/preferences", {**prefs, "dashboard": huge}).status_code == 400
    assert api_client.call("put", "/api/me/preferences/plugins/sample", {"value": "x" * 70000}).status_code == 400


# --- compliance needs its own permission ----------------------------------------------------------


@pytest.mark.django_db
def test_view_members_alone_does_not_open_compliance(api_client):
    viewer = grant(make_user(90000030, "Viewer"), "view_members")
    api_client.force_login(viewer)
    assert api_client.call("get", "/api/admin/compliance").status_code == 403
    viewer = grant(viewer, "view_compliance")
    api_client.force_login(viewer)
    assert api_client.call("get", "/api/admin/compliance").status_code == 200


# --- token encryption keys -------------------------------------------------------------------------


@pytest.mark.django_db
def test_setting_a_token_key_keeps_old_tokens_readable_and_rotation_moves_them(user):
    from cryptography.fernet import Fernet
    from django.core.management import call_command
    from django.db import connection

    from conduit.accounts import crypto
    from conduit.accounts.models import Token

    new_key = Fernet.generate_key().decode()
    crypto._fernet.cache_clear()
    try:
        with override_settings(CONDUIT_TOKEN_KEY=new_key):
            crypto._fernet.cache_clear()
            assert Token.objects.get(character=user.main_character).access_token == "access"  # old key still works
            call_command("rotate_token_key", stdout=open("/dev/null", "w"))
            with connection.cursor() as cur:
                cur.execute("SELECT access_token FROM accounts_token")
                raw = cur.fetchone()[0]
            assert Fernet(new_key.encode()).decrypt(raw.encode()) == b"access"
    finally:
        crypto._fernet.cache_clear()


# --- rate limits ---------------------------------------------------------------------------------


@pytest.mark.django_db
def test_setup_code_guessing_is_rate_limited(user, api_client):
    api_client.force_login(user)
    codes = [api_client.call("post", "/api/setup/claim", {"token": f"guess-{i}"}).status_code for i in range(7)]
    assert codes[:5] == [403] * 5 and codes[5:] == [429, 429]


@pytest.mark.django_db
def test_failed_api_keys_are_rate_limited(client):
    for _ in range(30):
        assert client.get("/api/v1/me", HTTP_AUTHORIZATION="Bearer evk_bad_x").status_code == 401
    assert client.get("/api/v1/me", HTTP_AUTHORIZATION="Bearer evk_bad_x").status_code == 429


@override_settings(CONDUIT_RATE_LIMITS=False)
@pytest.mark.django_db
def test_rate_limits_can_be_switched_off(client):
    for _ in range(35):
        assert client.get("/api/v1/me", HTTP_AUTHORIZATION="Bearer evk_bad_x").status_code == 401


# --- security checks ------------------------------------------------------------------------------


@override_settings(DEBUG=False, CONDUIT_TOKEN_KEY="", CONDUIT_DJANGO_ADMIN=True)
def test_security_checks_flag_risky_settings():
    from conduit.site.checks import security_warnings

    ids = {w["id"] for w in security_warnings()}
    assert {"conduit.W001", "conduit.W006"} <= ids


@pytest.mark.django_db
def test_health_lists_security_warnings(admin_user, api_client):
    api_client.force_login(admin_user)
    assert isinstance(api_client.call("get", "/api/admin/health").json()["security"], list)


@pytest.mark.django_db
def test_security_warnings_are_deploy_checks_only():
    """Ordinary management commands (migrate...) must not print them: installers treat stderr as failure."""
    from django.core.checks import run_checks

    with override_settings(DEBUG=False, CONDUIT_TOKEN_KEY=""):
        assert not [m for m in run_checks() if m.id.startswith("conduit.")]
        assert any(m.id == "conduit.W001" for m in run_checks(include_deployment_checks=True))
