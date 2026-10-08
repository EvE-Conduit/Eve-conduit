"""Ship replacement: which losses a member can claim, what they pay out, and reviewing and paying requests.

Losses come from the killmails the character sheet syncs (``conduit.sheet.killmails``). A loss that hasn't synced
(the character never granted the killmail scope, or it's older than ESI's recent list) can be added from the
in-game "Copy external kill link", which holds the killmail's id and hash, or from its zKillboard page, whose hash
zKillboard's API tells us.
"""

from __future__ import annotations

import re
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import IntegrityError, transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.events import bus
from conduit.eve.models import EveCorporation, portrait_url
from conduit.eve.tasks import ensure_eve_names, names_for
from conduit.sde.models import ItemType, SolarSystem
from conduit.sheet.killmails.models import CharacterKillmail, Killmail
from conduit.sheet.util import parse_dt, prices_by_type, type_out, types_by_id

from .models import ShipRule, SrpRequest, SrpSettings

SHIP_CATEGORY = 6
CAPSULE_GROUP = 29
KILL_LINK_RE = re.compile(r"killmails/(\d+)/([0-9a-fA-F]{40})")
ZKILL_LINK_RE = re.compile(r"zkillboard\.com/kill/(\d+)")
ZKILL_API = "https://zkillboard.com/api/killID/{}/"


class SrpError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


#: Killmail ids are far below this; bigger numbers are typos or probes (and would overflow the database).
MAX_KILLMAIL_ID = 2**31 - 1
#: No ship replacement is anywhere near this many ISK.
MAX_PAYOUT = Decimal("1e15")


def _isk(value) -> Decimal:
    try:
        amount = Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    except (ArithmeticError, ValueError):
        raise SrpError("Enter the payout as a number of ISK") from None
    if not amount.is_finite() or amount > MAX_PAYOUT:
        raise SrpError("That payout is far too large")
    return amount


def _killmail_id(value) -> int:
    km_id = int(value)
    if not 0 < km_id <= MAX_KILLMAIL_ID:
        raise SrpError("That isn't a killmail id", 404)
    return km_id


# --- payouts ---------------------------------------------------------------------------------------------------


def rule_for(ship_type_id: int, rules: list[ShipRule] | None = None) -> ShipRule | None:
    """The rule for a ship: its own, else its group's."""
    if rules is None:
        rules = list(ShipRule.objects.all())
    group_id = ItemType.objects.filter(pk=ship_type_id).values_list("group_id", flat=True).first()
    by_type = next((r for r in rules if r.type_id == ship_type_id), None)
    return by_type or next((r for r in rules if group_id is not None and r.group_id == group_id), None)


def suggest(ship_type_id: int, value: float, settings: SrpSettings | None = None, rules: list[ShipRule] | None = None) -> Decimal | None:
    """What the rules pay for losing this ship; None when it isn't covered."""
    settings = settings or SrpSettings.load()
    rule = rule_for(ship_type_id, rules)
    if rule is not None:
        if not rule.covered:
            return None
        if rule.payout is not None:
            return _isk(rule.payout)
        return _isk(value * float(rule.percent if rule.percent is not None else settings.default_percent) / 100)
    if settings.covered_only:
        return None
    return _isk(value * float(settings.default_percent) / 100)


# --- losses a member can claim -----------------------------------------------------------------------------------


def _counts(km: Killmail, settings: SrpSettings) -> bool:
    return not settings.corporations or km.victim_corporation_id in settings.corporations


def claimable(user) -> list[dict]:
    """The member's recent losses that haven't been claimed, newest first."""
    settings = SrpSettings.load()
    since = timezone.now() - timedelta(days=settings.max_age_days)
    links = (
        CharacterKillmail.objects.filter(character__user=user, is_loss=True, killmail__time__gte=since, killmail__srp_request__isnull=True)
        .select_related("killmail", "character")
        .order_by("-killmail__time")[:200]
    )
    kms = [link.killmail for link in links if link.killmail.victim_character_id == link.character_id and _counts(link.killmail, settings)]
    rules = list(ShipRule.objects.all())
    out = killmails_out(kms)
    for row, km in zip(out, kms):
        row["suggested"] = _float(suggest(km.victim_ship_type_id, km.value, settings, rules))
    return out


