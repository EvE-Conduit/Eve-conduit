"""The corporation sheets: the main corporation has every section filled in (members with a few who never
registered, structures with low fuel and a reinforcement, wallets, assets, industry, contracts, market, a moon
drill, a starbase and killmails); the other two alliance corporations have the basics."""

from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

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
from conduit.eve.models import EveCorporation, EveName, MarketPrice
from conduit.sheet.models import Location

from . import Ids, catalog
from .core import FIRST, LAST

# Static data this module needs beyond catalog: id -> (name, group id); groups and categories likewise.
EXTRA_CATEGORIES = {2: "Celestial", 3: "Station", 23: "Starbase"}
EXTRA_GROUPS = {16: ("Station Services", 3), 8: ("Moon", 2), 1136: ("Fuel Block", 4), 365: ("Control Tower", 23),
                1884: ("Ubiquitous Moon Asteroids", 25), 1920: ("Common Moon Asteroids", 25)}
EXTRA_TYPES = {
    27: ("Office", 16), 4051: ("Nitrogen Fuel Block", 1136), 4246: ("Hydrogen Fuel Block", 1136),
    16214: ("Minmatar Control Tower", 365),
    45490: ("Zeolites", 1884), 45491: ("Sylvite", 1884), 45492: ("Bitumens", 1884), 45493: ("Coesite", 1884),
    45494: ("Cobaltite", 1920), 45495: ("Euxenite", 1920), 45496: ("Titanite", 1920), 45497: ("Scheelite", 1920),
}
MOON_ORES = (45490, 45491, 45492, 45493, 45494, 45495, 45496, 45497)
FUEL = (4051, 4246)
# Rough prices, so asset and mining values aren't all zero when the real site has none.
PRICES = {34: 4.5, 35: 9.8, 36: 62, 37: 85, 38: 640, 39: 1150, 40: 2400, 4051: 18_500, 4246: 18_200,
          45490: 190, 45491: 210, 45492: 175, 45493: 230, 45494: 520, 45495: 480, 45496: 540, 45497: 505,
          587: 450_000, 626: 9_800_000, 621: 10_500_000, 24698: 48_000_000, 638: 190_000_000, 641: 185_000_000,
          22544: 290_000_000, 28606: 920_000_000, 11985: 210_000_000, 2488: 3_200, 2454: 11_000, 2185: 540_000,
          484: 4_000, 185: 9, 950: 2_100_000, 1178: 21_000_000}

# The main corporation's two extra structures: a moon drill and a waystation that's under attack.
EXTRA_STRUCTURES = (("Rens - Aurora Moon Drill", 30002510, 35835), ("Dodixie - Aurora Waystation", 30002659, 35832))
SERVICES = {35825: ("Manufacturing (Standard)", "Research", "Invention"), 35826: ("Manufacturing (Standard)", "Research"),
            35832: ("Clone Bay",), 35833: ("Market", "Clone Bay", "Reprocessing"), 35835: ("Moon Drilling", "Reprocessing")}
MOONS = ("Rens VII - Moon 3", "Hek V - Moon 2")

HANGARS = ("Fittings & Ships", "Minerals", "Production", "Moon Goo", "Ammo & Drones", "Doctrine Stock", "Director Hangar")
WALLETS = ("Master Wallet", "Industry", "Market", "Moon Income", "SRP Fund", "Logistics", "Reserve")
TITLES = ("Director", "Fleet Commander", "Industrialist", "Recruiter", "Logistics Officer", "Member")
ROLES = (("Director",), ("Accountant", "Junior_Accountant"), ("Station_Manager",), ("Factory_Manager",), ("Trader",),
         ("Personnel_Manager",))

DESCRIPTIONS = (
    "Industry and logistics arm of the Northern Lights Coalition. Builders, miners and haulers who keep the "
    "alliance's fleets in ships.\n\nRecruitment is open: ask in the AURI Public channel.",
    "Small-gang PvP and alliance fleet core. We fight, we die, we reship.",
    "Hauling, freight and jump logistics for the coalition. Contracts to DVLOG Freight.",
)


