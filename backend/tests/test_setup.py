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