def _float(d: Decimal | None) -> float | None:
    return float(d) if d is not None else None


def killmails_out(kms: list[Killmail]) -> list[dict]:
    types = types_by_id({k.victim_ship_type_id for k in kms})
    systems = {s.id: s for s in SolarSystem.objects.filter(pk__in={k.solar_system_id for k in kms}).select_related("region")}
    names = names_for({k.victim_character_id for k in kms})
    out = []
    for k in kms:
        system = systems.get(k.solar_system_id)
        out.append({
            "killmail_id": k.id,
            "time": k.time.isoformat(),
            "character": {"id": k.victim_character_id, "name": names.get(k.victim_character_id, "")},
            "ship": type_out(k.victim_ship_type_id, types),
            "system": {"id": k.solar_system_id, "name": system.name, "security": system.display_security, "region": system.region.name} if system else None,
            "value": k.value,
            "attackers": k.attacker_count,
            "zkillboard": f"https://zkillboard.com/kill/{k.id}/",
        })
    return out


def _value(data: dict) -> float:
    """Ship plus everything destroyed or dropped, at today's average prices (as the character sheet does)."""
    victim = data["victim"]
    items = victim.get("items", [])
    flat = items + [child for i in items for child in i.get("items", [])]
    prices = prices_by_type({victim["ship_type_id"], *(i["item_type_id"] for i in flat)})
    total = prices.get(victim["ship_type_id"], 0)
    for i in flat:
        total += prices.get(i["item_type_id"], 0) * ((i.get("quantity_destroyed") or 0) + (i.get("quantity_dropped") or 0))
    return total