def _isk(value) -> Decimal:
    return Decimal(f"{value:.2f}")


def _lot(demo, price, low, high) -> int:
    """How many to trade for an order worth between ``low`` and ``high`` ISK."""
    return max(1, int(demo.rng.uniform(low, high) / price))


def seed(demo):
    _static()
    main = demo.corporations[0]
    unregistered = _outsiders(demo)
    structures = _structures(demo)
    for i, corp in enumerate(demo.corporations):
        _info(demo, corp, i)
        _members(demo, corp, unregistered.get(corp.pk, []))
        _wallets(demo, corp, full=i == 0)
        _sync_statuses(demo, corp, full=i == 0)
    members = list(CorporationMember.objects.filter(corporation=main).values_list("character_id", flat=True))
    _assets(demo, main, structures)
    _industry(demo, main, members, structures)
    _contracts(demo, main, members, structures)
    _market(demo, main, members, structures)
    moons = {name: demo.next_id() for name in MOONS}
    EveName.objects.bulk_create([EveName(id=i, name=n, category="moon") for n, i in moons.items()])
    _mining(demo, main, members, structures, moons["Rens VII - Moon 3"])
    _starbases(demo, main, moons["Hek V - Moon 2"])
    _killmails(demo, main)


def _static():
    from conduit.sde.models import ItemCategory, ItemGroup, ItemType

    ItemCategory.objects.bulk_create([ItemCategory(id=i, name=n, published=True) for i, n in EXTRA_CATEGORIES.items()],
                                     ignore_conflicts=True)
    ItemGroup.objects.bulk_create([ItemGroup(id=i, name=n, category_id=c, published=True) for i, (n, c) in EXTRA_GROUPS.items()],
                                  ignore_conflicts=True)
    ItemType.objects.bulk_create([ItemType(id=i, name=n, group_id=g, published=True) for i, (n, g) in EXTRA_TYPES.items()],
                                 ignore_conflicts=True)
    MarketPrice.objects.bulk_create([MarketPrice(type_id=t, average_price=p, adjusted_price=p) for t, p in PRICES.items()],
                                    ignore_conflicts=True)


def _outsiders(demo) -> dict[int, list[int]]:
    """Members in game who never signed in here: corporation id -> their character ids."""
    taken = {c.name for c in demo.characters}
    out, names = {}, []
    for corp, count in zip(demo.corporations, (5, 3, 1)):
        ids = []
        for _ in range(count):
            name = f"{demo.pick(FIRST)} {demo.pick(LAST)}"
            while name in taken:
                name = f"{demo.pick(FIRST)} {demo.pick(LAST)}"
            taken.add(name)
            cid = demo.next_id()
            ids.append(cid)
            names.append(EveName(id=cid, name=name, category="character"))
        out[corp.pk] = ids
    EveName.objects.bulk_create(names, ignore_conflicts=True)
    return out


def _structures(demo) -> list[dict]:
    """Structures of every alliance corporation (core's, plus the main corporation's two extra); returns the main
    corporation's."""
    main = demo.corporations[0]
    owners = dict(Location.objects.filter(pk__in=[s["id"] for s in demo.structures]).values_list("id", "owner_id"))
    rows = [dict(s, owner=owners.get(s["id"]) or main.pk) for s in demo.structures]
    for i, (name, system_id, type_id) in enumerate(EXTRA_STRUCTURES):
        sid = Ids.STRUCTURE + 50 + i
        Location.objects.create(id=sid, kind="structure", name=name, solar_system_id=system_id, type_id=type_id, owner_id=main.pk)
        rows.append({"id": sid, "name": name, "system_id": system_id, "type_id": type_id, "owner": main.pk})

    # Fuel in hours: the forge runs low, the waystation is reinforced.
    fuel = {0: 41, 1: 24 * 26, 4: 24 * 9}
    out = []
    for i, s in enumerate(rows):
        state, timer_start, timer_end = "shield_vulnerable", None, None
        if s["name"].endswith("Waystation"):
            state, timer_start, timer_end = "armor_reinforce", demo.ago(hours=9), demo.ahead(hours=31)
        hours = fuel.get(i, demo.rng.uniform(240, 900))
        out.append(Structure(
            corporation_id=s["owner"], structure_id=s["id"], name=s["name"], type_id=s["type_id"], system_id=s["system_id"],
            profile_id=1, state=state, fuel_expires=demo.ahead(hours=hours), state_timer_start=timer_start,
            state_timer_end=timer_end, reinforce_hour=demo.pick((18, 19, 20, 21)), next_reinforce_hour=None,
            services=[{"name": n, "state": "offline" if state != "shield_vulnerable" and n == "Clone Bay" else "online"}
                      for n in SERVICES.get(s["type_id"], ())],
            fuel_warned=hours < 72,
        ))
    Structure.objects.bulk_create(out)
    return [s for s in rows if s["owner"] == main.pk]


