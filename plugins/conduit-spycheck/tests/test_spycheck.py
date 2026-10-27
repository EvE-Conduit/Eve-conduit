"""Spy Check: the scan finds each kind, keeps one row per finding, dismissals stick until there's new evidence, the
digest, working with and without the Blacklist plugin, and who may see what."""

import sys
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.audit.models import AuditEvent, SnoopEvent
from conduit.esi.client import EsiResponse
from conduit.eve.models import EveAlliance, EveCorporation, EveName
from conduit.events import bus
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sheet.contacts.models import Contact
from conduit.sheet.contracts.models import Contract
from conduit.sheet.mail.models import Mail
from conduit.sheet.overview.models import CorporationHistory
from conduit.sheet.wallet.models import JournalEntry, WalletTransaction
from conduit_spycheck import services
from conduit_spycheck.models import Finding, SpySettings, WatchEntry
from tests.conftest import make_user

BASE = "/api/p/spycheck"
SPY, BAD_CORP, BAD_ALLIANCE, ALLIANCE_CORP = 90000777, 98000666, 99000666, 98000667


def ago(days):
    return timezone.now() - timedelta(days=days)


@pytest.fixture
def setup(db):
    sync_installed()
    set_enabled("spycheck", True)
    set_enabled("blacklist", False)
    EveName.objects.create(id=SPY, name="Known Spy", category="character")
    EveName.objects.create(id=BAD_CORP, name="Awoxers Inc", category="corporation")
    EveName.objects.create(id=BAD_ALLIANCE, name="Hostile Alliance", category="alliance")
    alliance = EveAlliance.objects.create(id=BAD_ALLIANCE, name="Hostile Alliance")
    EveCorporation.objects.create(id=ALLIANCE_CORP, name="Hostile Holding", alliance=alliance)
    hr = make_user(90000050, "HR Hannah")
    hr.user_permissions.add(*Permission.objects.filter(content_type__app_label="spycheck"))
    viewer = make_user(90000051, "Viewer Vic")
    viewer.user_permissions.add(Permission.objects.get(codename="view_findings"))
    # Findings are narrowed to the characters a reviewer's sheet permissions reach; these two see everyone.
    see_all = Permission.objects.get(content_type__app_label="sheet", codename="view_all_characters")
    hr.user_permissions.add(see_all)
    viewer.user_permissions.add(see_all)
    member = make_user(90000060, "Shady Sam")
    alt = Character.objects.create(id=90000061, name="Sam Alt", owner_hash="hash-alt", user=member)
    return hr, viewer, member, alt


def watch(*ids):
    for eve_id in ids:
        n = EveName.objects.get(pk=eve_id)
        WatchEntry.objects.create(kind=n.category, eve_id=eve_id, name=n.name)


def journal(char, ref_id, days, other=SPY, amount=-1000):
    return JournalEntry.objects.create(character=char, ref_id=ref_id, date=ago(days), ref_type="player_donation",
                                       amount=Decimal(amount), first_party_id=char.pk, second_party_id=other)


def mail(char, mail_id, days, sender=None, to=SPY):
    return Mail.objects.create(character=char, mail_id=mail_id, sender_id=sender or char.pk, subject="Hi", timestamp=ago(days),
                               recipients=[{"recipient_id": to, "recipient_type": "character"}])


def contract(char, contract_id, days, **ids):
    fields = {"issuer_id": char.pk, "issuer_corporation_id": 1000001, "assignee_id": 0, "acceptor_id": 0, **ids}
    return Contract.objects.create(character=char, contract_id=contract_id, type="item_exchange", status="finished", availability="personal",
                                   price=Decimal(5_000_000), date_issued=ago(days), date_expired=ago(days - 14), **fields)


def found(**kw):
    return Finding.objects.get(**kw)


# --- the scan --------------------------------------------------------------------------------------------------------