def killmail_from_link(link: str) -> Killmail:
    """The killmail behind an ESI kill link, fetched from ESI if it hasn't been seen yet."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiError

    m = KILL_LINK_RE.search(link or "")
    if m:
        km_id, km_hash = _killmail_id(m.group(1)[:12]), m.group(2).lower()
    else:
        z = ZKILL_LINK_RE.search(link or "")
        if not z:
            raise SrpError("Paste a zKillboard link (https://zkillboard.com/kill/123/) or the killmail's \"Copy external kill link\"")
        km_id = _killmail_id(z.group(1)[:12])
        known = Killmail.objects.filter(pk=km_id).first()
        if known is not None:
            return known
        km_hash = zkill_hash(km_id)
    km = Killmail.objects.filter(pk=km_id).first()
    if km is not None:
        if km.hash != km_hash:
            raise SrpError("That kill link doesn't match the killmail")
        return km
    try:
        data = esi().get(f"/killmails/{km_id}/{km_hash}").data
    except EsiError:
        raise SrpError("ESI didn't recognise that kill link") from None
    victim = data["victim"]
    final = next((a for a in data.get("attackers", []) if a.get("final_blow")), {})
    km, _ = Killmail.objects.get_or_create(pk=km_id, defaults=dict(
        hash=km_hash,
        time=parse_dt(data["killmail_time"]),
        solar_system_id=data["solar_system_id"],
        victim_character_id=victim.get("character_id"),
        victim_corporation_id=victim.get("corporation_id"),
        victim_alliance_id=victim.get("alliance_id"),
        victim_ship_type_id=victim["ship_type_id"],
        damage_taken=victim.get("damage_taken", 0),
        attacker_count=len(data.get("attackers", [])),
        final_blow_character_id=final.get("character_id"),
        value=_value(data),
        data=data,
    ))
    ensure_eve_names({victim.get("character_id"), victim.get("corporation_id"), victim.get("alliance_id"), final.get("character_id")})
    return km


def zkill_hash(killmail_id: int) -> str:
    """The hash ESI needs for a killmail, from zKillboard (a zKillboard link only has the id)."""
    import httpx

    from conduit.esi.client import user_agent

    try:
        resp = httpx.get(ZKILL_API.format(killmail_id), headers={"User-Agent": user_agent(), "Accept-Encoding": "gzip"},
                         timeout=15, follow_redirects=False)
        resp.raise_for_status()
        rows = resp.json()
    except (httpx.HTTPError, ValueError):
        raise SrpError("zKillboard didn't answer; try again in a moment, or use the in-game \"Copy external kill link\"") from None
    row = next((r for r in rows if isinstance(r, dict) and r.get("killmail_id") == killmail_id), None) if isinstance(rows, list) else None
    km_hash = str((row or {}).get("zkb", {}).get("hash", ""))
    if not re.fullmatch(r"[0-9a-fA-F]{40}", km_hash):
        raise SrpError("zKillboard doesn't know that killmail")
    return km_hash.lower()


# --- requests ------------------------------------------------------------------------------------------------------


def submit(user, *, killmail_id: int | None = None, link: str = "", fleet: str = "", fc: str = "", notes: str = "") -> SrpRequest:
    from conduit.notify.services import notify_permission

    settings = SrpSettings.load()
    km = killmail_from_link(link) if link else Killmail.objects.filter(pk=_killmail_id(killmail_id or 0)).first()
    if km is None:
        raise SrpError("No such killmail", 404)
    char = Character.objects.filter(pk=km.victim_character_id, user=user).first()
    if char is None:
        raise SrpError("That loss isn't one of your characters'")
    if not _counts(km, settings):
        raise SrpError("Losses in that corporation aren't covered")
    if km.time < timezone.now() - timedelta(days=settings.max_age_days):
        raise SrpError(f"Losses can be claimed for {settings.max_age_days} days")
    fleet, fc, notes = fleet.strip()[:200], fc.strip()[:100], notes.strip()[:2000]
    if settings.require_fleet and not fleet:
        raise SrpError("Say which fleet you lost it in")
    suggested = suggest(km.victim_ship_type_id, km.value, settings)
    if suggested is None:
        raise SrpError("That ship isn't covered by ship replacement")
    try:
        with transaction.atomic():
            req = SrpRequest.objects.create(killmail=km, user=user, character_id=char.pk, character_name=char.name,
                                            fleet=fleet, fc=fc, notes=notes, suggested=suggested)
    except IntegrityError:
        raise SrpError("That loss has already been claimed") from None
    ship = ItemType.objects.filter(pk=km.victim_ship_type_id).values_list("name", flat=True).first() or "a ship"
    bus.emit("srp.request_created", user_id=user.pk, user=user.display_name, request_id=req.pk, ship=ship,
             value=km.value, title="SRP requested", summary=f"{char.name} lost {ship} ({fleet or 'no fleet given'})",
             link=f"/p/srp/requests/{req.pk}", level="info")
    notify_permission("srp.review_requests", f"SRP request: {char.name}'s {ship}", f"{suggested:,.0f} ISK suggested",
                      link=f"/p/srp/requests/{req.pk}", category="p.srp")
    return req


@transaction.atomic
def withdraw(req: SrpRequest, user) -> None:
    req = _locked(req)
    if req.user_id != user.pk:
        raise SrpError("That isn't your request", 403)
    if req.status != SrpRequest.Status.PENDING:
        raise SrpError("Only pending requests can be withdrawn")
    req.delete()


def _may_decide(req: SrpRequest, user) -> None:
    """Nobody decides their own request, administrators included."""
    if req.user_id == user.pk:
        raise SrpError("Someone else has to decide your own request", 403)


def _locked(req: SrpRequest) -> SrpRequest:
    """The request as it is now, locked until the transaction ends: someone may have withdrawn, decided or paid it
    since it was loaded, and saving the old copy would undo that (or bring a withdrawn request back)."""
    fresh = SrpRequest.objects.select_for_update().filter(pk=req.pk).first()
    if fresh is None:
        raise SrpError("That request was withdrawn", 404)
    return fresh


def _ship_name(req: SrpRequest) -> str:
    return ItemType.objects.filter(pk=req.killmail.victim_ship_type_id).values_list("name", flat=True).first() or "ship"


@transaction.atomic
def approve(req: SrpRequest, by, payout: float | None = None, note: str = "") -> SrpRequest:
    from conduit.notify.services import notify

    req = _locked(req)
    _may_decide(req, by)
    if req.status not in (SrpRequest.Status.PENDING, SrpRequest.Status.REJECTED):
        raise SrpError(f"This request is already {req.get_status_display().lower()}")
    amount = _isk(payout) if payout is not None else req.suggested
    if amount is None or amount <= 0:
        raise SrpError("Enter the payout")
    req.status, req.payout = SrpRequest.Status.APPROVED, amount
    req.decided_at, req.decided_by, req.decision_note = timezone.now(), by, note.strip()[:2000]
    req.save(update_fields=["status", "payout", "decided_at", "decided_by", "decision_note"])
    ship = _ship_name(req)
    bus.emit("srp.request_decided", user_id=req.user_id, user=req.user.display_name, request_id=req.pk, decision="approved",
             payout=float(amount), title="SRP approved", summary=f"{req.character_name}'s {ship}: {amount:,.0f} ISK",
             link=f"/p/srp/requests/{req.pk}", level="success")
    notify(req.user_id, f"SRP approved: {ship}", f"{amount:,.0f} ISK will be paid to {req.character_name}." + (f"\n{req.decision_note}" if req.decision_note else ""),
           link=f"/p/srp/requests/{req.pk}", level="success", category="p.srp")
    return req


@transaction.atomic
def reject(req: SrpRequest, by, note: str) -> SrpRequest:
    from conduit.notify.services import notify

    req = _locked(req)
    _may_decide(req, by)
    if req.status not in (SrpRequest.Status.PENDING, SrpRequest.Status.APPROVED):
        raise SrpError(f"This request is already {req.get_status_display().lower()}")
    note = note.strip()[:2000]
    if not note:
        raise SrpError("Say why, so the member knows")
    req.status, req.payout = SrpRequest.Status.REJECTED, None
    req.decided_at, req.decided_by, req.decision_note = timezone.now(), by, note
    req.save(update_fields=["status", "payout", "decided_at", "decided_by", "decision_note"])
    ship = _ship_name(req)
    bus.emit("srp.request_decided", user_id=req.user_id, user=req.user.display_name, request_id=req.pk, decision="rejected",
             title="SRP rejected", summary=f"{req.character_name}'s {ship}: {note}", link=f"/p/srp/requests/{req.pk}", level="warning")
    notify(req.user_id, f"SRP rejected: {ship}", note, link=f"/p/srp/requests/{req.pk}", level="warning", category="p.srp")
    return req


@transaction.atomic
def reopen(req: SrpRequest, by) -> SrpRequest:
    """Back to pending, e.g. after a mistaken decision. Paid requests stay paid."""
    req = _locked(req)
    _may_decide(req, by)
    if req.status not in (SrpRequest.Status.APPROVED, SrpRequest.Status.REJECTED):
        raise SrpError("Only approved or rejected requests can be reopened")
    req.status, req.payout, req.decided_at, req.decided_by, req.decision_note = SrpRequest.Status.PENDING, None, None, None, ""
    req.save(update_fields=["status", "payout", "decided_at", "decided_by", "decision_note"])
    return req


@transaction.atomic
def mark_paid(ids: list[int], by) -> tuple[list[SrpRequest], list[int]]:
    """Mark approved requests as paid; the rest are skipped. Payers can't mark their own requests paid (someone else
    sends that ISK). Returns the paid requests and the ids of the payer's own that were skipped."""
    from conduit.notify.services import notify

    approved = SrpRequest.objects.select_for_update().filter(pk__in=ids, status=SrpRequest.Status.APPROVED)
    own = list(approved.filter(user=by).values_list("pk", flat=True))
    reqs = list(approved.exclude(user=by).select_related("user", "killmail"))
    now = timezone.now()
    for req in reqs:
        req.status, req.paid_at, req.paid_by = SrpRequest.Status.PAID, now, by
        req.save(update_fields=["status", "paid_at", "paid_by"])
        ship = _ship_name(req)
        bus.emit("srp.request_paid", user_id=req.user_id, user=req.user.display_name, request_id=req.pk, payout=float(req.payout),
                 title="SRP paid", summary=f"{req.character_name}'s {ship}: {req.payout:,.0f} ISK", link=f"/p/srp/requests/{req.pk}", level="success")
        notify(req.user_id, f"SRP paid: {ship}", f"{req.payout:,.0f} ISK has been sent to {req.character_name}.",
               link=f"/p/srp/requests/{req.pk}", level="success", category="p.srp")
    return reqs, own


