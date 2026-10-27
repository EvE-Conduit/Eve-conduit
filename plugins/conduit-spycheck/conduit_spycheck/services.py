"""Spy Check: look through every member character's synced data for dealings with watched entities.

What is watched: the plugin's own watch list, plus the Blacklist plugin's active entries when that plugin is installed
and on (and the settings say so). Each character, corporation and alliance is matched by its own id, like Member
Audit's counterparty search: a corporation's members' personal dealings don't count against the corporation.

The scan reads data Conduit already syncs (nothing here calls ESI) and keeps one ``Finding`` per member character,
entity and kind:

- **journal**: wallet journal lines with the entity on either side (ISK is the total moved either way);
- **market**: market transactions with the entity as the other party;
- **contract**: contracts the entity issued (or its corporation did), was assigned or accepted;
- **mail**: mail from the entity, or to it (a character, corporation or alliance as recipient);
- **contact**: a contact for the entity with good standing (above the settings' limit);
- **corp_history**: the character is or was in a watched corporation, or in a corporation that is in a watched
  alliance now (alliance history isn't synced, so a corporation is judged by its alliance today).

A finding someone dismissed stays dismissed on later scans unless there's newer evidence than when it was dismissed:
a later record (journal line, mail, contract, ...), or for contacts, which have no date, the contact coming back
after it was gone or its standing going up. Acknowledged findings keep updating and say when there's newer evidence.
Each scan sends one digest of what's new to the chosen group and emits ``spycheck.findings``.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from django.contrib.auth.models import Group
from django.core.cache import cache
from django.db.models import Count, DecimalField, F, Max, Min, Q, Sum
from django.db.models.functions import Abs
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.audit.services import record, record_snoop
from conduit.eve.models import EveCorporation, EveName, portrait_url
from conduit.events import bus
from conduit.notify.services import notify, users_with_perm
from conduit.sheet.contacts.models import Contact
from conduit.sheet.contracts.models import Contract
from conduit.sheet.mail.models import Mail
from conduit.sheet.access import viewable_characters
from conduit.sheet.overview.models import CorporationHistory
from conduit.sheet.wallet.models import JournalEntry, WalletTransaction

from .models import Finding, SpySettings, WatchEntry

log = logging.getLogger(__name__)

VIEW_PERM = "spycheck.view_findings"
MANAGE_PERM = "spycheck.manage_spycheck"
KINDS = Finding.Kind.values
#: The character sheet tab (and snooper log section) each kind's evidence comes from.
SECTION = {"journal": "wallet", "market": "wallet", "contract": "contracts", "mail": "mail", "contact": "contacts",
           "corp_history": "overview"}
MAIL_CHUNK = 50  # recipients are a JSON list, matched by text: this many entity ids per query
EVIDENCE_LIMIT = 200
LINK = "/p/spycheck"
#: Held while a scan runs, so Scan now and the daily scan don't run at the same time.
SCAN_LOCK = "spycheck:scan"
SCAN_LOCK_SECONDS = 3600


class SpyCheckError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def can_view(user) -> bool:
    return user.has_perm(VIEW_PERM) or user.has_perm(MANAGE_PERM)


def others(viewer):
    """The characters the viewer's sheet permissions reach, but not their own: nobody reviews themselves."""
    return viewable_characters(viewer).exclude(user=viewer)


def visible(viewer):
    """Findings on the characters the viewer's sheet permissions reach, as Member Audit narrows its searches. Never
    the viewer's own characters (nor ones they owned at the last scan): nobody reviews findings on themselves."""
    return Finding.objects.filter(character_id__in=others(viewer).values("pk")).exclude(user=viewer)


# --- what is watched -----------------------------------------------------------------------------------------------


@dataclass
class Watched:
    eve_id: int
    kind: str
    name: str
    source: str
    reason: str = ""
    severity: str = ""


def blacklist_available() -> bool:
    """The Blacklist plugin is installed and switched on."""
    from conduit.plugins.services import is_enabled

    if not is_enabled("blacklist"):
        return False
    try:
        import conduit_blacklist.models  # noqa: F401
    except ImportError:
        return False
    return True


