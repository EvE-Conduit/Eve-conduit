"""Corp tax: the tax the corporations took from each member's bounties, ESS payouts and missions, and an extra tax on it.

The data comes from the corporation sheet's wallets (``conduit.corp`` keeps every journal entry it syncs), so the
ledger covers everything since the corporation's first sync with an Accountant's login. Each tax entry names the
character who earned the income; characters are grouped under the member who owns them, and characters nobody has
registered are listed on their own.

Members owe ``rate`` % of what the corporation took from them. Once a month is over it's closed, which bills every
member. Donations to a tax corporation whose reason has the payment word (as a word of its own) settle bills, oldest first.
"""

from __future__ import annotations

import calendar
import re
from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import F
from django.db.models.functions import TruncMonth
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.corp.models import CorpJournalEntry, CorporationInfo
from conduit.eve.models import EveCorporation, portrait_url
from conduit.eve.tasks import names_for

from .models import TAX_REF_TYPES, Invoice, LedgerMonth, Payment, Settlement, TaxSettings

#: Below this, ids are NPC corporations, factions and agents (CONCORD is 1000125), never a player's character.
NPC_MAX_ID = 3_000_000


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


def _at(day: date) -> datetime:
    """Midnight EVE time (UTC) at the start of ``day``, for filtering journal dates."""
    return datetime.combine(day, time.min, tzinfo=UTC)


def label(month: date) -> str:
    return month.strftime("%B %Y")


def entries(viewer=None):
    """Tax entries in the ledger's corporations; with ``viewer``, only corporations whose wallets that person may see
    on the corporation sheet (the ledger shows what each member earned, so the corporation permissions apply)."""
    settings = TaxSettings.load()
    qs = CorpJournalEntry.objects.filter(ref_type__in=settings.ref_types or [], amount__gt=0)
    if settings.corporations:
        qs = qs.filter(corporation_id__in=settings.corporations)
    if viewer is not None:
        qs = qs.filter(corporation_id__in=visible_corporations(viewer))
    return qs


def in_month(qs, month: date):
    return qs.filter(date__gte=_at(month), date__lt=_at(month_end(month)))


def visible_corporations(viewer) -> set[int]:
    """Corporations with tax entries whose Wallets section ``viewer`` may open on the corporation sheet."""
    from conduit.corp.access import can_view_section

    ids = set(CorpJournalEntry.objects.filter(ref_type__in=TAX_REF_TYPES).values_list("corporation_id", flat=True).distinct())
    return {cid for cid in ids if can_view_section(viewer, cid, "wallets")}


def require_all_corporations(viewer, month: date | None = None) -> None:
    """Closing or reopening a month, and the settings, cover every corporation in the ledger at once; only someone who
    may see all of them may do that."""
    qs = entries()
    if month is not None:
        qs = in_month(qs, month)
    hidden = set(qs.values_list("corporation_id", flat=True).distinct()) - visible_corporations(viewer)
    if hidden:
        names = ", ".join(EveCorporation.objects.filter(pk__in=hidden).order_by("name").values_list("name", flat=True)) or "other corporations"
        raise LedgerError(f"This covers wallets of corporations you can't see on the corporation sheet ({names}); "
                          "someone with access to all of them has to do it")


def months() -> list[dict]:
    """Every month with tax entries (and this month), newest first, with whether it's closed."""
    found = {m.date() if hasattr(m, "date") else m for m in entries().annotate(m=TruncMonth("date", tzinfo=UTC)).values_list("m", flat=True).distinct()}
    found.add(parse_month(None))
    closed = set(LedgerMonth.objects.values_list("month", flat=True))
    return [{"month": m.strftime("%Y-%m"), "label": label(m), "closed": m in closed} for m in sorted(found, reverse=True)]


def earner(entry) -> int | None:
    """The character whose income the corporation taxed: the party that isn't the corporation or an NPC (for bounties
    the first party is CONCORD and the second the pilot)."""
    for party in (entry.second_party_id, entry.first_party_id):
        if party and party > NPC_MAX_ID and party != entry.corporation_id:
            return party
    return None


# --- the ledger --------------------------------------------------------------------------------------------


def _isk(value: float | Decimal) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def owed(collected: float, rate: Decimal, minimum: Decimal) -> Decimal:
    amount = _isk(collected * float(rate) / 100)
    return amount if amount >= minimum else Decimal(0)