# --- output --------------------------------------------------------------------------------------------------------


def can_review(user) -> bool:
    return user.has_perm("srp.review_requests") or user.has_perm("srp.pay_requests")


def requests_out(reqs: list[SrpRequest]) -> list[dict]:
    kms = [r.killmail for r in reqs]
    by_km = {row["killmail_id"]: row for row in killmails_out(kms)}
    users = {}
    for r in reqs:
        users.setdefault(r.user_id, r.user)
    out = []
    for r in reqs:
        km = by_km[r.killmail_id]
        u = users[r.user_id]
        out.append({
            "id": r.pk,
            "status": r.status,
            "user": {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id or r.character_id, 64)},
            "character": {"id": r.character_id, "name": r.character_name},
            "ship": km["ship"],
            "system": km["system"],
            "time": km["time"],
            "value": km["value"],
            "zkillboard": km["zkillboard"],
            "killmail_id": r.killmail_id,
            "fleet": r.fleet,
            "fc": r.fc,
            "notes": r.notes,
            "suggested": _float(r.suggested),
            "payout": _float(r.payout),
            "created_at": r.created_at.isoformat(),
            "decided_at": r.decided_at.isoformat() if r.decided_at else None,
            "decided_by": r.decided_by.display_name if r.decided_by else None,
            "decision_note": r.decision_note,
            "paid_at": r.paid_at.isoformat() if r.paid_at else None,
            "paid_by": r.paid_by.display_name if r.paid_by else None,
        })
    return out


