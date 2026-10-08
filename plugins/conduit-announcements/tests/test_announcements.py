"""Announcements: audiences, read tracking, scheduling, notifications and who may write."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.access.models import State
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_announcements import services
from conduit_announcements.models import Announcement
from tests.conftest import make_user


@pytest.fixture
def people(db, corp):
    sync_installed()
    set_enabled("announcements", True)
    member = State.objects.create(name="Member", priority=10)
    public = State.objects.create(name="Guest", priority=0, public=True)  # before the users: saving a state re-sorts everyone
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    pilot.state = member
    pilot.save()
    guest = make_user(90000002, "Guest Pilot", member=False)
    guest.state = public
    guest.save()
    officer = make_user(90000004, "Officer")
    writer = make_user(90000003, "Writer")
    writer.user_permissions.add(Permission.objects.get(codename="post_announcements"))
    return {"member": member, "pilot": pilot, "guest": guest, "officer": officer, "writer": writer}


def post(api_client, writer, **body):
    api_client.force_login(writer)
    resp = api_client.call("post", "/api/p/announcements", {"title": "Hello", "body": "**Welcome** o7", **body})
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_everyone_sees_an_announcement_for_everyone(people, api_client, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        a = post(api_client, people["writer"])
    assert a["status"] == "live"
    for who in ("pilot", "officer"):
        api_client.force_login(people[who])
        feed = api_client.call("get", "/api/p/announcements").json()
        assert [x["title"] for x in feed["announcements"]] == ["Hello"] and feed["unread"] == 1
        assert "states" not in feed["announcements"][0]  # audience details are for writers
    assert Notification.objects.filter(user=people["officer"], title="Hello", category="p.announcements").exists()


def test_guests_get_neither_the_page_nor_notifications(people, api_client, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        post(api_client, people["writer"])
    api_client.force_login(people["guest"])
    assert api_client.call("get", "/api/p/announcements").status_code == 403
    assert not Notification.objects.filter(user=people["guest"]).exists()


def test_limited_to_a_state_or_group(people, api_client):
    leaders = Group.objects.create(name="Leadership")
    post(api_client, people["writer"], title="Members only", states=[people["member"].pk])
    post(api_client, people["writer"], title="Leaders only", groups=[leaders.pk])
    api_client.force_login(people["pilot"])
    assert [x["title"] for x in api_client.call("get", "/api/p/announcements").json()["announcements"]] == ["Members only"]
    people["officer"].groups.add(leaders)
    api_client.force_login(people["officer"])
    assert [x["title"] for x in api_client.call("get", "/api/p/announcements").json()["announcements"]] == ["Leaders only"]
    assert not Notification.objects.filter(user=people["pilot"], title="Leaders only").exists()


def test_reading_clears_unread(people, api_client):
    post(api_client, people["writer"])
    api_client.force_login(people["pilot"])
    assert api_client.call("post", "/api/p/announcements/read", {}).json() == {"unread": 0}
    assert not api_client.call("get", "/api/p/announcements").json()["announcements"][0]["unread"]


def test_scheduled_ones_wait_and_are_announced_once(people, api_client):
    later = (timezone.now() + timedelta(hours=1)).isoformat()
    a = post(api_client, people["writer"], title="Later", publish_at=later)
    assert a["status"] == "scheduled"
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/announcements").json()["announcements"] == []
    assert not Notification.objects.filter(title="Later").exists()
    # Writers see it with ?all.
    api_client.force_login(people["writer"])
    assert [x["status"] for x in api_client.call("get", "/api/p/announcements?all=true").json()["announcements"]] == ["scheduled"]
    Announcement.objects.filter(pk=a["id"]).update(publish_at=timezone.now() - timedelta(minutes=1))
    assert services.publish_due() == 1 and services.publish_due() == 0
    assert Notification.objects.filter(user=people["pilot"], title="Later").count() == 1


def test_expired_ones_disappear(people, api_client):
    a = post(api_client, people["writer"], title="Old news")
    Announcement.objects.filter(pk=a["id"]).update(expires_at=timezone.now() - timedelta(minutes=1))
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/announcements").json()["announcements"] == []


def test_only_writers_write(people, api_client):
    api_client.force_login(people["pilot"])
    assert api_client.call("post", "/api/p/announcements", {"title": "Mine"}).status_code == 403
    a = post(api_client, people["writer"])
    api_client.force_login(people["pilot"])
    assert api_client.call("delete", f"/api/p/announcements/{a['id']}").status_code == 403
    api_client.force_login(people["writer"])
    assert api_client.call("put", f"/api/p/announcements/{a['id']}", {"title": "  "}).status_code == 400
    edited = api_client.call("put", f"/api/p/announcements/{a['id']}", {"title": "Hello again", "pinned": True}).json()
    assert edited["edited"] and edited["pinned"]
    assert api_client.call("delete", f"/api/p/announcements/{a['id']}").status_code == 200


def test_search(people, api_client):
    post(api_client, people["writer"], title="Moon tax change", body="From October the rate is 8%")
    api_client.force_login(people["pilot"])
    hits = api_client.call("get", "/api/search?q=moon").json()
    group = next(g for g in hits["groups"] if g["key"] == "announcements")
    assert group["hits"][0]["title"] == "Moon tax change"


def test_bulletin_on_the_landing_page(people, api_client):
    """The Bulletin shows what was posted to the landing page and meant for the viewer, pinned first, then newest."""
    old = post(api_client, people["writer"], title="Old news")
    Announcement.objects.filter(pk=old["id"]).update(publish_at=timezone.now() - timedelta(days=3))
    post(api_client, people["writer"], title="Fresh news")
    post(api_client, people["writer"], title="Pinned rules", pinned=True)
    post(api_client, people["writer"], title="Feed only", on_landing=False)
    post(api_client, people["writer"], title="Members only", states=[people["member"].pk])
    api_client.force_login(people["officer"])  # not in the Member state
    bulletin = api_client.call("get", "/api/p/announcements/bulletin").json()
    assert [a["title"] for a in bulletin["announcements"]] == ["Pinned rules", "Fresh news", "Old news"]
    assert bulletin["more"] == 0 and bulletin["announcements"][0]["unread"]
    assert "Feed only" in [a["title"] for a in api_client.call("get", "/api/p/announcements").json()["announcements"]]
    api_client.force_login(people["pilot"])
    bulletin = api_client.call("get", "/api/p/announcements/bulletin?limit=2").json()
    assert [a["title"] for a in bulletin["announcements"]] == ["Pinned rules", "Members only"] and bulletin["more"] == 2
    api_client.force_login(people["guest"])
    assert api_client.call("get", "/api/p/announcements/bulletin").status_code == 403


def test_restricted_announcements_get_their_own_webhook_event(people, api_client, monkeypatch, django_capture_on_commit_callbacks):
    """A webhook into a public channel mustn't post an announcement meant for one state or group."""
    from conduit.events import bus

    sent = []
    monkeypatch.setattr(bus, "emit", lambda name, **payload: sent.append((name, payload)))
    post(api_client, people["writer"], title="For everyone")
    post(api_client, people["writer"], title="Members only", states=[people["member"].pk])
    assert [(n, p["title"], p["audience"]) for n, p in sent if n.startswith("announcements.")] == [
        ("announcements.published", "For everyone", "everyone"),
        ("announcements.published_restricted", "Members only", {"states": ["Member"], "groups": []}),
    ]


def test_pinning_is_audited_and_bodies_cannot_stall_the_server(people, api_client):
    import time

    from conduit.audit.models import AuditEvent

    a = post(api_client, people["writer"])
    assert api_client.call("post", f"/api/p/announcements/{a['id']}/pin", {"pinned": True}).status_code == 200
    assert AuditEvent.objects.filter(action="announcements.pin").exists()
    started = time.monotonic()
    services._plain("[" * 20000 + "](" * 5000)
    assert time.monotonic() - started < 0.5
