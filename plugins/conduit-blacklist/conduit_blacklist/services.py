"""The blacklist: entries, their notes, and finding members' and applicants' characters that match one."""

from __future__ import annotations

import logging
from datetime import datetime

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.audit.services import record
from conduit.events import bus
from conduit.notify.services import notify_permission

from .models import Entry, Match, Note

log = logging.getLogger(__name__)

VIEW_PERM = "blacklist.view_blacklist"
MANAGE_PERM = "blacklist.manage_blacklist"


class BlacklistError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


# --- output ----------------------------------------------------------------------------------------------------


def image_of(kind: str, eve_id: int) -> str:
    path = {"character": "characters", "corporation": "corporations", "alliance": "alliances"}[kind]
    suffix = "portrait" if kind == "character" else "logo"
    return f"https://images.evetech.net/{path}/{eve_id}/{suffix}?size=64"


def entry_out(e: Entry, detail: bool = False) -> dict:
    out = {
        "id": e.pk,
        "kind": e.kind,
        "eve_id": e.eve_id,
        "name": e.name,
        "image": image_of(e.kind, e.eve_id),
        "reason": e.reason,
        "severity": e.severity,
        "expires_at": e.expires_at,
        "expired": e.expired,
        "added_by": e.added_by.display_name if e.added_by else None,
        "created_at": e.created_at,
        "updated_at": e.updated_at,
        "open_matches": sum(1 for m in e.matches.all() if m.resolved_at is None),
    }
    if detail:
        out["notes"] = [note_out(n) for n in e.notes.select_related("author", "author__main_character")]
        out["matches"] = [match_out(m) for m in e.matches.select_related("user", "user__main_character", "resolved_by")]
    return out


def note_out(n: Note) -> dict:
    return {"id": n.pk, "author": n.author.display_name if n.author else "Someone", "text": n.text, "created_at": n.created_at}


def match_out(m: Match) -> dict:
    return {
        "id": m.pk,
        "entry": {"id": m.entry_id, "name": m.entry.name, "kind": m.entry.kind, "severity": m.entry.severity},
        "user_id": m.user_id,
        "user": m.user.display_name,
        "character_id": m.character_id,
        "character_name": m.character_name,
        "portrait": image_of("character", m.character_id),
        "source": m.source,
        "found_at": m.found_at,
        "resolved_at": m.resolved_at,
        "resolved_by": m.resolved_by.display_name if m.resolved_by else None,
    }


# --- entries ---------------------------------------------------------------------------------------------------


def lookup(q: str) -> list[dict]:
    """Characters, corporations and alliances with exactly this name, from ESI."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError

    q = q.strip()
    if len(q) < 3:
        return []
    try:
        data = esi().post("/universe/ids", [q]).data or {}
    except (EsiError, EsiBackoff) as exc:
        raise BlacklistError(f"ESI lookup failed: {exc}", 502) from None
    hits = []
    for category in ("characters", "corporations", "alliances"):
        kind = category.rstrip("s")
        for row in data.get(category, []):
            existing = Entry.objects.filter(kind=kind, eve_id=row["id"]).values_list("pk", flat=True).first()
            hits.append({"kind": kind, "eve_id": row["id"], "name": row["name"], "image": image_of(kind, row["id"]),
                         "entry_id": existing})
    return hits


def _resolve_name(kind: str, eve_id: int) -> str:
    """The name of an EVE id, checking it is the kind of thing it's said to be."""
    from conduit.eve.models import EveName
    from conduit.eve.tasks import ensure_eve_names

    try:
        ensure_eve_names([eve_id])
    except Exception:  # ESI down: say so rather than store a nameless entry
        log.warning("Couldn't look up the name of %s", eve_id, exc_info=True)
    row = EveName.objects.filter(pk=eve_id).first()
    if row is None:
        raise BlacklistError("EVE doesn't know that id (or ESI couldn't be reached)")
    if row.category != kind:
        raise BlacklistError(f"That id is a {row.category}, not a {kind}")
    return row.name


