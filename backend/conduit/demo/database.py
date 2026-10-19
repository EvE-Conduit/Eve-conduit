"""The demo database: an SQLite file of its own, built when demo mode is switched on.

It's built in place: the version file next to it is removed first and written last, so other processes only use
it once it's complete (``ready()``). A lock file keeps two processes from building at once. The file is rebuilt
when this version of EvE Conduit, its plugins or the example data change (``fingerprint()``).
"""

from __future__ import annotations

import hashlib
import logging
import os
import threading
import time
from functools import cache
from pathlib import Path

from django.conf import settings
from django.db import connections

from .state import activate

log = logging.getLogger(__name__)

ALIAS = "demo"
#: Raise when the example data changes, so existing demo databases are built again.
SEED_VERSION = 1
#: A build that hasn't finished after this long died with its process; another may start.
STALE_LOCK = 15 * 60
#: Static data copied from the real database, so item, system and skill names show in the demo.
STATIC_MODELS = (
    "sde.ItemCategory", "sde.ItemGroup", "sde.MarketGroup", "sde.MetaGroup", "sde.ItemType", "sde.TypeMaterial",
    "sde.SkillInfo", "sde.Race", "sde.Bloodline", "sde.PlanetSchematic", "sde.Region", "sde.Constellation",
    "sde.SolarSystem", "sde.Station", "sde.SdeVersion", "eve.MarketPrice",
)

_building = threading.Lock()
_last_error = ""


def path() -> Path:
    return Path(settings.DATABASES[ALIAS]["NAME"])


def _version_file() -> Path:
    return path().with_name(path().name + ".version")


def _lock_file() -> Path:
    return path().with_name(path().name + ".lock")


@cache
def fingerprint() -> str:
    """What the demo database was built for: this version, its migrations and the example data."""
    from django.db.migrations.loader import MigrationLoader

    from conduit import __version__

    leaves = sorted(f"{app}.{name}" for app, name in MigrationLoader(None, ignore_no_migrations=True).graph.leaf_nodes())
    return hashlib.sha256(f"{__version__}|{SEED_VERSION}|{'|'.join(leaves)}".encode()).hexdigest()[:20]


def ready() -> bool:
    try:
        return _version_file().read_text().strip() == fingerprint() and not building()
    except OSError:
        return False


def building() -> bool:
    try:
        return time.time() - _lock_file().stat().st_mtime < STALE_LOCK
    except OSError:
        return False


def last_error() -> str:
    return _last_error


def _prepare_folder():
    folder = path().parent
    folder.mkdir(mode=0o700, parents=True, exist_ok=True)
    if os.name == "posix":
        # The default folder is in the system's temporary directory: refuse one somebody else made for us.
        info = folder.stat()
        if info.st_uid != os.getuid() or info.st_mode & 0o022:
            raise RuntimeError(f"{folder} must belong to this user and not be writable by anyone else")


def _take_lock() -> bool:
    lock = _lock_file()
    if building():
        return False
    lock.unlink(missing_ok=True)  # a stale one
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        return False
    os.write(fd, str(os.getpid()).encode())
    os.close(fd)
    return True


def build(force: bool = False):
    """Build the demo database now (in this thread), unless it's ready already. Returns False if another process
    is building it."""
    global _last_error
    with _building:
        if ready() and not force:
            return True
        _prepare_folder()
        if not _take_lock():
            return False
        try:
            _version_file().unlink(missing_ok=True)
            connections[ALIAS].close()
            for suffix in ("", "-journal", "-wal", "-shm"):
                path().with_name(path().name + suffix).unlink(missing_ok=True)
            started = time.monotonic()
            _migrate()
            _copy_static_data()
            with activate():
                from .seed import run

                run()
            connections[ALIAS].close()
            _version_file().write_text(fingerprint())
            _last_error = ""
            log.info("Built the demo database in %.0fs", time.monotonic() - started)
            return True
        except Exception as exc:
            _last_error = f"Couldn't build the demo data: {exc}"
            log.exception("Couldn't build the demo database")
            raise
        finally:
            connections[ALIAS].close()
            _lock_file().unlink(missing_ok=True)


def build_in_background():
    """Build the demo database in a thread of this process."""

    def work():
        try:
            build()
        except Exception:
            pass  # logged by build(); last_error() tells the admin
        finally:
            connections.close_all()

    if not building():
        threading.Thread(target=work, name="conduit-demo-build", daemon=True).start()


def _migrate():
    from django.core.management import call_command

    # Migrations and their post_migrate handlers (permissions, content types) run as a demo request would, so
    # anything they save lands in the demo database.
    with activate():
        call_command("migrate", database=ALIAS, interactive=False, verbosity=0)


def _copy_static_data(batch: int = 2000):
    from django.apps import apps

    for label in STATIC_MODELS:
        try:
            model = apps.get_model(label)
        except LookupError:
            continue
        rows = model.objects.using("default").order_by("pk").iterator(chunk_size=batch)
        chunk = []
        for row in rows:
            row._state.db = ALIAS
            chunk.append(row)
            if len(chunk) >= batch:
                model.objects.using(ALIAS).bulk_create(chunk)
                chunk = []
        if chunk:
            model.objects.using(ALIAS).bulk_create(chunk)