def _info(demo, corp, index):
    chars = [c for c in demo.characters if c.corporation_id == corp.pk]
    ceo = demo.admin.main_character if index == 0 else next(c for c in chars if c.pk == c.user.main_character_id)
    CorporationInfo.objects.create(
        corporation=corp, ceo_id=ceo.pk, creator_id=ceo.pk, date_founded=demo.ago(days=2400 - index * 500),
        description=DESCRIPTIONS[index], home_station_id=demo.station_ids()[[0, 4, 3][index]], shares=1000,
        tax_rate=(0.1, 0.05, 0.08)[index], url="", war_eligible=True,
        hangar_divisions=[{"division": i + 1, "name": n} for i, n in enumerate(HANGARS)] if index == 0 else [],
        wallet_divisions=[{"division": i + 1, "name": n} for i, n in enumerate(WALLETS)] if index == 0 else [],
    )


def _members(demo, corp, outsiders):
    chars = [c for c in demo.characters if c.corporation_id == corp.pk]
    places = demo.station_ids() + [s["id"] for s in demo.structures]
    ships = demo.type_ids(category=catalog.SHIP_CATEGORY)
    director = demo.admin.main_character_id
    rows = []
    for char_id in [c.pk for c in chars] + outsiders:
        idle = char_id in outsiders or demo.chance(0.25)  # those who never registered mostly don't log in much
        logoff = demo.recent(60 if idle else 4)
        online = not idle and demo.chance(0.2)
        roles = sorted({"Director", *demo.pick(ROLES)} if char_id == director else demo.pick(ROLES) if demo.chance(0.25) else ())
        rows.append(CorporationMember(
            corporation=corp, character_id=char_id, start_date=demo.recent(700), tracked=True,
            logon_date=demo.ahead(minutes=-demo.rng.uniform(5, 180)) if online else logoff - timedelta(hours=demo.rng.uniform(0.5, 4)),
            logoff_date=logoff, location_id=demo.pick(places), ship_type_id=demo.pick(ships), base_id=None, roles=roles,
            titles=["Director"] if char_id == director else ([demo.pick(TITLES[1:])] if demo.chance(0.6) else []),
        ))
    CorporationMember.objects.bulk_create(rows)
    EveCorporation.objects.filter(pk=corp.pk).update(member_count=len(rows))
    CorporationInfo.objects.filter(corporation=corp).update(member_count=len(rows))


# --- wallets --------------------------------------------------------------------------

# ref type, (low, high) ISK, sign, division
INCOME = (("bounty_prizes", (2e6, 30e6), 1, 1), ("ess_escrow_transfer", (20e6, 90e6), 1, 1),
          ("player_donation", (10e6, 250e6), 1, 1), ("reprocessing_tax", (1e5, 3e6), 1, 2),
          ("industry_job_tax", (2e5, 6e6), 1, 2), ("moon_mining_extraction_tax", (5e6, 40e6), 1, 4),
          ("office_rental_fee", (-8e6, -2e6), 1, 1), ("corporation_account_withdrawal", (-400e6, -50e6), 1, 5),
          ("structure_gate_jump", (5e4, 2e5), 1, 6), ("brokers_fee", (-4e6, -2e5), 1, 3),
          ("transaction_tax", (-3e6, -1e5), 1, 3))
