"""The leaderboard: members ranked by what their characters did in a month (or ever).

Everything comes from data the core already syncs for the character sheet (killmails, the mining ledger, the wallet
journal, industry jobs, skills) and, when the Fleets plugin is on, its FATs. A member's characters count together, so
alts help their main. Only members (people in a members' state) with a main character compete; anyone can hide
themselves from the boards in their preferences.
"""

from __future__ import annotations

import calendar
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone as dt_timezone

from django.apps import apps
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from conduit.access.services import site_members
from conduit.accounts.models import Character, UserPreferences
from conduit.eve.models import EveCorporation, portrait_url
from conduit.sheet.industry.models import IndustryJob
from conduit.sheet.killmails.models import CharacterKillmail
from conduit.sheet.mining.models import MiningEntry
from conduit.sheet.skills.models import SkillSummary
from conduit.sheet.util import prices_by_type
from conduit.sheet.wallet.models import JournalEntry

from .models import Award, LeaderboardSettings

CACHE_SECONDS = 300
#: Wallet journal lines that count as bounties: NPC bounties and the ESS share paid out.
BOUNTY_REF_TYPES = ("bounty_prizes", "bounty_prize", "ess_escrow_transfer")


class LeaderboardError(Exception):
    pass


# --- periods ------------------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Period:
    key: str
    label: str
    start: datetime | None  # None: all time
    end: datetime | None

    @property
    def all_time(self) -> bool:
        return self.start is None

    @property
    def month(self) -> date | None:
        return self.start.date() if self.start else None


def _utc(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=dt_timezone.utc)


def month_end(month: date) -> date:
    """First day of the next month."""
    return month + timedelta(days=calendar.monthrange(month.year, month.month)[1])


def month_period(month: date) -> Period:
    return Period(month.strftime("%Y-%m"), month.strftime("%B %Y"), _utc(month), _utc(month_end(month)))


def parse_period(text: str | None) -> Period:
    """'2026-09' -> September 2026; 'all' -> all time; empty -> this month."""
    if not text:
        return month_period(timezone.now().date().replace(day=1))
    if text == "all":
        return Period("all", "All time", None, None)
    try:
        year, month = (int(p) for p in text.split("-"))
        if not 2003 <= year <= 2100:  # EVE launched in 2003; far-off years would overflow date arithmetic
            raise ValueError
        return month_period(date(year, month, 1))
    except ValueError:
        raise LeaderboardError("Use a month like 2026-09, or all") from None


def periods() -> list[dict]:
    """This month, the twelve before it, and all time."""
    month = timezone.now().date().replace(day=1)
    out = []
    for _ in range(13):
        p = month_period(month)
        out.append({"key": p.key, "label": p.label})
        month = (month - timedelta(days=1)).replace(day=1)
    out.append({"key": "all", "label": "All time"})
    return out


# --- categories ---------------------------------------------------------------------------------------------


@dataclass
class Entry:
    score: float = 0.0
    #: Secondary figure shown next to the score, e.g. ISK destroyed for a kill count.
    extra: float = 0.0
    #: Score per character id, for the breakdown.
    characters: dict[int, float] = field(default_factory=dict)


Results = dict[int, Entry]  # by user id
CharMap = dict[int, int]  # character id -> user id


def _entries(chars: CharMap) -> Results:  # noqa: ARG001 (the map is handy while debugging)
    return defaultdict(Entry)


def _time_range(qs, field_name: str, period: Period):
    if period.start is not None:
        qs = qs.filter(**{f"{field_name}__gte": period.start, f"{field_name}__lt": period.end})
    return qs


def _kill_rows(period: Period, chars: CharMap, is_loss: bool):
    qs = CharacterKillmail.objects.filter(character_id__in=chars, is_loss=is_loss)
    qs = _time_range(qs, "killmail__time", period)
    return qs.values_list("character_id", "killmail_id", "killmail__value")


