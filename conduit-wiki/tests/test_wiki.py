"""Wiki: who reads and edits what, slugs, the tree, history and restore, public pages and search."""

import pytest
from django.contrib.auth.models import Group, Permission
from django.test import Client

from conduit.access.models import State
from conduit.plugins.services import set_enabled, sync_installed
from conduit_wiki import services
from conduit_wiki.models import Page, Revision
from tests.conftest import make_user

BASE = "/api/p/wiki"


@pytest.fixture
def people(db, corp):
    sync_installed()
    set_enabled("wiki", True)
    member = State.objects.create(name="Member", priority=10)
    public = State.objects.create(name="Guest", priority=0, public=True)
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    pilot.state = member
    pilot.save()
    guest = make_user(90000002, "Guest Pilot", member=False)
    guest.state = public
    guest.save()
    reader = make_user(90000004, "Reader")
    editor = make_user(90000003, "Editor")
    editor.user_permissions.add(Permission.objects.get(codename="edit_pages"))
    manager = make_user(90000005, "Manager")
    manager.user_permissions.add(Permission.objects.get(codename="manage_wiki"))
    return {"member": member, "pilot": pilot, "guest": guest, "reader": reader, "editor": editor, "manager": manager}


def write(api_client, who, **body):
    api_client.force_login(who)
    resp = api_client.call("post", f"{BASE}/pages", {"title": "Fleet Rules", "body": "# Be on comms\n\nAlways.", **body})
    assert resp.status_code == 200, resp.content
    return resp.json()


def test_editors_write_and_everyone_reads(people, api_client):
    page = write(api_client, people["editor"])
    assert page["slug"] == "fleet-rules" and page["revisions"] == 1 and page["can_edit"]
    api_client.force_login(people["reader"])
    got = api_client.call("get", f"{BASE}/pages/fleet-rules").json()
    assert got["title"] == "Fleet Rules" and got["body"].startswith("# Be on comms") and not got["can_edit"]
    assert "states" not in got  # audience details are for managers
    assert api_client.call("post", f"{BASE}/pages", {"title": "Nope", "body": ""}).status_code == 403
    assert api_client.call("put", f"{BASE}/pages/fleet-rules", {"title": "Nope", "body": ""}).status_code == 403
    overview = api_client.call("get", BASE).json()
    assert [n["slug"] for n in overview["tree"]] == ["fleet-rules"] and not overview["can_edit"]


def test_guests_get_nothing_but_public_pages(people, api_client):
    write(api_client, people["editor"])
    write(api_client, people["manager"], title="Join us", public=True)
    api_client.force_login(people["guest"])
    assert api_client.call("get", BASE).status_code == 403
    anon = Client()
    assert anon.get(f"/api/public/p/wiki/pages/fleet-rules").status_code == 404
    got = anon.get(f"/api/public/p/wiki/pages/join-us").json()
    assert got["title"] == "Join us" and "updated_by" not in got
    assert [n["slug"] for n in anon.get("/api/public/p/wiki/pages").json()["tree"]] == ["join-us"]


def test_editors_cannot_make_pages_public_or_pick_audiences(people, api_client):
    leaders = Group.objects.create(name="Leadership")
    page = write(api_client, people["editor"], public=True, locked=True, groups=[leaders.pk])
    p = Page.objects.get(pk=page["id"])
    assert not p.public and not p.locked and not p.groups.exists()


def test_audience_by_state_or_group(people, api_client):
    leaders = Group.objects.create(name="Leadership")
    write(api_client, people["manager"], title="Members only", states=[people["member"].pk])
    write(api_client, people["manager"], title="Leaders only", groups=[leaders.pk])
    api_client.force_login(people["pilot"])
    assert [n["slug"] for n in api_client.call("get", BASE).json()["tree"]] == ["members-only"]
    assert api_client.call("get", f"{BASE}/pages/leaders-only").status_code == 404
    people["reader"].groups.add(leaders)
    api_client.force_login(people["reader"])
    assert [n["slug"] for n in api_client.call("get", BASE).json()["tree"]] == ["leaders-only"]
    # Managers see everything, so they can always fix a page nobody else can reach.
    api_client.force_login(people["manager"])
    assert len(api_client.call("get", BASE).json()["tree"]) == 2


def test_slugs_are_unique_and_can_be_chosen(people, api_client):
    a = write(api_client, people["editor"])
    b = write(api_client, people["editor"])
    c = write(api_client, people["editor"], slug="Rules Of The Fleet!")
    assert (a["slug"], b["slug"], c["slug"]) == ("fleet-rules", "fleet-rules-2", "rules-of-the-fleet")


