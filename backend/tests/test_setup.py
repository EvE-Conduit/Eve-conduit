import pytest

from conduit.site.models import SiteSettings


@pytest.mark.django_db
def test_claim_admin_with_setup_code(user, api_client):
    api_client.force_login(user)
    code = SiteSettings.load().setup_token
    assert api_client.call("post", "/api/setup/claim", {"token": "wrong"}).status_code == 403
    assert api_client.call("post", "/api/setup/claim", {"token": code}).status_code == 200
    user.refresh_from_db()
    assert user.is_superuser

    resp = api_client.call("put", "/api/admin/site", {"name": "Brave Auth", "accent": "#F59E0B"})
    assert resp.status_code == 200 and resp.json()["accent"] == "#f59e0b"
    assert api_client.call("post", "/api/setup/complete").json()["completed"] is True
    # The code is single use: once setup is done nobody else can claim admin.
    assert api_client.call("post", "/api/setup/claim", {"token": code}).status_code == 400


@pytest.mark.django_db
def test_site_validation(admin_user, api_client):
    api_client.force_login(admin_user)
    resp = api_client.call("put", "/api/admin/site", {"name": "X", "accent": "red", "logo_url": "http://x"})
    assert resp.status_code == 422


@pytest.mark.django_db
def test_bootstrap_anonymous(client):
    data = client.get("/api/core/bootstrap").json()
    assert data["user"] is None
    assert data["setup"]["sso_configured"] is True
    assert data["setup"]["install_kind"] == "dev" and data["site"]["url"] == "http://localhost:5173"
    assert "csrftoken" in client.cookies


@pytest.mark.django_db
def test_logout_ends_the_session(api_client, user):
    api_client.force_login(user)
    assert api_client.call("get", "/api/core/bootstrap").json()["user"] is not None
    assert api_client.call("post", "/api/core/logout").status_code == 200
    assert api_client.call("get", "/api/core/bootstrap").json()["user"] is None


def test_start_page_must_be_on_the_site(admin_user, api_client):
    api_client.force_login(admin_user)
    base = {"name": "Brave Auth", "accent": "#f59e0b"}
    assert api_client.call("put", "/api/admin/site", {**base, "start_page": "https://evil.example"}).status_code in (400, 422)
    assert api_client.call("put", "/api/admin/site", {**base, "start_page": "//evil.example"}).status_code in (400, 422)
    resp = api_client.call("put", "/api/admin/site", {**base, "start_page": "/p/news"})
    assert resp.status_code == 200 and resp.json()["start_page"] == "/p/news"


def test_admins_manage_other_admins(admin_user, user, api_client):
    from conduit.notify.models import Notification

    api_client.force_login(admin_user)
    assert [a["name"] for a in api_client.call("get", "/api/admin/admins").json()] == ["Admin Pilot"]
    resp = api_client.call("post", f"/api/admin/admins/{user.pk}")
    assert resp.status_code == 200 and {a["name"] for a in resp.json()} == {"Admin Pilot", "Pilot One"}
    user.refresh_from_db()
    assert user.is_superuser and Notification.objects.filter(user=user, title__contains="administrator").exists()
    assert api_client.call("delete", f"/api/admin/admins/{user.pk}").status_code == 200
    # The last administrator stays.
    assert api_client.call("delete", f"/api/admin/admins/{admin_user.pk}").status_code == 400


def test_only_admins_choose_admins(user, api_client):
    from django.contrib.auth.models import Permission

    from tests.conftest import make_user

    user.user_permissions.add(Permission.objects.get(codename="manage_site"))
    other = make_user(90000002, "Other Pilot")
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/admins").status_code == 403
    assert api_client.call("post", f"/api/admin/admins/{other.pk}").status_code == 403
    other.refresh_from_db()
    assert not other.is_superuser


def test_whoever_claims_the_site_is_the_super_admin(user, api_client):
    from tests.conftest import make_user

    site = SiteSettings.load()
    api_client.force_login(user)
    assert api_client.call("post", "/api/setup/claim", {"token": site.setup_token}).status_code == 200
    assert SiteSettings.load().owner_id == user.pk
    assert api_client.call("get", "/api/core/bootstrap").json()["user"]["is_owner"]
    # The code is spent by the claim (even before setup is finished): nobody else becomes admin or owner with it.
    other = make_user(90000002, "Other Pilot")
    api_client.force_login(other)
    assert api_client.call("post", "/api/setup/claim", {"token": site.setup_token}).status_code == 403
    assert SiteSettings.load().owner_id == user.pk