BALANCES = (4_820_000_000, 1_240_000_000, 860_000_000, 2_310_000_000, 640_000_000, 95_000_000, 12_500_000_000)


def _wallets(demo, corp, full):
    balances = BALANCES if full else (demo.rng.uniform(300e6, 2.5e9),)
    WalletDivision.objects.bulk_create([WalletDivision(corporation=corp, division=i + 1, balance=_isk(b)) for i, b in enumerate(balances)])
    if not full:
        return
    members = [c for c in demo.characters if c.corporation_id == corp.pk]
    entries = []
    for _ in range(260):
        ref_type, (low, high), _, division = demo.pick(INCOME)
        who = demo.pick(members)
        amount = demo.rng.uniform(low, high)
        if ref_type == "corporation_account_withdrawal":
            description = f"{corp.name} transferred cash to {who.name}'s account"
        elif ref_type == "player_donation":
            description = f"{who.name} deposited cash into {corp.name}'s account"
        else:
            description = ref_type.replace("_", " ").capitalize()
        entries.append(dict(division=division, date=demo.recent(45), ref_type=ref_type, amount=amount, description=description,
                            reason="SRP payout" if division == 5 else "", first_party_id=who.pk, second_party_id=corp.pk))

    # Market sales and purchases, with their journal entries.
    transactions = []
    market = [t for t in PRICES if t not in MOON_ORES]
    clients = [c.pk for c in demo.characters if c.corporation_id != corp.pk]
    for _ in range(80):
        type_id, is_buy = demo.pick(market), demo.chance(0.35)
        quantity = _lot(demo, PRICES[type_id], 2e6, 120e6)
        price = PRICES[type_id] * demo.rng.uniform(0.92, 1.12)
        ref_id, date, client = demo.next_id(), demo.recent(30), demo.pick(clients)
        transactions.append(CorpTransaction(
            corporation=corp, division=3, transaction_id=demo.next_id(), date=date, type_id=type_id, quantity=quantity,
            unit_price=_isk(price), is_buy=is_buy, client_id=client, location_id=demo.structures[1]["id"], journal_ref_id=ref_id,
        ))
        entries.append(dict(division=3, date=date, ref_type="market_transaction", amount=-price * quantity if is_buy else price * quantity,
                            description="Market: buy order" if is_buy else "Market: sell order", reason="", first_party_id=client,
                            second_party_id=corp.pk, ref_id=ref_id))
    CorpTransaction.objects.bulk_create(transactions)

    # Running balances that end at today's division balance.
    by_div = defaultdict(list)
    for e in entries:
        by_div[e["division"]].append(e)
    rows = []
    for division, items in by_div.items():
        items.sort(key=lambda e: e["date"])
        running = Decimal(str(BALANCES[division - 1])) - sum(_isk(e["amount"]) for e in items)
        for e in items:
            amount = _isk(e["amount"])
            running += amount
            tax = _isk(abs(e["amount"]) * 0.1) if e["ref_type"] in ("bounty_prizes", "ess_escrow_transfer") else None
            rows.append(CorpJournalEntry(corporation=corp, division=division, ref_id=e.get("ref_id") or demo.next_id(), date=e["date"],
                                         ref_type=e["ref_type"], amount=amount, balance=running, description=e["description"],
                                         reason=e["reason"], first_party_id=e["first_party_id"], second_party_id=e["second_party_id"], tax=tax))
    CorpJournalEntry.objects.bulk_create(rows)


def _sync_statuses(demo, corp, full):
    synced_as = demo.admin.main_character if full else next(c for c in demo.characters if c.corporation_id == corp.pk)
    rows = []
    for s in registry.ordered():
        result, message, failures = "ok", "", 0
        if not full and s.key not in ("overview", "members", "structures", "wallets"):
            result, message = "no_character", f"No registered member has the role and scopes: {s.requirement()}"
        elif full and s.key == "starbases":
            result, message, failures = "error", "ESI answered 502 Bad Gateway", 2
        ran = result != "no_character"
        rows.append(CorpSyncStatus(
            corporation=corp, section=s.key, result=result, message=message, character=synced_as if ran else None,
            last_attempt=demo.recent(0.05), last_success=demo.recent(0.04 if result == "ok" else 0.3) if ran else None,
            next_due=demo.ahead(minutes=demo.rng.uniform(5, s.interval / 60)), failures=failures,
        ))
    CorpSyncStatus.objects.bulk_create(rows)


