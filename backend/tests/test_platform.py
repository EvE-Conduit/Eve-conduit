"""Events, webhooks, notifications, preferences, search, maintenance, impersonation and health."""

import json

import httpx
import pytest
from django.contrib.auth.models import Group, Permission

from conduit.accounts.models import UserPreferences
from conduit.audit.models import AuditEvent
from conduit.events import bus
from conduit.events.models import Webhook, WebhookDelivery
from conduit.events.webhooks import render, sign
from conduit.notify.models import Notification
from conduit.notify.services import notify
from conduit.site.models import SiteSettings

from .conftest import make_user


# --- events ---------------------------------------------------------------------


@pytest.mark.django_db
def test_handlers_run_after_commit_and_failures_are_isolated(django_capture_on_commit_callbacks):
    seen = []

    def broken(event):
        raise RuntimeError("nope")

    def good(event):
        seen.append((event.name, event.payload["x"]))

    bus.on("test.event")(broken)
    bus.on("test.event")(good)
    try:
        with django_capture_on_commit_callbacks(execute=True):
            bus.emit("test.event", x=1)
            assert seen == []  # not before commit
        assert seen == [("test.event", 1)]
    finally:
        bus.off("test.event", broken)
        bus.off("test.event", good)


@pytest.mark.django_db
def test_group_join_emits_event(user, api_client, django_capture_on_commit_callbacks):
    from conduit.access.models import GroupProfile

    group = Group.objects.create(name="Industry")
    GroupProfile.objects.create(group=group, joinable=True)
    seen = []
    handler = bus.on("group.joined")(lambda e: seen.append(e.payload))
    try:
        api_client.force_login(user)
        with django_capture_on_commit_callbacks(execute=True):
            assert api_client.call("post", f"/api/me/groups/{group.pk}/join").status_code == 200
    finally:
        bus.off("group.joined", handler)
    assert seen and seen[0]["group"] == "Industry"


# --- webhooks -------------------------------------------------------------------


def test_render_formats():
    event = {"event": "group.joined", "at": "2026-10-07T10:00:00+00:00", "data": {"summary": "Pilot joined Caps", "link": "/groups"}}
    discord = render("discord", event)
    assert discord["embeds"][0]["description"] == "Pilot joined Caps"
    assert discord["embeds"][0]["url"].endswith("/groups")
    assert "Pilot joined Caps" in render("slack", event)["text"]
    assert render("json", event) == event


@pytest.mark.django_db
def test_webhook_delivery_signs_and_logs(monkeypatch, django_capture_on_commit_callbacks):
    hook = Webhook.objects.create(name="SIEM", kind="json", url="https://example.com/hook", events=["user.created"])
    Webhook.objects.create(name="Other", kind="json", url="https://example.com/other", events=["group.joined"])
    sent = []

    def fake_post(url, content, headers, timeout, follow_redirects):
        sent.append((url, content, headers))
        return httpx.Response(204)

    monkeypatch.setattr("conduit.events.webhooks.httpx.post", fake_post)
    with django_capture_on_commit_callbacks(execute=True):
        bus.emit("user.created", user_id=1, user="Pilot")
    assert len(sent) == 1
    url, body, headers = sent[0]
    assert url == "https://example.com/hook"
    assert headers["X-Conduit-Signature"] == sign(hook.secret, body)
    assert json.loads(body)["data"]["user"] == "Pilot"
    delivery = WebhookDelivery.objects.get()
    assert delivery.ok and delivery.status == 204


@pytest.mark.django_db
def test_failed_delivery_is_recorded(monkeypatch):
    from conduit.events.webhooks import deliver

    hook = Webhook.objects.create(name="Discord", kind="discord", url="https://discord.example/x")
    monkeypatch.setattr("conduit.events.webhooks.httpx.post", lambda *a, **k: httpx.Response(400, text="bad"))
    assert deliver.apply(args=[hook.pk, {"event": "webhook.test", "at": "x", "data": {}}, False]).get() == "failed"
    hook.refresh_from_db()
    assert hook.failures == 1 and hook.last_status == 400


