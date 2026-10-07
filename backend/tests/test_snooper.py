"""The snooper log: who looked at other members' character sheets."""

import pytest
from django.contrib.auth.models import Permission

from conduit.accounts.models import Character
from conduit.audit.models import SnoopEvent

from .conftest import make_user


@pytest.fixture
def hr(corp):
    u = make_user(90000010, "HR Officer", corporation=corp)
    u.user_permissions.add(Permission.objects.get(codename="view_corporation_characters"))
    return u


@pytest.fixture
def member(corp):
    return make_user(90000020, "Line Member", corporation=corp)


@pytest.mark.django_db
def test_viewing_someone_elses_character_is_logged(hr, member, client):
    client.force_login(hr)
    assert client.get("/api/characters/90000020").status_code == 200
    assert client.get("/api/characters/90000020/wallet").status_code == 200
    events = list(SnoopEvent.objects.order_by("id"))
    assert [e.section for e in events] == ["sheet", "wallet"]
    e = events[0]
    assert (e.viewer_id, e.viewer_name) == (hr.pk, "HR Officer")
    assert (e.character_id, e.owner_id, e.owner_name) == (90000020, member.pk, "Line Member")
    assert e.impersonating == ""


@pytest.mark.django_db
def test_own_characters_are_not_logged(hr, corp, client):
    Character.objects.create(id=90000011, name="HR Alt", owner_hash="hash-alt", user=hr, corporation=corp)
    client.force_login(hr)
    assert client.get("/api/characters/90000010").status_code == 200
    assert client.get("/api/characters/90000011/wallet").status_code == 200
    assert not SnoopEvent.objects.exists()


@pytest.mark.django_db
def test_refused_views_are_not_logged(member, client):
    stranger = make_user(90000030, "Stranger")
    client.force_login(stranger)
    assert client.get("/api/characters/90000020").status_code == 403
    assert not SnoopEvent.objects.exists()


@pytest.mark.django_db
def test_repeat_views_are_recorded_once_per_window(hr, member, client):
    client.force_login(hr)
    for _ in range(3):
        client.get("/api/characters/90000020/wallet")
    assert SnoopEvent.objects.count() == 1


@pytest.mark.django_db
def test_impersonating_admin_is_the_viewer(member, admin_user, api_client):
    api_client.force_login(admin_user)
    assert api_client.call("post", f"/api/admin/impersonate/{member.pk}").status_code == 200
    # The member's own character, but it's the admin looking.
    assert api_client.call("get", "/api/characters/90000020").status_code == 200
    e = SnoopEvent.objects.get()
    assert (e.viewer_id, e.impersonating, e.owner_id) == (admin_user.pk, "Line Member", member.pk)


@pytest.mark.django_db
def test_snooper_log_endpoint(hr, member, admin_user, client):
    client.force_login(hr)
    client.get("/api/characters/90000020/skills")
    assert client.get("/api/admin/logs/snooper").status_code == 403  # needs site.view_logs
    client.force_login(admin_user)
    data = client.get("/api/admin/logs/snooper?viewer=hr&target=line").json()
    assert data["count"] == 1
    item = data["items"][0]
    assert item["viewer"]["name"] == "HR Officer" and item["character"]["name"] == "Line Member"
    assert item["section"] == "skills"
    assert client.get("/api/admin/logs/snooper?viewer=nobody").json()["count"] == 0
    assert client.get("/api/admin/logs/snooper/sections").json() == ["skills"]