def _blacklist_entries(s: SpySettings) -> list[Watched]:
    if not (s.use_blacklist and blacklist_available()):
        return []
    from conduit_blacklist.models import Entry

    qs = Entry.objects.active()
    if not s.blacklist_watch_entries:
        qs = qs.filter(severity=Entry.Severity.BANNED)
    return [Watched(e.eve_id, e.kind, e.name, Finding.Source.BLACKLIST, e.reason, e.severity) for e in qs]


def watched_entities(s: SpySettings | None = None) -> dict[int, Watched]:
    """Every entity the scan looks for, by EVE id. One on both lists counts as the Blacklist's."""
    s = s or SpySettings.load()
    out = {w.eve_id: Watched(w.eve_id, w.kind, w.name, Finding.Source.WATCH, w.reason) for w in WatchEntry.objects.all()}
    for w in _blacklist_entries(s):
        out[w.eve_id] = w
    return out


# --- the scan ------------------------------------------------------------------------------------------------------


@dataclass
class Evidence:
    count: int = 0
    amount: Decimal = Decimal(0)
    first: datetime | None = None
    last: datetime | None = None

    def add(self, n: int, amount, first, last):
        self.count += n
        self.amount += Decimal(str(amount or 0))
        if first and (self.first is None or first < self.first):
            self.first = first
        if last and (self.last is None or last > self.last):
            self.last = last


def _chunks(seq, size):
    seq = list(seq)
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def _member_characters():
    """Characters of every member (not guests): (id, user id, name, corporation id, alliance id)."""
    from conduit.access.services import site_members

    return list(Character.objects.filter(user__in=site_members()).values_list("pk", "user_id", "name", "corporation_id", "alliance_id"))


def collect(chars: list[tuple], watched: dict[int, Watched], s: SpySettings) -> dict[tuple, Evidence]:
    """The evidence for every (character id, entity id, kind), read from the synced character data."""
    found: dict[tuple, Evidence] = defaultdict(Evidence)
    if not chars or not watched:
        return found
    ids = set(watched)
    char_ids = [c[0] for c in chars]
    owner = {c[0]: c[1] for c in chars}
    # Registered characters that are watched: dealing with your own alt is no news (the Blacklist warns about the alt).
    entity_owner = dict(Character.objects.filter(pk__in=ids).values_list("pk", "user_id"))
    skip = set(s.skip_kinds or ())

    def add(cid, eid, kind, n=1, amount=0, first=None, last=None):
        if eid == cid or (eid in entity_owner and entity_owner[eid] == owner.get(cid)):
            return
        found[(cid, eid, kind)].add(n, amount, first, last)

    if "journal" not in skip:
        journal = (JournalEntry.objects.filter(character_id__in=char_ids)
                   .filter(Q(first_party_id__in=ids) | Q(second_party_id__in=ids))
                   .values("character_id", "first_party_id", "second_party_id").order_by()
                   .annotate(n=Count("id"), first=Min("date"), last=Max("date"), isk=Sum(Abs("amount"))))
        for r in journal:
            for eid in {r["first_party_id"], r["second_party_id"]} & ids:
                add(r["character_id"], eid, "journal", r["n"], r["isk"], r["first"], r["last"])

    if "market" not in skip:
        value = Sum(F("quantity") * F("unit_price"), output_field=DecimalField(max_digits=30, decimal_places=2))
        market = (WalletTransaction.objects.filter(character_id__in=char_ids, client_id__in=ids)
                  .values("character_id", "client_id").order_by()
                  .annotate(n=Count("id"), first=Min("date"), last=Max("date"), isk=value))
        for r in market:
            add(r["character_id"], r["client_id"], "market", r["n"], r["isk"], r["first"], r["last"])

    if "contract" not in skip:
        contracts = (Contract.objects.filter(character_id__in=char_ids)
                     .filter(Q(issuer_id__in=ids) | Q(issuer_corporation_id__in=ids) | Q(assignee_id__in=ids) | Q(acceptor_id__in=ids))
                     .values_list("character_id", "issuer_id", "issuer_corporation_id", "assignee_id", "acceptor_id", "price", "reward", "date_issued"))
        for cid, issuer, issuer_corp, assignee, acceptor, price, reward, issued in contracts:
            for eid in {issuer, issuer_corp, assignee, acceptor} & ids:
                add(cid, eid, "contract", 1, (price or 0) + (reward or 0), issued, issued)

    if "mail" not in skip:
        # Like Member Audit: the text match narrows it down and the loop checks the ids properly.
        for chunk in _chunks(sorted(ids), MAIL_CHUNK):
            wanted = set(chunk)
            cond = Q(sender_id__in=chunk)
            for eid in chunk:
                cond |= Q(recipients__icontains=str(eid))
            for cid, sender, recipients, when in Mail.objects.filter(character_id__in=char_ids).filter(cond).values_list(
                    "character_id", "sender_id", "recipients", "timestamp"):
                hits = ({sender} | {r.get("recipient_id") for r in recipients or () if isinstance(r, dict)}) & wanted
                for eid in hits:
                    add(cid, eid, "mail", 1, 0, when, when)

    if "contact" not in skip:
        for cid, eid, standing in Contact.objects.filter(character_id__in=char_ids, contact_id__in=ids, standing__gt=s.min_standing).values_list(
                "character_id", "contact_id", "standing"):
            add(cid, eid, "contact", 1, standing)

    if "corp_history" not in skip:
        corps = {i for i, w in watched.items() if w.kind == "corporation"}
        alliances = {i for i, w in watched.items() if w.kind == "alliance"}
        in_alliance = dict(EveCorporation.objects.filter(alliance_id__in=alliances).values_list("pk", "alliance_id")) if alliances else {}
        for cid, corp, start in CorporationHistory.objects.filter(character_id__in=char_ids, corporation_id__in=corps | set(in_alliance)).values_list(
                "character_id", "corporation_id", "start_date"):
            for eid in {corp, in_alliance.get(corp)} & ids:
                add(cid, eid, "corp_history", 1, 0, start, start)
        # Where they are now counts even before their history has synced.
        for cid, _, _, corp, alliance in chars:
            for eid in {corp, alliance} & (corps | alliances):
                if (cid, eid, "corp_history") not in found:
                    add(cid, eid, "corp_history", 1)
    return found


