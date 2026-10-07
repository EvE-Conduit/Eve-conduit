from datetime import timedelta

import pytest
from django.contrib.auth.models import Group
from django.utils import timezone

from evecsm.access.models import GroupProfile, State
from evecsm.audit.models import AuditEvent, ServiceLog
from evecsm.external import areas
from evecsm.external.models import ApiKey, ApiRequest
from evecsm.modules.services import set_enabled as set_module_enabled


def make_key(scopes=(), **fields):
    return ApiKey.issue(name="Discord bot", scopes=list(scopes), **fields)


def call(client, method, path, secret, **kwargs):
    return getattr(client, method)(path, HTTP_AUTHORIZATION=f"Bearer {secret}", content_type="application/json", **kwargs)


def on(*keys):
    for k in keys:
        areas.set_enabled(k, True)


# --- authentication ---------------------------------------------------------------


@pytest.mark.django_db
def test_requires_a_valid_key(client):
    assert client.get("/api/v1/me").status_code == 401
    assert client.get("/api/v1/me", HTTP_AUTHORIZATION="Bearer evk_nope_x").status_code == 401
    key, secret = make_key()
    assert client.get("/api/v1/me", HTTP_AUTHORIZATION=f"Bearer {secret}x").status_code == 401
    resp = client.get("/api/v1/me", HTTP_X_API_KEY=secret)
    assert resp.status_code == 200 and resp.json()["prefix"] == key.prefix


@pytest.mark.django_db
def test_session_login_is_not_enough(client, admin_user):
    client.force_login(admin_user)
    assert client.get("/api/v1/me").status_code == 401


@pytest.mark.django_db
def test_revoked_expired_and_ip_restricted_keys(client):
    key, secret = make_key()
    key.revoked_at = timezone.now()
    key.save()
    assert "revoked" in call(client, "get", "/api/v1/me", secret).json()["detail"]
    key, secret = make_key(expires_at=timezone.now() - timedelta(minutes=1))
    assert "expired" in call(client, "get", "/api/v1/me", secret).json()["detail"]
    key, secret = make_key(allowed_ips=["10.0.0.0/8"])
    assert call(client, "get", "/api/v1/me", secret).status_code == 403
    assert call(client, "get", "/api/v1/me", secret, REMOTE_ADDR="10.1.2.3").status_code == 200


@pytest.mark.django_db
def test_secret_is_not_stored():
    key, secret = make_key()
    assert secret.startswith(key.prefix + "_") and secret not in key.secret_hash


# --- APIs switch on separately; keys need scopes -----------------------------------------


@pytest.mark.django_db
def test_api_must_be_switched_on_and_key_needs_scope(client, user):
    _, secret = make_key(["directory:read"])
    resp = call(client, "get", "/api/v1/users", secret)
    assert resp.status_code == 403 and "switched off" in resp.json()["detail"]
    on("directory")
    data = call(client, "get", "/api/v1/users", secret).json()
    assert data["count"] == 1 and data["items"][0]["main"]["name"] == "Pilot One"
    _, other = make_key(["logs:audit"])
    assert "lacks the directory:read scope" in call(client, "get", "/api/v1/users", other).json()["detail"]


@pytest.mark.django_db
def test_directory(client, user, corp):
    on("directory")
    _, secret = make_key(["directory:read"])
    char = user.main_character
    char.corporation = corp
    char.alliance = corp.alliance
    char.save()
    group = Group.objects.create(name="FC")
    user.groups.add(group)
    assert call(client, "get", f"/api/v1/users?group={group.pk}", secret).json()["items"][0]["groups"] == [{"id": group.pk, "name": "FC"}]
    assert call(client, "get", f"/api/v1/characters?corporation={corp.pk}", secret).json()["items"][0]["is_main"] is True
    assert call(client, "get", "/api/v1/groups", secret).json()[0]["member_count"] == 1
    assert call(client, "get", "/api/v1/corporations", secret).json()[0]["character_count"] == 1
    assert call(client, "get", "/api/v1/alliances", secret).json()[0]["id"] == corp.alliance_id


