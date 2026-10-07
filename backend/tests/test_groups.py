from datetime import timedelta

import pytest
from django.contrib.auth.models import Group
from django.utils import timezone

from conduit.access import groups, rules
from conduit.access.models import AutoGroupGrace, GroupProfile, GroupRequest, State
from conduit.events import bus
from conduit.notify.models import Notification

from .conftest import make_user


def make_group(name, **profile):
    group = Group.objects.create(name=name)
    leaders = profile.pop("leaders", [])
    GroupProfile.objects.create(group=group, **profile)
    group.profile.leaders.set(leaders)
    return group


@pytest.fixture
def events():
    seen = []

    def grab(event):
        seen.append(event)

    bus.on("*")(grab)
    yield seen
    bus.off("*", grab)


# --- join and leave modes ----------------------------------------------------------------


@pytest.mark.django_db
def test_joinable_maps_to_modes():
    g = make_group("Industry", joinable=True)
    assert (g.profile.join_mode, g.profile.leave_mode, g.profile.joinable) == ("open", "open", True)
    g = make_group("Leadership")
    assert (g.profile.join_mode, g.profile.leave_mode, g.profile.joinable) == ("closed", "open", False)


@pytest.mark.django_db
def test_join_modes(user, api_client, django_capture_on_commit_callbacks, events):
    open_g = make_group("Open", join_mode="open")
    ask = make_group("Ask", join_mode="request")
    closed = make_group("Closed", join_mode="closed")
    smart = make_group("Smart", join_mode="open", auto=True, rules={"match": "all", "rules": [{"type": "character_count", "params": {"op": "gte", "count": 1}}]})
    api_client.force_login(user)

    with django_capture_on_commit_callbacks(execute=True):
        r = api_client.call("post", f"/api/me/groups/{open_g.pk}/join")
    assert r.json()["result"] == "joined"
    assert [e.payload["via"] for e in events if e.name == "group.joined"] == ["self"]

    r = api_client.call("post", f"/api/me/groups/{ask.pk}/join", {"message": "I fly logi"})
    assert r.json()["result"] == "requested"
    assert not user.groups.filter(pk=ask.pk).exists()
    assert GroupRequest.objects.get().message == "I fly logi"

    assert api_client.call("post", f"/api/me/groups/{closed.pk}/join").status_code == 403
    assert api_client.call("post", f"/api/me/groups/{smart.pk}/join").status_code == 403

    rows = {g["name"]: g for g in api_client.call("get", "/api/me/groups").json()}
    assert rows["Open"]["member"] and rows["Ask"]["pending_request"]["kind"] == "join"
    assert rows["Smart"]["auto"] and rows["Closed"]["join_mode"] == "closed"


@pytest.mark.django_db
def test_leave_modes(user, api_client):
    free = make_group("Free", leave_mode="open")
    ask = make_group("Ask", leave_mode="request")
    locked = make_group("Locked", leave_mode="closed")
    user.groups.add(free, ask, locked)
    api_client.force_login(user)
    assert api_client.call("post", f"/api/me/groups/{free.pk}/leave").json()["result"] == "left"
    assert api_client.call("post", f"/api/me/groups/{ask.pk}/leave").json()["result"] == "requested"
    assert user.groups.filter(pk=ask.pk).exists()
    assert api_client.call("post", f"/api/me/groups/{locked.pk}/leave").status_code == 403


@pytest.mark.django_db
def test_hidden_groups_stay_hidden(user, api_client):
    member = State.objects.create(name="Member", priority=10)
    g = make_group("Secret", join_mode="open", hidden=True)
    g.profile.allowed_states.add(member)
    api_client.force_login(user)
    assert "Secret" not in {x["name"] for x in api_client.call("get", "/api/me/groups").json()}
    assert api_client.call("post", f"/api/me/groups/{g.pk}/join").status_code == 404


# --- requests and leaders ----------------------------------------------------------------


