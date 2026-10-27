"""Blacklist: entries and notes, who may see them, and warnings when a flagged character links or applies."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.esi.client import EsiResponse
from conduit.eve.models import EveAlliance, EveCorporation, EveName
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit_blacklist import services
from conduit_blacklist.models import Entry, Match
from tests.conftest import make_user

BASE = "/api/p/blacklist"
SPY_ID, BAD_CORP, BAD_ALLIANCE = 90000777, 98000666, 99000666


@pytest.fixture
def setup(db, monkeypatch):
    sync_installed()
    set_enabled("blacklist", True)
    monkeypatch.setattr("conduit_blacklist.tasks.check_user.apply_async", lambda *a, **k: None)
    EveName.objects.create(id=SPY_ID, name="Known Spy", category="character")
    EveName.objects.create(id=BAD_CORP, name="Awoxers Inc", category="corporation")
    EveName.objects.create(id=BAD_ALLIANCE, name="Hostile Alliance", category="alliance")
    hr = make_user(90000050, "HR Hannah")
    hr.user_permissions.add(*Permission.objects.filter(content_type__app_label="blacklist"))
    viewer = make_user(90000051, "Viewer Vic")
    viewer.user_permissions.add(Permission.objects.get(codename="view_blacklist"))
    member = make_user(90000060, "Plain Member")
    return hr, viewer, member


def add(api_client, kind, eve_id, **kw):
    return api_client.call("post", f"{BASE}/entries", {"kind": kind, "eve_id": eve_id, "severity": "banned", "reason": "Awoxed a Rorqual", **kw})


def test_members_never_see_it(setup, api_client):
    hr, _, member = setup
    Entry.objects.create(kind="character", eve_id=SPY_ID, name="Known Spy")
    api_client.force_login(member)
    for path in ("/entries", "/matches", "/summary", "/check?q=Known Spy", "/lookup?q=Known Spy"):
        assert api_client.call("get", BASE + path).status_code == 403, path
    boot = api_client.call("get", "/api/core/bootstrap").json()
    assert next(p for p in boot["plugins"] if p["id"] == "blacklist")["nav"] == []
    groups = api_client.call("get", "/api/search?q=Known").json()["groups"]
    assert not any(g["key"] == "blacklist" and g["hits"] for g in groups)
    api_client.force_login(hr)
    groups = api_client.call("get", "/api/search?q=Known").json()["groups"]
    assert any(g["key"] == "blacklist" and g["hits"] for g in groups)


def test_add_change_note_and_remove(setup, api_client):
    hr, viewer, _ = setup
    api_client.force_login(hr)
    created = add(api_client, "character", SPY_ID)
    assert created.status_code == 200, created.content
    body = created.json()
    assert body["name"] == "Known Spy" and body["severity"] == "banned" and body["added_by"] == "HR Hannah"
    assert "already on the blacklist" in add(api_client, "character", SPY_ID).json()["detail"]
    assert "not a corporation" in add(api_client, "corporation", SPY_ID).json()["detail"]
    past = (timezone.now() - timedelta(days=1)).isoformat()
    assert "in the future" in add(api_client, "alliance", BAD_ALLIANCE, expires_at=past).json()["detail"]

    changed = api_client.call("put", f"{BASE}/entries/{body['id']}", {"severity": "watch", "reason": "Maybe reformed"}).json()
    assert changed["severity"] == "watch" and changed["reason"] == "Maybe reformed"

    api_client.force_login(viewer)
    assert api_client.call("put", f"{BASE}/entries/{body['id']}", {"severity": "banned"}).status_code == 403
    noted = api_client.call("post", f"{BASE}/entries/{body['id']}/notes", {"text": "Seen in local with hostiles"}).json()
    assert [n["text"] for n in noted["notes"]] == ["Seen in local with hostiles"]
    assert api_client.call("delete", f"{BASE}/entries/{body['id']}").status_code == 403

    api_client.force_login(hr)
    assert api_client.call("delete", f"{BASE}/entries/{body['id']}").json() == {"ok": True}
    assert not Entry.objects.exists()


def test_expired_entries_drop_out(setup, api_client):
    hr, _, _ = setup
    Entry.objects.create(kind="character", eve_id=SPY_ID, name="Known Spy", expires_at=timezone.now() - timedelta(hours=1))
    api_client.force_login(hr)
    assert api_client.call("get", f"{BASE}/entries").json()["items"] == []
    assert [e["name"] for e in api_client.call("get", f"{BASE}/entries?status=expired").json()["items"]] == ["Known Spy"]
    make_user(SPY_ID, "Known Spy")
    assert services.check_all() == 0


def test_linking_a_flagged_character_warns_hr(setup, monkeypatch):
    hr, viewer, member = setup
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: emitted.append((name, kw)))
    entry = Entry.objects.create(kind="character", eve_id=SPY_ID, name="Known Spy", reason="Stole the SRP wallet")
    Character.objects.create(id=SPY_ID, name="Known Spy", owner_hash="h", user=member)
    from conduit_blacklist.listeners import character_linked

    character_linked(bus.Event("character.added", {"user_id": member.pk}))
    match = Match.objects.get()
    assert (match.entry, match.user, match.source) == (entry, member, "linked")
    for who in (hr, viewer):
        n = Notification.objects.get(user=who, category="p.blacklist")
        assert n.title == "Blacklisted: Known Spy" and "linked to Plain Member's account" in n.body and "Stole the SRP wallet" in n.body
    assert not Notification.objects.filter(user=member, category="p.blacklist").exists()
    assert [name for name, _ in emitted if name.startswith("blacklist.")] == ["blacklist.match"]

    # Found once: checking again says nothing new.
    character_linked(bus.Event("character.added", {"user_id": member.pk}))
    assert Match.objects.count() == 1 and Notification.objects.filter(user=hr, category="p.blacklist").count() == 1


def test_corporation_and_alliance_entries_match(setup):
    _, _, member = setup
    alliance = EveAlliance.objects.create(id=BAD_ALLIANCE, name="Hostile Alliance")
    corp = EveCorporation.objects.create(id=BAD_CORP, name="Awoxers Inc", alliance=alliance)
    alt = make_user(90000070, "Sneaky Alt", corporation=corp)
    Entry.objects.create(kind="corporation", eve_id=BAD_CORP, name="Awoxers Inc")
    Entry.objects.create(kind="alliance", eve_id=BAD_ALLIANCE, name="Hostile Alliance", severity="watch")
    assert services.check_all() == 2
    assert {m.entry.kind for m in Match.objects.filter(user=alt)} == {"corporation", "alliance"}
    assert not Match.objects.filter(user=member).exists()
    assert services.check_all() == 0


def test_new_entry_checks_existing_members(setup, api_client, django_capture_on_commit_callbacks):
    hr, _, member = setup
    Character.objects.create(id=SPY_ID, name="Known Spy", owner_hash="h", user=member)
    api_client.force_login(hr)
    with django_capture_on_commit_callbacks(execute=True):
        add(api_client, "character", SPY_ID)  # tasks run inline in tests
    assert Match.objects.get().user == member


def test_applying_brings_up_open_matches_again(setup):
    hr, _, member = setup
    Entry.objects.create(kind="character", eve_id=SPY_ID, name="Known Spy")
    Character.objects.create(id=SPY_ID, name="Known Spy", owner_hash="h", user=member)
    services.check_user(member.pk, "linked")
    from conduit_blacklist.listeners import applied

    applied(bus.Event("recruit.application_submitted", {"user_id": member.pk}))
    bodies = list(Notification.objects.filter(user=hr, category="p.blacklist").values_list("body", flat=True))
    assert len(bodies) == 2 and "Plain Member applied" in bodies[0] + bodies[1]

    Match.objects.update(resolved_at=timezone.now())
    applied(bus.Event("recruit.application_submitted", {"user_id": member.pk}))
    assert Notification.objects.filter(user=hr, category="p.blacklist").count() == 2


def test_matches_resolve_and_follow_moved_characters(setup, api_client):
    hr, _, member = setup
    other = make_user(90000080, "Other Member")
    Entry.objects.create(kind="character", eve_id=SPY_ID, name="Known Spy")
    spy = Character.objects.create(id=SPY_ID, name="Known Spy", owner_hash="h", user=member)
    services.check_user(member.pk, "linked")
    api_client.force_login(hr)
    m = api_client.call("get", f"{BASE}/matches").json()["items"][0]
    done = api_client.call("post", f"{BASE}/matches/{m['id']}", {"resolved": True}).json()
    assert done["resolved_by"] == "HR Hannah"
    assert api_client.call("get", f"{BASE}/matches").json()["counts"] == {"open": 0, "resolved": 1}

    spy.user = other
    spy.save()
    services.check_user(other.pk, "linked")
    match = Match.objects.get()
    assert match.user == other and match.resolved_at is None


def test_lookup_and_check_a_name(setup, api_client, monkeypatch):
    hr, viewer, _ = setup
    alliance = EveAlliance.objects.create(id=BAD_ALLIANCE, name="Hostile Alliance")
    EveCorporation.objects.create(id=BAD_CORP, name="Awoxers Inc", alliance=alliance)
    Entry.objects.create(kind="alliance", eve_id=BAD_ALLIANCE, name="Hostile Alliance")

    class FakeEsi:
        def post(self, path, body):
            if path == "/universe/ids":
                return EsiResponse({"characters": [{"id": 90000555, "name": "New Guy"}]}, 200, {})
            assert path == "/characters/affiliation"
            return EsiResponse([{"character_id": 90000555, "corporation_id": BAD_CORP, "alliance_id": BAD_ALLIANCE}], 200, {})

    monkeypatch.setattr("conduit.esi.client.esi", lambda: FakeEsi())
    api_client.force_login(viewer)
    hits = api_client.call("get", f"{BASE}/check?q=New Guy").json()
    assert hits[0]["name"] == "New Guy" and [e["name"] for e in hits[0]["entries"]] == ["Hostile Alliance"]
    assert api_client.call("get", f"{BASE}/lookup?q=New Guy").status_code == 403
    api_client.force_login(hr)
    assert api_client.call("get", f"{BASE}/lookup?q=New Guy").json()[0]["eve_id"] == 90000555


def test_search_only_for_people_who_may_see_it(setup, rf):
    hr, _, member = setup
    Entry.objects.create(kind="character", eve_id=SPY_ID, name="Known Spy")
    request = rf.get("/")
    request.user = hr
    assert [h["title"] for h in services.search(request, "spy", 10)["hits"]] == ["Known Spy"]
    request.user = member
    assert services.search(request, "spy", 10)["hits"] == []


def test_a_match_is_a_discord_alert():
    et = bus.EVENT_TYPES["blacklist.match"]
    assert et.alert and et.manage == "blacklist.manage_blacklist" and et.plugin == "blacklist" and et.private


def test_managers_switch_on_discord_pings(setup, api_client):
    from conduit.events.models import EventPing

    hr, viewer, _ = setup
    api_client.force_login(viewer)  # seeing the warnings isn't enough
    assert api_client.call("put", "/api/pings/blacklist.match", {"ping": True}).status_code == 403
    api_client.force_login(hr)
    resp = api_client.call("put", "/api/pings/blacklist.match", {"ping": True, "roles": ["123"]})
    assert resp.status_code == 200 and resp.json()["ping"] is True
    assert EventPing.objects.get(event="blacklist.match").roles == ["123"]
