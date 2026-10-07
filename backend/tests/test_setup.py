import pytest

from evecsm.site.models import SiteSettings


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
