import pytest

from conduit.sheet.killmails.models import Killmail
from conduit.sheet.mail.models import Mail
from conduit.sheet.models import SyncStatus
from conduit.sheet.text import parse_notification, plain_text

from .fake_esi import CID
from .test_sheet import fake, pilot, run  # noqa: F401  (fixtures)


def test_plain_text_and_notification_parsing():
    assert plain_text("Hi<br>there &amp; <font size=12>you</font>") == "Hi\nthere & you"
    assert parse_notification("a: 1\nb: 'two'\n  nested: x\n- item\n") == {"a": "1", "b": "two"}


@pytest.mark.django_db
def test_mail(pilot, fake, client):
    assert run("mail") == SyncStatus.Result.OK
    assert Mail.objects.get(mail_id=900).body == "Form up at 19:00\nBring & fit doctrine ships."
    run("mail")
    assert sum(1 for c in fake.calls if c.endswith("/mail/900")) == 1  # bodies fetched once
    client.force_login(pilot)
    rows = client.get(f"/api/characters/{CID}/mail").json()["items"]
    assert rows[0]["sender"]["name"] == "Market Buddy" and rows[0]["is_read"] is False
    assert {r["name"] for r in rows[0]["recipients"]} == {"Pilot One", "Horde Pings"}
    assert client.get(f"/api/characters/{CID}/mail?label=2").json()["count"] == 1
    assert client.get(f"/api/characters/{CID}/mail?q=doctrine").json()["count"] == 1
    assert "Bring & fit" in client.get(f"/api/characters/{CID}/mail/900").json()["body"]
    assert client.get(f"/api/characters/{CID}/mail/labels").json()[0] == {"id": 1, "name": "Inbox", "color": "", "unread": 1}


@pytest.mark.django_db
def test_notifications(pilot, fake, client):
    assert run("notifications") == SyncStatus.Result.OK
    client.force_login(pilot)
    rows = client.get(f"/api/characters/{CID}/notifications").json()["items"]
    attack = rows[0]
    assert attack["title"] == "Structure under attack" and attack["category"] == "structure"
    assert attack["details"]["shieldPercentage"] == "42.5" and attack["sender"] == "DED"
    assert client.get(f"/api/characters/{CID}/notifications?category=corporation").json()["count"] == 1


@pytest.mark.django_db
def test_calendar(pilot, fake, client):
    assert run("calendar") == SyncStatus.Result.OK
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/calendar").json()
    assert data["upcoming"][0]["title"] == "Alliance CTA" and data["upcoming"][0]["text"] == "Defend Jita"
    assert data["upcoming"][0]["important"] and data["past"][0]["title"] == "Old op"


@pytest.mark.django_db
def test_contacts_standings_loyalty(pilot, fake, client):
    for section in ("contacts", "standings", "loyalty"):
        assert run(section) == SyncStatus.Result.OK
    client.force_login(pilot)
    contacts = client.get(f"/api/characters/{CID}/contacts").json()
    assert contacts[0]["name"] == "Market Buddy" and contacts[0]["labels"] == ["Friends"] and contacts[-1]["blocked"]
    standings = client.get(f"/api/characters/{CID}/standings").json()
    assert standings["factions"][0]["name"] == "Caldari State" and standings["agents"][0]["standing"] == 6.0
    lp = client.get(f"/api/characters/{CID}/loyalty").json()
    assert lp["total"] == 125000 and [c["name"] for c in lp["corporations"]] == ["CONCORD"]


@pytest.mark.django_db
def test_fittings_eft_export(pilot, fake, client):
    assert run("fittings") == SyncStatus.Result.OK
    client.force_login(pilot)
    fits = client.get(f"/api/characters/{CID}/fittings").json()
    assert fits[0]["ship"]["name"] == "Rifter" and fits[0]["plugins"] == 3
    fit = client.get(f"/api/characters/{CID}/fittings/1").json()
    assert [s["label"] for s in fit["slots"]] == ["Low slots", "High slots", "Cargo"]
    assert fit["eft"] == "[Rifter, Kite]\nLimited Ocular Filter - Beta\n\nSmall Hybrid Turret\n\nTritanium x100"