def _kills(period: Period, chars: CharMap, is_loss: bool, by_value: bool) -> Results:
    """Distinct killmails per member (two of their characters on one kill is still one kill)."""
    seen: dict[int, dict[int, float]] = defaultdict(dict)  # user -> killmail -> value
    per_char: dict[int, set[int]] = defaultdict(set)
    for cid, kid, value in _kill_rows(period, chars, is_loss):
        seen[chars[cid]][kid] = value or 0.0
        per_char[cid].add(kid)
    out = _entries(chars)
    for uid, kills in seen.items():
        count, value = len(kills), sum(kills.values())
        e = out[uid]
        e.score, e.extra = (value, count) if by_value else (count, value)
    for cid, kids in per_char.items():
        chars_scores = out[chars[cid]].characters
        chars_scores[cid] = sum(seen[chars[cid]][k] for k in kids) if by_value else len(kids)
    return out


def kills(period: Period, chars: CharMap) -> Results:
    return _kills(period, chars, is_loss=False, by_value=False)


def isk_destroyed(period: Period, chars: CharMap) -> Results:
    return _kills(period, chars, is_loss=False, by_value=True)


def losses(period: Period, chars: CharMap) -> Results:
    return _kills(period, chars, is_loss=True, by_value=False)


def fleets_available() -> bool:
    """The Fleets plugin is installed and switched on."""
    from conduit.plugins.services import is_enabled

    return apps.is_installed("conduit_fleets") and is_enabled("fleets")


def fats(period: Period, chars: CharMap) -> Results:
    from conduit_fleets.models import Fat

    qs = _time_range(Fat.objects.filter(character_id__in=chars), "fleet__started_at", period)
    out = _entries(chars)
    for cid in qs.values_list("character_id", flat=True):
        e = out[chars[cid]]
        e.score += 1
        e.characters[cid] = e.characters.get(cid, 0) + 1
    return out


def mining(period: Period, chars: CharMap) -> Results:
    qs = MiningEntry.objects.filter(character_id__in=chars)
    if period.start is not None:
        qs = qs.filter(date__gte=period.start.date(), date__lt=period.end.date())
    rows = list(qs.values_list("character_id", "type_id", "quantity"))
    prices = prices_by_type({tid for _, tid, _ in rows})
    out = _entries(chars)
    for cid, tid, qty in rows:
        value = prices.get(tid, 0.0) * qty
        e = out[chars[cid]]
        e.score += value
        e.extra += qty
        e.characters[cid] = e.characters.get(cid, 0.0) + value
    return out


def bounties(period: Period, chars: CharMap) -> Results:
    qs = JournalEntry.objects.filter(character_id__in=chars, ref_type__in=BOUNTY_REF_TYPES, amount__gt=0)
    qs = _time_range(qs, "date", period)
    out = _entries(chars)
    for cid, amount in qs.values_list("character_id", "amount"):
        e = out[chars[cid]]
        e.score += float(amount)
        e.extra += 1
        e.characters[cid] = e.characters.get(cid, 0.0) + float(amount)
    return out


def industry(period: Period, chars: CharMap) -> Results:
    qs = _time_range(IndustryJob.objects.filter(character_id__in=chars), "start_date", period)
    out = _entries(chars)
    for cid, runs in qs.values_list("character_id", "runs"):
        e = out[chars[cid]]
        e.score += 1
        e.extra += runs or 0
        e.characters[cid] = e.characters.get(cid, 0) + 1
    return out


def skillpoints(period: Period, chars: CharMap) -> Results:
    out = _entries(chars)
    for cid, sp in SkillSummary.objects.filter(character_id__in=chars).values_list("character_id", "total_sp"):
        e = out[chars[cid]]
        e.score += sp
        e.extra += 1
        e.characters[cid] = float(sp)
    return out


@dataclass(frozen=True)
class Category:
    key: str
    label: str
    description: str
    #: How the score is shown: count, isk or sp.
    unit: str
    #: What ``extra`` is, e.g. "ISK destroyed"; empty when there is none.
    extra_label: str
    extra_unit: str
    compute: callable
    #: The same whatever the period (skillpoints are a total, not something earned in a month).
    all_time: bool = False
    #: Whether the category can be used right now (e.g. FATs need the Fleets plugin).
    available: callable = lambda: True


