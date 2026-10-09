"""Bring every character's data over from a SeAT dump: ``manage.py import_seat_history <dump>``.

For each character that is both in the dump and on this site (run the account import first), each character sheet
section is rebuilt by running its normal sync against the dump instead of EVE (see ``esi.SeatEsi``):

* History sections (wallet, mail, killmails, ...) merge SeAT's rows into what is here, by EVE's ids, so the years
  SeAT kept are added to the 30 days or so EVE still serves.
* Snapshot sections (skills, assets, ...) take SeAT's last copy only while the section has never synced from EVE
  here: characters whose tokens are gone keep what SeAT last saw; live ones get EVE's current data as usual.

No call reaches EVE while sections import. Names SeAT didn't have are looked up at the end, in one go. Scope
checks pass while importing (a dead token would otherwise make syncs skip the data SeAT has).
Running it again adds nothing twice.
"""

from __future__ import annotations

import importlib
import os
import tempfile
from collections.abc import Callable
from contextlib import ExitStack
from datetime import datetime, timezone
from unittest import mock

from django.db import transaction

from conduit.accounts.models import Character, Token
from conduit.esi.client import EsiClient
from conduit.esi.exceptions import EsiBackoff
from conduit.eve.models import EveName
from conduit.sheet import registry
from conduit.sheet.models import SyncStatus

from . import routes
from .esi import Context, SeatEsi
from .staging import Staging

#: Start of the status message on sections filled from SeAT.
NOTE = "From SeAT"


def _no_live_esi(*args, **kwargs):
    raise EsiBackoff(0, "no calls to EVE while importing from SeAT")


def _seat_time(value) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "")).replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def plan(sections=None) -> list[routes.SectionImport]:
    """The section imports to run, in the sheet's own order."""
    known = routes.load()
    wanted = set(sections) if sections else set(known)
    unknown = wanted - set(known)
    if unknown:
        raise ValueError(f"No SeAT import for: {', '.join(sorted(unknown))} (available: {', '.join(sorted(known))})")
    return [known[s.key] for s in registry.ordered() if s.key in wanted and s.key in known]


def load(dump_path: str, staging_path: str, imports: list[routes.SectionImport], say: Callable = print) -> Staging:
    tables = set(routes.BASE_TABLES) | {t for imp in imports for t in imp.tables}
    indexes: dict[str, set] = {t: {"character_id"} for t in tables}
    for extra in [routes.BASE_INDEXES] + [imp.indexes for imp in imports]:
        for table, cols in extra.items():
            indexes.setdefault(table, set()).update(cols)
    store = Staging(staging_path)
    say(f"Reading {os.path.basename(dump_path)} ({len(tables)} tables)...")
    counts = store.load(dump_path, tables, indexes,
                        progress=lambda t, n: n % 200000 == 0 and say(f"  {t}: {n:,} rows so far"))
    for table in sorted(counts):
        say(f"  {table}: {counts[table]:,} rows")
    if not store.has("refresh_tokens"):
        raise ValueError("The dump has no refresh_tokens table, so it can't say which characters SeAT had.")
    return store


def preload_names(store: Staging) -> int:
    rows = store.rows("universe_names")
    EveName.objects.bulk_create(
        [EveName(id=r["entity_id"], name=r["name"][:200], category=r["category"] or "") for r in rows if r["entity_id"]],
        ignore_conflicts=True, batch_size=2000,
    )
    return len(rows)


def _granted(token, *scopes) -> bool:
    """Token.has_scopes while importing: SeAT's data is there whether or not the token still works, so every
    scope-gated call is made (a dead token would otherwise skip them all)."""
    return True