@pytest.mark.django_db
def test_request_lifecycle_and_notifications(user, api_client, django_capture_on_commit_callbacks, events):
    leader = make_user(90000010, "Leader")
    g = make_group("Capitals", join_mode="request", leaders=[leader])
    api_client.force_login(user)
    with django_capture_on_commit_callbacks(execute=True):
        api_client.call("post", f"/api/me/groups/{g.pk}/join", {"message": "please"})
    assert api_client.call("post", f"/api/me/groups/{g.pk}/join").status_code == 400  # one pending at a time
    note = Notification.objects.get(user=leader)
    assert note.category == "groups" and note.link == "/groups/manage" and "Pilot One" in note.title
    assert [e.name for e in events] == ["group.request_created", "notification.created"]

    req = GroupRequest.objects.get()
    api_client.force_login(leader)
    assert api_client.call("get", "/api/me/leadership").json() == {"leads_groups": True, "group_count": 1, "pending_requests": 1}
    queue = api_client.call("get", "/api/groups/requests").json()
    assert queue[0]["id"] == req.pk and queue[0]["message"] == "please"
    with django_capture_on_commit_callbacks(execute=True):
        r = api_client.call("post", f"/api/groups/requests/{req.pk}/approve", {"response": "welcome"})
    assert r.status_code == 200, r.content
    assert user.groups.filter(pk=g.pk).exists()
    note = Notification.objects.get(user=user)
    assert note.level == "success" and note.body == "welcome"
    joined = [e for e in events if e.name == "group.joined"]
    assert joined[0].payload["via"] == "request"
    # Already answered
    assert api_client.call("post", f"/api/groups/requests/{req.pk}/reject", {}).status_code == 400


@pytest.mark.django_db
def test_reject_and_cancel(user, api_client):
    leader = make_user(90000010, "Leader")
    g = make_group("Capitals", join_mode="request", leaders=[leader])
    api_client.force_login(user)
    api_client.call("post", f"/api/me/groups/{g.pk}/join")
    req = GroupRequest.objects.get()
    assert api_client.call("post", f"/api/me/group-requests/{req.pk}/cancel").status_code == 200
    req.refresh_from_db()
    assert req.status == "cancelled"

    api_client.call("post", f"/api/me/groups/{g.pk}/join")
    req = GroupRequest.objects.get(status="pending")
    api_client.force_login(leader)
    api_client.call("post", f"/api/groups/requests/{req.pk}/reject", {"response": "not now"})
    req.refresh_from_db()
    assert req.status == "rejected" and req.decided_by == leader
    assert not user.groups.filter(pk=g.pk).exists()
    assert Notification.objects.get(user=user).level == "warning"


@pytest.mark.django_db
def test_leader_permissions(user, api_client):
    leader = make_user(90000010, "Leader")
    stranger = make_user(90000011, "Stranger")
    officers = Group.objects.create(name="Officers")
    via_group = make_user(90000012, "Officer")
    via_group.groups.add(officers)
    g = make_group("Capitals", join_mode="request", leaders=[leader])
    g.profile.leader_groups.add(officers)
    api_client.force_login(user)
    api_client.call("post", f"/api/me/groups/{g.pk}/join")
    req = GroupRequest.objects.get()

    api_client.force_login(stranger)
    assert api_client.call("post", f"/api/groups/requests/{req.pk}/approve", {}).status_code == 403
    assert api_client.call("get", f"/api/groups/{g.pk}/members").status_code == 403
    assert api_client.call("get", "/api/groups/requests").json() == []

    api_client.force_login(leader)
    assert api_client.call("put", f"/api/admin/groups/{g.pk}", {"name": "Mine now"}).status_code == 403
    assert api_client.call("post", f"/api/groups/{g.pk}/members/{stranger.pk}").status_code == 200
    members = api_client.call("get", f"/api/groups/{g.pk}/members").json()["members"]
    assert {m["name"] for m in members} == {"Stranger"}

    api_client.force_login(via_group)
    assert api_client.call("post", f"/api/groups/requests/{req.pk}/approve", {}).status_code == 200
    assert api_client.call("delete", f"/api/groups/{g.pk}/members/{stranger.pk}").status_code == 200
    assert set(g.user_set.values_list("pk", flat=True)) == {user.pk}