@pytest.mark.django_db
def test_killmails(pilot, fake, client):
    from conduit.eve.tasks import update_market_prices

    update_market_prices.run()
    assert run("killmails") == SyncStatus.Result.OK
    run("killmails")
    assert sum(1 for c in fake.calls if c.startswith("/killmails/")) == 2  # each killmail fetched once
    assert Killmail.objects.get(pk=777).value == pytest.approx(400000 + 100 * 4)
    client.force_login(pilot)
    rows = client.get(f"/api/characters/{CID}/killmails").json()["items"]
    assert [r["is_loss"] for r in rows] == [False, True]
    assert rows[0]["victim"] == "Market Buddy" and rows[0]["final_blow"] == "Pilot One"
    assert client.get(f"/api/characters/{CID}/killmails?kind=losses").json()["count"] == 1
    assert client.get(f"/api/characters/{CID}/killmails/summary").json()["kills"] == 1


@pytest.mark.django_db
def test_intel_aggregates_interactions(pilot, fake, client):
    from .conftest import make_user

    for section in ("wallet", "mail", "contracts", "contacts"):
        run(section)
    buddy = make_user(2112000000, "Market Buddy")  # the counterparty is also registered here
    client.force_login(pilot)
    data = client.get(f"/api/characters/{CID}/intel").json()
    top = data["interactions"][0]
    assert top["name"] == "Market Buddy" and top["mail"] == 2 and top["market"] == 1 and top["contracts"] == 2
    # Registered elsewhere, but the pilot may not look at that character, so not whose it is.
    assert top["standing"] == 10.0 and top["member"] == {"registered": True}
    assert data["registered_counterparties"] == 1
    from django.contrib.auth.models import Permission

    pilot.user_permissions.add(Permission.objects.get(codename="view_all_characters"))
    client.force_login(type(pilot).objects.get(pk=pilot.pk))
    top = client.get(f"/api/characters/{CID}/intel").json()["interactions"][0]
    assert top["member"] == {"registered": True, "user_id": buddy.pk, "main": "Market Buddy", "same_account": False}
    assert all(i["id"] >= 4_000_000 for i in data["interactions"])  # NPCs like CONCORD are left out
    header = client.get(f"/api/characters/{CID}").json()
    intel = next(s for s in header["sections"] if s["key"] == "intel")
    assert intel["available"] and intel["last_success"]
    assert buddy.pk


@pytest.mark.django_db
def test_virtual_sections_are_not_scheduled(pilot, monkeypatch):
    from conduit.sheet.tasks import schedule_syncs

    queued = []
    monkeypatch.setattr("conduit.sheet.tasks.sync_section.delay", lambda *a: queued.append(a[1]))
    schedule_syncs()
    assert "intel" not in queued and "wallet" in queued


@pytest.mark.django_db
def test_intel_lists_only_the_alts_the_viewer_may_see(pilot, client, corp):
    from django.contrib.auth.models import Permission

    from conduit.accounts.models import Character
    from conduit.eve.models import EveCorporation

    from .conftest import make_user

    pilot.main_character.corporation = corp
    pilot.main_character.save()
    elsewhere = EveCorporation.objects.create(id=98000009, name="Elsewhere", ticker="ELSE")
    Character.objects.create(id=90000201, name="Corp Alt", owner_hash="h201", user=pilot, corporation=corp)
    Character.objects.create(id=90000202, name="Hidden Alt", owner_hash="h202", user=pilot, corporation=elsewhere)
    director = make_user(90000203, "Director", corporation=corp)
    director.user_permissions.add(Permission.objects.get(codename="view_corporation_characters"))
    client.force_login(director)
    assert [c["name"] for c in client.get(f"/api/characters/{CID}/intel").json()["account_characters"]] == ["Corp Alt"]
    assert [a["name"] for a in client.get(f"/api/characters/{CID}").json()["alts"]] == ["Corp Alt"]
    client.force_login(pilot)
    assert {c["name"] for c in client.get(f"/api/characters/{CID}/intel").json()["account_characters"]} == {"Corp Alt", "Hidden Alt"}


