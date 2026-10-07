import sys
import types
from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from evecsm.access.compliance import check_user, refresh_user, unregistered_members
from evecsm.access.models import ComplianceStatus
from evecsm.events import bus
from evecsm.notify.models import Notification
from evecsm.sheet import registry
from evecsm.sheet.models import SyncStatus

from .conftest import make_user

ALL = " ".join(["publicData", *registry.all_scopes()])


@pytest.fixture
def events():
    seen = []

    def grab(event):
        seen.append(event)

    bus.on("compliance.changed")(grab)
    yield seen
    bus.off("compliance.changed", grab)


@pytest.mark.django_db
def test_check_user_reports_tokens_scopes_and_syncs():
    u = make_user(scopes="publicData")
    result = check_user(u)
    assert not result["compliant"]
    assert result["characters"][0]["missing_scopes"]
    assert "missing" in result["problems"][0]

    u.main_character.token.scopes = ALL
    u.main_character.token.save()
    SyncStatus.objects.create(character=u.main_character, section="skills", result="error", failures=4, message="boom")
    result = check_user(u)
    assert result["compliant"]  # failing syncs are warnings only
    assert result["warnings"] == ["Pilot One: Skills is failing to update"]

    u.main_character.token.valid = False
    u.main_character.token.save()
    assert check_user(u)["problems"] == ["Pilot One: needs to log in again"]


@pytest.mark.django_db
def test_transitions_emit_and_notify(django_capture_on_commit_callbacks, events):
    u = make_user(scopes=ALL)
    with django_capture_on_commit_callbacks(execute=True):
        refresh_user(u)  # first check, compliant: nothing to say
    assert ComplianceStatus.objects.get(user=u).compliant
    assert not events and not Notification.objects.exists()

    token = u.main_character.token
    token.scopes = "publicData"
    token.save()
    with django_capture_on_commit_callbacks(execute=True):
        refresh_user(u)
    assert [e.payload["compliant"] for e in events] == [False]
    assert Notification.objects.get().category == "compliance"

    with django_capture_on_commit_callbacks(execute=True):
        refresh_user(u)  # unchanged: no repeat
    assert len(events) == 1

    token.scopes = ALL
    token.save()
    with django_capture_on_commit_callbacks(execute=True):
        refresh_user(u)
    assert [e.payload["compliant"] for e in events] == [False, True]
    assert Notification.objects.filter(level="success").count() == 1


@pytest.mark.django_db
def test_lost_token_isnt_announced_twice(django_capture_on_commit_callbacks, events):
    u = make_user(scopes=ALL)
    refresh_user(u)
    u.main_character.token.valid = False
    u.main_character.token.save()
    with django_capture_on_commit_callbacks(execute=True):
        refresh_user(u)
    assert len(events) == 1  # still announced and recorded...
    assert not ComplianceStatus.objects.get(user=u).compliant
    assert not Notification.objects.exists()  # ...but token_lost already told the owner


@pytest.mark.django_db
def test_admin_compliance_api(api_client, admin_user, user, corp):
    refresh_user(user)
    insider = make_user(90000050, "Insider", corporation=corp, scopes=ALL)
    refresh_user(insider)
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/compliance").status_code == 403

    api_client.force_login(admin_user)
    data = api_client.call("get", "/api/admin/compliance").json()
    assert data["summary"]["users"] == 3 and data["summary"]["compliant"] == 1 and data["summary"]["unchecked"] == 1
    assert data["items"][0]["compliant"] is False  # problems first
    only = api_client.call("get", f"/api/admin/compliance?corporation={corp.pk}").json()
    assert [r["name"] for r in only["items"]] == ["Insider"]
    detail = api_client.call("get", f"/api/admin/compliance/users/{user.pk}").json()
    assert detail["characters"][0]["missing_scopes"]
    assert api_client.call("post", "/api/admin/compliance/refresh").json()["checked"] == 3


@pytest.mark.django_db
def test_view_compliance_permission(api_client, user):
    other = make_user(90000060, "Recruiter")
    other.user_permissions.add(Permission.objects.get(codename="view_compliance"))
    api_client.force_login(other)
    assert api_client.call("get", "/api/admin/compliance").status_code == 200


@pytest.mark.django_db
def test_me_compliance(api_client, user):
    api_client.force_login(user)
    out = api_client.call("get", "/api/me/compliance").json()
    assert out["compliant"] is False and out["characters"][0]["name"] == "Pilot One"


@pytest.mark.django_db
def test_unregistered_members(monkeypatch, corp, api_client, admin_user):
    from evecsm.eve.models import EveName

    make_user(90000070, "Registered", corporation=corp)
    EveName.objects.create(id=90000071, name="Lurker", category="character")
    fake = types.ModuleType("evecsm.corp.services")
    fake.member_ids = lambda corporation_id: {90000070, 90000071} if corporation_id == corp.pk else None
    monkeypatch.setitem(sys.modules, "evecsm.corp.services", fake)
    monkeypatch.setattr("evecsm.eve.tasks.ensure_eve_names", lambda ids: None)

    assert [m["name"] for m in unregistered_members(corp.pk)] == ["Lurker"]
    assert unregistered_members(1) is None

    api_client.force_login(admin_user)
    corps = api_client.call("get", "/api/admin/compliance/corporations").json()
    assert corps[0]["unregistered"] == 1
    out = api_client.call("get", f"/api/admin/compliance/corporations/{corp.pk}/unregistered").json()
    assert out == {"available": True, "characters": [{"id": 90000071, "name": "Lurker", "portrait": out["characters"][0]["portrait"]}]}


@pytest.mark.django_db
def test_stale_sync_is_a_warning():
    u = make_user(scopes=ALL)
    SyncStatus.objects.create(character=u.main_character, section="wallet", result="ok",
                              last_success=timezone.now() - timedelta(days=5))
    assert check_user(u)["warnings"] == ["Pilot One: Wallet hasn't updated for a while"]
