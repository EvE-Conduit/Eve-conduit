"""Reading and writing files in folders the service account owns, from a privileged process.

The updater runs as root (Linux) or SYSTEM (Windows) and talks to the website through files in the updates folder
and the log folder, both owned by the unprivileged service account. A compromised website could plant a symlink
there (``install-result.json -> /etc/shadow``) and have root write, chown or chmod whatever it points at. So
nothing here ever follows a symlink:

* the folder is opened with ``O_DIRECTORY | O_NOFOLLOW`` and every file is opened relative to it;
* files are written to a randomly named temporary file created with ``O_EXCL | O_NOFOLLOW`` and then renamed
  over the destination (``rename`` replaces a symlink instead of following it);
* appends open with ``O_NOFOLLOW`` and check the opened file is a regular file;
* reads open with ``O_NOFOLLOW`` and accept only a regular file with a single link.

Free of Django on purpose: the updater runs it with the install's own Python::

    python -I -m conduit.updates.safeio write-json <path> [--owner USER] [--stamp] KEY=VALUE...
    python -I -m conduit.updates.safeio append <path> [--owner USER] [LINE]      (no LINE: copies stdin)
    python -I -m conduit.updates.safeio read-json <path>
    python -I -m conduit.updates.safeio copy-regular <src> <dst>

Windows has none of these flags (and its updater folder is protected by ACLs instead), so there the functions
fall back to a plain temporary file and ``os.replace``.
"""

from __future__ import annotations

import json
import os
import secrets
import stat
import sys
from datetime import UTC, datetime
from pathlib import Path

MAX_READ = 1024 * 1024  # a request or catalog is a few kilobytes; anything bigger isn't ours
POSIX = os.name != "nt"
O_NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)
O_CLOEXEC = getattr(os, "O_CLOEXEC", 0)
O_NONBLOCK = getattr(os, "O_NONBLOCK", 0)  # a planted FIFO must not hang the updater
O_DIRECTORY = getattr(os, "O_DIRECTORY", 0)


class UnsafePath(OSError):
    """The path is not a plain file in a plain folder (a symlink, FIFO, hard link ...), or the owner is unknown."""


def _owner_ids(owner: str | None) -> tuple[int, int] | None:
    if not owner or not POSIX:
        return None
    import pwd

    try:
        entry = pwd.getpwnam(owner)
    except KeyError:
        raise UnsafePath(f"no such user: {owner}") from None
    return entry.pw_uid, entry.pw_gid


def _chown(fd: int, ids: tuple[int, int] | None) -> None:
    if ids is None:
        return
    try:
        os.fchown(fd, *ids)
    except PermissionError:
        pass  # not root (tests, the web process): the file stays ours, as before


class _Dir:
    """The destination folder, opened once without following a symlink; files are opened relative to it."""

    def __init__(self, path: Path):
        self.path = path
        self.fd = os.open(str(path), os.O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC) if POSIX else None

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        if self.fd is not None:
            os.close(self.fd)

    def open(self, name: str, flags: int, mode: int = 0o644) -> int:
        if self.fd is None:
            return os.open(str(self.path / name), flags, mode)
        return os.open(name, flags | O_NOFOLLOW | O_CLOEXEC, mode, dir_fd=self.fd)

    def replace(self, src: str, dst: str) -> None:
        if self.fd is None:
            os.replace(str(self.path / src), str(self.path / dst))
        else:
            os.replace(src, dst, src_dir_fd=self.fd, dst_dir_fd=self.fd)

    def unlink(self, name: str) -> None:
        try:
            if self.fd is None:
                os.unlink(str(self.path / name))
            else:
                os.unlink(name, dir_fd=self.fd)
        except OSError:
            pass


def _regular(fd: int, what: str, single_link: bool = False) -> os.stat_result:
    st = os.fstat(fd)
    if not stat.S_ISREG(st.st_mode):
        raise UnsafePath(f"{what} is not a regular file")
    if single_link and POSIX and st.st_nlink != 1:
        raise UnsafePath(f"{what} has more than one link")
    return st


# --- writing ----------------------------------------------------------------------------------------------


def write_bytes(path: Path | str, data: bytes, owner: str | None = None, mode: int = 0o644) -> None:
    """Replace ``path`` with ``data`` without ever following a symlink at ``path`` or its folder."""
    path = Path(path)
    ids = _owner_ids(owner)
    with _Dir(path.parent) as d:
        tmp = f".{path.name}.{secrets.token_hex(8)}.tmp"
        fd = d.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
        try:
            if hasattr(os, "fchmod"):  # not on Windows
                os.fchmod(fd, mode)
            _chown(fd, ids)
            with os.fdopen(fd, "wb") as fh:
                fd = -1
                fh.write(data)
                fh.flush()
                os.fsync(fh.fileno())
            d.replace(tmp, path.name)
        except BaseException:
            if fd >= 0:
                os.close(fd)
            d.unlink(tmp)
            raise