@pytest.mark.django_db
def test_admin_saves_leaders_modes_and_rules(admin_user, api_client, user):
    api_client.force_login(admin_user)
    body = {
        "name": "Logi", "join_mode": "request", "leave_mode": "open", "leaders": [user.pk],
        "requirements": {"match": "all", "rules": [{"type": "character_count", "params": {"op": "gte", "count": "1"}}]},
    }
    r = api_client.call("post", "/api/admin/groups", body)
    assert r.status_code == 200, r.content
    out = r.json()
    assert out["join_mode"] == "request" and out["leaders"][0]["id"] == user.pk
    assert out["requirements"]["rules"][0]["params"]["count"] == 1  # normalised
    assert out["requirements_text"] == ["At least 1 characters"]

    bad = {**body, "requirements": {"rules": [{"type": "nope"}]}}
    assert api_client.call("post", "/api/admin/groups", {**bad, "name": "X"}).status_code == 400
    assert api_client.call("post", "/api/admin/groups", {"name": "Y", "auto": True}).status_code == 400  # needs rules
    # Old clients that only send joinable still work
    old = api_client.call("post", "/api/admin/groups", {"name": "Old", "joinable": True}).json()
    assert old["join_mode"] == "open" and old["joinable"] is True


@pytest.mark.django_db
def test_rule_types_and_preview(admin_user, api_client, user):
    api_client.force_login(admin_user)
    types = {t["key"]: t for t in api_client.call("get", "/api/admin/rules/types").json()}
    assert {"state", "skill", "total_sp", "compliant", "corp_title", "account_age"} <= set(types)
    assert types["skill"]["params"][2]["choices"][0] == {"value": "main", "label": "Main character"}
    r = api_client.call("post", "/api/admin/rules/preview", {"rules": {"match": "all", "rules": [
        {"type": "character_count", "params": {"op": "gte", "count": 1}}]}})
    assert r.json()["count"] == 2


# --- requirements --------------------------------------------------------------------------


@pytest.mark.django_db
def test_requirements_gate_joining(user, api_client):
    g = make_group("Old timers", join_mode="open", requirements={"match": "all", "rules": [{"type": "account_age", "params": {"days": 30}}]})
    api_client.force_login(user)
    r = api_client.call("post", f"/api/me/groups/{g.pk}/join")
    assert r.status_code == 403 and "30 days" in r.json()["detail"]
    row = next(x for x in api_client.call("get", "/api/me/groups").json() if x["id"] == g.pk)
    assert row["eligible"] is False and row["requirements"] == [{"text": "Registered here for at least 30 days", "ok": False}]

    user.date_joined = timezone.now() - timedelta(days=31)
    user.save()
    assert api_client.call("post", f"/api/me/groups/{g.pk}/join").status_code == 200


# --- built-in rules -------------------------------------------------------------------------


def check(user, rtype, negate=False, **params):
    ruleset = rules.validate_ruleset({"rules": [{"type": rtype, "params": params, "negate": negate}]})
    return rules.evaluate_ruleset(user, ruleset)


@pytest.mark.django_db
def test_builtin_rules(corp):
    from conduit.accounts.models import Character
    from conduit.sheet.overview.models import CharacterInfo
    from conduit.sheet.skills.models import CharacterSkill, SkillSummary

    member = State.objects.create(name="Member", priority=10)
    u = make_user(90000020, "Main", corporation=corp)
    alt = Character.objects.create(id=90000021, name="Alt", owner_hash="h", user=u)
    u.state = member
    u.save()

    assert check(u, "state", states=[member.pk])
    assert not check(u, "state", states=[member.pk], negate=True)
    assert check(u, "main_corporation", corporations=[corp.pk])
    assert check(u, "main_alliance", alliances=[corp.alliance_id])
    assert not check(u, "main_corporation", corporations=[1])
    assert check(u, "any_corporation", corporations=[corp.pk])
    assert check(u, "any_alliance", alliances=[corp.alliance_id])

    CharacterSkill.objects.create(character=alt, skill_id=3300, active_level=4, trained_level=4, skillpoints=1)
    assert check(u, "skill", skill=3300, level=4, scope="any")
    assert not check(u, "skill", skill=3300, level=4, scope="main")
    assert not check(u, "skill", skill=3300, level=5, scope="any")
    assert not check(u, "skill", skill=3300, level=1, scope="all")
    CharacterSkill.objects.create(character=u.main_character, skill_id=3300, active_level=1, trained_level=1, skillpoints=1)
    assert check(u, "skill", skill=3300, level=1, scope="all")

    SkillSummary.objects.create(character=alt, total_sp=10_000_000)
    assert check(u, "total_sp", sp=5_000_000, scope="any")
    assert not check(u, "total_sp", sp=5_000_000, scope="main")

    CharacterInfo.objects.create(character=alt, titles=["Fleet Commander"])
    assert check(u, "corp_title", title="fleet commander", scope="any")
    assert not check(u, "corp_title", title="Fleet Commander", scope="all")

    officers = Group.objects.create(name="Officers")
    assert not check(u, "group_member", groups=[officers.pk])
    u.groups.add(officers)
    assert check(u, "group_member", groups=[officers.pk])

    assert check(u, "character_count", op="gte", count=2)
    assert not check(u, "character_count", op="lte", count=1)
    assert check(u, "account_age", days=0)
    assert not check(u, "account_age", days=5)

    # Alt has no token: not compliant
    assert not check(u, "compliant")