def _newer_evidence(f: Finding, ev: Evidence, was_present: bool) -> bool:
    """Is there evidence the person who dismissed ``f`` hasn't seen?"""
    if ev.last is not None:
        mark = f.decided_last_seen or f.decided_at
        return mark is None or ev.last > mark
    # No dates (contacts, a current corporation with no history synced): gone and back, or a better standing.
    if not was_present:
        return True
    return f.kind == Finding.Kind.CONTACT and f.decided_amount is not None and ev.amount > f.decided_amount


def scan(notify_people: bool = True) -> list[Finding]:
    """Look through everyone's data again and update the findings. Returns the ones that are new (or reopened), which
    the chosen group is told about in one notification. Only one scan runs at a time: another one while it runs
    raises ``SpyCheckError`` (409)."""
    if not cache.add(SCAN_LOCK, 1, SCAN_LOCK_SECONDS):
        raise SpyCheckError("A scan is already running: try again when it's done", status=409)
    try:
        return _scan(notify_people)
    finally:
        cache.delete(SCAN_LOCK)


def _scan(notify_people: bool) -> list[Finding]:
    s = SpySettings.load()
    now = timezone.now()
    chars = _member_characters()
    watched = watched_entities(s)
    evidence = collect(chars, watched, s)
    info = {c[0]: c for c in chars}
    existing = {(f.character_id, f.entity_id, f.kind): f for f in Finding.objects.all()}
    flagged: list[Finding] = []
    for key, ev in evidence.items():
        cid, eid, kind = key
        w = watched[eid]
        f = existing.get(key)
        fields = {"user_id": info[cid][1], "character_name": info[cid][2], "entity_kind": w.kind, "entity_name": w.name,
                  "source": w.source, "count": ev.count, "amount": ev.amount.quantize(Decimal("0.01")),
                  "first_seen": ev.first, "last_seen": ev.last, "present": True}
        if f is None:
            # get_or_create: a row someone else made meanwhile is updated below rather than failing the scan.
            f, created = Finding.objects.get_or_create(character_id=cid, entity_id=eid, kind=kind,
                                                       defaults={"state": Finding.State.NEW, "flagged_at": now, **fields})
            if created:
                flagged.append(f)
                continue
        reopen = f.state == Finding.State.DISMISSED and _newer_evidence(f, ev, f.present)
        changed = [k for k, v in fields.items() if getattr(f, k) != v]
        for k in changed:
            setattr(f, k, fields[k])
        if reopen:
            f.state, f.flagged_at = Finding.State.NEW, now
            changed += ["state", "flagged_at"]
            flagged.append(f)
        if changed:
            f.save(update_fields=[*changed, "updated_at"])
    gone = [f.pk for key, f in existing.items() if key not in evidence and f.present]
    Finding.objects.filter(pk__in=gone).update(present=False, updated_at=now)
    s.last_scan_at, s.last_scan_characters, s.last_scan_new = now, len(chars), len(flagged)
    s.save(update_fields=["last_scan_at", "last_scan_characters", "last_scan_new"])
    if flagged and notify_people:
        _digest(flagged, s)
    log.info("Spy Check scanned %d characters for %d entities: %d findings, %d new", len(chars), len(watched), len(evidence), len(flagged))
    return flagged


