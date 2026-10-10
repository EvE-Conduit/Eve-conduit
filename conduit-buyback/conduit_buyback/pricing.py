"""Reading pasted item lists and valuing them under a program's rules."""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass, field
from decimal import ROUND_DOWN, Decimal

from django.db.models.functions import Lower

from conduit.sde.models import ItemType, TypeMaterial, type_icon_url

from . import market, prices
from .models import BuybackSettings, ItemPrice, Program

ASTEROID_CATEGORY = 25  # ore, moon ore and ice, raw and compressed
MODULE_CATEGORY = 7
TECH_I_META = 1
BLUE_LOOT_GROUP = 880  # Sleeper Components
RED_LOOT_GROUP = 1995  # Triglavian Data
MAX_LINES = 1000
MAX_QUANTITY = 2_000_000_000

D0 = Decimal(0)
D100 = Decimal(100)
CENT = Decimal("0.01")

METHODS = {
    "market": "Market price",
    "raw": "Raw ore",
    "compressed": "Compressed",
    "refined": "Refined minerals",
    "t1_refined": "Reprocessed",
    "npc": "NPC buy price",
    "fixed": "Fixed price",
}


# --- reading pastes -----------------------------------------------------------------------------------------------

_SEPARATED = re.compile(r"^\d{1,3}(?:[,.'   ]\d{3})+$")
_QTY = r"(\d{1,3}(?:[,.'   ]\d{3})+|\d+)"
_X_AFTER = re.compile(rf"^(?P<name>.+?)\s+[xX×]\s*{_QTY}$")  # Tritanium x 1000
_X_BEFORE = re.compile(rf"^{_QTY}\s*[xX×]\s+(?P<name>.+)$")  # 1000 x Tritanium
_NUM_BEFORE = re.compile(rf"^{_QTY}\s+(?P<name>\D.*)$")  # 1000 Tritanium
_NUM_AFTER = re.compile(rf"^(?P<name>.*\D)\s+{_QTY}$")  # Tritanium 1000


def parse_quantity(text: str) -> int | None:
    text = text.strip()
    if not text:
        return None
    if _SEPARATED.match(text):
        text = re.sub(r"\D", "", text)
    elif not text.isdigit():
        return None
    return int(text)


@dataclass
class PastedLine:
    name: str
    quantity: int
    #: Shown without a quantity in the inventory's list view: assembled (unpacked).
    assembled: bool = False


def parse(text: str) -> list[PastedLine]:
    """Lines copied from the game: the inventory (list or detail view), contracts, the mining ledger or survey
    scanner (tab-separated, name first), or typed as ``Name x 10``, ``10 x Name``, ``10 Name`` or ``Name 10``."""
    out = []
    for raw in text.splitlines()[:MAX_LINES]:
        line = raw.strip().rstrip("*").strip()
        if not line:
            continue
        if "\t" in raw:
            cells = [c.strip() for c in raw.split("\t")]
            name = cells[0].rstrip("*").strip()
            if not name:
                continue
            qty = parse_quantity(cells[1]) if len(cells) > 1 else None
            out.append(PastedLine(name, qty if qty is not None else 1, assembled=len(cells) > 2 and not cells[1]))
            continue
        for pattern in (_X_AFTER, _X_BEFORE, _NUM_BEFORE, _NUM_AFTER):
            m = pattern.match(line)
            if m:
                qty = parse_quantity(m.group(1) if pattern in (_X_BEFORE, _NUM_BEFORE) else m.group(2))
                if qty is not None:
                    out.append(PastedLine(m.group("name").strip(), qty))
                    break
        else:
            out.append(PastedLine(line, 1))
    return out


# --- valuing --------------------------------------------------------------------------------------------------------


@dataclass
class Appraisal:
    lines: list[dict] = field(default_factory=list)
    unknown: list[str] = field(default_factory=list)
    value: Decimal = D0
    volume: float = 0.0
    flagged: bool = False
    #: The market it was priced at.
    hub: str = ""

    @property
    def accepted(self) -> list[dict]:
        return [ln for ln in self.lines if ln["accepted"]]

    @property
    def rejected(self) -> list[dict]:
        return [ln for ln in self.lines if not ln["accepted"]]


def _volume(t: ItemType) -> float:
    return float(t.packaged_volume if t.packaged_volume is not None else (t.volume or 0))


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT)


