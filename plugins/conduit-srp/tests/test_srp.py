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
    return make_user(90000001, "Pilot One", corporation=corp)


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
    assert api_client.call("post", "/api/p/srp/paid", {"ids": [req_id]}).json() == {"paid": 1}
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
    alt = Character.objects.create(id=90000002, name="Pilot Alt", owner_hash="alt", user=pilot, corporation=pilot.main_character.corporation)

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
    with pytest.raises(services.SrpError, match="Copy external kill link"):
        services.submit(pilot, link="https://zkillboard.com/kill/555/", fleet="CTA")
    req = services.submit(pilot, link=f"https://esi.evetech.net/latest/killmails/555/{'b' * 40}/", fleet="CTA")
    assert req.character_name == "Pilot Alt" and req.killmail.victim_ship_type_id == SCYTHE


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