def test_super_admin_cant_be_removed(admin_user, user, api_client):
    SiteSettings.objects.update_or_create(pk=1, defaults={"owner": admin_user})
    user.is_superuser = True
    user.save()
    api_client.force_login(user)
    admins = {a["name"]: a for a in api_client.call("get", "/api/admin/admins").json()}
    assert admins["Admin Pilot"]["is_owner"] and not admins["Pilot One"]["is_owner"]
    resp = api_client.call("delete", f"/api/admin/admins/{admin_user.pk}")
    assert resp.status_code == 400 and "super admin" in resp.json()["detail"]
    admin_user.refresh_from_db()
    assert admin_user.is_superuser
    # The super admin can still remove other admins.
    api_client.force_login(admin_user)
    assert api_client.call("delete", f"/api/admin/admins/{user.pk}").status_code == 200


def test_existing_sites_find_their_owner(admin_user, user):
    import importlib

    from django.apps import apps

    from conduit.audit.models import AuditEvent

    owner_migration = importlib.import_module("conduit.site.migrations.0007_site_owner")
    user.is_superuser = True
    user.save()
    SiteSettings.load()
    # Pilot One claimed the site; Admin Pilot was made an administrator later.
    AuditEvent.objects.create(action="setup.admin_claimed", summary="claimed", actor_type="user", actor_id=user.pk, actor_name=user.display_name)
    owner_migration.find_owner(apps, None)
    assert SiteSettings.load().owner_id == user.pk


def test_sidebar_links(admin_user, api_client, client):
    api_client.force_login(admin_user)
    base = {"name": "Brave Auth", "accent": "#f59e0b"}
    links = [
        {"label": "Wiki", "url": "https://wiki.example.com", "icon": "book-open"},
        {"label": "Fleet timers", "url": "/p/timers", "icon": "not-an-icon"},
    ]
    resp = api_client.call("put", "/api/admin/site", {**base, "nav_links": links, "nav_links_title": " Alliance "})
    assert resp.status_code == 200
    site = api_client.call("get", "/api/core/bootstrap").json()["site"]
    assert site["nav_links_title"] == "Alliance"
    assert site["nav_links"] == [links[0], {**links[1], "icon": "globe"}]
    # Signed-out visitors don't see them.
    assert client.get("/api/core/bootstrap").json()["site"]["nav_links"] == []


@pytest.mark.parametrize(
    "link",
    [
        {"label": "Evil", "url": "javascript:alert(1)"},
        {"label": "Plain", "url": "http://example.com"},
        {"label": "Other site", "url": "//evil.example"},
        {"label": "", "url": "https://example.com"},
        {"label": "Blank", "url": "   "},
    ],
)
def test_sidebar_links_validation(admin_user, api_client, link):
    api_client.force_login(admin_user)
    resp = api_client.call("put", "/api/admin/site", {"name": "Brave Auth", "accent": "#f59e0b", "nav_links": [link]})
    assert resp.status_code in (400, 422)


def test_sidebar_links_must_differ(admin_user, api_client):
    api_client.force_login(admin_user)
    twice = [{"label": "A", "url": "https://a.example"}, {"label": "B", "url": "https://a.example"}]
    resp = api_client.call("put", "/api/admin/site", {"name": "Brave Auth", "accent": "#f59e0b", "nav_links": twice})
    assert resp.status_code in (400, 422)


# --- the EVE application entered on the website ---------------------------------------------------


def raw_site_secret() -> str:
    """The esi_secret_key column as stored, without the field's decryption."""
    from django.db import connection

    with connection.cursor() as cur:
        cur.execute(f"SELECT esi_secret_key FROM {SiteSettings._meta.db_table} WHERE id = 1")
        return cur.fetchone()[0]


@pytest.fixture
def no_env_sso(db, settings, monkeypatch):
    """The config file doesn't name an EVE application, and EVE accepts whatever the wizard sends."""
    settings.ESI_CLIENT_ID = ""
    settings.ESI_SECRET_KEY = ""
    monkeypatch.setattr("conduit.esi.credentials.check", lambda cid, key: "")


