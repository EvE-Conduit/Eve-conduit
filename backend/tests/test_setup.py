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
    # A second claim (before setup is finished) makes another admin, not another owner.
    other = make_user(90000002, "Other Pilot")
    api_client.force_login(other)
    api_client.call("post", "/api/setup/claim", {"token": site.setup_token})
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
