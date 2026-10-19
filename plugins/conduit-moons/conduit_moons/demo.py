"""Example data for demo mode (Plugin.demo_data): moon tax settings, three months of moon mining (two of them closed,
with invoices, most paid), and the mining itself when the corporation sheet's example data has none."""

from collections import defaultdict
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from conduit.corp.models import MiningObservation, MoonExtraction, Structure
from conduit.eve.models import EveName, MarketPrice
from conduit.sde.models import ItemType

from .models import Invoice, LedgerMonth, MoonSettings
from .services import month_end

#: Moon ores and a believable price per unit, used when the static data has them.
MOON_ORES = {45490: 2_100.0, 45491: 2_350.0, 45492: 2_600.0, 45493: 2_250.0, 45494: 9_800.0, 45495: 11_200.0, 45497: 10_400.0}
#: Asteroid ores of the demo's fallback catalog, for a site without the static data.
FALLBACK_ORES = {1230: 18.0, 1228: 30.0, 1224: 95.0, 18: 70.0, 1227: 160.0}
#: Moon drills: (name, system id, Athanor type id, made-up moon id, moon name, owner: index into demo.corporations)
DRILLS = (("Hek - Deep Void Refinery", 30002053, 35835, 49_000_001, "Hek VIII - Moon 3", 2),
          ("Perimeter - Aurora Moon Drill", 30000144, 35835, 49_000_002, "Perimeter II - Moon 1", 0))


