from datetime import timedelta

import pytest
from django.contrib.auth.models import Permission
from django.utils import timezone

from conduit.corp import registry
from conduit.corp.models import (
    CorpAsset,
    CorpContract,
    CorpIndustryJob,
    CorpJournalEntry,
    CorpMarketOrder,
    CorporationInfo,
    CorporationKillmail,
    CorporationMember,
    CorpSyncStatus,
    CorpTransaction,
    MiningObservation,
    MoonExtraction,
    Starbase,
    Structure,
    WalletDivision,
)
from conduit.corp.services import member_ids
from conduit.corp.tasks import candidates, schedule_syncs, sync_section
from conduit.esi.exceptions import EsiError
from conduit.notify.models import Notification
from conduit.sheet.overview.models import CharacterInfo

from .conftest import make_user
from .fake_esi import CID, FakeEsi, load_sde_fixture

CORP = 98000001
DIRECTOR_ID, ACCOUNTANT_ID, LINE_ID = CID, 90000010, 90000011
CORP_SCOPES = " ".join(["publicData", "esi-universe.read_structures.v1", "esi-corporations.read_titles.v1", *registry.all_scopes()])
SOON = (timezone.now() + timedelta(hours=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
LATER = (timezone.now() + timedelta(days=20)).strftime("%Y-%m-%dT%H:%M:%SZ")
TODAY = timezone.now().date().isoformat()

CORP_ROUTES = {
    rf"/corporations/{CORP}": {"name": "Test Corp", "ticker": "TCORP", "ceo_id": DIRECTOR_ID, "creator_id": DIRECTOR_ID, "member_count": 3,
                               "tax_rate": 0.1, "alliance_id": 99000001, "date_founded": "2015-01-01T00:00:00Z", "home_station_id": 60003760,
                               "description": "<b>We fly</b>", "shares": 1000, "war_eligible": True},
    rf"/corporations/{CORP}/divisions": {"hangar": [{"division": 1, "name": "Main hangar"}], "wallet": [{"division": 1, "name": "Treasury"}, {"division": 2, "name": "SRP"}]},
    rf"/corporations/{CORP}/members": [DIRECTOR_ID, ACCOUNTANT_ID, LINE_ID, 2112000000],
    rf"/corporations/{CORP}/membertracking": [
        {"character_id": DIRECTOR_ID, "logon_date": "2026-10-07T10:00:00Z", "logoff_date": "2026-10-06T10:00:00Z", "location_id": 60003760, "ship_type_id": 587, "start_date": "2020-01-01T00:00:00Z"},
        {"character_id": 2112000000, "logon_date": "2026-09-01T10:00:00Z", "logoff_date": "2026-09-01T12:00:00Z", "location_id": 30000142, "ship_type_id": 587},
    ],
    rf"/corporations/{CORP}/roles": [{"character_id": DIRECTOR_ID, "roles": ["Director"]}, {"character_id": ACCOUNTANT_ID, "roles": ["Accountant"]}],
    rf"/corporations/{CORP}/titles": [{"title_id": 1, "name": "Officer"}],
    rf"/corporations/{CORP}/members/titles": [{"character_id": DIRECTOR_ID, "titles": [1]}],
    rf"/corporations/{CORP}/structures": [
        {"structure_id": 1035466617946, "corporation_id": CORP, "name": "Perimeter - Keepstar", "type_id": 35834, "system_id": 30000144, "profile_id": 1,
         "state": "shield_vulnerable", "fuel_expires": SOON, "services": [{"name": "Clone Bay", "state": "online"}], "reinforce_hour": 20},
        {"structure_id": 1035466617947, "corporation_id": CORP, "name": "Jita - Astrahus", "type_id": 35832, "system_id": 30000142, "profile_id": 1,
         "state": "shield_vulnerable", "fuel_expires": LATER},
    ],
    rf"/corporations/{CORP}/wallets": [{"division": 1, "balance": 1000000.0}, {"division": 2, "balance": 50.0}],
    rf"/corporations/{CORP}/wallets/1/journal": [
        {"id": 1, "date": "2026-10-05T10:00:00Z", "ref_type": "bounty_prizes", "amount": 500000.0, "balance": 1000000.0, "description": "Tax", "first_party_id": 1000125, "second_party_id": CORP},
    ],
    rf"/corporations/{CORP}/wallets/2/journal": [],
    rf"/corporations/{CORP}/wallets/1/transactions": [
        {"transaction_id": 9, "date": "2026-10-04T10:00:00Z", "type_id": 34, "quantity": 10, "unit_price": 5.0, "is_buy": True, "client_id": 2112000000, "location_id": 60003760},
    ],
    rf"/corporations/{CORP}/wallets/2/transactions": [],
    rf"/corporations/{CORP}/assets": [
        {"item_id": 1, "type_id": 587, "quantity": 1, "location_id": 60003760, "location_type": "station", "location_flag": "CorpSAG1", "is_singleton": True},
        {"item_id": 2, "type_id": 34, "quantity": 500, "location_id": 1, "location_type": "item", "location_flag": "Cargo", "is_singleton": False},
    ],
    rf"/corporations/{CORP}/assets/names": [{"item_id": 1, "name": "Corp Rifter"}],
    rf"/corporations/{CORP}/industry/jobs": [
        {"job_id": 5, "installer_id": DIRECTOR_ID, "activity_id": 1, "status": "active", "blueprint_id": 50, "blueprint_type_id": 691, "product_type_id": 587,
         "runs": 2, "facility_id": 60003760, "location_id": 60003760, "output_location_id": 60003760, "duration": 60,
         "start_date": "2026-10-01T00:00:00Z", "end_date": "2099-01-01T00:00:00Z", "cost": 100.0},
    ],
    rf"/corporations/{CORP}/contracts": [
        {"contract_id": 70, "type": "item_exchange", "status": "outstanding", "availability": "corporation", "issuer_id": DIRECTOR_ID,
         "issuer_corporation_id": CORP, "assignee_id": CORP, "acceptor_id": 0, "price": 10.0, "date_issued": "2026-10-01T00:00:00Z",
         "date_expired": "2026-10-15T00:00:00Z", "start_location_id": 60003760, "end_location_id": 60003760, "for_corporation": True},
    ],
    rf"/corporations/{CORP}/orders": [
        {"order_id": 300, "type_id": 34, "is_buy_order": True, "price": 4.0, "volume_total": 100, "volume_remain": 50, "escrow": 200.0,
         "issued": "2026-10-01T00:00:00Z", "issued_by": DIRECTOR_ID, "duration": 90, "location_id": 60003760, "region_id": 10000002,
         "range": "station", "wallet_division": 1},
    ],
    rf"/corporation/{CORP}/mining/extractions": [
        {"structure_id": 1035466617946, "moon_id": 40009082, "extraction_start_time": "2026-10-01T00:00:00Z",
         "chunk_arrival_time": "2099-01-01T00:00:00Z", "natural_decay_time": "2099-01-01T03:00:00Z"},
    ],
    rf"/corporation/{CORP}/mining/observers": [{"observer_id": 1035466617946, "observer_type": "structure", "last_updated": TODAY}],
    rf"/corporation/{CORP}/mining/observers/1035466617946": [
        {"character_id": LINE_ID, "last_updated": TODAY, "quantity": 1000, "recorded_corporation_id": CORP, "type_id": 34},
    ],
    rf"/corporations/{CORP}/starbases": [{"starbase_id": 77, "type_id": 16213, "system_id": 30000142, "moon_id": 40009082, "state": "online"}],
    rf"/corporations/{CORP}/killmails/recent": [{"killmail_id": 777, "killmail_hash": "abc"}, {"killmail_id": 778, "killmail_hash": "def"}],
}


class CorpEsi(FakeEsi):
    """Refuses (403) calls made as the characters in ``refuse``."""

    def __init__(self, refuse=(), **kwargs):
        super().__init__(routes=CORP_ROUTES, **kwargs)
        self.refuse = set(refuse)
        self.as_character = []

    def _guard(self, character):
        self.as_character.append(character.pk if character else None)
        if character is not None and character.pk in self.refuse:
            raise EsiError(403, "Character does not have required role(s)")

    def get(self, path, *, character=None, params=None):
        self._guard(character)
        return super().get(path, character=character, params=params)

    def get_all_pages(self, path, *, character=None, params=None):
        self._guard(character)
        return super().get_all_pages(path, character=character, params=params)


def _member(char_id, name, corp, roles, scopes=CORP_SCOPES):
    user = make_user(char_id, name, corporation=corp, scopes=scopes)
    CharacterInfo.objects.create(character=user.main_character, roles=roles)
    return user


@pytest.fixture
def people(corp):
    load_sde_fixture()
    director = _member(DIRECTOR_ID, "Pilot One", corp, ["Director"])
    accountant = _member(ACCOUNTANT_ID, "Bean Counter", corp, ["Accountant"])
    line = _member(LINE_ID, "Line Member", corp, [])
    return director, accountant, line


@pytest.fixture
def fake(monkeypatch):
    fake = CorpEsi()
    for target in ("conduit.corp.tasks.esi", "conduit.sheet.locations.esi", "conduit.eve.tasks.esi"):
        monkeypatch.setattr(target, lambda: fake)
    return fake


def run(section):
    return sync_section.apply(args=[CORP, section]).get()


def grant(user, *codenames):
    for code in codenames:
        user.user_permissions.add(Permission.objects.get(codename=code))
    return type(user).objects.get(pk=user.pk)


# --- choosing who syncs -------------------------------------------------------------


def test_sections_are_registered():
    assert {"overview", "members", "structures", "wallets", "assets", "industry", "contracts", "market", "mining", "starbases", "killmails"} <= set(registry.SECTIONS)
    assert "esi-wallet.read_corporation_wallets.v1" in registry.all_scopes()


@pytest.mark.django_db
def test_candidates_need_roles_and_scopes(people, corp):
    director, accountant, line = people
    wallets, assets, contracts = (registry.SECTIONS[k] for k in ("wallets", "assets", "contracts"))
    assert {c.pk for c in candidates(CORP, wallets)} == {DIRECTOR_ID, ACCOUNTANT_ID}
    assert [c.pk for c in candidates(CORP, assets)] == [DIRECTOR_ID]
    assert {c.pk for c in candidates(CORP, contracts)} == {DIRECTOR_ID, ACCOUNTANT_ID, LINE_ID}
    # The character that worked last time goes first.
    assert candidates(CORP, wallets, preferred_id=ACCOUNTANT_ID)[0].pk == ACCOUNTANT_ID
    # Without the scope, the role is not enough.
    accountant.main_character.token.scopes = "publicData"
    accountant.main_character.token.save()
    assert [c.pk for c in candidates(CORP, wallets)] == [DIRECTOR_ID]


@pytest.mark.django_db
def test_refused_character_falls_back_to_next(people, fake):
    fake.refuse = {ACCOUNTANT_ID}
    CorpSyncStatus.objects.create(corporation_id=CORP, section="wallets", character_id=ACCOUNTANT_ID)
    assert run("wallets") == "ok"
    status = CorpSyncStatus.objects.get(corporation_id=CORP, section="wallets")
    assert status.character_id == DIRECTOR_ID
    assert fake.as_character[0] == ACCOUNTANT_ID


@pytest.mark.django_db
def test_all_refused_is_an_error_with_backoff(people, fake):
    fake.refuse = {DIRECTOR_ID, ACCOUNTANT_ID}
    assert run("wallets") == "error"
    status = CorpSyncStatus.objects.get(corporation_id=CORP, section="wallets")
    assert "refused" in status.message and status.failures == 1
    assert status.next_due > timezone.now() + timedelta(hours=1)


@pytest.mark.django_db
def test_no_suitable_member(corp, fake):
    load_sde_fixture()
    _member(LINE_ID, "Line Member", corp, [])
    assert run("structures") == "no_character"
    assert "Station_Manager" in CorpSyncStatus.objects.get(corporation_id=CORP, section="structures").message
    # Public data still works without anyone suitable.
    assert run("overview") == "ok"
    assert CorporationInfo.objects.get(pk=CORP).tax_rate == 0.1


@pytest.mark.django_db
def test_scheduler_queues_each_section_once(people, monkeypatch):
    queued = []
    monkeypatch.setattr("conduit.corp.tasks.sync_section.delay", lambda *a: queued.append(a))
    assert schedule_syncs() == len(registry.SECTIONS)
    assert schedule_syncs() == 0
    assert {c for c, _ in queued} == {CORP}


# --- each section ---------------------------------------------------------------------


@pytest.mark.django_db
def test_every_section_syncs(people, fake):
    for key in registry.SECTIONS:
        assert run(key) == "ok", (key, CorpSyncStatus.objects.get(corporation_id=CORP, section=key).message)
    info = CorporationInfo.objects.get(pk=CORP)
    assert info.description == "We fly" and info.wallet_divisions[0]["name"] == "Treasury"
    director = CorporationMember.objects.get(corporation_id=CORP, character_id=DIRECTOR_ID)
    assert director.tracked and director.roles == ["Director"] and director.titles == ["Officer"]
    assert CorporationMember.objects.filter(corporation_id=CORP).count() == 4
    assert Structure.objects.filter(corporation_id=CORP).count() == 2
    assert WalletDivision.objects.get(corporation_id=CORP, division=1).balance == 1000000
    assert CorpJournalEntry.objects.count() == 1 and CorpTransaction.objects.count() == 1
    assert CorpAsset.objects.get(item_id=1).name == "Zippy"  # the shared fake names every asset
    assert CorpAsset.objects.get(item_id=2).root_location_id == 60003760
    assert CorpIndustryJob.objects.count() == 1 and CorpContract.objects.count() == 1 and CorpMarketOrder.objects.count() == 1
    assert MoonExtraction.objects.count() == 1 and MiningObservation.objects.get().quantity == 1000
    assert Starbase.objects.get().state == "online"
    km = {k.killmail_id: k.is_loss for k in CorporationKillmail.objects.all()}
    assert km == {777: False, 778: True}


@pytest.mark.django_db
def test_closed_market_orders_and_departed_members(people, fake):
    run("market")
    run("members")
    fake.routes[rf"/corporations/{CORP}/orders"] = []
    fake.routes[rf"/corporations/{CORP}/members"] = [DIRECTOR_ID]
    run("market")
    run("members")
    assert CorpMarketOrder.objects.get().state == "closed"
    assert list(CorporationMember.objects.values_list("character_id", flat=True)) == [DIRECTOR_ID]


@pytest.mark.django_db
def test_member_ids(people, fake):
    assert member_ids(CORP) is None
    run("members")
    assert member_ids(CORP) == {DIRECTOR_ID, ACCOUNTANT_ID, LINE_ID, 2112000000}


# --- notifications ----------------------------------------------------------------------


@pytest.mark.django_db
def test_low_fuel_warns_once_and_rearms(people, fake):
    director, accountant, line = people
    grant(accountant, "view_own_corporation")
    outsider = grant(make_user(90000050, "Outsider"), "view_own_corporation")
    run("structures")
    notes = Notification.objects.filter(category="corp.structures")
    assert list(notes.values_list("user_id", flat=True)) == [accountant.pk]
    assert "Keepstar" in notes.first().title
    run("structures")
    assert notes.count() == 1  # still low: no repeat
    fake.routes[rf"/corporations/{CORP}/structures"] = [dict(CORP_ROUTES[rf"/corporations/{CORP}/structures"][0], fuel_expires=LATER)]
    run("structures")
    assert not Structure.objects.get().fuel_warned
    fake.routes[rf"/corporations/{CORP}/structures"] = [dict(CORP_ROUTES[rf"/corporations/{CORP}/structures"][0], fuel_expires=SOON)]
    run("structures")
    assert notes.count() == 2
    assert not Notification.objects.filter(user=outsider).exists()


@pytest.mark.django_db
def test_reinforcement_notifies(people, fake):
    director, accountant, _ = people
    grant(accountant, "view_own_corporation")
    run("structures")
    rows = [dict(r, state="armor_reinforce", fuel_expires=LATER, state_timer_end=LATER) for r in CORP_ROUTES[rf"/corporations/{CORP}/structures"]]
    fake.routes[rf"/corporations/{CORP}/structures"] = rows
    run("structures")
    assert Notification.objects.filter(user=accountant, level="danger", title__contains="reinforced").count() == 2


# --- access and API ----------------------------------------------------------------------


@pytest.mark.django_db
def test_access_rules(people, api_client, corp):
    from conduit.corp.access import can_view_corporation
    from conduit.eve.models import EveCorporation

    director, accountant, line = people
    api_client.force_login(line)
    assert api_client.call("get", f"/api/corporations/{CORP}").status_code == 403
    assert api_client.call("get", "/api/corporations").json() == []

    line = grant(line, "view_own_corporation")
    assert can_view_corporation(line, CORP)
    api_client.force_login(line)
    assert api_client.call("get", f"/api/corporations/{CORP}/structures").status_code == 200
    assert api_client.call("get", f"/api/corporations/{CORP}/wallets").status_code == 403
    assert [c["id"] for c in api_client.call("get", "/api/corporations").json()] == [CORP]

    line = grant(line, "view_corporation_wallets")
    api_client.force_login(line)
    assert api_client.call("get", f"/api/corporations/{CORP}/wallets").status_code == 200

    other = EveCorporation.objects.create(id=98000002, name="Sister Corp", ticker="SIS", alliance=corp.alliance)
    make_user(90000060, "Sister Pilot", corporation=other)
    assert not can_view_corporation(line, other.pk)
    line = grant(line, "view_alliance_corporations")
    assert can_view_corporation(line, other.pk)
    outsider = grant(make_user(90000061, "Outsider"), "view_all_corporations")
    assert can_view_corporation(outsider, other.pk) and can_view_corporation(outsider, CORP)


@pytest.mark.django_db
def test_api_routes(people, fake, api_client, admin_user):
    for key in registry.SECTIONS:
        run(key)
    api_client.force_login(admin_user)
    corps = api_client.call("get", "/api/corporations").json()
    assert corps[0]["health"]["ok"] == len(registry.SECTIONS)
    header = api_client.call("get", f"/api/corporations/{CORP}").json()
    assert {s["key"] for s in header["sections"]} == set(registry.SECTIONS)
    assert header["sections"][0]["synced_as"]["id"] == DIRECTOR_ID
    for path in ("overview", "members", "structures", "wallets", "wallets/journal", "wallets/transactions", "assets", "assets/60003760",
                 "industry", "industry/summary", "contracts", "market", "market/summary", "mining", "starbases", "killmails", "killmails/summary"):
        resp = api_client.call("get", f"/api/corporations/{CORP}/{path}")
        assert resp.status_code == 200, (path, resp.content)
    members = api_client.call("get", f"/api/corporations/{CORP}/members").json()
    assert members["items"][0]["id"] == DIRECTOR_ID and members["items"][0]["online"]
    assert members["registered"] == 3
    structures = api_client.call("get", f"/api/corporations/{CORP}/structures").json()
    assert structures[0]["fuel_hours"] < 12
    overview = api_client.call("get", f"/api/corporations/{CORP}/overview").json()
    assert overview["low_fuel"] == 1 and overview["wallet_total"] == 1000050
    assets = api_client.call("get", f"/api/corporations/{CORP}/assets/60003760").json()
    assert assets[0]["children"][0]["quantity"] == 500
    mining = api_client.call("get", f"/api/corporations/{CORP}/mining").json()
    assert mining["miners"][0]["id"] == LINE_ID and mining["extractions"]


@pytest.mark.django_db
def test_external_api_needs_corp_scope(people, fake, client):
    from conduit.external import areas
    from conduit.external.models import ApiKey

    run("structures")
    run("wallets")
    areas.set_enabled("corp", True)
    _, secret = ApiKey.issue(name="Timer bot", scopes=["corp:structures"])

    def get(path):
        return client.get(path, HTTP_AUTHORIZATION=f"Bearer {secret}")

    assert get(f"/api/v1/corporations/{CORP}/sheet/structures").status_code == 200
    assert "lacks the corp:wallets" in get(f"/api/v1/corporations/{CORP}/sheet/wallets").json()["detail"]
    assert [s["key"] for s in get(f"/api/v1/corporations/{CORP}/sheet").json()["sections"]] == ["structures"]
    assert get(f"/api/v1/corporations/{CORP}/sheet/structures/../../../../admin/api/keys").status_code == 404


@pytest.mark.django_db
def test_structures_are_searchable(people, fake, api_client):
    director, accountant, line = people
    run("structures")
    api_client.force_login(line)
    assert not any(g["key"] == "corp_structures" for g in api_client.call("get", "/api/search?q=keep").json().get("groups", []))
    api_client.force_login(grant(line, "view_own_corporation"))
    groups = api_client.call("get", "/api/search?q=keep").json()["groups"]
    hits = next(g for g in groups if g["key"] == "corp_structures")["hits"]
    assert hits[0]["url"] == f"/corporations/{CORP}?tab=structures"


@pytest.mark.django_db
def test_structure_sync_names_our_structures_for_everyone(people, fake):
    from conduit.sheet.models import Location
    from conduit.corp.models import Structure

    run("structures")
    for s in Structure.objects.all():
        loc = Location.objects.get(pk=s.structure_id)
        assert loc.resolved and loc.name == s.name and loc.owner_id == CORP


@pytest.mark.django_db
def test_refreshing_a_corporation_takes_a_permission(people, api_client, monkeypatch):
    queued = []
    monkeypatch.setattr("conduit.corp.tasks.sync_section.apply_async", lambda args, queue: queued.append(args[1]))
    _, _, line = people
    line = grant(line, "view_own_corporation")
    api_client.force_login(line)
    assert api_client.call("get", f"/api/corporations/{CORP}").json()["can_refresh"] is False
    assert api_client.call("post", f"/api/corporations/{CORP}/refresh").status_code == 403 and not queued
    line = grant(line, "refresh_corporations")
    api_client.force_login(line)
    assert api_client.call("get", f"/api/corporations/{CORP}").json()["can_refresh"] is True
    assert api_client.call("post", f"/api/corporations/{CORP}/refresh").status_code == 200 and queued