def recipients(s: SpySettings | None = None) -> list:
    """Who hears about new findings: the chosen group's members who may see findings, or everyone who may."""
    s = s or SpySettings.load()
    people = users_with_perm(VIEW_PERM)
    if s.notify_group_id:
        in_group = set(s.notify_group.user_set.values_list("pk", flat=True))
        people = [u for u in people if u.pk in in_group]
    return people


def _digest_text(flagged: list[Finding]) -> tuple[str, str]:
    by_member: dict[str, set[str]] = defaultdict(set)
    for f in flagged:
        by_member[f.user.display_name].add(f.entity_name)
    lines = [f"{who} ({', '.join(sorted(names)[:3])}{'…' if len(names) > 3 else ''})" for who, names in sorted(by_member.items())]
    n = len(flagged)
    return f"Spy Check: {n} new finding{'s' if n != 1 else ''}", "; ".join(lines[:15]) + (f"; and {len(lines) - 15} more members" if len(lines) > 15 else "")


def _digest(flagged: list[Finding], s: SpySettings) -> None:
    by_member: dict[str, set[str]] = defaultdict(set)
    for f in flagged:
        by_member[f.user.display_name].add(f.entity_name)
    title, shown = _digest_text(flagged)
    n = len(flagged)
    # Each reviewer only hears about the characters they may see, and never about their own.
    for person in recipients(s):
        seen = set(others(person).filter(pk__in={f.character_id for f in flagged}).values_list("pk", flat=True))
        mine = [f for f in flagged if f.character_id in seen and f.user_id != person.pk]
        if mine:
            notify([person], *_digest_text(mine), link=LINK, level="warning", category="p.spycheck")
    bus.emit("spycheck.findings", count=n, members=sorted(by_member)[:100], user_ids=sorted({f.user_id for f in flagged})[:100],
             finding_ids=[f.pk for f in flagged][:100], link=LINK, title=title, summary=shown, level="warning")


# --- reviewing -----------------------------------------------------------------------------------------------------


def decide(f: Finding, by, state: str, note: str = "", request=None) -> Finding:
    if state not in Finding.State.values:
        raise SpyCheckError("Pick new, acknowledged or dismissed")
    note = (note or "").strip()[:2000]
    if state == Finding.State.DISMISSED and not note:
        raise SpyCheckError("Say why it's dismissed")
    if f.user_id == by.pk or Character.objects.filter(pk=f.character_id, user=by).exists():
        raise SpyCheckError("You can't review findings on your own characters", status=403)
    f.state, f.note = state, note
    f.decided_by, f.decided_at = by, timezone.now()
    f.decided_last_seen, f.decided_amount = f.last_seen, f.amount
    f.save()
    record(f"spycheck.{state}", f"marked a Spy Check finding on {f.character_name} ({f.get_kind_display().lower()} with {f.entity_name}) {f.get_state_display().lower()}",
           request=request, actor=by, target=f.user, details={"finding_id": f.pk, "state": state, "note": note[:300]})
    return f


# --- the watch list ------------------------------------------------------------------------------------------------


def _resolve_name(eve_id: int) -> EveName:
    """The name and kind of an EVE id (copied from the Blacklist plugin, which may not be installed)."""
    from conduit.eve.tasks import ensure_eve_names

    try:
        ensure_eve_names([eve_id])
    except Exception:  # ESI down: say so rather than store a nameless entry
        log.warning("Couldn't look up the name of %s", eve_id, exc_info=True)
    row = EveName.objects.filter(pk=eve_id).first()
    if row is None:
        raise SpyCheckError("EVE doesn't know that id (or ESI couldn't be reached)")
    if row.category not in WatchEntry.Kind.values:
        raise SpyCheckError(f"That id is a {row.category}: watch a character, corporation or alliance")
    return row