@pytest.mark.django_db
def test_group_write_is_audited(client, user):
    on("groups")
    key, secret = make_key(["groups:write"])
    group = Group.objects.create(name="Recruits")
    assert call(client, "put", f"/api/v1/groups/{group.pk}/members/{user.pk}", secret).status_code == 200
    assert user.groups.filter(pk=group.pk).exists()
    event = AuditEvent.objects.get(action="group.member_added")
    assert event.actor_type == "api_key" and event.actor_id == key.pk and "Pilot One" in event.summary
    assert call(client, "delete", f"/api/v1/groups/{group.pk}/members/{user.pk}", secret).status_code == 200
    assert not user.groups.filter(pk=group.pk).exists()


@pytest.mark.django_db
def test_group_write_respects_state_restrictions(client, user):
    on("groups")
    _, secret = make_key(["groups:write"])
    group = Group.objects.create(name="Members only")
    profile = GroupProfile.objects.create(group=group)
    profile.allowed_states.add(State.objects.create(name="Member", priority=10))
    assert call(client, "put", f"/api/v1/groups/{group.pk}/members/{user.pk}", secret).status_code == 400


@pytest.mark.django_db
def test_state_write_recomputes_states(client, user, django_capture_on_commit_callbacks):
    on("states")
    _, secret = make_key(["states:write"])
    state = State.objects.create(name="Member", priority=10)
    with django_capture_on_commit_callbacks(execute=True):
        resp = call(client, "post", f"/api/v1/states/{state.pk}/members", secret,
                    data={"type": "character", "id": user.main_character_id})
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.state == state
    with django_capture_on_commit_callbacks(execute=True):
        call(client, "delete", f"/api/v1/states/{state.pk}/members/character/{user.main_character_id}", secret)
    user.refresh_from_db()
    assert user.state is None


@pytest.mark.django_db
def test_sheet_needs_section_scope(client, user):
    on("sheet")
    cid = user.main_character_id
    _, secret = make_key(["sheet:skills"])
    assert call(client, "get", f"/api/v1/characters/{cid}/sheet/skills", secret).status_code == 200
    assert "lacks the sheet:wallet" in call(client, "get", f"/api/v1/characters/{cid}/sheet/wallet", secret).json()["detail"]
    header = call(client, "get", f"/api/v1/characters/{cid}/sheet", secret).json()
    assert [s["key"] for s in header["sections"]] == ["skills"]
    assert call(client, "get", f"/api/v1/characters/{cid}/sheet/nope", secret).status_code == 404
    assert call(client, "get", f"/api/v1/characters/{cid}/sheet/skills/../../../admin/api/keys", secret).status_code == 404


@pytest.mark.django_db
def test_module_api_needs_module_and_api_on(client):
    _, secret = make_key(["m.sample:read"])
    on("m.sample")
    assert call(client, "get", "/api/v1/m/sample/ping", secret).status_code == 404  # module itself is off
    set_module_enabled("sample", True)
    resp = call(client, "get", "/api/v1/m/sample/ping", secret)
    assert resp.status_code == 200 and resp.json() == {"pong": "Discord bot"}


# --- logs ----------------------------------------------------------------------------


@pytest.mark.django_db
def test_every_call_is_logged(client):
    key, secret = make_key()
    call(client, "get", "/api/v1/me", secret)
    client.get("/api/v1/me")
    rows = list(ApiRequest.objects.order_by("id"))
    assert [(r.key_id, r.status) for r in rows] == [(key.pk, 200), (None, 401)]
    assert client.get("/api/v1/docs").status_code == 200 and ApiRequest.objects.count() == 2


@pytest.mark.django_db
def test_logs_api_polls_incrementally(client, admin_user):
    on("logs")
    _, secret = make_key(["logs:audit"])
    from evecsm.audit.services import record

    for i in range(3):
        record("test.event", f"did thing {i}", actor=admin_user)
    first = call(client, "get", "/api/v1/logs/audit?limit=2", secret).json()
    assert [e["summary"] for e in first["items"]] == ["Admin Pilot did thing 0", "Admin Pilot did thing 1"]
    rest = call(client, "get", f"/api/v1/logs/audit?after_id={first['next_after_id']}", secret).json()
    assert [e["summary"] for e in rest["items"]] == ["Admin Pilot did thing 2"]


