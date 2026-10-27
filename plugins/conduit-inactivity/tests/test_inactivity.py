"""Inactivity: the signals, the limit, leave of absence, the daily digest, group rules and who may see what."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.access.rules import RULE_TYPES
from conduit.corp.models import CorporationMember
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sheet.overview.models import CharacterInfo
from conduit_inactivity import services
from conduit_inactivity.models import Activity, InactivitySettings, Leave
from tests.conftest import make_user

BASE = "/api/p/inactivity"


def ago(days):
    return timezone.now() - timedelta(days=days)


def today(offset=0):
    return (timezone.localdate() + timedelta(days=offset)).isoformat()


def old(user, days=200, last_login=None):
    """Joined long ago, so only their signals keep them active."""
    type(user).objects.filter(pk=user.pk).update(date_joined=ago(days), last_login=last_login)
    user.refresh_from_db()
    return user


@pytest.fixture
def setup(db, monkeypatch):
    sync_installed()
    set_enabled("inactivity", True)
    hr = old(make_user(90000050, "HR Hannah"), last_login=timezone.now())
    hr.user_permissions.add(*Permission.objects.filter(content_type__app_label="inactivity"))
    viewer = old(make_user(90000051, "Viewer Vic"), last_login=timezone.now())
    viewer.user_permissions.add(Permission.objects.get(codename="view_inactivity"))
    member = old(make_user(90000060, "Quiet Quinn"))
    return hr, viewer, member


def login_quietly(api_client, user):
    """Signing in counts as activity (it's the site signal); these tests sign in through the test client, so undo it."""
    api_client.force_login(user)
    old(user)


def status(user):
    return Activity.objects.get(user=user)


def test_site_signal_and_the_limit(setup):
    _, _, member = setup
    services.scan()
    assert status(member).inactive
    old(member, last_login=ago(10))
    services.scan()
    assert not status(member).inactive and status(member).last_site is not None
    old(member, last_login=ago(31))
    services.scan()
    assert status(member).inactive
    s = InactivitySettings.load()
    s.days = 60
    s.save()
    services.scan()
    assert not status(member).inactive


def test_new_members_count_from_when_they_joined(setup):
    newbie = make_user(90000070, "Fresh Fran")
    services.scan()
    assert not status(newbie).inactive


def test_game_signal_from_sheets_and_corp_tracking(setup, corp):
    _, _, member = setup
    char = member.main_character
    info = CharacterInfo.objects.create(character=char, last_login=ago(40), last_logout=ago(5))
    services.scan()
    assert not status(member).inactive and status(member).last_game is not None
    info.last_logout = ago(39)
    info.save()
    services.scan()
    assert status(member).inactive
    info.online = True  # online now counts as now
    info.save()
    services.scan()
    assert not status(member).inactive
    info.online = False
    info.save()
    CorporationMember.objects.create(corporation=corp, character_id=char.pk, logon_date=ago(2), logoff_date=ago(1))
    services.scan()
    assert not status(member).inactive
    # Switched off, the game doesn't count.
    s = InactivitySettings.load()
    s.use_game = False
    s.save()
    services.scan()
    assert status(member).inactive


def test_fleet_signal(setup):
    pytest.importorskip("conduit_fleets")
    from conduit_fleets.models import Fat, Fleet

    hr, _, member = setup
    set_enabled("fleets", True)
    char = member.main_character
    fleet = Fleet.objects.create(name="Roam", started_at=ago(3))
    # A FAT they added by hand for themselves doesn't count...
    Fat.objects.create(fleet=fleet, character_id=char.pk, character_name=char.name, via=Fat.Via.MANUAL, added_by=member)
    services.scan()
    assert status(member).inactive
    # ...one the FC added does.
    Fat.objects.all().update(added_by=hr)
    services.scan()
    assert not status(member).inactive and status(member).last_fleet is not None
    set_enabled("fleets", False)
    services.scan()
    assert status(member).inactive


def test_only_chosen_states_and_groups_are_checked(setup):
    hr, _, member = setup
    group = Group.objects.create(name="Line members")
    s = InactivitySettings.load()
    s.groups.add(group)
    services.scan()
    assert not Activity.objects.exists()
    member.groups.add(group)
    services.scan()
    assert list(Activity.objects.values_list("user_id", flat=True)) == [member.pk]
    guest = old(make_user(90000080, "Guest Gary", member=False))
    guest.groups.add(group)
    services.scan()
    assert not Activity.objects.filter(user=guest).exists()  # guests are never checked


def test_digest_once_per_newly_inactive_member(setup, monkeypatch):
    hr, viewer, member = setup
    other = old(make_user(90000061, "Silent Sid"))
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name.startswith("inactivity.") and emitted.append((name, kw)))
    services.scan()
    digest = Notification.objects.filter(user=viewer, title="2 members went inactive")
    assert digest.count() == 1 and "Quiet Quinn" in digest[0].body and "Silent Sid" in digest[0].body
    assert Notification.objects.filter(user=hr, title="2 members went inactive").exists()
    assert [n for n, _ in emitted] == ["inactivity.flagged"] and emitted[0][1]["count"] == 2
    assert not Notification.objects.filter(user=member).exists()  # "we miss you" is off by default
    # The next day nobody new: nothing is sent again.
    services.scan()
    assert Notification.objects.filter(user=viewer).count() == 1 and len(emitted) == 1
    # Active again, then quiet again: told again, just that one.
    old(member, last_login=timezone.now())
    services.scan()
    old(member, last_login=ago(45))
    s = InactivitySettings.load()
    s.notify_member = True
    s.save()
    services.scan()
    assert Notification.objects.filter(user=viewer, title="1 member went inactive").exists()
    assert Notification.objects.filter(user=member, title="We haven't seen you in a while").exists()
    assert not Notification.objects.filter(user=other, title="We haven't seen you in a while").exists()