@pytest.mark.django_db
def test_webhook_admin_api(admin_user, user, api_client, monkeypatch):
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/webhooks").status_code == 403
    api_client.force_login(admin_user)
    bad = api_client.call("post", "/api/admin/webhooks", {"name": "x", "url": "http://insecure", "kind": "json"})
    assert bad.status_code == 422
    bad = api_client.call("post", "/api/admin/webhooks", {"name": "x", "url": "https://ok", "events": ["nope"]})
    assert bad.status_code == 422
    resp = api_client.call("post", "/api/admin/webhooks", {"name": "Ops", "url": "https://discord.example/x", "kind": "discord", "events": ["token.invalid"]})
    assert resp.status_code == 200, resp.content
    hook = resp.json()
    monkeypatch.setattr("conduit.events.webhooks.httpx.post", lambda *a, **k: httpx.Response(204))
    test = api_client.call("post", f"/api/admin/webhooks/{hook['id']}/test").json()
    assert test["result"] == "ok"
    assert api_client.call("get", f"/api/admin/webhooks/{hook['id']}/deliveries").json()["count"] == 1
    assert any(e["name"] == "token.invalid" for e in api_client.call("get", "/api/admin/events").json())
    assert AuditEvent.objects.filter(action="webhook.created").exists()


# --- notifications ----------------------------------------------------------------


@pytest.mark.django_db
def test_notify_and_inbox(user, api_client):
    notify(user, "Hello", "World", link="/groups", level="success", category="groups")
    notify([user.pk], "Second")
    api_client.force_login(user)
    data = api_client.call("get", "/api/me/notifications").json()
    assert data["count"] == 2 and data["unread"] == 2
    first = data["items"][0]
    assert first["title"] == "Second"
    assert api_client.call("post", f"/api/me/notifications/{first['id']}/read").json() == {"unread": 1}
    assert api_client.call("get", "/api/me/notifications?unread=true").json()["count"] == 1
    assert api_client.call("post", "/api/me/notifications/read-all").json() == {"unread": 0}
    assert api_client.call("delete", "/api/me/notifications").json() == {"unread": 0}
    assert Notification.objects.count() == 0


@pytest.mark.django_db
def test_muted_category_is_skipped(user):
    prefs = UserPreferences.for_user(user)
    prefs.muted_categories = ["groups"]
    prefs.save()
    assert notify(user, "x", category="groups") == []
    assert len(notify(user, "x", category="groups", force=True)) == 1


@pytest.mark.django_db
def test_other_users_notifications_are_private(user, api_client):
    other = make_user(90000002, "Other")
    n = notify(other, "secret")[0]
    api_client.force_login(user)
    api_client.call("post", f"/api/me/notifications/{n.pk}/read")
    api_client.call("delete", f"/api/me/notifications/{n.pk}")
    n.refresh_from_db()
    assert n.read_at is None


@pytest.mark.django_db
def test_lost_token_notifies_owner(user, monkeypatch, django_capture_on_commit_callbacks):
    from datetime import timedelta

    from django.utils import timezone

    from conduit.esi import tokens
    from conduit.esi.exceptions import TokenInvalid

    token = user.main_character.token
    token.expires_at = timezone.now() - timedelta(minutes=1)
    token.save()

    def refused(data):
        raise TokenInvalid("invalid_grant")

    monkeypatch.setattr(tokens, "_token_request", refused)
    events = []
    handler = bus.on("token.invalid")(lambda e: events.append(e.payload))
    try:
        with django_capture_on_commit_callbacks(execute=True), pytest.raises(TokenInvalid):
            tokens.get_access_token(user.main_character)
    finally:
        bus.off("token.invalid", handler)
    assert Notification.objects.filter(user=user, category="tokens").count() == 1
    assert events[0]["character"] == "Pilot One"


# --- preferences ------------------------------------------------------------------


