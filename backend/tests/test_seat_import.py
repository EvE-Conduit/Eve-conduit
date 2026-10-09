import pytest
from django.contrib.auth.models import Group

from conduit.accounts import tasks as account_tasks
from conduit.accounts.models import Character, Token, User
from conduit.esi.exceptions import TokenInvalid

from .conftest import make_user
from .test_external import call, make_key, on


def seat_user(seat_id=1, main=91000001, alts=(), name="Seat Pilot"):
    chars = [{"id": main, "name": name, "owner_hash": f"hash-{main}", "refresh_token": f"rt-{main}", "scopes": ["publicData"]}]
    chars += [{"id": a, "name": f"Alt {a}", "owner_hash": f"hash-{a}", "refresh_token": f"rt-{a}", "scopes": []} for a in alts]
    return {"seat_id": seat_id, "name": name, "main_character_id": main, "characters": chars}


@pytest.fixture
def key(db):
    on("import")
    return make_key(["import:seat"])[1]


@pytest.mark.django_db
def test_needs_the_import_scope(client):
    on("import")
    _, secret = make_key(["directory:read"])
    assert call(client, "post", "/api/v1/import/seat/users", secret, data={"users": [seat_user()]}).status_code == 403
    assert not Character.objects.exists()


@pytest.mark.django_db
def test_import_creates_accounts_characters_and_expired_tokens(client, key):
    resp = call(client, "post", "/api/v1/import/seat/users", key, data={"users": [seat_user(alts=[91000002])]})
    assert resp.status_code == 200, resp.content
    result = resp.json()["users"][0]
    assert result["created"] is True
    assert [c["status"] for c in result["characters"]] == ["added", "added"]
    user = User.objects.get(pk=result["user_id"])
    assert user.main_character_id == 91000001
    assert set(user.characters.values_list("pk", flat=True)) == {91000001, 91000002}
    token = Token.objects.get(character_id=91000002)
    assert token.refresh_token == "rt-91000002" and token.valid
    assert token.expires_at.year == 2000  # refreshed on first use

    # The same import again changes nothing.
    again = call(client, "post", "/api/v1/import/seat/users", key, data={"users": [seat_user(alts=[91000002])]}).json()
    assert again["users"][0]["created"] is False
    assert [c["status"] for c in again["users"][0]["characters"]] == ["exists", "exists"]
    assert User.objects.filter(characters__isnull=False).distinct().count() == 1


@pytest.mark.django_db
def test_existing_characters_stay_put_and_keep_working_tokens(client, key):
    here = make_user(91000001, "Seat Pilot")  # already signed in to this site, with a working token
    other = make_user(91000003, "Someone Else")
    payload = {"users": [seat_user(alts=[91000002, 91000003])]}

    preview = call(client, "post", "/api/v1/import/seat/preview", key, data=payload).json()["users"][0]
    assert preview["account"]["id"] == here.pk
    assert {c["id"]: c["status"] for c in preview["characters"]} == {91000001: "exists", 91000002: "new", 91000003: "other_account"}
    assert not Character.objects.filter(pk=91000002).exists()  # preview changes nothing

    result = call(client, "post", "/api/v1/import/seat/users", key, data=payload).json()["users"][0]
    assert result["user_id"] == here.pk
    assert Character.objects.get(pk=91000002).user_id == here.pk
    assert Character.objects.get(pk=91000003).user_id == other.pk
    assert Token.objects.get(character_id=91000001).refresh_token == "refresh"  # not replaced


@pytest.mark.django_db
def test_invalid_token_is_replaced_but_sold_characters_are_not(client, key):
    here = make_user(91000001, "Seat Pilot")
    Token.objects.filter(character_id=91000001).update(valid=False)
    sold = seat_user(alts=[91000002])
    make_user(91000002, "Sold Alt")
    Character.objects.filter(pk=91000002).update(user=here, owner_hash="new-owner")

    result = call(client, "post", "/api/v1/import/seat/users", key, data={"users": [sold]}).json()["users"][0]
    assert {c["id"]: c["status"] for c in result["characters"]} == {91000001: "token_replaced", 91000002: "owner_changed"}
    assert Token.objects.get(character_id=91000001).refresh_token == "rt-91000001"
    assert Token.objects.get(character_id=91000002).refresh_token == "refresh"


@pytest.mark.django_db
def test_squads_become_groups(client, key):
    call(client, "post", "/api/v1/import/seat/users", key, data={"users": [seat_user(1, 91000001), seat_user(2, 91000005, name="Second")]})
    resp = call(client, "post", "/api/v1/import/seat/squads", key, data={
        "name": "Capitals", "description": "Cap pilots", "hidden": True,
        "member_mains": [91000001, 91000005, 99999999], "moderator_mains": [91000001],
    })
    assert resp.status_code == 200, resp.content
    assert resp.json()["added"] == 2
    group = Group.objects.get(name="Capitals")
    assert group.user_set.count() == 2
    assert group.profile.hidden and group.profile.join_mode == "closed"
    assert list(group.profile.leaders.values_list("main_character_id", flat=True)) == [91000001]


@pytest.mark.django_db
def test_squad_never_touches_an_admin_group(client, key):
    from django.contrib.auth.models import Permission

    admins = Group.objects.create(name="Admins")
    admins.permissions.add(Permission.objects.get(codename="manage_access"))
    resp = call(client, "post", "/api/v1/import/seat/squads", key, data={"name": "Admins", "member_mains": []})
    assert resp.status_code == 409


@pytest.mark.django_db
def test_verify_refreshes_each_token_once(client, key, monkeypatch):
    call(client, "post", "/api/v1/import/seat/users", key, data={"users": [seat_user(alts=[91000002])]})

    def fake_refresh(data):
        if data["refresh_token"] == "rt-91000002":
            raise TokenInvalid("revoked")
        return {"access_token": "new-access", "refresh_token": "rotated", "expires_in": 1199}

    monkeypatch.setattr("conduit.esi.tokens._token_request", fake_refresh)
    monkeypatch.setattr(account_tasks, "PARALLEL", 1)  # threads can't see the test database
    monkeypatch.setattr(account_tasks.verify_seat_tokens, "delay", lambda run_id, ids: account_tasks.verify_seat_tokens(run_id, ids))

    run = call(client, "post", "/api/v1/import/seat/verify", key, data={"character_ids": [91000001, 91000002]}).json()
    status = call(client, "get", f"/api/v1/import/seat/verify/{run['run_id']}", key).json()
    assert status["finished"] and status["live"] == 1
    assert status["dead"] == [{"id": 91000002, "name": "Alt 91000002"}]
    assert Token.objects.get(character_id=91000001).refresh_token == "rotated"
    assert not Token.objects.get(character_id=91000002).valid


@pytest.mark.django_db
def test_info_reports_client_id_and_wanted_scopes(client, key):
    info = call(client, "get", "/api/v1/import/seat/info", key).json()
    assert info["client_id"] == "test-client"
    assert info["sso_configured"] is True
    assert isinstance(info["wanted_scopes"], list)
