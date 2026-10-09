"""Member Audit: look through the data of every character the viewer may see in one place: mail, who members deal
with (counterparties), wallet journals, contracts and who has the skills for a ship or skill list.

Who is included follows the character-sheet permissions (every member, the alliance or the corporation);
``sheet.use_member_audit`` only opens the page. Seeing a character's wallet, contracts or counterparties here goes
in the snooper log like opening that section of their character sheet; mail is logged when a mail is opened.
Searches and skill checks go in the audit log.
"""

import hashlib
from collections import defaultdict
from decimal import Decimal

from django.core.cache import cache
from django.db.models import Count, F, Max, Q, Sum
from django.http import Http404
from ninja import Router, Schema
from ninja.errors import HttpError

from conduit.accounts.models import Character
from conduit.audit.services import record, record_snoop
from conduit.eve.models import EveName
from conduit.paging import page
from conduit.sde.models import ItemType

from .access import viewable_characters
from .contacts.api import entity_image
from .contacts.models import Contact
from .contracts.api import OPEN, _matching_items
from .contracts.api import _rows as _contract_rows
from .contracts.models import Contract
from .mail.api import _people, _row
from .mail.models import Mail
from .models import SyncStatus
from .skills import training
from .util import prices_by_type, type_out, types_by_id
from .wallet.models import JournalEntry, WalletTransaction

PERM = "sheet.use_member_audit"
SEARCH_DEDUPE_SECONDS = 600  # the same viewer and search is recorded once per 10 minutes
MAX_QUERY = 200  # longer searches are cut, so they can't bloat the audit log
NPC_ID_LIMIT = 4_000_000  # NPC corporations, factions and agents live below this
MAX_SKILL_TEXT = 20_000
MAX_CHECK_TYPES = 20

router = Router(tags=["member audit"])


def _characters(request, corporation: int | None = None):
    if not request.user.has_perm(PERM):
        raise HttpError(403, "You don't have access to Member Audit")
    qs = viewable_characters(request.user)
    return qs.filter(corporation_id=corporation) if corporation else qs


def _note_search(request, what: str, q: str):
    # Searches are GETs, so a link on another site could open one in an auditor's browser and put words in their
    # mouth in the audit log. Browsers mark such requests; only the site's own pages are recorded.
    if request.META.get("HTTP_SEC_FETCH_SITE", "same-origin") not in {"same-origin", "none"}:
        return
    key = hashlib.sha256(q.lower().encode()).hexdigest()
    if cache.add(f"member_audit:{request.user.pk}:{what}:{key}", 1, SEARCH_DEDUPE_SECONDS):
        record("member_audit.search", f"searched members' {what} in Member Audit for “{q}”"[:300], request=request, details={"section": what, "q": q})


def _snoop(request, characters, section: str):
    """Seeing a character's data here counts as looking at that section of their sheet."""
    for c in {c.pk: c for c in characters}.values():
        record_snoop(request, c, section)


def _member(c: Character) -> dict:
    corp = c.corporation
    return {"id": c.pk, "name": c.name, "owner": c.user.display_name if c.user_id else "", "corporation": corp.ticker if corp else ""}


def _entity(entity_id: int | None, names: dict[int, EveName]) -> dict | None:
    if not entity_id:
        return None
    n = names.get(entity_id)
    kind = n.category if n else "character"
    return {"id": entity_id, "name": n.name if n else str(entity_id), "type": kind, "image": entity_image(kind, entity_id)}


def _names(ids) -> dict[int, EveName]:
    """Names of these ids; characters registered here don't need to be in the name cache."""
    ids = {i for i in ids if i}
    out = {n.id: n for n in EveName.objects.filter(pk__in=ids)}
    for pk, name in Character.objects.filter(pk__in=ids - out.keys()).values_list("pk", "name"):
        out[pk] = EveName(id=pk, name=name, category="character")
    return out


def _ours():
    """Ids that count as "inside": every character registered here and their corporations."""
    return Character.objects.values("pk"), Character.objects.exclude(corporation=None).values("corporation_id")


def _outsider(field: str) -> Q:
    """``field`` is a player character or corporation that isn't registered here."""
    chars, corps = _ours()
    return Q(**{f"{field}__gte": NPC_ID_LIMIT}) & ~Q(**{f"{field}__in": chars}) & ~Q(**{f"{field}__in": corps})