@pytest.mark.django_db
def test_rule_sets_match_any_and_unknown_types(user):
    ruleset = {"match": "any", "rules": [
        {"type": "account_age", "params": {"days": 100}},
        {"type": "character_count", "params": {"op": "gte", "count": 1}},
    ]}
    assert rules.evaluate_ruleset(user, ruleset)
    assert not rules.evaluate_ruleset(user, {**ruleset, "match": "all"})
    assert rules.evaluate_ruleset(user, {})
    assert not rules.evaluate_ruleset(user, {"rules": [{"type": "gone_module_rule", "params": {}}]})
    with pytest.raises(rules.RuleError):
        rules.validate_ruleset({"rules": [{"type": "skill", "params": {"level": 9, "skill": 1}}]})


@pytest.mark.django_db
def test_plugins_can_register_rules(user):
    rules.register_rule("always", "Always", lambda u, p: True, plugin="sample")
    try:
        assert rules.evaluate_ruleset(user, {"rules": [{"type": "always", "params": {}}]})
    finally:
        rules.RULE_TYPES.pop("always")


# --- smart groups ------------------------------------------------------------------------


@pytest.mark.django_db
def test_smart_group_adds_and_removes(user, corp, django_capture_on_commit_callbacks, events):
    other = make_user(90000030, "Insider", corporation=corp)
    g = make_group("Corp", auto=True, rules={"match": "all", "rules": [{"type": "main_corporation", "params": {"corporations": [corp.pk]}}]})
    with django_capture_on_commit_callbacks(execute=True):
        assert groups.evaluate_group(g.profile) == {"added": 1, "removed": 0, "grace": 0}
    assert list(g.user_set.all()) == [other]
    assert Notification.objects.filter(user=other, category="groups").count() == 1
    assert [e.payload["via"] for e in events if e.name == "group.joined"] == ["auto"]

    user.groups.add(g)  # someone added by hand who doesn't match
    assert groups.evaluate_group(g.profile)["removed"] == 1
    assert list(g.user_set.all()) == [other]

    g.profile.auto_remove = False
    g.profile.save()
    user.groups.add(g)
    assert groups.evaluate_group(g.profile)["removed"] == 0


@pytest.mark.django_db
def test_smart_group_grace_period(corp):
    u = make_user(90000030, "Insider", corporation=corp)
    g = make_group("Corp", auto=True, grace_hours=24,
                   rules={"match": "all", "rules": [{"type": "main_corporation", "params": {"corporations": [corp.pk]}}]})
    groups.evaluate_group(g.profile)
    u.main_character.corporation = None
    u.main_character.save()
    assert groups.evaluate_group(g.profile)["grace"] == 1
    assert g.user_set.filter(pk=u.pk).exists()
    AutoGroupGrace.objects.update(failing_since=timezone.now() - timedelta(hours=25))
    assert groups.evaluate_group(g.profile)["removed"] == 1
    assert not AutoGroupGrace.objects.exists()