@pytest.mark.django_db
def test_mail_bodies_that_keep_failing_are_given_up(pilot, fake):
    from conduit.sheet.mail.sync import MAX_FETCH_FAILURES

    fake.fail.add(f"/characters/{CID}/mail/900")
    assert run("mail") == SyncStatus.Result.OK
    # A 5xx stops the run: the other body waits instead of spending ESI's error limit.
    assert not any(c.endswith("/mail/899") for c in fake.calls)
    run("mail")
    assert Mail.objects.get(mail_id=899).body_fetched  # the failing one went to the back
    for _ in range(MAX_FETCH_FAILURES + 2):
        run("mail")
    assert sum(1 for c in fake.calls if c.endswith("/mail/900")) == MAX_FETCH_FAILURES
    assert Mail.objects.get(mail_id=900).fetch_failures == MAX_FETCH_FAILURES


@pytest.mark.django_db
def test_mail_bodies_wait_out_a_backoff(pilot, fake, monkeypatch):
    from conduit.esi.exceptions import EsiBackoff

    get = fake.get

    def paused(path, **kw):
        if "/mail/9" in path:
            raise EsiBackoff(30, "error limit low")
        return get(path, **kw)

    monkeypatch.setattr(fake, "get", paused)
    assert run("mail") == SyncStatus.Result.OK
    assert list(Mail.objects.values_list("body_fetched", "fetch_failures")) == [(False, 0), (False, 0)]


@pytest.mark.django_db
def test_contract_items_that_keep_failing_are_given_up(pilot, fake):
    from conduit.sheet.contracts.models import Contract
    from conduit.sheet.contracts.sync import MAX_FETCH_FAILURES

    fake.fail.add(f"/characters/{CID}/contracts/7/items")
    for _ in range(MAX_FETCH_FAILURES + 2):
        assert run("contracts") == SyncStatus.Result.OK
    assert sum(1 for c in fake.calls if c.endswith("/contracts/7/items")) == MAX_FETCH_FAILURES
    assert Contract.objects.get(contract_id=7).fetch_failures == MAX_FETCH_FAILURES


@pytest.mark.django_db
def test_killmail_stored_by_another_character_meanwhile(pilot, fake, monkeypatch):
    """Two characters on the same kill can sync at once; the second must not fail on the first one's row."""
    from conduit.sheet.killmails.models import CharacterKillmail
    from conduit.sheet.killmails.sync import sync

    get = fake.get

    def racing(path, **kw):
        resp = get(path, **kw)
        if path == "/killmails/777/abc" and not Killmail.objects.filter(pk=777).exists():
            Killmail.objects.create(id=777, hash="abc", time="2026-10-03T20:00:00Z", solar_system_id=30000142, victim_ship_type_id=587,
                                    damage_taken=3000, attacker_count=1, data=resp.data)
        return resp

    monkeypatch.setattr(fake, "get", racing)
    sync(pilot.main_character, fake)
    assert set(CharacterKillmail.objects.values_list("killmail_id", flat=True)) == {777, 778}


@pytest.mark.django_db
def test_sync_now_is_not_queued_again_by_the_scheduler(pilot, monkeypatch):
    from conduit.sheet.tasks import schedule_syncs, sync_now

    queued = []
    monkeypatch.setattr("conduit.sheet.tasks.sync_section.apply_async", lambda args, queue: queued.append(args[1]))
    monkeypatch.setattr("conduit.sheet.tasks.sync_section.delay", lambda *a: queued.append(a[1]))
    sync_now(pilot.main_character)
    assert schedule_syncs() == 0
    assert sorted(queued) == sorted(set(queued))  # each section queued once
