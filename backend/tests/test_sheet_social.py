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
    assert fits[0]["ship"]["name"] == "Rifter" and fits[0]["modules"] == 3
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
    assert top["standing"] == 10.0 and top["member"]["main"] == "Market Buddy" and not top["member"]["same_account"]
    assert data["registered_counterparties"] == 1
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