def ledger(month: date, user=None, viewer=None) -> dict:
    """The month's ledger; with ``user``, only that member's characters; with ``viewer``, only the corporations that
    person may see."""
    settings = TaxSettings.load()
    closed = LedgerMonth.objects.filter(month=month).first()
    rate = closed.rate if closed else settings.rate
    minimum = closed.minimum if closed else settings.minimum
    rows = [(e, earner(e)) for e in in_month(entries(viewer), month).only(
        "corporation_id", "date", "ref_type", "amount", "first_party_id", "second_party_id")]
    rows = [(e, cid) for e, cid in rows if cid]
    if user is not None:
        mine = set(user.characters.values_list("pk", flat=True))
        rows = [(e, cid) for e, cid in rows if cid in mine]

    corp_rates = dict(CorporationInfo.objects.filter(corporation_id__in={e.corporation_id for e, _ in rows}).values_list("corporation_id", "tax_rate"))
    characters = {c.pk: c for c in Character.objects.filter(pk__in={cid for _, cid in rows}).select_related("user__main_character")}
    names = names_for({cid for _, cid in rows} - set(characters))

    members: dict[str, dict] = {}
    kinds: dict[str, float] = defaultdict(float)
    per_day: dict[str, float] = defaultdict(float)
    for e, cid in rows:
        amount = float(e.amount)
        # What the member earned before tax, when the corporation's tax rate is known (it's today's rate).
        corp_rate = corp_rates.get(e.corporation_id) or 0
        earned = amount / corp_rate if corp_rate > 0 else 0.0
        char = characters.get(cid)
        if char is not None:
            owner = char.user
            key = f"u{owner.pk}"
            member = members.get(key) or members.setdefault(key, {
                "key": key, "user_id": owner.pk, "name": owner.display_name, "registered": True,
                "portrait": portrait_url(owner.main_character_id or char.pk, 64), "characters": {},
            })
            char_name = char.name
        else:
            key = f"c{cid}"
            char_name = names.get(cid, f"Character {cid}")
            member = members.get(key) or members.setdefault(key, {
                "key": key, "user_id": None, "name": char_name, "registered": False,
                "portrait": portrait_url(cid, 64), "characters": {},
            })
        c = member["characters"].setdefault(cid, {"id": cid, "name": char_name, "collected": 0.0, "earned": 0.0, "kinds": defaultdict(float)})
        c["collected"] += amount
        c["earned"] += earned
        c["kinds"][e.ref_type] += amount
        kinds[e.ref_type] += amount
        per_day[e.date.date().isoformat()] += amount

    invoices = {i.user_id: i for i in Invoice.objects.filter(month__month=month)} if closed else {}
    out_members = []
    for m in members.values():
        chars = sorted(m.pop("characters").values(), key=lambda c: -c["collected"])
        for c in chars:
            c["kinds"] = dict(c["kinds"])
        collected = sum(c["collected"] for c in chars)
        inv = invoices.get(m["user_id"])
        out_members.append({
            **m,
            "characters": chars,
            "collected": collected,
            "earned": sum(c["earned"] for c in chars),
            "tax": float(inv.amount) if inv else float(owed(collected, rate, minimum)) if m["registered"] else 0.0,
            "invoice": invoice_out(inv) if inv else None,
        })
    out_members.sort(key=lambda m: -m["collected"])

    end = min(month_end(month), timezone.now().date() + timedelta(days=1))
    days = (end - month).days
    taxed = [m for m in out_members if m["registered"]]
    return {
        "month": month.strftime("%Y-%m"),
        "label": label(month),
        "closed": closed is not None,
        "closed_at": closed.closed_at.isoformat() if closed else None,
        "can_close": closed is None and month_end(month) <= timezone.now().date(),
        "rate": float(rate),
        "minimum": float(minimum),
        "totals": {
            "collected": sum(m["collected"] for m in out_members),
            "earned": sum(m["earned"] for m in out_members),
            "tax": sum(m["tax"] for m in taxed),
            "paid": sum(m["invoice"]["amount"] for m in taxed if m["invoice"] and m["invoice"]["paid"]),
            "members": len([m for m in taxed if m["tax"] > 0]),
            "unregistered_collected": sum(m["collected"] for m in out_members if not m["registered"]),
        },
        "series": [{"date": (month + timedelta(days=i)).isoformat(), "value": per_day.get((month + timedelta(days=i)).isoformat(), 0.0)} for i in range(max(days, 0))],
        "members": out_members,
        "kinds": sorted(({"ref_type": k, "label": TAX_REF_TYPES.get(k, k), "collected": v} for k, v in kinds.items()), key=lambda k: -k["collected"]),
    }