def base_queryset():
    return SrpRequest.objects.select_related("killmail", "user__main_character", "decided_by__main_character", "paid_by__main_character")


def queue(status: str = "pending", q: str = "") -> dict:
    qs = base_queryset()
    if status != "all":
        qs = qs.filter(status=status)
    if q:
        ship_ids = list(ItemType.objects.filter(name__icontains=q, group__category_id=SHIP_CATEGORY).values_list("pk", flat=True)[:200])
        qs = qs.filter(Q(character_name__icontains=q) | Q(fleet__icontains=q) | Q(fc__icontains=q) | Q(killmail__victim_ship_type_id__in=ship_ids))
    if status == "pending":
        qs = qs.order_by("created_at")
    reqs = list(qs[:500])
    counts = dict(SrpRequest.objects.values_list("status").annotate(n=Count("pk")))
    month_ago = timezone.now() - timedelta(days=30)
    return {
        "requests": requests_out(reqs),
        "counts": {s: counts.get(s, 0) for s in SrpRequest.Status.values},
        "totals": {
            "pending": float(SrpRequest.objects.filter(status="pending").aggregate(s=Sum("suggested"))["s"] or 0),
            "approved": float(SrpRequest.objects.filter(status="approved").aggregate(s=Sum("payout"))["s"] or 0),
            "paid_30d": float(SrpRequest.objects.filter(status="paid", paid_at__gte=month_ago).aggregate(s=Sum("payout"))["s"] or 0),
        },
    }


# Inventory flags on a killmail, grouped as the fitting window shows them.
SLOTS = [
    ("High slots", range(27, 35)),
    ("Medium slots", range(19, 27)),
    ("Low slots", range(11, 19)),
    ("Rigs", range(92, 100)),
    ("Subsystems", range(125, 133)),
    ("Drone bay", (87,)),
    ("Fighter bay", (158,)),
    ("Cargo", (5,)),
]


def fitting(km: Killmail) -> list[dict]:
    items = km.data.get("victim", {}).get("items", [])
    types = types_by_id({i["item_type_id"] for i in items})
    prices = prices_by_type({i["item_type_id"] for i in items})
    groups: dict[str, list] = {label: [] for label, _ in SLOTS}
    groups["Other"] = []
    for i in items:
        label = next((lbl for lbl, flags in SLOTS if i.get("flag") in flags), "Other")
        destroyed, dropped = i.get("quantity_destroyed") or 0, i.get("quantity_dropped") or 0
        groups[label].append({
            **type_out(i["item_type_id"], types, copy=i.get("singleton") == 2),
            "destroyed": destroyed,
            "dropped": dropped,
            "value": prices.get(i["item_type_id"], 0) * (destroyed + dropped),
        })
    return [{"label": label, "items": rows} for label, rows in groups.items() if rows]


