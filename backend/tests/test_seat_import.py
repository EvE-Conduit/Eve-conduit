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
            raise TokenInvalid("revoked", oauth_error="invalid_grant")
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


@pytest.mark.django_db
def test_an_alt_sold_to_someone_here_does_not_decide_the_account(client, key):
    """SeAT still lists alt Z under X, but Z was sold to Y, who registered it here: X's main and other alts get an
    account of their own, not Y's."""
    buyer = make_user(91000003, "Sold Alt")
    Character.objects.filter(pk=91000003).update(owner_hash="buyer-hash")  # Y signed in with Z after buying it
    payload = {"users": [seat_user(alts=[91000002, 91000003])]}  # X's SeAT still has Z with X's (old) owner hash

    preview = call(client, "post", "/api/v1/import/seat/preview", key, data=payload).json()["users"][0]
    assert preview["account"] is None
    assert {c["id"]: c["status"] for c in preview["characters"]} == {91000001: "new", 91000002: "new", 91000003: "owner_changed"}

    result = call(client, "post", "/api/v1/import/seat/users", key, data=payload).json()["users"][0]
    assert result["created"] is True and result["user_id"] != buyer.pk
    assert {c["id"]: c["status"] for c in result["characters"]} == {91000001: "added", 91000002: "added", 91000003: "owner_changed"}
    assert set(User.objects.get(pk=result["user_id"]).characters.values_list("pk", flat=True)) == {91000001, 91000002}
    assert set(buyer.characters.values_list("pk", flat=True)) == {91000003}


def _import_without_hashes(client, key) -> User:
    user = seat_user(alts=[91000002])
    for c in user["characters"]:
        c["owner_hash"] = ""  # SeAT didn't know them
    result = call(client, "post", "/api/v1/import/seat/users", key, data={"users": [user]}).json()["users"][0]
    return User.objects.get(pk=result["user_id"])


def _eve(monkeypatch, owner="real-hash", refresh=None):
    """EVE SSO answering refreshes (``refresh`` overrides) with tokens whose JWT names ``owner``."""
    monkeypatch.setattr("conduit.esi.tokens._token_request", refresh or (lambda data: {
        "access_token": f"jwt:{data['refresh_token']}", "refresh_token": data["refresh_token"], "expires_in": 1199}))

    def verify(access_token):
        char_id = access_token.removeprefix("jwt:rt-")
        return {"sub": f"CHARACTER:EVE:{char_id}", "name": "x", "owner": owner, "scp": []}

    monkeypatch.setattr("conduit.esi.tokens.verify_access_token", verify)


def _login(char_id=91000002, owner="real-hash"):
    from conduit.accounts.services import link_character

    info = {"id": char_id, "name": f"Alt {char_id}", "owner_hash": owner, "scopes": ["publicData"]}
    return link_character(info, {"access_token": "a", "refresh_token": "r", "expires_in": 1199}, None)


@pytest.mark.django_db
def test_empty_owner_hash_is_read_from_a_working_token_on_first_login(client, key, monkeypatch):
    """SeAT doesn't always know the owner hash; the character's own token (EVE revokes it on a sale) tells it."""
    account = _import_without_hashes(client, key)
    _eve(monkeypatch, owner="real-hash")
    char = _login(owner="real-hash")
    assert char.user_id == account.pk and account.characters.count() == 2
    assert Character.objects.get(pk=91000002).owner_hash == "real-hash"


@pytest.mark.django_db
def test_empty_owner_hash_with_a_token_of_another_owner_is_a_sale(client, key, monkeypatch):
    account = _import_without_hashes(client, key)
    _eve(monkeypatch, owner="sellers-hash")
    char = _login(owner="buyers-hash")
    assert char.user_id != account.pk
    assert set(account.characters.values_list("pk", flat=True)) == {91000001}


@pytest.mark.django_db
@pytest.mark.parametrize("token", ["none", "marked_invalid", "revoked"])
def test_empty_owner_hash_without_a_usable_token_is_a_sale(client, key, monkeypatch, token):
    """Nothing vouches for the old account, so the one signing in gets the character on an account of their own."""
    account = _import_without_hashes(client, key)
    if token == "none":
        Token.objects.filter(character_id=91000002).delete()
    elif token == "marked_invalid":
        Token.objects.filter(character_id=91000002).update(valid=False)

    def refused(data):
        raise TokenInvalid("revoked", oauth_error="invalid_grant")

    _eve(monkeypatch, refresh=refused)
    char = _login(owner="buyers-hash")
    assert char.user_id != account.pk and char.owner_hash == "buyers-hash"
    assert set(account.characters.values_list("pk", flat=True)) == {91000001}


@pytest.mark.django_db
def test_empty_owner_hash_and_eve_unreachable_refuses_the_login_for_now(client, key, monkeypatch):
    import httpx

    from conduit.accounts.services import OwnerUnknown

    account = _import_without_hashes(client, key)

    def down(data):
        raise httpx.ConnectError("no route")

    _eve(monkeypatch, refresh=down)
    with pytest.raises(OwnerUnknown):
        _login()
    assert Character.objects.get(pk=91000002).user_id == account.pk  # nothing guessed either way


@pytest.mark.django_db
def test_verifying_imported_tokens_fills_in_missing_owner_hashes(client, key, monkeypatch):
    _import_without_hashes(client, key)
    _eve(monkeypatch, owner="real-hash")
    monkeypatch.setattr(account_tasks, "PARALLEL", 1)
    account_tasks.verify_seat_tokens("run", [91000001, 91000002])
    assert set(Character.objects.values_list("owner_hash", flat=True)) == {"real-hash"}