# --- assets, industry, contracts, market ----------------------------------------------


def _assets(demo, corp, structures):
    ships = demo.type_ids(category=catalog.SHIP_CATEGORY)
    modules = demo.type_ids(category=7) + demo.type_ids(category=18) + demo.type_ids(category=8)
    blueprints = demo.type_ids(category=9)
    minerals = demo.type_ids(group=18)
    places = [(s["id"], "item") for s in structures] + [(demo.station_ids()[0], "station")]
    rows = []

    def add(type_id, quantity, location_id, location_type, flag, root, singleton=False, bpc=None, name=""):
        item_id = demo.next_id()
        rows.append(CorpAsset(corporation=corp, item_id=item_id, type_id=type_id, quantity=quantity, location_id=location_id,
                              location_type=location_type, location_flag=flag, is_singleton=singleton, is_blueprint_copy=bpc,
                              name=name, root_location_id=root))
        return item_id

    for root, kind in places:
        office = add(27, 1, root, kind, "OfficeFolder", root, singleton=True)
        for t in demo.sample(minerals, 5):
            add(t, demo.rng.randint(50_000, 9_000_000), office, "item", "CorpSAG2", root)
        for t in demo.sample(modules, 6):
            add(t, demo.rng.randint(5, 400), office, "item", demo.pick(("CorpSAG1", "CorpSAG5")), root)
        for t in demo.sample(blueprints, 2):
            bpc = demo.chance(0.5)
            add(t, -2 if bpc else -1, office, "item", "CorpSAG3", root, singleton=True, bpc=bpc)
        for t in demo.sample(ships, 4):
            ship = add(t, 1, office, "item", "CorpSAG6", root, singleton=True, name=f"AURI {demo.type_name(t)}")
            for slot, m in enumerate(demo.sample(modules, 3)):
                add(m, 1, ship, "item", f"HiSlot{slot}", root, singleton=True)
        if kind == "item":
            add(demo.pick(FUEL), demo.rng.randint(2_000, 30_000), root, "item", "StructureFuel", root)
        add(demo.pick(FUEL), demo.rng.randint(10_000, 80_000), office, "item", "CorpSAG7", root)
    CorpAsset.objects.bulk_create(rows)


def _industry(demo, corp, members, structures):
    forge = structures[0]["id"]
    products = {950: 587, 1178: 626}
    registered = [m for m in members if m < Ids.OTHER]
    rows = []
    for _ in range(36):
        blueprint = demo.pick(products)
        activity = demo.rng.choices([1, 3, 4, 5, 8], weights=[6, 1, 1, 2, 1])[0]
        hours = demo.rng.uniform(2, 96)
        start = demo.ago(hours=demo.rng.uniform(0, 240))
        end = start + timedelta(hours=hours)
        if end > demo.now:
            status = demo.pick(("active", "active", "active", "paused"))
        else:
            status = demo.rng.choices(["delivered", "ready", "cancelled"], weights=[6, 2, 1])[0]
        rows.append(CorpIndustryJob(
            corporation=corp, job_id=demo.next_id(), installer_id=demo.pick(registered), activity_id=activity, status=status,
            blueprint_type_id=blueprint, product_type_id=products[blueprint] if activity == 1 else blueprint,
            runs=demo.rng.randint(1, 20) if activity in (1, 5) else 1, cost=_isk(demo.rng.uniform(1e5, 2.5e7)),
            facility_id=forge, location_id=forge, start_date=start, end_date=end,
            completed_date=end if status == "delivered" else None,
        ))
    CorpIndustryJob.objects.bulk_create(rows)