def test_scan_finds_each_kind(setup):
    _, _, member, alt = setup
    main = member.main_character
    watch(SPY, BAD_CORP, BAD_ALLIANCE)
    journal(main, 1, 10, amount=-2_000_000)
    journal(main, 2, 5, amount=500_000)
    WalletTransaction.objects.create(character=main, transaction_id=1, date=ago(3), type_id=34, quantity=10, unit_price=Decimal(5),
                                     is_buy=False, client_id=SPY, location_id=60003760)
    contract(alt, 1, 4, assignee_id=SPY)
    contract(alt, 2, 2, issuer_id=SPY, issuer_corporation_id=BAD_CORP)
    mail(main, 1, 7)
    mail(main, 2, 1, sender=SPY, to=main.pk)
    Mail.objects.create(character=main, mail_id=3, sender_id=main.pk, timestamp=ago(1), recipients=[{"recipient_id": 1900000777}])  # text match only
    Contact.objects.create(character=alt, contact_id=SPY, contact_type="character", standing=5.0)
    Contact.objects.create(character=main, contact_id=BAD_CORP, contact_type="corporation", standing=-10.0)  # bad standing: fine
    CorporationHistory.objects.create(character=alt, record_id=1, corporation_id=BAD_CORP, start_date=ago(400))
    CorporationHistory.objects.create(character=alt, record_id=2, corporation_id=ALLIANCE_CORP, start_date=ago(200))
    CorporationHistory.objects.create(character=alt, record_id=3, corporation_id=1000001, start_date=ago(100))

    flagged = services.scan()

    j = found(character_id=main.pk, kind="journal")
    assert (j.count, j.amount, j.entity_id, j.source) == (2, Decimal("2500000.00"), SPY, "watch")
    assert j.first_seen < j.last_seen and j.user == member
    assert found(character_id=main.pk, kind="market").amount == 50
    assert found(character_id=main.pk, kind="mail").count == 2
    c = found(character_id=alt.pk, entity_id=SPY, kind="contract")
    assert c.count == 2 and c.user == member
    assert found(character_id=alt.pk, entity_id=BAD_CORP, kind="contract").count == 1  # issued for the corporation
    assert found(character_id=alt.pk, kind="contact").amount == 5
    assert not Finding.objects.filter(character_id=main.pk, kind="contact").exists()
    assert found(character_id=alt.pk, entity_id=BAD_CORP, kind="corp_history").count == 1
    assert found(character_id=alt.pk, entity_id=BAD_ALLIANCE, kind="corp_history").count == 1  # a corporation in the alliance now
    assert len(flagged) == Finding.objects.count() == 8
    assert all(f.state == "new" for f in Finding.objects.all())


def test_current_corporation_counts_before_history_syncs(setup):
    _, _, member, _ = setup
    watch(BAD_ALLIANCE)
    main = member.main_character
    main.corporation_id, main.alliance_id = ALLIANCE_CORP, BAD_ALLIANCE
    main.save()
    services.scan()
    f = found(character_id=main.pk, kind="corp_history")
    assert f.entity_id == BAD_ALLIANCE and f.last_seen is None


def test_one_row_per_member_entity_and_kind(setup):
    _, _, member, _ = setup
    main = member.main_character
    watch(SPY)
    journal(main, 1, 10)
    services.scan()
    journal(main, 2, 5)
    assert services.scan() == []  # already new: not reported again
    assert Finding.objects.count() == 1
    assert found(kind="journal").count == 2


def test_own_alts_and_guests_are_left_out(setup):
    _, _, member, alt = setup
    EveName.objects.create(id=alt.pk, name=alt.name, category="character")
    watch(alt.pk, SPY)
    journal(member.main_character, 1, 3, other=alt.pk)  # moving ISK to your own alt
    guest = make_user(90000090, "Guest Gary", member=False)
    journal(guest.main_character, 2, 3)
    services.scan()
    assert not Finding.objects.exists()


