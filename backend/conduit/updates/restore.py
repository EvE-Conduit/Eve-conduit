"""Backups made by ``conduit backup``, and restoring one, for the privileged updaters.

The website can't read the backups folder (it holds secrets: root or Administrators only), so the updater keeps a
list of what's there in the updates folder (``backups.json``), and the website asks for a backup or a restore by
leaving ``backup-request.json`` there. A request only names a backup; this module checks the name against the
backups folder itself, so a request can't point the updater anywhere else.

Restoring replaces the database and keeps the install's own ``conduit.env``: the backup's EVE login keys are added
to ``CONDUIT_TOKEN_KEY_PREVIOUS`` so its stored logins still decrypt (``rotate_token_key`` then re-encrypts them).

Free of Django on purpose: the updater runs it with the install's own Python::

    python -I -m conduit.updates.restore index <backups dir> <updates dir> [--owner USER]
    python -I -m conduit.updates.restore request <updates dir> <backups dir>
        prints "<action>\\t<id>\\t<backup name or ->\\t<requested by>" and removes the request; exits 3 when there's none
    python -I -m conduit.updates.restore result <updates dir> <id> <action> <status> <message> [--name N] [--owner USER]
    python -I -m conduit.updates.restore unpack <backup> <folder>
        unpacks the backup and prints the version that made it; refuses one made by a newer EvE Conduit
    python -I -m conduit.updates.restore load-db <unpacked backup> [--tools DIR]
        replaces the database named by $DATABASE_URL with the backup's (never on the command line: it has a password)
    python -I -m conduit.updates.restore carry-keys <conduit.env> <backup's conduit.env>
"""

from __future__ import annotations

import base64
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import unquote, urlparse

from . import safeio

INDEX_FILE = "backups.json"
REQUEST_FILE = "backup-request.json"
RESULT_FILE = "backup-result.json"
ACTIONS = ("backup", "restore")
STATUSES = ("running", "succeeded", "failed")
#: conduit-20261029-031500.tar.gz (Linux) or .zip (Windows); "-before-restore" marks the one a restore makes first.
NAME_RE = re.compile(r"^conduit-(\d{8})-(\d{6})(-before-restore)?\.(zip|tar\.gz)$")
ID_RE = re.compile(r"^[0-9a-f]{32}$")
#: What a backup holds. Nothing else is unpacked.
MEMBERS = ("database.dump", "database.sql", "conduit.env", "plugins.txt", "plugins-site.txt", "release.txt")
MAX_MEMBER = 64 * 1024 * 1024 * 1024
VERSION_RE = re.compile(r"(\d{1,4}\.\d{1,4}\.\d{1,4})$")


class RestoreError(Exception):
    pass


# --- the list of backups ----------------------------------------------------------------------------------------


def is_backup_name(name: str) -> bool:
    return bool(NAME_RE.match(name or ""))


def _member_name(name: str) -> str | None:
    """A top-level member ("database.dump" or "./database.dump") we know, or None."""
    name = name.replace("\\", "/").removeprefix("./")
    return name if name in MEMBERS else None


def _version_of(release_txt: str) -> str:
    """release.txt holds the release folder the backup was made with (…/releases/0.5.55)."""
    match = VERSION_RE.search(release_txt.strip().rstrip("/\\"))
    return match[1] if match else ""


def archive_version(path: Path) -> str:
    """The EvE Conduit version that made a backup, or "" when it doesn't say."""
    try:
        if path.name.endswith(".zip"):
            with zipfile.ZipFile(path) as zf:
                for info in zf.infolist():
                    if _member_name(info.filename) == "release.txt" and info.file_size < 4096:
                        return _version_of(zf.read(info).decode("utf-8", "replace"))
        else:
            with tarfile.open(path, "r:gz") as tf:
                for member in tf:
                    if _member_name(member.name) == "release.txt" and member.isfile() and member.size < 4096:
                        f = tf.extractfile(member)
                        return _version_of(f.read().decode("utf-8", "replace")) if f else ""
    except (OSError, zipfile.BadZipFile, tarfile.TarError, EOFError):
        pass
    return ""