@pytest.mark.django_db
def test_smart_groups_follow_user_events(corp, django_capture_on_commit_callbacks):
    g = make_group("Corp", auto=True, rules={"match": "all", "rules": [{"type": "main_corporation", "params": {"corporations": [corp.pk]}}]})
    u = make_user(90000030, "Insider", corporation=corp)
    with django_capture_on_commit_callbacks(execute=True):
        bus.emit("character.main_changed", user_id=u.pk)
    assert g.user_set.filter(pk=u.pk).exists()


@pytest.mark.django_db
def test_smart_group_membership_cant_be_changed_by_hand(admin_user, api_client, user):
    g = make_group("Smart", auto=True, rules={"rules": [{"type": "account_age", "params": {"days": 0}}]})
    api_client.force_login(admin_user)
    assert api_client.call("post", f"/api/admin/groups/{g.pk}/members/{user.pk}").status_code == 400
    r = api_client.call("post", f"/api/admin/groups/{g.pk}/evaluate")
    assert r.json()["added"] == 2


@pytest.mark.django_db
def test_external_api_refuses_smart_groups(client, user):
    from .test_external import call, make_key, on

    on("groups")
    _, secret = make_key(["groups:write"])
    g = make_group("Smart", auto=True, rules={"rules": [{"type": "account_age", "params": {"days": 0}}]})
    assert call(client, "put", f"/api/v1/groups/{g.pk}/members/{user.pk}", secret).status_code == 400


def test_asset_rules(corp, admin_user, api_client):
    from conduit.accounts.models import Character
    from conduit.sde.models import ItemCategory, ItemGroup, ItemType
    from conduit.sheet.assets.models import Asset

    ItemCategory.objects.create(id=6, name="Ship", published=True)
    ItemGroup.objects.create(id=485, category_id=6, name="Dreadnought", published=True)
    ItemGroup.objects.create(id=1, category_id=4, name="Misc", published=True)
    ItemType.objects.create(id=19720, group_id=485, name="Revelation", published=True)
    ItemType.objects.create(id=19724, group_id=485, name="Moros", published=True)
    ItemType.objects.create(id=44992, group_id=1, name="PLEX", published=True)
    u = make_user(90000030, "Main", corporation=corp)
    alt = Character.objects.create(id=90000031, name="Alt", owner_hash="h", user=u)

    def own(char, type_id, qty=1):
        Asset.objects.create(character=char, item_id=Asset.objects.count() + 1, type_id=type_id, quantity=qty, location_id=60003760,
                             location_type="station", location_flag="Hangar", is_singleton=qty == 1, root_location_id=60003760)

    own(alt, 19720)
    own(u.main_character, 44992, 300)
    own(alt, 44992, 250)
    assert check(u, "has_ship", ships=[19720], count=1, scope="any")
    assert not check(u, "has_ship", ships=[19720], count=1, scope="main")
    assert not check(u, "has_ship", ships=[19720, 19724], count=2, scope="any")
    assert check(u, "has_ship_class", classes=[485], count=1, scope="any")
    assert check(u, "has_item", items=[44992], count=500, scope="any")  # added up across characters
    assert not check(u, "has_item", items=[44992], count=500, scope="main")
    own(u.main_character, 19724)
    assert check(u, "has_ship", ships=[19720, 19724], count=2, scope="any")

    assert rules.explain_rule({"type": "has_ship_class", "params": {"classes": [485], "count": 2, "scope": "any"}}) == "Owns 2 × Dreadnought on any character"
    assert rules.explain_rule({"type": "has_ship", "params": {"ships": [19720, 19724], "count": 1, "scope": "main"}}) == "Owns Revelation or Moros on their main"

    api_client.force_login(admin_user)
    assert [o["name"] for o in api_client.call("get", "/api/admin/rules/options?type=ship&q=rev").json()] == ["Revelation"]
    assert [o["name"] for o in api_client.call("get", "/api/admin/rules/options?type=ship&q=plex").json()] == []
    assert [o["name"] for o in api_client.call("get", "/api/admin/rules/options?type=item&q=plex").json()] == ["PLEX"]
    assert [o["name"] for o in api_client.call("get", "/api/admin/rules/options?type=ship_group&q=dread").json()] == ["Dreadnought"]
    keys = {t["key"] for t in api_client.call("get", "/api/admin/rules/types").json()}
    assert {"has_ship", "has_ship_class", "has_item"} <= keys