def test_dismissed_stays_dismissed_until_new_evidence(setup, api_client):
    hr, _, member, _ = setup
    main = member.main_character
    watch(SPY)
    journal(main, 1, 10)
    services.scan()
    f = found(kind="journal")
    api_client.force_login(hr)
    assert api_client.call("post", f"{BASE}/findings/{f.pk}/state", {"state": "dismissed"}).status_code == 400  # needs a note
    r = api_client.call("post", f"{BASE}/findings/{f.pk}/state", {"state": "dismissed", "note": "Selling him a ship, known"})
    assert r.status_code == 200 and r.json()["state"] == "dismissed" and r.json()["decided_by"] == "HR Hannah"
    # Re-scans, and older records syncing late, don't bring it back.
    services.scan()
    journal(main, 2, 12)
    assert services.scan() == []
    f.refresh_from_db()
    assert f.state == "dismissed" and f.count == 2 and f.note == "Selling him a ship, known"
    # The entity leaving the watch list and coming back doesn't either.
    WatchEntry.objects.all().delete()
    services.scan()
    f.refresh_from_db()
    assert not f.present
    watch(SPY)
    services.scan()
    f.refresh_from_db()
    assert f.state == "dismissed" and f.present
    # Something newer does.
    journal(main, 3, 0)
    assert [x.pk for x in services.scan()] == [f.pk]
    f.refresh_from_db()
    assert f.state == "new" and services.finding_out(f)["reopened"]


def test_dismissed_contact_reopens_when_it_comes_back_or_improves(setup):
    hr, _, member, _ = setup
    main = member.main_character
    watch(SPY)
    contact = Contact.objects.create(character=main, contact_id=SPY, contact_type="character", standing=2.0)
    services.scan()
    f = services.decide(found(kind="contact"), hr, "dismissed", "Old friend")
    assert services.scan() == []
    contact.standing = 10.0
    contact.save()
    assert len(services.scan()) == 1
    f = services.decide(found(kind="contact"), hr, "dismissed", "Still an old friend")
    contact.delete()
    services.scan()
    Contact.objects.create(character=main, contact_id=SPY, contact_type="character", standing=10.0)
    assert len(services.scan()) == 1


def test_acknowledged_keeps_updating_and_shows_new_evidence(setup):
    hr, _, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 10)
    services.scan()
    f = services.decide(found(kind="journal"), hr, "acknowledged", "Watching")
    assert not services.finding_out(f)["new_evidence"]
    journal(member.main_character, 2, 0)
    assert services.scan() == []
    f.refresh_from_db()
    assert f.state == "acknowledged" and f.count == 2 and services.finding_out(f)["new_evidence"]


def test_digest_goes_to_the_chosen_group_and_emits_an_event(setup, monkeypatch):
    hr, viewer, member, _ = setup
    emitted = []
    monkeypatch.setattr(bus, "emit", lambda name, **kw: name.startswith("spycheck.") and emitted.append((name, kw)))
    watch(SPY, BAD_CORP)
    journal(member.main_character, 1, 3)
    mail(member.main_character, 1, 2)
    Contact.objects.create(character=member.main_character, contact_id=BAD_CORP, contact_type="corporation", standing=10)
    services.scan()
    notes = Notification.objects.filter(category="p.spycheck")
    assert sorted(n.user_id for n in notes) == sorted([hr.pk, viewer.pk])  # one each, for three findings
    assert notes.first().title == "Spy Check: 3 new findings" and "Shady Sam" in notes.first().body
    assert len(emitted) == 1 and emitted[0][1]["count"] == 3 and emitted[0][1]["user_ids"] == [member.pk]

    # A chosen group: only its members who may see findings (not the plain member in it).
    group = Group.objects.create(name="Counter-intel")
    group.user_set.add(viewer, member)
    s = SpySettings.load()
    s.notify_group = group
    s.save()
    notes.delete()
    journal(member.main_character, 2, 1, other=BAD_CORP)
    services.scan()
    assert list(Notification.objects.filter(category="p.spycheck").values_list("user_id", flat=True)) == [viewer.pk]
    # Nothing new: nobody is told.
    Notification.objects.all().delete()
    services.scan()
    assert not Notification.objects.filter(category="p.spycheck").exists()