@pytest.mark.django_db
def test_warnings_land_in_service_log():
    import logging

    logging.getLogger("evecsm.test").warning("disk is %s", "full")
    logging.getLogger("django.request").warning("Not Found: /x")  # 4xx noise is skipped
    assert list(ServiceLog.objects.values_list("logger", "message")) == [("evecsm.test", "disk is full")]


@pytest.mark.django_db
def test_purge_respects_retention(settings):
    from evecsm.audit.tasks import purge_logs

    settings.EVECSM_AUDIT_LOG_DAYS = 30
    old = AuditEvent.objects.create(action="x", summary="old", at=timezone.now() - timedelta(days=31))
    new = AuditEvent.objects.create(action="x", summary="new")
    purge_logs()
    assert list(AuditEvent.objects.all()) == [new] and not AuditEvent.objects.filter(pk=old.pk).exists()


# --- admin endpoints --------------------------------------------------------------


@pytest.mark.django_db
def test_admin_creates_key_and_toggles_api(api_client, admin_user):
    api_client.force_login(admin_user)
    resp = api_client.call("post", "/api/admin/api/keys", {"name": "Bot", "scopes": ["directory:read"], "allowed_ips": ["192.168.1.0/24"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["secret"].startswith(body["key"]["prefix"]) and body["key"]["status"] == "active"
    assert api_client.call("post", "/api/admin/api/keys", {"name": "Bad", "scopes": ["nope:read"]}).status_code == 400
    assert api_client.call("post", "/api/admin/api/keys", {"name": "Bad", "allowed_ips": ["not-an-ip"]}).status_code == 422
    assert api_client.call("post", "/api/admin/api/areas/directory", {"enabled": True}).json()["enabled"] is True
    assert api_client.call("post", f"/api/admin/api/keys/{body['key']['id']}/revoke").json()["status"] == "revoked"
    actions = [e["action"] for e in api_client.call("get", "/api/admin/audit").json()["items"]]
    assert actions == ["api.key_revoked", "api.area_enabled", "api.key_created"]
    areas_out = {a["key"]: a for a in api_client.call("get", "/api/admin/api/areas").json()}
    assert areas_out["m.sample"]["available"] is False and "sheet:skills" in [s["scope"] for s in areas_out["sheet"]["scopes"]]


@pytest.mark.django_db
def test_admin_endpoints_need_permissions(api_client, user):
    api_client.force_login(user)
    for path in ("/api/admin/api/keys", "/api/admin/api/areas", "/api/admin/api/requests", "/api/admin/audit", "/api/admin/logs/service", "/api/admin/logs/files"):
        assert api_client.call("get", path).status_code == 403, path


@pytest.mark.django_db
def test_log_files_only_from_log_dir(api_client, admin_user, settings, tmp_path):
    api_client.force_login(admin_user)
    assert api_client.call("get", "/api/admin/logs/files").json()["configured"] is False
    (tmp_path / "evecsm-web.out.log").write_text("\n".join(f"line {i}" for i in range(1000)))
    (tmp_path.parent / "secret.txt").write_text("nope")
    settings.EVECSM_LOG_DIR = str(tmp_path)
    assert [f["name"] for f in api_client.call("get", "/api/admin/logs/files").json()["files"]] == ["evecsm-web.out.log"]
    data = api_client.call("get", "/api/admin/logs/files/evecsm-web.out.log?lines=3").json()
    assert data["lines"] == ["line 997", "line 998", "line 999"] and data["truncated"] is True
    assert api_client.call("get", "/api/admin/logs/files/..%2Fsecret.txt").status_code == 404


@pytest.mark.django_db
def test_core_changes_are_audited(api_client, admin_user):
    api_client.force_login(admin_user)
    api_client.call("post", "/api/admin/groups", {"name": "Logi"})
    api_client.call("put", "/api/admin/site", {"name": "My Alliance", "accent": "#22d3ee"})
    actions = list(AuditEvent.objects.order_by("id").values_list("action", "actor_type"))
    assert actions == [("group.created", "user"), ("site.settings_changed", "user")]