def write_json(path: Path | str, data: dict, owner: str | None = None) -> None:
    write_bytes(path, json.dumps(data).encode("utf-8"), owner)


def append(path: Path | str, data: bytes, owner: str | None = None) -> None:
    """Append to a log file, creating it if needed; refuses a symlink or anything but a regular file."""
    path = Path(path)
    ids = _owner_ids(owner)
    with _Dir(path.parent) as d:
        flags = os.O_WRONLY | os.O_APPEND | O_NONBLOCK
        try:
            fd = d.open(path.name, flags)
        except FileNotFoundError:
            fd = d.open(path.name, flags | os.O_CREAT | os.O_EXCL, 0o644)
            _chown(fd, ids)
        with os.fdopen(fd, "ab") as fh:
            # Singly linked too: a hard link to someone else's file would otherwise collect our log lines.
            _regular(fh.fileno(), str(path), single_link=True)
            fh.write(data)


# --- reading ----------------------------------------------------------------------------------------------


def read_bytes(path: Path | str, limit: int = MAX_READ) -> bytes:
    """The content of a regular, singly linked file; UnsafePath for a symlink, FIFO, hard link or huge file."""
    path = Path(path)
    with _Dir(path.parent) as d:
        fd = d.open(path.name, os.O_RDONLY | O_NONBLOCK)
        with os.fdopen(fd, "rb") as fh:
            st = _regular(fh.fileno(), str(path), single_link=True)
            if st.st_size > limit:
                raise UnsafePath(f"{path} is too large")
            return fh.read(limit + 1)


def read_json(path: Path | str) -> dict:
    data = json.loads(read_bytes(path).decode("utf-8"))
    if not isinstance(data, dict):
        raise UnsafePath(f"{path} does not hold a JSON object")
    return data


def copy_regular(src: Path | str, dst: Path | str, limit: int = 2 * 1024 * 1024 * 1024) -> None:
    """Copy a regular file (never a symlink) somewhere safe, e.g. a release out of the updates folder."""
    src, dst = Path(src), Path(dst)
    with _Dir(src.parent) as d:
        fd = d.open(src.name, os.O_RDONLY | O_NONBLOCK)
        with os.fdopen(fd, "rb") as fh:
            st = _regular(fh.fileno(), str(src), single_link=True)
            if st.st_size > limit:
                raise UnsafePath(f"{src} is too large")
            with _Dir(dst.parent) as out:
                tmp = f".{dst.name}.{secrets.token_hex(8)}.tmp"
                ofd = out.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
                try:
                    with os.fdopen(ofd, "wb") as oh:
                        ofd = -1
                        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
                            oh.write(chunk)
                        oh.flush()
                        os.fsync(oh.fileno())
                    out.replace(tmp, dst.name)
                except BaseException:
                    if ofd >= 0:
                        os.close(ofd)
                    out.unlink(tmp)
                    raise


# --- command line (deploy/baremetal/conduit) ---------------------------------------------------------------


def _options(args: list[str]) -> tuple[dict, list[str]]:
    opts: dict = {"owner": None, "stamp": False}
    rest: list[str] = []
    i = 0
    while i < len(args):
        if args[i] == "--owner" and i + 1 < len(args):
            opts["owner"] = args[i + 1]
            i += 2
        elif args[i] == "--stamp":
            opts["stamp"] = True
            i += 1
        else:
            rest.append(args[i])
            i += 1
    return opts, rest


def main(argv: list[str]) -> int:
    cmd = argv[0] if argv else ""
    opts, args = _options(argv[1:])
    try:
        if cmd == "write-json" and args:
            if len(args) == 1:
                data = json.loads(sys.stdin.read())
                if not isinstance(data, dict):
                    raise UnsafePath("stdin does not hold a JSON object")
            else:
                data = {}
                for field in args[1:]:
                    key, sep, value = field.partition("=")
                    if not sep or not key.replace("_", "").isalnum():
                        print(f"safeio: expected KEY=VALUE, got {field!r}", file=sys.stderr)
                        return 2
                    data[key] = value
            if opts["stamp"]:
                data["at"] = datetime.now(UTC).isoformat()
            write_json(args[0], data, opts["owner"])
            return 0
        if cmd == "append" and len(args) in (1, 2):
            data = (args[1] + "\n").encode("utf-8") if len(args) == 2 else sys.stdin.buffer.read()
            append(args[0], data, opts["owner"])
            return 0
        if cmd == "read-json" and len(args) == 1:
            print(json.dumps(read_json(args[0])))
            return 0
        if cmd == "copy-regular" and len(args) == 2:
            copy_regular(args[0], args[1])
            return 0
    except (OSError, ValueError) as exc:  # UnsafePath is an OSError
        print(f"safeio: {cmd} failed: {exc}", file=sys.stderr)
        return 1
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