def test_skipped_kinds_and_min_standing(setup):
    _, _, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 3)
    Contact.objects.create(character=member.main_character, contact_id=SPY, contact_type="character", standing=2.5)
    s = SpySettings.load()
    s.skip_kinds, s.min_standing = ["journal"], 5
    s.save()
    services.scan()
    assert not Finding.objects.exists()


# --- the Blacklist plugin ----------------------------------------------------------------------------------------------


def test_uses_the_blacklist_when_it_is_on(setup):
    pytest.importorskip("conduit_blacklist")
    from conduit_blacklist.models import Entry

    _, _, member, _ = setup
    Entry.objects.create(kind="character", eve_id=SPY, name="Known Spy", severity="banned", reason="Awoxed")
    Entry.objects.create(kind="corporation", eve_id=BAD_CORP, name="Awoxers Inc", severity="watch")
    Entry.objects.create(kind="alliance", eve_id=BAD_ALLIANCE, name="Hostile Alliance", expires_at=ago(1))  # ran out
    journal(member.main_character, 1, 3)
    journal(member.main_character, 2, 3, other=BAD_CORP)
    journal(member.main_character, 3, 3, other=BAD_ALLIANCE)
    services.scan()
    assert not Finding.objects.exists()  # switched off: not read
    set_enabled("blacklist", True)
    services.scan()
    assert set(Finding.objects.values_list("entity_id", "source")) == {(SPY, "blacklist"), (BAD_CORP, "blacklist")}
    s = SpySettings.load()
    s.blacklist_watch_entries = False
    s.save()
    services.scan()
    assert not found(entity_id=BAD_CORP).present
    s.use_blacklist = False
    s.save()
    services.scan()
    assert not Finding.objects.filter(present=True).exists()


def test_works_without_the_blacklist_plugin(setup, monkeypatch, api_client):
    hr, _, member, _ = setup
    # As if it weren't installed at all: switched on in the database, but the package can't be imported.
    set_enabled("blacklist", True)
    monkeypatch.setitem(sys.modules, "conduit_blacklist.models", None)
    assert not services.blacklist_available()
    watch(SPY)
    journal(member.main_character, 1, 3)
    assert len(services.scan()) == 1
    api_client.force_login(hr)
    body = api_client.call("get", f"{BASE}/watch").json()
    assert body["blacklist"] == [] and not body["blacklist_available"] and [w["name"] for w in body["items"]] == ["Known Spy"]
    assert api_client.call("get", f"{BASE}/settings").json()["blacklist_available"] is False


# --- pages and who may see them ---------------------------------------------------------------------------------------


def test_members_never_see_it(setup, api_client):
    _, _, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 3)
    services.scan()
    f = found(kind="journal")
    api_client.force_login(member)
    for path in ("/summary", "/findings", f"/findings/{f.pk}", "/members", f"/members/{member.pk}", "/watch", "/settings", "/entities?q=Known"):
        assert api_client.call("get", BASE + path).status_code == 403, path
    assert api_client.call("post", f"{BASE}/findings/{f.pk}/state", {"state": "dismissed", "note": "mine"}).status_code == 403
    assert api_client.call("post", f"{BASE}/scan").status_code == 403
    boot = api_client.call("get", "/api/core/bootstrap").json()
    assert next(p for p in boot["plugins"] if p["id"] == "spycheck")["nav"] == []


