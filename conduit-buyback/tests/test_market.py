"""ESI as a price source, and the manipulation guard."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from conduit.esi.client import EsiResponse
from conduit.esi.exceptions import EsiError
from conduit.sde.models import Region, SolarSystem, Station
from conduit_buyback import market, prices, services
from conduit_buyback.models import BuybackSettings, ItemPrice, MarketRead, PriceHistory, Quote

from test_buyback import PYERITE, TRITANIUM, appraise, boss, grant, line, program, sde, seller  # noqa: F401  (fixtures)

JITA_44 = 60003760
FORGE = 10000002
JITA = 30000142


@pytest.fixture
def jita(sde):
    Region.objects.create(id=FORGE, name="The Forge")
    SolarSystem.objects.filter(pk=JITA).update(region_id=FORGE)
    Station.objects.create(id=JITA_44, solar_system_id=JITA, type_id=1531)


def order(type_id, price, volume, buy, location=JITA_44, system=JITA):
    return {"type_id": type_id, "price": price, "volume_remain": volume, "is_buy_order": buy, "location_id": location, "system_id": system}


class FakeEsi:
    def __init__(self, pages=None, history=None):
        self.pages = pages or {}
        self.history = history or {}
        self.calls = []

    def get(self, path, character=None, params=None, cache_response=True):
        self.calls.append((path, character, params))
        if path.endswith("/history"):
            tid = params["type_id"]
            if tid not in self.history:
                raise EsiError(404, "Type not found")
            return EsiResponse(self.history[tid], 200, {})
        page = (params or {}).get("page", 1)
        return EsiResponse(self.pages[page], 200, {"x-pages": str(len(self.pages))})


def days_ago(n):
    return (timezone.now().date() - timedelta(days=n)).isoformat()


def history(type_id, average, days, region=FORGE):
    return PriceHistory.objects.create(type_id=type_id, region_id=region, days=[[days_ago(i), average, 1000] for i in range(days, 0, -1)],
                                       updated_at=timezone.now())


def esi_settings(**kw):
    BuybackSettings.objects.update_or_create(pk=1, defaults={"price_source": "esi", **kw})
    return BuybackSettings.load()


# --- the order book -----------------------------------------------------------------------------------------------


def test_top_average():
    d = Decimal
    # 5 % of 1010 units is 50.5: all 10 at 10 ISK and 40.5 at 9.
    assert market.top_average([(d(9), 1000), (d(10), 10)], highest_first=True).quantize(d("0.01")) == d("9.20")
    assert market.top_average([(d(5), 10), (d(6), 1000)], highest_first=False).quantize(d("0.01")) == d("5.80")
    assert market.top_average([], True) == 0


def test_pull_reads_the_hub_and_zeroes_what_left(jita):
    s = esi_settings()
    ItemPrice.objects.create(type_id=999, buy=5, sell=6, updated_at=timezone.now() - timedelta(days=1))  # no longer sold
    esi = FakeEsi(pages={
        1: [order(TRITANIUM, 4.0, 1_000_000, True), order(TRITANIUM, 3.5, 10, True), order(TRITANIUM, 5.0, 1_000_000, False),
            order(TRITANIUM, 99.0, 5, True, location=1035466617946)],  # elsewhere in The Forge: left out
        2: [order(PYERITE, 12.0, 500, False)],
    })
    assert market.pull(s, client=esi) == 2
    assert [c[0] for c in esi.calls] == [f"/markets/{FORGE}/orders"] * 2
    tri = ItemPrice.objects.get(type_id=TRITANIUM)
    assert (tri.buy, tri.sell) == (Decimal("4.00"), Decimal("5.00"))
    assert ItemPrice.objects.get(type_id=PYERITE).buy == 0 and ItemPrice.objects.get(type_id=PYERITE).sell == Decimal("12.00")
    assert ItemPrice.objects.get(type_id=999).sell == 0
    read = MarketRead.objects.get(hub_id=JITA_44)
    assert read.pulled_at and read.note == "2 items from 2 pages"


def test_pulls_are_spaced_out(jita, monkeypatch):
    esi_settings()
    MarketRead.objects.all().delete()
    esi = FakeEsi(pages={1: [order(TRITANIUM, 4.0, 100, True)]})
    assert market.pull_once(client=esi) == 1
    assert market.pull_once(client=esi) is None and len(esi.calls) == 1  # ESI's copy hasn't changed yet
    MarketRead.objects.filter(hub_id=JITA_44).update(pulled_at=timezone.now() - timedelta(minutes=11))
    assert market.pull_once(client=esi) == 1


def test_structure_markets_need_a_character(jita, boss):
    s = esi_settings(hub_id=1035466617946)
    with pytest.raises(market.MarketError):
        market.pull(s, client=FakeEsi(pages={1: []}))
    s.esi_character = boss.main_character
    s.save()
    with pytest.raises(market.MarketError, match="log in again"):
        market.pull(s, client=FakeEsi(pages={1: []}))
    boss.main_character.token.scopes += f" {market.STRUCTURE_SCOPE}"
    boss.main_character.token.save()
    s = BuybackSettings.load()
    esi = FakeEsi(pages={1: [order(TRITANIUM, 4.0, 100, True, location=1035466617946)]})
    assert market.pull(s, client=esi) == 1
    assert esi.calls[0][:2] == ("/markets/structures/1035466617946", boss.main_character)


def test_esi_source_never_fetches_item_by_item(program, monkeypatch):
    from conduit_buyback import tasks

    queued = []
    monkeypatch.setattr(tasks.pull_market, "delay", lambda: queued.append(1))
    monkeypatch.setattr(prices, "fetch", lambda *a, **k: pytest.fail("no per-item fetch"))
    esi_settings()
    MarketRead.objects.all().delete()
    ItemPrice.objects.filter(type_id=TRITANIUM).update(updated_at=timezone.now() - timedelta(days=5))
    assert line(appraise(program, "Tritanium 10"), TRITANIUM)["market_unit"] == 4.0
    assert queued == [1]  # never read yet: start the first read
    MarketRead.objects.create(hub_id=JITA_44, pulled_at=timezone.now())
    appraise(program, "Tritanium 10")
    assert queued == [1]


# --- the guard ----------------------------------------------------------------------------------------------------------


def test_guard_rules(db):
    s = BuybackSettings.load()
    reliable, thin = PriceHistory(days=[[days_ago(i), 100, 50] for i in range(1, 8)]), PriceHistory(days=[[days_ago(1), 100, 5], [days_ago(3), 100, 5]])
    assert market.average(reliable, 7) == (Decimal("100.00"), 7)
    assert market.average(PriceHistory(days=[[days_ago(20), 100, 5]]), 7) == (None, 0)  # outside the window

    c = market.check(Decimal(150), reliable, s)
    assert (c.used, c.price, round(c.deviation)) == ("average", Decimal(100), 50)
    c = market.check(Decimal(150), thin, s)
    assert (c.used, c.price, c.reliable) == ("lower", Decimal(100), False)
    assert market.check(Decimal(115), reliable, s).used == "current"  # within 20 %
    assert market.check(Decimal(50), reliable, s).used == "current"  # below: only a loss for the seller
    s.guard_both_ways = True
    assert market.check(Decimal(50), reliable, s).used == "average"
    assert market.check(Decimal(150), None, s).used == "current"  # nothing to compare with


def test_guarded_quotes(jita, program, seller, monkeypatch):
    monkeypatch.setattr(market, "fetch_history", lambda *a, **k: 0)
    # Tritanium's buy orders say 4 ISK but it traded at 3 all week: someone's propping up the buy orders.
    history(TRITANIUM, 3.0, 7)
    tri = line(appraise(program, "Tritanium 1000"), TRITANIUM)
    assert tri["guard"]["used"] == "average" and tri["market_unit"] == 3.0 and tri["unit_price"] == 2.7 and not tri["watch"]

    # Rarely traded: the lower price, and checked by hand.
    PriceHistory.objects.filter(type_id=TRITANIUM).delete()
    history(TRITANIUM, 3.0, 2)
    out = services.quote(program, "Tritanium 1000", user=seller)
    tri = out["lines"][0]
    assert tri["guard"]["used"] == "lower" and tri["watch"] and out["flagged"]
    assert Quote.objects.get(tracking_number=out["quote"]["tracking_number"]).flagged

    # Switched off: market price as is.
    BuybackSettings.objects.update_or_create(pk=1, defaults={"guard_enabled": False})
    assert line(appraise(program, "Tritanium 1000"), TRITANIUM)["market_unit"] == 4.0


def test_guard_covers_refined_minerals(jita, program, monkeypatch):
    from test_buyback import VELDSPAR

    monkeypatch.setattr(market, "fetch_history", lambda *a, **k: 0)
    program.use_raw = program.use_compressed = False
    program.save()
    history(TRITANIUM, 2.0, 7)  # buy orders at 4, traded at 2
    vel = line(appraise(program, "Veldspar 1000"), VELDSPAR)
    assert vel["method"] == "refined" and vel["market_unit"] == 6.4  # 400 x 2 ISK x 80 % / 100
    assert vel["guard"] == {"used": "materials", "materials": 1}


def test_history_is_fetched_for_quotes(jita, program, monkeypatch):
    esi = FakeEsi(history={TRITANIUM: [{"date": days_ago(i), "average": 3.0, "volume": 10, "highest": 3, "lowest": 3, "order_count": 1} for i in range(1, 8)]})
    monkeypatch.setattr("conduit.esi.client.esi", lambda: esi)
    tri = line(appraise(program, "Tritanium 10\nPyerite 5"), TRITANIUM)
    assert tri["guard"]["used"] == "average"
    assert PriceHistory.objects.get(type_id=PYERITE).days == []  # 404: never traded
    calls = len(esi.calls)
    appraise(program, "Tritanium 10")
    assert len(esi.calls) == calls  # fresh for a day


def test_settings(program, boss, api_client):
    from test_buyback import grant

    boss = grant(boss, "manage_all_programs")
    api_client.force_login(boss)
    s = api_client.get("/api/p/buyback/settings").json()
    assert s["guard_enabled"] and s["guard_threshold"] == 20 and s["hub_kind"] == "station"
    body = {**s, "price_source": "esi", "hub_id": 1035466617946}
    assert api_client.call("put", "/api/p/buyback/settings", body).status_code == 400  # a structure needs a character
    resp = api_client.call("put", "/api/p/buyback/settings", {**body, "esi_character_id": 90000001})  # the seller's
    assert resp.status_code == 400
    resp = api_client.call("put", "/api/p/buyback/settings", {**body, "esi_character_id": boss.main_character.pk, "guard_threshold": 30})
    assert resp.status_code == 200, resp.content
    assert resp.json()["esi_character"]["id"] == boss.main_character.pk and BuybackSettings.load().guard_threshold == 30
    assert api_client.call("put", "/api/p/buyback/settings", {**resp.json(), "guard_min_days": 9}).status_code == 400


def test_picking_a_trade_hub(jita, program, boss, api_client, monkeypatch):
    from conduit_buyback import tasks
    from test_buyback import grant

    monkeypatch.setattr(tasks.pull_market, "delay", lambda: None)
    Region.objects.create(id=10000043, name="Domain")
    SolarSystem.objects.create(id=30002187, constellation_id=1, region_id=10000043, name="Amarr", security_status=1.0)
    Station.objects.create(id=60008494, solar_system_id=30002187, type_id=1932)
    boss = grant(boss, "manage_all_programs")
    api_client.force_login(boss)
    s = api_client.get("/api/p/buyback/settings").json()
    assert [h["name"] for h in s["hubs"]] == ["Jita 4-4", "Amarr VIII", "Dodixie IX-20", "Rens VI-8", "Hek VIII-12"]

    resp = api_client.call("put", "/api/p/buyback/settings", {**s, "hub_id": 60008494, "hub_name": "Amarr VIII"})
    assert resp.status_code == 200, resp.content
    assert resp.json()["history_region"] == "Domain" and not ItemPrice.objects.exists()  # old hub's prices dropped
    assert services.prices_out()["hub"] == "Amarr VIII"
    # A market that doesn't exist, or a structure for a source that can't read one.
    assert api_client.call("put", "/api/p/buyback/settings", {**s, "hub_id": 60099999}).status_code == 400
    assert api_client.call("put", "/api/p/buyback/settings", {**s, "price_source": "fuzzwork", "hub_id": 1035466617946}).status_code == 400
    # Regions and systems work too, and can be searched.
    assert api_client.call("put", "/api/p/buyback/settings", {**s, "hub_id": FORGE, "hub_name": "The Forge"}).status_code == 200
    names = [h["name"] for h in api_client.get("/api/p/buyback/manage/search/hubs?q=Am").json()]
    assert names == ["Amarr"]


# --- a program's own market -----------------------------------------------------------------------------------------

AMARR_VIII = 60008494
DOMAIN = 10000043
AMARR = 30002187


@pytest.fixture
def amarr(jita):
    Region.objects.create(id=DOMAIN, name="Domain")
    SolarSystem.objects.create(id=AMARR, constellation_id=1, region_id=DOMAIN, name="Amarr", security_status=1.0)
    Station.objects.create(id=AMARR_VIII, solar_system_id=AMARR, type_id=1932)


def test_programs_price_at_their_own_market(amarr, program, seller, monkeypatch):
    monkeypatch.setattr(market, "fetch_history", lambda *a, **k: 0)
    ItemPrice.objects.create(hub_id=AMARR_VIII, type_id=TRITANIUM, buy=7, sell=8, updated_at=timezone.now())
    MarketRead.objects.create(hub_id=AMARR_VIII, pulled_at=timezone.now())
    assert line(appraise(program, "Tritanium 10"), TRITANIUM)["market_unit"] == 4.0  # the site's: Jita 4-4
    program.hub_id, program.hub_name = AMARR_VIII, "Amarr VIII"
    program.save()
    assert line(appraise(program, "Tritanium 10"), TRITANIUM)["market_unit"] == 7.0
    out = services.quote(program, "Tritanium 10", user=seller)
    assert out["hub"] == "Amarr VIII" and out["quote"]["hub"] == "Amarr VIII"
    assert Quote.objects.get(tracking_number=out["quote"]["tracking_number"]).hub_name == "Amarr VIII"
    assert services.program_out(program)["prices"]["hub"] == "Amarr VIII" and services.prices_out()["hub"] == "Jita 4-4"
    # Janice prices Jita 4-4 only, whatever the program picked.
    BuybackSettings.objects.filter(pk=1).update(price_source="janice", janice_api_key="key")
    assert services.program_out(program)["prices"]["hub"] == "Jita 4-4"


def test_every_market_in_use_is_read(amarr, program):
    from conduit_buyback.models import Program

    esi_settings()
    MarketRead.objects.all().delete()
    Program.objects.create(name="Amarr", owner=program.owner, hub_id=AMARR_VIII, hub_name="Amarr VIII")
    Program.objects.create(name="Forge", owner=program.owner, hub_id=FORGE, hub_name="The Forge")
    Program.objects.create(name="Closed", owner=program.owner, hub_id=60011866, hub_name="Dodixie", active=False)
    esi = FakeEsi(pages={1: [order(TRITANIUM, 4.0, 100, True), order(TRITANIUM, 9.0, 100, True, location=AMARR_VIII, system=AMARR)]})
    assert market.pull_once(client=esi) == 3
    # Jita 4-4 and The Forge share one read of the region; the closed program's market isn't read.
    assert sorted(c[0] for c in esi.calls) == [f"/markets/{FORGE}/orders", f"/markets/{DOMAIN}/orders"]
    buy = dict(ItemPrice.objects.filter(type_id=TRITANIUM).values_list("hub_id", "buy"))
    assert buy == {JITA_44: Decimal("4.00"), AMARR_VIII: Decimal("9.00"), FORGE: Decimal("9.00")}
    assert set(MarketRead.objects.values_list("hub_id", flat=True)) == {JITA_44, AMARR_VIII, FORGE}
    # Closed: its market's prices are forgotten.
    Program.objects.filter(name="Amarr").update(active=False)
    market.prune()
    assert not ItemPrice.objects.filter(hub_id=AMARR_VIII).exists() and not MarketRead.objects.filter(hub_id=AMARR_VIII).exists()


def test_picking_a_programs_market(amarr, program, boss, api_client, monkeypatch):
    from conduit_buyback import tasks

    queued = []
    monkeypatch.setattr(tasks.pull_market, "delay", lambda: queued.append(1))
    api_client.force_login(boss)
    opts = api_client.get("/api/p/buyback/manage/options").json()["market"]
    assert (opts["source"], opts["hub_id"], opts["hub_name"]) == ("esi", JITA_44, "Jita 4-4") and len(opts["hubs"]) == 5
    url = f"/api/p/buyback/manage/programs/{program.pk}"
    body = {"name": "Ore buyback", "owner_id": boss.main_character.pk, "location_ids": list(program.locations.values_list("pk", flat=True))}
    assert api_client.call("put", url, {**body, "hub_id": 60099999}).status_code == 400  # no such station
    # A structure's market is read with the owner's login.
    resp = api_client.call("put", url, {**body, "hub_id": 1035466617946, "hub_name": "Perimeter Keepstar"})
    assert resp.status_code == 400 and "log in again" in resp.json()["detail"]
    resp = api_client.call("put", url, {**body, "hub_id": AMARR_VIII, "hub_name": "Amarr VIII"})
    assert resp.status_code == 200, resp.content
    assert (resp.json()["hub_id"], resp.json()["prices"]["hub"]) == (AMARR_VIII, "Amarr VIII") and queued == [1]
    assert api_client.get(f"/api/p/buyback/programs/{program.pk}").json()["prices"]["hub"] == "Amarr VIII"
    api_client.force_login(grant(boss, "manage_all_programs"))
    markets = api_client.get("/api/p/buyback/settings").json()["markets"]
    assert [(m["name"], m["programs"]) for m in markets] == [("Jita 4-4", []), ("Amarr VIII", ["Ore buyback"])]
    # Back to the site's market.
    assert api_client.call("put", url, {**body, "hub_id": None}).json()["prices"]["hub"] == "Jita 4-4"