def add_watch(eve_id: int, reason: str, by, request=None) -> WatchEntry:
    if eve_id <= 0:
        raise SpyCheckError("Pick who to watch")
    if WatchEntry.objects.filter(eve_id=eve_id).exists():
        raise SpyCheckError("They're already on the watch list")
    name = _resolve_name(eve_id)
    w = WatchEntry.objects.create(kind=name.category, eve_id=eve_id, name=name.name, reason=(reason or "").strip()[:2000], added_by=by)
    record("spycheck.watch_added", f"added {w.name} to the Spy Check watch list", request=request, actor=by, target=w,
           target_type="plugin", details={"eve_id": eve_id, "kind": w.kind})
    return w


def remove_watch(w: WatchEntry, by, request=None) -> None:
    record("spycheck.watch_removed", f"removed {w.name} from the Spy Check watch list", request=request, actor=by, target=w,
           target_type="plugin", details={"eve_id": w.eve_id, "kind": w.kind})
    w.delete()


def find_entities(q: str) -> list[dict]:
    """Characters, corporations and alliances the synced data has mentioned, to pick one to watch."""
    from conduit.search.providers import ranked
    from conduit.sheet.contacts.api import entity_image

    q = q.strip()[:200]
    if len(q) < 3:
        return []
    watched = set(WatchEntry.objects.values_list("eve_id", flat=True))
    hits = [(n.id, n.name, n.category) for n in ranked(EveName.objects.filter(name__icontains=q, category__in=WatchEntry.Kind.values), "name", q)[:10]]
    if not any(name.lower() == q.lower() for _, name, _ in hits):
        hits = _esi_exact(q) + hits
    seen = set()
    out = []
    for eve_id, name, kind in hits:
        if eve_id not in seen:
            seen.add(eve_id)
            out.append({"id": eve_id, "name": name, "kind": kind, "image": entity_image(kind, eve_id), "watched": eve_id in watched})
    return out[:10]