def test_reviewers_review_but_dont_manage(setup, api_client):
    _, viewer, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 3)
    services.scan()
    f = found(kind="journal")
    api_client.force_login(viewer)
    body = api_client.call("get", f"{BASE}/findings").json()
    assert body["count"] == 1 and body["items"][0]["entity"]["name"] == "Known Spy"
    assert api_client.call("post", f"{BASE}/findings/{f.pk}/state", {"state": "acknowledged"}).json()["state"] == "acknowledged"
    assert api_client.call("get", f"{BASE}/findings?state=acknowledged").json()["count"] == 1
    for method, path, data in (("get", "/settings", None), ("post", "/scan", None), ("post", "/watch", {"eve_id": BAD_CORP}),
                               ("delete", f"/watch/{WatchEntry.objects.get().pk}", None)):
        assert api_client.call(method, BASE + path, data).status_code == 403, path
    assert api_client.call("get", f"{BASE}/summary").json()["can_manage"] is False


def test_opening_evidence_is_snooped_and_audited(setup, api_client):
    _, viewer, member, alt = setup
    watch(SPY)
    journal(member.main_character, 1, 3, amount=-750)
    mail(alt, 1, 2)
    services.scan()
    api_client.force_login(viewer)
    # Lists don't count as looking at their data.
    api_client.call("get", f"{BASE}/findings")
    assert not SnoopEvent.objects.exists()
    f = found(kind="journal")
    body = api_client.call("get", f"{BASE}/findings/{f.pk}").json()
    assert body["rows"][0]["amount"] == -750 and body["rows"][0]["second_party"]["name"] == "Known Spy"
    assert body["sheet_link"] == f"/characters/{member.main_character.pk}?tab=wallet"
    snoop = SnoopEvent.objects.get()
    assert (snoop.viewer_id, snoop.character_id, snoop.section) == (viewer.pk, member.main_character.pk, "wallet")
    assert AuditEvent.objects.filter(action="spycheck.evidence_viewed", actor_id=viewer.pk).exists()
    m = api_client.call("get", f"{BASE}/findings/{found(kind='mail').pk}").json()
    assert m["rows"][0]["subject"] == "Hi" and "body" not in m["rows"][0]
    assert SnoopEvent.objects.filter(character_id=alt.pk, section="mail").exists()


def test_member_view_across_alts(setup, api_client):
    _, viewer, member, alt = setup
    other = make_user(90000070, "Clean Cleo")
    watch(SPY)
    journal(member.main_character, 1, 3)
    mail(alt, 1, 2)
    journal(other.main_character, 2, 3)
    services.scan()
    services.decide(found(character_id=other.main_character.pk), viewer, "dismissed", "Known trade")
    api_client.force_login(viewer)
    rows = api_client.call("get", f"{BASE}/members").json()["items"]
    assert [(r["name"], r["new"], r["dismissed"]) for r in rows] == [("Shady Sam", 2, 0), ("Clean Cleo", 0, 1)]
    body = api_client.call("get", f"{BASE}/members/{member.pk}").json()
    assert {f["character"]["name"] for f in body["findings"]} == {"Shady Sam", "Sam Alt"}
    assert {c["name"]: c["findings"] for c in body["characters"]} == {"Shady Sam": 1, "Sam Alt": 1}
    assert set(SnoopEvent.objects.values_list("character_id", "section")) == {(member.main_character.pk, "intel"), (alt.pk, "intel")}
    assert AuditEvent.objects.filter(action="spycheck.member_viewed").exists()
    assert api_client.call("get", f"{BASE}/findings?user={member.pk}").json()["count"] == 2


