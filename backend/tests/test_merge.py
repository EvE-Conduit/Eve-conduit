"""Moving characters between accounts (someone signed up twice instead of adding an alt)."""

import pytest
from django.contrib.auth.models import Group, Permission

from conduit.accounts.models import Character, Token, User
from conduit.audit.models import AuditEvent
from conduit.events import bus

from .conftest import make_user


def give(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(codename__in=codenames))
    return User.objects.get(pk=user.pk)


@pytest.fixture
def accounts(db, corp):
    main = make_user(90000001, "Pilot One", corporation=corp)
    second = make_user(90000002, "Pilot Two", corporation=corp)  # signed up on its own instead of as an alt
    Character.objects.create(id=90000003, name="Pilot Three", owner_hash="three", user=second, corporation=corp)
    officer = give(make_user(90000009, "Officer"), "manage_access")
    return main, second, officer


def test_moving_every_character_merges_the_accounts(accounts, api_client, django_capture_on_commit_callbacks):
    main, second, officer = accounts
    seen = []
    bus.on("user.merged")(seen.append)
    caps = Group.objects.create(name="Caps")
    second.groups.add(caps)
    api_client.force_login(officer)
    chars = api_client.call("get", f"/api/admin/members/{second.pk}/characters").json()["characters"]
    assert {c["name"]: c["main"] for c in chars} == {"Pilot Three": False, "Pilot Two": True}
    with django_capture_on_commit_callbacks(execute=True):
        out = api_client.call("post", f"/api/admin/members/{second.pk}/move-characters",
                              {"target": main.pk, "characters": [c["id"] for c in chars]}).json()
    bus.off("user.merged", seen.append)
    assert out == {"moved": ["Pilot Three", "Pilot Two"], "emptied": True}
    assert set(main.characters.values_list("name", flat=True)) == {"Pilot One", "Pilot Two", "Pilot Three"}
    assert Token.objects.get(character_id=90000002).character.user_id == main.pk  # the login moved with it
    second.refresh_from_db()
    assert not second.is_active and second.main_character is None and not second.groups.exists()
    main.refresh_from_db()
    assert main.main_character_id == 90000001  # the main account keeps its main
    assert seen and seen[0].payload["from_user_id"] == second.pk and seen[0].payload["to_user_id"] == main.pk
    assert AuditEvent.objects.filter(action="account.characters_moved").exists()
    # The switched-off account no longer shows among members.
    api_client.force_login(give(officer, "view_members"))
    names = [m["name"] for m in api_client.call("get", "/api/admin/members").json()["items"]]
    assert "Pilot Two" not in names and "Pilot One" in names


def test_moving_some_characters_keeps_the_account(accounts, api_client):
    main, second, officer = accounts
    api_client.force_login(officer)
    out = api_client.call("post", f"/api/admin/members/{second.pk}/move-characters", {"target": main.pk, "characters": [90000002]}).json()
    assert out["emptied"] is False
    second.refresh_from_db()
    assert second.is_active and second.main_character_id == 90000003  # its main moved, so another took over


def test_moves_cant_be_used_to_take_over_accounts(accounts, api_client, admin_user):
    """Whoever owns a character signs in with it, into the account holding it."""
    main, second, officer = accounts
    url = f"/api/admin/members/{second.pk}/move-characters"
    api_client.force_login(main)  # no permission
    assert api_client.call("post", url, {"target": main.pk, "characters": [90000002]}).status_code == 403
    api_client.force_login(officer)
    # Into an administrator's account, or one holding permissions the officer doesn't: no.
    assert api_client.call("post", url, {"target": admin_user.pk, "characters": [90000002]}).status_code == 403
    give(main, "manage_plugins")
    resp = api_client.call("post", url, {"target": main.pk, "characters": [90000002]})
    assert resp.status_code == 403 and "manage_plugins" in resp.json()["detail"]
    # Someone else's characters, or none: no.
    assert api_client.call("post", f"/api/admin/members/{second.pk}/move-characters",
                           {"target": officer.pk, "characters": [90000001]}).status_code == 400
    assert Character.objects.get(pk=90000002).user_id == second.pk
    # An administrator may.
    api_client.force_login(admin_user)
    assert api_client.call("post", url, {"target": main.pk, "characters": [90000002]}).status_code == 200
