"""Corp finance: what the corporations earned and spent, by category and month, read from the wallet journals.

The data is what the corporation sheet's Wallets section syncs (``conduit.corp``: every journal entry of every
division, kept since the corporation's first sync with an Accountant's login), so nothing here calls ESI.

Each entry is put in a category (``categories.REF_TYPES``, an officer's ``CategoryOverride`` of a ref type, or a
``CounterpartyRule`` for money to or from someone), or counted as an **internal transfer**: money moving between the
corporation's own divisions, or to and from another of the alliance's (or this site's) corporations. Internal
transfers are shown apart and left out of income and spending, so moving ISK around doesn't look like earning it.

Who sees what: everything needs ``finance.view_finance``, and then shows only corporations whose Wallets section the
person may open on the corporation sheet (``conduit.corp.access``).
"""

from __future__ import annotations

import calendar
import csv
import io
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Count, Min, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from conduit.audit.services import record
from conduit.corp.models import CorpJournalEntry, CorporationInfo, CorpSyncStatus, WalletDivision
from conduit.eve.models import EveCorporation, EveName
from conduit.eve.tasks import names_for
from conduit.events import bus
from conduit.notify.services import notify

from . import categories as cat
from .models import CategoryOverride, CounterpartyRule, FinanceSettings, MonthReport

VIEW_PERM = "finance.view_finance"
MANAGE_PERM = "finance.manage_finance"
MAX_MONTHS = 36
#: Balance history ranges a page may ask for, in days; 0 is everything synced.
BALANCE_DAYS = (30, 90, 180, 365, 730, 0)
JOURNAL_LIMIT = 500
#: How long after a month ends its report waits for wallets that haven't synced past the end, before going out anyway.
REPORT_GRACE = timedelta(days=2)
ZERO = Decimal(0)


class FinanceError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- months ---------------------------------------------------------------------------------------------------------


def parse_month(text: str | None, today: date | None = None) -> date:
    """'2026-09' -> date(2026, 9, 1); empty means this month."""
    if not text:
        return (today or timezone.now().date()).replace(day=1)
    try:
        year, month = (int(p) for p in text.split("-"))
        if not 2003 <= year <= 2100:  # EVE launched in 2003; far-off years would overflow date arithmetic
            raise ValueError
        return date(year, month, 1)
    except ValueError:
        raise FinanceError("Use a month like 2026-09") from None


def month_end(month: date) -> date:
    """First day of the next month."""
    return month + timedelta(days=calendar.monthrange(month.year, month.month)[1])