@router.get("/summary")
def summary(request):
    """How many characters are in reach, how many have their mail synced, and their corporations (for the filter)."""
    chars = _characters(request)
    corps = (
        chars.exclude(corporation=None)
        .values("corporation_id", "corporation__name", "corporation__ticker")
        .annotate(n=Count("pk"))
        .order_by("corporation__name")
    )
    return {
        "characters": chars.count(),
        "mail_synced": SyncStatus.objects.filter(character__in=chars.values("pk"), section="mail", last_success__isnull=False).count(),
        "corporations": [{"id": c["corporation_id"], "name": c["corporation__name"], "ticker": c["corporation__ticker"], "characters": c["n"]} for c in corps],
    }


def _holder(m: Mail) -> dict:
    c = m.character
    return {"id": c.pk, "name": c.name, "owner": c.user.display_name if c.user_id else "", "is_read": m.is_read}


@router.get("/mail")
def mail(request, q: str = "", corporation: int | None = None, sender: int | None = None, limit: int = 50, offset: int = 0):
    """Mail of every character in reach, newest first. A mail several members received is one row, with each
    member character that has it under ``held_by``. ``q`` matches the subject, text and sender's name."""
    chars = _characters(request, corporation).values("pk")
    qs = Mail.objects.filter(character__in=chars)
    q = q.strip()[:MAX_QUERY]
    if q:
        senders = EveName.objects.filter(name__icontains=q).values("id")
        qs = qs.filter(Q(subject__icontains=q) | Q(body__icontains=q) | Q(sender_id__in=senders))
        _note_search(request, "mail", q)
    if sender:
        qs = qs.filter(sender_id=sender)
    result = page(qs.values("mail_id").annotate(ts=Max("timestamp")).order_by("-ts", "-mail_id"), lambda r: r["mail_id"], limit, offset)

    copies: dict[int, list[Mail]] = {}
    for m in Mail.objects.filter(mail_id__in=result["items"], character__in=chars).select_related("character__user").order_by("character__name"):
        copies.setdefault(m.mail_id, []).append(m)
    firsts = [copies[i][0] for i in result["items"] if i in copies]
    names = _people(firsts)
    result["items"] = [{**_row(m, names), "held_by": [_holder(c) for c in copies[m.mail_id]]} for m in firsts]
    return result


@router.get("/mail/{mail_id}")
def mail_detail(request, mail_id: int):
    copies = list(Mail.objects.filter(mail_id=mail_id, character__in=_characters(request).values("pk")).select_related("character__user").order_by("character__name"))
    if not copies:
        raise Http404
    for m in copies:
        record_snoop(request, m.character, "mail")
    best = next((m for m in copies if m.body_fetched), copies[0])
    return {**_row(best, _people([best])), "held_by": [_holder(m) for m in copies], "body": best.body, "body_loaded": best.body_fetched}


# --- counterparties: every member who dealt with one character, corporation or alliance ---------------------------


@router.get("/entities")
def entities(request, q: str = ""):
    """Names to pick a counterparty from: anyone the synced data has mentioned."""
    _characters(request)
    q = q.strip()[:MAX_QUERY]
    if len(q) < 3:
        return []
    from conduit.search.providers import ranked

    hits = ranked(EveName.objects.filter(name__icontains=q, category__in=("character", "corporation", "alliance")), "name", q)[:10]
    return [{"id": n.id, "name": n.name, "type": n.category, "image": entity_image(n.category, n.id)} for n in hits]