def detail(req: SrpRequest) -> dict:
    km = req.killmail
    final = names_for({km.final_blow_character_id, km.victim_corporation_id, km.victim_alliance_id})
    history = dict(SrpRequest.objects.filter(user_id=req.user_id).exclude(pk=req.pk).values_list("status").annotate(n=Count("pk")))
    return {
        **requests_out([req])[0],
        "fitting": fitting(km),
        "victim_corporation": final.get(km.victim_corporation_id),
        "victim_alliance": final.get(km.victim_alliance_id),
        "final_blow": final.get(km.final_blow_character_id),
        "attackers": km.attacker_count,
        "rule": rule_out(rule_for(km.victim_ship_type_id)),
        "history": {s: history.get(s, 0) for s in SrpRequest.Status.values},
    }


# --- rules ---------------------------------------------------------------------------------------------------------


def rule_out(r: ShipRule | None) -> dict | None:
    if r is None:
        return None
    return {
        "id": r.pk,
        "kind": "ship" if r.type_id else "group",
        "type_id": r.type_id,
        "group_id": r.group_id,
        "name": r.name,
        "icon": type_out(r.type_id, {})["icon"] if r.type_id else None,
        "covered": r.covered,
        "payout": _float(r.payout),
        "percent": _float(r.percent),
        "note": r.note,
    }


def save_rule(*, rule_id: int | None, type_id: int | None, group_id: int | None, covered: bool, payout: float | None,
              percent: float | None, note: str) -> ShipRule:
    from conduit.sde.models import ItemGroup

    if bool(type_id) == bool(group_id):
        raise SrpError("Pick a ship or a ship group")
    if type_id:
        t = ItemType.objects.filter(pk=type_id, group__category_id=SHIP_CATEGORY).first()
        if t is None:
            raise SrpError("That isn't a ship")
        name = t.name
    else:
        g = ItemGroup.objects.filter(pk=group_id, category_id=SHIP_CATEGORY).first()
        if g is None:
            raise SrpError("That isn't a ship group")
        name = g.name
    if payout is not None and payout < 0:
        raise SrpError("The payout can't be negative")
    if percent is not None and not 0 <= percent <= 1000:
        raise SrpError("The percentage must be between 0 and 1000")
    rule = ShipRule.objects.filter(pk=rule_id).first() if rule_id else ShipRule()
    if rule is None:
        raise SrpError("No such rule", 404)
    rule.type_id, rule.group_id, rule.name = type_id or None, group_id or None, name
    rule.covered = covered
    rule.payout = _isk(payout) if covered and payout is not None else None
    rule.percent = Decimal(str(round(percent, 2))) if covered and payout is None and percent is not None else None
    rule.note = note.strip()[:200]
    try:
        with transaction.atomic():
            rule.save()
    except IntegrityError:
        raise SrpError(f"{name} already has a rule") from None
    return rule


def ship_search(q: str, limit: int = 20) -> list[dict]:
    """Ships and ship groups matching ``q``, for adding rules."""
    from conduit.sde.models import ItemGroup

    q = q.strip()
    if len(q) < 2:
        return []
    groups = ItemGroup.objects.filter(category_id=SHIP_CATEGORY, published=True, name__icontains=q).exclude(pk=CAPSULE_GROUP).order_by("name")[:5]
    ships = ItemType.objects.filter(group__category_id=SHIP_CATEGORY, published=True, name__icontains=q).select_related("group").order_by("name")[:limit]
    return [
        *({"kind": "group", "id": g.pk, "name": g.name, "subtitle": "Every ship in this group", "icon": None} for g in groups),
        *({"kind": "ship", "id": t.pk, "name": t.name, "subtitle": t.group.name, "icon": type_out(t.pk, {t.pk: t})["icon"]} for t in ships),
    ]


def corporations() -> list[dict]:
    """Corporations with registered members, for the settings."""
    ids = set(Character.objects.exclude(corporation_id=None).values_list("corporation_id", flat=True).distinct())
    return [{"id": c.pk, "name": c.name, "ticker": c.ticker} for c in EveCorporation.objects.filter(pk__in=ids).order_by("name")]