def save_entry(entry: Entry | None, data: dict, by, request=None) -> Entry:
    kind = data.get("kind") or (entry.kind if entry else "")
    if kind not in Entry.Kind.values:
        raise BlacklistError("Pick a character, corporation or alliance")
    if data.get("severity") not in Entry.Severity.values:
        raise BlacklistError("Pick watch or banned")
    expires_at: datetime | None = data.get("expires_at")
    if expires_at is not None and expires_at <= timezone.now():
        raise BlacklistError("The expiry date has to be in the future")
    new = entry is None
    if new:
        eve_id = int(data.get("eve_id") or 0)
        if eve_id <= 0:
            raise BlacklistError("Pick who to blacklist")
        if Entry.objects.filter(kind=kind, eve_id=eve_id).exists():
            raise BlacklistError("They're already on the blacklist")
        entry = Entry(kind=kind, eve_id=eve_id, name=_resolve_name(kind, eve_id), added_by=by)
    entry.reason = (data.get("reason") or "").strip()
    entry.severity = data["severity"]
    entry.expires_at = expires_at
    try:
        with transaction.atomic():
            entry.save()
    except IntegrityError:
        raise BlacklistError("They're already on the blacklist") from None
    verb = "blacklisted" if new else "changed the blacklist entry for"
    record(f"blacklist.{'added' if new else 'changed'}", f"{verb} {entry.name} ({entry.get_severity_display().lower()})",
           request=request, actor=by, target=entry, target_type="plugin", details={"entry_id": entry.pk, "kind": kind})
    if new:
        from .tasks import check_entry

        transaction.on_commit(lambda: check_entry.delay(entry.pk))
    return entry


def delete_entry(entry: Entry, by, request=None) -> None:
    record("blacklist.removed", f"removed {entry.name} from the blacklist", request=request, actor=by, target=entry,
           target_type="plugin", details={"entry_id": entry.pk, "kind": entry.kind, "reason": entry.reason})
    entry.delete()


def add_note(entry: Entry, by, text: str) -> Note:
    text = text.strip()
    if not text:
        raise BlacklistError("Write something first")
    return Note.objects.create(entry=entry, author=by, text=text[:5000])


def resolve_match(match: Match, by, resolved: bool = True) -> Match:
    match.resolved_at = timezone.now() if resolved else None
    match.resolved_by = by if resolved else None
    match.save(update_fields=["resolved_at", "resolved_by"])
    return match


# --- matching --------------------------------------------------------------------------------------------------


def _matching(characters, entries) -> list[tuple[Character, Entry]]:
    by_key = {(e.kind, e.eve_id): e for e in entries}
    found = []
    for c in characters:
        for key in (("character", c.pk), ("corporation", c.corporation_id), ("alliance", c.alliance_id)):
            if key[1] and key in by_key:
                found.append((c, by_key[key]))
    return found


def entries_for_characters(characters) -> list[tuple[Character, Entry]]:
    characters = list(characters)
    if not characters:
        return []
    entries = Entry.objects.active().filter(
        Q(kind="character", eve_id__in=[c.pk for c in characters])
        | Q(kind="corporation", eve_id__in={c.corporation_id for c in characters if c.corporation_id})
        | Q(kind="alliance", eve_id__in={c.alliance_id for c in characters if c.alliance_id})
    )
    return _matching(characters, entries)


def _record_matches(pairs, source: str) -> list[Match]:
    """Store the matches not seen before (or on another account than before), and warn whoever watches the blacklist about them."""
    new = []
    for character, entry in pairs:
        match, created = Match.objects.get_or_create(
            entry=entry, character_id=character.pk,
            defaults={"user_id": character.user_id, "character_name": character.name, "source": source},
        )
        if created:
            new.append(match)
        elif match.user_id != character.user_id:
            # The character moved to another account since: that's news again.
            match.user_id, match.source, match.resolved_at, match.resolved_by = character.user_id, source, None, None
            match.save(update_fields=["user", "source", "resolved_at", "resolved_by"])
            new.append(match)
    for m in new:
        _warn(m, source)
    return new


def _warn(m: Match, source: str) -> None:
    owner = m.user.display_name
    who = m.character_name if m.entry.kind == "character" else f"{m.character_name} (in {m.entry.name})"
    what = {
        "linked": f"{who} was linked to {owner}'s account.",
        "applied": f"{owner} applied, and their character {who} is blacklisted.",
        "check": f"{who}, on {owner}'s account, is blacklisted.",
    }[source]
    title = f"Blacklisted: {m.character_name}"
    body = f"{what} {m.entry.get_severity_display()}: {m.entry.reason or 'no reason given'}"
    notify_permission(VIEW_PERM, title, body, link=f"/p/blacklist/entries/{m.entry_id}", level="danger",
                      category="p.blacklist", force=m.entry.severity == Entry.Severity.BANNED)
    bus.emit("blacklist.match", user_id=m.user_id, user=owner, character_id=m.character_id, character=m.character_name,
             entry_id=m.entry_id, entry=m.entry.name, kind=m.entry.kind, severity=m.entry.severity, source=source,
             title=title, summary=body, level="danger", link=f"/p/blacklist/entries/{m.entry_id}")