def test_tree_breadcrumbs_and_reparenting_on_delete(people, api_client):
    root = write(api_client, people["editor"], title="Guides")
    child = write(api_client, people["editor"], title="PvP", parent=root["id"])
    grandchild = write(api_client, people["editor"], title="Fitting", parent=child["id"])
    tree = api_client.call("get", BASE).json()["tree"]
    assert tree[0]["slug"] == "guides" and tree[0]["children"][0]["slug"] == "pvp" and tree[0]["children"][0]["children"][0]["slug"] == "fitting"
    got = api_client.call("get", f"{BASE}/pages/fitting").json()
    assert [b["slug"] for b in got["breadcrumbs"]] == ["guides", "pvp"]
    # A page can't be moved under its own child.
    resp = api_client.call("put", f"{BASE}/pages/guides", {"title": "Guides", "body": "", "parent": grandchild["id"]})
    assert resp.status_code == 400
    # Deleting the middle page moves its children up; editors can't delete, managers can.
    assert api_client.call("delete", f"{BASE}/pages/pvp").status_code == 403
    api_client.force_login(people["manager"])
    assert api_client.call("delete", f"{BASE}/pages/pvp").status_code == 200
    assert Page.objects.get(slug="fitting").parent.slug == "guides"


def test_history_and_restore(people, api_client):
    write(api_client, people["editor"])
    resp = api_client.call("put", f"{BASE}/pages/fleet-rules", {"title": "Fleet Rules", "body": "Changed.", "note": "shorter"})
    assert resp.status_code == 200 and resp.json()["revisions"] == 2
    # Saving without changing the text doesn't make a revision.
    api_client.call("put", f"{BASE}/pages/fleet-rules", {"title": "Fleet Rules", "body": "Changed."})
    history = api_client.call("get", f"{BASE}/pages/fleet-rules/history").json()
    assert [r["number"] for r in history["revisions"]] == [2, 1] and history["revisions"][0]["note"] == "shorter"
    assert history["revisions"][0]["author"]["name"] == "Editor"
    old = api_client.call("get", f"{BASE}/pages/fleet-rules/history/1").json()
    assert old["body"].startswith("# Be on comms")
    restored = api_client.call("post", f"{BASE}/pages/fleet-rules/restore/1").json()
    assert restored["body"].startswith("# Be on comms") and restored["revisions"] == 3
    assert Revision.objects.get(page__slug="fleet-rules", number=3).note == "Restored revision 1"


def test_locked_pages_are_for_managers(people, api_client):
    write(api_client, people["manager"], locked=True)
    api_client.force_login(people["editor"])
    assert not api_client.call("get", f"{BASE}/pages/fleet-rules").json()["can_edit"]
    assert api_client.call("put", f"{BASE}/pages/fleet-rules", {"title": "Fleet Rules", "body": "x"}).status_code == 403
    assert api_client.call("post", f"{BASE}/pages/fleet-rules/restore/1").status_code == 403
    api_client.force_login(people["manager"])
    assert api_client.call("put", f"{BASE}/pages/fleet-rules", {"title": "Fleet Rules", "body": "x"}).status_code == 200


def test_home_page_and_recent(people, api_client):
    write(api_client, people["editor"], title="Home", slug="home", body="Welcome **pilots**")
    write(api_client, people["editor"], title="Other")
    api_client.force_login(people["reader"])
    overview = api_client.call("get", BASE).json()
    assert overview["home"]["body"] == "Welcome **pilots**" and overview["count"] == 2
    assert overview["recent"][0]["slug"] == "other"


def test_reorder(people, api_client):
    a = write(api_client, people["editor"], title="A")
    b = write(api_client, people["editor"], title="B")
    api_client.force_login(people["manager"])
    assert api_client.call("post", f"{BASE}/reorder", {"parent": None, "ids": [b["id"], a["id"]]}).status_code == 200
    assert [n["slug"] for n in api_client.call("get", BASE).json()["tree"]] == ["b", "a"]
    api_client.force_login(people["editor"])
    assert api_client.call("post", f"{BASE}/reorder", {"parent": None, "ids": [a["id"], b["id"]]}).status_code == 403


def test_search_and_plain_text(people, api_client):
    write(api_client, people["editor"], title="Doctrines", body="Fly the **Ferox** and read [[Fleet Rules|the rules]] and [[Comms]].")
    write(api_client, people["manager"], title="Secret", body="Ferox plans", groups=[Group.objects.create(name="Leadership").pk])
    api_client.force_login(people["reader"])
    hits = api_client.call("get", "/api/search?q=ferox").json()
    group = next(g for g in hits["groups"] if g["key"] == "wiki") if "groups" in hits else next(g for g in hits if g["key"] == "wiki")
    assert [h["title"] for h in group["hits"]] == ["Doctrines"]
    assert group["hits"][0]["url"] == "/p/wiki/doctrines" and "Ferox" in group["hits"][0]["subtitle"]
    assert services.plain("Fly the **Ferox** and read [[Fleet Rules|the rules]] and [[Comms]].") == "Fly the Ferox and read the rules and Comms."