class _Context:
    """Everything valuing a set of types needs, loaded in a few queries."""

    def __init__(self, program: Program, type_ids: set[int], settings: BuybackSettings, hub: market.Hub):
        self.program = program
        self.types = {t.pk: t for t in ItemType.objects.filter(pk__in=type_ids).select_related("group")}
        compressed_ids = {t.compressed_type_id for t in self.types.values() if t.compressed_type_id}
        self.types.update({t.pk: t for t in ItemType.objects.filter(pk__in=compressed_ids - set(self.types)).select_related("group")})
        #: Compressed ore and ice: they are what something else compresses into.
        self.compressed = set(ItemType.objects.filter(compressed_type_id__in=type_ids).values_list("compressed_type_id", flat=True))
        self.rules = {r.type_id: r for r in program.item_rules.filter(type_id__in=type_ids)}
        watch = list(program.watch_rules.all())
        self.watch_types = {w.type_id for w in watch if w.type_id}
        self.watch_groups = {w.group_id for w in watch if w.group_id}
        refine = [t for t in type_ids if t in self.types and self._refinable(self.types[t])]
        self.materials: dict[int, list[tuple[int, int]]] = defaultdict(list)
        for m in TypeMaterial.objects.filter(type_id__in=refine):
            self.materials[m.type_id].append((m.material_type_id, m.quantity))
        wanted = set(type_ids) | compressed_ids | {mid for mats in self.materials.values() for mid, _ in mats}
        self.prices: dict[int, ItemPrice] = prices.get(wanted, settings, hub)
        self.settings = settings
        self.history = market.histories([t for t in wanted if t in self.prices], settings, hub)
        #: What the manipulation guard made of each market price used.
        self.checks: dict[int, market.Check] = {}

    def is_ore(self, t: ItemType) -> bool:
        return t.group.category_id == ASTEROID_CATEGORY

    def is_t1_module(self, t: ItemType) -> bool:
        return t.group.category_id == MODULE_CATEGORY and t.meta_group_id == TECH_I_META

    def _refinable(self, t: ItemType) -> bool:
        p = self.program
        return (self.is_ore(t) and p.use_refined) or (self.is_t1_module(t) and p.t1_refined)

    def market(self, type_id: int) -> Decimal:
        price = self.prices.get(type_id)
        current = price.price(self.program.price_type) if price else D0
        if not self.settings.guard_enabled or type_id not in self.history:
            return current
        if type_id not in self.checks:
            self.checks[type_id] = market.check(current, self.history[type_id], self.settings)
        return self.checks[type_id].price

    def guarded(self, type_ids) -> list[market.Check]:
        """Checks that changed a price, for these types."""
        return [self.checks[t] for t in type_ids if t in self.checks and self.checks[t].used != "current"]

    def refined(self, t: ItemType, rate: Decimal) -> Decimal:
        """ISK per unit from reprocessing at ``rate`` percent."""
        mats = self.materials.get(t.pk)
        if not mats:
            return D0
        portion = Decimal(max(t.portion_size or 1, 1))
        total = sum((Decimal(qty) * self.market(mid) for mid, qty in mats), D0)
        return total * rate / D100 / portion


def _candidates(ctx: _Context, t: ItemType) -> dict[str, Decimal]:
    """The ways the program may value the type, ISK per unit before tax; the best one is used."""
    p = ctx.program
    if t.group_id == BLUE_LOOT_GROUP and p.blue_loot_npc or t.group_id == RED_LOOT_GROUP and p.red_loot_npc:
        return {"npc": Decimal(str(t.base_price or 0))}
    if ctx.is_ore(t):
        out = {}
        if t.pk in ctx.compressed:
            if p.use_compressed:
                out["compressed"] = ctx.market(t.pk)
        elif p.use_raw:
            out["raw"] = ctx.market(t.pk)
        if p.use_compressed and t.compressed_type_id:
            out["compressed"] = ctx.market(t.compressed_type_id)  # one unit compresses into one unit
        if p.use_refined:
            out["refined"] = ctx.refined(t, p.refining_rate)
        return out or {"market": ctx.market(t.pk)}
    if p.t1_refined and ctx.is_t1_module(t):
        return {"t1_refined": ctx.refined(t, p.t1_refining_rate)}
    return {"market": ctx.market(t.pk)}


def _guard(ctx: _Context, t: ItemType, method: str) -> dict:
    """What the manipulation guard did to the price the line uses. A price it couldn't trust (far off its average,
    and the item rarely trades) puts the item on the manual review list."""
    if method in ("market", "raw", "compressed"):
        type_id = t.compressed_type_id if method == "compressed" and t.pk not in ctx.compressed else t.pk
        own = ctx.checks.get(type_id)
        if own is None:
            return {}
        return {"guard": own.out(), **({"watch": True} if own.used == "lower" else {})}
    if method in ("refined", "t1_refined"):
        changed = ctx.guarded(mid for mid, _ in ctx.materials.get(t.pk, ()))
        if changed:
            return {"guard": {"used": "materials", "materials": len(changed)}, **({"watch": True} if any(c.used == "lower" for c in changed) else {})}
    return {}