def import_character(store: Staging, character, imports, names: set, orgs: dict | None = None) -> dict[str, str]:
    """Run each section import for one character. Returns {section: "imported" | "skipped" | "error: ..."}."""
    orgs = {"corporation_ids": set(), "alliance_ids": set()} if orgs is None else orgs
    if not Token.objects.filter(character=character).exists():
        # SeAT dropped this character's token; syncs still read character.token, so give them one (never saved).
        character.token = Token(character=character, access_token="", refresh_token="", scopes="", valid=False,
                                expires_at=datetime(2000, 1, 1, tzinfo=timezone.utc))
    token = store.one("refresh_tokens", character_id=character.pk) or {}
    as_of = _seat_time(token.get("updated_at") or token.get("created_at"))
    statuses = {s.section: s for s in SyncStatus.objects.filter(character=character)}
    out = {}
    for imp in imports:
        status = statuses.get(imp.key)
        # A section counts as synced from EVE once it has a success that didn't come from us.
        synced = bool(status and status.last_success and not status.message.startswith(NOTE))
        if imp.kind == routes.SNAPSHOT and status and status.last_success:
            out[imp.key] = "skipped"
            continue
        section = registry.SECTIONS[imp.key]
        module = importlib.import_module(section.sync.rpartition(".")[0])
        ctx = Context(store, character, imp.key, synced, names)
        with ExitStack() as stack:
            if hasattr(module, "ensure_eve_names"):
                stack.enter_context(mock.patch.object(module, "ensure_eve_names", lambda ids: names.update(ids)))
            if hasattr(module, "ensure_names"):
                def note_orgs(corporation_ids=(), alliance_ids=()):
                    orgs["corporation_ids"].update(corporation_ids)
                    orgs["alliance_ids"].update(alliance_ids)
                stack.enter_context(mock.patch.object(module, "ensure_names", note_orgs))
            for mod, attr, value in imp.limits:
                stack.enter_context(mock.patch.object(importlib.import_module(mod), attr, value))
            try:
                with transaction.atomic():
                    section.sync_function()(character, SeatEsi(ctx))
            except Exception as exc:  # one section failing must not stop the rest
                out[imp.key] = f"error: {type(exc).__name__}: {exc}"[:300]
                continue
        out[imp.key] = "imported"
        if not synced:
            when = as_of or datetime.now(timezone.utc)
            note = f"{NOTE}, data as of {when:%Y-%m-%d}"
            if status is None:
                SyncStatus.objects.create(character=character, section=imp.key, result=SyncStatus.Result.OK,
                                          message=note, last_success=when)
            else:
                status.message, status.last_success = note, status.last_success or when
                status.save(update_fields=["message", "last_success"])
    return out


def run(dump_path: str, *, sections=None, character_ids=None, staging_path: str | None = None, keep_staging=False,
        lookup_names=True, say: Callable = print) -> dict:
    imports = plan(sections)
    own_staging = staging_path is None
    if own_staging:
        fd, staging_path = tempfile.mkstemp(prefix="seat-history-", suffix=".sqlite3")
        os.close(fd)
    store = None
    try:
        store = load(dump_path, staging_path, imports, say)
        say(f"Names from SeAT: {preload_names(store):,}")
        seat_ids = store.character_ids()
        if character_ids:
            seat_ids &= set(character_ids)
        characters = list(Character.objects.filter(pk__in=seat_ids).order_by("name"))
        absent = len(seat_ids) - len(characters)
        say(f"{len(characters)} characters to import" + (f"; {absent} in SeAT aren't on this site (import their "
                                                         "accounts first)" if absent else ""))
        names: set = set()
        orgs: dict = {"corporation_ids": set(), "alliance_ids": set()}
        summary = {"characters": len(characters), "not_here": absent, "sections": {}, "errors": []}
        with mock.patch.object(EsiClient, "_request", _no_live_esi), mock.patch.object(Token, "has_scopes", _granted):
            for n, character in enumerate(characters, 1):
                for key, result in import_character(store, character, imports, names, orgs).items():
                    counts = summary["sections"].setdefault(key, {"imported": 0, "skipped": 0, "errors": 0})
                    if result.startswith("error"):
                        counts["errors"] += 1
                        summary["errors"].append({"character": character.pk, "section": key, "error": result})
                        say(f"  {character.name}: {key} {result}")
                    else:
                        counts[result] += 1
                if n % 25 == 0 or n == len(characters):
                    say(f"  {n}/{len(characters)} characters")
        if lookup_names and (names or orgs["corporation_ids"] or orgs["alliance_ids"]):
            from conduit.eve.tasks import ensure_eve_names, ensure_names

            say(f"Looking up {len(names) + len(orgs['corporation_ids']) + len(orgs['alliance_ids']):,} names with EVE...")
            try:
                ensure_names(**orgs)
                ensure_eve_names(names)
            except Exception as exc:  # names fill in later on their own
                say(f"  Name lookup stopped ({exc}); they are filled in as characters sync.")
        return summary
    finally:
        if store is not None:
            store.close()
        if own_staging and not keep_staging:
            try:
                os.remove(staging_path)
            except OSError:
                pass
