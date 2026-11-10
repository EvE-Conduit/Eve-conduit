"""Regression tests for the review of the ESI client, name lookups and the character and corporation syncs."""

import time
from datetime import timedelta
from email.utils import formatdate

import httpx
import pytest
from django.core.cache import cache
from django.utils import timezone

from conduit.esi.client import EsiClient, EsiResponse
from conduit.esi.exceptions import EsiError

from .conftest import make_user


class NamesEsi:
    """/universe/names that 404s any batch holding one of ``bad``, or answers ``status`` for everything."""

    def __init__(self, bad=(), status=None):
        self.bad, self.status, self.calls = set(bad), status, []

    def post(self, path, body, character=None):
        self.calls.append(list(body))
        if self.status:
            raise EsiError(self.status, "down")
        if self.bad & set(body):
            raise EsiError(404, "Ensure all IDs are valid before resolving.")
        return EsiResponse([{"id": i, "name": f"n{i}", "category": "character"} for i in body], 200, {})


def test_one_bad_id_no_longer_blocks_the_names_next_to_it(db, monkeypatch):
    from conduit.eve import tasks
    from conduit.eve.models import EveName

    fake = NamesEsi(bad={1})
    monkeypatch.setattr(tasks, "esi", lambda: fake)
    ids = {1, *range(2_100_000_000, 2_100_000_030)}
    tasks.ensure_eve_names(ids)
    assert EveName.objects.count() == 30
    first = len(fake.calls)
    # The bad id is remembered: later syncs don't ask ESI at all.
    tasks.ensure_eve_names(ids)
    tasks.ensure_eve_names(ids)
    assert len(fake.calls) == first


def test_name_lookup_stops_when_esi_is_down(db, monkeypatch):
    from conduit.eve import tasks

    fake = NamesEsi(status=502)
    monkeypatch.setattr(tasks, "esi", lambda: fake)
    tasks.ensure_eve_names(range(2_100_000_000, 2_100_000_200))
    assert len(fake.calls) == 1  # no smaller batches piled on a failing ESI
    assert not cache.get(tasks.UNRESOLVABLE_KEY.format(id=2_100_000_000))


def test_304_without_page_count_keeps_every_page(db):
    expires = formatdate(time.time() + 60, usegmt=True)

    def handler(request):
        if request.headers.get("If-None-Match"):
            return httpx.Response(304, headers={"Expires": expires, "ETag": '"v"'})  # no X-Pages
        page = int(request.url.params.get("page", 1))
        return httpx.Response(200, json=[page], headers={"ETag": '"v"', "Expires": expires, "X-Pages": "3"})

    esi = EsiClient(transport=httpx.MockTransport(handler))
    assert esi.get_all_pages("/characters/1/assets") == [1, 2, 3]
    for k in [k for k in cache._cache if "esi:resp:" in k]:
        key = k.split(":", 2)[-1]
        entry = cache.get(key)
        entry["fresh_until"] = 0
        cache.set(key, entry)
    assert esi.get_all_pages("/characters/1/assets") == [1, 2, 3]  # revalidated with 304s
    assert esi.get_all_pages("/characters/1/assets") == [1, 2, 3]  # and again from the cache


def test_failed_token_refresh_is_an_esi_error(db, user, monkeypatch):
    from conduit.esi import client

    def refuse(character):
        raise httpx.ConnectError("login server unreachable")

    monkeypatch.setattr(client, "get_access_token", refuse)
    esi = EsiClient(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})))
    with pytest.raises(EsiError) as exc:
        esi.get("/characters/90000001/wallet", character=user.main_character)
    assert exc.value.status == 0


