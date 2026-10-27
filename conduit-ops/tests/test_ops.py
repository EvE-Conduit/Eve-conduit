"""Ops calendar: who sees which op, who may write, RSVPs, telling people, reminders, doctrines and search."""

from datetime import UTC, datetime, timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_ops import services
from conduit_ops.models import Op, Rsvp
from tests.conftest import make_user


@pytest.fixture
def people(db, corp):
    sync_installed()
    set_enabled("ops", True)
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    other = make_user(90000002, "Pilot Two", corporation=corp)
    guest = make_user(90000003, "Guest Pilot", member=False)
    fc = make_user(90000004, "Fleet Commander", corporation=corp)
    fc.user_permissions.add(Permission.objects.get(codename="schedule_ops"))
    fc2 = make_user(90000005, "Other FC", corporation=corp)
    fc2.user_permissions.add(Permission.objects.get(codename="schedule_ops"))
    director = make_user(90000006, "Director", corporation=corp)
    director.user_permissions.add(Permission.objects.get(codename="manage_ops"))
    return {"pilot": pilot, "other": other, "guest": guest, "fc": fc, "fc2": fc2, "director": director}


def post(api_client, who, **body):
    api_client.force_login(who)
    payload = {"title": "Sunday roam", "kind": "roam", "starts_at": (timezone.now() + timedelta(hours=5)).isoformat(),
               "formup": "Jita 4-4", **body}
    resp = api_client.call("post", "/api/p/ops", payload)
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_members_see_ops_and_are_told(people, api_client, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        op = post(api_client, people["fc"], fc=people["fc"].pk)
    assert op["status"] == "upcoming" and op["fc"]["name"] == "Fleet Commander" and op["can_edit"]
    api_client.force_login(people["pilot"])
    board = api_client.call("get", "/api/p/ops").json()
    assert [o["title"] for o in board["upcoming"]] == ["Sunday roam"] and not board["can_schedule"]
    assert not board["upcoming"][0]["can_edit"] and board["characters"] == [{"id": 90000001, "name": "Pilot One"}]
    n = Notification.objects.get(user=people["pilot"], category="p.ops")
    assert n.title == "Roam: Sunday roam" and "FC Fleet Commander, form-up Jita 4-4." in n.body
    assert not Notification.objects.filter(user=people["guest"]).exists()
    api_client.force_login(people["guest"])
    assert api_client.call("get", "/api/p/ops").status_code == 403


def test_who_may_write(people, api_client):
    api_client.force_login(people["pilot"])
    assert api_client.call("post", "/api/p/ops", {"title": "X", "starts_at": timezone.now().isoformat()}).status_code == 403
    assert api_client.call("get", "/api/p/ops/options").status_code == 403
    op = post(api_client, people["fc"])
    body = {"title": "Renamed", "kind": "stratop", "starts_at": op["starts_at"]}
    # Another FC can't touch it, a member neither; the director can.
    for who in ("pilot", "fc2"):
        api_client.force_login(people[who])
        assert api_client.call("put", f"/api/p/ops/{op['id']}", body).status_code == 403
        assert api_client.call("post", f"/api/p/ops/{op['id']}/cancel").status_code == 403
    api_client.force_login(people["director"])
    assert api_client.call("put", f"/api/p/ops/{op['id']}", body).json()["kind"] == "stratop"
    assert api_client.call("get", "/api/p/ops/settings").status_code == 200
    api_client.force_login(people["fc"])
    assert api_client.call("get", "/api/p/ops/settings").status_code == 403
    # Leading an op someone else made lets an FC change it.
    op2 = post(api_client, people["director"], fc=people["fc2"].pk)
    api_client.force_login(people["fc2"])
    assert api_client.call("put", f"/api/p/ops/{op2['id']}", {**body, "starts_at": op2["starts_at"]}).status_code == 200


def test_bad_input(people, api_client):
    op = post(api_client, people["fc"])
    url = f"/api/p/ops/{op['id']}"
    later = (timezone.now() + timedelta(hours=1)).isoformat()
    assert api_client.call("put", url, {"title": " ", "starts_at": later}).status_code == 400
    assert api_client.call("put", url, {"title": "X", "kind": "party", "starts_at": later}).status_code == 400
    assert api_client.call("put", url, {"title": "X", "starts_at": later, "duration_minutes": 5}).status_code == 400
    assert api_client.call("put", url, {"title": "X", "starts_at": (timezone.now() + timedelta(days=200)).isoformat()}).status_code == 400
    assert api_client.call("put", url, {"title": "X", "starts_at": (timezone.now() - timedelta(days=1)).isoformat()}).status_code == 400
    assert api_client.call("put", url, {"title": "X", "starts_at": later, "fc": 999999}).status_code == 400
    assert api_client.call("put", url, {"title": "X", "starts_at": later, "states": [999]}).status_code == 400
    assert api_client.call("get", "/api/p/ops/month?month=nope").status_code == 400


def test_audience_limits_who_sees_and_hears(people, api_client, monkeypatch):
    from conduit.events import bus

    seen = []
    monkeypatch.setattr(bus, "emit", lambda name, **payload: seen.append((name, payload)))
    leadership = Group.objects.create(name="Leadership")
    people["other"].groups.add(leadership)
    op = post(api_client, people["fc"], title="Secret stratop", groups=[leadership.pk])
    ops = [(n, p) for n, p in seen if n.startswith("ops.")]
    assert [n for n, _ in ops] == ["ops.created_restricted"] and ops[0][1]["audience"] == {"states": [], "groups": ["Leadership"]}
    assert Notification.objects.filter(user=people["other"], category="p.ops").exists()
    assert not Notification.objects.filter(user=people["pilot"], category="p.ops").exists()
    api_client.force_login(people["pilot"])
    assert api_client.call("get", "/api/p/ops").json()["upcoming"] == []
    assert api_client.call("post", f"/api/p/ops/{op['id']}/rsvp", {"answer": "going"}).status_code == 404
    api_client.force_login(people["other"])
    assert [o["title"] for o in api_client.call("get", "/api/p/ops").json()["upcoming"]] == ["Secret stratop"]
    # The director and the FC who made it see it anyway.
    api_client.force_login(people["director"])
    assert len(api_client.call("get", "/api/p/ops").json()["upcoming"]) == 1
    # Everyone ops go out as the plain event.
    seen.clear()
    post(api_client, people["fc"])
    ops = [(n, p) for n, p in seen if n.startswith("ops.")]
    assert [n for n, _ in ops] == ["ops.created"] and ops[0][1]["audience"] == "everyone"


def test_rsvp_with_a_character(people, api_client):
    alt = Character.objects.create(id=90000101, name="Pilot Alt", owner_hash="h", user=people["pilot"])
    op = post(api_client, people["fc"])
    url = f"/api/p/ops/{op['id']}/rsvp"
    api_client.force_login(people["pilot"])
    r = api_client.call("post", url, {"answer": "going"}).json()
    assert r["my_answer"] == "going" and r["my_character"] == 90000001 and r["counts"]["going"] == 1
    r = api_client.call("post", url, {"answer": "maybe", "character_id": alt.pk, "note": "  logi   if needed "}).json()
    assert r["my_answer"] == "maybe" and r["my_character"] == alt.pk and r["my_note"] == "logi if needed"
    assert api_client.call("post", url, {"answer": "going", "character_id": 90000002}).status_code == 400
    assert api_client.call("post", url, {"answer": "sure"}).status_code == 400
    # Others see names only; the FC sees the character and note.
    api_client.force_login(people["other"])
    api_client.call("post", url, {"answer": "declined"})
    seen = api_client.call("get", "/api/p/ops").json()["upcoming"][0]
    assert seen["rsvps"] == [{"user": "Pilot One", "answer": "maybe", "character": None, "note": ""}]
    api_client.force_login(people["fc"])
    seen = api_client.call("get", "/api/p/ops").json()["upcoming"][0]
    assert {"user": "Pilot One", "answer": "maybe", "character": "Pilot Alt", "note": "logi if needed"} in seen["rsvps"]
    assert seen["counts"] == {"going": 0, "maybe": 1, "declined": 1}
    # Taking the answer back.
    api_client.force_login(people["pilot"])
    assert api_client.call("post", url, {"answer": None}).json()["my_answer"] is None
    assert Rsvp.objects.filter(user=people["pilot"]).count() == 0


def test_moving_and_cancelling_tell_who_answered(people, api_client):
    op = post(api_client, people["fc"], notify=False)
    assert not Notification.objects.filter(category="p.ops").exists()
    api_client.force_login(people["pilot"])
    api_client.call("post", f"/api/p/ops/{op['id']}/rsvp", {"answer": "going"})
    api_client.force_login(people["fc"])
    later = (timezone.now() + timedelta(hours=8)).isoformat()
    api_client.call("put", f"/api/p/ops/{op['id']}", {"title": "Sunday roam", "starts_at": later})
    assert Notification.objects.filter(user=people["pilot"], title="Moved: Sunday roam").exists()
    assert not Notification.objects.filter(user=people["other"]).exists()
    r = api_client.call("post", f"/api/p/ops/{op['id']}/cancel").json()
    assert r["status"] == "cancelled"
    assert Notification.objects.filter(user=people["pilot"], title="Cancelled: Sunday roam").exists()
    assert api_client.call("put", f"/api/p/ops/{op['id']}", {"title": "Back on", "starts_at": later}).status_code == 400
    api_client.force_login(people["pilot"])
    assert api_client.call("post", f"/api/p/ops/{op['id']}/rsvp", {"answer": "maybe"}).status_code == 400
    board = api_client.call("get", "/api/p/ops").json()
    assert board["upcoming"] == [] and board["past"][0]["status"] == "cancelled"


def test_important_ops_reach_everyone(people, api_client):
    post(api_client, people["director"], title="Keepstar defense", kind="cta", important=True, notify=False)
    n = Notification.objects.get(user=people["pilot"], category="p.ops")
    assert n.title == "CTA: Keepstar defense" and n.level == "danger"


def test_reminders(people, api_client, monkeypatch):
    from conduit.events import bus

    seen = []
    monkeypatch.setattr(bus, "emit", lambda name, **payload: seen.append((name, payload)))
    soon = (timezone.now() + timedelta(minutes=10)).isoformat()
    op = post(api_client, people["fc"], starts_at=soon, ping=True, ping_roles=["123", "<b>", "123"], notify=False)
    cta = post(api_client, people["director"], title="CTA", starts_at=soon, important=True, notify=False)
    post(api_client, people["fc"], title="Far away", notify=False)
    api_client.force_login(people["pilot"])
    api_client.call("post", f"/api/p/ops/{op['id']}/rsvp", {"answer": "maybe"})
    api_client.force_login(people["other"])
    api_client.call("post", f"/api/p/ops/{op['id']}/rsvp", {"answer": "declined"})
    Notification.objects.all().delete()
    seen.clear()
    assert services.remind_due() == 2
    assert services.remind_due() == 0  # each mark once
    assert Notification.objects.filter(user=people["pilot"], title="Op soon: Sunday roam").exists()
    assert not Notification.objects.filter(user=people["other"], title="Op soon: Sunday roam").exists()
    assert Notification.objects.filter(user=people["other"], title="Op soon: CTA").exists()
    by_op = {p["op_id"]: p for n, p in seen if n == "ops.reminder"}
    assert by_op[op["id"]]["ping"] is True and by_op[op["id"]]["mention_roles"] == ["123"]
    assert by_op[cta["id"]]["ping"] is False and by_op[cta["id"]]["mention_roles"] == []


def test_month_and_search(people, api_client):
    when = datetime.now(UTC).replace(day=1, hour=19, minute=0, second=0, microsecond=0) + timedelta(days=40)
    op = post(api_client, people["fc"], title="Moon pop", kind="mining", starts_at=when.isoformat(), fc_name="Rocky")
    api_client.force_login(people["pilot"])
    rows = api_client.call("get", f"/api/p/ops/month?month={when:%Y-%m}").json()
    assert [r["id"] for r in rows] == [op["id"]] and rows[0]["fc"] is None and rows[0]["fc_name"] == "Rocky"
    assert api_client.call("get", f"/api/p/ops/month?month={when + timedelta(days=40):%Y-%m}").json() == []
    groups = {g["key"]: g for g in api_client.call("get", "/api/search?q=rocky").json()["groups"]}
    assert [h["url"] for h in groups["ops"]["hits"]] == [f"/p/ops#o{op['id']}"]


def test_restricted_events_are_private():
    from conduit.events import bus

    for name in ("created", "updated", "cancelled", "reminder"):
        assert bus.is_private(f"ops.{name}_restricted") and not bus.is_private(f"ops.{name}")


def test_fc_search_matches_mains_only(people):
    Character.objects.create(id=90000102, name="Hidden Scout", owner_hash="h2", user=people["fc"])
    assert [p["name"] for p in services.fc_search("fleet")] == ["Fleet Commander"]
    assert services.fc_search("hidden scout") == []  # would tell who owns the alt


def test_doctrine_link(people, api_client):
    from django.apps import apps

    if not apps.is_installed("conduit_doctrines"):
        pytest.skip("the Doctrines plugin isn't installed")
    from conduit_doctrines.models import Doctrine

    shield = Doctrine.objects.create(name="Shield Ferox")
    # Without the plugin on, a doctrine is just a name.
    assert services.doctrine_choices() == []
    op = post(api_client, people["fc"], doctrine_name="  Armor   Hacs ")
    assert op["doctrine"] == {"id": None, "name": "Armor Hacs", "link": None}
    set_enabled("doctrines", True)
    api_client.force_login(people["fc"])
    assert api_client.call("get", "/api/p/ops/options").json()["doctrines"] == [{"id": shield.pk, "name": "Shield Ferox"}]
    op = post(api_client, people["fc"], doctrine_id=shield.pk, doctrine_name="ignored")
    assert op["doctrine"] == {"id": shield.pk, "name": "Shield Ferox", "link": f"/p/doctrines/{shield.pk}"}
    assert api_client.call("post", "/api/p/ops", {"title": "X", "starts_at": op["starts_at"], "doctrine_id": 9999}).status_code == 400
    assert Op.objects.count() == 2
