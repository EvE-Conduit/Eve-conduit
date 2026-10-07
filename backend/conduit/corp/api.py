"""``/api/corporations/...``: the corporation sheet."""

from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate

from conduit.accounts.models import Character
from conduit.eve.models import EveCorporation, portrait_url
from conduit.eve.tasks import names_for
from conduit.schemas import alliance_out, corp_out
from conduit.sde.models import SolarSystem
from conduit.sheet.industry.models import ACTIVITIES
from conduit.sheet.locations import describe
from conduit.sheet.models import Location
from conduit.sheet.util import prices_by_type, type_out, types_by_id

from . import registry
from .access import can_view, can_view_section, has_any_corp_permission
from .models import (
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

router = Router(tags=["corporation sheet"])
DAYS = 30


def _iso(dt):
    return dt.isoformat() if dt else None


def _f(v):
    return float(v) if v is not None else None


def viewable_corporation(request, corporation_id: int, section: str | None = None) -> EveCorporation:
    corp = get_object_or_404(EveCorporation.objects.select_related("alliance"), pk=corporation_id)
    if not can_view(request.user, corp):
        raise HttpError(403, "You can't view this corporation")
    if section and not can_view_section(request.user, corp, section):
        raise HttpError(403, "You can't view this corporation's finances")
    return corp


def _system(system_id, systems=None):
    s = (systems or {}).get(system_id) if systems is not None else SolarSystem.objects.select_related("region").filter(pk=system_id).first()
    if s is None:
        return {"id": system_id, "name": f"System {system_id}", "security": None, "region": ""} if system_id else None
    return {"id": s.id, "name": s.name, "security": s.display_security, "region": s.region.name}


def _systems(ids):
    return {s.id: s for s in SolarSystem.objects.filter(pk__in={i for i in ids if i}).select_related("region")}


def _locations(ids):
    return {loc.id: loc for loc in Location.objects.filter(pk__in={i for i in ids if i})}


# --- list and header ------------------------------------------------------------------


def _health(statuses) -> dict:
    counts = defaultdict(int)
    for s in statuses:
        counts[s.result] += 1
    last = max((s.last_success for s in statuses if s.last_success), default=None)
    return {
        "ok": counts[CorpSyncStatus.Result.OK],
        "error": counts[CorpSyncStatus.Result.ERROR],
        "no_character": counts[CorpSyncStatus.Result.NO_CHARACTER],
        "pending": counts[CorpSyncStatus.Result.PENDING],
        "last_success": _iso(last),
    }


@router.get("")
def list_corporations(request):
    """Corporations with registered members that this user may view."""
    if not has_any_corp_permission(request.user):
        return []
    corps = EveCorporation.objects.filter(characters__isnull=False).distinct().select_related("alliance")
    corps = [c for c in corps if can_view(request.user, c)]
    ids = [c.pk for c in corps]
    infos = {i.corporation_id: i for i in CorporationInfo.objects.filter(corporation_id__in=ids)}
    registered = dict(Character.objects.filter(corporation_id__in=ids).values("corporation_id").annotate(n=Count("id")).values_list("corporation_id", "n"))
    users = dict(
        Character.objects.filter(corporation_id__in=ids).values("corporation_id").annotate(n=Count("user", distinct=True)).values_list("corporation_id", "n")
    )
    tracked = dict(CorporationMember.objects.filter(corporation_id__in=ids).values("corporation_id").annotate(n=Count("id")).values_list("corporation_id", "n"))
    statuses = defaultdict(list)
    for s in CorpSyncStatus.objects.filter(corporation_id__in=ids):
        statuses[s.corporation_id].append(s)
    structures = dict(Structure.objects.filter(corporation_id__in=ids).values("corporation_id").annotate(n=Count("id")).values_list("corporation_id", "n"))
    soon = timezone.now() + timedelta(hours=72)
    low_fuel = dict(
        Structure.objects.filter(corporation_id__in=ids, fuel_expires__lt=soon).values("corporation_id").annotate(n=Count("id")).values_list("corporation_id", "n")
    )
    out = []
    for c in corps:
        info = infos.get(c.pk)
        members = (info.member_count if info else None) or c.member_count
        out.append(
            {
                **corp_out(c),
                "alliance": alliance_out(c.alliance),
                "member_count": members,
                "registered_characters": registered.get(c.pk, 0),
                "registered_users": users.get(c.pk, 0),
                "known_members": tracked.get(c.pk) or None,
                "structures": structures.get(c.pk, 0),
                "low_fuel": low_fuel.get(c.pk, 0),
                "is_mine": bool(request.user.main_character and request.user.main_character.corporation_id == c.pk),
                "health": _health(statuses[c.pk]),
            }
        )
    return sorted(out, key=lambda x: (not x["is_mine"], x["name"].lower()))


@router.get("/{corporation_id}")
def corporation_header(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id)
    statuses = {s.section: s for s in CorpSyncStatus.objects.filter(corporation=corp).select_related("character")}
    info = CorporationInfo.objects.filter(corporation=corp).first()

    def section_out(s: registry.CorpSection):
        st = statuses.get(s.key)
        return {
            "key": s.key,
            "label": s.label,
            "description": s.description,
            "requirement": s.requirement(),
            "roles": list(s.roles),
            "scopes": list(s.scopes),
            "allowed": can_view_section(request.user, corp, s.key),
            "result": st.result if st else CorpSyncStatus.Result.PENDING,
            "message": st.message if st else "",
            "last_success": _iso(st.last_success) if st else None,
            "synced_as": {"id": st.character.pk, "name": st.character.name} if st and st.character else None,
        }

    return {
        **corp_out(corp),
        "logo_large": corp_out(corp)["logo"].replace("size=64", "size=256"),
        "alliance": alliance_out(corp.alliance),
        "member_count": (info.member_count if info else None) or corp.member_count,
        "registered_characters": Character.objects.filter(corporation=corp).count(),
        "can_view_wallets": request.user.has_perm("corp.view_corporation_wallets"),
        "sections": [section_out(s) for s in registry.ordered()],
    }


@router.post("/{corporation_id}/refresh")
def refresh(request, corporation_id: int):
    from .tasks import sync_now

    corp = viewable_corporation(request, corporation_id)
    sync_now(corp.pk)
    return {"ok": True}


# --- overview -------------------------------------------------------------------------


@router.get("/{corporation_id}/overview")
def overview(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id)
    info = CorporationInfo.objects.filter(corporation=corp).first()
    names = names_for({info.ceo_id, info.creator_id} if info else set())
    members = CorporationMember.objects.filter(corporation=corp)
    member_ids = set(members.values_list("character_id", flat=True))
    registered_ids = set(Character.objects.filter(corporation=corp).values_list("pk", flat=True))
    week = timezone.now() - timedelta(days=7)
    month = timezone.now() - timedelta(days=30)
    wallets = None
    if can_view_section(request.user, corp, "wallets"):
        total = WalletDivision.objects.filter(corporation=corp).aggregate(t=Sum("balance"))["t"]
        wallets = float(total) if total is not None else None
    home = Location.objects.filter(pk=info.home_station_id).first() if info and info.home_station_id else None
    return {
        "synced": info is not None,
        "ceo": {"id": info.ceo_id, "name": names.get(info.ceo_id, ""), "portrait": portrait_url(info.ceo_id, 128)} if info and info.ceo_id else None,
        "creator": {"id": info.creator_id, "name": names.get(info.creator_id, "")} if info and info.creator_id else None,
        "founded": _iso(info.date_founded) if info else None,
        "description": info.description if info else "",
        "url": info.url if info else "",
        "tax_rate": info.tax_rate if info else None,
        "shares": info.shares if info else None,
        "war_eligible": info.war_eligible if info else None,
        "home_station": describe(home),
        "hangar_divisions": info.hangar_divisions if info else [],
        "wallet_divisions": info.wallet_divisions if info else [],
        "member_count": (info.member_count if info else None) or corp.member_count,
        "known_members": len(member_ids) or None,
        "registered": len(registered_ids & member_ids) if member_ids else len(registered_ids),
        "active_7d": members.filter(logon_date__gte=week).count() if member_ids else None,
        "active_30d": members.filter(logon_date__gte=month).count() if member_ids else None,
        "structures": Structure.objects.filter(corporation=corp).count(),
        "low_fuel": Structure.objects.filter(corporation=corp, fuel_expires__lt=timezone.now() + timedelta(hours=72)).count(),
        "wallet_total": wallets,
    }


# --- members --------------------------------------------------------------------------


@router.get("/{corporation_id}/members")
def members(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "members")
    rows = list(CorporationMember.objects.filter(corporation=corp))
    names = names_for({r.character_id for r in rows})
    owners = {
        c.pk: c for c in Character.objects.filter(pk__in=[r.character_id for r in rows]).select_related("user__main_character")
    }
    types = types_by_id({r.ship_type_id for r in rows if r.ship_type_id})
    locations = _locations({r.location_id for r in rows})
    out = []
    for r in rows:
        owner = owners.get(r.character_id)
        online = bool(r.logon_date and (not r.logoff_date or r.logon_date > r.logoff_date))
        out.append(
            {
                "id": r.character_id,
                "name": names.get(r.character_id, f"Character {r.character_id}"),
                "portrait": portrait_url(r.character_id, 64),
                "registered": owner is not None,
                "owner": {"id": owner.user_id, "name": owner.user.display_name, "main_id": owner.user.main_character_id}
                if owner
                else None,
                "tracked": r.tracked,
                "online": online,
                "start_date": _iso(r.start_date),
                "logon_date": _iso(r.logon_date),
                "logoff_date": _iso(r.logoff_date),
                "location": describe(locations.get(r.location_id)),
                "ship": type_out(r.ship_type_id, types) if r.ship_type_id else None,
                "roles": r.roles,
                "titles": r.titles,
            }
        )
    out.sort(key=lambda m: m["name"].lower())
    out.sort(key=lambda m: m["logon_date"] or "", reverse=True)  # ISO strings in one zone sort by time
    out.sort(key=lambda m: not m["online"])
    return {
        "items": out,
        "count": len(out),
        "registered": sum(1 for m in out if m["registered"]),
        "online": sum(1 for m in out if m["online"]),
    }


# --- structures -----------------------------------------------------------------------


@router.get("/{corporation_id}/structures")
def structures(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "structures")
    rows = list(Structure.objects.filter(corporation=corp))
    types = types_by_id({s.type_id for s in rows})
    systems = _systems({s.system_id for s in rows})
    now = timezone.now()
    return [
        {
            "id": s.structure_id,
            "name": s.name or f"Structure {s.structure_id}",
            "type": type_out(s.type_id, types),
            "system": _system(s.system_id, systems),
            "state": s.state,
            "fuel_expires": _iso(s.fuel_expires),
            "fuel_hours": round((s.fuel_expires - now).total_seconds() / 3600, 1) if s.fuel_expires else None,
            "state_timer_start": _iso(s.state_timer_start),
            "state_timer_end": _iso(s.state_timer_end),
            "unanchors_at": _iso(s.unanchors_at),
            "reinforce_hour": s.reinforce_hour,
            "services": s.services,
        }
        for s in sorted(rows, key=lambda s: (s.fuel_expires is None, s.fuel_expires or now, s.name))
    ]


# --- wallets --------------------------------------------------------------------------


def _division_names(corp) -> dict[int, str]:
    info = CorporationInfo.objects.filter(corporation=corp).first()
    named = {d["division"]: d.get("name") for d in (info.wallet_divisions if info else []) if d.get("name")}
    return {i: named.get(i) or ("Master wallet" if i == 1 else f"Division {i}") for i in range(1, 8)}


@router.get("/{corporation_id}/wallets")
def wallets(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "wallets")
    divisions = list(WalletDivision.objects.filter(corporation=corp))
    labels = _division_names(corp)
    since = timezone.now() - timedelta(days=DAYS)
    entries = list(CorpJournalEntry.objects.filter(corporation=corp, date__gte=since).only("division", "date", "amount", "ref_type"))
    by_div = defaultdict(list)
    for e in entries:
        by_div[e.division].append(e)
    today = timezone.now().date()
    total_series: dict[str, float] = defaultdict(float)
    out = []
    for d in divisions:
        per_day = defaultdict(Decimal)
        for e in by_div[d.division]:
            per_day[e.date.date()] += e.amount or 0
        running, series = d.balance, []
        for offset in range(DAYS):
            day = today - timedelta(days=offset)
            series.append({"date": day.isoformat(), "balance": float(running)})
            running -= per_day.get(day, 0)
        series.reverse()
        for p in series:
            total_series[p["date"]] += p["balance"]
        income = sum((e.amount for e in by_div[d.division] if e.amount and e.amount > 0), Decimal(0))
        spend = -sum((e.amount for e in by_div[d.division] if e.amount and e.amount < 0), Decimal(0))
        out.append({"division": d.division, "name": labels[d.division], "balance": float(d.balance), "income": float(income),
                    "spending": float(spend), "series": series})
    income, spend = defaultdict(Decimal), defaultdict(Decimal)
    for e in entries:
        if e.amount and e.amount > 0:
            income[e.ref_type] += e.amount
        elif e.amount:
            spend[e.ref_type] -= e.amount

    def top(d):
        return [{"ref_type": k, "amount": float(v)} for k, v in sorted(d.items(), key=lambda kv: -kv[1])[:6]]

    return {
        "synced": bool(divisions),
        "balance": float(sum(d.balance for d in divisions)),
        "divisions": out,
        "series": [{"date": k, "balance": v} for k, v in sorted(total_series.items())],
        "income": float(sum(income.values())),
        "spending": float(sum(spend.values())),
        "top_income": top(income),
        "top_spending": top(spend),
    }


@router.get("/{corporation_id}/wallets/journal", response=list[dict])
@paginate
def wallet_journal(request, corporation_id: int, division: int | None = None, q: str = "", ref_type: str = ""):
    corp = viewable_corporation(request, corporation_id, "wallets")
    qs = CorpJournalEntry.objects.filter(corporation=corp)
    if division:
        qs = qs.filter(division=division)
    if ref_type:
        qs = qs.filter(ref_type=ref_type)
    if q:
        qs = qs.filter(Q(description__icontains=q) | Q(reason__icontains=q))
    rows = list(qs[:5000])
    names = names_for({r.first_party_id for r in rows} | {r.second_party_id for r in rows})
    labels = _division_names(corp)
    return [
        {
            "id": f"{r.division}:{r.ref_id}",
            "division": r.division,
            "division_name": labels.get(r.division, ""),
            "date": r.date.isoformat(),
            "ref_type": r.ref_type,
            "amount": _f(r.amount),
            "balance": _f(r.balance),
            "description": r.description,
            "reason": r.reason,
            "first_party": names.get(r.first_party_id),
            "second_party": names.get(r.second_party_id),
        }
        for r in rows
    ]


@router.get("/{corporation_id}/wallets/transactions", response=list[dict])
@paginate
def wallet_transactions(request, corporation_id: int, division: int | None = None):
    corp = viewable_corporation(request, corporation_id, "wallets")
    qs = CorpTransaction.objects.filter(corporation=corp)
    if division:
        qs = qs.filter(division=division)
    rows = list(qs[:5000])
    types = types_by_id({r.type_id for r in rows})
    names = names_for({r.client_id for r in rows})
    locations = _locations({r.location_id for r in rows})
    return [
        {
            "id": f"{r.division}:{r.transaction_id}",
            "division": r.division,
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


# --- assets ---------------------------------------------------------------------------


def _asset_value(a, prices) -> float:
    return 0.0 if a.is_blueprint_copy else prices.get(a.type_id, 0.0) * a.quantity


@router.get("/{corporation_id}/assets")
def assets(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "assets")
    rows = list(CorpAsset.objects.filter(corporation=corp).only("root_location_id", "type_id", "quantity", "is_blueprint_copy"))
    prices = prices_by_type({r.type_id for r in rows})
    stats = defaultdict(lambda: {"items": 0, "value": 0.0})
    for r in rows:
        s = stats[r.root_location_id]
        s["items"] += 1
        s["value"] += _asset_value(r, prices)
    locations = _locations(stats)
    out = [
        {
            "location": describe(locations.get(lid)) or {"id": lid, "name": "Unknown location", "kind": "unknown", "system": None},
            "item_count": s["items"],
            "value": round(s["value"], 2),
        }
        for lid, s in stats.items()
    ]
    out.sort(key=lambda x: -x["value"])
    return {"total_value": round(sum(x["value"] for x in out), 2), "item_count": len(rows), "locations": out}


@router.get("/{corporation_id}/assets/{location_id}")
def asset_tree(request, corporation_id: int, location_id: int):
    corp = viewable_corporation(request, corporation_id, "assets")
    rows = list(CorpAsset.objects.filter(corporation=corp, root_location_id=location_id))
    types = types_by_id({r.type_id for r in rows})
    prices = prices_by_type({r.type_id for r in rows})
    ids = {r.item_id for r in rows}
    children = defaultdict(list)
    top = []
    for r in rows:
        (children[r.location_id] if r.location_type == "item" and r.location_id in ids else top).append(r)

    def node(a):
        kids = [node(c) for c in children.get(a.item_id, [])]
        return {
            "item_id": a.item_id,
            "type": type_out(a.type_id, types, copy=bool(a.is_blueprint_copy)),
            "name": a.name,
            "quantity": a.quantity,
            "flag": a.location_flag,
            "singleton": a.is_singleton,
            "bpc": bool(a.is_blueprint_copy),
            "value": round(_asset_value(a, prices) + sum(k["value"] for k in kids), 2),
            "children": sorted(kids, key=lambda k: (k["flag"], k["type"]["name"])),
        }

    return sorted((node(r) for r in top), key=lambda n: -n["value"])


# --- industry -------------------------------------------------------------------------

OPEN_JOBS = ("active", "paused", "ready")


@router.get("/{corporation_id}/industry", response=list[dict])
@paginate
def industry(request, corporation_id: int, status: str = "open"):
    corp = viewable_corporation(request, corporation_id, "industry")
    qs = CorpIndustryJob.objects.filter(corporation=corp)
    qs = qs.filter(status__in=OPEN_JOBS) if status == "open" else qs.exclude(status__in=OPEN_JOBS) if status == "done" else qs
    jobs = list(qs[:3000])
    now = timezone.now()
    types = types_by_id({j.blueprint_type_id for j in jobs} | {j.product_type_id for j in jobs if j.product_type_id})
    names = names_for({j.installer_id for j in jobs})
    locations = _locations({j.location_id for j in jobs})
    out = []
    for j in jobs:
        total = (j.end_date - j.start_date).total_seconds()
        st = "ready" if j.status == "active" and j.end_date <= now else j.status
        out.append(
            {
                "job_id": j.job_id,
                "activity": ACTIVITIES.get(j.activity_id, f"Activity {j.activity_id}"),
                "status": st,
                "installer": {"id": j.installer_id, "name": names.get(j.installer_id, ""), "portrait": portrait_url(j.installer_id, 64)},
                "blueprint": type_out(j.blueprint_type_id, types),
                "product": type_out(j.product_type_id, types) if j.product_type_id else None,
                "runs": j.runs,
                "cost": _f(j.cost),
                "start_date": j.start_date.isoformat(),
                "end_date": j.end_date.isoformat(),
                "progress": 1.0 if st != "active" or total <= 0 else max(0.0, min(1.0, (now - j.start_date).total_seconds() / total)),
                "location": describe(locations.get(j.location_id)),
            }
        )
    return out


@router.get("/{corporation_id}/industry/summary")
def industry_summary(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "industry")
    qs = CorpIndustryJob.objects.filter(corporation=corp)
    now = timezone.now()
    active = qs.filter(status="active")
    return {
        "active": active.filter(end_date__gt=now).count(),
        "ready": active.filter(end_date__lte=now).count() + qs.filter(status="ready").count(),
        "installers": qs.filter(status__in=OPEN_JOBS).values("installer_id").distinct().count(),
        "by_activity": [
            {"activity": ACTIVITIES.get(r["activity_id"], str(r["activity_id"])), "count": r["n"]}
            for r in qs.filter(status__in=OPEN_JOBS).values("activity_id").annotate(n=Count("id")).order_by("-n")
        ],
    }


# --- contracts and market -------------------------------------------------------------


@router.get("/{corporation_id}/contracts", response=list[dict])
@paginate
def contracts(request, corporation_id: int, status: str = ""):
    corp = viewable_corporation(request, corporation_id, "contracts")
    qs = CorpContract.objects.filter(corporation=corp)
    if status == "open":
        qs = qs.filter(status__in=("outstanding", "in_progress"))
    elif status:
        qs = qs.filter(status=status)
    rows = list(qs[:3000])
    names = names_for({r.issuer_id for r in rows} | {r.assignee_id for r in rows} | {r.acceptor_id for r in rows})
    locations = _locations({r.start_location_id for r in rows} | {r.end_location_id for r in rows})
    return [
        {
            "id": r.contract_id,
            "type": r.type,
            "status": r.status,
            "availability": r.availability,
            "title": r.title,
            "issuer": names.get(r.issuer_id),
            "assignee": names.get(r.assignee_id),
            "acceptor": names.get(r.acceptor_id),
            "price": _f(r.price),
            "reward": _f(r.reward),
            "collateral": _f(r.collateral),
            "volume": r.volume,
            "date_issued": _iso(r.date_issued),
            "date_expired": _iso(r.date_expired),
            "date_completed": _iso(r.date_completed),
            "start": describe(locations.get(r.start_location_id)),
            "end": describe(locations.get(r.end_location_id)),
        }
        for r in rows
    ]


@router.get("/{corporation_id}/market", response=list[dict])
@paginate
def market(request, corporation_id: int, state: str = "active", side: str = ""):
    corp = viewable_corporation(request, corporation_id, "market")
    qs = CorpMarketOrder.objects.filter(corporation=corp)
    if state:
        qs = qs.filter(state=state)
    if side in ("buy", "sell"):
        qs = qs.filter(is_buy_order=side == "buy")
    rows = list(qs[:3000])
    types = types_by_id({r.type_id for r in rows})
    names = names_for({r.issued_by for r in rows})
    locations = _locations({r.location_id for r in rows})
    labels = _division_names(corp)
    return [
        {
            "id": r.order_id,
            "type": type_out(r.type_id, types),
            "is_buy": r.is_buy_order,
            "price": float(r.price),
            "volume_total": r.volume_total,
            "volume_remain": r.volume_remain,
            "total": float(r.price) * r.volume_remain,
            "escrow": _f(r.escrow),
            "issued": r.issued.isoformat(),
            "expires": (r.issued + timedelta(days=r.duration)).isoformat(),
            "issued_by": names.get(r.issued_by),
            "division": labels.get(r.wallet_division) if r.wallet_division else None,
            "location": describe(locations.get(r.location_id)),
            "state": r.state,
        }
        for r in rows
    ]


@router.get("/{corporation_id}/market/summary")
def market_summary(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "market")
    active = list(CorpMarketOrder.objects.filter(corporation=corp, state="active"))
    sell = [o for o in active if not o.is_buy_order]
    buy = [o for o in active if o.is_buy_order]
    return {
        "sell_orders": len(sell),
        "buy_orders": len(buy),
        "sell_value": sum(float(o.price) * o.volume_remain for o in sell),
        "buy_value": sum(float(o.price) * o.volume_remain for o in buy),
        "escrow": sum(float(o.escrow or 0) for o in buy),
    }


# --- mining ---------------------------------------------------------------------------


@router.get("/{corporation_id}/mining")
def mining(request, corporation_id: int, days: int = DAYS):
    corp = viewable_corporation(request, corporation_id, "mining")
    days = max(1, min(days, 90))
    since = timezone.now().date() - timedelta(days=days - 1)
    rows = list(MiningObservation.objects.filter(corporation=corp, last_updated__gte=since))
    types = types_by_id({r.type_id for r in rows})
    prices = prices_by_type({r.type_id for r in rows})
    names = names_for({r.character_id for r in rows})
    per_day, per_char, per_type = defaultdict(float), defaultdict(lambda: {"quantity": 0, "value": 0.0}), defaultdict(lambda: {"quantity": 0, "value": 0.0})
    for r in rows:
        v = prices.get(r.type_id, 0.0) * r.quantity
        per_day[r.last_updated.isoformat()] += v
        per_char[r.character_id]["quantity"] += r.quantity
        per_char[r.character_id]["value"] += v
        per_type[r.type_id]["quantity"] += r.quantity
        per_type[r.type_id]["value"] += v
    registered = set(Character.objects.filter(pk__in=per_char).values_list("pk", flat=True))
    extractions = list(MoonExtraction.objects.filter(corporation=corp, natural_decay_time__gte=timezone.now() - timedelta(days=2)))
    structure_names = dict(Structure.objects.filter(structure_id__in=[e.structure_id for e in extractions]).values_list("structure_id", "name"))
    moon_names = names_for({e.moon_id for e in extractions})
    return {
        "days": days,
        "total_value": sum(per_day.values()),
        "total_quantity": sum(r.quantity for r in rows),
        "series": [{"date": (since + timedelta(days=i)).isoformat(), "value": per_day.get((since + timedelta(days=i)).isoformat(), 0.0)} for i in range(days)],
        "miners": sorted(
            (
                {"id": cid, "name": names.get(cid, f"Character {cid}"), "portrait": portrait_url(cid, 64), "registered": cid in registered, **v}
                for cid, v in per_char.items()
            ),
            key=lambda m: -m["value"],
        ),
        "ores": sorted(({"type": type_out(tid, types), **v} for tid, v in per_type.items()), key=lambda o: -o["value"]),
        "extractions": [
            {
                "structure": structure_names.get(e.structure_id) or f"Structure {e.structure_id}",
                "moon": moon_names.get(e.moon_id) or f"Moon {e.moon_id}",
                "start": e.extraction_start_time.isoformat(),
                "arrival": e.chunk_arrival_time.isoformat(),
                "decay": e.natural_decay_time.isoformat(),
            }
            for e in extractions
        ],
    }


# --- starbases and killmails ----------------------------------------------------------


@router.get("/{corporation_id}/starbases")
def starbases(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "starbases")
    rows = list(Starbase.objects.filter(corporation=corp))
    types = types_by_id({r.type_id for r in rows})
    systems = _systems({r.system_id for r in rows})
    moons = names_for({r.moon_id for r in rows})
    return [
        {
            "id": r.starbase_id,
            "type": type_out(r.type_id, types),
            "system": _system(r.system_id, systems),
            "moon": moons.get(r.moon_id) if r.moon_id else None,
            "state": r.state or "unknown",
            "onlined_since": _iso(r.onlined_since),
            "reinforced_until": _iso(r.reinforced_until),
            "unanchor_at": _iso(r.unanchor_at),
        }
        for r in rows
    ]


@router.get("/{corporation_id}/killmails", response=list[dict])
@paginate
def killmails(request, corporation_id: int, kind: str = ""):
    corp = viewable_corporation(request, corporation_id, "killmails")
    qs = CorporationKillmail.objects.filter(corporation=corp).select_related("killmail").order_by("-killmail__time")
    if kind == "kills":
        qs = qs.filter(is_loss=False)
    elif kind == "losses":
        qs = qs.filter(is_loss=True)
    links = list(qs[:2000])
    kms = [link.killmail for link in links]
    types = types_by_id({k.victim_ship_type_id for k in kms})
    names = names_for({k.victim_character_id for k in kms} | {k.victim_corporation_id for k in kms} | {k.final_blow_character_id for k in kms})
    systems = _systems({k.solar_system_id for k in kms})
    return [
        {
            "id": k.id,
            "time": k.time.isoformat(),
            "is_loss": link.is_loss,
            "ship": type_out(k.victim_ship_type_id, types),
            "victim": names.get(k.victim_character_id) or "Structure / NPC",
            "victim_corporation": names.get(k.victim_corporation_id),
            "final_blow": names.get(k.final_blow_character_id),
            "attackers": k.attacker_count,
            "value": k.value,
            "system": _system(k.solar_system_id, systems),
            "zkillboard": f"https://zkillboard.com/kill/{k.id}/",
        }
        for link, k in zip(links, kms)
    ]


@router.get("/{corporation_id}/killmails/summary")
def killmail_summary(request, corporation_id: int):
    corp = viewable_corporation(request, corporation_id, "killmails")
    links = list(CorporationKillmail.objects.filter(corporation=corp).select_related("killmail"))
    kills = [link.killmail.value for link in links if not link.is_loss]
    losses = [link.killmail.value for link in links if link.is_loss]
    return {"kills": len(kills), "losses": len(losses), "isk_destroyed": sum(kills), "isk_lost": sum(losses)}