def list_backups(folder: Path, known: dict[str, dict] | None = None) -> list[dict]:
    """The backups in the folder, newest first. ``known`` (the previous list) saves opening unchanged archives."""
    known = known or {}
    out = []
    try:
        entries = list(os.scandir(folder))
    except OSError:
        return []
    for entry in entries:
        match = NAME_RE.match(entry.name)
        if not match or not entry.is_file(follow_symlinks=False):
            continue
        st = entry.stat(follow_symlinks=False)
        previous = known.get(entry.name) or {}
        same = previous.get("size") == st.st_size and previous.get("mtime") == int(st.st_mtime)
        version = previous.get("version", "") if same else archive_version(Path(entry.path))
        made = datetime.strptime(match[1] + match[2], "%Y%m%d%H%M%S")  # the server's local time
        out.append({
            "name": entry.name,
            "size": st.st_size,
            "mtime": int(st.st_mtime),
            "created_at": datetime.fromtimestamp(st.st_mtime, UTC).isoformat(),
            "stamp": made.strftime("%Y-%m-%d %H:%M:%S"),
            "version": version,
            "before_restore": bool(match[3]),
        })
    out.sort(key=lambda b: (b["mtime"], b["name"]), reverse=True)
    return out


def write_index(backups_dir: Path, updates_dir: Path, owner: str | None = None) -> list[dict]:
    """Refresh backups.json in the updates folder (the website reads it). Written only when something changed."""
    index = Path(updates_dir) / INDEX_FILE
    try:
        old = safeio.read_json(index)
    except (OSError, ValueError):
        old = {}
    old_list = old.get("backups") if isinstance(old.get("backups"), list) else []
    known = {b["name"]: b for b in old_list if isinstance(b, dict) and isinstance(b.get("name"), str)}
    backups = list_backups(Path(backups_dir), known)
    if backups != old_list or "at" not in old:
        safeio.write_json(index, {"backups": backups, "at": datetime.now(UTC).isoformat()}, owner)
    return backups


# --- requests from the website ----------------------------------------------------------------------------------


def _clean_text(value, limit: int = 150) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", " ", str(value or ""))[:limit].strip()


def take_request(updates_dir: Path, backups_dir: Path) -> dict | None:
    """Read and remove backup-request.json (one attempt per request). None when there is none; RestoreError when
    it isn't a valid request, or names a backup that isn't a plain file in the backups folder."""
    path = Path(updates_dir) / REQUEST_FILE
    if not os.path.lexists(path):
        return None
    try:
        raw = safeio.read_json(path)
    except (OSError, ValueError) as exc:
        raise RestoreError(f"unreadable request: {exc}") from None
    finally:
        try:
            os.unlink(path)  # unlink removes a symlink itself, never what it points at
        except OSError:
            pass
    action, request_id, name = raw.get("action"), raw.get("id"), raw.get("name") or ""
    if action not in ACTIONS:
        raise RestoreError(f"unknown action {action!r}")
    if not isinstance(request_id, str) or not ID_RE.match(request_id):
        raise RestoreError("invalid request id")
    if action == "restore":
        if not isinstance(name, str) or not is_backup_name(name):
            raise RestoreError(f"invalid backup name {name!r}")
        try:
            st = os.lstat(Path(backups_dir) / name)
        except OSError:
            raise RestoreError(f"there is no backup called {name}") from None
        if not (st.st_mode & 0o170000 == 0o100000):
            raise RestoreError(f"{name} isn't a plain file")
    else:
        name = ""
    # It ends up on the updater's command lines (and Windows PowerShell passes quotes on badly): plain characters only.
    requested_by = re.sub(r"[^\w .'-]", "", _clean_text(raw.get("requested_by")))
    return {"action": action, "id": request_id, "name": name, "requested_by": requested_by.strip()}


def write_result(updates_dir: Path, request_id: str, action: str, status: str, message: str, name: str = "",
                 owner: str | None = None) -> None:
    if status not in STATUSES or action not in ACTIONS:
        raise RestoreError(f"bad result {action}/{status}")
    safeio.write_json(Path(updates_dir) / RESULT_FILE, {
        "id": request_id if ID_RE.match(request_id or "") else "",
        "action": action, "status": status, "name": name if is_backup_name(name) else "",
        "message": _clean_text(message, 2000), "at": datetime.now(UTC).isoformat(),
    }, owner)


# --- restoring ----------------------------------------------------------------------------------------------------