def test_watch_list_and_scan_now(setup, api_client, monkeypatch):
    hr, _, member, _ = setup
    asked = []

    class FakeEsi:
        def post(self, path, body):
            asked.append(body)
            return EsiResponse({"characters": [{"id": 90000555, "name": "New Guy"}]} if body == ["New Guy"] else {}, 200, {})

    monkeypatch.setattr("conduit.esi.client.esi", lambda: FakeEsi())
    journal(member.main_character, 1, 3, other=BAD_CORP)
    api_client.force_login(hr)
    hits = api_client.call("get", f"{BASE}/entities?q=Awox").json()
    assert hits[0]["id"] == BAD_CORP and hits[0]["kind"] == "corporation"
    assert api_client.call("get", f"{BASE}/entities?q=Awoxers Inc").json()[0]["id"] == BAD_CORP
    assert asked == [["Awox"]]  # an exact name the synced data knows isn't looked up
    # Someone the synced data hasn't mentioned yet is found by their exact name.
    assert api_client.call("get", f"{BASE}/entities?q=New Guy").json() == [
        {"id": 90000555, "name": "New Guy", "kind": "character", "image": "https://images.evetech.net/characters/90000555/portrait?size=64", "watched": False}]
    r = api_client.call("post", f"{BASE}/watch", {"eve_id": BAD_CORP, "reason": "Awoxed our Rorqual"})
    assert r.status_code == 200 and r.json()["kind"] == "corporation"
    assert api_client.call("post", f"{BASE}/watch", {"eve_id": BAD_CORP}).status_code == 400  # already watched
    assert api_client.call("post", f"{BASE}/watch", {"eve_id": 123456789}).status_code == 400  # unknown id
    body = api_client.call("post", f"{BASE}/scan").json()
    assert body["flagged"] == 1 and body["new"] == 1 and body["members"] == 1
    entry = WatchEntry.objects.get()
    assert api_client.call("delete", f"{BASE}/watch/{entry.pk}").status_code == 200
    assert AuditEvent.objects.filter(action__in=["spycheck.watch_added", "spycheck.watch_removed"]).count() == 2


def test_settings(setup, api_client):
    hr, _, _, _ = setup
    group = Group.objects.create(name="Counter-intel")
    api_client.force_login(hr)
    r = api_client.call("put", f"{BASE}/settings", {"notify_group": group.pk, "use_blacklist": False, "blacklist_watch_entries": True,
                                                    "min_standing": 4, "skip_kinds": ["mail", "nonsense"]})
    assert r.status_code == 200 and r.json()["skip_kinds"] == ["mail"] and r.json()["recipients"] == 0
    s = SpySettings.load()
    assert s.notify_group == group and not s.use_blacklist and s.min_standing == 4
    assert api_client.call("put", f"{BASE}/settings", {"use_blacklist": True, "blacklist_watch_entries": True, "min_standing": 11}).status_code == 400


def test_the_daily_task_only_runs_while_enabled(setup):
    from conduit_spycheck.tasks import daily

    _, _, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 3)
    set_enabled("spycheck", False)
    daily()
    assert not Finding.objects.exists()
    set_enabled("spycheck", True)
    daily()
    assert Finding.objects.count() == 1


def test_findings_are_narrowed_to_characters_the_reviewer_may_see(setup, api_client):
    hr, _, member, _ = setup
    ours = EveCorporation.objects.create(id=98000100, name="Our Corp")
    theirs = EveCorporation.objects.create(id=98000101, name="Sister Corp")
    Character.objects.filter(user=member).update(corporation=ours)
    other = make_user(90000070, "Other Olga", corporation=theirs)
    corp_hr = make_user(90000071, "Corp HR Carl", corporation=ours)
    corp_hr.user_permissions.add(Permission.objects.get(codename="view_findings"),
                                 Permission.objects.get(content_type__app_label="sheet", codename="view_corporation_characters"))
    no_sheet = make_user(90000072, "Blind Bob", corporation=ours)
    no_sheet.user_permissions.add(Permission.objects.get(codename="view_findings"))
    watch(SPY)
    journal(member.main_character, 1, 3)
    journal(other.main_character, 2, 3)
    services.scan()
    theirs_finding = Finding.objects.get(character_id=other.main_character.pk)

    api_client.force_login(corp_hr)
    assert [i["character"]["name"] for i in api_client.call("get", f"{BASE}/findings").json()["items"]] == ["Shady Sam"]
    assert api_client.call("get", f"{BASE}/summary").json()["new"] == 1
    assert [m["name"] for m in api_client.call("get", f"{BASE}/members").json()["items"]] == ["Shady Sam"]
    assert api_client.call("get", f"{BASE}/findings/{theirs_finding.pk}").status_code == 404
    assert api_client.call("post", f"{BASE}/findings/{theirs_finding.pk}/state", {"state": "acknowledged"}).status_code == 404
    # A member none of whose characters they may see isn't there, and opening it isn't audited.
    assert api_client.call("get", f"{BASE}/members/{other.pk}").status_code == 404
    assert not AuditEvent.objects.filter(action="spycheck.member_viewed", target_id=str(other.pk)).exists()
    # The digest tells each reviewer only about what they may see.
    assert Notification.objects.filter(user=corp_hr).get().body.startswith("Shady Sam")
    assert Notification.objects.filter(user=hr).count() == 1 and "Other Olga" in Notification.objects.get(user=hr).body
    assert not Notification.objects.filter(user=no_sheet).exists()
    api_client.force_login(no_sheet)
    assert api_client.call("get", f"{BASE}/findings").json()["count"] == 0


