"""The moon mining ledger: what was mined from the corporations' moon drills in a month, by whom, and what it's worth.

Mining data comes from the corporation sheet (``conduit.corp`` keeps every observer report it syncs), so the
ledger covers everything since the corporation's first sync with an Accountant's login. Characters are grouped
under the member who owns them; characters nobody has registered are listed on their own.
"""

from __future__ import annotations

import calendar
from collections import defaultdict
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models.functions import TruncMonth
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.corp.models import MiningObservation, MoonExtraction, Structure
from conduit.eve.models import EveCorporation, portrait_url
from conduit.eve.tasks import names_for
from conduit.sde.models import ItemType, type_icon_url
from conduit.sheet.util import prices_by_type

from .models import Invoice, LedgerMonth, MoonSettings


class LedgerError(Exception):
    pass


# --- months -----------------------------------------------------------------------------------------------


def parse_month(text: str | None) -> date:
    """'2026-09' -> date(2026, 9, 1); empty means this month."""
    if not text:
        today = timezone.now().date()
        return today.replace(day=1)
    try:
        year, month = (int(p) for p in text.split("-"))
        if not 2003 <= year <= 2100:  # EVE launched in 2003; far-off years would overflow date arithmetic
            raise ValueError
        return date(year, month, 1)
    except ValueError:
        raise LedgerError("Use a month like 2026-09") from None


def month_end(month: date) -> date:
    """First day of the next month."""
    return month + timedelta(days=calendar.monthrange(month.year, month.month)[1])


def label(month: date) -> str:
    return month.strftime("%B %Y")


def observations(viewer=None):
    """Mining in the ledger's corporations; with ``viewer``, only corporations whose mining that person may see on the
    corporation sheet (the ledger shows who mined what and what it's worth, so the corporation permissions apply)."""
    settings = MoonSettings.load()
    qs = MiningObservation.objects.all()
    if settings.corporations:
        qs = qs.filter(corporation_id__in=settings.corporations)
    if viewer is not None:
        qs = qs.filter(corporation_id__in=visible_corporations(viewer))
    return qs


def visible_corporations(viewer) -> set[int]:
    """Corporations with mining data whose Mining section ``viewer`` may open on the corporation sheet."""
    from conduit.corp.access import can_view_section

    ids = set(MiningObservation.objects.values_list("corporation_id", flat=True).distinct())
    return {cid for cid in ids if can_view_section(viewer, cid, "mining")}


def require_all_corporations(viewer, month: date | None = None) -> None:
    """Closing or reopening a month, and the settings, cover every corporation in the ledger at once; only someone who
    may see all of them may do that."""
    qs = observations()
    if month is not None:
        qs = qs.filter(last_updated__gte=month, last_updated__lt=month_end(month))
    hidden = set(qs.values_list("corporation_id", flat=True).distinct()) - visible_corporations(viewer)
    if hidden:
        names = ", ".join(EveCorporation.objects.filter(pk__in=hidden).order_by("name").values_list("name", flat=True)) or "other corporations"
        raise LedgerError(f"This covers mining in corporations you can't see on the corporation sheet ({names}); "
                          "someone with access to all of them has to do it")


def months() -> list[dict]:
    """Every month with mining data (and this month), newest first, with whether it's closed."""
    found = {m.date() if hasattr(m, "date") else m for m in observations().annotate(m=TruncMonth("last_updated")).values_list("m", flat=True).distinct()}
    found.add(parse_month(None))
    closed = set(LedgerMonth.objects.values_list("month", flat=True))
    return [{"month": m.strftime("%Y-%m"), "label": label(m), "closed": m in closed} for m in sorted(found, reverse=True)]


# --- the ledger --------------------------------------------------------------------------------------------