def reference(month: date) -> str:
    """What members put in the reason of their payment, e.g. "TAX 2026-09"."""
    word = TaxSettings.load().payment_reason
    return f"{word} {month:%Y-%m}" if word else ""


def invoice_out(inv: Invoice) -> dict:
    return {
        "id": inv.pk,
        "month": inv.month.month.strftime("%Y-%m"),
        "label": label(inv.month.month),
        "collected": float(inv.collected),
        "amount": float(inv.amount),
        "paid": inv.paid,
        "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
        "paid_from_wallet": inv.paid and inv.marked_by_id is None,
        "reference": reference(inv.month.month),
    }


# --- closing months and payments ----------------------------------------------------------------------------


@transaction.atomic
def close_month(month: date, by) -> LedgerMonth:
    """Fix the month's rate and work out what each member owes. Tells everyone who owes something."""
    from conduit.notify.services import notify

    if month_end(month) > timezone.now().date():
        raise LedgerError("A month can be closed once it's over")
    if LedgerMonth.objects.filter(month=month).exists():
        raise LedgerError(f"{label(month)} is already closed")
    settings = TaxSettings.load()
    closed = LedgerMonth.objects.create(month=month, rate=settings.rate, minimum=settings.minimum, closed_by=by)
    bills = []
    for m in ledger(month)["members"]:
        amount = owed(m["collected"], settings.rate, settings.minimum)
        if m["registered"] and amount > 0:
            bills.append(Invoice(month=closed, user_id=m["user_id"], collected=_isk(m["collected"]), amount=amount))
    Invoice.objects.bulk_create(bills)
    ref = reference(month)
    for inv in bills:
        how = settings.payment_instructions or "See Corp tax for the details."
        notify(inv.user_id, f"Corp tax for {label(month)}: {inv.amount:,.0f} ISK", f"{how} Reason: {ref}" if ref else how,
               link="/p/tax/me", level="info", category="p.tax")
    # Payments members made before the bills went out count too.
    for user_id in {inv.user_id for inv in bills}:
        settle(user_id)
    return closed


@transaction.atomic
def reopen_month(month: date) -> None:
    closed = LedgerMonth.objects.filter(month=month).first()
    if closed is None:
        raise LedgerError(f"{label(month)} isn't closed")
    if closed.invoices.filter(paid=True).exists():
        raise LedgerError("Some members have already paid for this month; mark those payments as unpaid first")
    closed.delete()


@transaction.atomic
def set_paid(invoice_id: int, paid: bool, by) -> Invoice:
    inv = Invoice.objects.select_for_update().select_related("month").filter(pk=invoice_id).first()
    if inv is None:
        raise LedgerError("No such invoice")
    if inv.user_id == by.pk:
        raise LedgerError("Someone else has to mark your own corp tax")
    month = inv.month.month
    mine = set(inv.user.characters.values_list("pk", flat=True))
    taxed_in = {e.corporation_id for e in in_month(entries(), month) if earner(e) in mine}
    if taxed_in - visible_corporations(by):
        raise LedgerError("This member was taxed in corporations you can't see on the corporation sheet")
    if not paid:
        # Whatever wallet payments settled it is the member's again, for this bill once it's due again or the next.
        for s in inv.settlements.select_for_update():
            Payment.objects.filter(pk=s.payment_id).update(remaining=F("remaining") + s.amount)
        inv.settlements.all().delete()
    inv.paid = paid
    inv.paid_at = timezone.now() if paid else None
    inv.marked_by = by
    inv.save(update_fields=["paid", "paid_at", "marked_by"])
    return inv


def is_payment_reason(reason: str, word: str) -> bool:
    """The payment word appears in the reason as a word of its own, in any case: "TAX 2026-09", "corp tax", "tax:"
    and "TAX2026-09" count, "syntax" and "taxi" don't. Not just the start of the reason, since members write the
    reason in their own words ("Sept tax, Pilot Alt")."""
    return bool(word) and re.search(rf"(?<![^\W\d_]){re.escape(word)}(?![^\W\d_])", reason or "", re.IGNORECASE) is not None