def test_reviewers_never_review_themselves(setup, api_client):
    hr, viewer, member, _ = setup
    watch(SPY)
    journal(viewer.main_character, 1, 3)
    journal(member.main_character, 2, 3)
    services.scan()
    own = Finding.objects.get(character_id=viewer.main_character.pk)
    # The digest leaves out their own finding; HR hears about both.
    assert "Viewer Vic" not in Notification.objects.get(user=viewer).body
    assert "Viewer Vic" in Notification.objects.get(user=hr).body
    api_client.force_login(viewer)
    assert [i["character"]["name"] for i in api_client.call("get", f"{BASE}/findings").json()["items"]] == ["Shady Sam"]
    assert api_client.call("get", f"{BASE}/summary").json()["new"] == 1
    assert [m["name"] for m in api_client.call("get", f"{BASE}/members").json()["items"]] == ["Shady Sam"]
    assert api_client.call("get", f"{BASE}/findings/{own.pk}").status_code == 404
    assert api_client.call("post", f"{BASE}/findings/{own.pk}/state", {"state": "dismissed", "note": "Not me"}).status_code == 404
    assert api_client.call("get", f"{BASE}/members/{viewer.pk}").status_code == 404
    assert not AuditEvent.objects.filter(action="spycheck.member_viewed").exists()
    with pytest.raises(services.SpyCheckError):
        services.decide(own, viewer, "dismissed", "Not me")
    own.refresh_from_db()
    assert own.state == Finding.State.NEW
    # Someone else may.
    services.decide(own, hr, "acknowledged")


def test_only_one_scan_at_a_time(setup, api_client):
    from django.core.cache import cache

    from conduit_spycheck.tasks import daily

    hr, _, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 3)
    cache.add(services.SCAN_LOCK, 1, 60)  # a scan is running
    try:
        api_client.force_login(hr)
        r = api_client.call("post", f"{BASE}/scan")
        assert r.status_code == 409 and "already running" in r.json()["detail"]
        daily()  # skipped quietly
        assert not Finding.objects.exists()
    finally:
        cache.delete(services.SCAN_LOCK)
    assert api_client.call("post", f"{BASE}/scan").json()["flagged"] == 1
    assert cache.add(services.SCAN_LOCK, 1, 60)  # released after the scan
    cache.delete(services.SCAN_LOCK)


def test_a_finding_made_meanwhile_doesnt_fail_the_scan(setup, monkeypatch):
    _, _, member, _ = setup
    watch(SPY)
    journal(member.main_character, 1, 3)
    real = services.collect

    def racing(*args):
        found = real(*args)
        # Another scan saved the same finding after this one read the existing ones.
        Finding.objects.create(user=member, character_id=member.main_character.pk, character_name="Shady Sam", entity_id=SPY,
                               kind="journal", entity_kind="character", entity_name="Known Spy", source="watch")
        return found

    monkeypatch.setattr(services, "collect", racing)
    services.scan()
    f = Finding.objects.get()
    assert f.count == 1