@pytest.mark.django_db
def test_preferences_round_trip_and_bootstrap(user, api_client):
    api_client.force_login(user)
    prefs = api_client.call("get", "/api/me/preferences").json()
    assert prefs["theme"] == "dark"
    prefs.update(theme="light", timezone="Europe/Oslo", text_scale=1, muted_categories=["groups"])
    assert api_client.call("put", "/api/me/preferences", prefs).status_code == 200
    assert api_client.call("put", "/api/me/preferences", {**prefs, "timezone": "Mars/Base"}).status_code == 400
    boot = api_client.call("get", "/api/core/bootstrap").json()
    assert boot["user"]["preferences"]["theme"] == "light"
    assert boot["user"]["unread_notifications"] == 0
    assert boot["user"]["impersonated_by"] is None
    assert any(c["key"] == "groups" for c in api_client.call("get", "/api/me/preferences/categories").json())


@pytest.mark.django_db
def test_module_preferences(user, api_client):
    api_client.force_login(user)
    assert api_client.call("get", "/api/me/preferences/modules/sample").json() == {"value": None}
    assert api_client.call("put", "/api/me/preferences/modules/sample", {"value": {"compact": True}}).json() == {"value": {"compact": True}}
    assert api_client.call("put", "/api/me/preferences/modules/nope", {"value": 1}).status_code == 404


# --- maintenance ------------------------------------------------------------------


@pytest.mark.django_db
def test_maintenance_mode_blocks_everyone_but_site_managers(user, admin_user, api_client):
    site = SiteSettings.load()
    site.maintenance_mode, site.maintenance_message = True, "Back at 12:00"
    site.save()
    api_client.force_login(user)
    resp = api_client.call("get", "/api/me/characters")
    assert resp.status_code == 503 and resp.json() == {"detail": "Back at 12:00", "maintenance": True}
    boot = api_client.call("get", "/api/core/bootstrap")
    assert boot.status_code == 200 and boot.json()["site"]["maintenance"]["enabled"] is True
    api_client.force_login(admin_user)
    assert api_client.call("get", "/api/me/characters").status_code == 200


# --- impersonation ----------------------------------------------------------------


@pytest.mark.django_db
def test_impersonation_round_trip(user, admin_user, api_client):
    api_client.force_login(admin_user)
    assert api_client.call("post", f"/api/admin/impersonate/{user.pk}").status_code == 200
    boot = api_client.call("get", "/api/core/bootstrap").json()
    assert boot["user"]["id"] == user.pk
    assert boot["user"]["impersonated_by"]["id"] == admin_user.pk
    # Signing out while impersonating returns to the admin instead.
    assert api_client.call("post", "/api/core/logout").json()["impersonation_ended"] is True
    boot = api_client.call("get", "/api/core/bootstrap").json()
    assert boot["user"]["id"] == admin_user.pk and boot["user"]["impersonated_by"] is None
    actions = set(AuditEvent.objects.values_list("action", flat=True))
    assert {"auth.impersonation_started", "auth.impersonation_stopped"} <= actions


@pytest.mark.django_db
def test_impersonation_rules(user, admin_user, api_client):
    helper = make_user(90000005, "Helper")
    helper.user_permissions.add(Permission.objects.get(codename="impersonate_users"))
    api_client.force_login(user)
    assert api_client.call("post", f"/api/admin/impersonate/{helper.pk}").status_code == 403
    api_client.force_login(helper)
    assert api_client.call("post", f"/api/admin/impersonate/{admin_user.pk}").status_code == 403  # not an admin
    assert api_client.call("post", f"/api/admin/impersonate/{user.pk}").status_code == 200
    assert api_client.call("post", "/api/core/impersonate/stop").status_code == 200
    assert api_client.call("post", "/api/core/impersonate/stop").status_code == 400


# --- search -----------------------------------------------------------------------


