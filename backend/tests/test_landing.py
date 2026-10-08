"""The landing page at /home: defaults, editing, validation and being the start page."""

import pytest

from conduit.audit.models import AuditEvent
from conduit.site.landing import DEFAULT_LANDING
from conduit.site.models import SiteSettings


def edited():
    return {
        "hero": {"eyebrow": "Hi", "title": "Welcome to {site}", "subtitle": "", "image_url": "", "show_profile": False},
        "buttons": [{"label": "Rules", "link": "https://example.com/rules", "style": "primary"}],
        "show_status": False,
        "cards_title": "",
        "cards": [{"icon": "not-an-icon", "title": "Fleets", "text": "", "link": "/p/fleets"}],
        "sections": [{"title": "Doctrine", "body": "**Fly** what you're told."}],
    }


@pytest.mark.django_db
def test_default_landing_needs_a_login(user, client):
    assert client.get("/api/core/landing").status_code == 401
    client.force_login(user)
    data = client.get("/api/core/landing").json()
    assert data["is_default"] is True and data["content"] == DEFAULT_LANDING


@pytest.mark.django_db
def test_admin_edits_and_resets_landing(admin_user, user, api_client):
    api_client.force_login(user)
    assert api_client.call("put", "/api/admin/landing", edited()).status_code == 403
    api_client.force_login(admin_user)
    saved = api_client.call("put", "/api/admin/landing", edited()).json()
    assert saved["is_default"] is False
    assert saved["content"]["cards"][0]["icon"] == "box"  # unknown icons fall back
    assert SiteSettings.load().landing["sections"][0]["title"] == "Doctrine"
    reset = api_client.call("delete", "/api/admin/landing").json()
    assert reset["is_default"] is True and SiteSettings.load().landing == {}
    actions = set(AuditEvent.objects.values_list("action", flat=True))
    assert {"site.landing_changed", "site.landing_reset"} <= actions


@pytest.mark.django_db
@pytest.mark.parametrize("patch", [
    {"buttons": [{"label": "Bad", "link": "javascript:alert(1)", "style": "primary"}]},
    {"buttons": [{"label": "Bad", "link": "//evil.example", "style": "primary"}]},
    {"cards": [{"icon": "box", "title": "x", "text": "", "link": "http://plain.example"}]},
    {"hero": {"title": "x", "image_url": "http://plain.example/a.png"}},
    {"cards": [{"icon": "box", "title": "x"}] * 13},
])
def test_landing_rejects_unsafe_or_oversized_content(admin_user, api_client, patch):
    api_client.force_login(admin_user)
    assert api_client.call("put", "/api/admin/landing", {**edited(), **patch}).status_code == 422


@pytest.mark.django_db
def test_new_sites_start_on_the_landing_page():
    assert SiteSettings.load().start_page == "/home"


@pytest.mark.django_db
def test_plugin_sections_can_be_hidden(admin_user, api_client):
    api_client.force_login(admin_user)
    body = {**edited(), "hidden_plugin_sections": ["announcements:bulletin", "announcements:bulletin", ""]}
    saved = api_client.call("put", "/api/admin/landing", body).json()
    assert saved["content"]["hidden_plugin_sections"] == ["announcements:bulletin"]
    # Pages saved before plugins could add sections show them all.
    assert api_client.call("put", "/api/admin/landing", edited()).json()["content"]["hidden_plugin_sections"] == []


PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def upload(api_client, content, name="hero.png"):
    from django.core.files.uploadedfile import SimpleUploadedFile

    return api_client.post(
        "/api/admin/images",
        {"file": SimpleUploadedFile(name, content)},
        HTTP_X_CSRFTOKEN=api_client.cookies["csrftoken"].value,
    )


@pytest.mark.django_db
def test_upload_a_hero_image(admin_user, api_client):
    api_client.force_login(admin_user)
    resp = upload(api_client, PNG)
    assert resp.status_code == 200
    url = resp.json()["url"]
    assert url.startswith("/api/core/images/")

    img = api_client.get(url)
    assert img.status_code == 200 and img["Content-Type"] == "image/png" and img.content == PNG
    assert img["X-Content-Type-Options"] == "nosniff"
    assert api_client.get(url, HTTP_IF_NONE_MATCH=img["ETag"]).status_code == 304

    content = edited()
    content["hero"]["image_url"] = url
    assert api_client.call("put", "/api/admin/landing", content).json()["content"]["hero"]["image_url"] == url


@pytest.mark.django_db
def test_only_real_images_are_taken(admin_user, user, api_client):
    api_client.force_login(admin_user)
    assert upload(api_client, b"<svg onload=alert(1)>", "x.svg").status_code == 400
    assert upload(api_client, b"<html>", "x.png").status_code == 400
    assert upload(api_client, b"\xff\xd8\xff" + b"\x00" * (5 * 1024 * 1024), "big.jpg").status_code == 400
    content = edited()
    content["hero"]["image_url"] = "/api/core/landing"
    assert api_client.call("put", "/api/admin/landing", content).status_code in (400, 422)
    # Members can't upload.
    api_client.force_login(user)
    assert upload(api_client, PNG).status_code == 403


@pytest.mark.django_db
def test_unused_images_are_removed(admin_user, api_client):
    from datetime import timedelta

    from django.utils import timezone

    from conduit.site.models import SiteImage

    api_client.force_login(admin_user)
    kept, dropped, fresh = (upload(api_client, PNG).json()["url"] for _ in range(3))
    SiteImage.objects.update(created_at=timezone.now() - timedelta(hours=2))
    fresh_id = fresh.rsplit("/", 1)[1]
    SiteImage.objects.filter(pk=fresh_id).update(created_at=timezone.now())
    content = edited()
    content["hero"]["image_url"] = kept
    api_client.call("put", "/api/admin/landing", content)
    assert api_client.get(kept).status_code == 200
    assert api_client.get(dropped).status_code == 404
    # Just uploaded into a draft that isn't saved yet: stays for now.
    assert api_client.get(fresh).status_code == 200
    assert api_client.get("/api/core/images/not-a-uuid").status_code == 404