def _esi_exact(q: str) -> list[tuple[int, str, str]]:
    """Someone the synced data hasn't mentioned yet, by their exact name (an ESI hiccup just finds nobody)."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError

    try:
        data = esi().post("/universe/ids", [q]).data or {}
    except (EsiError, EsiBackoff):
        log.warning("Couldn't look up %r on ESI", q, exc_info=True)
        return []
    return [(row["id"], row["name"], category.rstrip("s")) for category in ("characters", "corporations", "alliances") for row in data.get(category, [])]


def watch_out(w: Watched, entry: WatchEntry | None = None) -> dict:
    from conduit.sheet.contacts.api import entity_image

    return {"id": entry.pk if entry else None, "eve_id": w.eve_id, "kind": w.kind, "name": w.name, "image": entity_image(w.kind, w.eve_id),
            "source": w.source, "reason": w.reason, "severity": w.severity,
            "added_by": entry.added_by.display_name if entry and entry.added_by else None,
            "created_at": entry.created_at.isoformat() if entry else None}


def watch_list() -> dict:
    s = SpySettings.load()
    local = list(WatchEntry.objects.select_related("added_by__main_character"))
    open_ = dict(Finding.objects.filter(state=Finding.State.NEW).values("entity_id").order_by().annotate(n=Count("id")).values_list("entity_id", "n"))
    items = [{**watch_out(Watched(e.eve_id, e.kind, e.name, Finding.Source.WATCH, e.reason), e), "open": open_.get(e.eve_id, 0)} for e in local]
    blacklist = [{**watch_out(w), "open": open_.get(w.eve_id, 0)} for w in _blacklist_entries(s)]
    return {"items": items, "blacklist": blacklist, "blacklist_available": blacklist_available(), "use_blacklist": s.use_blacklist}


# --- settings ------------------------------------------------------------------------------------------------------


def settings_out(s: SpySettings | None = None) -> dict:
    s = s or SpySettings.load()
    return {
        "notify_group": s.notify_group_id, "use_blacklist": s.use_blacklist, "blacklist_watch_entries": s.blacklist_watch_entries,
        "min_standing": s.min_standing, "skip_kinds": list(s.skip_kinds or []),
        "blacklist_available": blacklist_available(),
        "kind_options": [{"value": k, "label": label} for k, label in Finding.Kind.choices],
        "group_options": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "recipients": len(recipients(s)),
    }


def save_settings(data: dict, by, request=None) -> SpySettings:
    s = SpySettings.load()
    standing = float(data.get("min_standing") or 0)
    if not -10 <= standing <= 10:
        raise SpyCheckError("Standings go from -10 to 10")
    group_id = data.get("notify_group")
    if group_id and not Group.objects.filter(pk=group_id).exists():
        raise SpyCheckError("That group doesn't exist")
    s.notify_group_id = group_id or None
    s.use_blacklist = bool(data.get("use_blacklist"))
    s.blacklist_watch_entries = bool(data.get("blacklist_watch_entries"))
    s.min_standing = standing
    s.skip_kinds = [k for k in data.get("skip_kinds") or [] if k in KINDS]
    s.save()
    record("spycheck.settings_saved", "changed the Spy Check settings", request=request, actor=by, target_type="plugin",
           details={"notify_group": s.notify_group_id, "use_blacklist": s.use_blacklist, "skip_kinds": s.skip_kinds})
    return s


# --- what pages show -----------------------------------------------------------------------------------------------


def _iso(v):
    return v.isoformat() if v else None


def user_brief(u) -> dict:
    main = u.main_character
    return {"id": u.pk, "name": u.display_name, "portrait": portrait_url(main.pk, 64) if main else None,
            "corporation": main.corporation.name if main and main.corporation else None}


def finding_out(f: Finding) -> dict:
    from conduit.sheet.contacts.api import entity_image

    return {
        "id": f.pk,
        "user": user_brief(f.user),
        "character": {"id": f.character_id, "name": f.character_name, "portrait": portrait_url(f.character_id, 64)},
        "kind": f.kind, "kind_label": f.get_kind_display(),
        "entity": {"id": f.entity_id, "kind": f.entity_kind, "name": f.entity_name, "image": entity_image(f.entity_kind, f.entity_id)},
        "source": f.source,
        "count": f.count, "amount": float(f.amount),
        "first_seen": _iso(f.first_seen), "last_seen": _iso(f.last_seen),
        "present": f.present,
        "state": f.state, "note": f.note,
        "decided_by": f.decided_by.display_name if f.decided_by else None, "decided_at": _iso(f.decided_at),
        "found_at": f.found_at.isoformat(), "flagged_at": _iso(f.flagged_at),
        # Brought back by newer evidence after a dismissal.
        "reopened": f.state == Finding.State.NEW and f.decided_at is not None,
        # Acknowledged, and there's been more since.
        "new_evidence": f.state == Finding.State.ACKNOWLEDGED and f.last_seen is not None
        and (f.decided_last_seen is None or f.last_seen > f.decided_last_seen),
        "sheet_link": f"/characters/{f.character_id}?tab={SECTION[f.kind]}",
    }


def findings_qs(viewer, state: str = "new", kind: str = "", q: str = "", user: int | None = None):
    qs = visible(viewer).select_related("user__main_character__corporation", "decided_by__main_character")
    if state in Finding.State.values:
        qs = qs.filter(state=state)
    if kind in KINDS:
        qs = qs.filter(kind=kind)
    if user:
        qs = qs.filter(user_id=user)
    q = q.strip()[:200]
    if q:
        owners = Character.objects.filter(name__icontains=q).values("user_id")
        qs = qs.filter(Q(character_name__icontains=q) | Q(entity_name__icontains=q) | Q(user__in=owners))
    return qs


def members_out(viewer, q: str = "") -> list[dict]:
    """Everyone with a finding, with how many are new, acknowledged and dismissed."""
    from django.contrib.auth import get_user_model

    rows = (visible(viewer).values("user_id").order_by()
            .annotate(new=Count("id", filter=Q(state=Finding.State.NEW)), acknowledged=Count("id", filter=Q(state=Finding.State.ACKNOWLEDGED)),
                      dismissed=Count("id", filter=Q(state=Finding.State.DISMISSED)), entities=Count("entity_id", distinct=True),
                      last=Max("last_seen"), flagged=Max("flagged_at")))
    users = {u.pk: u for u in get_user_model().objects.filter(pk__in=[r["user_id"] for r in rows]).select_related("main_character__corporation")}
    if q.strip():
        hit = set(Character.objects.filter(name__icontains=q.strip()).values_list("user_id", flat=True))
        rows = [r for r in rows if r["user_id"] in hit]
    out = [{**user_brief(users[r["user_id"]]), "new": r["new"], "acknowledged": r["acknowledged"], "dismissed": r["dismissed"],
            "entities": r["entities"], "last_seen": _iso(r["last"]), "flagged_at": _iso(r["flagged"])} for r in rows if r["user_id"] in users]
    out.sort(key=lambda m: (-m["new"], -m["acknowledged"], m["name"]))
    return out


def member_detail(user, request) -> dict:
    """One member's findings across their characters the viewer may see. Seeing who they dealt with counts as looking at their intel.
    A member none of whose characters the viewer may see, or the viewer themselves, isn't there (404)."""
    characters = list(others(request.user).filter(user=user))
    if not characters:
        raise SpyCheckError("Not found", status=404)
    order = {Finding.State.NEW: 0, Finding.State.ACKNOWLEDGED: 1, Finding.State.DISMISSED: 2}
    findings = sorted(findings_qs(request.user, "all", user=user.pk), key=lambda f: (order[f.state], f.character_name, f.entity_name, f.kind))
    with_findings = {f.character_id for f in findings}
    for c in characters:
        if c.pk in with_findings:
            record_snoop(request, c, "intel")
    record("spycheck.member_viewed", f"looked at {user.display_name}'s Spy Check findings", request=request, target=user,
           details={"findings": len(findings)})
    return {
        "user": user_brief(user),
        "characters": [{"id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "corporation": c.corporation.name if c.corporation else None,
                        "findings": sum(1 for f in findings if f.character_id == c.pk)} for c in characters],
        "findings": [finding_out(f) for f in findings],
    }


