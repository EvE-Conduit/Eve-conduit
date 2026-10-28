"""Activity Tracking: polling builds stints, gaps and offline time aren't counted, sessions end on time, the report adds
up the synced data for the period, the member is never told, and who may track whom."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.accounts.models import Character, Token
from conduit.audit.models import AuditEvent, SnoopEvent
from conduit.esi.exceptions import EsiError
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import Constellation, ItemCategory, ItemGroup, ItemType, Region, SolarSystem
from conduit.sheet.killmails.models import CharacterKillmail, Killmail
from conduit.sheet.mining.models import MiningEntry
from conduit.sheet.wallet.models import JournalEntry
from conduit_tracking import services, tracker
from conduit_tracking.models import Session, Stint, TrackedCharacter
from tests.conftest import make_user

BASE = "/api/p/tracking"
SCOPES = "publicData " + " ".join(tracker.SCOPES)
JITA, AMARR = 30000142, 30002187
RIFTER, ORCA, VELD = 587, 28606, 1230


class FakeEsi:
    """Answers the three location routes from ``self.state[character_id]``: None is offline."""

    def __init__(self):
        self.state = {}
        self.fail = None
        self.calls = []

    def get(self, path, *, character=None, params=None, cache_response=True):
        self.calls.append(path)
        if self.fail:
            raise EsiError(self.fail, "nope")
        cid = int(path.split("/")[2])
        now = self.state.get(cid)

        class R:
            pass

        r = R()
        if path.endswith("/online"):
            r.data = {"online": now is not None}
        elif path.endswith("/location"):
            r.data = {"solar_system_id": now[0], **({"station_id": now[2]} if now[2] else {})}
        elif path.endswith("/ship"):
            r.data = {"ship_type_id": now[1], "ship_name": "Boaty", "ship_item_id": 1}
        else:
            raise AssertionError(path)
        return r


@pytest.fixture
def esi(monkeypatch):
    fake = FakeEsi()
    monkeypatch.setattr("conduit.esi.client.esi", lambda: fake)
    monkeypatch.setattr("conduit.sheet.locations.resolve", lambda *a, **k: {})
    return fake


@pytest.fixture
def clock(monkeypatch):
    """Polls happen when the test says: ``clock.tick(minutes)``."""

    class Clock:
        now = timezone.now()

        def tick(self, minutes=1):
            self.now += timedelta(minutes=minutes)

    c = Clock()
    monkeypatch.setattr(timezone, "now", lambda: c.now)
    return c


@pytest.fixture
def setup(db):
    sync_installed()
    set_enabled("tracking", True)
    region = Region.objects.create(id=10000002, name="The Forge")
    Constellation.objects.create(id=20000020, region=region, name="Kimotoro")
    SolarSystem.objects.create(id=JITA, constellation_id=20000020, region=region, name="Jita", security_status=0.95)
    SolarSystem.objects.create(id=AMARR, constellation_id=20000020, region=region, name="Amarr", security_status=1.0)
    ItemCategory.objects.create(id=6, name="Ship")
    ItemGroup.objects.create(id=25, category_id=6, name="Frigate")
    ItemType.objects.create(id=RIFTER, group_id=25, name="Rifter", published=True)
    ItemType.objects.create(id=ORCA, group_id=25, name="Orca", published=True)
    hr = make_user(90000050, "HR Hannah")
    hr.user_permissions.add(Permission.objects.get(codename="track_members"),
                            Permission.objects.get(content_type__app_label="sheet", codename="view_all_characters"))
    member = make_user(90000060, "Shady Sam", scopes=SCOPES)
    alt = Character.objects.create(id=90000061, name="Sam Alt", owner_hash="hash-alt", user=member)
    Token.objects.create(character=alt, access_token="a", refresh_token="r", expires_at=timezone.now() + timedelta(minutes=20), scopes=SCOPES)
    return hr, member, alt


def _start(hr, member, days=7):
    return services.start(hr, member.pk, days, "Suspected spai")


def test_polls_build_stints_and_only_count_watched_time(setup, esi, clock):
    hr, member, alt = setup
    session = _start(hr, member)
    main = member.main_character.pk
    esi.state = {main: (JITA, RIFTER, None)}
    tracker.poll_all()  # first sight: nothing counted yet
    clock.tick()
    tracker.poll_all()
    clock.tick()
    tracker.poll_all()
    assert Stint.objects.count() == 1
    st = Stint.objects.get()
    assert (st.ended_at - st.started_at) == timedelta(minutes=2)
    # Moving on: the minute since the last poll goes to where they are now.
    esi.state = {main: (AMARR, RIFTER, None), alt.pk: (JITA, ORCA, 60003760)}
    clock.tick()
    tracker.poll_all()
    assert Stint.objects.filter(solar_system_id=AMARR).get().ended_at - Stint.objects.get(solar_system_id=AMARR).started_at == timedelta(minutes=1)
    alt_stint = Stint.objects.get(character_id=alt.pk)
    assert alt_stint.started_at == alt_stint.ended_at and alt_stint.station_id == 60003760
    # Logging off ends the stint; the time offline isn't counted.
    esi.state = {}
    clock.tick()
    tracker.poll_all()
    esi.state = {main: (AMARR, RIFTER, None)}
    clock.tick(30)
    tracker.poll_all()
    assert Stint.objects.filter(character_id=main, solar_system_id=AMARR).count() == 2
    # A gap longer than MAX_GAP isn't credited either.
    clock.tick(20)
    tracker.poll_all()
    assert Stint.objects.filter(character_id=main, solar_system_id=AMARR).count() == 3
    assert TrackedCharacter.objects.get(session=session, character_id=main).online is True


def test_characters_that_cant_be_tracked_say_why(setup, esi, clock):
    hr, member, alt = setup
    alt.token.scopes = "publicData"
    alt.token.save()
    session = _start(hr, member)
    esi.state = {member.main_character.pk: (JITA, RIFTER, None)}
    tracker.poll_all()
    t = TrackedCharacter.objects.get(session=session, character_id=alt.pk)
    assert t.status == TrackedCharacter.Status.MISSING_SCOPES and "read_location" in t.status_detail
    assert not any(str(alt.pk) in c for c in esi.calls)
    esi.fail = 500
    tracker.poll_all()
    assert TrackedCharacter.objects.get(session=session, character_id=member.main_character.pk).status == TrackedCharacter.Status.ERROR


def test_alts_linked_later_are_tracked_and_moved_ones_stop(setup, esi, clock):
    hr, member, alt = setup
    session = _start(hr, member)
    new_alt = Character.objects.create(id=90000062, name="Sam Alt Two", owner_hash="h2", user=member)
    Token.objects.create(character=new_alt, access_token="a", refresh_token="r", expires_at=timezone.now() + timedelta(minutes=20), scopes=SCOPES)
    esi.state = {new_alt.pk: (JITA, RIFTER, None)}
    tracker.poll_all()
    assert TrackedCharacter.objects.filter(session=session, character_id=new_alt.pk).exists()
    other = make_user(90000070, "Someone Else")
    alt.user = other
    alt.save()
    tracker.poll_all()
    assert TrackedCharacter.objects.get(session=session, character_id=alt.pk).status == TrackedCharacter.Status.GONE


def test_sessions_end_on_time_and_tell_only_the_tracker(setup, esi, clock):
    hr, member, alt = setup
    session = _start(hr, member, days=1)
    from conduit_tracking.tasks import poll

    clock.tick(60 * 24 + 1)
    poll()
    session.refresh_from_db()
    assert session.ended_at == session.ends_at and not session.running
    assert Notification.objects.filter(user=hr, category="p.tracking").count() == 1
    assert not Notification.objects.filter(user=member).exists()
    esi.calls.clear()
    poll()
    assert esi.calls == []  # finished sessions aren't polled
    # A new session can start once the last one finished.
    assert _start(hr, member).pk != session.pk


def test_start_rules(setup, esi, api_client):
    hr, member, alt = setup
    api_client.force_login(hr)
    for days in (0, 61):
        assert api_client.call("post", f"{BASE}/sessions", {"user_id": member.pk, "days": days}).status_code == 400
    r = api_client.call("post", f"{BASE}/sessions", {"user_id": member.pk, "days": 60, "reason": "Check"})
    assert r.status_code == 200 and r.json()["running"]
    assert set(TrackedCharacter.objects.values_list("character_id", flat=True)) == {member.main_character.pk, alt.pk}
    assert api_client.call("post", f"{BASE}/sessions", {"user_id": member.pk, "days": 3}).status_code == 409
    assert api_client.call("post", f"{BASE}/sessions", {"user_id": hr.pk, "days": 3}).status_code == 404  # not yourself
    assert AuditEvent.objects.filter(action="tracking.started").exists()
    # The member isn't told anything.
    assert not Notification.objects.filter(user=member).exists()
    # Found by an alt's name.
    items = api_client.call("get", f"{BASE}/members?q=Sam Alt").json()["items"]
    assert [(i["id"], i["matched"], i["tracked"]) for i in items] == [(member.pk, "Sam Alt", True)]


def test_stop_and_delete(setup, esi, api_client, clock):
    hr, member, alt = setup
    session = _start(hr, member)
    api_client.force_login(hr)
    clock.tick(10)
    r = api_client.call("post", f"{BASE}/sessions/{session.pk}/stop")
    assert r.status_code == 200 and not r.json()["running"]
    assert api_client.call("post", f"{BASE}/sessions/{session.pk}/stop").status_code == 400
    session.refresh_from_db()
    assert session.stopped_by == hr
    assert not Notification.objects.exists()  # stopping it yourself needs no "finished" notice
    assert api_client.call("delete", f"{BASE}/sessions/{session.pk}").status_code == 200
    assert not Session.objects.exists()
    assert AuditEvent.objects.filter(action="tracking.deleted").exists()


def test_who_may_see_it(setup, esi, api_client):
    hr, member, alt = setup
    session = _start(hr, member)
    # The member themselves: no permission, nothing.
    api_client.force_login(member)
    assert api_client.call("get", f"{BASE}/sessions").status_code == 403
    assert api_client.call("get", f"{BASE}/sessions/{session.pk}").status_code == 403
    # The permission without sheet access to the member: their sessions don't exist for them.
    blind = make_user(90000080, "Blind Bob")
    blind.user_permissions.add(Permission.objects.get(codename="track_members"))
    api_client.force_login(blind)
    assert api_client.call("get", f"{BASE}/sessions").json()["count"] == 0
    assert api_client.call("get", f"{BASE}/sessions/{session.pk}").status_code == 404
    assert api_client.call("post", f"{BASE}/sessions", {"user_id": member.pk, "days": 3}).status_code == 404
    assert api_client.call("get", f"{BASE}/members?q=Sam").json()["items"] == []
    # Nobody sees sessions on themselves, even with the permission.
    member.user_permissions.add(Permission.objects.get(codename="track_members"),
                                Permission.objects.get(content_type__app_label="sheet", codename="view_all_characters"))
    member = type(member).objects.get(pk=member.pk)
    api_client.force_login(member)
    assert api_client.call("get", f"{BASE}/sessions").json()["count"] == 0


def test_report(setup, esi, api_client, clock):
    hr, member, alt = setup
    main = member.main_character.pk
    session = _start(hr, member)
    esi.state = {main: (JITA, RIFTER, None), alt.pk: (AMARR, ORCA, 60008494)}
    for _ in range(11):
        tracker.poll_all()
        clock.tick()
    esi.state = {main: (AMARR, RIFTER, None)}
    for _ in range(5):
        tracker.poll_all()
        clock.tick()
    soon = session.started_at + timedelta(minutes=3)
    JournalEntry.objects.create(character_id=main, ref_id=1, date=soon, ref_type="bounty_prizes", amount=Decimal(5_000_000),
                                context_id=JITA, context_id_type="system_id")
    JournalEntry.objects.create(character_id=main, ref_id=2, date=soon, ref_type="market_transaction", amount=Decimal(-1_000_000))
    # Moving ISK between their own characters is neither earned nor spent.
    JournalEntry.objects.create(character_id=main, ref_id=3, date=soon, ref_type="player_donation", amount=Decimal(-9_000_000),
                                first_party_id=main, second_party_id=alt.pk)
    JournalEntry.objects.create(character_id=alt.pk, ref_id=3, date=soon, ref_type="player_donation", amount=Decimal(9_000_000),
                                first_party_id=main, second_party_id=alt.pk)
    # Before tracking started: not in the report.
    JournalEntry.objects.create(character_id=main, ref_id=4, date=session.started_at - timedelta(days=1), ref_type="bounty_prizes",
                                amount=Decimal(1))
    MiningEntry.objects.create(character_id=alt.pk, date=soon.date(), solar_system_id=AMARR, type_id=VELD, quantity=1000)
    km = Killmail.objects.create(id=1, hash="h", time=soon, solar_system_id=JITA, victim_character_id=1, victim_ship_type_id=ORCA,
                                 damage_taken=1, attacker_count=1, value=2e9,
                                 data={"attackers": [{"character_id": main, "ship_type_id": RIFTER}]})
    CharacterKillmail.objects.create(character_id=main, killmail=km, is_loss=False)

    api_client.force_login(hr)
    r = api_client.call("get", f"{BASE}/sessions/{session.pk}").json()
    t = r["totals"]
    assert t["online_seconds"] == (10 + 1 + 4) * 60 + 10 * 60  # main 15 minutes, alt 10
    assert t["docked_seconds"] == 600
    assert (t["earned"], t["spent"], t["kills"], t["isk_destroyed"]) == (5_000_000, 1_000_000, 1, 2_000_000_000)
    assert [(s["name"], s["seconds"]) for s in r["systems"]] == [("Amarr", 900), ("Jita", 600)]
    assert r["systems"][0]["characters"] == ["Sam Alt", "Shady Sam"]
    assert [(s["name"], s["seconds"]) for s in r["ships"]] == [("Rifter", 900), ("Orca", 600)]
    assert r["income"] == [{"ref_type": "bounty_prizes", "amount": 5_000_000}]
    assert r["isk_systems"][0]["name"] == "Jita"
    assert r["mining"][0]["quantity"] == 1000
    assert r["killmail_ships"][0]["name"] == "Rifter"
    assert sum(r["by_hour"]) == t["online_seconds"]
    chars = {c["name"]: c for c in r["characters"]}
    assert chars["Shady Sam"]["top_system"]["name"] == "Jita" and chars["Shady Sam"]["now"]["system"]["name"] == "Amarr"
    assert chars["Sam Alt"]["online"] is False and chars["Sam Alt"]["now"] is None
    assert r["timeline"][0]["system"]["name"] == "Amarr" and r["timeline_total"] == 3
    # Opening it is in the audit log and the snooper log, for each character.
    assert AuditEvent.objects.filter(action="tracking.report_viewed").exists()
    assert set(SnoopEvent.objects.values_list("character_id", flat=True)) == {main, alt.pk}


def test_search_prefers_the_main_and_says_why_it_found_nobody(setup, esi, api_client):
    hr, member, alt = setup
    api_client.force_login(hr)
    r = api_client.call("get", f"{BASE}/members?q=Sam").json()
    assert [(i["id"], i["matched"]) for i in r["items"]] == [(member.pk, None)]  # "Shady Sam" matched, not "Sam Alt"
    assert api_client.call("get", f"{BASE}/members?q=Hannah").json() == {"items": [], "reason": "own"}
    assert api_client.call("get", f"{BASE}/members?q=Nobody").json() == {"items": [], "reason": ""}
    blind = make_user(90000080, "Blind Bob")
    blind.user_permissions.add(Permission.objects.get(codename="track_members"))
    api_client.force_login(blind)
    assert api_client.call("get", f"{BASE}/members?q=Sam").json() == {"items": [], "reason": "no_reach"}


def test_new_members_list_and_tracking_several_at_once(setup, esi, api_client, corp):
    from conduit.corp.models import CorporationMember
    from conduit.eve.models import EveName
    from conduit.sheet.overview.models import CorporationHistory

    hr, member, alt = setup
    hr.user_permissions.add(Permission.objects.get(codename="view_all_corporations"))
    main = member.main_character
    Character.objects.filter(pk__in=[main.pk, alt.pk]).update(corporation=corp)
    # The main joined 3 days ago by its corporation history; the alt 36 hours ago by the corporation's member tracking.
    CorporationHistory.objects.create(character=main, record_id=1, corporation_id=corp.pk, start_date=timezone.now() - timedelta(days=3))
    CorporationMember.objects.create(corporation=corp, character_id=alt.pk, start_date=timezone.now() - timedelta(hours=36))
    # A veteran who joined long ago, and a recruit nobody registered yet.
    vet = make_user(90000070, "Old Timer", corporation=corp)
    CorporationHistory.objects.create(character=vet.main_character, record_id=2, corporation_id=corp.pk, start_date=timezone.now() - timedelta(days=300))
    CorporationMember.objects.create(corporation=corp, character_id=90000099, start_date=timezone.now() - timedelta(days=1))
    EveName.objects.create(id=90000099, name="Fresh Recruit", category="character")
    # Someone who joined a corporation recently but has since moved on doesn't count for it.
    other = make_user(90000071, "Hopper", corporation=None)
    CorporationHistory.objects.create(character=other.main_character, record_id=3, corporation_id=corp.pk, start_date=timezone.now() - timedelta(days=1))

    api_client.force_login(hr)
    r = api_client.call("get", f"{BASE}/new-members?days=7").json()
    assert [m["id"] for m in r["members"]] == [member.pk]
    m = r["members"][0]
    assert [c["name"] for c in m["characters"]] == ["Shady Sam", "Sam Alt"] and not m["tracked"]
    assert [u["name"] for u in r["unregistered"]] == ["Fresh Recruit"]
    assert api_client.call("get", f"{BASE}/new-members?days=2").json()["members"][0]["characters"][0]["name"] == "Sam Alt"
    assert api_client.call("get", f"{BASE}/new-members?days=61").status_code == 400

    r = api_client.call("post", f"{BASE}/sessions/many", {"user_ids": [member.pk, vet.pk, hr.pk], "days": 14, "reason": "New"}).json()
    assert [s["target"]["id"] for s in r["started"]] == [member.pk, vet.pk]
    assert [f["user_id"] for f in r["failed"]] == [hr.pk]
    m = api_client.call("get", f"{BASE}/new-members").json()["members"][0]
    assert m["tracked"] and m["session_id"] == r["started"][0]["id"]