def _isk(value: float | Decimal) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def ledger(month: date, user=None, viewer=None) -> dict:
    """The month's ledger; with ``user``, only that member's characters; with ``viewer``, only the corporations that
    person may see."""
    settings = MoonSettings.load()
    closed = LedgerMonth.objects.filter(month=month).first()
    rate = closed.tax_rate if closed else settings.tax_rate
    rows = observations(viewer).filter(last_updated__gte=month, last_updated__lt=month_end(month))
    if user is not None:
        rows = rows.filter(character_id__in=user.characters.values_list("pk", flat=True))
    rows = list(rows)

    type_ids = {r.type_id for r in rows}
    prices = {int(k): v for k, v in closed.prices.items()} if closed else prices_by_type(type_ids)
    types = dict(ItemType.objects.filter(pk__in=type_ids).values_list("id", "name"))
    characters = {c.pk: c for c in Character.objects.filter(pk__in={r.character_id for r in rows}).select_related("user__main_character")}
    names = names_for({r.character_id for r in rows} - set(characters))

    members: dict[str, dict] = {}
    moons: dict[int, dict] = defaultdict(lambda: {"value": 0.0, "quantity": 0, "miners": set()})
    ores: dict[int, dict] = defaultdict(lambda: {"value": 0.0, "quantity": 0})
    per_day: dict[str, float] = defaultdict(float)
    for r in rows:
        value = prices.get(r.type_id, 0.0) * r.quantity
        char = characters.get(r.character_id)
        if char is not None:
            owner = char.user
            key = f"u{owner.pk}"
            member = members.get(key) or members.setdefault(key, {
                "key": key, "user_id": owner.pk, "name": owner.display_name, "registered": True,
                "portrait": portrait_url(owner.main_character_id or char.pk, 64), "characters": {},
            })
            char_name = char.name
        else:
            key = f"c{r.character_id}"
            char_name = names.get(r.character_id, f"Character {r.character_id}")
            member = members.get(key) or members.setdefault(key, {
                "key": key, "user_id": None, "name": char_name, "registered": False,
                "portrait": portrait_url(r.character_id, 64), "characters": {},
            })
        c = member["characters"].setdefault(r.character_id, {"id": r.character_id, "name": char_name, "value": 0.0, "quantity": 0})
        c["value"] += value
        c["quantity"] += r.quantity
        moons[r.observer_id]["value"] += value
        moons[r.observer_id]["quantity"] += r.quantity
        moons[r.observer_id]["miners"].add(key)
        ores[r.type_id]["value"] += value
        ores[r.type_id]["quantity"] += r.quantity
        per_day[r.last_updated.isoformat()] += value

    invoices = {i.user_id: i for i in Invoice.objects.filter(month__month=month)} if closed else {}
    out_members = []
    for m in members.values():
        chars = sorted(m.pop("characters").values(), key=lambda c: -c["value"])
        value = sum(c["value"] for c in chars)
        inv = invoices.get(m["user_id"])
        out_members.append({
            **m,
            "characters": chars,
            "value": value,
            "quantity": sum(c["quantity"] for c in chars),
            "tax": float(inv.amount) if inv else float(_isk(value * float(rate) / 100)),
            "invoice": invoice_out(inv) if inv else None,
        })
    out_members.sort(key=lambda m: -m["value"])

    structure_names = dict(Structure.objects.filter(structure_id__in=moons).values_list("structure_id", "name"))
    moon_of = dict(MoonExtraction.objects.filter(structure_id__in=moons).order_by("extraction_start_time").values_list("structure_id", "moon_id"))
    moon_names = names_for(set(moon_of.values()))
    end = min(month_end(month), timezone.now().date() + timedelta(days=1))
    days = (end - month).days
    total = sum(m["value"] for m in out_members)
    taxed = [m for m in out_members if m["registered"]]
    return {
        "month": month.strftime("%Y-%m"),
        "label": label(month),
        "closed": closed is not None,
        "closed_at": closed.closed_at.isoformat() if closed else None,
        "can_close": closed is None and month_end(month) <= timezone.now().date(),
        "tax_rate": float(rate),
        "totals": {
            "value": total,
            "quantity": sum(m["quantity"] for m in out_members),
            "tax": sum(m["tax"] for m in taxed),
            "paid": sum(m["invoice"]["amount"] for m in taxed if m["invoice"] and m["invoice"]["paid"]),
            "members": len(taxed),
            "unregistered_value": sum(m["value"] for m in out_members if not m["registered"]),
        },
        "series": [{"date": (month + timedelta(days=i)).isoformat(), "value": per_day.get((month + timedelta(days=i)).isoformat(), 0.0)} for i in range(max(days, 0))],
        "members": out_members,
        "moons": sorted(
            ({"observer_id": oid, "name": structure_names.get(oid) or f"Structure {oid}", "moon": moon_names.get(moon_of.get(oid), ""),
              "value": v["value"], "quantity": v["quantity"], "miners": len(v["miners"])} for oid, v in moons.items()),
            key=lambda m: -m["value"],
        ),
        "ores": sorted(
            ({"type_id": tid, "name": types.get(tid, f"Type {tid}"), "icon": type_icon_url(tid, 32), "price": prices.get(tid, 0.0), **v}
             for tid, v in ores.items()),
            key=lambda o: -o["value"],
        ),
    }