CATEGORIES: dict[str, Category] = {c.key: c for c in (
    Category("kills", "Kills", "Killmails the member's characters were on.", "count", "ISK destroyed", "isk", kills),
    Category("isk_destroyed", "ISK destroyed", "Value of the ships the member helped kill.", "isk", "kills", "count", isk_destroyed),
    Category("fats", "Fleets", "Fleet participation (FATs) from the Fleets plugin.", "count", "", "", fats, available=fleets_available),
    Category("mining", "Mining", "Value of the ore and ice mined.", "isk", "units", "count", mining),
    Category("bounties", "Bounties", "NPC bounties and ESS payouts earned.", "isk", "payouts", "count", bounties),
    Category("industry", "Industry", "Industry jobs started.", "count", "runs", "count", industry),
    Category("skillpoints", "Skillpoints", "Total skillpoints across the member's characters.", "sp", "characters", "count", skillpoints, all_time=True),
    Category("losses", "Losses", "Ships lost. Wear it with pride.", "count", "ISK lost", "isk", losses),
)}


def category_out(c: Category) -> dict:
    return {"key": c.key, "label": c.label, "description": c.description, "unit": c.unit,
            "extra_label": c.extra_label, "extra_unit": c.extra_unit, "all_time": c.all_time}


def enabled_categories(settings: LeaderboardSettings | None = None) -> list[Category]:
    settings = settings or LeaderboardSettings.load()
    chosen = [CATEGORIES[k] for k in settings.categories if k in CATEGORIES] if settings.categories else list(CATEGORIES.values())
    return [c for c in chosen if c.available()]


def get_category(key: str) -> Category:
    for c in enabled_categories():
        if c.key == key:
            return c
    raise LeaderboardError("No such leaderboard")


# --- who competes -------------------------------------------------------------------------------------------


def is_hidden(user) -> bool:
    prefs = UserPreferences.objects.filter(user=user).values_list("plugins", flat=True).first() or {}
    return bool((prefs.get("leaderboard") or {}).get("hidden"))


def set_hidden(user, hidden: bool) -> None:
    prefs = UserPreferences.for_user(user)
    prefs.plugins = {**prefs.plugins, "leaderboard": {**(prefs.plugins.get("leaderboard") or {}), "hidden": hidden}}
    prefs.save(update_fields=["plugins", "updated_at"])
    bump()


def hidden_user_ids() -> set[int]:
    return {uid for uid, plugins in UserPreferences.objects.exclude(plugins={}).values_list("user_id", "plugins")
            if (plugins.get("leaderboard") or {}).get("hidden")}


def competitors(corporation: int | None = None, settings: LeaderboardSettings | None = None):
    """Members with a main character (in the chosen corporations) who haven't hidden themselves."""
    settings = settings or LeaderboardSettings.load()
    qs = site_members().filter(main_character__isnull=False).select_related("main_character__corporation")
    if settings.corporations:
        qs = qs.filter(main_character__corporation_id__in=settings.corporations)
    if corporation:
        qs = qs.filter(main_character__corporation_id=corporation)
    hidden = hidden_user_ids()
    return [u for u in qs if u.pk not in hidden]


def corporations(settings: LeaderboardSettings | None = None) -> list[dict]:
    """Corporations the competitors' main characters are in, for the picker."""
    settings = settings or LeaderboardSettings.load()
    ids = {u.main_character.corporation_id for u in competitors(settings=settings) if u.main_character.corporation_id}
    return [{"id": c.pk, "name": c.name, "ticker": c.ticker} for c in EveCorporation.objects.filter(pk__in=ids).order_by("name")]


def all_corporations() -> list[dict]:
    """Every corporation a member's main character is in, for the settings (ignores the chosen ones)."""
    ids = {cid for cid in site_members().filter(main_character__isnull=False).values_list("main_character__corporation_id", flat=True) if cid}
    return [{"id": c.pk, "name": c.name, "ticker": c.ticker} for c in EveCorporation.objects.filter(pk__in=ids).order_by("name")]