@router.get("/counterparty")
def counterparty(request, entity: int, corporation: int | None = None):
    """Every member character in reach that paid, traded, mailed, contracted with or has a contact for ``entity``
    (matched by its own id: a corporation's members' personal dealings aren't included)."""
    chars = _characters(request, corporation).exclude(pk=entity)
    ids = chars.values("pk")
    rows: dict[int, dict] = defaultdict(lambda: {"journal": 0, "isk_in": 0.0, "isk_out": 0.0, "market": 0, "mail": 0, "contracts": 0, "standing": None, "last": None})

    def bump(cid, source, n, when):
        row = rows[cid]
        row[source] += n
        if when and (row["last"] is None or when > row["last"]):
            row["last"] = when

    journal = JournalEntry.objects.filter(character__in=ids).filter(Q(first_party_id=entity) | Q(second_party_id=entity))
    for r in journal.values("character_id").annotate(n=Count("id"), last=Max("date"), isk_in=Sum("amount", filter=Q(amount__gt=0)), isk_out=Sum("amount", filter=Q(amount__lt=0))):
        bump(r["character_id"], "journal", r["n"], r["last"])
        rows[r["character_id"]]["isk_in"] = float(r["isk_in"] or 0)
        rows[r["character_id"]]["isk_out"] = float(-(r["isk_out"] or 0))
    for r in WalletTransaction.objects.filter(character__in=ids, client_id=entity).values("character_id").annotate(n=Count("id"), last=Max("date")):
        bump(r["character_id"], "market", r["n"], r["last"])
    # Recipients are a JSON list; the text match narrows it down and the loop checks the id properly.
    for m in Mail.objects.filter(character__in=ids).filter(Q(sender_id=entity) | Q(recipients__icontains=str(entity))).only("character_id", "sender_id", "recipients", "timestamp"):
        if m.sender_id == entity or any(r.get("recipient_id") == entity for r in m.recipients or ()):
            bump(m.character_id, "mail", 1, m.timestamp)
    contracts = Contract.objects.filter(character__in=ids).filter(Q(issuer_id=entity) | Q(issuer_corporation_id=entity) | Q(assignee_id=entity) | Q(acceptor_id=entity))
    for r in contracts.values("character_id").annotate(n=Count("id"), last=Max("date_issued")):
        bump(r["character_id"], "contracts", r["n"], r["last"])
    for cid, standing in Contact.objects.filter(character__in=ids, contact_id=entity).values_list("character_id", "standing"):
        rows[cid]["standing"] = standing

    members = {c.pk: c for c in Character.objects.filter(pk__in=rows).select_related("user", "corporation")}
    name = _names([entity])
    target = _entity(entity, name)
    _note_search(request, "counterparties", target["name"])
    _snoop(request, members.values(), "intel")
    out = [
        {**row, "character": _member(members[cid]), "total": row["journal"] + row["market"] + row["mail"] + row["contracts"], "last": row["last"].isoformat() if row["last"] else None}
        for cid, row in rows.items()
        if cid in members
    ]
    out.sort(key=lambda r: (-r["total"], r["character"]["name"]))
    return {
        "entity": target,
        "member": Character.objects.filter(pk=entity).exists(),
        "characters": out,
        "isk_in": sum(r["isk_in"] for r in out),
        "isk_out": sum(r["isk_out"] for r in out),
    }


# --- wallet journals --------------------------------------------------------------------------------------------


@router.get("/wallet/ref-types")
def wallet_ref_types(request):
    qs = JournalEntry.objects.filter(character__in=_characters(request).values("pk"))
    return list(qs.order_by("ref_type").values_list("ref_type", flat=True).distinct())


@router.get("/wallet")
def wallet(request, q: str = "", corporation: int | None = None, ref_type: str = "", min_amount: float = 0,
           direction: str = "", outside: bool = False, limit: int = 50, offset: int = 0):
    """Wallet journal lines of every character in reach, newest first. ``min_amount`` is in ISK either way,
    ``direction`` "in" or "out", and ``outside`` keeps transfers with players or corporations not registered here.
    ``q`` matches the description, reason and either party's name."""
    qs = JournalEntry.objects.filter(character__in=_characters(request, corporation).values("pk"))
    if ref_type:
        qs = qs.filter(ref_type=ref_type)
    if min_amount > 0:
        floor = Decimal(str(min_amount))
        qs = qs.filter(Q(amount__gte=floor) | Q(amount__lte=-floor))
    if direction == "in":
        qs = qs.filter(amount__gt=0)
    elif direction == "out":
        qs = qs.filter(amount__lt=0)
    if outside:
        # The other side is whichever party isn't the member themselves.
        qs = qs.filter((Q(first_party_id=F("character_id")) & _outsider("second_party_id")) | (~Q(first_party_id=F("character_id")) & _outsider("first_party_id")))
    q = q.strip()[:MAX_QUERY]
    if q:
        named = EveName.objects.filter(name__icontains=q).values("id")
        qs = qs.filter(Q(description__icontains=q) | Q(reason__icontains=q) | Q(first_party_id__in=named) | Q(second_party_id__in=named))
        _note_search(request, "wallets", q)
    result = page(qs.select_related("character__user", "character__corporation").order_by("-date", "-ref_id"), lambda e: e, limit, offset)
    entries = result["items"]
    names = _names({e.first_party_id for e in entries} | {e.second_party_id for e in entries})
    _snoop(request, [e.character for e in entries], "wallet")
    result["items"] = [
        {
            "id": f"{e.character_id}:{e.ref_id}",
            "character": _member(e.character),
            "date": e.date.isoformat(),
            "ref_type": e.ref_type,
            "amount": float(e.amount) if e.amount is not None else None,
            "description": e.description,
            "reason": e.reason,
            "first_party": _entity(e.first_party_id, names),
            "second_party": _entity(e.second_party_id, names),
        }
        for e in entries
    ]
    return result