CONTRACT_TITLES = ("Doctrine Drakes x5", "Moon goo for reactions", "Fuel blocks to Rens", "Ammo resupply", "SRP replacement",
                   "Minerals to the forge", "BPC pack: Vexor", "Hauling: Perimeter to Hek", "")


def _contracts(demo, corp, members, structures):
    registered = [m for m in members if m < Ids.OTHER]
    places = [s["id"] for s in structures] + demo.station_ids()
    rows = []
    for _ in range(30):
        kind = demo.rng.choices(["item_exchange", "courier", "auction"], weights=[6, 3, 1])[0]
        issued = demo.recent(40)
        status = demo.rng.choices(["outstanding", "in_progress", "finished", "expired", "deleted"], weights=[4, 2 if kind == "courier" else 0, 6, 2, 1])[0]
        done = status == "finished"
        rows.append(CorpContract(
            corporation=corp, contract_id=demo.next_id(), type=kind, status=status,
            availability=demo.pick(("corporation", "alliance", "personal")), title=demo.pick(CONTRACT_TITLES),
            issuer_id=demo.pick(registered), assignee_id=corp.pk, acceptor_id=demo.pick(registered) if done or status == "in_progress" else None,
            for_corporation=demo.chance(0.5), price=_isk(demo.rng.uniform(5e6, 900e6)) if kind != "courier" else _isk(0),
            reward=_isk(demo.rng.uniform(5e6, 60e6)) if kind == "courier" else None,
            collateral=_isk(demo.rng.uniform(100e6, 2e9)) if kind == "courier" else None, volume=round(demo.rng.uniform(100, 320_000), 1),
            date_issued=issued, date_expired=issued + timedelta(days=14), date_completed=issued + timedelta(days=demo.rng.uniform(0.2, 6)) if done else None,
            start_location_id=demo.pick(places), end_location_id=demo.pick(places) if kind == "courier" else None,
        ))
    CorpContract.objects.bulk_create(rows)


def _market(demo, corp, members, structures):
    registered = [m for m in members if m < Ids.OTHER]
    market = structures[1]["id"]
    rows = []
    # Buy minerals, fuel and ammo; sell what we build (and some of the minerals too).
    orders = [(t, True) for t, p in PRICES.items() if p < 50_000 and t not in MOON_ORES and demo.chance(0.8)]
    orders += [(t, False) for t in PRICES if t not in MOON_ORES and demo.chance(0.6)]
    for type_id, is_buy in orders:
        price = PRICES[type_id]
        total = _lot(demo, price, 20e6, 600e6)
        state = "active" if demo.chance(0.8) else "expired"
        remain = total if state == "active" and demo.chance(0.3) else demo.rng.randint(0, total)
        unit = price * (0.95 if is_buy else 1.08)
        rows.append(CorpMarketOrder(
            corporation=corp, order_id=demo.next_id(), type_id=type_id, is_buy_order=is_buy, price=_isk(unit), volume_total=total,
            volume_remain=remain, issued=demo.recent(80 if state == "expired" else 25), issued_by=demo.pick(registered),
            duration=90, location_id=market if not is_buy else demo.station_ids()[0], region_id=10000002, wallet_division=3,
            escrow=_isk(unit * remain) if is_buy else None, state=state,
        ))
    CorpMarketOrder.objects.bulk_create(rows)


# --- moons, starbases, killmails ------------------------------------------------------