def _isk(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def _ores():
    known = set(ItemType.objects.filter(pk__in=MOON_ORES).values_list("pk", flat=True))
    return {t: p for t, p in MOON_ORES.items() if t in known} or FALLBACK_ORES


def _drills(demo):
    """The moon drills: (structure id, owner, moon id, moon name), adding them to the corporation sheet if it doesn't
    have them."""
    ids = []
    for name, system_id, type_id, moon_id, moon_name, owner in DRILLS:
        corp = demo.corporations[owner]
        known = next((s["id"] for s in demo.structures if s["name"] == name), None)
        sid = known or demo.next_id()
        Structure.objects.get_or_create(structure_id=sid, defaults={
            "corporation": corp, "name": name, "type_id": type_id, "system_id": system_id, "state": "shield_vulnerable",
            "fuel_expires": demo.ahead(days=demo.rng.uniform(15, 40)), "services": [{"name": "Moon Drilling", "state": "online"}],
        })
        ids.append((sid, corp, moon_id, moon_name))
    return ids


def _mining(demo, drills, ores, first_day, last_day):
    """Mining ops on most evenings at the drills, from ``first_day`` to ``last_day``."""
    members = [c for c in demo.characters if c.corporation_id in {x.pk for x in demo.corporations}]
    miners = demo.sample(members, 14)
    # Two pilots outside the site who mine there too (alts nobody has registered).
    outsiders = [demo.next_id(), demo.next_id()]
    EveName.objects.bulk_create([EveName(id=outsiders[0], name="Brin Halloway", category="character"),
                                 EveName(id=outsiders[1], name="Osk Vandermeer", category="character")], ignore_conflicts=True)
    rows, seen = [], set()
    day = first_day
    while day <= last_day:
        if demo.chance(0.6):  # an evening with a mining op
            sid, corp, *_ = demo.pick(drills)
            for char_id in [c.pk for c in demo.sample(miners, demo.rng.randint(3, 9))] + ([demo.pick(outsiders)] if demo.chance(0.2) else []):
                for type_id in demo.sample(list(ores), demo.rng.randint(1, 2)):
                    key = (sid, char_id, type_id, day)
                    if key in seen:
                        continue
                    seen.add(key)
                    rows.append(MiningObservation(corporation=corp, observer_id=sid, character_id=char_id, recorded_corporation_id=corp.pk,
                                                  type_id=type_id, quantity=demo.rng.randint(4_000, 45_000), last_updated=day))
        day += timedelta(days=1)
    MiningObservation.objects.bulk_create(rows)


def seed(demo):
    corp = demo.corporations[0]
    corp_ids = [c.pk for c in demo.corporations]
    MoonSettings.objects.update_or_create(pk=1, defaults={
        "tax_rate": Decimal("10.00"), "corporations": corp_ids,
        "payment_instructions": f"Give the ISK to {corp.name} (corporation wallet, division Moon Tax), reason MOON-<month>.",
    })
    ores = _ores()
    this_month = demo.now.date().replace(day=1)
    previous = (this_month - timedelta(days=1)).replace(day=1)
    before = (previous - timedelta(days=1)).replace(day=1)

    existing = MiningObservation.objects.filter(corporation_id__in=corp_ids)
    if existing.exists():
        # The corporation sheet's example data has the last few weeks; add the months before at the same drills.
        drills = list(existing.values_list("observer_id", "corporation").distinct())
        drills = [(sid, next(c for c in demo.corporations if c.pk == cid)) for sid, cid in drills]
        mined = set(existing.values_list("type_id", flat=True).distinct())
        ores = {t: MOON_ORES.get(t, 5_000.0) for t in mined}
        first = min(existing.values_list("last_updated", flat=True))
        _mining(demo, drills, ores, before, first - timedelta(days=1))
    else:
        drills = _drills(demo)
        _mining(demo, drills, ores, before, demo.now.date())
        EveName.objects.bulk_create([EveName(id=m, name=n, category="moon") for *_, m, n in drills], ignore_conflicts=True)
        extractions = []
        for sid, owner, moon_id, _ in drills:
            for k in range(-2, 2):  # two past chunks, the current one and the next
                start = demo.now + timedelta(days=k * 14 - demo.rng.uniform(1, 3))
                extractions.append(MoonExtraction(corporation=owner, structure_id=sid, moon_id=moon_id, extraction_start_time=start,
                                                  chunk_arrival_time=start + timedelta(days=13), natural_decay_time=start + timedelta(days=13, hours=3)))
        MoonExtraction.objects.bulk_create(extractions, ignore_conflicts=True)

    # Today's prices for the open month, for every ore mined (the market sheet may already have some).
    mined = set(MiningObservation.objects.filter(corporation_id__in=corp_ids).values_list("type_id", flat=True).distinct())
    MarketPrice.objects.bulk_create([MarketPrice(type_id=t, average_price=ores.get(t, 5_000.0), adjusted_price=ores.get(t, 5_000.0))
                                     for t in mined], ignore_conflicts=True)
    ores = {t: p or 5_000.0 for t, p in MarketPrice.objects.filter(type_id__in=mined).values_list("type_id", "average_price")}

    # The two months before this one are closed, with what everyone owed; the older is paid in full, the last mostly.
    owner = {c.pk: c.user_id for c in demo.characters}
    for month, paid_share in ((before, 1.0), (previous, 0.6)):
        prices = {t: round(p * demo.rng.uniform(0.9, 1.1), 2) for t, p in ores.items()}
        closed_at = demo.now.replace(year=month_end(month).year, month=month_end(month).month, day=demo.rng.randint(1, 3), hour=19)
        closed_at = min(closed_at, demo.ago(hours=2))
        ledger = LedgerMonth.objects.create(month=month, tax_rate=Decimal("10.00"), prices={str(t): p for t, p in prices.items()},
                                            closed_by=demo.admin)
        LedgerMonth.objects.filter(pk=ledger.pk).update(closed_at=closed_at)
        value = defaultdict(float)
        rows = MiningObservation.objects.filter(corporation_id__in=corp_ids, last_updated__gte=month, last_updated__lt=month_end(month))
        for char_id, type_id, quantity in rows.values_list("character_id", "type_id", "quantity"):
            if char_id in owner:
                value[owner[char_id]] += prices.get(type_id, 0.0) * quantity
        invoices = []
        for user_id, v in sorted(value.items()):
            paid = demo.chance(paid_share)
            invoices.append(Invoice(month=ledger, user_id=user_id, value=_isk(v), amount=_isk(v * 0.10), paid=paid,
                                    paid_at=min(closed_at + timedelta(days=demo.rng.uniform(0.5, 12)), demo.ago(hours=1)) if paid else None,
                                    marked_by=demo.admin if paid else None))
        Invoice.objects.bulk_create(invoices)
