"""Ship replacement: claimable losses, payout rules, the review flow and who may see what."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType
from conduit.sheet.killmails.models import CharacterKillmail, Killmail
from conduit_srp import services
from conduit_srp.models import ShipRule, SrpRequest, SrpSettings
from tests.conftest import make_user

RIFTER, SCYTHE, CAPSULE = 587, 631, 670
FRIGATE, LOGI, POD = 25, 832, 29


@pytest.fixture
def ships(db):
    ItemCategory.objects.create(id=6, name="Ship", published=True)
    for gid, name in ((FRIGATE, "Frigate"), (LOGI, "Logistics"), (POD, "Capsule")):
        ItemGroup.objects.create(id=gid, category_id=6, name=name, published=True)
    ItemType.objects.create(id=RIFTER, group_id=FRIGATE, name="Rifter", published=True)
    ItemType.objects.create(id=SCYTHE, group_id=LOGI, name="Scythe", published=True)
    ItemType.objects.create(id=CAPSULE, group_id=POD, name="Capsule", published=True)


def lose(character, ship=RIFTER, value=10_000_000.0, days_ago=1, km_id=None):
    km = Killmail.objects.create(
        id=km_id or Killmail.objects.count() + 100, hash="a" * 40, time=timezone.now() - timedelta(days=days_ago),
        solar_system_id=30000142, victim_character_id=character.pk, victim_corporation_id=character.corporation_id,
        victim_ship_type_id=ship, damage_taken=1000, attacker_count=3, value=value,
        data={"victim": {"ship_type_id": ship, "items": [{"item_type_id": 2048, "flag": 27, "quantity_destroyed": 1, "singleton": 0}]}},
    )
    CharacterKillmail.objects.create(character=character, killmail=km, is_loss=True)
    return km


@pytest.fixture
def pilot(db, corp, ships):
    sync_installed()
    set_enabled("srp", True)
    user = make_user(90000001, "Pilot One", corporation=corp)
    # Linked long before any loss in these tests (losses from before a character was linked can't be claimed).
    Character.objects.filter(user=user).update(added_at=timezone.now() - timedelta(days=365))
    return user


def grant(user, *codenames):
    user.is_superuser = False
    user.save()
    user.user_permissions.add(*Permission.objects.filter(content_type__app_label="srp", codename__in=codenames))
    return user


def test_payout_rules(pilot):
    assert services.suggest(RIFTER, 10_000_000) == Decimal(10_000_000)  # 100 % by default
    ShipRule.objects.create(group_id=FRIGATE, name="Frigate", percent=50)
    assert services.suggest(RIFTER, 10_000_000) == Decimal(5_000_000)
    ShipRule.objects.create(type_id=RIFTER, name="Rifter", payout=2_500_000)  # ship beats group
    assert services.suggest(RIFTER, 10_000_000) == Decimal(2_500_000)
    ShipRule.objects.create(group_id=POD, name="Capsule", covered=False)
    assert services.suggest(CAPSULE, 1000) is None
    SrpSettings.objects.update_or_create(pk=1, defaults={"covered_only": True})
    assert services.suggest(SCYTHE, 50_000_000) is None


def test_claimable_lists_recent_unclaimed_losses(pilot):
    char = pilot.main_character
    recent = lose(char)
    lose(char, days_ago=45)  # too old
    claimed = lose(char)
    SrpRequest.objects.create(killmail=claimed, user=pilot, character_id=char.pk, character_name=char.name)
    rows = services.claimable(pilot)
    assert [r["killmail_id"] for r in rows] == [recent.pk]
    assert rows[0]["suggested"] == 10_000_000


def test_member_claims_and_reviewer_approves(pilot, api_client, admin_user):
    km = lose(pilot.main_character)
    api_client.force_login(pilot)
    resp = api_client.call("post", "/api/p/srp/requests", {"killmail_id": km.pk})
    assert resp.status_code == 400 and "fleet" in resp.json()["detail"]
    resp = api_client.call("post", "/api/p/srp/requests", {"killmail_id": km.pk, "fleet": "Sunday roam", "fc": "FC Bob"})
    assert resp.status_code == 200, resp.content
    req_id = resp.json()["id"]
    assert resp.json()["fitting"][0]["label"] == "High slots"
    assert api_client.call("post", "/api/p/srp/requests", {"killmail_id": km.pk, "fleet": "again"}).status_code == 400
    assert api_client.call("get", "/api/p/srp/queue").status_code == 403

    reviewer = grant(admin_user, "review_requests")
    api_client.force_login(reviewer)
    assert Notification.objects.filter(user=reviewer, category="p.srp").exists()
    queue = api_client.call("get", "/api/p/srp/queue").json()
    assert queue["counts"]["pending"] == 1 and queue["totals"]["pending"] == 10_000_000
    resp = api_client.call("post", f"/api/p/srp/requests/{req_id}/decide", {"decision": "approve", "payout": 8_000_000})
    assert resp.status_code == 200 and resp.json()["status"] == "approved" and resp.json()["payout"] == 8_000_000
    assert Notification.objects.filter(user=pilot, title__startswith="SRP approved").exists()
    # Reviewers can't mark paid without srp.pay_requests.
    assert api_client.call("post", "/api/p/srp/paid", {"ids": [req_id]}).status_code == 403
    grant(reviewer, "review_requests", "pay_requests")
    csv = api_client.call("get", "/api/p/srp/queue.csv")
    assert b"Pilot One" in csv.content and b"8000000" in csv.content
    assert api_client.call("post", "/api/p/srp/paid", {"ids": [req_id]}).json() == {"paid": 1, "skipped_own": 0}
    assert SrpRequest.objects.get(pk=req_id).status == "paid"


def test_reject_needs_a_reason_and_nobody_decides_their_own(pilot, api_client):
    km = lose(pilot.main_character)
    req = services.submit(pilot, killmail_id=km.pk, fleet="CTA")
    grant(pilot, "review_requests")
    api_client.force_login(pilot)
    assert api_client.call("post", f"/api/p/srp/requests/{req.pk}/decide", {"decision": "approve"}).status_code == 403
    other = grant(make_user(90000050, "Reviewer"), "review_requests")
    api_client.force_login(other)
    assert api_client.call("post", f"/api/p/srp/requests/{req.pk}/decide", {"decision": "reject"}).status_code == 400
    resp = api_client.call("post", f"/api/p/srp/requests/{req.pk}/decide", {"decision": "reject", "note": "Not a doctrine fit"})
    assert resp.json()["status"] == "rejected" and resp.json()["decision_note"] == "Not a doctrine fit"


def test_members_only_see_their_own_requests(pilot, api_client):
    req = services.submit(pilot, killmail_id=lose(pilot.main_character).pk, fleet="CTA")
    stranger = make_user(90000060, "Stranger")
    api_client.force_login(stranger)
    assert api_client.call("get", f"/api/p/srp/requests/{req.pk}").status_code == 404
    assert api_client.call("delete", f"/api/p/srp/requests/{req.pk}").status_code == 403
    api_client.force_login(pilot)
    assert api_client.call("get", f"/api/p/srp/requests/{req.pk}").json()["mine"]
    assert api_client.call("delete", f"/api/p/srp/requests/{req.pk}").status_code == 200
    assert not SrpRequest.objects.exists()


def test_cant_claim_someone_elses_loss(pilot):
    other = make_user(90000070, "Other Pilot")
    km = lose(other.main_character)
    with pytest.raises(services.SrpError, match="isn't one of your"):
        services.submit(pilot, killmail_id=km.pk, fleet="CTA")


def test_claim_from_kill_link(pilot, monkeypatch):
    alt = Character.objects.create(id=90000002, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=pilot.main_character.corporation,
                                   added_at=timezone.datetime(2026, 9, 1, tzinfo=timezone.UTC))

    class Resp:
        data = {"killmail_time": "2026-10-01T12:00:00Z", "solar_system_id": 30000142, "attackers": [{"character_id": 5, "final_blow": True}],
                "victim": {"character_id": alt.pk, "corporation_id": alt.corporation_id, "ship_type_id": SCYTHE, "damage_taken": 5, "items": []}}

    class FakeEsi:
        def get(self, path, **kw):
            assert path == f"/killmails/555/{'b' * 40}"
            return Resp()

    monkeypatch.setattr("conduit.esi.client.esi", lambda: FakeEsi())
    monkeypatch.setattr(services, "ensure_eve_names", lambda ids: None)
    monkeypatch.setattr(services.timezone, "now", lambda: timezone.datetime(2026, 10, 2, tzinfo=timezone.UTC))
    with pytest.raises(services.SrpError, match="zKillboard link"):
        services.submit(pilot, link="https://example.com/kill/555/", fleet="CTA")
    req = services.submit(pilot, link=f"https://esi.evetech.net/latest/killmails/555/{'b' * 40}/", fleet="CTA")
    assert req.character_name == "Pilot Alt" and req.killmail.victim_ship_type_id == SCYTHE


def test_claim_from_zkillboard_link(pilot, monkeypatch):
    import httpx

    seen = []

    def fake_get(url, **kw):
        seen.append(url)
        assert kw["headers"]["User-Agent"]
        return httpx.Response(200, json=[{"killmail_id": 556, "zkb": {"hash": "C" * 40}}], request=httpx.Request("GET", url))

    class Resp:
        data = {"killmail_time": "2026-10-01T12:00:00Z", "solar_system_id": 30000142, "attackers": [],
                "victim": {"character_id": pilot.main_character.pk, "corporation_id": pilot.main_character.corporation_id, "ship_type_id": RIFTER, "items": []}}

    class FakeEsi:
        def get(self, path, **kw):
            assert path == f"/killmails/556/{'c' * 40}"
            return Resp()

    monkeypatch.setattr(httpx, "get", fake_get)
    monkeypatch.setattr("conduit.esi.client.esi", lambda: FakeEsi())
    monkeypatch.setattr(services, "ensure_eve_names", lambda ids: None)
    monkeypatch.setattr(services.timezone, "now", lambda: timezone.datetime(2026, 10, 2, tzinfo=timezone.UTC))
    req = services.submit(pilot, link="https://zkillboard.com/kill/556/", fleet="CTA")
    assert req.killmail_id == 556 and seen == ["https://zkillboard.com/api/killID/556/"]
    # A loss that already synced doesn't ask zKillboard at all.
    km = lose(pilot.main_character, km_id=557)
    seen.clear()
    assert services.killmail_from_link("https://zkillboard.com/kill/557/", pilot) == km and seen == []


def test_zkillboard_without_the_killmail(pilot, monkeypatch):
    import httpx

    monkeypatch.setattr(httpx, "get", lambda url, **kw: httpx.Response(200, json=[], request=httpx.Request("GET", url)))
    with pytest.raises(services.SrpError, match="doesn't know"):
        services.killmail_from_link("https://zkillboard.com/kill/999/", pilot)
    monkeypatch.setattr(httpx, "get", lambda url, **kw: (_ for _ in ()).throw(httpx.ConnectError("down")))
    with pytest.raises(services.SrpError, match="didn't answer"):
        services.killmail_from_link("https://zkillboard.com/kill/999/", pilot)


def test_rules_api(pilot, api_client, admin_user):
    api_client.force_login(admin_user)
    hits = api_client.call("get", "/api/p/srp/ships?q=log").json()
    assert hits[0] == {"kind": "group", "id": LOGI, "name": "Logistics", "subtitle": "Every ship in this group", "icon": None}
    rule = api_client.call("post", "/api/p/srp/rules", {"group_id": LOGI, "payout": 60_000_000}).json()
    assert rule["name"] == "Logistics" and rule["payout"] == 60_000_000
    assert api_client.call("post", "/api/p/srp/rules", {"group_id": LOGI, "percent": 50}).status_code == 400  # already has one
    assert api_client.call("post", "/api/p/srp/rules", {"type_id": 2048}).status_code == 400  # not a ship
    assert services.suggest(SCYTHE, 1) == Decimal(60_000_000)
    assert api_client.call("delete", f"/api/p/srp/rules/{rule['id']}").status_code == 200


def test_nobody_reopens_or_pays_their_own_request(pilot, api_client):
    """Not even administrators decide their own request; reopening and paying count as deciding."""
    req = services.submit(pilot, killmail_id=lose(pilot.main_character).pk, fleet="CTA")
    other = grant(make_user(90000050, "Reviewer"), "review_requests")
    services.reject(req, other, "Not a doctrine fit")
    grant(pilot, "review_requests", "pay_requests")
    api_client.force_login(pilot)
    assert api_client.call("post", f"/api/p/srp/requests/{req.pk}/decide", {"decision": "reopen"}).status_code == 403
    services.approve(SrpRequest.objects.get(pk=req.pk), other, 5_000_000)
    assert api_client.call("post", "/api/p/srp/paid", {"ids": [req.pk]}).json() == {"paid": 0, "skipped_own": 1}
    assert SrpRequest.objects.get(pk=req.pk).status == "approved"
    pilot.is_superuser = True
    pilot.save()
    with pytest.raises(services.SrpError):
        services.reopen(SrpRequest.objects.get(pk=req.pk), pilot)


def test_stale_copies_cant_undo_payment_or_bring_back_a_withdrawn_request(pilot):
    req = services.submit(pilot, killmail_id=lose(pilot.main_character).pk, fleet="CTA")
    reviewer = grant(make_user(90000050, "Reviewer"), "review_requests", "pay_requests")
    stale = SrpRequest.objects.get(pk=req.pk)
    services.approve(SrpRequest.objects.get(pk=req.pk), reviewer, 5_000_000)
    services.mark_paid([req.pk], reviewer)
    # A reviewer's page loaded before it was paid: reopening the old copy fails instead of un-paying it.
    stale.status = "approved"
    with pytest.raises(services.SrpError):
        services.reopen(stale, reviewer)
    assert SrpRequest.objects.get(pk=req.pk).status == "paid"
    # Withdrawn while a reviewer had it open: approving the old copy doesn't recreate it.
    req2 = services.submit(pilot, killmail_id=lose(pilot.main_character).pk, fleet="CTA")
    stale2 = SrpRequest.objects.get(pk=req2.pk)
    services.withdraw(SrpRequest.objects.get(pk=req2.pk), pilot)
    with pytest.raises(services.SrpError):
        services.approve(stale2, reviewer, 1_000_000)
    assert not SrpRequest.objects.filter(pk=req2.pk).exists()


def test_bad_numbers_are_refused_not_crashed(pilot, api_client):
    req = services.submit(pilot, killmail_id=lose(pilot.main_character).pk, fleet="CTA")
    reviewer = grant(make_user(90000050, "Reviewer"), "review_requests")
    api_client.force_login(reviewer)
    for payout in (1e20, float("inf")):
        resp = api_client.call("post", f"/api/p/srp/requests/{req.pk}/decide", {"decision": "approve", "payout": payout})
        assert resp.status_code in (400, 422), (payout, resp.status_code)
    api_client.force_login(pilot)
    for body in ({"killmail_id": 10**30, "fleet": "x"}, {"killmail_id": 2**40, "fleet": "x"},
                 {"link": "https://zkillboard.com/kill/" + "9" * 40 + "/", "fleet": "x"}):
        assert api_client.call("post", "/api/p/srp/requests", body).status_code in (400, 404, 422), body


def test_payout_csv_cannot_run_formulas(pilot, api_client):
    req = services.submit(pilot, killmail_id=lose(pilot.main_character).pk, fleet='=HYPERLINK("http://evil","x")')
    reviewer = grant(make_user(90000050, "Reviewer"), "review_requests", "pay_requests")
    services.approve(req, reviewer, 1_000_000)
    api_client.force_login(reviewer)
    csv = api_client.call("get", "/api/p/srp/queue.csv").content.decode()
    assert "'=HYPERLINK" in csv


def test_only_the_members_own_losses_are_fetched_or_claimed(pilot, monkeypatch):
    """Someone else's loss is refused before anything is stored; so is a loss from before the character was linked
    (a character that changed hands is linked afresh); and pasting links is limited."""
    other = make_user(90000009, "Someone Else")
    victim = {"character_id": other.main_character.pk, "corporation_id": None, "ship_type_id": RIFTER, "items": []}

    class FakeEsi:
        def get(self, path, **kw):
            class Resp:
                data = {"killmail_time": "2026-10-01T12:00:00Z", "solar_system_id": 30000142, "attackers": [], "victim": victim}
            return Resp()

    monkeypatch.setattr("conduit.esi.client.esi", lambda: FakeEsi())
    monkeypatch.setattr(services, "ensure_eve_names", lambda ids: None)
    monkeypatch.setattr(services.timezone, "now", lambda: timezone.datetime(2026, 10, 2, tzinfo=timezone.UTC))
    link = f"https://esi.evetech.net/latest/killmails/600/{'d' * 40}/"
    with pytest.raises(services.SrpError, match="isn't one of your characters"):
        services.submit(pilot, link=link, fleet="CTA")
    assert not Killmail.objects.filter(pk=600).exists()

    # The pilot's own character, but bought (linked) after the loss: refused.
    bought = Character.objects.create(id=90000003, name="Bought Toon", owner_hash="new", user=pilot,
                                      added_at=timezone.datetime(2026, 10, 1, 18, tzinfo=timezone.UTC))
    victim["character_id"] = bought.pk
    with pytest.raises(services.SrpError, match="isn't one of your characters"):
        services.submit(pilot, link=f"https://esi.evetech.net/latest/killmails/601/{'d' * 40}/", fleet="CTA")
    # Already synced (e.g. through the corporation's killmails): refused with the reason.
    km = lose(bought, km_id=602)
    Killmail.objects.filter(pk=602).update(time=timezone.datetime(2026, 10, 1, 12, tzinfo=timezone.UTC))
    with pytest.raises(services.SrpError, match="before the character was linked"):
        services.submit(pilot, killmail_id=km.pk, fleet="CTA")
    assert km.pk not in [k["id"] for k in services.claimable(pilot)]

    # Ten pasted links in ten minutes, then a pause.
    for _ in range(services.LINK_LOOKUPS - 2):  # two were used above
        with pytest.raises(services.SrpError):
            services.submit(pilot, link=link, fleet="CTA")
    with pytest.raises(services.SrpError) as exc:
        services.submit(pilot, link=link, fleet="CTA")
    assert exc.value.status == 429
