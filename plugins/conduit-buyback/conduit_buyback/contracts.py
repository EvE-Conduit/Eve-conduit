"""Finding the contracts sellers make to program owners, and checking each against its quote."""

from __future__ import annotations

import logging
import re
from collections import Counter
from datetime import datetime
from decimal import Decimal

from conduit.esi.exceptions import EsiError

from .models import BuybackSettings, Contract, Program, Quote
from .services import prefix_for

log = logging.getLogger(__name__)

CHARACTER_SCOPE = "esi-contracts.read_character_contracts.v1"
CORPORATION_SCOPE = "esi-contracts.read_corporation_contracts.v1"
FINISHED = ("finished", "finished_issuer", "finished_contractor")
SETTLED = (*FINISHED, "rejected", "deleted", "expired", "failed", "reversed")


def _dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def problem(code: str, text: str, severe: bool = True) -> dict:
    return {"code": code, "text": text, "severe": severe}


def check(c: Contract, quote: Quote | None, program: Program | None, duplicate: bool = False) -> list[dict]:
    """What's wrong with a contract, worst first."""
    if quote is None:
        return [problem("no_quote", "No quote has this tracking number. It may imitate a buyback contract: compare the items before accepting.")]
    out = []
    if duplicate:
        out.append(problem("duplicate", "Another contract already uses this tracking number."))
    if program and program.assignee_id and c.assignee_id != program.assignee_id:
        should = "the corporation" if program.is_corporation else (program.owner.name if program.owner else "the character")
        out.append(problem("wrong_assignee", f"Made out to the wrong {'character' if program.is_corporation else 'corporation'}: it should go to {should}."))
    price, quoted = c.price, quote.value
    if price > quoted + 1:
        out.append(problem("price_high", f"Asks {price - quoted:,.0f} ISK more than the quote ({quoted:,.0f} ISK)."))
    elif price < quoted - 1:
        out.append(problem("price_low", f"Asks {quoted - price:,.0f} ISK less than the quote.", severe=False))
    if c.items is not None:
        wanted = Counter()
        for ln in quote.lines:
            if ln.get("accepted"):
                wanted[ln["type_id"]] += ln["quantity"]
        given, asked = Counter(), Counter()
        for type_id, quantity, included in c.items:
            (given if included else asked)[type_id] += quantity
        missing = sum(1 for t, q in wanted.items() if given[t] < q)
        extra = sum(1 for t, q in given.items() if q > wanted[t])
        if asked:
            out.append(problem("asks_items", "Asks for items in return."))
        if missing:
            out.append(problem("items_missing", f"{missing} quoted item{'s are' if missing != 1 else ' is'} missing or short."))
        if extra:
            out.append(problem("items_extra", f"Has {extra} item{'s' if extra != 1 else ''} that weren't quoted (or more of them).", severe=False))
    if program:
        allowed = {loc.structure_id for loc in program.locations.all() if loc.structure_id}
        if allowed and c.start_location_id not in allowed:
            out.append(problem("wrong_location", "Made at a location this program doesn't use."))
    if c.title.strip() != quote.tracking_number:
        out.append(problem("title", "The title has more than the tracking number in it.", severe=False))
    if quote.flagged:
        out.append(problem("watchlist", "Has items to check by hand: on the manual review list, or priced far off their recent average."))
    return sorted(out, key=lambda p: not p["severe"])


def _rows(character, programs: list[Program], client) -> list[tuple[dict, str]]:
    """The owner's character contracts, and their corporation's when a program goes to the corporation."""
    out = []
    token = getattr(character, "token", None)
    if token and token.has_scopes(CHARACTER_SCOPE):
        out += [(r, "character") for r in client.get_all_pages(f"/characters/{character.pk}/contracts", character=character)]
    if any(p.is_corporation for p in programs) and character.corporation_id and token and token.has_scopes(CORPORATION_SCOPE):
        out += [(r, "corporation") for r in client.get_all_pages(f"/corporations/{character.corporation_id}/contracts", character=character)]
    return out


def _items(character, row: dict, source: str, client) -> list | None:
    path = (f"/corporations/{character.corporation_id}" if source == "corporation" else f"/characters/{character.pk}") + f"/contracts/{row['contract_id']}/items"
    try:
        rows = client.get_all_pages(path, character=character)
    except EsiError as exc:
        if exc.status in (403, 404):  # gone or never visible: don't ask again
            return []
        raise
    return [[r["type_id"], r["quantity"], bool(r.get("is_included", True))] for r in rows]