@pytest.mark.django_db
def test_search_respects_visibility(user, corp, api_client):
    from django.contrib.auth.models import Permission

    from conduit.access.models import GroupProfile

    stranger = make_user(90000002, "Pilot Two", corporation=corp)
    hidden = Group.objects.create(name="Pilot Secret")
    GroupProfile.objects.create(group=hidden, hidden=True)
    api_client.force_login(user)
    groups = {g["key"]: g for g in api_client.call("get", "/api/search?q=pilot").json()["groups"]}
    assert [h["title"] for h in groups["characters"]["hits"]] == ["Pilot One"]
    assert "members" not in groups and "groups" not in groups
    assert api_client.call("get", "/api/search?q=p").json() == {"groups": []}

    user.user_permissions.add(*Permission.objects.filter(codename__in=["view_all_characters", "view_members"]))
    user = type(user).objects.get(pk=user.pk)
    api_client.force_login(user)
    groups = {g["key"]: g for g in api_client.call("get", "/api/search?q=pilot").json()["groups"]}
    assert {h["title"] for h in groups["characters"]["hits"]} == {"Pilot One", "Pilot Two"}
    assert groups["members"]["hits"][0]["title"] == stranger.display_name
    corps = api_client.call("get", "/api/search?q=TCORP").json()["groups"]
    assert corps[0]["key"] == "corporations"


@pytest.mark.django_db
def test_module_search_provider(user, api_client):
    from conduit.modules.services import set_enabled

    set_enabled("sample", True)
    api_client.force_login(user)
    keys = [g["key"] for g in api_client.call("get", "/api/search?q=widget").json()["groups"]]
    assert "sample" in keys


# --- health -----------------------------------------------------------------------


@pytest.mark.django_db
def test_health(admin_user, user, api_client):
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/health").status_code == 403
    api_client.force_login(admin_user)
    data = api_client.call("get", "/api/admin/health").json()
    assert data["checks"]["database"]["ok"] and data["checks"]["cache"]["ok"]
    assert data["celery"]["mode"] == "inline"
    assert data["status"] in {"ok", "degraded"}
    assert data["about"]["users"] == 2


# --- external notifications API -------------------------------------------------------


@pytest.mark.django_db
def test_external_notifications(client, user):
    from conduit.external import areas
    from conduit.external.models import ApiKey

    other = make_user(90000002, "Pilot Two")
    group = Group.objects.create(name="Fleet")
    other.groups.add(group)
    key, secret = ApiKey.issue(name="Bot", scopes=["notify:write"])
    headers = {"HTTP_AUTHORIZATION": f"Bearer {secret}", "content_type": "application/json"}
    body = {"character_ids": [user.main_character_id], "group_ids": [group.pk], "title": "Form up", "link": "/m/fleets"}
    assert client.post("/api/v1/notifications", body, **headers).status_code == 403  # API switched off
    areas.set_enabled("notify", True)
    resp = client.post("/api/v1/notifications", body, **headers)
    assert resp.status_code == 200, resp.content
    assert resp.json() == {"sent": 2, "recipients": 2}
    assert set(Notification.objects.values_list("user_id", flat=True)) == {user.pk, other.pk}
    assert client.post("/api/v1/notifications", {**body, "link": "javascript:x"}, **headers).status_code == 400


@pytest.mark.django_db
def test_sync_failed_event_after_repeated_errors(django_capture_on_commit_callbacks):
    from conduit.sheet.models import SyncStatus
    from conduit.sheet.tasks import SYNC_FAILED_AFTER, _finish

    pilot = make_user(90000003, "Flaky")
    status = SyncStatus.objects.create(character=pilot.main_character, section="skills")
    seen = []
    handler = bus.on("sync.failed")(lambda e: seen.append(e.payload))
    try:
        with django_capture_on_commit_callbacks(execute=True):
            for _ in range(SYNC_FAILED_AFTER + 1):
                _finish(status, SyncStatus.Result.ERROR, "boom", failed=True, interval=60)
    finally:
        bus.off("sync.failed", handler)
    assert len(seen) == 1 and seen[0]["section"] == "skills"