def invoice_out(inv: Invoice) -> dict:
    return {
        "id": inv.pk,
        "month": inv.month.month.strftime("%Y-%m"),
        "label": label(inv.month.month),
        "value": float(inv.value),
        "amount": float(inv.amount),
        "paid": inv.paid,
        "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
    }


# --- closing months and payments ----------------------------------------------------------------------------


@transaction.atomic
def close_month(month: date, by) -> LedgerMonth:
    """Fix the month's prices and tax rate, and work out what each member owes. Tells everyone who owes something."""
    from conduit.notify.services import notify

    if month_end(month) > timezone.now().date():
        raise LedgerError("A month can be closed once it's over")
    if LedgerMonth.objects.filter(month=month).exists():
        raise LedgerError(f"{label(month)} is already closed")
    settings = MoonSettings.load()
    rows = observations().filter(last_updated__gte=month, last_updated__lt=month_end(month))
    prices = prices_by_type({r.type_id for r in rows})
    closed = LedgerMonth.objects.create(month=month, tax_rate=settings.tax_rate, prices={str(k): v for k, v in prices.items()}, closed_by=by)
    owed = []
    for m in ledger(month)["members"]:
        if not m["registered"] or m["value"] <= 0:
            continue
        amount = _isk(m["value"] * float(settings.tax_rate) / 100)
        owed.append(Invoice(month=closed, user_id=m["user_id"], value=_isk(m["value"]), amount=amount, paid=amount == 0))
    Invoice.objects.bulk_create(owed)
    for inv in owed:
        if inv.amount > 0:
            notify(inv.user_id, f"Moon tax for {label(month)}: {inv.amount:,.0f} ISK",
                   settings.payment_instructions or "See Moon mining for the details.",
                   link="/p/moons", level="info", category="p.moons")
    return closed


@transaction.atomic
def reopen_month(month: date) -> None:
    closed = LedgerMonth.objects.filter(month=month).first()
    if closed is None:
        raise LedgerError(f"{label(month)} isn't closed")
    if closed.invoices.filter(paid=True, amount__gt=0).exists():
        raise LedgerError("Some members have already paid for this month; mark those payments as unpaid first")
    closed.delete()


def set_paid(invoice_id: int, paid: bool, by) -> Invoice:
    inv = Invoice.objects.select_related("month").filter(pk=invoice_id).first()
    if inv is None:
        raise LedgerError("No such invoice")
    month = inv.month.month
    mined_in = set(observations().filter(last_updated__gte=month, last_updated__lt=month_end(month),
                                         character_id__in=inv.user.characters.values_list("pk", flat=True))
                   .values_list("corporation_id", flat=True).distinct())
    if mined_in - visible_corporations(by):
        raise LedgerError("This member mined in corporations you can't see on the corporation sheet")
    inv.paid = paid
    inv.paid_at = timezone.now() if paid else None
    inv.marked_by = by
    inv.save(update_fields=["paid", "paid_at", "marked_by"])
    return inv


def corporations(viewer=None) -> list[dict]:
    """Corporations with moon mining data, for the settings (with ``viewer``: those that person may see)."""
    ids = visible_corporations(viewer) if viewer is not None else set(MiningObservation.objects.values_list("corporation_id", flat=True).distinct())
    return [{"id": c.pk, "name": c.name, "ticker": c.ticker} for c in EveCorporation.objects.filter(pk__in=ids).order_by("name")]
