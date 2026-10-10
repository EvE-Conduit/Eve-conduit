"""Mumble: accounts, what the authenticator is told, temporary access links, settings and group mapping."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.core.cache import cache
from django.utils import timezone

from conduit.access.groups import add_member
from conduit.external import areas
from conduit.external.models import ApiKey
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_mumble import services
from conduit_mumble.models import GroupMapping, MumbleSettings, MumbleUser, TempLink, TempUser
from tests.conftest import make_user


@pytest.fixture
def setup(db, corp):
    sync_installed()
    set_enabled("mumble", True)
    MumbleSettings.objects.update_or_create(pk=1, defaults={"host": "voice.example.com", "port": 64738, "server_name": "Test comms"})
    caps = Group.objects.create(name="Capitals")
    GroupMapping.objects.create(group=caps, mumble_group="capitals")
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    pilot.user_permissions.add(Permission.objects.get(codename="access_mumble"))
    GroupMapping.objects.create(state=pilot.state, mumble_group="member")
    return pilot, caps


@pytest.fixture
def authenticator(db):
    """What the authenticator next to the Mumble server does: calls with an API key holding p.mumble:auth."""
    areas.set_enabled("p.mumble", True)
    _, secret = ApiKey.issue(name="Mumble authenticator", scopes=["p.mumble:auth"])

    def call(client, method, path, data=None):
        kwargs = {"HTTP_AUTHORIZATION": f"Bearer {secret}", "content_type": "application/json"}
        if data is not None:
            kwargs["data"] = data
        return getattr(client, method)(f"/api/v1/p/mumble{path}", **kwargs)

    return call


def login(client, auth, name, password="", certhash=""):
    resp = auth(client, "post", "/authenticate", {"name": name, "password": password, "certhash": certhash, "version": "1.0.0"})
    assert resp.status_code == 200, resp.content
    return resp.json()


def create(api_client, pilot, password=""):
    api_client.force_login(pilot)
    resp = api_client.call("post", "/api/p/mumble/account", {"password": password})
    assert resp.status_code == 200, resp.content
    return resp.json()


# --- accounts ---------------------------------------------------------------------------------------------------------


def test_member_creates_an_account_and_sees_what_they_get(setup, api_client):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    api_client.force_login(pilot)
    me = api_client.call("get", "/api/p/mumble/me").json()
    assert me["configured"] and me["can_link"] and me["account"] is None
    assert me["username_preview"] == "Pilot_One" and me["display_preview"] == "[TCORP] Pilot One"
    assert me["groups_due"] == ["capitals", "member"] and me["server"] == {"name": "Test comms", "host": "voice.example.com", "port": 64738}

    body = create(api_client, pilot)
    assert body["account"]["username"] == "Pilot_One" and body["account"]["display_name"] == "[TCORP] Pilot One"
    assert len(body["password"]) == 14 and body["connect_url"].startswith("mumble://Pilot_One:") and "@voice.example.com:64738/" in body["connect_url"]
    assert body["account"]["url"] == "mumble://Pilot_One@voice.example.com:64738/?title=Test+comms&version=1.2.0"
    acct = MumbleUser.objects.get(user=pilot)
    assert acct.password_hash.startswith(("pbkdf2", "argon2", "scrypt", "bcrypt", "md5")) and body["password"] not in acct.password_hash
    # Only one account each.
    assert api_client.call("post", "/api/p/mumble/account", {"password": ""}).status_code == 409


def test_own_password_must_be_long_enough(setup, api_client):
    pilot, _ = setup
    api_client.force_login(pilot)
    resp = api_client.call("post", "/api/p/mumble/account", {"password": "short"})
    assert resp.status_code == 400 and "8 characters" in resp.json()["detail"]
    body = create(api_client, pilot, "correct horse battery")
    assert body["password"] == "correct horse battery"


def test_no_access_no_account(setup, api_client):
    pilot, _ = setup
    pilot.user_permissions.clear()
    api_client.force_login(pilot)
    assert api_client.call("post", "/api/p/mumble/account", {"password": ""}).status_code == 403
    assert not api_client.call("get", "/api/p/mumble/me").json()["can_link"]


def test_usernames_are_unique_and_mumble_safe(setup, corp):
    pilot, _ = setup
    s = MumbleSettings.load()
    s.username_format = "{corp_ticker}-{character}"
    s.save()
    assert services.username_for(pilot, s) == "TCORP-Pilot_One"
    other = make_user(90000002, "Pilot One", corporation=corp)  # same name on another account
    services.create_account(pilot, s=s)
    assert services.username_for(other, s) == "TCORP-Pilot_One_2"
    odd = make_user(90000003, "Jöhn   O'Brien", corporation=corp)
    assert services.username_for(odd, s) == "TCORP-J_hn_O_Brien"


# --- what the authenticator is told -----------------------------------------------------------------------------------


def test_authenticator_gets_id_name_and_groups(setup, api_client, client, authenticator):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    password = create(api_client, pilot)["password"]
    answer = login(client, authenticator, "pilot_one", password)  # Mumble names are matched without case
    assert answer == {"result": "ok", "id": pilot.pk, "name": "[TCORP] Pilot One", "groups": ["capitals", "member"], "kind": "member"}
    acct = MumbleUser.objects.get(user=pilot)
    assert acct.last_login_at is not None and acct.groups == ["capitals", "member"]
    assert MumbleSettings.load().authenticator_seen_at is not None and MumbleSettings.load().authenticator_version == "1.0.0"

    assert login(client, authenticator, "Pilot_One", "wrong") == {"result": "reject"}
    assert login(client, authenticator, "Nobody", "x") == {"result": "fallthrough"}
    assert authenticator(client, "get", "/users/by-name?name=PILOT_ONE").json() == {"id": pilot.pk}
    assert authenticator(client, "get", "/users/by-name?name=nobody").status_code == 404
    info = authenticator(client, "get", f"/users/{pilot.pk}").json()
    assert info["name"] == "[TCORP] Pilot One" and info["username"] == "Pilot_One" and "90000001" in info["texture_url"]
    assert authenticator(client, "get", "/users/424242").status_code == 404
    assert authenticator(client, "post", "/ping", {"version": "1.0.1"}).json()["ok"]


def test_groups_follow_the_site_at_every_login(setup, api_client, client, authenticator):
    pilot, caps = setup
    password = create(api_client, pilot)["password"]
    assert login(client, authenticator, "Pilot_One", password)["groups"] == ["member"]
    add_member(pilot, caps, "admin")
    assert login(client, authenticator, "Pilot_One", password)["groups"] == ["capitals", "member"]
    pilot.user_permissions.clear()
    assert login(client, authenticator, "Pilot_One", password) == {"result": "reject", "reason": "no access"}


def test_certificate_is_remembered_after_a_password_login(setup, api_client, client, authenticator):
    pilot, _ = setup
    password = create(api_client, pilot)["password"]
    cert = "ab" * 20
    assert login(client, authenticator, "Pilot_One", "", cert)["result"] == "reject"  # unknown certificate yet
    assert login(client, authenticator, "Pilot_One", password, cert)["result"] == "ok"
    assert MumbleUser.objects.get(user=pilot).cert_hash == cert
    assert login(client, authenticator, "Pilot_One", "", cert)["result"] == "ok"
    assert login(client, authenticator, "Pilot_One", "", "cd" * 20)["result"] == "reject"
    api_client.force_login(pilot)
    me = api_client.call("get", "/api/p/mumble/me").json()
    assert me["account"]["certificate_remembered"]
    me = api_client.call("delete", "/api/p/mumble/account/certificate").json()
    assert not me["account"]["certificate_remembered"]
    assert login(client, authenticator, "Pilot_One", "", cert)["result"] == "reject"
    # Switched off under Setup: nothing is remembered any more.
    login(client, authenticator, "Pilot_One", password, cert)
    s = MumbleSettings.load()
    s.allow_cert_auth = False
    s.save()
    assert login(client, authenticator, "Pilot_One", "", cert)["result"] == "reject"


def test_repeated_failures_lock_the_name_for_a_while(setup, api_client, client, authenticator):
    pilot, _ = setup
    password = create(api_client, pilot)["password"]
    for _ in range(services.FAILS_LIMIT):
        assert login(client, authenticator, "Pilot_One", "wrong")["result"] == "reject"
    assert login(client, authenticator, "Pilot_One", password)["reason"].startswith("too many")
    cache.clear()
    assert login(client, authenticator, "Pilot_One", password)["result"] == "ok"


def test_authenticator_needs_the_scope_and_the_api_switched_on(setup, client, db):
    _, secret = ApiKey.issue(name="Other bot", scopes=["directory:read"])
    resp = client.post("/api/v1/p/mumble/authenticate", {"name": "x"}, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {secret}")
    assert resp.status_code == 403
    _, secret = ApiKey.issue(name="Mumble", scopes=["p.mumble:auth"])
    resp = client.post("/api/v1/p/mumble/authenticate", {"name": "x"}, content_type="application/json", HTTP_AUTHORIZATION=f"Bearer {secret}")
    assert resp.status_code == 403 and "switched off" in resp.json()["detail"]
    assert client.post("/api/v1/p/mumble/authenticate", {"name": "x"}, content_type="application/json").status_code == 401


def test_new_password_and_deleting_the_account(setup, api_client, client, authenticator):
    pilot, _ = setup
    old = create(api_client, pilot)["password"]
    body = api_client.call("post", "/api/p/mumble/account/password", {"password": ""}).json()
    new = body["password"]
    assert new != old and login(client, authenticator, "Pilot_One", old)["result"] == "reject"
    assert login(client, authenticator, "Pilot_One", new)["result"] == "ok"
    me = api_client.call("delete", "/api/p/mumble/account").json()
    assert me["account"] is None and not MumbleUser.objects.exists()
    assert login(client, authenticator, "Pilot_One", new) == {"result": "fallthrough"}


# --- temporary access -------------------------------------------------------------------------------------------------


@pytest.fixture
def host(setup, corp):
    """Someone allowed to hand out temporary links."""
    fc = make_user(90000010, "Fleet Commander", corporation=corp)
    fc.user_permissions.add(Permission.objects.get(codename="create_temp_links"))
    return fc


def make_link(api_client, who, **body):
    api_client.force_login(who)
    resp = api_client.call("post", "/api/p/mumble/temp", {"label": "Diplo meeting", "hours": 4, "max_uses": 0, **body})
    return resp


def test_temp_link_lets_a_guest_in_until_it_expires(host, api_client, client, authenticator, settings):
    settings.SITE_URL = "https://auth.example.com"
    resp = make_link(api_client, host)
    assert resp.status_code == 200, resp.content
    link = resp.json()
    assert link["status"] == "active" and link["groups"] == ["temp"] and link["url"].startswith("https://auth.example.com/public/p/mumble/temp/")
    token = link["url"].rsplit("/", 1)[1]

    # The page a visitor sees, without signing in.
    page = client.get(f"/api/public/p/mumble/temp/{token}").json()
    assert page == {"label": "Diplo meeting", "server": "Test comms", "host": "voice.example.com", "port": 64738,
                    "expires_at": link["expires_at"], "status": "active", "invited_by": "Fleet Commander"}
    assert client.get("/api/public/p/mumble/temp/nope").status_code == 404

    resp = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Jane Doe"}, content_type="application/json")
    assert resp.status_code == 200, resp.content
    guest = resp.json()
    assert guest["username"] == "Jane_Doe" and guest["display_name"] == "[TEMP] Jane Doe" and guest["groups"] == ["temp"]
    assert guest["url"] == f"mumble://Jane_Doe:{guest['password']}@voice.example.com:64738/?title=Test+comms&version=1.2.0"
    temp = TempUser.objects.get()
    assert temp.expires_at.isoformat() == link["expires_at"]

    answer = login(client, authenticator, "jane_doe", guest["password"])
    assert answer == {"result": "ok", "id": services.TEMP_ID_OFFSET + temp.pk, "name": "[TEMP] Jane Doe", "groups": ["temp"], "kind": "temp"}
    assert authenticator(client, "get", f"/users/{services.TEMP_ID_OFFSET + temp.pk}").json()["kind"] == "temp"
    assert login(client, authenticator, "Jane_Doe", "wrong")["result"] == "reject"

    # The link's owner sees who used it.
    api_client.force_login(host)
    mine = api_client.call("get", "/api/p/mumble/temp").json()
    assert mine["links"][0]["uses"] == 1 and mine["links"][0]["users"][0]["display_name"] == "[TEMP] Jane Doe" and mine["links"][0]["users"][0]["last_login_at"]

    # Time's up.
    TempUser.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    TempLink.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    assert login(client, authenticator, "Jane_Doe", guest["password"])["reason"] == "temporary access has ended"
    resp = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Late Comer"}, content_type="application/json")
    assert resp.status_code == 410 and "expired" in resp.json()["detail"]


def test_temp_link_limits_and_revoking(host, api_client, client, authenticator):
    assert make_link(api_client, host, hours=100).status_code == 400  # over the 48-hour cap
    assert make_link(api_client, host, label="  ").status_code == 400
    assert make_link(api_client, host, groups=["directors"]).status_code == 403  # only managers pick other groups
    link = make_link(api_client, host, max_uses=1).json()
    token = link["url"].rsplit("/", 1)[1]
    first = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest A"}, content_type="application/json").json()
    resp = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest B"}, content_type="application/json")
    assert resp.status_code == 410 and "used up" in resp.json()["detail"]
    assert client.get(f"/api/public/p/mumble/temp/{token}").json()["status"] == "used_up"
    # A name the host already uses in Mumble can't be taken by a guest.
    assert login(client, authenticator, "Guest_A", first["password"])["result"] == "ok"

    api_client.force_login(host)
    out = api_client.call("delete", f"/api/p/mumble/temp/{link['id']}").json()
    assert out["status"] == "revoked"
    assert login(client, authenticator, "Guest_A", first["password"])["result"] == "reject"
    assert client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest C"}, content_type="application/json").status_code == 410


def test_cutting_off_one_guest(host, api_client, client, authenticator):
    link = make_link(api_client, host).json()
    token = link["url"].rsplit("/", 1)[1]
    a = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest A"}, content_type="application/json").json()
    b = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest B"}, content_type="application/json").json()
    api_client.force_login(host)
    temp_a = TempUser.objects.get(username="Guest_A")
    out = api_client.call("delete", f"/api/p/mumble/temp/users/{temp_a.pk}").json()
    assert [u["active"] for u in out["users"]] == [True, False]  # newest first
    assert login(client, authenticator, "Guest_A", a["password"])["result"] == "reject"
    assert login(client, authenticator, "Guest_B", b["password"])["result"] == "ok"


def test_guest_names_cant_take_a_members_login(setup, host, api_client, client):
    pilot, _ = setup
    create(api_client, pilot)
    link = make_link(api_client, host).json()
    token = link["url"].rsplit("/", 1)[1]
    guest = client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Pilot One"}, content_type="application/json").json()
    assert guest["username"] == "Pilot_One_2"
    assert client.post(f"/api/public/p/mumble/temp/{token}", {"name": "!"}, content_type="application/json").status_code == 400


def test_visitors_are_rate_limited(host, api_client, client):
    from conduit_mumble import public_api

    link = make_link(api_client, host).json()
    token = link["url"].rsplit("/", 1)[1]
    for i in range(public_api.REDEEM_LIMIT):
        assert client.post(f"/api/public/p/mumble/temp/{token}", {"name": f"Guest {i}"}, content_type="application/json").status_code == 200
    assert client.post(f"/api/public/p/mumble/temp/{token}", {"name": "One more"}, content_type="application/json").status_code == 429


def test_temp_links_need_the_permission_and_the_switch(setup, host, api_client):
    pilot, _ = setup
    api_client.force_login(pilot)
    assert api_client.call("get", "/api/p/mumble/temp").status_code == 403
    assert not api_client.call("get", "/api/p/mumble/me").json()["can_temp"]
    s = MumbleSettings.load()
    s.temp_enabled = False
    s.save()
    assert make_link(api_client, host).status_code == 403
    api_client.force_login(host)
    assert not api_client.call("get", "/api/p/mumble/me").json()["can_temp"]


def test_links_are_private_unless_you_manage_mumble(host, api_client, corp):
    make_link(api_client, host)
    other = make_user(90000011, "Other FC", corporation=corp)
    other.user_permissions.add(Permission.objects.get(codename="create_temp_links"))
    api_client.force_login(other)
    assert api_client.call("get", "/api/p/mumble/temp").json()["links"] == []
    link_id = TempLink.objects.get().pk
    assert api_client.call("delete", f"/api/p/mumble/temp/{link_id}").status_code == 404
    other.user_permissions.add(Permission.objects.get(codename="manage_mumble"))
    api_client.force_login(other)
    out = api_client.call("get", "/api/p/mumble/temp").json()
    assert len(out["links"]) == 1 and out["can_manage"] and out["known_groups"] == ["capitals", "member", "temp"]
    assert make_link(api_client, other, groups=["capitals"]).json()["groups"] == ["capitals"]


def test_cleanup_forgets_old_guests(host, api_client, client):
    link = make_link(api_client, host).json()
    token = link["url"].rsplit("/", 1)[1]
    client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest A"}, content_type="application/json")
    assert services.cleanup() == {"temp_users": 0, "temp_links": 0}
    TempUser.objects.update(expires_at=timezone.now() - timedelta(days=8))
    assert services.cleanup()["temp_users"] == 1 and TempLink.objects.exists()
    TempLink.objects.update(expires_at=timezone.now() - timedelta(days=31))
    assert services.cleanup()["temp_links"] == 1 and not TempLink.objects.exists()


# --- admin ------------------------------------------------------------------------------------------------------------


@pytest.fixture
def manager(setup, corp):
    m = make_user(90000020, "Comms Director", corporation=corp)
    m.user_permissions.add(Permission.objects.get(codename="manage_mumble"))
    return m


def test_settings_and_mappings(manager, api_client, setup):
    pilot, caps = setup
    api_client.force_login(pilot)
    assert api_client.call("get", "/api/p/mumble/admin").status_code == 403
    api_client.force_login(manager)
    body = {"host": "mumble://Voice.Example.com/", "port": 64738, "server_name": "Comms", "username_format": "{character}",
            "display_format": "{corp_ticker} {character}", "allow_cert_auth": True, "temp_enabled": True, "temp_group": "Guests!",
            "temp_display_format": "(guest) {name}", "temp_max_hours": 12}
    resp = api_client.call("put", "/api/p/mumble/admin/settings", body)
    assert resp.status_code == 200, resp.content
    st = resp.json()["settings"]
    assert st["host"] == "voice.example.com" and st["temp_group"] == "guests" and st["temp_max_hours"] == 12
    assert api_client.call("put", "/api/p/mumble/admin/settings", {**body, "display_format": "{nope}"}).status_code == 400
    assert api_client.call("put", "/api/p/mumble/admin/settings", {**body, "host": "voice example"}).status_code == 400
    assert api_client.call("put", "/api/p/mumble/admin/settings", {**body, "port": 70000}).status_code == 400

    resp = api_client.call("put", "/api/p/mumble/admin/mappings", {"mappings": [
        {"kind": "group", "target_id": caps.pk, "mumble_group": "Capital Pilots"},
        {"kind": "state", "target_id": pilot.state_id, "mumble_group": "member"},
        {"kind": "state", "target_id": pilot.state_id, "mumble_group": "member"},  # a repeat is folded
    ]})
    assert resp.status_code == 200, resp.content
    assert [(m["kind"], m["mumble_group"]) for m in resp.json()["mappings"]] == [("group", "capitalpilots"), ("state", "member")]
    assert resp.json()["known_groups"] == ["capitalpilots", "guests", "member"]
    assert api_client.call("put", "/api/p/mumble/admin/mappings", {"mappings": [{"kind": "group", "target_id": 999, "mumble_group": "x"}]}).status_code == 400


def test_manager_lists_accounts_resets_passwords_and_deletes(manager, setup, api_client, client, authenticator):
    pilot, _ = setup
    create(api_client, pilot)
    api_client.force_login(manager)
    rows = api_client.call("get", "/api/p/mumble/admin/members").json()
    assert len(rows) == 1 and rows[0]["user"]["name"] == "Pilot One" and rows[0]["groups_due"] == ["member"] and rows[0]["has_access"]
    assert rows[0]["characters"][0]["name"] == "Pilot One" and rows[0]["characters"][0]["main"]
    reset = api_client.call("post", f"/api/p/mumble/admin/members/{pilot.pk}/password").json()
    assert reset["username"] == "Pilot_One" and login(client, authenticator, "Pilot_One", reset["password"])["result"] == "ok"
    assert Notification.objects.filter(user=pilot, category="p.mumble", title__contains="reset").exists()
    assert api_client.call("delete", f"/api/p/mumble/admin/members/{pilot.pk}").status_code == 200
    assert not MumbleUser.objects.exists() and Notification.objects.filter(user=pilot, title__contains="deleted").exists()
    assert api_client.call("delete", f"/api/p/mumble/admin/members/{pilot.pk}").status_code == 404


def test_authenticator_files_come_with_the_site_filled_in(manager, api_client, settings):
    settings.SITE_URL = "https://auth.example.org"
    api_client.force_login(manager)
    resp = api_client.get("/api/p/mumble/admin/authenticator/authenticator.ini")
    assert resp.status_code == 200 and resp["Content-Disposition"].endswith('"authenticator.ini"')
    assert "url = https://auth.example.org" in resp.content.decode() and "p.mumble:auth" in resp.content.decode()
    script = api_client.get("/api/p/mumble/admin/authenticator/conduit_mumble_authenticator.py")
    assert script.status_code == 200 and b"ServerUpdatingAuthenticator" in script.content
    assert api_client.get("/api/p/mumble/admin/authenticator/conduit-mumble-authenticator.service").status_code == 200
    assert api_client.get("/api/p/mumble/admin/authenticator/etc_passwd").status_code == 404


def test_admin_overview_counts(manager, host, setup, api_client, client):
    pilot, _ = setup
    create(api_client, pilot)
    link = make_link(api_client, host).json()
    token = link["url"].rsplit("/", 1)[1]
    client.post(f"/api/public/p/mumble/temp/{token}", {"name": "Guest A"}, content_type="application/json")
    api_client.force_login(manager)
    out = api_client.call("get", "/api/p/mumble/admin").json()
    assert out["stats"] == {"accounts": 1, "temp_active": 1, "temp_links": 1} and out["scope"] == "p.mumble:auth"
    assert len(api_client.call("get", "/api/p/mumble/admin/temp").json()) == 1


# --- the site account changes -----------------------------------------------------------------------------------------


def test_merged_accounts_keep_one_mumble_login(setup, corp, api_client, django_capture_on_commit_callbacks):
    from conduit.accounts.services import move_characters

    pilot, _ = setup
    second = make_user(90000002, "Pilot Alt", corporation=corp)
    second.user_permissions.add(Permission.objects.get(codename="access_mumble"))
    create(api_client, second)
    admin = make_user(90000099, "Admin")
    admin.is_superuser = True
    admin.save()
    with django_capture_on_commit_callbacks(execute=True):
        move_characters(admin, second, pilot, [90000002])
    assert MumbleUser.objects.get(user=pilot).username == "Pilot_Alt"
    # Both had one: the main keeps its own and the old account's is deleted.
    third = make_user(90000003, "Pilot Alt Two", corporation=corp)
    third.user_permissions.add(Permission.objects.get(codename="access_mumble"))
    create(api_client, third)
    with django_capture_on_commit_callbacks(execute=True):
        move_characters(admin, third, pilot, [90000003])
    assert list(MumbleUser.objects.values_list("username", flat=True)) == ["Pilot_Alt"]


def test_new_member_states_may_use_mumble(setup, db, django_capture_on_commit_callbacks):
    from conduit.access.models import State

    with django_capture_on_commit_callbacks(execute=True):
        st = State.objects.create(name="Blues", priority=5)
        guests = State.objects.create(name="Everyone", priority=-5, public=True)
    assert st.permissions.filter(codename="access_mumble").exists()
    assert not guests.permissions.filter(codename="access_mumble").exists()