def test_leave_with_approval(setup, api_client):
    hr, _, member = setup
    login_quietly(api_client, member)
    resp = api_client.call("post", f"{BASE}/leave", {"start": today(-1), "end": today(20), "reason": "Moving house"})
    assert resp.status_code == 200 and resp.json()["status"] == "pending"
    assert Notification.objects.filter(user=hr, title="Quiet Quinn asked for leave").exists()
    assert status(member).inactive  # pending leave doesn't protect them
    leave_id = resp.json()["id"]
    assert api_client.call("post", f"{BASE}/leaves/{leave_id}/decide", {"approve": True}).status_code == 403

    api_client.force_login(hr)
    pending = api_client.call("get", f"{BASE}/leaves?status=pending").json()["items"]
    assert [lv["user"]["name"] for lv in pending] == ["Quiet Quinn"]
    resp = api_client.call("post", f"{BASE}/leaves/{leave_id}/decide", {"approve": True, "note": "Good luck"})
    assert resp.json()["status"] == "approved" and resp.json()["running"]
    assert Notification.objects.filter(user=member, title__contains="was approved").exists()
    assert not status(member).inactive
    services.scan()
    assert not status(member).inactive
    members = api_client.call("get", f"{BASE}/members?filter=leave").json()
    assert [m["name"] for m in members["items"]] == ["Quiet Quinn"] and members["items"][0]["on_leave_until"] == today(20)
    assert RULE_TYPES["inactivity_on_leave"].evaluate(member, {})
    # Deciding twice doesn't work; nor does deciding your own.
    assert api_client.call("post", f"{BASE}/leaves/{leave_id}/decide", {"approve": False}).status_code == 400
    own = Leave.objects.create(user=hr, start=timezone.localdate(), end=timezone.localdate())
    assert api_client.call("post", f"{BASE}/leaves/{own.pk}/decide", {"approve": True}).status_code == 403


def test_leave_without_approval_overlaps_and_cancel(setup, api_client):
    hr, _, member = setup
    s = InactivitySettings.load()
    s.leave_needs_approval = False
    s.max_leave_days = 30
    s.save()
    services.scan()
    assert status(member).inactive
    login_quietly(api_client, member)
    resp = api_client.call("post", f"{BASE}/leave", {"start": today(), "end": today(10)})
    assert resp.json()["status"] == "approved" and not status(member).inactive
    assert not Notification.objects.filter(user=hr, title__contains="asked for leave").exists()

    overlap = api_client.call("post", f"{BASE}/leave", {"start": today(10), "end": today(12)})
    assert overlap.status_code == 400 and "already have a leave" in overlap.json()["detail"]
    too_long = api_client.call("post", f"{BASE}/leave", {"start": today(20), "end": today(50)})
    assert "up to 30 days" in too_long.json()["detail"]
    past = api_client.call("post", f"{BASE}/leave", {"start": today(-10), "end": today(-2)})
    assert "already over" in past.json()["detail"]
    backwards = api_client.call("post", f"{BASE}/leave", {"start": today(5), "end": today(3)})
    assert "ends before it starts" in backwards.json()["detail"]
    later = api_client.call("post", f"{BASE}/leave", {"start": today(11), "end": today(12)})
    assert later.status_code == 200

    # Someone else's leave can't be cancelled; their own can.
    leave_id = resp.json()["id"]
    api_client.force_login(hr)
    assert api_client.call("post", f"{BASE}/leave/{leave_id}/cancel").status_code == 404
    login_quietly(api_client, member)
    assert api_client.call("post", f"{BASE}/leave/{leave_id}/cancel").json()["status"] == "cancelled"
    assert status(member).inactive
    assert api_client.call("post", f"{BASE}/leave/{leave_id}/cancel").status_code == 400
    me = api_client.call("get", f"{BASE}/me").json()
    assert [lv["status"] for lv in me["leaves"]] == ["approved", "cancelled"] and not me["can_see_list"]