def unpack(archive: Path, dest: Path) -> str:
    """Unpack the files a backup holds (plain top-level files we know, nothing else) and return the version that
    made it. Refuses a backup from a newer EvE Conduit: its database has migrations this version doesn't know."""
    from conduit import __version__

    from .versions import is_downgrade

    archive, dest = Path(archive), Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    if os.name != "nt":
        os.chmod(dest, 0o700)
    found = set()

    def save(name: str, source) -> None:
        with open(dest / name, "wb") as out:
            shutil.copyfileobj(source, out, 1024 * 1024)
        found.add(name)

    try:
        if archive.name.endswith(".zip"):
            with zipfile.ZipFile(archive) as zf:
                for info in zf.infolist():
                    name = _member_name(info.filename)
                    if name and not info.is_dir() and info.file_size < MAX_MEMBER:
                        with zf.open(info) as src:
                            save(name, src)
        else:
            with tarfile.open(archive, "r:gz") as tf:
                for member in tf:
                    name = _member_name(member.name)
                    if name and member.isfile() and member.size < MAX_MEMBER:
                        src = tf.extractfile(member)
                        if src:
                            save(name, src)
    except (OSError, zipfile.BadZipFile, tarfile.TarError, EOFError) as exc:
        raise RestoreError(f"{archive.name} can't be read: {exc}") from None
    if not ({"database.dump", "database.sql"} & found):
        raise RestoreError(f"{archive.name} has no database in it")
    version = _version_of((dest / "release.txt").read_text("utf-8", "replace")) if "release.txt" in found else ""
    if version and is_downgrade(__version__, version):
        raise RestoreError(f"{archive.name} was made by EvE Conduit {version}, newer than the running {__version__}. "
                           f"Install {version} or newer first, then restore it.")
    return version


def _tool(names: tuple[str, ...], tools: str | None) -> str:
    for name in names:
        found = (shutil.which(name, path=tools) if tools else None) or shutil.which(name)
        if found:
            return found
    raise RestoreError(f"{names[0]} not found (install the database client tools)")


def _run(cmd: list[str], env: dict, what: str, stdin=None) -> None:
    proc = subprocess.run(cmd, env=env, stdin=stdin, capture_output=True, text=True, errors="replace", check=False)
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout).strip().splitlines()
        raise RestoreError(f"{what} failed: {detail[-1] if detail else f'exit code {proc.returncode}'}")


# Drops everything of ours in the public schema. Tables that only exist in this version (a plugin installed since
# the backup) must go too, or migrate would try to create them again. Runs in the same transaction as the restore.
PG_CLEAR = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT format('DROP VIEW IF EXISTS public.%I CASCADE', viewname) AS q FROM pg_views WHERE schemaname = 'public'
    UNION ALL SELECT format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE', matviewname) FROM pg_matviews WHERE schemaname = 'public'
  LOOP EXECUTE r.q; END LOOP;
  FOR r IN SELECT format('DROP TABLE IF EXISTS public.%I CASCADE', tablename) AS q FROM pg_tables WHERE schemaname = 'public'
  LOOP EXECUTE r.q; END LOOP;
  FOR r IN SELECT format('DROP SEQUENCE IF EXISTS public.%I CASCADE', sequence_name) AS q FROM information_schema.sequences WHERE sequence_schema = 'public'
  LOOP EXECUTE r.q; END LOOP;
END $$;
"""


def load_db(folder: Path, database_url: str, tools: str | None = None) -> None:
    """Replace the database with the unpacked backup's. PostgreSQL: in one transaction, so a failure changes nothing.
    MariaDB can't undo table changes, so the caller restores its own safety backup if this fails."""
    folder = Path(folder)
    url = urlparse(database_url)
    name = unquote(url.path.lstrip("/"))
    env = dict(os.environ)
    env.pop("DATABASE_URL", None)
    if url.scheme.startswith("postgres"):
        dump = folder / "database.dump"
        if not dump.is_file():
            raise RestoreError("this backup holds a MariaDB database; this install uses PostgreSQL")
        env["PGPASSWORD"] = unquote(url.password or "")
        script = folder / "database.restore.sql"
        clear = folder / "database.clear.sql"
        clear.write_text(PG_CLEAR, encoding="utf-8")
        _run([_tool(("pg_restore",), tools), "--no-owner", "--no-acl", "-f", str(script), str(dump)], env, "Reading the backup")
        _run([_tool(("psql",), tools), "-X", "-q", "-v", "ON_ERROR_STOP=1", "--single-transaction",
              "-h", url.hostname or "localhost", "-p", str(url.port or 5432), "-U", unquote(url.username or ""),
              "-d", name, "-f", str(clear), "-f", str(script)], env, "Restoring the database")
        script.unlink(missing_ok=True)
    elif url.scheme.startswith("mysql"):
        dump = folder / "database.sql"
        if not dump.is_file():
            raise RestoreError("this backup holds a PostgreSQL database; this install uses MariaDB")
        env["MYSQL_PWD"] = unquote(url.password or "")
        client = _tool(("mariadb", "mysql"), tools)
        base = [client, "-h", url.hostname or "localhost", "-P", str(url.port or 3306), "-u", unquote(url.username or "")]
        proc = subprocess.run(base + ["-N", "-B", "-e",
                                      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()", name],
                              env=env, capture_output=True, text=True, errors="replace", check=False)
        if proc.returncode != 0:
            raise RestoreError(f"Reading the database failed: {proc.stderr.strip()[-300:]}")
        tables = [t for t in proc.stdout.split() if t]
        if tables:
            drop = "SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS " + ", ".join(f"`{t.replace('`', '``')}`" for t in tables) + ";"
            _run(base + ["-e", drop, name], env, "Clearing the database")
        with open(dump, "rb") as f:
            _run(base + [name], env, "Restoring the database", stdin=f)
    else:
        raise RestoreError(f"don't know how to restore a {url.scheme} database")


# --- EVE login keys -------------------------------------------------------------------------------------------------


def derived_token_key(secret_key: str) -> str:
    """The token key used when CONDUIT_TOKEN_KEY isn't set (same as conduit.accounts.crypto)."""
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF

    derived = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"conduit-token-key").derive(secret_key.encode())
    return base64.urlsafe_b64encode(derived).decode()


