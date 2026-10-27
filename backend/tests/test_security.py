"""Regression tests for the security review of 2026-10-07."""

import ipaddress
import json
import socket

import httpx
import pytest
from django.contrib.auth.models import Group, Permission
from django.test import override_settings

from conduit.access.models import GroupProfile, State
from conduit.events.models import Webhook, WebhookDelivery
from conduit.events.safety import UnsafeUrl, _bad, check_url, pin
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


@pytest.mark.django_db
def test_impersonating_a_leader_cannot_spend_their_standing(api_client):
    """Leadership isn't a permission, so a helper may sign in as a leader; they must not use that to add
    themselves to the group (and so gain its permissions), nor act on the person's account otherwise."""
    from conduit.plugins.services import set_enabled

    set_enabled("sample", True)
    helper = grant(make_user(90000013, "Helper"), "impersonate_users")
    leader = make_user(90000014, "Leader")
    group = Group.objects.create(name="Fleet")
    group.permissions.add(Permission.objects.get(codename="view_members"))
    GroupProfile.objects.create(group=group, join_mode="open").leaders.add(leader)
    api_client.force_login(helper)
    assert api_client.call("post", f"/api/admin/impersonate/{leader.pk}").status_code == 200

    resp = api_client.call("post", f"/api/groups/{group.pk}/members/{helper.pk}")
    assert resp.status_code == 403 and "Return to your own account" in resp.json()["detail"]
    assert api_client.call("post", f"/api/me/groups/{group.pk}/join").status_code == 403
    assert api_client.call("delete", f"/api/me/characters/{leader.main_character_id}").status_code == 403
    assert api_client.call("post", f"/api/me/characters/{leader.main_character_id}/main").status_code == 403
    assert api_client.call("post", "/api/p/sample/admin/reset").status_code == 403
    assert not helper.groups.filter(pk=group.pk).exists() and not type(helper).objects.get(pk=helper.pk).has_perm("site.view_members")
    assert leader.characters.filter(pk=leader.main_character_id).exists()
    # Looking around and harmless writes still work.
    assert api_client.call("get", f"/api/groups/{group.pk}/members").status_code == 200
    assert api_client.call("get", "/api/me/characters").status_code == 200
    assert api_client.call("get", "/api/p/sample/admin/stats").status_code == 200
    prefs = api_client.call("get", "/api/me/preferences").json()
    assert api_client.call("put", "/api/me/preferences", prefs).status_code == 200


@pytest.mark.django_db
def test_audit_names_the_admin_while_impersonating(admin_user, user):
    from django.test import RequestFactory

    from conduit.audit.services import record
    from conduit.site.impersonation import SESSION_KEY

    request = RequestFactory().get("/")
    request.user = user
    request.session = {SESSION_KEY: admin_user.pk}
    event = record("test.action", "changed something", request=request, details={"x": 1})
    assert event.actor_type == "user" and event.actor_id == admin_user.pk
    assert event.actor_name == "Admin Pilot (as Pilot One)" and event.summary.startswith("Admin Pilot (as Pilot One) changed")
    assert event.details == {"x": 1, "impersonating": user.pk}
    # Not impersonating: the user themselves, and no marker.
    request.session = {}
    event = record("test.action", "changed something", request=request)
    assert event.actor_id == user.pk and event.actor_name == "Pilot One" and "impersonating" not in event.details


@pytest.mark.django_db
def test_disabling_the_admin_ends_their_impersonation(admin_user, user, api_client):
    User = type(admin_user)

    def impersonate_then_disable():
        User.objects.filter(pk=admin_user.pk).update(is_active=True)
        api_client.force_login(admin_user)
        assert api_client.call("post", f"/api/admin/impersonate/{user.pk}").status_code == 200
        User.objects.filter(pk=admin_user.pk).update(is_active=False)

    impersonate_then_disable()
    assert api_client.call("get", "/api/me/characters").status_code == 401  # the API says so once...
    assert api_client.call("get", "/api/core/bootstrap").json()["user"] is None  # ...and the session is gone
    impersonate_then_disable()
    assert api_client.get("/sso/add-character")["Location"] == "/login"  # pages go to the login page
    assert api_client.call("get", "/api/core/bootstrap").json()["user"] is None


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
    assert [str(a) for a in check_url("https://discord.example/api/webhooks/1/abc")] == ["93.184.216.34"]