def match_payments() -> int:
    """Take new donations to a tax corporation whose reason has the payment word as tax payments, and settle what
    they cover. Returns how many payments were found."""
    settings = TaxSettings.load()
    if not settings.payment_reason:
        return 0
    qs = CorpJournalEntry.objects.filter(ref_type="player_donation", amount__gt=0, reason__icontains=settings.payment_reason)
    if settings.corporations:
        qs = qs.filter(corporation_id__in=settings.corporations)
    else:
        qs = qs.filter(corporation_id__in=set(entries().values_list("corporation_id", flat=True).distinct()))
    qs = qs.exclude(pk__in=Payment.objects.values_list("journal_entry_id", flat=True))
    found = [e for e in qs.order_by("date") if is_payment_reason(e.reason, settings.payment_reason)]
    owners = dict(Character.objects.filter(pk__in={e.first_party_id for e in found}, user__isnull=False).values_list("pk", "user_id"))
    users = set()
    for e in found:
        user_id = owners.get(e.first_party_id)
        if user_id is None:
            continue
        _, created = Payment.objects.get_or_create(journal_entry_id=e.pk, defaults={
            "user_id": user_id, "corporation_id": e.corporation_id, "character_id": e.first_party_id, "date": e.date,
            "amount": e.amount, "remaining": e.amount, "reason": e.reason,
        })
        if created:
            users.add(user_id)
    for user_id in users:
        settle(user_id)
    return len(users)


@transaction.atomic
def settle(user_id: int) -> list[Invoice]:
    """Pay the member's unpaid bills, oldest first, from what's left of their payments. A bill is only settled once
    it's covered in full. Returns the bills it settled."""
    payments = list(Payment.objects.select_for_update().filter(user_id=user_id, remaining__gt=0))
    credit = sum((p.remaining for p in payments), Decimal(0))
    settled = []
    for inv in Invoice.objects.filter(user_id=user_id, paid=False).order_by("month__month"):
        if inv.amount > credit:
            break
        credit -= inv.amount
        due = inv.amount
        for p in payments:
            take = min(p.remaining, due)
            if take <= 0:
                continue
            p.remaining -= take
            due -= take
            Settlement.objects.create(invoice=inv, payment=p, amount=take)
            if due == 0:
                break
        inv.paid, inv.paid_at, inv.marked_by = True, timezone.now(), None
        inv.save(update_fields=["paid", "paid_at", "marked_by"])
        settled.append(inv)
    if settled:
        Payment.objects.bulk_update(payments, ["remaining"])
    return settled


def send_reminders() -> int:
    """Remind members with unpaid bills, at most every ``reminder_days``. Returns how many were reminded."""
    from conduit.notify.services import notify

    settings = TaxSettings.load()
    if not settings.reminder_days:
        return 0
    now = timezone.now()
    due = now - timedelta(days=settings.reminder_days)
    unpaid = defaultdict(list)
    for inv in Invoice.objects.filter(paid=False, month__closed_at__lte=due).select_related("month"):
        if inv.reminded_at is None or inv.reminded_at <= due:
            unpaid[inv.user_id].append(inv)
    for user_id, bills in unpaid.items():
        total = sum((i.amount for i in bills), Decimal(0))
        months_ = ", ".join(label(i.month.month) for i in bills)
        notify(user_id, f"Reminder: you owe {total:,.0f} ISK in corp tax", f"For {months_}. "
               + (settings.payment_instructions or "See Corp tax for the details."),
               link="/p/tax/me", level="warning", category="p.tax")
        Invoice.objects.filter(pk__in=[i.pk for i in bills]).update(reminded_at=now)
    return len(unpaid)


def paid_up(user, grace_days: int) -> bool:
    """No bill older than ``grace_days`` is unpaid."""
    return not Invoice.objects.filter(user=user, paid=False, month__closed_at__lte=timezone.now() - timedelta(days=grace_days)).exists()


def corporations(viewer=None) -> list[dict]:
    """Corporations with tax entries, for the settings (with ``viewer``: those that person may see)."""
    ids = visible_corporations(viewer) if viewer is not None else set(
        CorpJournalEntry.objects.filter(ref_type__in=TAX_REF_TYPES).values_list("corporation_id", flat=True).distinct())
    return [{"id": c.pk, "name": c.name, "ticker": c.ticker} for c in EveCorporation.objects.filter(pk__in=ids).order_by("name")]