def _line(ctx: _Context, t: ItemType, quantity: int, assembled: bool) -> dict:
    p = ctx.program
    rule = ctx.rules.get(t.pk)
    volume = _volume(t)
    line = {
        "type_id": t.pk,
        "name": t.name,
        "group": t.group.name,
        "icon": type_icon_url(t.pk, 32),
        "quantity": quantity,
        "volume": volume * quantity,
        "accepted": False,
        "reason": "",
        "method": None,
        "market_unit": 0.0,
        "tax": 0.0,
        "density_tax": False,
        "hauling_unit": 0.0,
        "unit_price": 0.0,
        "value": 0.0,
        "options": {},
        "watch": t.pk in ctx.watch_types or t.group_id in ctx.watch_groups,
        "guard": None,
    }
    if rule and rule.disallowed:
        return {**line, "reason": "Not bought by this program"}
    if not p.allow_all_items and rule is None:
        return {**line, "reason": "Not on this program's list"}
    if assembled and not p.allow_unpacked:
        return {**line, "reason": "Assembled: repackage it first"}

    if rule and rule.static_price is not None:
        unit = rule.static_price
        return {**line, "accepted": unit > 0, "reason": "" if unit > 0 else "No price", "method": "fixed",
                "market_unit": float(unit), "unit_price": float(unit), "value": float(_money(unit * quantity))}

    options = _candidates(ctx, t)
    method, gross = max(options.items(), key=lambda kv: kv[1])
    line["options"] = {k: float(_money(v)) for k, v in options.items()}
    line.update(_guard(ctx, t, method))
    if gross <= 0:
        return {**line, "method": method, "reason": "No market price"}

    tax = p.tax + (rule.tax if rule else D0)
    cost_volume = volume
    if p.compressed_volume and t.compressed_type_id and t.compressed_type_id in ctx.types:
        cost_volume = _volume(ctx.types[t.compressed_type_id])
    density = cost_volume > 0 and p.price_density_threshold > 0 and gross / Decimal(str(cost_volume)) < p.price_density_threshold
    if density:
        tax += p.price_density_tax
    tax = min(max(tax, -D100), D100)
    hauling = p.hauling_fuel_cost * Decimal(str(cost_volume))
    unit = max(gross * (D100 - tax) / D100 - hauling, D0)
    return {
        **line,
        "accepted": unit > 0,
        "reason": "" if unit > 0 else "Costs more to haul than it's worth",
        "method": method,
        "market_unit": float(_money(gross)),
        "tax": float(tax),
        "density_tax": bool(density),
        "hauling_unit": float(_money(hauling)),
        "unit_price": float(_money(unit)),
        "value": float(_money(unit * quantity)),
    }


def appraise(program: Program, pasted: list[PastedLine], settings: BuybackSettings | None = None) -> Appraisal:
    s = settings or BuybackSettings.load()
    hub = market.program_hub(program, s)
    out = Appraisal(hub=hub.name)
    names = {ln.name.lower() for ln in pasted}
    found: dict[str, int] = {}
    for tid, lname, published in (
        ItemType.objects.annotate(lname=Lower("name")).filter(lname__in=names).order_by("published").values_list("pk", "lname", "published")
    ):
        found[lname] = tid  # published types come last and win
    totals: dict[int, int] = defaultdict(int)
    assembled: set[int] = set()
    for ln in pasted:
        tid = found.get(ln.name.lower())
        if tid is None:
            if ln.name not in out.unknown:
                out.unknown.append(ln.name)
            continue
        totals[tid] = min(totals[tid] + ln.quantity, MAX_QUANTITY)
        if ln.assembled:
            assembled.add(tid)
    if not totals:
        return out
    ctx = _Context(program, set(totals), s, hub)
    for tid, qty in totals.items():
        if tid in ctx.types:
            out.lines.append(_line(ctx, ctx.types[tid], qty, tid in assembled))
    out.lines.sort(key=lambda ln: (not ln["accepted"], -ln["value"], ln["name"]))
    accepted = out.accepted
    # Whole ISK, rounded down: easy to type into the contract and never more than quoted.
    out.value = sum((Decimal(str(ln["value"])) for ln in accepted), D0).quantize(Decimal(1), rounding=ROUND_DOWN)
    out.volume = round(sum(ln["volume"] for ln in accepted), 2)
    out.flagged = any(ln["watch"] for ln in accepted)
    return out