def read_env(path: Path) -> dict[str, str]:
    values = {}
    for line in Path(path).read_text("utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def _keys(env: dict[str, str]) -> list[str]:
    keys = [env.get("CONDUIT_TOKEN_KEY", "")]
    keys += [k.strip() for k in env.get("CONDUIT_TOKEN_KEY_PREVIOUS", "").split(",")]
    if env.get("CONDUIT_SECRET_KEY"):
        keys.append(derived_token_key(env["CONDUIT_SECRET_KEY"]))
    return [k for k in dict.fromkeys(keys) if k]


def carry_keys(env_path: Path, backup_env_path: Path) -> int:
    """Add the keys the backup's EVE logins were encrypted with to CONDUIT_TOKEN_KEY_PREVIOUS in this install's
    conduit.env, so they decrypt. Returns how many were added."""
    env_path = Path(env_path)
    current = read_env(env_path)
    missing = [k for k in _keys(read_env(backup_env_path)) if k not in _keys(current)]
    if not missing:
        return 0
    previous = [k.strip() for k in current.get("CONDUIT_TOKEN_KEY_PREVIOUS", "").split(",") if k.strip()]
    line = "CONDUIT_TOKEN_KEY_PREVIOUS=" + ",".join(previous + missing)
    text = env_path.read_bytes().decode("utf-8-sig")  # not read_text: keep a Windows file's \r\n
    lines = text.splitlines()
    for i, old in enumerate(lines):
        if old.strip().startswith("CONDUIT_TOKEN_KEY_PREVIOUS="):
            lines[i] = line
            break
    else:
        lines += ["# Keys of a restored backup's EVE logins (added by the restore)", line]
    newline = "\r\n" if "\r\n" in text else "\n"
    st = env_path.stat()
    fd, tmp = tempfile.mkstemp(dir=env_path.parent, prefix=".conduit.env.")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            f.write(newline.join(lines) + newline)
        if os.name != "nt":
            os.chmod(tmp, st.st_mode & 0o7777)
            os.chown(tmp, st.st_uid, st.st_gid)
        os.replace(tmp, env_path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise
    return len(missing)


# --- command line -----------------------------------------------------------------------------------------------------


def _option(args: list[str], flag: str) -> tuple[str | None, list[str]]:
    if flag in args:
        i = args.index(flag)
        if i + 1 < len(args):
            return args[i + 1], args[:i] + args[i + 2:]
    return None, args


def main(argv: list[str]) -> int:
    cmd, args = (argv[0] if argv else ""), argv[1:]
    owner, args = _option(args, "--owner")
    try:
        if cmd == "index" and len(args) == 2:
            write_index(Path(args[0]), Path(args[1]), owner)
            return 0
        if cmd == "request" and len(args) == 2:
            req = take_request(Path(args[0]), Path(args[1]))
            if req is None:
                return 3
            print("\t".join([req["action"], req["id"], req["name"] or "-", req["requested_by"] or "-"]))
            return 0
        if cmd == "result":
            name, args = _option(args, "--name")
            if len(args) == 5:
                write_result(Path(args[0]), args[1], args[2], args[3], args[4], name or "", owner)
                return 0
        if cmd == "unpack" and len(args) == 2:
            print(unpack(Path(args[0]), Path(args[1])) or "unknown")
            return 0
        if cmd == "load-db" and args:
            tools, args = _option(args, "--tools")
            if len(args) == 1:
                url = os.environ.get("DATABASE_URL", "")
                if not url:
                    raise RestoreError("DATABASE_URL isn't set")
                load_db(Path(args[0]), url, tools)
                return 0
        if cmd == "carry-keys" and len(args) == 2:
            print(carry_keys(Path(args[0]), Path(args[1])))
            return 0
    except (RestoreError, OSError, ValueError) as exc:
        print(f"{exc}", file=sys.stderr)
        return 1
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