def sync_owner(character_id: int, client=None) -> dict:
    """Fetch the owner's contracts and track the ones meant for a buyback. Returns counts."""
    from conduit.accounts.models import Character
    from conduit.esi.client import esi
    from conduit.eve.tasks import ensure_eve_names
    from conduit.sheet.locations import resolve

    character = Character.objects.select_related("token").filter(pk=character_id).first()
    programs = list(Program.objects.filter(owner_id=character_id).prefetch_related("locations", "managers"))
    if character is None or not programs:
        return {"seen": 0, "new": 0}
    client = client or esi()
    s = BuybackSettings.load()
    prefixes = {prefix_for(p, s).lower() for p in programs if prefix_for(p, s)}
    pattern = re.compile("|".join(re.escape(px) + r"[a-z0-9]{10}" for px in sorted(prefixes, key=len, reverse=True)), re.I) if prefixes else None
    assignees = {character.pk, character.corporation_id or 0}
    known = {c.contract_id: c for c in Contract.objects.filter(owner_id__in=assignees)}

    wanted = []
    for row, source in _rows(character, programs, client):
        if row.get("type") != "item_exchange" or row.get("assignee_id") not in assignees:
            continue
        title = row.get("title") or ""
        numbers = [m.group(0).lower() for m in pattern.finditer(title)] if pattern else []
        if row["contract_id"] in known or numbers or any(px in title.lower() for px in prefixes):
            wanted.append((row, source, numbers))
    if not wanted:
        return {"seen": 0, "new": 0}
    quotes = {q.tracking_number.lower(): q for q in Quote.objects.filter(
        tracking_number__in=[n for _, _, ns in wanted for n in ns]).select_related("program", "user")}
    # Tracking numbers are stored in lower case; titles are matched in lower case too.
    seen_new = 0
    touched = []
    for row, source, numbers in wanted:
        quote = next((quotes[n] for n in numbers if n in quotes), None)
        c = known.get(row["contract_id"])
        created = c is None
        old_status = None if created else c.status
        c = c or Contract(contract_id=row["contract_id"])
        c.owner_id = row["assignee_id"]
        c.issuer_id = row["issuer_id"]
        c.issuer_corporation_id = row.get("issuer_corporation_id")
        c.assignee_id = row["assignee_id"]
        c.for_corporation = row.get("for_corporation", False)
        c.title = (row.get("title") or "")[:200]
        c.status = row["status"]
        c.price = Decimal(str(row.get("price") or 0))
        c.volume = row.get("volume")
        c.start_location_id = row.get("start_location_id")
        c.date_issued = _dt(row["date_issued"])
        c.date_expired = _dt(row.get("date_expired"))
        c.date_completed = _dt(row.get("date_completed"))
        if quote:
            c.quote, c.program = quote, quote.program
        elif created:
            # A prefix but no quote: file it under the owner's program with that prefix.
            title = c.title.lower()
            c.program = next((p for p in programs if prefix_for(p, s) and prefix_for(p, s).lower() in title), programs[0])
        if c.items is None and (c.status in ("outstanding", "in_progress") or created):
            c.items = _items(character, row, source, client)
        c.save()
        touched.append((c, created, old_status))
        seen_new += created

    for c, created, old_status in touched:
        duplicate = bool(c.quote_id and Contract.objects.filter(quote_id=c.quote_id, contract_id__lt=c.contract_id).exists())
        c.problems = check(c, c.quote, c.program, duplicate)
        c.save(update_fields=["problems", "updated_at"])
    ensure_eve_names({c.issuer_id for c, _, _ in touched} | {c.issuer_corporation_id for c, _, _ in touched if c.issuer_corporation_id})
    try:
        resolve({c.start_location_id for c, _, _ in touched if c.start_location_id}, character=character, client=client)
    except Exception:  # names are nice to have; never lose the sync over them
        log.exception("Couldn't look up contract locations")
    for c, created, old_status in touched:
        _announce(c, created, old_status)
    return {"seen": len(touched), "new": seen_new}


def _announce(c: Contract, created: bool, old_status: str | None) -> None:
    from conduit.events import bus
    from conduit.eve.models import EveName
    from conduit.notify.services import notify

    program = c.program
    issuer = EveName.objects.filter(pk=c.issuer_id).values_list("name", flat=True).first() or "Someone"
    payload = {"contract_id": c.contract_id, "program_id": c.program_id, "program": program.name if program else None, "issuer_id": c.issuer_id,
               "issuer": issuer, "price": float(c.price), "tracking_number": c.quote.tracking_number if c.quote_id else None,
               "status": c.status, "problems": [p["code"] for p in c.problems]}
    link = f"/p/buyback/contracts/{c.contract_id}"
    if created and c.status in ("outstanding", "in_progress"):
        bus.emit("buyback.contract_created", **payload)
        if program and program.notify_managers:
            severe = [p for p in c.problems if p["severe"]]
            body = f"{c.price:,.0f} ISK" + (f". Check it: {severe[0]['text']}" if severe else ".")
            notify(program.managers.all(), f"Buyback contract from {issuer} ({program.name})", body, link=link,
                   level="warning" if severe else "info", category="p.buyback")
    elif not created and old_status != c.status and c.status in SETTLED:
        bus.emit("buyback.contract_finished", **payload)
        seller = c.quote.user_id if c.quote_id else None
        if seller:
            if c.status in FINISHED:
                notify(seller, f"Buyback contract accepted ({program.name if program else 'buyback'})", f"{c.price:,.0f} ISK paid for {c.title}.",
                       link=f"/p/buyback/quotes/{c.quote.tracking_number}", level="success", category="p.buyback")
            elif c.status == "rejected":
                notify(seller, "Buyback contract rejected", f"{c.title} was rejected. Ask the buyback managers why.",
                       link=f"/p/buyback/quotes/{c.quote.tracking_number}", level="warning", category="p.buyback")


def sync_due_owners() -> list[int]:
    """Owners of active programs whose login still works."""
    return list(
        Program.objects.filter(active=True, owner__isnull=False, owner__token__valid=True).values_list("owner_id", flat=True).distinct()
    )


def recheck(program: Program) -> int:
    """Check the program's open contracts again (after its locations or owner change)."""
    n = 0
    for c in Contract.objects.filter(program=program, status__in=("outstanding", "in_progress")).select_related("quote", "program"):
        duplicate = bool(c.quote_id and Contract.objects.filter(quote_id=c.quote_id, contract_id__lt=c.contract_id).exists())
        c.problems = check(c, c.quote, program, duplicate)
        c.save(update_fields=["problems", "updated_at"])
        n += 1
    return n

