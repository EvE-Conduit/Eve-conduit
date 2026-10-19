"""Example buyback desks for demo mode (see conduit.demo.seed): an ore and mineral program, a ship program with its
own item list and a public mineral desk, Jita prices, and a year of quotes and contracts with a few to check."""

from datetime import timedelta
from decimal import ROUND_DOWN, Decimal

from conduit.sde.models import type_icon_url

from . import contracts
from .models import JITA_44, BuybackSettings, Contract, ItemPrice, ItemRule, Location, MarketRead, PriceHistory, Program, Quote, WatchRule
from .services import TRACKING_ALPHABET

THE_FORGE = 10000002

# type id -> (Jita buy, Jita sell, packaged m³)
PRICES = {
    34: (4.1, 4.6, 0.01), 35: (8.7, 9.6, 0.01), 36: (58, 64, 0.01), 37: (118, 131, 0.01), 38: (690, 760, 0.01),
    39: (1080, 1190, 0.01), 40: (2350, 2580, 0.01),
    1230: (11.5, 13, 0.1), 1228: (17, 19.5, 0.15), 1224: (24, 27, 0.3), 18: (29, 33, 0.35), 1227: (44, 49, 0.6),
    587: (640_000, 720_000, 2500), 603: (590_000, 690_000, 2500), 626: (10_800_000, 12_100_000, 10000),
    621: (11_400_000, 12_700_000, 10000), 24698: (54_000_000, 59_500_000, 15000), 24702: (51_000_000, 56_000_000, 15000),
    638: (176_000_000, 189_000_000, 50000), 641: (172_000_000, 184_000_000, 50000),
    2488: (8_900, 11_500, 5), 2454: (21_000, 26_000, 10), 2185: (1_150_000, 1_290_000, 10), 185: (11, 14, 0.0025),
}
ORE = (34, 35, 36, 37, 38, 39, 40, 1230, 1228, 1224, 18, 1227)
SHIPS = (587, 603, 626, 621, 24698, 24702, 638, 641, 2488, 2454, 2185, 185)
MINERALS = (34, 35, 36, 37, 38, 39, 40)


def _tracking(demo, prefix):
    return prefix + "".join(demo.rng.choice(TRACKING_ALPHABET) for _ in range(10))


def _lines(demo, program, rules, watched, items):
    """Quote lines as the pricing would make them, at the program's tax and Jita prices."""
    lines = []
    for type_id, quantity in items:
        buy, sell, m3 = PRICES[type_id]
        rule = rules.get(type_id)
        line = {"type_id": type_id, "name": demo.type_name(type_id), "group": "", "icon": type_icon_url(type_id, 32),
                "quantity": quantity, "volume": m3 * quantity, "accepted": True, "reason": "", "method": "buy",
                "market_unit": buy, "tax": 0.0, "density_tax": False, "hauling_unit": 0.0, "unit_price": 0.0, "value": 0.0,
                "options": {"buy": buy}, "watch": False, "guard": None}
        if rule and rule.static_price is not None:
            unit = rule.static_price
            line |= {"method": "fixed", "market_unit": float(unit), "options": {}}
        else:
            tax = program.tax + (rule.tax if rule else Decimal(0))
            hauling = program.hauling_fuel_cost * Decimal(str(m3))
            unit = max(Decimal(str(buy)) * (100 - tax) / 100 - hauling, Decimal(0)).quantize(Decimal("0.01"))
            line |= {"tax": float(tax), "hauling_unit": float(hauling)}
        line |= {"unit_price": float(unit), "value": float((unit * quantity).quantize(Decimal("0.01"))), "accepted": unit > 0}
        line["watch"] = type_id in watched
        lines.append(line)
    lines.sort(key=lambda ln: -ln["value"])
    return lines