def _mining(demo, corp, members, structures, moon):
    drill = next(s["id"] for s in structures if s["type_id"] == 35835)
    # The last chunk is waiting to be fractured, the next one is on its way.
    MoonExtraction.objects.bulk_create([
        MoonExtraction(corporation=corp, structure_id=drill, moon_id=moon, extraction_start_time=demo.ago(days=7.5),
                       chunk_arrival_time=demo.ago(days=1.2), natural_decay_time=demo.ahead(hours=1.8)),
        MoonExtraction(corporation=corp, structure_id=drill, moon_id=moon, extraction_start_time=demo.ago(hours=20),
                       chunk_arrival_time=demo.ahead(days=6.2), natural_decay_time=demo.ahead(days=6.3)),
    ])
    miners = demo.sample(members, 9)
    rows, seen = [], set()
    for day in range(30):
        date = (demo.now - timedelta(days=day)).date()
        for miner in demo.sample(miners, demo.rng.randint(1, 5)):
            for ore in demo.sample(MOON_ORES, 2):
                if (miner, ore, date) in seen:
                    continue
                seen.add((miner, ore, date))
                rows.append(MiningObservation(corporation=corp, observer_id=drill, character_id=miner, recorded_corporation_id=corp.pk,
                                              type_id=ore, quantity=demo.rng.randint(2_000, 60_000), last_updated=date))
    MiningObservation.objects.bulk_create(rows)


def _starbases(demo, corp, moon):
    Starbase.objects.bulk_create([
        Starbase(corporation=corp, starbase_id=demo.next_id(), type_id=16214, system_id=30002053, moon_id=moon, state="online",
                 onlined_since=demo.ago(days=412)),
        Starbase(corporation=corp, starbase_id=demo.next_id(), type_id=16214, system_id=30002510, state="offline",
                 onlined_since=None, unanchor_at=demo.ahead(days=2)),
    ])


HOSTILE_CORPORATION = "Redline Marauders"


def _killmails(demo, corp):
    """Link the members' killmails (sheet_combat's) to the corporation, and add a few of its own."""
    from conduit.sheet.killmails.models import CharacterKillmail, Killmail

    links = {}
    ours = {c.pk for c in demo.characters if c.corporation_id == corp.pk}
    for km_id, is_loss in CharacterKillmail.objects.filter(character_id__in=ours).values_list("killmail_id", "is_loss"):
        links.setdefault(km_id, is_loss)
    for km_id in Killmail.objects.filter(victim_corporation_id=corp.pk).values_list("id", flat=True):
        links[km_id] = True

    hostile_corp = demo.next_id()
    hostiles = [demo.next_id() for _ in range(4)]
    names = [EveName(id=hostile_corp, name=HOSTILE_CORPORATION, category="corporation")]
    names += [EveName(id=h, name=f"{demo.pick(FIRST)} {demo.pick(LAST)}", category="character") for h in hostiles]
    EveName.objects.bulk_create(names, ignore_conflicts=True)
    ships = demo.type_ids(category=catalog.SHIP_CATEGORY)
    pilots = [c.pk for c in demo.characters if c.corporation_id == corp.pk]
    killmails = []
    for _ in range(14):
        is_loss = demo.chance(0.35)
        victim, victim_corp = (demo.pick(pilots), corp.pk) if is_loss else (demo.pick(hostiles), hostile_corp)
        final = demo.pick(hostiles) if is_loss else demo.pick(pilots)
        ship, system, time = demo.pick(ships), demo.pick(demo.system_ids()), demo.recent(30)
        attackers = demo.rng.randint(1, 25)
        kid = demo.next_id()
        killmails.append(Killmail(
            id=kid, hash=f"demo{kid:x}", time=time, solar_system_id=system, victim_character_id=victim,
            victim_corporation_id=victim_corp, victim_alliance_id=corp.alliance_id if is_loss else None, victim_ship_type_id=ship,
            damage_taken=demo.rng.randint(2_000, 90_000), attacker_count=attackers, final_blow_character_id=final,
            value=PRICES.get(ship, demo.rng.uniform(5e6, 300e6)) * demo.rng.uniform(1.2, 2.5),
            data={"killmail_id": kid, "killmail_time": time.isoformat(), "solar_system_id": system,
                  "victim": {"character_id": victim, "corporation_id": victim_corp, "ship_type_id": ship, "items": []},
                  "attackers": [{"character_id": final, "final_blow": True, "damage_done": 1000}]},
        ))
        links[kid] = is_loss
    Killmail.objects.bulk_create(killmails)
    CorporationKillmail.objects.bulk_create([CorporationKillmail(corporation=corp, killmail_id=k, is_loss=loss) for k, loss in links.items()])