# --- the boards ---------------------------------------------------------------------------------------------


def generation() -> int:
    return cache.get("leaderboard:gen") or 0


def bump() -> None:
    """Forget every cached board (settings changed, someone hid themselves, a month was awarded)."""
    cache.set("leaderboard:gen", generation() + 1, None)


def ranked(category: Category, period: Period, corporation: int | None = None) -> list[dict]:
    """Every competitor with a score, best first, with standard competition ranks (ties share a rank).
    Cached for a few minutes: the boards are read far more often than the data changes."""
    key = f"leaderboard:{generation()}:{category.key}:{period.key}:{corporation or 0}"
    rows = cache.get(key)
    if rows is None:
        rows = _ranked(category, period, corporation)
        cache.set(key, rows, CACHE_SECONDS)
    return rows


def _ranked(category: Category, period: Period, corporation: int | None) -> list[dict]:
    users = {u.pk: u for u in competitors(corporation)}
    characters = list(Character.objects.filter(user_id__in=users).values_list("pk", "name", "user_id"))
    chars: CharMap = {cid: uid for cid, _, uid in characters}
    names = {cid: name for cid, name, _ in characters}
    results = category.compute(period, chars)
    rows = []
    for uid, e in results.items():
        if e.score <= 0:
            continue
        u = users[uid]
        corp = u.main_character.corporation
        rows.append({
            "user_id": uid,
            "name": u.display_name,
            "portrait": portrait_url(u.main_character_id, 64),
            "corporation": {"id": corp.pk, "name": corp.name, "ticker": corp.ticker} if corp else None,
            "score": e.score,
            "extra": e.extra,
            "characters": sorted(({"id": cid, "name": names.get(cid, f"Character {cid}"), "score": s} for cid, s in e.characters.items() if s > 0),
                                 key=lambda c: -c["score"]),
        })
    rows.sort(key=lambda r: (-r["score"], r["name"].lower()))
    rank, previous = 0, None
    for i, r in enumerate(rows, start=1):
        if r["score"] != previous:
            rank, previous = i, r["score"]
        r["rank"] = rank
    return rows


def _strip(row: dict, show_characters: bool) -> dict:
    return row if show_characters else {**row, "characters": []}


def board(category: Category, period: Period, viewer, corporation: int | None = None, settings: LeaderboardSettings | None = None) -> dict:
    """One category's board: the top places, and the viewer's own row wherever they are."""
    settings = settings or LeaderboardSettings.load()
    rows = ranked(category, period, corporation)
    mine = next((r for r in rows if r["user_id"] == viewer.pk), None)
    return {
        "category": category_out(category),
        "period": {"key": period.key, "label": period.label},
        "places": settings.places,
        "participants": len(rows),
        "total": sum(r["score"] for r in rows),
        "entries": [_strip(r, settings.show_characters) for r in rows[:settings.places]],
        # Members always see their own characters' share.
        "me": mine,
        "hidden": mine is None and is_hidden(viewer),
    }


def overview(period: Period, viewer, corporation: int | None = None) -> dict:
    """Every category at a glance: the podium and where the viewer stands."""
    settings = LeaderboardSettings.load()
    boards = []
    for c in enabled_categories(settings):
        rows = ranked(c, period, corporation)
        mine = next((r for r in rows if r["user_id"] == viewer.pk), None)
        boards.append({
            "category": category_out(c),
            "participants": len(rows),
            "podium": [_strip(r, False) for r in rows[:3]],
            "me": {"rank": mine["rank"], "score": mine["score"], "extra": mine["extra"]} if mine else None,
        })
    return {
        "period": {"key": period.key, "label": period.label},
        "corporation": corporation,
        "hidden": is_hidden(viewer),
        "boards": boards,
    }


