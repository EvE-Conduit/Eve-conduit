import pytest
from django.contrib.auth.models import Group, Permission

from conduit.access.models import GroupProfile, State
from conduit.access.services import recompute_user_state

from .conftest import make_user


@pytest.fixture
def states(corp):
    guest = State.objects.create(name="Guest", priority=0, public=True)
    member = State.objects.create(name="Member", priority=100)
    member.member_alliances.add(corp.alliance)
    return guest, member


@pytest.mark.django_db
def test_highest_matching_state_wins(states, corp):
    guest, member = states
    outsider = make_user(90000002, "Outsider")
    insider = make_user(90000003, "Insider", corporation=corp)
    assert recompute_user_state(outsider) == guest
    assert recompute_user_state(insider) == member


@pytest.mark.django_db
def test_state_grants_permissions(states, corp):
    _, member = states
    member.permissions.add(Permission.objects.get(codename="view_members"))
    insider = make_user(90000003, "Insider", corporation=corp)
    recompute_user_state(insider)
    insider = type(insider).objects.get(pk=insider.pk)
    assert insider.has_perm("site.view_members")


@pytest.mark.django_db
def test_losing_state_removes_restricted_groups(states, corp):
    guest, member = states
    insider = make_user(90000003, "Insider", corporation=corp)
    recompute_user_state(insider)
    profile = GroupProfile.objects.create(group=Group.objects.create(name="Fleet"))
    profile.allowed_states.add(member)
    insider.groups.add(profile.group)

    insider.main_character.corporation = None
    insider.main_character.alliance = None
    insider.main_character.save()
    assert recompute_user_state(insider) == guest
    assert not insider.groups.filter(pk=profile.group.pk).exists()


@pytest.mark.django_db
def test_admin_endpoints_need_permission(user, admin_user, api_client):
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/states").status_code == 403
    api_client.force_login(admin_user)
    assert api_client.call("get", "/api/admin/states").status_code == 200


@pytest.mark.django_db
def test_create_state_and_group_via_api(admin_user, api_client, corp):
    api_client.force_login(admin_user)
    resp = api_client.call(
        "post",
        "/api/admin/states",
        {"name": "Member", "priority": 10, "member_corporations": [corp.id], "permissions": ["site.view_members"]},
    )
    assert resp.status_code == 200, resp.content
    state = resp.json()
    assert state["member_corporations"][0]["ticker"] == "TCORP"

    resp = api_client.call("post", "/api/admin/groups", {"name": "Capitals", "joinable": True, "allowed_states": [state["id"]]})
    assert resp.status_code == 200, resp.content
    assert resp.json()["allowed_states"][0]["name"] == "Member"


@pytest.mark.django_db
def test_csrf_is_enforced(admin_user, api_client):
    api_client.force_login(admin_user)
    resp = api_client.post("/api/admin/states", data={"name": "X", "priority": 1}, content_type="application/json")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_join_open_group(user, api_client):
    open_group = Group.objects.create(name="Industry")
    GroupProfile.objects.create(group=open_group, joinable=True)
    closed = Group.objects.create(name="Leadership")
    GroupProfile.objects.create(group=closed)

    api_client.force_login(user)
    assert api_client.call("post", f"/api/me/groups/{open_group.pk}/join").status_code == 200
    assert api_client.call("post", f"/api/me/groups/{closed.pk}/join").status_code == 403
    names = {g["name"]: g["member"] for g in api_client.call("get", "/api/me/groups").json()}
    assert names == {"Industry": True, "Leadership": False}


@pytest.mark.django_db
def test_permission_list_hides_automatic_core_permissions(admin_user, api_client):
    api_client.force_login(admin_user)
    names = {p["name"] for p in api_client.call("get", "/api/admin/permissions").json()}
    assert {"site.manage_access", "sheet.view_all_characters", "sheet.view_corporation_characters"} <= names
    assert not any(n.split(".")[1].startswith(("add_", "change_", "delete_", "view_wallet")) for n in names if n.split(".")[0] in {"wallet", "site", "sheet"})
    assert "sample.add_thing" not in names  # (sample plugin has no models; plugin permissions would be kept)
