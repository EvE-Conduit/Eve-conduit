import pytest

from conduit.accounts.models import Character, Token, User
from conduit.accounts.services import CharacterOwnedElsewhere, link_character

TOKEN = {"access_token": "a", "refresh_token": "r", "expires_in": 1199}


def info(char_id=91000001, name="New Pilot", owner="owner-1", scopes=("publicData",)):
    return {"id": char_id, "name": name, "owner_hash": owner, "scopes": list(scopes)}


@pytest.mark.django_db
def test_first_login_creates_user_with_main():
    char = link_character(info(), TOKEN, None)
    assert char.user.main_character == char
    assert Token.objects.get(character=char).scope_set == {"publicData"}


@pytest.mark.django_db
def test_tokens_are_encrypted_at_rest():
    char = link_character(info(), TOKEN, None)
    from django.db import connection

    with connection.cursor() as cur:
        cur.execute("SELECT refresh_token FROM accounts_token WHERE character_id = %s", [char.pk])
        stored = cur.fetchone()[0]
    assert stored != "r"
    assert Token.objects.get(character=char).refresh_token == "r"


@pytest.mark.django_db
def test_adding_alt_links_to_current_user(user):
    alt = link_character(info(name="Alt"), TOKEN, user)
    assert alt.user == user
    assert user.characters.count() == 2
    user.refresh_from_db()
    assert user.main_character.name == "Pilot One"


@pytest.mark.django_db
def test_cannot_steal_character_linked_elsewhere(user):
    other = User.objects.create(username="other")
    with pytest.raises(CharacterOwnedElsewhere):
        link_character(info(user.main_character.pk, owner=user.main_character.owner_hash), TOKEN, other)


@pytest.mark.django_db
def test_sold_character_moves_to_new_owner(user):
    sold_id = user.main_character.pk
    char = link_character(info(sold_id, name="Pilot One", owner="new-owner"), TOKEN, None)
    assert char.user != user
    user.refresh_from_db()
    assert user.main_character is None
    assert Character.objects.get(pk=sold_id).owner_hash == "new-owner"


@pytest.mark.django_db
def test_my_characters_and_main_switch(user, api_client):
    alt = link_character(info(name="Alt"), TOKEN, user)
    api_client.force_login(user)
    chars = api_client.call("get", "/api/me/characters").json()
    assert [c["name"] for c in chars] == ["Pilot One", "Alt"]
    assert api_client.call("delete", f"/api/me/characters/{user.main_character_id}").status_code == 400
    assert api_client.call("post", f"/api/me/characters/{alt.pk}/main").status_code == 200
    user.refresh_from_db()
    assert user.main_character == alt


@pytest.mark.django_db
def test_sso_login_redirects_with_pkce(client):
    resp = client.get("/sso/login?next=/characters")
    assert resp.status_code == 302
    url = resp["Location"]
    assert url.startswith("https://login.eveonline.com/v2/oauth/authorize?")
    assert "code_challenge_method=S256" in url and "client_id=test-client" in url
    assert client.session["conduit_sso"]["next"] == "/characters"


@pytest.mark.django_db
def test_sso_login_requests_every_scope(client):
    from urllib.parse import parse_qs, urlsplit

    from conduit.esi.scopes import ALL_SCOPES
    from conduit.plugins.services import required_scopes

    url = client.get("/sso/login")["Location"]
    scopes = parse_qs(urlsplit(url).query)["scope"][0].split()
    assert set(scopes) == {*ALL_SCOPES, *required_scopes()}
    assert "esi-mail.send_mail.v1" in scopes and "esi-fleets.write_fleet.v1" in scopes


@pytest.mark.django_db
def test_esi_scopes_setting_narrows_the_request(client, settings):
    from urllib.parse import parse_qs, urlsplit

    settings.ESI_SCOPES = ["esi-skills.read_skills.v1"]
    url = client.get("/sso/login")["Location"]
    scopes = set(parse_qs(urlsplit(url).query)["scope"][0].split())
    assert "esi-mail.send_mail.v1" not in scopes and "esi-skills.read_skills.v1" in scopes


@pytest.mark.django_db
def test_sso_rejects_open_redirect(client):
    client.get("/sso/login?next=https://evil.example")
    assert client.session["conduit_sso"]["next"] == "/"


@pytest.mark.django_db
def test_sso_callback_logs_in(client, monkeypatch):
    from conduit.sso import views

    client.get("/sso/login")
    state = client.session["conduit_sso"]["state"]
    monkeypatch.setattr(views, "exchange_code", lambda code, verifier: TOKEN)
    monkeypatch.setattr(
        views,
        "verify_access_token",
        lambda t: {"sub": "CHARACTER:EVE:91000005", "name": "Fresh", "owner": "o", "scp": "publicData"},
    )
    resp = client.get(f"/sso/callback?code=abc&state={state}")
    assert resp.status_code == 302 and resp["Location"] == "/"
    me = client.get("/api/core/bootstrap").json()["user"]
    assert me["name"] == "Fresh"


@pytest.mark.django_db
def test_sso_callback_rejects_bad_state(client):
    client.get("/sso/login")
    assert client.get("/sso/callback?code=abc&state=wrong").status_code == 400


@pytest.mark.django_db
def test_sso_login_lands_on_the_start_page(client, monkeypatch):
    from conduit.site.models import SiteSettings
    from conduit.sso import views

    SiteSettings.objects.update_or_create(pk=1, defaults={"start_page": "/p/news"})
    monkeypatch.setattr(views, "exchange_code", lambda code, verifier: TOKEN)
    monkeypatch.setattr(views, "verify_access_token", lambda t: {"sub": "CHARACTER:EVE:91000005", "name": "Fresh", "owner": "o", "scp": "publicData"})
    client.get("/sso/login")
    resp = client.get(f"/sso/callback?code=abc&state={client.session['conduit_sso']['state']}")
    assert resp["Location"] == "/p/news"
    # A page that was asked for still wins.
    client.get("/sso/login?next=/wallet")
    resp = client.get(f"/sso/callback?code=abc&state={client.session['conduit_sso']['state']}")
    assert resp["Location"] == "/wallet"
