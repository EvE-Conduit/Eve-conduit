"""Buyback: reading pastes, pricing, quotes, matching contracts to quotes, and who may see and run what."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.notify.models import Notification
from conduit.plugins.services import set_enabled, sync_installed
from conduit.sde.models import ItemCategory, ItemGroup, ItemType, MarketGroup, SolarSystem, TypeMaterial
from conduit_buyback import contracts, prices, pricing, services
from conduit_buyback.models import BuybackSettings, Contract, GroupRule, ItemPrice, ItemRule, Location, MarketRead, Program, Quote, WatchRule
from tests.conftest import make_user

TRITANIUM, PYERITE, VELDSPAR, COMPRESSED_VELDSPAR, RIFTER, GUN, OFFICER, BLUE_LOOT = 34, 35, 1230, 62516, 587, 484, 9999, 30745
MINERALS, ORE, FRIGATE, HYBRID, OFFICER_GROUP = 18, 462, 25, 74, 1000
CORP_ID = 98000001
STRUCTURE = 1035466617946


@pytest.fixture
def sde(db):
    for cid, name in ((4, "Material"), (25, "Asteroid"), (6, "Ship"), (7, "Module"), (17, "Commodity")):
        ItemCategory.objects.create(id=cid, name=name, published=True)
    for gid, cid, name in ((MINERALS, 4, "Mineral"), (ORE, 25, "Veldspar"), (FRIGATE, 6, "Frigate"), (HYBRID, 7, "Hybrid Weapon"),
                           (OFFICER_GROUP, 7, "Officer Modules"), (pricing.BLUE_LOOT_GROUP, 17, "Sleeper Components")):
        ItemGroup.objects.create(id=gid, category_id=cid, name=name, published=True)
    MarketGroup.objects.create(id=1857, name="Minerals", has_types=True)
    MarketGroup.objects.create(id=1, name="Materials", has_types=False)
    MarketGroup.objects.filter(pk=1857).update(parent_id=1)
    ItemType.objects.create(id=TRITANIUM, group_id=MINERALS, name="Tritanium", published=True, volume=0.01, market_group_id=1857)
    ItemType.objects.create(id=PYERITE, group_id=MINERALS, name="Pyerite", published=True, volume=0.01, market_group_id=1857)
    ItemType.objects.create(id=VELDSPAR, group_id=ORE, name="Veldspar", published=True, volume=0.1, portion_size=100, compressed_type_id=COMPRESSED_VELDSPAR)
    ItemType.objects.create(id=COMPRESSED_VELDSPAR, group_id=ORE, name="Compressed Veldspar", published=True, volume=0.001, portion_size=100)
    ItemType.objects.create(id=RIFTER, group_id=FRIGATE, name="Rifter", published=True, volume=27289, packaged_volume=2500)
    ItemType.objects.create(id=GUN, group_id=HYBRID, name="75mm Railgun I", published=True, volume=5, meta_group_id=1, portion_size=1)
    ItemType.objects.create(id=OFFICER, group_id=OFFICER_GROUP, name="Estamel's Shield", published=True, volume=5)
    ItemType.objects.create(id=BLUE_LOOT, group_id=pricing.BLUE_LOOT_GROUP, name="Neural Network Analyzer", published=True, volume=0.1, base_price=200000)
    for tid in (VELDSPAR, COMPRESSED_VELDSPAR):
        TypeMaterial.objects.create(type_id=tid, material_type_id=TRITANIUM, quantity=400)
    TypeMaterial.objects.create(type_id=GUN, material_type_id=PYERITE, quantity=1000)
    SolarSystem.objects.create(id=30000142, constellation_id=1, region_id=1, name="Jita", security_status=0.95)
    now = timezone.now()
    # ESI is the default source; the market was read just now (tests that need another source pick it).
    BuybackSettings.load()
    MarketRead.objects.create(hub_id=60003760, pulled_at=now)
    for tid, buy, sell in ((TRITANIUM, 4, 5), (PYERITE, 10, 12), (VELDSPAR, 15, 17), (COMPRESSED_VELDSPAR, 16, 18), (RIFTER, 400_000, 500_000),
                           (GUN, 20_000, 30_000), (OFFICER, 900_000_000, 1_000_000_000), (BLUE_LOOT, 150_000, 160_000)):
        ItemPrice.objects.create(type_id=tid, buy=buy, sell=sell, updated_at=now)


@pytest.fixture
def seller(sde, corp):
    sync_installed()
    set_enabled("buyback", True)
    return make_user(90000001, "Seller One", corporation=corp)


@pytest.fixture
def boss(seller, corp):
    user = make_user(90000050, "Buyback Boss", corporation=corp,
                     scopes="esi-contracts.read_character_contracts.v1 esi-contracts.read_corporation_contracts.v1")
    return grant(user, "manage_programs")


def grant(user, *codenames):
    user.user_permissions.add(*Permission.objects.filter(content_type__app_label="buyback", codename__in=codenames))
    return type(user).objects.get(pk=user.pk)  # fresh permission cache


@pytest.fixture
def program(boss):
    loc = Location.objects.create(name="Jita 4-4", solar_system_id=30000142, structure_id=STRUCTURE)
    p = Program.objects.create(name="Ore buyback", owner=boss.main_character, is_corporation=True, tax=Decimal("10"))
    p.locations.add(loc)
    p.managers.add(boss)
    return p


def appraise(program, text):
    program.refresh_from_db()
    return pricing.appraise(program, pricing.parse(text))


def line(result, type_id):
    return next(ln for ln in result.lines if ln["type_id"] == type_id)


# --- reading pastes ------------------------------------------------------------------------------------------------


def test_parse_formats():
    rows = pricing.parse(
        "Tritanium\t1,000\tMineral\tMaterial\t\t10 m3\n"  # inventory list view
        "Rifter\t\tFrigate\tShip\t\t27,289 m3\n"  # assembled: no quantity
        "Pyerite x 2 500\n"
        "3 x 75mm Railgun I\n"
        "12 Veldspar\n"
        "Compressed Veldspar 1.234.567\n"
        "Neural Network Analyzer*\n"
        "\n"
    )
    assert [(r.name, r.quantity, r.assembled) for r in rows] == [
        ("Tritanium", 1000, False), ("Rifter", 1, True), ("Pyerite", 2500, False), ("75mm Railgun I", 3, False), ("Veldspar", 12, False),
        ("Compressed Veldspar", 1234567, False), ("Neural Network Analyzer", 1, False),
    ]


def test_unknown_and_duplicate_lines(program):
    r = appraise(program, "Tritanium 100\ntritanium 50\nNo Such Thing 4")
    assert line(r, TRITANIUM)["quantity"] == 150
    assert r.unknown == ["No Such Thing"]


# --- pricing ---------------------------------------------------------------------------------------------------------


def test_tax_and_price_type(program):
    r = appraise(program, "Tritanium 1000")
    tri = line(r, TRITANIUM)
    assert (tri["method"], tri["market_unit"], tri["unit_price"], tri["value"]) == ("market", 4.0, 3.6, 3600.0)
    program.price_type = "split"
    program.save()
    assert line(appraise(program, "Tritanium 1000"), TRITANIUM)["market_unit"] == 4.5
    assert r.value == Decimal(3600) and r.volume == 10.0


def test_ore_takes_the_best_of_raw_compressed_and_refined(program):
    # 100 Veldspar refine into 400 Tritanium: at 80 % and 4 ISK that's 12.80 ISK a unit; raw buys at 15, compressed at 16.
    vel = line(appraise(program, "Veldspar 1000"), VELDSPAR)
    assert vel["options"] == {"raw": 15.0, "compressed": 16.0, "refined": 12.8}
    assert (vel["method"], vel["market_unit"], vel["unit_price"]) == ("compressed", 16.0, 14.4)
    # Compressed ore is valued as itself or refined, never as raw.
    comp = line(appraise(program, "Compressed Veldspar 1000"), COMPRESSED_VELDSPAR)
    assert comp["options"] == {"compressed": 16.0, "refined": 12.8}
    program.use_compressed = False
    program.refining_rate = Decimal("100")
    program.save()
    vel = line(appraise(program, "Veldspar 1000"), VELDSPAR)
    assert (vel["method"], vel["market_unit"]) == ("refined", 16.0)
    program.use_raw = program.use_refined = False
    program.save()
    assert line(appraise(program, "Veldspar 1000"), VELDSPAR)["method"] == "market"  # nothing ticked: its own price


def test_density_tax_and_hauling(program):
    program.price_density_threshold = Decimal("1000")  # ISK per m³
    program.price_density_tax = Decimal("5")
    program.save()
    r = appraise(program, "Tritanium 1000\nEstamel's Shield 1")
    tri, officer = line(r, TRITANIUM), line(r, OFFICER)
    assert (tri["density_tax"], tri["tax"], tri["unit_price"]) == (True, 15.0, 3.4)  # 400 ISK/m³
    assert (officer["density_tax"], officer["tax"]) == (False, 10.0)

    program.price_density_threshold = Decimal("0")
    program.hauling_fuel_cost = Decimal("100")
    program.save()
    tri = line(appraise(program, "Tritanium 1000"), TRITANIUM)
    assert (tri["hauling_unit"], tri["unit_price"]) == (1.0, 2.6)  # 0.01 m³ at 100 ISK
    vel = line(appraise(program, "Veldspar 100"), VELDSPAR)
    assert vel["hauling_unit"] == 10.0
    program.compressed_volume = True  # hauled compressed: 0.001 m³
    program.save()
    assert line(appraise(program, "Veldspar 100"), VELDSPAR)["hauling_unit"] == 0.1


def test_item_rules(program):
    ItemRule.objects.create(program=program, type_id=TRITANIUM, tax=Decimal("5"))
    ItemRule.objects.create(program=program, type_id=PYERITE, disallowed=True)
    ItemRule.objects.create(program=program, type_id=GUN, static_price=Decimal("12345"))
    r = appraise(program, "Tritanium 1000\nPyerite 10\n75mm Railgun I 2")
    assert line(r, TRITANIUM)["tax"] == 15.0
    assert (line(r, PYERITE)["accepted"], line(r, PYERITE)["reason"]) == (False, "Not bought by this program")
    gun = line(r, GUN)
    assert (gun["method"], gun["unit_price"], gun["value"], gun["tax"]) == ("fixed", 12345.0, 24690.0, 0.0)
    # Only listed items when not everything is bought.
    program.allow_all_items = False
    program.save()
    r = appraise(program, "Tritanium 1\nEstamel's Shield 1")
    assert line(r, TRITANIUM)["accepted"] and line(r, OFFICER)["reason"] == "Not on this program's list"


def test_market_group_rules(program):
    # Materials > Minerals > Tritanium, Pyerite. A rule on a group covers everything under it; closer rules win.
    GroupRule.objects.create(program=program, market_group_id=1, tax=Decimal("5"))
    r = appraise(program, "Tritanium 1000\nPyerite 10\nRifter 1")
    assert (line(r, TRITANIUM)["tax"], line(r, PYERITE)["tax"], line(r, RIFTER)["tax"]) == (15.0, 15.0, 10.0)
    GroupRule.objects.create(program=program, market_group_id=1857, disallowed=True)
    ItemRule.objects.create(program=program, type_id=TRITANIUM, tax=Decimal("-2"))
    r = appraise(program, "Tritanium 1000\nPyerite 10")
    assert line(r, TRITANIUM)["tax"] == 8.0
    assert (line(r, PYERITE)["accepted"], line(r, PYERITE)["reason"]) == (False, "Not bought by this program")
    # Only listed items: a group rule lists everything under it.
    GroupRule.objects.filter(market_group_id=1857).delete()
    program.allow_all_items = False
    program.save()
    r = appraise(program, "Pyerite 10\nRifter 1")
    assert line(r, PYERITE)["accepted"] and line(r, RIFTER)["reason"] == "Not on this program's list"
    # Manual review for a whole market group.
    WatchRule.objects.create(program=program, market_group_id=1)
    r = appraise(program, "Pyerite 10")
    assert line(r, PYERITE)["watch"] and r.flagged


def test_market_browser(program, boss, api_client):
    api_client.force_login(boss)
    url = f"/api/p/buyback/manage/programs/{program.pk}"
    top = api_client.get(f"{url}/market").json()
    assert [(g["name"], g["count"]) for g in top["groups"]] == [("Materials", 2)] and top["types"] == []
    minerals = api_client.get(f"{url}/market?group=1857").json()
    assert [p["name"] for p in minerals["path"]] == ["Materials", "Minerals"]
    assert [t["name"] for t in minerals["types"]] == ["Pyerite", "Tritanium"]
    # The whole category, then one item in it on its own terms.
    resp = api_client.call("post", f"{url}/rules", {"market_group_id": 1857, "rule": {"tax": 3}, "watch": True})
    assert resp.status_code == 200, resp.content
    assert [(g["name"], g["tax"], g["count"]) for g in resp.json()["group_rules"]] == [("Minerals", 3.0, 2)]
    assert [w["kind"] for w in resp.json()["watch_rules"]] == ["market"]
    api_client.call("post", f"{url}/rules", {"type_id": TRITANIUM, "rule": {"disallowed": True}})
    types = {t["name"]: t for t in api_client.get(f"{url}/market?group=1857").json()["types"]}
    assert types["Pyerite"]["effective"] == {"tax": 3.0, "disallowed": False, "static_price": None, "from": {"kind": "group", "id": 1857, "name": "Minerals"}}
    assert types["Pyerite"]["rule"] is None and types["Pyerite"]["watched"]
    assert types["Tritanium"]["effective"]["disallowed"] and types["Tritanium"]["effective"]["from"]["kind"] == "type"
    # Groups take no fixed price.
    assert api_client.call("post", f"{url}/rules", {"market_group_id": 1, "rule": {"static_price": 5}}).status_code == 400
    found = api_client.get(f"{url}/market/search?q=trit").json()
    assert [(t["name"], [p["name"] for p in t["path"]]) for t in found["types"]] == [("Tritanium", ["Materials", "Minerals"])]
    assert [g["name"] for g in api_client.get(f"{url}/market/search?q=miner").json()["groups"]] == ["Minerals"]
    # Clearing: back to the group's terms.
    out = api_client.call("post", f"{url}/rules", {"type_id": TRITANIUM, "rule": None}).json()
    assert out["item_rules"] == []
    assert line(appraise(program, "Tritanium 10"), TRITANIUM)["tax"] == 13.0
    # Sellers see category terms on the program.
    assert [g["name"] for g in api_client.get(f"/api/p/buyback/programs/{program.pk}").json()["group_rules"]] == ["Minerals"]


def test_assembled_npc_loot_and_t1_modules(program):
    r = appraise(program, "Rifter\t\tFrigate\tShip\t\t27,289 m3\nNeural Network Analyzer 2\n75mm Railgun I 1")
    assert line(r, RIFTER)["reason"] == "Assembled: repackage it first"
    assert line(r, BLUE_LOOT)["method"] == "market"
    assert line(r, GUN)["method"] == "market"
    program.allow_unpacked = program.blue_loot_npc = program.t1_refined = True
    program.save()
    r = appraise(program, "Rifter\t\tFrigate\tShip\t\t27,289 m3\nNeural Network Analyzer 2\n75mm Railgun I 1")
    assert line(r, RIFTER)["accepted"]
    loot = line(r, BLUE_LOOT)
    assert (loot["method"], loot["market_unit"], loot["unit_price"]) == ("npc", 200000.0, 180000.0)
    gun = line(r, GUN)  # 1000 Pyerite at 10 ISK, 55 %
    assert (gun["method"], gun["market_unit"]) == ("t1_refined", 5500.0)


def test_watchlist_flags_quotes(program, seller):
    WatchRule.objects.create(program=program, group_id=OFFICER_GROUP)
    r = appraise(program, "Estamel's Shield 1\nTritanium 5")
    assert line(r, OFFICER)["watch"] and not line(r, TRITANIUM)["watch"] and r.flagged
    out = services.quote(program, "Estamel's Shield 1", user=seller)
    assert Quote.objects.get(tracking_number=out["quote"]["tracking_number"]).flagged


def test_quote_makes_a_tracking_number(program, seller):
    out = services.quote(program, "Tritanium 1000\nNothing Real 3", user=seller)
    number = out["quote"]["tracking_number"]
    assert number.startswith("bb-") and len(number) == 13 and number == number.lower()
    assert out["value"] == 3600 and out["unknown"] == ["Nothing Real"]
    assert out["quote"]["terms"]["assignee"] == {"id": CORP_ID, "name": "Test Corp", "kind": "corporation"}
    # Nothing bought: no quote.
    assert services.quote(program, "Nothing Real 3", user=seller)["quote"] is None
    # All or nothing.
    BuybackSettings.objects.update_or_create(pk=1, defaults={"reject_disallowed": True})
    out = services.quote(program, "Tritanium 1000\nNothing Real 3", user=seller)
    assert out["quote"] is None and out["blocked"]
    program.tracking_prefix = "ORE-"
    program.save()
    BuybackSettings.objects.filter(pk=1).update(reject_disallowed=False)
    assert services.quote(program, "Tritanium 1", user=seller)["quote"]["tracking_number"].startswith("ore-")


def test_stale_prices_are_fetched_and_kept_when_the_source_is_down(program, monkeypatch):
    BuybackSettings.objects.filter(pk=1).update(price_source="fuzzwork")
    ItemPrice.objects.filter(type_id=TRITANIUM).update(updated_at=timezone.now() - timedelta(days=3))
    asked = []

    def fake_fetch(ids, settings=None, client=None, hub=None):
        asked.append(sorted(ids))
        raise prices.PriceError("down")

    monkeypatch.setattr(prices, "fetch", fake_fetch)
    tri = line(appraise(program, "Tritanium 10"), TRITANIUM)
    assert asked == [[TRITANIUM]] and tri["market_unit"] == 4.0  # stale beats nothing


def test_esi_is_the_default(db):
    assert BuybackSettings.load().price_source == "esi"


def test_fuzzwork_prices(sde):
    import httpx

    def handler(request):
        assert request.url.params["station"] == "60003760" and request.url.params["types"] in ("34,35", "34")
        return httpx.Response(200, json={
            "34": {"buy": {"percentile": "4.10", "max": "4.20"}, "sell": {"percentile": "4.90", "min": "4.80"}},
        })

    client = httpx.Client(transport=httpx.MockTransport(handler))
    BuybackSettings.objects.filter(pk=1).update(price_source="fuzzwork")
    assert prices.fetch([34, 35], client=client) == 2
    assert (ItemPrice.objects.get(type_id=34).buy, ItemPrice.objects.get(type_id=34).sell) == (Decimal("4.10"), Decimal("4.90"))
    assert ItemPrice.objects.get(type_id=35).buy == 0  # unknown to the source: kept at 0 until stale
    BuybackSettings.objects.update_or_create(pk=1, defaults={"instant_prices": True})
    prices.fetch([34], client=client)
    assert ItemPrice.objects.get(type_id=34).buy == Decimal("4.20")


def test_janice_prices(sde):
    import httpx

    def handler(request):
        assert request.headers["X-ApiKey"] == "key" and request.content == b"34"
        return httpx.Response(200, json=[{"itemType": {"eid": 34}, "top5AveragePrices": {"buyPrice": 4.5, "sellPrice": 5.5},
                                          "immediatePrices": {"buyPrice": 4.6, "sellPrice": 5.4}}])

    BuybackSettings.objects.update_or_create(pk=1, defaults={"price_source": "janice"})
    with pytest.raises(prices.PriceError):
        prices.fetch([34])
    BuybackSettings.objects.filter(pk=1).update(janice_api_key="key")
    prices.fetch([34], client=httpx.Client(transport=httpx.MockTransport(handler)))
    assert ItemPrice.objects.get(type_id=34).sell == Decimal("5.50")


# --- contracts -------------------------------------------------------------------------------------------------------


class FakeEsi:
    def __init__(self, routes):
        self.routes = routes

    def get_all_pages(self, path, character=None, params=None):
        if path.endswith("/contracts"):
            return self.routes.get(path, [])
        if path not in self.routes:
            from conduit.esi.exceptions import EsiError

            raise EsiError(404, "Contract not found")
        return self.routes[path]


def row(contract_id, title, price, assignee=CORP_ID, status="outstanding", location=STRUCTURE, issuer=90000001, kind="item_exchange"):
    return {"contract_id": contract_id, "type": kind, "title": title, "price": price, "assignee_id": assignee, "issuer_id": issuer,
            "issuer_corporation_id": CORP_ID, "status": status, "availability": "personal", "for_corporation": False,
            "start_location_id": location, "date_issued": "2026-10-09T10:00:00Z", "date_expired": "2026-10-23T10:00:00Z", "volume": 10}


def items(*pairs, included=True):
    return [{"record_id": i, "type_id": t, "quantity": q, "is_included": included, "is_singleton": False} for i, (t, q) in enumerate(pairs)]


@pytest.fixture
def offline(monkeypatch):
    monkeypatch.setattr("conduit.eve.tasks.ensure_eve_names", lambda ids: None)
    monkeypatch.setattr("conduit.sheet.locations.resolve", lambda *a, **k: {})


def test_new_contracts_reach_discord_webhooks(program, seller, boss, offline, django_capture_on_commit_callbacks):
    from conduit.events import bus
    from conduit.events.webhooks import render

    tracking = services.quote(program, "Tritanium 1000", user=seller)["quote"]["tracking_number"]
    owner = boss.main_character.pk
    esi = FakeEsi({f"/corporations/{CORP_ID}/contracts": [row(1, tracking, 3600)],
                   f"/corporations/{CORP_ID}/contracts/1/items": items((TRITANIUM, 1000))})
    seen = []
    bus.on("buyback.contract_created", "buyback.contract_finished")(seen.append)
    try:
        with django_capture_on_commit_callbacks(execute=True):
            contracts.sync_owner(owner, client=esi)
        esi.routes[f"/corporations/{CORP_ID}/contracts"][0] = row(1, tracking, 3600, status="rejected")
        with django_capture_on_commit_callbacks(execute=True):
            contracts.sync_owner(owner, client=esi)
    finally:
        bus.off("buyback.contract_created", seen.append)
        bus.off("buyback.contract_finished", seen.append)

    created, finished = (render("discord", e.as_dict())["embeds"][0] for e in seen)
    assert created["title"] == f"Buyback contract from Someone ({program.name})"
    assert created["description"] == f"{tracking}: 3,600 ISK." and created["url"].endswith("/p/buyback/contracts/1")
    assert finished["title"] == f"Buyback contract rejected ({program.name})" and finished["color"] == 0xFBBF24


def test_contracts_are_matched_and_checked(program, seller, boss, offline):
    good = services.quote(program, "Tritanium 1000", user=seller)["quote"]["tracking_number"]
    bad = services.quote(program, "Tritanium 1000\nPyerite 100", user=seller)["quote"]["tracking_number"]
    owner = boss.main_character.pk
    esi = FakeEsi({
        f"/characters/{owner}/contracts": [
            # Made out to the boss instead of the corporation, asking too much, short on items, somewhere else.
            row(4, f"sell {bad}", 9_999_999, assignee=owner, location=60003760),
            row(5, "not for the buyback", 100, assignee=owner),
        ],
        f"/corporations/{CORP_ID}/contracts": [
            row(1, good, 3600),
            row(2, "bb-zzzzzzzzzz", 1),  # looks like one, but there's no such quote
            row(3, good, 3600, kind="courier"),
        ],
        f"/corporations/{CORP_ID}/contracts/1/items": items((TRITANIUM, 1000)),
        f"/corporations/{CORP_ID}/contracts/2/items": items((TRITANIUM, 1)),
        f"/characters/{owner}/contracts/4/items": items((TRITANIUM, 10), (RIFTER, 1)) + items((PYERITE, 5), included=False),
    })
    assert contracts.sync_owner(owner, client=esi) == {"seen": 3, "new": 3}
    ok, fake, wrong = (Contract.objects.get(contract_id=i) for i in (1, 2, 4))
    assert ok.problems == [] and ok.quote.tracking_number == good and ok.program == program and ok.items == [[TRITANIUM, 1000, True]]
    assert [p["code"] for p in fake.problems] == ["no_quote"] and fake.program == program
    assert [p["code"] for p in wrong.problems] == ["wrong_assignee", "price_high", "asks_items", "items_missing", "wrong_location",
                                                   "items_extra", "title"]
    assert not Contract.objects.filter(contract_id__in=[3, 5]).exists()
    # Managers hear about new contracts, louder when something's wrong.
    notes = list(Notification.objects.filter(user=boss))
    assert len(notes) == 3 and all(n.category == "p.buyback" for n in notes)
    assert sorted(n.level for n in notes) == ["info", "warning", "warning"]

    # Accepted: the seller hears about it; the next run doesn't fetch items again.
    esi.routes[f"/corporations/{CORP_ID}/contracts"][0] = {**row(1, good, 3600, status="finished"), "date_completed": "2026-10-10T08:00:00Z"}
    del esi.routes[f"/corporations/{CORP_ID}/contracts/1/items"]
    assert contracts.sync_owner(owner, client=esi)["new"] == 0
    ok.refresh_from_db()
    assert ok.status == "finished" and ok.items == [[TRITANIUM, 1000, True]]
    assert Notification.objects.filter(user=seller, level="success").count() == 1

    stats = services.statistics(program)
    assert (stats["month_count"], stats["month_value"], stats["open"], stats["problems"]) == (1, 3600.0, 2, 2)
    assert stats["top_items"][0]["type_id"] == TRITANIUM
    assert services.my_contracts(seller)["totals"]["sold_value"] == 3600.0


def test_duplicate_contracts_for_one_quote(program, seller, boss, offline):
    number = services.quote(program, "Tritanium 1000", user=seller)["quote"]["tracking_number"]
    esi = FakeEsi({
        f"/corporations/{CORP_ID}/contracts": [row(1, number, 3600), row(2, number, 3600)],
        f"/corporations/{CORP_ID}/contracts/1/items": items((TRITANIUM, 1000)),
        f"/corporations/{CORP_ID}/contracts/2/items": items((TRITANIUM, 1000)),
    })
    contracts.sync_owner(boss.main_character.pk, client=esi)
    assert Contract.objects.get(contract_id=1).problems == []
    assert [p["code"] for p in Contract.objects.get(contract_id=2).problems] == ["duplicate"]


def test_unlinked_quotes_are_cleaned_up(program, seller, boss, offline):
    from conduit_buyback.tasks import cleanup

    old = services.quote(program, "Tritanium 1", user=seller)["quote"]["tracking_number"]
    used = services.quote(program, "Tritanium 1", user=seller)["quote"]["tracking_number"]
    Quote.objects.update(created_at=timezone.now() - timedelta(days=3))
    Contract.objects.create(contract_id=1, program=program, quote=Quote.objects.get(tracking_number=used), owner_id=CORP_ID, issuer_id=1,
                            assignee_id=CORP_ID, status="outstanding", date_issued=timezone.now())
    assert cleanup() == 1
    assert not Quote.objects.filter(tracking_number=old).exists() and Quote.objects.filter(tracking_number=used).exists()


# --- access and the API ------------------------------------------------------------------------------------------


def test_members_see_programs_meant_for_them(program, seller, api_client):
    api_client.force_login(seller)
    assert [p["id"] for p in api_client.get("/api/p/buyback/programs").json()["programs"]] == [program.pk]
    miners = Group.objects.create(name="Miners")
    program.groups.add(miners)
    assert api_client.get("/api/p/buyback/programs").json()["programs"] == []
    assert api_client.call("post", f"/api/p/buyback/programs/{program.pk}/quote", {"text": "Tritanium 1"}).status_code == 404
    seller.groups.add(miners)
    assert len(api_client.get("/api/p/buyback/programs").json()["programs"]) == 1


def test_quotes_are_private(program, seller, boss, api_client):
    api_client.force_login(seller)
    resp = api_client.call("post", f"/api/p/buyback/programs/{program.pk}/quote", {"text": "Tritanium 1000"})
    number = resp.json()["quote"]["tracking_number"]
    assert api_client.get(f"/api/p/buyback/quotes/{number.upper()}").json()["mine"] is True
    other = make_user(90000002, "Someone Else")
    api_client.force_login(other)
    assert api_client.get(f"/api/p/buyback/quotes/{number}").status_code == 404
    api_client.force_login(boss)
    assert api_client.get(f"/api/p/buyback/quotes/{number}").json()["can_manage"] is True
    BuybackSettings.objects.update_or_create(pk=1, defaults={"restrict_quotes": False})
    api_client.force_login(other)
    assert api_client.get(f"/api/p/buyback/quotes/{number}").status_code == 200


def test_running_programs(program, seller, boss, api_client):
    loc = program.locations.first()
    body = {"name": "Loot", "owner_id": boss.main_character.pk, "location_ids": [loc.pk], "tax": 15}
    api_client.force_login(seller)
    assert api_client.call("post", "/api/p/buyback/manage/programs", body).status_code == 403
    api_client.force_login(boss)
    # Contracts are read with the owner's login: only your own characters.
    assert api_client.call("post", "/api/p/buyback/manage/programs", {**body, "owner_id": seller.main_character.pk}).status_code == 400
    resp = api_client.call("post", "/api/p/buyback/manage/programs", body)
    assert resp.status_code == 200, resp.content
    loot = Program.objects.get(pk=resp.json()["id"])
    assert loot.tax == Decimal("15") and list(loot.managers.all()) == [boss]
    resp = api_client.call("post", f"/api/p/buyback/manage/programs/{loot.pk}/items", {"type_ids": [TRITANIUM, PYERITE], "tax": 2})
    assert resp.json()["added"] == 2
    assert api_client.call("post", f"/api/p/buyback/manage/programs/{loot.pk}/watchlist", {"type_id": OFFICER}).status_code == 200
    assert api_client.get(f"/api/p/buyback/manage/programs/{loot.pk}/stats").status_code == 200
    # Someone else's program: not theirs to run, unless they may run them all.
    other = Program.objects.create(name="Not yours", owner=seller.main_character)
    assert api_client.get(f"/api/p/buyback/manage/programs/{other.pk}").status_code == 404
    boss = grant(boss, "manage_all_programs")
    api_client.force_login(boss)
    assert api_client.get(f"/api/p/buyback/manage/programs/{other.pk}").status_code == 200
    assert api_client.call("delete", f"/api/p/buyback/manage/locations/{loc.pk}").status_code == 409  # still used


def test_settings_changes_drop_prices(program, boss, api_client):
    boss = grant(boss, "manage_all_programs")
    api_client.force_login(boss)
    s = api_client.get("/api/p/buyback/settings").json()
    assert s["janice_key_set"] is False and ItemPrice.objects.exists()
    assert api_client.call("put", "/api/p/buyback/settings", {**s, "price_source": "janice"}).status_code == 400  # no key
    resp = api_client.call("put", "/api/p/buyback/settings", {**s, "price_source": "janice", "janice_api_key": "secret"})
    assert resp.json()["janice_key_set"] is True and "secret" not in resp.content.decode()
    assert not ItemPrice.objects.exists()


def test_public_programs(program, seller, client):
    url = f"/api/public/p/buyback/programs/{program.pk}"
    assert client.get(url).status_code == 404
    program.public = True
    program.save()
    assert client.get("/api/public/p/buyback/programs").json()["programs"][0]["id"] == program.pk
    resp = client.post(f"{url}/quote", {"text": "Tritanium 1000"}, content_type="application/json")
    number = resp.json()["quote"]["tracking_number"]
    q = Quote.objects.get(tracking_number=number)
    assert q.user is None and q.public
    assert client.get(f"/api/public/p/buyback/quotes/{number}").json()["value"] == 3600
    # Signed in or not, public quotes belong to nobody (another site can't make quotes in a member's name).
    client.force_login(seller)
    number = client.post(f"{url}/quote", {"text": "Tritanium 1"}, content_type="application/json").json()["quote"]["tracking_number"]
    assert Quote.objects.get(tracking_number=number).user is None
    # Member quotes aren't public.
    private = services.quote(program, "Tritanium 1", user=seller)["quote"]["tracking_number"]
    assert client.get(f"/api/public/p/buyback/quotes/{private}").status_code == 404


def test_public_quotes_are_rate_limited(program, client, monkeypatch):
    from conduit_buyback import public_api

    monkeypatch.setattr(public_api, "QUOTE_LIMIT", 2)
    program.public = True
    program.save()
    url = f"/api/public/p/buyback/programs/{program.pk}/quote"
    codes = [client.post(url, {"text": "Tritanium 1"}, content_type="application/json").status_code for _ in range(3)]
    assert codes == [200, 200, 429]