def check_user(user_id: int, source: str) -> list[Match]:
    """Look for matches among a user's characters. On applying, the ones found earlier and not dealt with are
    brought up again, since that's when recruiters need to know."""
    characters = Character.objects.filter(user_id=user_id).select_related("user")
    new = _record_matches(entries_for_characters(characters), source)
    if source == Match.Source.APPLIED:
        earlier = (Match.objects.filter(user_id=user_id, resolved_at__isnull=True, entry__in=Entry.objects.active())
                   .exclude(pk__in=[m.pk for m in new]).select_related("entry", "user"))
        for m in earlier:
            _warn(m, source)
    return new


def check_entry(entry: Entry) -> list[Match]:
    """Every registered character the entry covers (run when it's added)."""
    field = {"character": "id", "corporation": "corporation_id", "alliance": "alliance_id"}[entry.kind]
    characters = Character.objects.filter(**{field: entry.eve_id}).select_related("user")
    return _record_matches([(c, entry) for c in characters], Match.Source.CHECK)


def check_all() -> int:
    entries = list(Entry.objects.active())
    if not entries:
        return 0
    characters = Character.objects.filter(
        Q(id__in=[e.eve_id for e in entries if e.kind == "character"])
        | Q(corporation_id__in=[e.eve_id for e in entries if e.kind == "corporation"])
        | Q(alliance_id__in=[e.eve_id for e in entries if e.kind == "alliance"])
    ).select_related("user")
    return len(_record_matches(_matching(characters, entries), Match.Source.CHECK))


# --- search ----------------------------------------------------------------------------------------------------


def search(request, q, limit):
    """Ctrl+K: entries whose name matches, for people who may see the blacklist."""
    if not request.user.has_perm(VIEW_PERM):
        return {"key": "blacklist", "label": "Blacklist", "hits": []}
    rows = Entry.objects.filter(name__icontains=q).order_by("name")[:limit]
    return {
        "key": "blacklist",
        "label": "Blacklist",
        "hits": [{"id": f"blacklist:{e.pk}", "title": e.name, "subtitle": f"{e.get_kind_display()} · {e.get_severity_display()}",
                  "image": image_of(e.kind, e.eve_id), "url": f"/p/blacklist/entries/{e.pk}"} for e in rows],
    }


def check_name(q: str) -> list[dict]:
    """Is this character, corporation or alliance blacklisted, directly or through its corporation or alliance?
    For checking someone who hasn't registered (yet)."""
    from conduit.esi.client import esi
    from conduit.esi.exceptions import EsiBackoff, EsiError

    hits = lookup(q)
    character_ids = [h["eve_id"] for h in hits if h["kind"] == "character"]
    affiliation = {}
    if character_ids:
        try:
            affiliation = {r["character_id"]: r for r in esi().post("/characters/affiliation", character_ids).data}
        except (EsiError, EsiBackoff) as exc:
            raise BlacklistError(f"ESI lookup failed: {exc}", 502) from None
    active = Entry.objects.active()
    for h in hits:
        keys = [(h["kind"], h["eve_id"])]
        if h["kind"] == "character" and h["eve_id"] in affiliation:
            row = affiliation[h["eve_id"]]
            keys += [("corporation", row.get("corporation_id")), ("alliance", row.get("alliance_id"))]
        if h["kind"] == "corporation":
            from conduit.eve.models import EveCorporation

            corp = EveCorporation.objects.filter(pk=h["eve_id"]).first()
            if corp and corp.alliance_id:
                keys.append(("alliance", corp.alliance_id))
        q_ = Q(pk__in=[])
        for kind, eve_id in keys:
            if eve_id:
                q_ |= Q(kind=kind, eve_id=eve_id)
        h["entries"] = [entry_out(e) for e in active.filter(q_).prefetch_related("matches").select_related("added_by", "added_by__main_character")]
    return hits