def summary(viewer) -> dict:
    s = SpySettings.load()
    counts = dict(visible(viewer).values("state").order_by().annotate(n=Count("id")).values_list("state", "n"))
    by_kind = dict(visible(viewer).filter(state=Finding.State.NEW).values("kind").order_by().annotate(n=Count("id")).values_list("kind", "n"))
    return {
        "new": counts.get("new", 0), "acknowledged": counts.get("acknowledged", 0), "dismissed": counts.get("dismissed", 0),
        "members": visible(viewer).filter(state=Finding.State.NEW).values("user").distinct().count(),
        "by_kind": by_kind,
        "watched": len(watched_entities(s)),
        "last_scan_at": _iso(s.last_scan_at), "last_scan_characters": s.last_scan_characters, "last_scan_new": s.last_scan_new,
        "blacklist_available": blacklist_available(),
    }


# --- evidence ------------------------------------------------------------------------------------------------------


def _names(ids) -> dict[int, dict]:
    from conduit.sheet.contacts.api import entity_image

    ids = {i for i in ids if i}
    out = {n.id: (n.name, n.category) for n in EveName.objects.filter(pk__in=ids)}
    for pk, name in Character.objects.filter(pk__in=ids - out.keys()).values_list("pk", "name"):
        out[pk] = (name, "character")
    return {i: {"id": i, "name": n, "kind": k, "image": entity_image(k, i)} for i, (n, k) in out.items()}


def _party(i, names):
    return names.get(i) or ({"id": i, "name": str(i), "kind": "character", "image": None} if i else None)


