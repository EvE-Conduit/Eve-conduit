"""Wallets and loyalty points. Journals run back from today's balance, so the 30-day chart adds up: ratters get
CONCORD's bounty ticks, traders buy and sell in Jita and at the Keepstar (with the market transactions, taxes and
broker fees that go with them), and everyone pays for clones, skill books and the odd donation."""

from datetime import timedelta
from decimal import Decimal

from conduit.eve.models import EveName, MarketPrice
from conduit.sheet.loyalty.models import LoyaltyPoints
from conduit.sheet.wallet.models import JournalEntry, WalletBalance, WalletTransaction

from . import catalog
from .sheet_assets import items

CONCORD, SCC = 1000125, 1000132
NPC_CORPORATIONS = {
    CONCORD: "CONCORD", SCC: "Secure Commerce Commission", 1000035: "Caldari Navy", 1000180: "State Protectorate",
    1000181: "Federal Defense Union", 1000182: "Tribal Liberation Force", 1000179: "24th Imperial Crusade",
    1000051: "Republic Fleet", 1000084: "Amarr Navy", 1000120: "Federation Navy", 1000137: "DED",
}
TRADED = ("Tritanium", "Pyerite", "Mexallon", "Isogen", "Nocxium", "Large Shield Extender II", "Damage Control II",
          "Multispectrum Shield Hardener II", "Hail M", "Scourge Heavy Missile", "Nanite Repair Paste", "Hammerhead II",
          "Drake", "Hurricane", "Vexor", "Caracal", "Nitrogen Fuel Block", "Heavy Missile Launcher II")
DONATIONS = ("SRP", "fuel money", "for the Hulk", "thanks for the fleet o7", "loan, pay back next week", "corp tax refund",
             "PI share", "you won the raffle", "buyback")
SALES_TAX, BROKER_FEE = 0.036, 0.015


def _isk(value) -> Decimal:
    return Decimal(str(round(value, 2)))