def test_calendar_details_give_up_and_newest_come_first(db, corp):
    from conduit.sheet.calendar.models import CalendarEvent
    from conduit.sheet.calendar.sync import MAX_FETCH_FAILURES, sync

    char = make_user(corporation=corp).main_character
    now = timezone.now()
    for i in range(40):
        CalendarEvent.objects.create(character=char, event_id=i + 1, date=now - timedelta(days=400 - i), title="old")
    asked = []

    class Fake:
        def get(self, path, character=None, params=None):
            if path.endswith("/calendar"):
                soon = (now + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
                return EsiResponse([{"event_id": 999, "event_date": soon, "title": "new op"}], 200, {})
            event_id = int(path.rsplit("/", 1)[1])
            asked.append(event_id)
            if event_id == 999:
                return EsiResponse({"duration": 60, "owner_name": "x" * 300, "owner_type": "corporation", "text": "form up"}, 200, {})
            raise EsiError(404 if event_id <= 20 else 403, "no")

    sync(char, Fake())
    new = CalendarEvent.objects.get(event_id=999)
    assert asked[0] == 999 and new.detail_fetched and len(new.owner_name) == 200
    for _ in range(12):
        sync(char, Fake())
    # 404 is final after one call; other refusals stop after a few. Then nothing is asked any more.
    assert asked.count(5) == 1 and asked.count(30) == MAX_FETCH_FAILURES
    before = len(asked)
    sync(char, Fake())
    assert len(asked) == before


def test_calendar_stops_asking_when_esi_is_down(db, corp):
    from conduit.sheet.calendar.models import CalendarEvent
    from conduit.sheet.calendar.sync import sync

    char = make_user(corporation=corp).main_character
    for i in range(10):
        CalendarEvent.objects.create(character=char, event_id=i + 1, date=timezone.now(), title="e")
    asked = []

    class Fake:
        def get(self, path, character=None, params=None):
            if path.endswith("/calendar"):
                return EsiResponse([], 200, {})
            asked.append(path)
            raise EsiError(502, "bad gateway")

    sync(char, Fake())
    assert len(asked) == 1


def test_corporation_sync_stops_after_a_few_refusals_and_remembers_them(db, corp, monkeypatch):
    from conduit.corp import tasks
    from conduit.corp.models import CorpSyncStatus

    for i in range(25):
        make_user(90000100 + i, f"P{i:02}", corporation=corp, scopes="esi-contracts.read_corporation_contracts.v1")
    asked = []

    class Fake:
        def get_all_pages(self, path, character=None, params=None):
            asked.append(character.pk)
            raise EsiError(403, "refused")

    monkeypatch.setattr(tasks, "esi", lambda: Fake())
    assert tasks.sync_section.apply(args=[corp.pk, "contracts"]).get() == "error"
    assert len(asked) == tasks.MAX_REFUSALS
    tasks.sync_section.apply(args=[corp.pk, "contracts"]).get()
    assert len(asked) == 2 * tasks.MAX_REFUSALS and len(set(asked)) == len(asked)  # never the same member twice
    assert CorpSyncStatus.objects.get(section="contracts").result == "error"


def test_npc_corporations_have_no_sync_candidates(db):
    from conduit.corp import registry, tasks
    from conduit.eve.models import EveCorporation

    npc = EveCorporation.objects.create(id=1000169, name="Center for Advanced Studies", ticker="CAS")
    make_user(90000200, "Alt", corporation=npc, scopes="esi-contracts.read_corporation_contracts.v1")
    assert tasks.candidates(npc.pk, registry.SECTIONS["contracts"]) == []


def test_transferred_structure_moves_to_its_new_owner(db, corp):
    from conduit.corp.models import Structure
    from conduit.corp.sections.structures import sync
    from conduit.eve.models import EveCorporation

    previous = EveCorporation.objects.create(id=98000002, name="Old Owner", ticker="OLD")
    Structure.objects.create(corporation=previous, structure_id=1035000000001, name="Fort", type_id=35832, system_id=30000142, state="shield_vulnerable")

    class Fake:
        def get_all_pages(self, path, character=None, params=None):
            return [{"structure_id": 1035000000001, "name": "Fort", "type_id": 35832, "system_id": 30000142, "state": "shield_vulnerable"}]

    sync(corp, None, Fake())
    assert Structure.objects.get(structure_id=1035000000001).corporation_id == corp.pk


def test_blueprints_in_unknown_containers_are_not_looked_up_as_structures(db, corp, monkeypatch):
    from conduit.sheet.blueprints import sync as module

    char = make_user(corporation=corp).main_character
    looked_up = []
    monkeypatch.setattr(module, "resolve", lambda ids, **kw: looked_up.extend(ids))
    row = {"type_id": 691, "quantity": -1, "runs": -1, "material_efficiency": 10, "time_efficiency": 20}

    class Fake:
        def get_all_pages(self, path, character=None, params=None):
            return [
                {**row, "item_id": 1, "location_id": 60003760, "location_flag": "Hangar"},
                {**row, "item_id": 2, "location_id": 1035000000001, "location_flag": "Hangar"},  # a structure
                {**row, "item_id": 3, "location_id": 1040000000009, "location_flag": "Unlocked"},  # a container
            ]

    module.sync(char, Fake())
    assert sorted(looked_up) == [60003760, 1035000000001]


def test_overview_cuts_overlong_text(db, monkeypatch):
    from conduit.sheet.overview import sync as module
    from conduit.sheet.overview.models import CharacterInfo
    from tests.fake_esi import CID, ROUTES, FakeEsi, load_sde_fixture

    load_sde_fixture()
    char = make_user(CID, "Pilot One", scopes="esi-location.read_ship_type.v1").main_character
    monkeypatch.setattr(module, "ensure_names", lambda **kw: None)
    monkeypatch.setattr(module, "resolve", lambda *a, **kw: {})
    fake = FakeEsi(routes={
        rf"/characters/{CID}": {**ROUTES[rf"/characters/{CID}"], "title": "T" * 500, "gender": "g" * 50},
        rf"/characters/{CID}/ship": {"ship_item_id": 1, "ship_name": "u'" + "\\u0428" * 30 + "'", "ship_type_id": 587},
    })
    module.sync(char, fake)
    info = CharacterInfo.objects.get(character=char)
    assert (len(info.title), len(info.ship_name), len(info.gender)) == (200, 100, 10)


def test_killmail_value_counts_blueprint_copies_as_nothing(db):
    from conduit.eve.models import MarketPrice
    from conduit.sheet.killmails.sync import _value

    MarketPrice.objects.create(type_id=587, average_price=1_000_000)
    MarketPrice.objects.create(type_id=691, average_price=5_000_000_000)
    data = {"victim": {"ship_type_id": 587, "items": [
        {"item_type_id": 691, "singleton": 2, "quantity_dropped": 1},  # a copy
        {"item_type_id": 691, "singleton": 0, "quantity_destroyed": 1},  # an original
    ]}}
    assert _value(data) == 1_000_000 + 5_000_000_000


def test_killmail_summary_and_list_do_not_load_the_stored_json(db, corp, api_client, admin_user, django_assert_num_queries):
    from conduit.corp.models import CorporationKillmail
    from conduit.sheet.killmails.models import CharacterKillmail, Killmail
    from conduit.sheet.killmails.totals import killmail_totals

    char = admin_user.main_character
    for i, (loss, value) in enumerate([(True, 10.0), (False, 5.0), (False, 7.0)]):
        km = Killmail.objects.create(id=i + 1, hash="h", time=timezone.now(), solar_system_id=30000142, victim_ship_type_id=587,
                                     damage_taken=1, attacker_count=1, value=value, data={"big": "x" * 1000})
        CharacterKillmail.objects.create(character=char, killmail=km, is_loss=loss)
        CorporationKillmail.objects.create(corporation=corp, killmail=km, is_loss=loss)
    expected = {"kills": 2, "losses": 1, "isk_destroyed": 12.0, "isk_lost": 10.0}
    with django_assert_num_queries(1) as captured:
        assert killmail_totals(CharacterKillmail.objects.filter(character=char)) == expected
    assert '"data"' not in captured.captured_queries[0]["sql"]
    assert killmail_totals(CorporationKillmail.objects.filter(corporation=corp)) == expected
    assert killmail_totals(CharacterKillmail.objects.none()) == {"kills": 0, "losses": 0, "isk_destroyed": 0, "isk_lost": 0}
    api_client.force_login(admin_user)
    assert api_client.get(f"/api/characters/{char.pk}/killmails/summary").json() == expected
    assert len(api_client.get(f"/api/characters/{char.pk}/killmails").json()["items"]) == 3
    assert api_client.get(f"/api/corporations/{corp.pk}/killmails/summary").json() == expected
    assert len(api_client.get(f"/api/corporations/{corp.pk}/killmails").json()["items"]) == 3