def test_wizard_connects_the_eve_application(no_env_sso, user, api_client, client):
    from conduit.esi.credentials import credentials
    from conduit.esi.tokens import sso_configured

    assert not sso_configured()
    setup = client.get("/api/core/bootstrap").json()["setup"]
    assert setup["sso_configured"] is False and setup["sso_source"] == "" and setup["verified"] is False

    code = SiteSettings.load().setup_token
    body = {"token": "wrong", "client_id": "abc123", "secret_key": "s3cret"}
    assert api_client.call("post", "/api/setup/sso", body).status_code == 403
    resp = api_client.call("post", "/api/setup/sso", {**body, "token": code})
    assert resp.status_code == 200
    assert resp.json()["sso_configured"] is True and resp.json()["sso_source"] == "site" and resp.json()["verified"] is True
    assert credentials() == ("abc123", "s3cret") and sso_configured()
    # The secret is stored encrypted, not as typed.
    assert raw_site_secret() != "s3cret"
    assert SiteSettings.load().esi_secret_key == "s3cret"

    # Having entered the code with the application, the same browser becomes admin without typing it again.
    api_client.force_login(user)
    assert api_client.call("post", "/api/setup/claim", {}).status_code == 200
    user.refresh_from_db()
    assert user.is_superuser
    # ...and only once.
    api_client.call("post", "/api/setup/complete")
    assert api_client.call("post", "/api/setup/sso", {**body, "token": code}).status_code == 400


def test_wizard_rejects_credentials_eve_refuses(no_env_sso, monkeypatch, api_client):
    monkeypatch.setattr("conduit.esi.credentials.check", lambda cid, key: "EVE's login server doesn't know this Client ID and Secret Key.")
    code = SiteSettings.load().setup_token
    resp = api_client.call("post", "/api/setup/sso", {"token": code, "client_id": "abc", "secret_key": "nope"})
    assert resp.status_code == 400 and "doesn't know" in resp.json()["detail"]
    assert SiteSettings.load().esi_client_id == ""


def test_config_file_wins_over_the_website(user, api_client):
    """ESI_CLIENT_ID / ESI_SECRET_KEY in the config file (set in tests/settings.py) take precedence, and the
    wizard and Settings say so instead of silently storing something that isn't used."""
    from conduit.esi.credentials import credentials, source

    SiteSettings.objects.filter(pk=1).update(esi_client_id="site-id")
    site = SiteSettings.load()
    site.esi_secret_key = "site-secret"
    site.save()
    assert source() == "env" and credentials() == ("test-client", "test-secret-key")
    code = site.setup_token
    resp = api_client.call("post", "/api/setup/sso", {"token": code, "client_id": "x", "secret_key": "y"})
    assert resp.status_code == 400 and "config file" in resp.json()["detail"]


def test_admins_change_the_eve_application(no_env_sso, admin_user, api_client):
    from conduit.esi.credentials import credentials

    api_client.force_login(admin_user)
    current = api_client.call("get", "/api/admin/site/sso").json()
    assert current["configured"] is False and current["source"] == "" and current["callback_url"].endswith("/sso/callback")
    assert api_client.call("put", "/api/admin/site/sso", {"client_id": "only-id", "secret_key": ""}).status_code == 400
    resp = api_client.call("put", "/api/admin/site/sso", {"client_id": "new-id", "secret_key": "new-secret"})
    assert resp.status_code == 200 and resp.json()["source"] == "site" and resp.json()["client_id"] == "new-id"
    assert credentials() == ("new-id", "new-secret")
    # Both empty removes it.
    resp = api_client.call("put", "/api/admin/site/sso", {"client_id": "", "secret_key": ""})
    assert resp.status_code == 200 and resp.json()["configured"] is False
    assert credentials() == ("", "")


def test_only_site_managers_see_the_eve_application(no_env_sso, user, api_client):
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/site/sso").status_code == 403
    assert api_client.call("put", "/api/admin/site/sso", {"client_id": "a", "secret_key": "b"}).status_code == 403


def test_rotate_token_key_covers_the_site_secret(no_env_sso, settings):
    from django.core.management import call_command

    from conduit.accounts import crypto

    site = SiteSettings.load()
    site.esi_secret_key = "s3cret"
    site.save()
    old_cipher = raw_site_secret()
    from cryptography.fernet import Fernet

    settings.CONDUIT_TOKEN_KEY = Fernet.generate_key().decode()
    crypto._fernet.cache_clear()
    call_command("rotate_token_key")
    assert raw_site_secret() != old_cipher
    assert SiteSettings.load().esi_secret_key == "s3cret"
    crypto._fernet.cache_clear()


@pytest.mark.django_db
def test_login_over_plain_http_on_an_https_site_is_refused(client, settings):
    """Opened over http:// while configured for https://, the Secure session cookie would be dropped and the
    login would seem to do nothing; say so instead."""
    settings.SESSION_COOKIE_SECURE = True
    assert client.get("/sso/login")["Location"] == "/login?error=insecure"
    assert client.get("/sso/login", secure=True)["Location"].startswith("https://login.eveonline.com/")