def seed(demo):
    EveName.objects.bulk_create([EveName(id=i, name=n, category="corporation") for i, n in NPC_CORPORATIONS.items()],
                                ignore_conflicts=True)
    ids = items()
    traded = [ids[n] for n in TRADED if n in ids]
    prices = dict(MarketPrice.objects.filter(type_id__in=traded).values_list("type_id", "average_price"))
    markets = [demo.station_ids()[0], *(s["id"] for s in demo.structures[1:2])]
    systems = [s["system_id"] for s in demo.structures] or demo.system_ids()
    others = [c for c in demo.characters if c.user_id != demo.admin.pk]

    balances, journal, transactions, loyalty = [], [], [], []
    for c in demo.characters:
        is_admin = c.user_id == demo.admin.pk
        is_main = c.pk == c.user.main_character_id
        days = 90 if is_admin else 30
        if is_admin and is_main:
            kinds = {"ratter", "trader", "industry", "director"}
        elif is_admin:
            kinds = {"trader"} if c.pk % 2 == 0 else {"industry"}
        else:
            kinds = set(demo.sample(("ratter", "trader", "industry"), demo.rng.randint(1, 2) if is_main else 1))
        scale = 1.0 if is_admin else demo.rng.uniform(0.2, 1.0) if is_main else demo.rng.uniform(0.05, 0.4)

        # Every entry is (date, ref_type, amount, first party, second party, description, reason, context, tax,
        # transaction); the balances are filled in afterwards.
        rows = []

        def entry(date, ref_type, amount, first, second, description, reason="", context=(None, ""), tax=None, sale=None):
            date = min(date, demo.now - timedelta(minutes=1))
            rows.append((date, ref_type, _isk(amount), first, second, description, reason, context, tax, sale))

        if "ratter" in kinds:
            # A bounty payout every 20 minutes while ratting, a few sessions a week.
            for _ in range(int(days / 7 * demo.rng.randint(2, 5) * scale) + 1):
                session = demo.recent(days)
                system = demo.pick(systems)
                for tick in range(demo.rng.randint(3, 9)):
                    gross = demo.rng.uniform(3e6, 9e6)
                    entry(session + timedelta(minutes=20 * tick), "bounty_prizes", gross * 0.9, CONCORD, c.pk,
                          f"{c.name} got bounty prizes for killing pirates in {catalog.SYSTEMS.get(system, ('space',))[0]}",
                          context=(system, "system_id"),
                          tax=_isk(gross * 0.1))
                if demo.chance(0.3):
                    entry(session + timedelta(hours=3), "ess_escrow_transfer", demo.rng.uniform(5e6, 40e6), CONCORD, c.pk,
                          "ESS escrow payment")
        if "trader" in kinds:
            for _ in range(int(days * demo.rng.uniform(1.5, 4) * scale) + 2):
                type_id = demo.pick(traded)
                price = round((prices.get(type_id) or 1000) * demo.rng.uniform(0.92, 1.08), 2)
                quantity = max(1, int(demo.rng.uniform(5e6, 120e6) * scale / price))
                is_buy = demo.chance(0.45)
                client = demo.pick(others if is_admin else [x for x in demo.characters if x.user_id != c.user_id])
                date = demo.recent(days)
                total = price * quantity
                tid = demo.next_id()
                market = demo.pick(markets)
                buyer, seller = (c, client) if is_buy else (client, c)
                entry(date, "market_transaction", -total if is_buy else total, buyer.pk, seller.pk,
                      f"Market: {buyer.name} bought stuff from {seller.name}", context=(tid, "market_transaction_id"),
                      sale=(tid, type_id, quantity, price, is_buy, client.pk, market))
                if not is_buy:
                    entry(date, "transaction_tax", -total * SALES_TAX, c.pk, SCC, "Sales tax")
                entry(date - timedelta(hours=demo.rng.uniform(1, 72)), "brokers_fee", -total * BROKER_FEE, c.pk, SCC,
                      f"Market order commission to {c.name}")
        if "industry" in kinds:
            owner = demo.corporations[0].pk if demo.corporations else SCC
            for _ in range(int(days / 3 * scale) + 1):
                entry(demo.recent(days), "industry_job_tax", -demo.rng.uniform(0.2e6, 6e6) * scale, c.pk, owner,
                      "Industry job tax")
            for _ in range(int(days / 4 * scale) + 1):
                entry(demo.recent(days), "planetary_export_tax", -demo.rng.uniform(0.3e6, 2e6), c.pk, CONCORD,
                      "Planetary export tax")
        if "director" in kinds and demo.corporations:
            corp = demo.corporations[0]
            for _ in range(days // 6):
                pilot = demo.pick(others)
                entry(demo.recent(days), "player_donation", -demo.rng.uniform(20e6, 250e6), c.pk, pilot.pk,
                      f"{c.name} deposited cash into {pilot.name}'s account", reason="SRP")
            for _ in range(days // 15):
                entry(demo.recent(days), "corporation_account_withdrawal", demo.rng.uniform(200e6, 800e6), corp.pk, c.pk,
                      f"{corp.name} transferred cash from {corp.name}'s corporate account to {c.name}'s account",
                      reason="Director reimbursement")
        # Everyone: donations from friends, clone jumps, skill books.
        friends = [x for x in demo.characters if x.user_id != c.user_id]
        for _ in range(demo.rng.randint(1, 4)):
            friend = demo.pick(friends)
            entry(demo.recent(days), "player_donation", demo.rng.uniform(1e6, 60e6) * scale, friend.pk, c.pk,
                  f"{friend.name} deposited cash into {c.name}'s account", reason=demo.pick(DONATIONS))
        for _ in range(demo.rng.randint(0, 3)):
            entry(demo.recent(days), "jump_clone_activation_fee", -demo.rng.choice((750e3, 900e3, 1.2e6)), c.pk,
                  demo.corporations[0].pk if demo.corporations else SCC, "Jump clone activation fee")
        for _ in range(demo.rng.randint(0, 2)):
            entry(demo.recent(days), "skill_purchase", -demo.rng.choice((3.5e6, 12e6, 28e6, 85e6)), c.pk, SCC, "Skill book purchase")

        # Work back from today's balance; whoever would dip below zero simply started out richer.
        rows.sort(key=lambda r: r[0])
        target = _isk(demo.rng.uniform(3.8e9, 4.6e9) if is_admin and is_main else demo.rng.uniform(5e7, 2.5e9) * scale)
        running, lowest = target, target
        for r in reversed(rows):
            running -= r[2]
            lowest = min(lowest, running)
        balance = target - lowest + _isk(demo.rng.uniform(1e6, 2e7)) if lowest < 0 else target
        balances.append(WalletBalance(character=c, balance=balance))
        running = balance
        for r in reversed(rows):
            date, ref_type, amount, first, second, description, reason, (context, context_type), tax, sale = r
            ref_id = demo.next_id()
            journal.append(JournalEntry(
                character=c, ref_id=ref_id, date=date, ref_type=ref_type, amount=amount, balance=running,
                description=description, reason=reason, first_party_id=first, second_party_id=second,
                context_id=context, context_id_type=context_type, tax=tax,
            ))
            running -= amount
            if sale:
                tid, type_id, quantity, price, is_buy, client, market = sale
                transactions.append(WalletTransaction(
                    character=c, transaction_id=tid, date=date, type_id=type_id, quantity=quantity, unit_price=_isk(price),
                    is_buy=is_buy, client_id=client, location_id=market, journal_ref_id=ref_id,
                ))

        # Loyalty points: missions and faction warfare for some, the odd CONCORD reward for everyone else.
        count = 4 if is_admin and is_main else demo.rng.randint(1 if is_main else 0, 2)
        corps = demo.sample([i for i in NPC_CORPORATIONS if i != SCC], count)
        loyalty += [LoyaltyPoints(character=c, corporation_id=corp, points=int(demo.rng.uniform(800, 120_000) * (3 if is_admin else 1)))
                    for corp in corps]

    WalletBalance.objects.bulk_create(balances)
    JournalEntry.objects.bulk_create(journal, batch_size=2000)
    WalletTransaction.objects.bulk_create(transactions, batch_size=2000)
    LoyaltyPoints.objects.bulk_create(loyalty)
