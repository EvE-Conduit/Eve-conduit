"""History imports driven over the API by the SeAT import program.

The program reads the dump on the operator's PC and sends the tables the import needs, a piece at a time, into a
working file here (one per run). Starting the run imports in the background, like ``import_seat_history`` does
from a dump on this machine; the program polls for progress. The working file is deleted when the run ends.
"""

from __future__ import annotations

import re
import secrets
import tempfile
import time
from pathlib import Path

from django.core.cache import cache

from . import history
from .staging import Staging

#: How long a run's progress stays readable, and how long an abandoned upload is kept.
STATE_TTL = 7 * 24 * 3600
_NAME = re.compile(r"^\w{1,64}$")
_RUN = re.compile(r"^[0-9a-f]{16}$")


class RunError(Exception):
    pass


def run_dir() -> Path:
    """Where uploads wait. The web app writes it and the worker reads it, so both must see the same folder
    (Docker gives them a shared volume; elsewhere they share the system temp folder)."""
    from django.conf import settings

    path = Path(settings.CONDUIT_SEAT_IMPORT_DIR or Path(tempfile.gettempdir()) / "conduit-seat-history")
    path.mkdir(parents=True, exist_ok=True)
    return path


def _file(run_id: str) -> Path:
    if not _RUN.match(run_id or ""):
        raise RunError("unknown run")
    return run_dir() / f"{run_id}.sqlite3"


def state_key(run_id: str) -> str:
    return f"conduit:seat-history:{run_id}"


def state(run_id: str) -> dict | None:
    return cache.get(state_key(run_id))


def _set(run_id: str, **values) -> dict:
    current = state(run_id) or {}
    current.update(values)
    cache.set(state_key(run_id), current, STATE_TTL)
    return current


def wanted_tables() -> list[str]:
    return sorted(history.tables_for(history.plan()))


def create() -> str:
    # Uploads abandoned part way are cleared out after a week.
    for old in run_dir().glob("*.sqlite3"):
        try:
            if time.time() - old.stat().st_mtime > STATE_TTL:
                old.unlink()
        except OSError:
            pass
    run_id = secrets.token_hex(8)
    Staging(str(_file(run_id))).close()
    _set(run_id, status="uploading", rows=0)
    return run_id


def append(run_id: str, table: str, columns: list[str], rows: list[list], seq: int | None = None) -> int:
    """Add a piece of rows. Pieces carry a sequence number, so one sent again (its answer was lost) isn't
    added twice."""
    path = _file(run_id)
    current = state(run_id)
    if not path.exists() or not current or current.get("status") != "uploading":
        raise RunError("This run isn't taking rows (it has started, finished or expired).")
    if seq is not None and seq <= current.get("seq", -1):
        return 0
    if table not in wanted_tables():
        raise RunError(f"{table} isn't a table the import reads")
    if not columns or not all(_NAME.match(c) for c in columns) or len(set(columns)) != len(columns):
        raise RunError("bad column names")
    if any(not isinstance(r, list) or len(r) != len(columns) for r in rows):
        raise RunError("every row needs one value per column")
    store = Staging(str(path))
    try:
        added = store.append(table, columns, rows)
    finally:
        store.close()
    _set(run_id, rows=current.get("rows", 0) + added, **({} if seq is None else {"seq": seq}))
    return added


def start(run_id: str, character_ids=None, sections=None):
    from conduit.sheet.tasks import import_seat_history

    path = _file(run_id)
    current = state(run_id)
    if not path.exists() or not current or current.get("status") != "uploading":
        raise RunError("This run can't be started (it has started, finished or expired).")
    history.plan(sections)  # unknown sections fail here, not in the background
    _set(run_id, status="queued")
    import_seat_history.delay(run_id, list(character_ids or []), list(sections or []))


def execute(run_id: str, character_ids: list[int], sections: list[str]):
    """The background part of ``start``."""
    path = _file(run_id)
    log: list[str] = []
    store = None
    try:
        if not path.exists():
            raise RunError(f"The uploaded data isn't at {path} for the background worker. The web app and the worker "
                           "need to share that folder: set CONDUIT_SEAT_IMPORT_DIR to one they both see.")
        imports = history.plan(sections or None)
        store = Staging(str(path))
        _set(run_id, status="indexing")
        store.index(history.indexes_for(imports))
        _set(run_id, status="importing")
        summary = history.process(store, imports, character_ids=character_ids or None, say=log.append,
                                  progress=lambda s: _set(run_id, summary=s))
        _set(run_id, status="finished", summary=summary, log=log[-200:])
    except Exception as exc:
        _set(run_id, status="failed", error=f"{type(exc).__name__}: {exc}"[:500], log=log[-200:])
        raise
    finally:
        if store is not None:
            store.close()
        discard_file(run_id)


def discard_file(run_id: str):
    try:
        _file(run_id).unlink(missing_ok=True)
    except (OSError, RunError):
        pass


def discard(run_id: str):
    discard_file(run_id)
    cache.delete(state_key(run_id))