def test_group_rule_active_recently(setup):
    _, _, member = setup
    rule = RULE_TYPES["inactivity_active"]
    assert not rule.evaluate(member, {"days": 30})  # not checked yet: worked out on the spot
    old(member, last_login=ago(20))
    services.scan()
    assert rule.evaluate(member, {"days": 30}) and not rule.evaluate(member, {"days": 10})
    Leave.objects.create(user=member, start=timezone.localdate(), end=timezone.localdate(), status=Leave.Status.APPROVED)
    assert rule.evaluate(member, {"days": 10})


def test_who_sees_what(setup, api_client):
    hr, viewer, member = setup
    services.scan()
    api_client.force_login(member)
    for path in ("/members", "/members.csv", "/summary", "/leaves"):
        assert api_client.call("get", BASE + path).status_code == 403, path
    assert api_client.call("get", f"{BASE}/settings").status_code == 403
    assert api_client.call("get", f"{BASE}/me").status_code == 200

    api_client.force_login(viewer)
    data = api_client.call("get", f"{BASE}/members?filter=inactive").json()
    assert [m["name"] for m in data["items"]] == ["Quiet Quinn"] and data["counts"]["inactive"] == 1 and not data["can_manage"]
    assert api_client.call("get", f"{BASE}/members?q=viewer").json()["items"][0]["name"] == "Viewer Vic"
    csv_text = api_client.call("get", f"{BASE}/members.csv?filter=inactive").content.decode()
    assert "Quiet Quinn" in csv_text and "Viewer Vic" not in csv_text
    assert api_client.call("get", f"{BASE}/summary").json()["inactive"] == 1
    assert api_client.call("put", f"{BASE}/settings", {}).status_code in (403, 422)

    # Guests don't get the plugin at all.
    guest = make_user(90000090, "Guest Gary", member=False)
    api_client.force_login(guest)
    assert api_client.call("get", f"{BASE}/me").status_code == 403


def test_settings(setup, api_client):
    hr, _, member = setup
    api_client.force_login(hr)
    data = api_client.call("get", f"{BASE}/settings").json()
    assert data["days"] == 30 and data["use_site"]
    body = {**{k: data[k] for k in ("days", "use_site", "use_game", "use_fleets", "states", "groups", "leave_needs_approval",
                                    "max_leave_days", "notify_member")}}
    bad = api_client.call("put", f"{BASE}/settings", {**body, "use_site": False, "use_game": False, "use_fleets": False})
    assert bad.status_code == 400 and "at least one" in bad.json()["detail"]
    assert api_client.call("put", f"{BASE}/settings", {**body, "days": 0}).status_code == 400
    ok = api_client.call("put", f"{BASE}/settings", {**body, "days": 7})
    assert ok.status_code == 200 and ok.json()["days"] == 7
    # Saving checks everyone again, without notifying.
    assert status(member).inactive and not Notification.objects.filter(title__contains="went inactive").exists()


def test_alerts_can_ping_discord():
    assert bus.EVENT_TYPES["inactivity.flagged"].alert and bus.EVENT_TYPES["inactivity.flagged"].manage == "inactivity.manage_leave"
    assert bus.EVENT_TYPES["inactivity.leave_posted"].alert and bus.EVENT_TYPES["inactivity.leave_posted"].manage == "inactivity.manage_leave"


@pytest.mark.django_db
def test_managers_set_discord_pings(user, api_client):
    from conduit.events.models import EventPing

    user.user_permissions.add(Permission.objects.get(content_type__app_label="inactivity", codename="view_inactivity"))
    user = type(user).objects.get(pk=user.pk)
    api_client.force_login(user)
    assert api_client.call("put", "/api/pings/inactivity.flagged", {"ping": True}).status_code == 403
    user.user_permissions.add(Permission.objects.get(content_type__app_label="inactivity", codename="manage_leave"))
    user = type(user).objects.get(pk=user.pk)  # drop the permission cache
    api_client.force_login(user)
    resp = api_client.call("put", "/api/pings/inactivity.flagged", {"ping": True, "roles": ["123"]})
    assert resp.status_code == 200 and resp.json()["ping"] is True
    assert EventPing.objects.get(event="inactivity.flagged").roles == ["123"]