def add_months(month: date, n: int) -> date:
    index = month.year * 12 + month.month - 1 + n
    return date(index // 12, index % 12 + 1, 1)


def _at(day: date) -> datetime:
    """Midnight EVE time (UTC) at the start of ``day``, for filtering journal dates."""
    return datetime.combine(day, time.min, tzinfo=UTC)


def label(month: date) -> str:
    return month.strftime("%B %Y")


def _key(month: date) -> str:
    return month.strftime("%Y-%m")


# --- which corporations ---------------------------------------------------------------------------------------------


def tracked_corporations() -> set[int]:
    """Corporations whose wallets count: every one with synced wallets, or those the settings pick."""
    synced = set(WalletDivision.objects.values_list("corporation_id", flat=True).distinct())
    chosen = FinanceSettings.load().corporations
    return synced & set(chosen) if chosen else synced


def _wallet_access(viewer, ids) -> set[int]:
    from conduit.corp.access import can_view_section

    return {cid for cid in ids if can_view_section(viewer, cid, "wallets")}


def visible_corporations(viewer) -> set[int]:
    """Tracked corporations whose Wallets section ``viewer`` may open on the corporation sheet."""
    if not viewer.has_perm(VIEW_PERM):
        return set()
    return _wallet_access(viewer, tracked_corporations())


def pick(viewer, corporation: int | None) -> list[int]:
    """The corporations a page covers: the one asked for, or every one the viewer may see."""
    visible = visible_corporations(viewer)
    if corporation:
        if corporation not in visible:
            raise FinanceError("You can't see this corporation's wallets", 403)
        return [corporation]
    return sorted(visible)


def require_all(viewer) -> None:
    """Categories, tags and the report settings change every corporation's figures; only someone who may see every
    tracked corporation's wallets may change them."""
    hidden = tracked_corporations() - _wallet_access(viewer, tracked_corporations())
    if hidden:
        names = ", ".join(EveCorporation.objects.filter(pk__in=hidden).order_by("name").values_list("name", flat=True)) or "other corporations"
        raise FinanceError(f"This changes the figures of corporations whose wallets you can't see ({names}); "
                           "someone with access to all of them has to do it", 403)


def corporations_out(ids) -> list[dict]:
    return [{"id": c.pk, "name": c.name, "ticker": c.ticker} for c in EveCorporation.objects.filter(pk__in=ids).order_by("name")]


def division_names(corporation_id: int) -> dict[int, str]:
    """What the corporation calls its wallet divisions (as on the corporation sheet)."""
    info = CorporationInfo.objects.filter(corporation_id=corporation_id).first()
    named = {d["division"]: d.get("name") for d in (info.wallet_divisions if info else []) if d.get("name")}
    return {i: named.get(i) or ("Master wallet" if i == 1 else f"Division {i}") for i in range(1, 8)}


# --- categorising ---------------------------------------------------------------------------------------------------


@dataclass
class Rules:
    """Everything ``classify`` needs, loaded once per page."""

    overrides: dict[str, str]
    parties: dict[int, list[CounterpartyRule]]
    #: corporation id -> the corporations whose transfers with it are internal (its alliance's and every tracked one).
    home: dict[int, set[int]]


def load_rules(corp_ids) -> Rules:
    corp_ids = set(corp_ids)
    parties: dict[int, list[CounterpartyRule]] = defaultdict(list)
    for r in CounterpartyRule.objects.all():
        parties[r.party_id].append(r)
    for rules in parties.values():
        # A corporation's own rule beats an every-corporation one, and a one-way rule beats a both-ways one.
        rules.sort(key=lambda r: (r.corporation_id is None, r.direction == CounterpartyRule.Direction.BOTH, r.pk))
    tracked = tracked_corporations()
    alliance_of = dict(EveCorporation.objects.filter(pk__in=corp_ids).values_list("pk", "alliance_id"))
    siblings: dict[int, set[int]] = defaultdict(set)
    for cid, aid in EveCorporation.objects.filter(alliance_id__in={a for a in alliance_of.values() if a}).values_list("pk", "alliance_id"):
        siblings[aid].add(cid)
    home = {cid: tracked | siblings.get(alliance_of.get(cid), set()) | {cid} for cid in corp_ids}
    return Rules(dict(CategoryOverride.objects.values_list("ref_type", "category")), parties, home)


def counterparty(corporation_id: int, first: int | None, second: int | None) -> int | None:
    """The other side of an entry. ESI names the payer first, except on tax entries, which name the NPC paying the
    reward first and the pilot second; so it's the second party unless that's the corporation itself. When the
    corporation is on both sides (a move between its divisions) it's the corporation."""
    for party in (second, first):
        if party and party != corporation_id:
            return party
    return corporation_id if corporation_id in (first, second) else None


def classify(rules: Rules, corporation_id: int, ref_type: str, first: int | None, second: int | None, incoming: bool) -> tuple[str, bool]:
    """(category, internal) for an entry. Internal transfers first, then counterparty rules, ref type overrides and
    the built-in table."""
    other = counterparty(corporation_id, first, second)
    if other == corporation_id or (other in rules.home.get(corporation_id, ()) and ref_type in cat.TRANSFER_REF_TYPES):
        return cat.INTERNAL, True
    way = CounterpartyRule.Direction.IN if incoming else CounterpartyRule.Direction.OUT
    for r in rules.parties.get(other, ()):
        if r.corporation_id in (None, corporation_id) and r.direction in (way, CounterpartyRule.Direction.BOTH):
            return r.category, False
    return rules.overrides.get(ref_type) or cat.default_category(ref_type), False


@dataclass
class Flow:
    """Money one way, summed over journal entries that share a corporation, month, ref type and parties."""

    corporation_id: int
    month: date
    ref_type: str
    category: str
    internal: bool
    incoming: bool
    amount: Decimal  # always positive
    entries: int
    party: int | None


def flows(corp_ids, start: date, end: date, rules: Rules | None = None):
    """Every Flow in ``[start, end)``. Summed in the database, categorised here."""
    corp_ids = list(corp_ids)
    if not corp_ids:
        return
    rules = rules or load_rules(corp_ids)
    rows = (
        CorpJournalEntry.objects.filter(corporation_id__in=corp_ids, date__gte=_at(start), date__lt=_at(end), amount__isnull=False)
        .exclude(amount=0)
        .order_by()  # the model's ordering would split the groups
        .annotate(m=TruncMonth("date", tzinfo=UTC))
        .values("corporation_id", "m", "ref_type", "first_party_id", "second_party_id")
        .annotate(
            income=Sum("amount", filter=Q(amount__gt=0)), spending=Sum("amount", filter=Q(amount__lt=0)),
            n_in=Count("pk", filter=Q(amount__gt=0)), n_out=Count("pk", filter=Q(amount__lt=0)),
        )
    )
    for row in rows:
        month = row["m"].date() if isinstance(row["m"], datetime) else row["m"]
        cid, ref_type, first, second = row["corporation_id"], row["ref_type"], row["first_party_id"], row["second_party_id"]
        party = counterparty(cid, first, second)
        for incoming, amount, n in ((True, row["income"], row["n_in"]), (False, row["spending"], row["n_out"])):
            if amount:
                category, internal = classify(rules, cid, ref_type, first, second, incoming)
                yield Flow(cid, month, ref_type, category, internal, incoming, abs(Decimal(amount)), n, party)


def _order(names) -> list[str]:
    """Built-in categories in table order, then officers' own alphabetically."""
    builtin = [g for g in cat.GROUPS if g in names]
    return builtin + sorted(n for n in names if n not in cat.GROUPS)


def _f(value) -> float:
    return float(value or 0)


# --- months overview --------------------------------------------------------------------------------------------


def months_with_data(viewer) -> list[dict]:
    """Every month from the first journal entry the viewer may see until this one, newest first."""
    ids = visible_corporations(viewer)
    this = parse_month(None)
    first = CorpJournalEntry.objects.filter(corporation_id__in=ids).aggregate(d=Min("date"))["d"] if ids else None
    start = first.date().replace(day=1) if first else this
    reported = set(MonthReport.objects.values_list("month", flat=True))
    out, m = [], this
    while m >= start and len(out) < 120:
        out.append({"month": _key(m), "label": label(m), "reported": m in reported, "current": m == this})
        m = add_months(m, -1)
    return out


def overview(viewer, corporation: int | None = None, months: int = 12) -> dict:
    """Income and spending per month for the last ``months`` months (this one included), by category, and the
    internal transfers apart."""
    months = max(1, min(int(months or 12), MAX_MONTHS))
    ids = pick(viewer, corporation)
    this = parse_month(None)
    start = add_months(this, -(months - 1))
    keys = [add_months(start, i) for i in range(months)]
    index = {m: i for i, m in enumerate(keys)}
    totals = [{"income": ZERO, "spending": ZERO, "internal_in": ZERO, "internal_out": ZERO} for _ in keys]
    per_cat: dict[str, dict] = defaultdict(lambda: {"income": [ZERO] * months, "spending": [ZERO] * months})
    per_corp: dict[int, dict] = defaultdict(lambda: {"income": ZERO, "spending": ZERO})
    for f in flows(ids, start, month_end(this)):
        i = index[f.month]
        if f.internal:
            totals[i]["internal_in" if f.incoming else "internal_out"] += f.amount
            continue
        side = "income" if f.incoming else "spending"
        totals[i][side] += f.amount
        per_cat[f.category][side][i] += f.amount
        if f.month == this:
            per_corp[f.corporation_id][side] += f.amount
    categories = [
        {"category": c, "income": [_f(v) for v in per_cat[c]["income"]], "spending": [_f(v) for v in per_cat[c]["spending"]],
         "total_income": _f(sum(per_cat[c]["income"])), "total_spending": _f(sum(per_cat[c]["spending"]))}
        for c in _order(per_cat)
    ]
    categories.sort(key=lambda c: -(c["total_income"] + c["total_spending"]))
    corps = corporations_out(visible_corporations(viewer))
    return {
        "corporations": corps,
        "corporation": corporation or None,
        "current": _key(this),
        "months": [
            {"month": _key(m), "label": label(m), "income": _f(t["income"]), "spending": _f(t["spending"]),
             "net": _f(t["income"] - t["spending"]), "internal_in": _f(t["internal_in"]), "internal_out": _f(t["internal_out"])}
            for m, t in zip(keys, totals, strict=True)
        ],
        "categories": categories,
        "this_month": [
            {**c, "income": _f(per_corp[c["id"]]["income"]), "spending": _f(per_corp[c["id"]]["spending"]),
             "net": _f(per_corp[c["id"]]["income"] - per_corp[c["id"]]["spending"])}
            for c in corps if c["id"] in ids
        ],
    }


def summary(viewer) -> dict:
    """For the dashboard widget: this month's income, spending and net per corporation the viewer may see."""
    ids = sorted(visible_corporations(viewer))
    this = parse_month(None)
    per_corp: dict[int, dict] = {cid: {"income": ZERO, "spending": ZERO} for cid in ids}
    for f in flows(ids, this, month_end(this)):
        if not f.internal:
            per_corp[f.corporation_id]["income" if f.incoming else "spending"] += f.amount
    rows = [{**c, "income": _f(per_corp[c["id"]]["income"]), "spending": _f(per_corp[c["id"]]["spending"]),
             "net": _f(per_corp[c["id"]]["income"] - per_corp[c["id"]]["spending"])} for c in corporations_out(ids)]
    rows.sort(key=lambda r: -r["net"])
    return {"month": _key(this), "label": label(this), "corporations": rows, "net": sum(r["net"] for r in rows)}


# --- the monthly report ---------------------------------------------------------------------------------------------


def _figures(fs) -> dict:
    """Totals, categories, counterparties and corporations of some flows."""
    out = {"income": ZERO, "spending": ZERO, "internal_in": ZERO, "internal_out": ZERO, "entries": 0,
           "categories": defaultdict(lambda: {"income": ZERO, "spending": ZERO, "entries": 0}),
           "parties": defaultdict(lambda: {"amount": ZERO, "entries": 0, "categories": set()}),
           "corporations": defaultdict(lambda: {"income": ZERO, "spending": ZERO, "internal_in": ZERO, "internal_out": ZERO})}
    for f in fs:
        out["entries"] += f.entries
        corp = out["corporations"][f.corporation_id]
        if f.internal:
            side = "internal_in" if f.incoming else "internal_out"
            out[side] += f.amount
            corp[side] += f.amount
            continue
        side = "income" if f.incoming else "spending"
        out[side] += f.amount
        corp[side] += f.amount
        c = out["categories"][f.category]
        c[side] += f.amount
        c["entries"] += f.entries
        if f.party:
            p = out["parties"][(f.party, f.incoming)]
            p["amount"] += f.amount
            p["entries"] += f.entries
            p["categories"].add(f.category)
    return out


def _change(now: Decimal, before: Decimal) -> dict:
    return {"amount": _f(now - before), "percent": round(_f((now - before) / abs(before) * 100), 1) if before else None}


def closing_balance(corporation_id: int, before: datetime) -> Decimal | None:
    """The corporation's wallets added up as they stood at ``before``, from the journal's running balances; today's
    balances for a moment that hasn't come yet. None when the journal doesn't reach back that far."""
    if before > timezone.now():
        total = WalletDivision.objects.filter(corporation_id=corporation_id).aggregate(t=Sum("balance"))["t"]
        return total
    total, known = ZERO, False
    divisions = set(WalletDivision.objects.filter(corporation_id=corporation_id).values_list("division", flat=True))
    for division in sorted(divisions):
        last = (CorpJournalEntry.objects.filter(corporation_id=corporation_id, division=division, date__lt=before, balance__isnull=False)
                .order_by("-date", "-ref_id").values_list("balance", flat=True).first())
        if last is not None:
            total += last
            known = True
    return total if known else None


def report(viewer, month: date, corporation: int | None = None, top: int = 10) -> dict:
    """One month: totals, categories, the biggest payers and payees, each corporation, and the change against the
    month before."""
    ids = pick(viewer, corporation)
    previous = add_months(month, -1)
    rules = load_rules(ids)
    now_flows, prev_flows = [], []
    for f in flows(ids, previous, month_end(month), rules):
        (now_flows if f.month == month else prev_flows).append(f)
    cur, prev = _figures(now_flows), _figures(prev_flows)

    names = names_for({p for p, _ in cur["parties"]})
    categories = [
        {"category": c, "income": _f(cur["categories"][c]["income"]) if c in cur["categories"] else 0.0,
         "spending": _f(cur["categories"][c]["spending"]) if c in cur["categories"] else 0.0,
         "entries": cur["categories"][c]["entries"] if c in cur["categories"] else 0,
         "previous_income": _f(prev["categories"][c]["income"]) if c in prev["categories"] else 0.0,
         "previous_spending": _f(prev["categories"][c]["spending"]) if c in prev["categories"] else 0.0}
        for c in _order(set(cur["categories"]) | set(prev["categories"]))
    ]
    for c in categories:
        c["net"] = c["income"] - c["spending"]
        c["previous_net"] = c["previous_income"] - c["previous_spending"]
    categories.sort(key=lambda c: -(c["income"] + c["spending"]))

    def parties(incoming: bool) -> list[dict]:
        rows = sorted(((p, v) for (p, way), v in cur["parties"].items() if way == incoming), key=lambda pv: -pv[1]["amount"])[:top]
        return [{"id": p, "name": names.get(p) or f"#{p}", "amount": _f(v["amount"]), "entries": v["entries"],
                 "categories": _order(v["categories"])} for p, v in rows]

    end, start = _at(month_end(month)), _at(month)
    corps = []
    for c in corporations_out(ids):
        figures = cur["corporations"].get(c["id"], {"income": ZERO, "spending": ZERO, "internal_in": ZERO, "internal_out": ZERO})
        opening, closing = closing_balance(c["id"], start), closing_balance(c["id"], end)
        corps.append({**c, "income": _f(figures["income"]), "spending": _f(figures["spending"]), "net": _f(figures["income"] - figures["spending"]),
                      "internal_in": _f(figures["internal_in"]), "internal_out": _f(figures["internal_out"]),
                      "opening": _f(opening) if opening is not None else None, "closing": _f(closing) if closing is not None else None})

    def totals(fig) -> dict:
        return {"income": _f(fig["income"]), "spending": _f(fig["spending"]), "net": _f(fig["income"] - fig["spending"]),
                "internal_in": _f(fig["internal_in"]), "internal_out": _f(fig["internal_out"]), "entries": fig["entries"]}

    this = parse_month(None)
    return {
        "month": _key(month),
        "label": label(month),
        "previous_label": label(previous),
        "complete": month < this,
        "corporation": corporation or None,
        "corporations": corps,
        "totals": totals(cur),
        "previous": totals(prev),
        "change": {k: _change(cur[k] if k != "net" else cur["income"] - cur["spending"],
                              prev[k] if k != "net" else prev["income"] - prev["spending"]) for k in ("income", "spending", "net")},
        "categories": categories,
        "top_income": parties(True),
        "top_spending": parties(False),
        "generated_at": timezone.now().isoformat(),
    }


def _corp_totals(ids, month: date) -> dict[int, dict]:
    fig = _figures(flows(ids, month, month_end(month)))
    return {cid: {k: _f(fig["corporations"][cid][k]) if cid in fig["corporations"] else 0.0
                  for k in ("income", "spending", "internal_in", "internal_out")} for cid in ids}


def report_closed_month(now: datetime | None = None) -> MonthReport | None:
    """Once last month is over and every tracked corporation's wallets have synced after its end (or two days have
    gone by), tell the report group and send ``finance.month_closed``. Each month once."""
    now = now or timezone.now()
    month = add_months(parse_month(None, today=now.date()), -1)
    if MonthReport.objects.filter(month=month).exists():
        return None
    ids = sorted(tracked_corporations())
    if not ids:
        return None
    end = _at(month_end(month))
    synced = set(CorpSyncStatus.objects.filter(section="wallets", corporation_id__in=ids, last_success__gte=end)
                 .values_list("corporation_id", flat=True))
    if set(ids) - synced and now < end + REPORT_GRACE:
        return None
    per_corp = _corp_totals(ids, month)
    names = {c["id"]: c for c in corporations_out(ids)}

    def add_up(cids) -> dict:
        t = {k: sum(per_corp[c][k] for c in cids) for k in ("income", "spending", "internal_in", "internal_out")}
        return {**t, "net": t["income"] - t["spending"]}

    combined = add_up(ids)
    with transaction.atomic():
        report_row, created = MonthReport.objects.get_or_create(month=month, defaults={"totals": {
            **combined, "corporations": {str(c): per_corp[c] for c in ids}}})
        if not created:
            return None
        link = f"/p/finance/report?month={_key(month)}"
        group = FinanceSettings.load().report_group
        if group is not None:
            for user in group.user_set.filter(is_active=True).select_related("main_character"):
                seen = visible_corporations(user)
                mine = [c for c in ids if c in seen]
                if not mine:
                    continue
                t = add_up(mine)
                notify(user, f"Corp finance for {label(month)}: {t['net']:+,.0f} ISK", f"Income {t['income']:,.0f} ISK, spending "
                       f"{t['spending']:,.0f} ISK across {len(mine)} corporation{'' if len(mine) == 1 else 's'}. The monthly report is ready.",
                       link=link, level="info", category="p.finance")
        bus.emit("finance.month_closed", month=_key(month), label=label(month), **{k: round(v) for k, v in combined.items()},
                 corporations=[{"id": c, "name": names.get(c, {}).get("name", str(c)), "ticker": names.get(c, {}).get("ticker", ""),
                                **{k: round(v) for k, v in add_up([c]).items()}} for c in ids],
                 link=link, level="info", title=f"Corp finance: {label(month)}",
                 summary=f"Income {combined['income']:,.0f} ISK, spending {combined['spending']:,.0f} ISK, net {combined['net']:+,.0f} ISK")
    return report_row


# --- balance history ------------------------------------------------------------------------------------------------


def balances(viewer, corporation: int | None, days: int = 180) -> dict:
    """Each wallet division's balance at the end of every day, from the journal's running balances (the balance
    after each entry), with today's balance from the last sync. A division with no entries kept its balance."""
    visible = visible_corporations(viewer)
    if not corporation:
        if not visible:
            raise FinanceError("You can't see any corporation's wallets", 403)
        corporation = min(visible)
    if corporation not in visible:
        raise FinanceError("You can't see this corporation's wallets", 403)
    days = days if days in BALANCE_DAYS else 180
    today = timezone.now().date()
    journal = CorpJournalEntry.objects.filter(corporation_id=corporation, amount__isnull=False, balance__isnull=False)
    first = journal.aggregate(d=Min("date"))["d"]
    coverage = first.date() if first else today
    since = max(today - timedelta(days=days - 1), coverage) if days else coverage
    names = division_names(corporation)
    current = {d.division: d.balance for d in WalletDivision.objects.filter(corporation_id=corporation)}
    out, total = [], defaultdict(Decimal)
    for division in sorted(current):
        rows = journal.filter(division=division)
        before = rows.filter(date__lt=_at(since)).order_by("-date", "-ref_id").values_list("balance", flat=True).first()
        if before is None:
            # Nothing before the range: the balance before the first entry in it, or, with no entries, today's.
            first_entry = rows.order_by("date", "ref_id").values_list("balance", "amount").first()
            before = first_entry[0] - first_entry[1] if first_entry else current[division]
        last_of_day: dict[date, Decimal] = {}
        for when, bal in rows.filter(date__gte=_at(since)).order_by("date", "ref_id").values_list("date", "balance").iterator():
            last_of_day[when.date()] = bal
        running, series = before, []
        for i in range((today - since).days + 1):
            day = since + timedelta(days=i)
            running = last_of_day.get(day, running)
            if day == today:
                running = current[division]  # the last sync is the latest word
            series.append({"date": day.isoformat(), "value": _f(running)})
            total[day.isoformat()] += running
        out.append({"division": division, "name": names.get(division, f"Division {division}"), "balance": _f(current[division]),
                    "change": series[-1]["value"] - series[0]["value"] if series else 0.0, "series": series})
    return {
        "corporation": corporation,
        "corporations": corporations_out(visible),
        "days": days,
        "since": since.isoformat(),
        "coverage": coverage.isoformat(),
        "balance": _f(sum(current.values(), ZERO)),
        "divisions": out,
        "series": [{"date": k, "value": _f(v)} for k, v in sorted(total.items())],
    }


# --- the categorised journal ----------------------------------------------------------------------------------------


def journal_entries(viewer, month: date, corporation: int | None = None, category: str = "", internal: bool | None = None, q: str = ""):
    """The month's entries, newest first, each with its category: ``(entry, category, internal, counterparty)``."""
    ids = pick(viewer, corporation)
    rules = load_rules(ids)
    qs = CorpJournalEntry.objects.filter(corporation_id__in=ids, date__gte=_at(month), date__lt=_at(month_end(month)), amount__isnull=False).exclude(amount=0)
    if q:
        qs = qs.filter(Q(description__icontains=q) | Q(reason__icontains=q) | Q(ref_type__icontains=q))
    for e in qs.order_by("-date", "-ref_id").iterator(chunk_size=2000):
        c, inside = classify(rules, e.corporation_id, e.ref_type, e.first_party_id, e.second_party_id, e.amount > 0)
        if category and c != category:
            continue
        if internal is not None and inside != internal:
            continue
        yield e, c, inside, counterparty(e.corporation_id, e.first_party_id, e.second_party_id)


def journal(viewer, month: date, corporation: int | None = None, category: str = "", internal: bool | None = None, q: str = "",
            limit: int = JOURNAL_LIMIT) -> dict:
    rows, more = [], False
    for row in journal_entries(viewer, month, corporation, category, internal, q):
        if len(rows) >= limit:
            more = True
            break
        rows.append(row)
    names = names_for({p for *_, p in rows})
    corps = {c["id"]: c for c in corporations_out({e.corporation_id for e, *_ in rows})}
    divisions = {cid: division_names(cid) for cid in corps}
    return {
        "month": _key(month),
        "label": label(month),
        "truncated": more,
        "limit": limit,
        "categories": [*category_names(), cat.INTERNAL],
        "rows": [_entry_out(e, c, inside, p, names, corps, divisions) for e, c, inside, p in rows],
    }


def _entry_out(e, category, internal, party, names, corps, divisions) -> dict:
    corp = corps.get(e.corporation_id) or {"name": str(e.corporation_id), "ticker": ""}
    return {
        "id": f"{e.corporation_id}:{e.division}:{e.ref_id}",
        "date": e.date.isoformat(),
        "corporation": corp["name"],
        "ticker": corp["ticker"],
        "division": divisions.get(e.corporation_id, {}).get(e.division, f"Division {e.division}"),
        "ref_type": e.ref_type,
        "ref_type_label": cat.ref_type_label(e.ref_type),
        "category": category,
        "internal": internal,
        "amount": _f(e.amount),
        "balance": _f(e.balance) if e.balance is not None else None,
        "counterparty": names.get(party) or (f"#{party}" if party else ""),
        "counterparty_id": party,
        "reason": e.reason,
        "description": e.description,
    }


def _csv_row(cells) -> list[str]:
    """Spreadsheets run cells starting with = + - @ as formulas; quote those (numbers are written as numbers)."""
    return [c if isinstance(c, int | float) else ("'" + str(c) if str(c)[:1] in ("=", "+", "-", "@", "\t", "\r") else str(c)) for c in cells]


def journal_csv(viewer, month: date, corporation: int | None = None, category: str = "", internal: bool | None = None, q: str = "") -> str:
    rows = list(journal_entries(viewer, month, corporation, category, internal, q))
    names = names_for({p for *_, p in rows})
    corps = {c["id"]: c for c in corporations_out({e.corporation_id for e, *_ in rows})}
    divisions = {cid: division_names(cid) for cid in corps}
    buf = io.StringIO()
    out = csv.writer(buf)
    out.writerow(["Date (EVE)", "Corporation", "Division", "Ref type", "Category", "Internal", "Amount (ISK)", "Balance (ISK)",
                  "Counterparty", "Reason", "Description"])
    for e, c, inside, p in rows:
        r = _entry_out(e, c, inside, p, names, corps, divisions)
        out.writerow(_csv_row([e.date.strftime("%Y-%m-%d %H:%M"), r["corporation"], r["division"], r["ref_type"], c,
                               "yes" if inside else "no", r["amount"], r["balance"] if r["balance"] is not None else "",
                               r["counterparty"], r["reason"], r["description"]]))
    return buf.getvalue()


# --- settings -------------------------------------------------------------------------------------------------------


def _category(text: str) -> str:
    name = " ".join(str(text or "").split())[:60]
    if not name:
        raise FinanceError("Give it a category")
    if name.casefold() == cat.INTERNAL.casefold():
        raise FinanceError(f"{cat.INTERNAL} are found by themselves; pick another category")
    return name


def category_names() -> list[str]:
    """Built-in categories and every one officers made up."""
    custom = set(CategoryOverride.objects.values_list("category", flat=True)) | set(CounterpartyRule.objects.values_list("category", flat=True))
    return _order(set(cat.GROUPS) | custom)


def rule_out(r: CounterpartyRule, names=None) -> dict:
    name = (names or {}).get(r.party_id) or r.party_name or f"#{r.party_id}"
    return {"id": r.pk, "party_id": r.party_id, "party_name": name, "direction": r.direction, "category": r.category,
            "corporation_id": r.corporation_id, "note": r.note}


def settings_out(viewer) -> dict:
    s = FinanceSettings.load()
    overrides = {o.ref_type: o.category for o in CategoryOverride.objects.all()}
    seen = set(CorpJournalEntry.objects.order_by().values_list("ref_type", flat=True).distinct())
    rules = list(CounterpartyRule.objects.all())
    # A rule for one corporation's wallets shows only to those who may see that corporation's wallets.
    shown = _wallet_access(viewer, {r.corporation_id for r in rules if r.corporation_id})
    rules = [r for r in rules if r.corporation_id is None or r.corporation_id in shown]
    names = names_for({r.party_id for r in rules})
    synced = set(WalletDivision.objects.values_list("corporation_id", flat=True).distinct())
    return {
        "corporations": s.corporations,
        "report_group": s.report_group_id,
        "available_corporations": corporations_out(_wallet_access(viewer, synced)),
        "group_options": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "categories": category_names(),
        "internal_label": cat.INTERNAL,
        "ref_types": [
            {"ref_type": rt, "label": cat.ref_type_label(rt), "default": cat.default_category(rt), "override": overrides.get(rt),
             "seen": rt in seen}
            for rt in sorted(set(cat.REF_TYPES) | seen | set(overrides))
        ],
        "rules": [rule_out(r, names) for r in rules],
    }


def save_settings(data: dict, by, request=None) -> FinanceSettings:
    require_all(by)
    s = FinanceSettings.load()
    synced = set(WalletDivision.objects.values_list("corporation_id", flat=True).distinct())
    chosen = sorted({int(c) for c in data.get("corporations") or []})
    unknown = set(chosen) - synced
    if unknown:
        raise FinanceError("Pick corporations whose wallets are synced")
    hidden = set(chosen) - _wallet_access(by, chosen)
    if hidden:
        raise FinanceError("You can't pick corporations whose wallets you can't see", 403)
    group_id = data.get("report_group")
    group = Group.objects.filter(pk=group_id).first() if group_id else None
    if group_id and group is None:
        raise FinanceError("That group doesn't exist")
    s.corporations = chosen
    s.report_group = group
    s.save()
    record("finance.settings", "changed the corp finance settings", request=request, actor=by, target_type="plugin",
           details={"plugin": "finance", "corporations": chosen, "report_group": group.name if group else None})
    return s


def set_override(ref_type: str, category: str, by, request=None) -> CategoryOverride | None:
    """Put a ref type in ``category``; empty (or its built-in one) puts it back."""
    require_all(by)
    ref_type = str(ref_type or "").strip()[:60]
    if not ref_type:
        raise FinanceError("Which ref type?")
    if not category or category == cat.default_category(ref_type):
        CategoryOverride.objects.filter(ref_type=ref_type).delete()
        record("finance.category", f"put {ref_type} back in {cat.default_category(ref_type)}", request=request, actor=by, target_type="plugin")
        return None
    o, _ = CategoryOverride.objects.update_or_create(ref_type=ref_type, defaults={"category": _category(category), "updated_by": by})
    record("finance.category", f"moved {ref_type} to {o.category}", request=request, actor=by, target_type="plugin")
    return o


def _check_rule_scope(corporation_id, by) -> None:
    if corporation_id:
        if corporation_id not in _wallet_access(by, [corporation_id]):
            raise FinanceError("You can't see this corporation's wallets", 403)
    else:
        require_all(by)


def save_rule(rule: CounterpartyRule | None, data: dict, by, request=None) -> CounterpartyRule:
    party_id = int(data.get("party_id") or 0)
    if party_id <= 0:
        raise FinanceError("Pick who the money goes to or comes from")
    direction = data.get("direction") or CounterpartyRule.Direction.BOTH
    if direction not in CounterpartyRule.Direction.values:
        raise FinanceError("Pick money from them, to them, or both")
    corporation_id = int(data.get("corporation_id") or 0) or None
    if rule is not None:
        _check_rule_scope(rule.corporation_id, by)  # may change the rule they had
    _check_rule_scope(corporation_id, by)
    dupes = CounterpartyRule.objects.filter(party_id=party_id, corporation_id=corporation_id, direction=direction)
    if rule is not None:
        dupes = dupes.exclude(pk=rule.pk)
    if dupes.exists():
        raise FinanceError("There's already a tag for them in that direction")
    name = EveName.objects.filter(pk=party_id).values_list("name", flat=True).first() or str(data.get("party_name") or "")[:200]
    rule = rule or CounterpartyRule(created_by=by)
    rule.party_id = party_id
    rule.party_name = name
    rule.direction = direction
    rule.category = _category(data.get("category"))
    rule.corporation_id = corporation_id
    rule.note = str(data.get("note") or "").strip()[:200]
    rule.save()
    record("finance.rule", f"tagged {rule.get_direction_display().lower()} {name or party_id} as {rule.category}", request=request, actor=by,
           target_type="plugin", details={"rule_id": rule.pk, "party_id": party_id, "corporation_id": corporation_id})
    return rule


def delete_rule(rule: CounterpartyRule, by, request=None) -> None:
    _check_rule_scope(rule.corporation_id, by)
    record("finance.rule_deleted", f"removed the {rule.category} tag for {rule.party_name or rule.party_id}", request=request, actor=by,
           target_type="plugin", details={"rule_id": rule.pk})
    rule.delete()


def search_parties(q: str, limit: int = 15) -> list[dict]:
    """Characters, corporations and alliances the site knows the names of (wallet counterparties get their names
    looked up when the journal syncs). A number is taken as an id."""
    q = (q or "").strip()
    if q.isdigit():
        n = EveName.objects.filter(pk=int(q)).first()
        return [{"id": int(q), "name": n.name if n else f"#{q}", "category": n.category if n else ""}]
    if len(q) < 3:
        return []
    from conduit.search.providers import ranked

    return [{"id": n.pk, "name": n.name, "category": n.category} for n in ranked(EveName.objects.filter(name__icontains=q), "name", q)[:limit]]