# --- contracts --------------------------------------------------------------------------------------------------


def _holders(copies: list[Contract]) -> list[dict]:
    return [_member(c.character) for c in copies]


@router.get("/contracts")
def contracts(request, q: str = "", corporation: int | None = None, state: str = "all", type: str = "",
              min_value: float = 0, outside: bool = False, limit: int = 50, offset: int = 0):
    """Contracts of every character in reach, newest first; one row per contract with the members holding it.
    ``q`` matches the title, the items in it and the issuer, assignee or acceptor's name. ``outside`` keeps
    contracts with a player or corporation not registered here on the other side."""
    chars = _characters(request, corporation).values("pk")
    qs = Contract.objects.filter(character__in=chars)
    if state == "open":
        qs = qs.filter(status__in=OPEN)
    elif state == "finished":
        qs = qs.exclude(status__in=OPEN)
    if type:
        qs = qs.filter(type=type)
    if min_value > 0:
        floor = Decimal(str(min_value))
        qs = qs.filter(Q(price__gte=floor) | Q(reward__gte=floor) | Q(collateral__gte=floor) | Q(buyout__gte=floor))
    if outside:
        qs = qs.filter(_outsider("issuer_id") | (Q(assignee_id__gt=0) & _outsider("assignee_id")) | (Q(acceptor_id__gt=0) & _outsider("acceptor_id")))
    q = q.strip()[:MAX_QUERY]
    type_ids: list[int] = []
    if q:
        type_ids = list(ItemType.objects.filter(name__icontains=q).values_list("id", flat=True)[:5000])
        named = EveName.objects.filter(name__icontains=q).values("id")
        qs = qs.filter(Q(title__icontains=q) | Q(items__type_id__in=type_ids) | Q(issuer_id__in=named) | Q(assignee_id__in=named) | Q(acceptor_id__in=named))
        _note_search(request, "contracts", q)
    result = page(qs.values("contract_id").annotate(ts=Max("date_issued")).order_by("-ts", "-contract_id"), lambda r: r["contract_id"], limit, offset)

    copies = _copies(Contract.objects.filter(contract_id__in=result["items"], character__in=chars))
    firsts = [copies[i][0] for i in result["items"] if i in copies]
    matches = _matching_items(firsts, type_ids) if q else {}
    _snoop(request, [c.character for cs in copies.values() for c in cs], "contracts")
    rows = _contract_rows(firsts, None)
    result["items"] = [
        {**{k: v for k, v in row.items() if k != "direction"}, "held_by": _holders(copies[c.contract_id]), "matches": matches.get(c.pk, [])}
        for c, row in zip(firsts, rows, strict=True)
    ]
    return result


def _copies(qs) -> dict[int, list[Contract]]:
    """Each contract's copies, the one with its items loaded first, then by character name."""
    out: dict[int, list[Contract]] = {}
    for c in qs.select_related("character__user", "character__corporation").order_by("-items_fetched", "character__name"):
        out.setdefault(c.contract_id, []).append(c)
    return out