@pytest.mark.parametrize("address, bad", [
    ("64:ff9b::7f00:1", True),  # NAT64 of 127.0.0.1
    ("64:ff9b::a00:1", True),  # NAT64 of 10.0.0.1
    ("64:ff9b::5db8:d822", False),  # NAT64 of 93.184.216.34
    ("::ffff:0:c0a8:101", True),  # IPv4-translated 192.168.1.1
    ("::ffff:c0a8:101", True),  # IPv4-mapped 192.168.1.1
    ("2606:4700::6810:84e5", False),
    ("fe80::1", True),
    ("127.0.0.1", True),
])
def test_embedded_ipv4_addresses_are_judged_by_the_ipv4_inside(address, bad):
    assert _bad(ipaddress.ip_address(address)) is bad


def test_pin_keeps_host_name_for_tls_and_http():
    url, headers, extensions = pin("https://hooks.example:8443/x?y=1", [ipaddress.ip_address("93.184.216.34")])
    assert url == "https://93.184.216.34:8443/x?y=1"
    assert headers == {"Host": "hooks.example:8443"} and extensions == {"sni_hostname": "hooks.example"}
    url, headers, extensions = pin("https://hooks.example/x", [ipaddress.ip_address("2606:4700::6810:84e5")])
    assert url == "https://[2606:4700::6810:84e5]/x" and headers["Host"] == "hooks.example"
    # An address in the URL, or private addresses allowed (nothing vetted): sent as written.
    assert pin("https://[2606:4700::1]/x", [ipaddress.ip_address("2606:4700::1")]) == ("https://[2606:4700::1]/x", {}, {})
    assert pin("https://hooks.example/x", []) == ("https://hooks.example/x", {}, {})


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
    read = []

    class Body(httpx.SyncByteStream):
        def __iter__(self):  # noticed if the delivery reads the reply body
            read.append(1)
            yield b"root:x:0:0:secret-internal-data"

    def handler(request):
        calls.append(request)
        return httpx.Response(500, stream=Body())

    monkeypatch.setattr("conduit.events.webhooks._client",
                        lambda: httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=False))
    deliver.apply(args=[hook.pk, {"event": "webhook.test", "at": "x", "data": {}}, False])
    hook.refresh_from_db()
    # Sent to the vetted address, under the real host name, and the reply body is never read.
    assert str(calls[0].url) == "https://93.184.216.34/x" and calls[0].headers["Host"] == "hooks.example"
    assert calls[0].extensions["sni_hostname"] == "hooks.example"
    assert not read
    assert hook.last_error == "HTTP 500" and "secret" not in hook.last_error
    delivery = WebhookDelivery.objects.get()
    assert delivery.status == 500 and "secret" not in delivery.error

    # A redirect is reported, not followed.
    calls.clear()
    monkeypatch.setattr("conduit.events.webhooks._client",
                        lambda: httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(302, headers={"Location": "https://127.0.0.1/"})),
                                             follow_redirects=False))
    deliver.apply(args=[hook.pk, {"event": "webhook.test", "at": "x", "data": {}}, False])
    hook.refresh_from_db()
    assert hook.last_error == "HTTP 302 (redirects are not followed)"

    # DNS now points inside: refused before any request is made.
    monkeypatch.setattr("conduit.events.safety.socket.getaddrinfo",
                        lambda *a, **k: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.0.10", 443))])
    deliver.apply(args=[hook.pk, {"event": "webhook.test", "at": "x", "data": {}}, True])
    hook.refresh_from_db()
    assert not calls and "private" in hook.last_error


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
def plugins_group(db):
    """A closed group (no leaders, no rules) granting manage_plugins and manage_access."""
    group = Group.objects.create(name="Plugin admins")
    group.permissions.add(*Permission.objects.filter(codename__in=["manage_plugins", "manage_access"]))
    GroupProfile.objects.create(group=group, join_mode="closed")
    return group


@pytest.mark.django_db
def test_managing_access_cannot_hand_out_admin_permissions_it_lacks(plugins_group, user, admin_user, api_client):
    officer = grant(make_user(90000030, "Officer"), "manage_access")
    holder = grant(make_user(90000031, "Plugin Admin"), "manage_access", "manage_plugins")
    holder.groups.add(plugins_group)
    api_client.force_login(officer)
    for target in (officer, user):  # neither themselves nor anyone else
        resp = api_client.call("post", f"/api/admin/groups/{plugins_group.pk}/members/{target.pk}")
        assert resp.status_code == 403 and "site.manage_plugins" in resp.json()["detail"]
        assert not target.groups.filter(pk=plugins_group.pk).exists()
    # Nor take it away, edit the group, or delete it.
    assert api_client.call("delete", f"/api/admin/groups/{plugins_group.pk}/members/{holder.pk}").status_code == 403
    assert api_client.call("put", f"/api/admin/groups/{plugins_group.pk}", {"name": "Plugin admins"}).status_code == 403
    assert api_client.call("delete", f"/api/admin/groups/{plugins_group.pk}").status_code == 403
    assert holder.groups.filter(pk=plugins_group.pk).exists() and Group.objects.filter(pk=plugins_group.pk).exists()
    # Nor make a new group granting it, or give one of their groups it.
    resp = api_client.call("post", "/api/admin/groups", {"name": "Mine", "permissions": ["site.manage_plugins"]})
    assert resp.status_code == 403 and "site.manage_plugins" in resp.json()["detail"]
    mine = api_client.call("post", "/api/admin/groups", {"name": "Mine", "permissions": ["site.manage_access"]})
    assert mine.status_code == 200  # an administrator permission they hold themselves is fine
    resp = api_client.call("put", f"/api/admin/groups/{mine.json()['id']}",
                           {"name": "Mine", "permissions": ["site.manage_access", "site.manage_plugins"]})
    assert resp.status_code == 403
    # Someone holding every permission the group grants may, and superusers always.
    api_client.force_login(holder)
    assert api_client.call("post", f"/api/admin/groups/{plugins_group.pk}/members/{user.pk}").status_code == 200
    api_client.force_login(admin_user)
    assert api_client.call("post", f"/api/admin/groups/{plugins_group.pk}/members/{officer.pk}").status_code == 200
    assert api_client.call("delete", f"/api/admin/groups/{plugins_group.pk}/members/{holder.pk}").status_code == 200


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
    # Browsers drop tabs and newlines from URLs, so each of these would open //evil.example.
    ("/\t/evil.example", False), ("/\r/evil.example", False), ("/\n/evil.example", False), ("/\x00/evil.example", False),
    ("/ /evil.example", False), ("/groups\x7f", False),
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
    assert post(plain, {**body, "link": "/\t/phish.example"}).status_code == 400
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


@pytest.mark.django_db
def test_django_admin_login_is_rate_limited(client):
    codes = [client.post("/django-admin/login/", {"username": "x", "password": "y"}).status_code for _ in range(21)]
    assert 429 not in codes[:20] and codes[20] == 429
    assert client.get("/django-admin/login/").status_code == 200  # only password attempts count


# --- secrets people type in -----------------------------------------------------------------------


@pytest.mark.django_db
def test_non_ascii_secrets_are_refused_not_crashed(user, api_client, client):
    api_client.force_login(user)
    assert api_client.call("post", "/api/setup/claim", {"token": "é"}).status_code == 403
    client.get("/sso/login")  # starts a login flow in the session
    assert client.get("/sso/callback", {"state": "é", "code": "x"}).status_code == 400


@pytest.mark.django_db
def test_setup_code_is_spent_by_the_claim(user, api_client):
    from conduit.site.models import SiteSettings

    code = SiteSettings.load().setup_token
    api_client.force_login(user)
    assert api_client.call("post", "/api/setup/claim", {"token": code}).status_code == 200
    assert SiteSettings.load().setup_token == ""  # and no new one is minted while the wizard is still open
    other = make_user(90000002, "Other Pilot")
    api_client.force_login(other)
    assert api_client.call("post", "/api/setup/claim", {"token": code}).status_code == 403
    other.refresh_from_db()
    assert not other.is_superuser


@pytest.mark.django_db
def test_back_office_never_shows_the_eve_secret(admin_user, client):
    from conduit.site.models import SiteSettings

    site = SiteSettings.load()
    site.esi_secret_key = "s3cret-app-key"
    site.save()
    admin_user.is_staff = True
    admin_user.save()
    client.force_login(admin_user)
    page = client.get(f"/django-admin/site/sitesettings/{site.pk}/change/")
    assert page.status_code == 200 and b"s3cret-app-key" not in page.content


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


@pytest.mark.django_db
def test_nothing_is_cached_by_browsers(client):
    assert client.get("/api/core/bootstrap")["Cache-Control"] == "no-cache"