def seed(demo):
    s = BuybackSettings.load()  # ESI prices at Jita 4-4, the defaults; no Janice key
    MarketRead.objects.create(hub_id=JITA_44, pulled_at=demo.ago(minutes=22))
    ItemPrice.objects.bulk_create([
        ItemPrice(hub_id=JITA_44, type_id=t, buy=Decimal(str(b)), sell=Decimal(str(se)), updated_at=demo.recent(0.5))
        for t, (b, se, _) in PRICES.items()
    ])
    today = demo.now.date()
    PriceHistory.objects.bulk_create([
        PriceHistory(region_id=THE_FORGE, type_id=t, updated_at=demo.ago(hours=2), days=[
            [(today - timedelta(days=d)).isoformat(), round(PRICES[t][0] * demo.rng.uniform(0.95, 1.06), 2), demo.rng.randint(10**6, 10**8)]
            for d in range(30, 0, -1)
        ])
        for t in MINERALS
    ])

    main = demo.corporations[0]
    keepstar = next(st for st in demo.structures if "Keepstar" in st["name"])
    refinery = next(st for st in demo.structures if "Refinery" in st["name"])
    locations = Location.objects.bulk_create([
        Location(name=keepstar["name"], solar_system_id=keepstar["system_id"], structure_id=keepstar["id"]),
        Location(name=refinery["name"], solar_system_id=refinery["system_id"], structure_id=refinery["id"]),
        Location(name="Jita IV - Moon 4 - Caldari Navy Assembly Plant", solar_system_id=30000142, structure_id=JITA_44),
    ])
    owner = demo.admin.main_character
    directors = list(demo.groups["Directors"].user_set.exclude(pk=demo.admin.pk))

    ore = Program.objects.create(
        name="Alliance Ore Buyback", owner=owner, is_corporation=True, wallet_division=2, tax=Decimal("8"),
        hauling_fuel_cost=Decimal("10"), refining_rate=Decimal("86"),
        description="Ore, ice and minerals at Jita buy minus 8%, less hauling. Contract to Aurora Industries at the Keepstar or the refinery.",
    )
    ore.locations.add(locations[0], locations[1])
    ships = Program.objects.create(
        name="Ships & Drones", owner=owner, is_corporation=True, wallet_division=3, tax=Decimal("12"), allow_all_items=False,
        expiration_days=7, tracking_prefix="sh-",
        description="Doctrine hulls and drones only, for restocking the alliance market. Everything else: sell it in Jita.",
    )
    ships.locations.add(locations[0])
    ships.states.add(demo.states["member"])
    public = Program.objects.create(
        name="Public Mineral Desk", owner=owner, is_corporation=True, tax=Decimal("10"), allow_all_items=False, public=True,
        description="Minerals from anyone, members or not. Contract at Jita 4-4.",
    )
    public.locations.add(locations[2])
    for p in (ore, ships, public):
        p.managers.add(demo.admin, *directors[:1])

    ItemRule.objects.bulk_create(
        [ItemRule(program=ships, type_id=t, tax=Decimal("-4") if t in (24698, 638) else Decimal(0)) for t in SHIPS if t not in (185, 2488)]
        + [ItemRule(program=ships, type_id=185, disallowed=True), ItemRule(program=ships, type_id=2488, static_price=Decimal("7500"))]
        + [ItemRule(program=public, type_id=t) for t in MINERALS]
        + [ItemRule(program=ore, type_id=40, tax=Decimal("-3")), ItemRule(program=ore, type_id=1230, tax=Decimal("4"))]
    )
    WatchRule.objects.bulk_create([WatchRule(program=ships, type_id=638), WatchRule(program=ore, type_id=40)])

    plans = (
        # program, items to pick from, ISK per line (roughly), how many quotes
        (ore, ORE, (4_000_000, 90_000_000), 40),
        (ships, (587, 603, 626, 621, 24698, 24702, 638, 2454, 2185), (5_000_000, 250_000_000), 18),
        (public, MINERALS, (10_000_000, 60_000_000), 8),
    )
    members = [c for c in demo.characters if c.corporation.alliance_id == demo.alliance.pk]
    quotes, contracts_ = [], []
    created = []
    for program, pool, (lo, hi), count in plans:
        watched = set(program.watch_rules.values_list("type_id", flat=True))
        rules = {r.type_id: r for r in program.item_rules.all()}
        prefix = program.tracking_prefix or s.tracking_prefix
        for n in range(count):
            # The demo account sells now and then too, so My buyback has something in it.
            seller = demo.admin.main_character if n % 6 == 0 else demo.pick(members)
            types = demo.sample(pool, demo.rng.randint(1, 4))
            items = [(t, max(1, int(demo.rng.uniform(lo, hi) / PRICES[t][0]))) for t in types]
            lines = _lines(demo, program, rules, watched, items)
            value = sum(Decimal(str(ln["value"])) for ln in lines).quantize(Decimal(1), rounding=ROUND_DOWN)
            when = demo.recent(330) if n > 3 else demo.recent(3)
            q = Quote(program=program, user=seller.user, tracking_number=_tracking(demo, prefix), lines=lines, value=value,
                      volume=round(sum(ln["volume"] for ln in lines), 2), flagged=any(ln["watch"] for ln in lines),
                      hub_name="Jita 4-4", public=program.public and demo.chance(0.5))
            quotes.append(q)
            created.append(when)
            if n == 1:
                continue  # quoted, never contracted
            if n <= 3:
                status = "outstanding"
            else:
                status = demo.rng.choices(["finished", "expired", "rejected", "deleted"], weights=[20, 1, 1, 1])[0]
            price = value
            location = program.locations.first().structure_id
            if n == 2:
                price = value + Decimal(demo.rng.randint(5, 40) * 100_000)  # asks more than quoted
            if n == 3 and program is ore:
                location = keepstar["id"] if location != keepstar["id"] else JITA_44
            done = when + timedelta(hours=demo.rng.uniform(1, 40))
            contracts_.append((q, Contract(
                contract_id=demo.next_id(), program=program, owner_id=owner.pk, issuer_id=seller.pk,
                issuer_corporation_id=seller.corporation_id, assignee_id=main.pk, for_corporation=True, title=q.tracking_number,
                status=status, price=price, volume=q.volume, start_location_id=location, date_issued=when,
                date_expired=when + timedelta(days=program.expiration_days),
                date_completed=done if status.startswith("finished") or status == "rejected" else None,
                items=[[ln["type_id"], ln["quantity"], True] for ln in lines],
            )))

    Quote.objects.bulk_create(quotes)
    for q, when in zip(quotes, created):
        q.created_at = when
    Quote.objects.bulk_update(quotes, ["created_at"])

    rows = []
    for q, c in contracts_:
        c.quote = q
        c.problems = contracts.check(c, q, c.program)
        rows.append(c)
    # A contract to the corporation that borrows the prefix with no quote behind it.
    impostor = demo.pick([c for c in demo.characters if c.corporation_id != main.pk])
    fake = Contract(contract_id=demo.next_id(), program=None, owner_id=owner.pk, issuer_id=impostor.pk,
                    issuer_corporation_id=impostor.corporation_id, assignee_id=main.pk, for_corporation=True,
                    title=_tracking(demo, s.tracking_prefix), status="outstanding", price=Decimal("850000000"), volume=0.01,
                    start_location_id=keepstar["id"], date_issued=demo.ago(hours=5), date_expired=demo.ahead(days=13),
                    items=[[40, 10, True]])
    fake.problems = contracts.check(fake, None, None)
    rows.append(fake)
    Contract.objects.bulk_create(rows)