@router.get("/contracts/{contract_id}")
def contract_detail(request, contract_id: int):
    copies = _copies(Contract.objects.filter(contract_id=contract_id, character__in=_characters(request).values("pk"))).get(contract_id)
    if not copies:
        raise Http404
    _snoop(request, [c.character for c in copies], "contracts")
    best = copies[0]
    items = list(best.items.all())
    types = types_by_id({i.type_id for i in items})
    prices = prices_by_type({i.type_id for i in items})
    row = {k: v for k, v in _contract_rows([best], None)[0].items() if k != "direction"}
    return {
        **row,
        "held_by": _holders(copies),
        "items_loaded": best.items_fetched,
        "items": [
            {
                "id": i.record_id,
                "type": type_out(i.type_id, types, copy=i.raw_quantity == -2),
                "quantity": i.quantity,
                "included": i.is_included,
                "value": 0 if i.raw_quantity == -2 else prices.get(i.type_id, 0) * i.quantity,
            }
            for i in items
        ],
    }


# --- skill check: who can fly it ----------------------------------------------------------------------------------


@router.get("/types")
def types(request, q: str = ""):
    """Ships, modules and other items that need skills, to check members against."""
    _characters(request)
    q = q.strip()[:MAX_QUERY]
    if len(q) < 2:
        return []
    from conduit.search.providers import ranked

    hits = ranked(ItemType.objects.filter(published=True, name__icontains=q).exclude(required_skills=[]).select_related("group__category"), "name", q)[:10]
    return [type_out(t.id, {t.id: t}) for t in hits]


class SkillCheckIn(Schema):
    text: str = ""
    types: list[int] = []
    corporation: int | None = None


@router.post("/skills/check")
def skill_check(request, payload: SkillCheckIn):
    """Which characters in reach have the skills for these items (``types``) and a pasted skill list (``text``).
    Each is ``ready``, ``queued`` (the rest is in their skill queue), ``missing`` or ``unsynced``."""
    chars = list(_characters(request, payload.corporation).select_related("user", "corporation"))
    pasted, problems = training.parse_text(payload.text[:MAX_SKILL_TEXT])
    type_ids = list(dict.fromkeys(payload.types))[:MAX_CHECK_TYPES]
    targets = pasted + list(training.requirements_of_types(type_ids).items())
    if not targets:
        raise HttpError(400, "Pick an item or paste a skill list to check")
    info = training.skill_info(s for s, _ in targets)
    steps = training.plan(targets, info)
    need = training.highest(targets)
    names = dict(ItemType.objects.filter(pk__in={s for s, _ in steps}).values_list("id", "name"))
    state = training.character_state([c.pk for c in chars], {s for s, _ in steps})

    out = []
    for c in chars:
        st = state[c.pk]
        p = training.progress(steps, st, info)
        if not st["synced"]:
            status = "unsynced"
        elif p["complete"]:
            status = "ready"
        elif p["seconds_missing"] == 0:
            status = "queued"
        else:
            status = "missing"
        missing = [
            {"id": sid, "name": names.get(sid, str(sid)), "have": st["levels"].get(sid, 0), "need": lvl}
            for sid, lvl in need.items()
            if st["levels"].get(sid, 0) < lvl
        ]
        out.append({"character": _member(c), "status": status, "percent": p["percent"], "seconds_left": p["seconds_left"], "seconds_missing": p["seconds_missing"], "missing": missing})
    order = {"ready": 0, "queued": 1, "missing": 2, "unsynced": 3}
    out.sort(key=lambda r: (order[r["status"]], -r["percent"], r["seconds_left"], r["character"]["name"]))

    item_names = list(ItemType.objects.filter(pk__in=type_ids).values_list("name", flat=True))
    what = ", ".join(item_names + ([f"{len(pasted)} pasted skill levels"] if pasted else []))
    record("member_audit.skill_check", f"checked members' skills in Member Audit for {what}"[:300], request=request,
           details={"types": type_ids, "skills": len(need)})
    return {
        "skills": [{"id": sid, "name": names.get(sid, str(sid)), "level": lvl} for sid, lvl in sorted(need.items(), key=lambda kv: names.get(kv[0], ""))],
        "problems": problems[:20],
        "counts": {k: sum(1 for r in out if r["status"] == k) for k in order},
        "characters": out,
    }