def _evidence_rows(f: Finding) -> list[dict]:
    cid, eid = f.character_id, f.entity_id
    if f.kind == "journal":
        rows = list(JournalEntry.objects.filter(character_id=cid).filter(Q(first_party_id=eid) | Q(second_party_id=eid)).order_by("-date")[:EVIDENCE_LIMIT])
        names = _names({r.first_party_id for r in rows} | {r.second_party_id for r in rows})
        return [{"date": r.date.isoformat(), "ref_type": r.ref_type, "amount": float(r.amount) if r.amount is not None else None,
                 "description": r.description, "reason": r.reason, "first_party": _party(r.first_party_id, names),
                 "second_party": _party(r.second_party_id, names)} for r in rows]
    if f.kind == "market":
        from conduit.sheet.util import type_out, types_by_id

        rows = list(WalletTransaction.objects.filter(character_id=cid, client_id=eid).order_by("-date")[:EVIDENCE_LIMIT])
        types = types_by_id({r.type_id for r in rows})
        return [{"date": r.date.isoformat(), "type": type_out(r.type_id, types), "quantity": r.quantity, "unit_price": float(r.unit_price),
                 "total": float(r.unit_price * r.quantity), "is_buy": r.is_buy} for r in rows]
    if f.kind == "contract":
        rows = list(Contract.objects.filter(character_id=cid).filter(Q(issuer_id=eid) | Q(issuer_corporation_id=eid) | Q(assignee_id=eid) | Q(acceptor_id=eid))
                    .order_by("-date_issued")[:EVIDENCE_LIMIT])
        names = _names({i for r in rows for i in (r.issuer_id, r.issuer_corporation_id, r.assignee_id, r.acceptor_id)})
        return [{"contract_id": r.contract_id, "type": r.type, "status": r.status, "title": r.title, "date": r.date_issued.isoformat(),
                 "issuer": _party(r.issuer_id, names), "assignee": _party(r.assignee_id, names), "acceptor": _party(r.acceptor_id, names),
                 "price": float(r.price or 0), "reward": float(r.reward or 0)} for r in rows]
    if f.kind == "mail":
        rows = [m for m in Mail.objects.filter(character_id=cid).filter(Q(sender_id=eid) | Q(recipients__icontains=str(eid))).order_by("-timestamp")[:EVIDENCE_LIMIT * 2]
                if m.sender_id == eid or any(isinstance(r, dict) and r.get("recipient_id") == eid for r in m.recipients or ())][:EVIDENCE_LIMIT]
        names = _names({m.sender_id for m in rows} | {r.get("recipient_id") for m in rows for r in m.recipients or () if isinstance(r, dict)})
        # The subject and who it went between; the text stays on the character sheet.
        return [{"mail_id": m.mail_id, "date": m.timestamp.isoformat(), "subject": m.subject, "sender": _party(m.sender_id, names),
                 "recipients": [_party(r.get("recipient_id"), names) for r in m.recipients or () if isinstance(r, dict)][:20],
                 "from_them": m.sender_id == eid} for m in rows]
    if f.kind == "contact":
        return [{"standing": c.standing, "labels": c.labels, "is_watched": c.is_watched, "is_blocked": c.is_blocked}
                for c in Contact.objects.filter(character_id=cid, contact_id=eid)]
    # corp_history: every stint in a watched corporation, or in one that is in the watched alliance now.
    corp_ids = [eid] if f.entity_kind == "corporation" else list(EveCorporation.objects.filter(alliance_id=eid).values_list("pk", flat=True))
    history = list(CorporationHistory.objects.filter(character_id=cid).order_by("start_date"))
    names = _names({h.corporation_id for h in history})
    out = []
    for i, h in enumerate(history):
        if h.corporation_id in corp_ids:
            end = history[i + 1].start_date if i + 1 < len(history) else None
            out.append({"corporation": _party(h.corporation_id, names), "start": h.start_date.isoformat(), "end": _iso(end), "current": end is None})
    if not out:
        c = Character.objects.filter(pk=cid).first()
        if c and (c.corporation_id == eid or c.alliance_id == eid or c.corporation_id in corp_ids):
            corp = _names([c.corporation_id]).get(c.corporation_id) if c.corporation_id else None
            out.append({"corporation": corp, "start": None, "end": None, "current": True})
    return list(reversed(out))


def evidence(f: Finding, request) -> dict:
    """The records behind a finding, read live from the character's data. Opening it goes in the snooper log like
    opening that tab of their sheet, and in the audit log."""
    character = Character.objects.filter(pk=f.character_id).select_related("user").first()
    if character is not None:
        record_snoop(request, character, SECTION[f.kind])
    record("spycheck.evidence_viewed", f"opened Spy Check evidence on {f.character_name} ({f.get_kind_display().lower()} with {f.entity_name})",
           request=request, target=f.user, details={"finding_id": f.pk, "character_id": f.character_id, "kind": f.kind, "entity_id": f.entity_id})
    rows = _evidence_rows(f) if character is not None else []
    return {**finding_out(f), "rows": rows, "rows_limited": len(rows) >= EVIDENCE_LIMIT, "character_registered": character is not None}