def my_ranks(viewer) -> dict:
    """The viewer's place in each category this month, for the dashboard widget."""
    period = parse_period(None)
    settings = LeaderboardSettings.load()
    out = []
    for c in enabled_categories(settings):
        rows = ranked(c, period)
        mine = next((r for r in rows if r["user_id"] == viewer.pk), None)
        out.append({"category": category_out(c), "rank": mine["rank"] if mine else None, "score": mine["score"] if mine else 0,
                    "participants": len(rows)})
    return {"period": {"key": period.key, "label": period.label}, "hidden": is_hidden(viewer), "ranks": out,
            "medals": medal_counts(viewer)}


# --- medals -------------------------------------------------------------------------------------------------


def medal_counts(user) -> dict:
    counts = {1: 0, 2: 0, 3: 0}
    for rank in Award.objects.filter(user=user).values_list("rank", flat=True):
        counts[rank] = counts.get(rank, 0) + 1
    return {"gold": counts[1], "silver": counts[2], "bronze": counts[3]}


def award_out(a: Award) -> dict:
    c = CATEGORIES.get(a.category)
    return {
        "id": a.pk,
        "month": a.month.strftime("%Y-%m"),
        "label": a.month.strftime("%B %Y"),
        "category": category_out(c) if c else {"key": a.category, "label": a.category, "unit": "count"},
        "rank": a.rank,
        "score": a.score,
        "user_id": a.user_id,
        "name": a.user.display_name,
        "portrait": portrait_url(a.user.main_character_id, 64) if a.user.main_character_id else "",
    }


def awards(user=None, limit: int = 200) -> list[dict]:
    qs = Award.objects.select_related("user__main_character")
    if user is not None:
        qs = qs.filter(user=user)
    return [award_out(a) for a in qs[:limit]]


def hall_of_fame(limit: int = 50) -> list[dict]:
    """Members with the most medals, gold first."""
    from conduit.accounts.models import User

    tally: dict[int, dict] = defaultdict(lambda: {"gold": 0, "silver": 0, "bronze": 0})
    for uid, rank in Award.objects.values_list("user_id", "rank"):
        tally[uid][{1: "gold", 2: "silver", 3: "bronze"}[rank]] += 1
    users = {u.pk: u for u in User.objects.filter(pk__in=tally).select_related("main_character")}
    rows = [{"user_id": uid, "name": users[uid].display_name, "portrait": portrait_url(users[uid].main_character_id, 64) if users[uid].main_character_id else "", **t}
            for uid, t in tally.items() if uid in users]
    rows.sort(key=lambda r: (-r["gold"], -r["silver"], -r["bronze"], r["name"].lower()))
    return rows[:limit]


@transaction.atomic
def award_month(month: date) -> list[Award]:
    """Give the top three of each category their medals for a finished month, and tell them."""
    from conduit.notify.services import notify

    if month_end(month) > timezone.now().date():
        raise LeaderboardError("A month can be awarded once it's over")
    if Award.objects.filter(month=month).exists():
        raise LeaderboardError(f"{month:%B %Y} already has its medals")
    settings = LeaderboardSettings.load()
    period = month_period(month)
    made = []
    for c in enabled_categories(settings):
        if c.all_time:
            continue
        # Members who tie share the place, so a tie for first is two golds.
        for row in ranked(c, period):
            if row["rank"] > 3:
                break
            made.append(Award.objects.create(month=month, category=c.key, rank=row["rank"], user_id=row["user_id"], score=row["score"]))
    for a in made:
        place = {1: "1st", 2: "2nd", 3: "3rd"}[a.rank]
        notify(a.user_id, f"You finished {place} in {CATEGORIES[a.category].label} for {month:%B %Y}",
               "Your medal is on the leaderboard's hall of fame.", link="/p/leaderboard/medals", level="success", category="p.leaderboard")
    bump()
    return made


def award_finished_months() -> list[Award]:
    """Award last month, once it has been over for a day (so the last syncs are counted). Runs daily."""
    settings = LeaderboardSettings.load()
    if not settings.medals:
        return []
    today = timezone.now().date()
    last = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
    if today < month_end(last) + timedelta(days=1) or Award.objects.filter(month=last).exists():
        return []
    return award_month(last)
