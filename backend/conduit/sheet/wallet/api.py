from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.db.models import Q, Sum
from django.utils import timezone
from ninja.pagination import paginate

from conduit.eve.tasks import names_for
from conduit.sheet.api import me_router, my_characters, router, viewable_character
from conduit.sheet.locations import describe
from conduit.sheet.models import Location
from conduit.sheet.util import type_out, types_by_id

from .models import JournalEntry, WalletBalance, WalletTransaction

DAYS = 30


def _series(balance: Decimal, entries: list[JournalEntry], days: int = DAYS) -> list[dict]:
    """Closing balance per day, worked backwards from today's balance."""
    today = timezone.now().date()
    by_day = defaultdict(Decimal)
    for e in entries:
        by_day[e.date.date()] += e.amount or 0
    out, running = [], balance
    for offset in range(days):
        day = today - timedelta(days=offset)
        out.append({"date": day.isoformat(), "balance": float(running)})
        running -= by_day.get(day, 0)
    return out[::-1]


def _flows(entries: list[JournalEntry]) -> dict:
    income, spend = defaultdict(Decimal), defaultdict(Decimal)
    for e in entries:
        if e.amount and e.amount > 0:
            income[e.ref_type] += e.amount
        elif e.amount:
            spend[e.ref_type] -= e.amount

    def top(d):
        return [{"ref_type": k, "amount": float(v)} for k, v in sorted(d.items(), key=lambda kv: -kv[1])[:6]]

    return {
        "income": float(sum(income.values())),
        "spending": float(sum(spend.values())),
        "top_income": top(income),
        "top_spending": top(spend),
    }


def _summary(characters) -> dict:
    since = timezone.now() - timedelta(days=DAYS)
    balances = {b.character_id: b for b in WalletBalance.objects.filter(character__in=characters)}
    entries = defaultdict(list)
    for e in JournalEntry.objects.filter(character__in=characters, date__gte=since).only("character_id", "date", "amount", "ref_type"):
        entries[e.character_id].append(e)
    total_series: dict[str, float] = defaultdict(float)
    per_character = []
    for c in characters:
        b = balances.get(c.pk)
        if b is None:
            continue
        series = _series(b.balance, entries[c.pk])
        for point in series:
            total_series[point["date"]] += point["balance"]
        per_character.append({"character": {"id": c.pk, "name": c.name, "portrait": c.portrait}, "balance": float(b.balance), "updated_at": b.updated_at.isoformat()})
    all_entries = [e for es in entries.values() for e in es]
    return {
        "synced": bool(balances),
        "balance": float(sum(b.balance for b in balances.values())),
        "series": [{"date": d, "balance": v} for d, v in sorted(total_series.items())],
        "characters": sorted(per_character, key=lambda x: -x["balance"]),
        **_flows(all_entries),
    }


def _journal_rows(qs):
    rows = list(qs)
    names = names_for({r.first_party_id for r in rows} | {r.second_party_id for r in rows})
    return [
        {
            "id": r.ref_id,
            "character_id": r.character_id,
            "date": r.date.isoformat(),
            "ref_type": r.ref_type,
            "amount": float(r.amount) if r.amount is not None else None,
            "balance": float(r.balance) if r.balance is not None else None,
            "description": r.description,
            "reason": r.reason,
            "first_party": names.get(r.first_party_id),
            "second_party": names.get(r.second_party_id),
        }
        for r in rows
    ]


def _transaction_rows(qs):
    rows = list(qs)
    types = types_by_id({r.type_id for r in rows})
    names = names_for({r.client_id for r in rows})
    locations = {loc.id: loc for loc in Location.objects.filter(pk__in={r.location_id for r in rows})}
    return [
        {
            "id": r.transaction_id,
            "character_id": r.character_id,
            "date": r.date.isoformat(),
            "type": type_out(r.type_id, types),
            "quantity": r.quantity,
            "unit_price": float(r.unit_price),
            "total": float(r.unit_price * r.quantity) * (-1 if r.is_buy else 1),
            "is_buy": r.is_buy,
            "client": names.get(r.client_id),
            "location": describe(locations.get(r.location_id)),
        }
        for r in rows
    ]


def _filter_journal(qs, q: str, ref_type: str):
    if ref_type:
        qs = qs.filter(ref_type=ref_type)
    if q:
        qs = qs.filter(Q(description__icontains=q) | Q(reason__icontains=q))
    return qs


@router.get("/{character_id}/wallet")
def wallet(request, character_id: int):
    return _summary([viewable_character(request, character_id)])


@router.get("/{character_id}/wallet/journal", response=list[dict])
@paginate
def journal(request, character_id: int, q: str = "", ref_type: str = ""):
    character = viewable_character(request, character_id)
    return _journal_rows(_filter_journal(JournalEntry.objects.filter(character=character), q, ref_type)[:5000])


@router.get("/{character_id}/wallet/transactions", response=list[dict])
@paginate
def transactions(request, character_id: int):
    character = viewable_character(request, character_id)
    return _transaction_rows(WalletTransaction.objects.filter(character=character)[:5000])


@me_router.get("/wallet")
def my_wallet(request):
    return _summary(list(my_characters(request)))


@me_router.get("/wallet/journal", response=list[dict])
@paginate
def my_journal(request, q: str = "", ref_type: str = ""):
    qs = JournalEntry.objects.filter(character__user=request.user)
    return _journal_rows(_filter_journal(qs, q, ref_type)[:5000])


def balance_total(characters) -> float:
    return float(WalletBalance.objects.filter(character__in=characters).aggregate(t=Sum("balance"))["t"] or 0)
