"""Plugins installed from Administration → Plugins on a Docker install.

The image holds EvE Conduit and the plugins in requirements-plugins.txt; those can't change without a rebuild.
Plugins an administrator installs from the website live on a volume shared by the web, worker and beat
containers (``CONDUIT_PLUGINS_DIR``, ``/srv/plugins``)::

    plugins-site.txt   the list, in pip requirement lines (the same file as /etc/conduit/plugins-site.txt on Linux)
    venv/              a virtualenv on top of the image's packages, holding exactly that list
    installed.txt      the list ``venv`` was built from
    generation         changes when ``venv`` does; the worker and beat watch it and restart
    updates/           the site's request, result and progress files and the signed catalog
    updates/catalogs/  the signed catalogs earlier requests were planned from (see :func:`trusted_lines`)

How a request goes through, without anything privileged and without rebuilding:

1. The site writes ``updates/plugins-request.json`` as on every install, then calls :func:`apply` in the web
   container: it plans the change like the Linux and Windows updaters do (``conduit.plugins.installer``), writes
   the new ``plugins-site.txt`` (keeping the old one as ``.bak``) and asks the web process to exit once the
   response is out. Docker's restart policy starts it again.
2. Every container runs ``sync`` as it starts (``docker-entrypoint.sh``). The first one to find the list changed
   builds ``venv.new`` with pip, swaps it in and writes ``installed.txt`` and ``generation``; the others wait on
   the lock, then see nothing to do. If pip fails, the old list is put back and the previous venv keeps serving.
3. The worker and beat notice the new ``generation`` and exit; their containers restart on the new venv. The
   web container runs the migrations and ``finish`` reports the result to the site.

The volume is writable by the web process, so ``sync`` doesn't take ``plugins-site.txt`` at its word: it installs
a line only when a signed catalog pins it, or when it is a git URL and the container's environment allows those.

Free of Django on purpose: it runs before the app does (``python -I -m conduit.plugins.docker_updater sync DIR``).
"""

from __future__ import annotations

import fcntl
import hashlib
import json
import logging
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
from datetime import UTC, datetime
from pathlib import Path

from . import catalog as cat
from . import installer

log = logging.getLogger(__name__)

SITE_FILE = "plugins-site.txt"
CATALOG_ARCHIVE = "catalogs"
WATCH_INTERVAL = 20  # seconds between the worker's and beat's looks at ``generation``
PIP_TIMEOUT = 900


class Paths:
    def __init__(self, root: Path | str):
        self.root = Path(root)
        self.site_file = self.root / SITE_FILE
        self.site_new = self.root / (SITE_FILE + ".new")
        self.site_bak = self.root / (SITE_FILE + ".bak")
        self.venv = self.root / "venv"
        self.venv_new = self.root / "venv.new"
        self.venv_prev = self.root / "venv.prev"
        self.installed = self.root / "installed.txt"
        self.generation = self.root / "generation"
        self.job = self.root / "job.json"
        self.lock = self.root / ".lock"
        self.log = self.root / "updater.log"
        self.serial = self.root / "catalog-serial"
        self.updates = self.root / "updates"

    @property
    def python(self) -> Path | None:
        """The venv's interpreter when there is one; the app runs with it so the plugins import."""
        exe = self.venv / "bin" / "python"
        return exe if exe.exists() else None


def _text(lines: list[str]) -> str:
    return "".join(f"{ln}\n" for ln in lines)


def _digest(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def generation(root: Path | str) -> str:
    try:
        return Paths(root).generation.read_text().strip()
    except OSError:
        return ""


def _note(p: Paths, message: str) -> None:
    try:
        with p.log.open("a", encoding="utf-8") as fh:
            fh.write(f"{datetime.now(UTC).isoformat(timespec='seconds')} {message}\n")
    except OSError:
        pass


def _progress(p: Paths, step: str | None) -> None:
    """The site shows these steps (conduit.updates.services.progress); None removes the file."""
    path = p.updates / "progress.json"
    if step is None:
        path.unlink(missing_ok=True)
        return
    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    started = ""
    try:
        started = json.loads(path.read_text()).get("started_at", "")
    except (OSError, ValueError, AttributeError):
        pass
    p.updates.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps({"kind": "plugins", "target": "", "step": step, "started_at": started or now, "at": now}))
    os.replace(tmp, path)


# --- in the web container, when an administrator clicks Install -------------------------------------------


def apply(root: Path | str, env_file: str | None = None) -> dict:
    """Plan the request the site just wrote and put the new list in place. Raises installer.RequestError (and
    leaves a failed result for the site) when the request can't be honoured. Nothing is installed yet: the
    containers do that as they restart; call :func:`restart_web` once the response is on its way."""
    p = Paths(root)
    p.updates.mkdir(parents=True, exist_ok=True)
    out = installer.prepare(p.updates, p.site_file, p.serial, env_file)
    _keep_catalog(p)
    if p.site_file.exists():
        shutil.copyfile(p.site_file, p.site_bak)
    else:
        p.site_bak.write_text("")
    os.replace(p.site_new, p.site_file)
    p.job.write_text(json.dumps({"id": out["id"], "summary": out["summary"], "at": datetime.now(UTC).isoformat()}))
    installer.write_result(p.updates, out["id"], "running", f"Installing: {out['summary']}. The containers are restarting.")
    _progress(p, "install")
    _note(p, f"request {out['id']}: {out['summary']}")
    return out


def _keep_catalog(p: Paths) -> None:
    """Keep the signed catalog this request was planned from. The site replaces ``plugin-catalog.json`` whenever
    it fetches a newer one, and a catalog lists only each plugin's latest version, so without the copy a later
    ``sync`` could no longer vouch for the pins written now. Quietly skipped when there is no valid catalog."""
    try:
        data = (p.updates / installer.CATALOG_FILE).read_bytes()
        sig = (p.updates / installer.CATALOG_SIG).read_bytes()
        serial = cat.load_verified(data, sig)["serial"]
    except (OSError, cat.CatalogError):
        return
    folder = p.updates / CATALOG_ARCHIVE
    folder.mkdir(exist_ok=True)
    (folder / f"{serial}.json").write_bytes(data)
    (folder / f"{serial}.json.sig").write_bytes(sig)


def _signed_requirements(p: Paths) -> set[str]:
    """Every requirement line a signed catalog on the volume pins: the current one and the archived ones."""
    out: set[str] = set()
    paths = [p.updates / installer.CATALOG_FILE, *sorted((p.updates / CATALOG_ARCHIVE).glob("*.json"))]
    for path in paths:
        try:
            parsed = cat.load_verified(path.read_bytes(), path.with_name(path.name + ".sig").read_bytes())
        except FileNotFoundError:
            continue
        except (OSError, cat.CatalogError) as exc:
            _note(p, f"ignoring {path.name}: {exc}")
            continue
        out.update(e["requirement"] for e in parsed["plugins"])
    return out


def _is_git_url(line: str) -> bool:
    try:
        return cat.check_url(line) == line
    except cat.CatalogError:
        return False


def trusted_lines(p: Paths) -> list[str]:
    """The lines of ``plugins-site.txt`` pip may install. The web process can write that file (and everything else
    on the volume), so a line counts only when a signed catalog pins it exactly, or when it is a git URL and this
    container's environment allows those (``CONDUIT_PLUGIN_URLS`` from docker-compose.yml, never from a file on
    the volume). Anything else is logged and left out; the rest still installs."""
    lines = installer.read_site_file(p.site_file)
    if not lines:
        return []
    pinned = _signed_requirements(p)
    allow_urls = installer.read_env_flag(None, "CONDUIT_PLUGIN_URLS")
    out = []
    for line in lines:
        if line in pinned or (allow_urls and _is_git_url(line)):
            out.append(line)
        else:
            _note(p, f"skipping {line!r}: not pinned by a signed plugin catalog"
                  + ("" if allow_urls else ", and git URLs are off (CONDUIT_PLUGIN_URLS)"))
    return out


def gunicorn_master(proc: str = "/proc") -> int | None:
    """The gunicorn master's pid when this is one of its workers (in the container it is pid 1). Stopping a
    worker alone is useless: the master just starts another one."""
    ppid = os.getppid()
    try:
        cmdline = Path(proc, str(ppid), "cmdline").read_bytes()
    except OSError:
        return None
    return ppid if b"gunicorn" in cmdline else None


def restart_web(delay: float = 1.5) -> None:
    """Stop the web server shortly (after the current response is sent); Docker starts the container again and
    ``sync`` installs the new list."""
    target = gunicorn_master() or os.getpid()

    def _exit():
        time.sleep(delay)
        try:
            os.kill(target, signal.SIGTERM)
        except OSError:
            log.exception("Could not stop the web server to install plugins")

    threading.Thread(target=_exit, name="conduit-plugins-restart", daemon=True).start()


# --- in every container, as it starts ---------------------------------------------------------------------


def _run(cmd: list[str], p: Paths) -> None:
    with p.log.open("a", encoding="utf-8") as fh:
        fh.write(f"$ {' '.join(cmd)}\n")
        fh.flush()
        subprocess.run(cmd, check=True, stdout=fh, stderr=subprocess.STDOUT, timeout=PIP_TIMEOUT, cwd=p.root)


def sync(root: Path | str, python: str = sys.executable, run=_run) -> bool:
    """Make ``venv`` match ``plugins-site.txt``. True when the venv is (now) right, False when installing failed
    and the previous plugins stay. Never raises: the app must start either way."""
    p = Paths(root)
    try:
        p.root.mkdir(parents=True, exist_ok=True)
        with p.lock.open("a+") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            return _sync_locked(p, python, run)
    except Exception as exc:  # noqa: BLE001 - a broken volume must not stop the site
        _note(p, f"plugin sync skipped: {exc!r}")
        return False


def _sync_locked(p: Paths, python: str, run) -> bool:
    lines = trusted_lines(p)
    want = _text(lines)
    try:
        have = p.installed.read_text(encoding="utf-8")
    except OSError:
        have = None
    if have == want and (p.python or not lines):
        return True
    job = _read_job(p)
    _note(p, f"installing {len(lines)} site plugin(s)" + (f" for request {job['id']}" if job else ""))
    shutil.rmtree(p.venv_new, ignore_errors=True)
    try:
        run([python, "-m", "venv", "--system-site-packages", "--without-pip", str(p.venv_new)], p)
        if lines:
            # pip gets the checked lines, not the file itself, and the constraint that keeps "conduit" local.
            with tempfile.TemporaryDirectory(prefix="conduit-plugins-") as tmp:
                requirements = Path(tmp, "plugins.txt")
                requirements.write_text(want, encoding="utf-8")
                constraints = Path(tmp, "constraints.txt")
                constraints.write_text(installer.pip_constraints(), encoding="utf-8")
                run([str(p.venv_new / "bin" / "python"), "-m", "pip", "install", "--quiet", "--no-input",
                     "--disable-pip-version-check", "-c", str(constraints), "-r", str(requirements)], p)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError) as exc:
        shutil.rmtree(p.venv_new, ignore_errors=True)
        _note(p, f"pip failed: {exc!r}; keeping the previous plugins")
        if p.site_bak.exists():
            os.replace(p.site_bak, p.site_file)
        if job:
            installer.write_result(p.updates, job["id"], "failed",
                                   "That didn't work, so the previous plugins were put back.\n" + _log_tail(p))
            _progress(p, None)
            p.job.unlink(missing_ok=True)
        return False
    shutil.rmtree(p.venv_prev, ignore_errors=True)
    if p.venv.exists():
        os.replace(p.venv, p.venv_prev)
    os.replace(p.venv_new, p.venv)
    p.installed.write_text(want, encoding="utf-8")
    tmp = p.generation.with_name("generation.tmp")
    tmp.write_text(_digest(want) + "\n")
    os.replace(tmp, p.generation)
    p.site_bak.unlink(missing_ok=True)
    if job:
        _progress(p, "migrate")
    _note(p, "installed; the containers restart on the new plugins")
    return True


def finish(root: Path | str) -> None:
    """In the web container after the migrations: tell the site the request is done."""
    p = Paths(root)
    job = _read_job(p)
    if not job:
        return
    lines = trusted_lines(p)
    try:
        have = p.installed.read_text(encoding="utf-8")
    except OSError:
        have = None
    if have != _text(lines):
        return  # another container is still installing; it (or a later start) finishes
    installer.write_result(p.updates, job["id"], "succeeded", "The site has restarted with the changes.")
    _progress(p, None)
    p.job.unlink(missing_ok=True)
    _note(p, f"request {job['id']} done")


def _read_job(p: Paths) -> dict | None:
    try:
        job = json.loads(p.job.read_text())
    except (OSError, ValueError):
        return None
    return job if isinstance(job, dict) and installer.ID_RE.match(str(job.get("id", ""))) else None


def _log_tail(p: Paths, lines: int = 25) -> str:
    try:
        return "\n".join(p.log.read_text(encoding="utf-8", errors="replace").splitlines()[-lines:])
    except OSError:
        return ""


# --- in the worker and beat: restart when the plugins change ---------------------------------------------------


def watch(root: Path | str, interval: float = WATCH_INTERVAL, stop=None) -> None:
    """Block until ``generation`` differs from what it was when this process started, then stop the process
    (SIGTERM: a warm shutdown for Celery; Docker starts the container again). ``stop`` is for tests."""
    start = generation(root)
    while True:
        time.sleep(interval)
        if generation(root) != start:
            log.info("Plugins changed; restarting to pick them up")
            if stop is not None:
                stop()
            else:
                os.kill(os.getpid(), signal.SIGTERM)
            return


def start_watcher(root: Path | str) -> threading.Thread:
    thread = threading.Thread(target=watch, args=(root,), name="conduit-plugins-watch", daemon=True)
    thread.start()
    return thread


# --- command line (docker-entrypoint.sh) ------------------------------------------------------------------------


def main(argv: list[str]) -> int:
    if len(argv) == 2 and argv[0] == "sync":
        sync(argv[1])
        return 0  # the app starts either way; a failure is reported to the site
    if len(argv) == 2 and argv[0] == "finish":
        finish(argv[1])
        return 0
    if len(argv) == 2 and argv[0] == "python":
        print(Paths(argv[1]).python or sys.executable)
        return 0
    print("usage: python -m conduit.plugins.docker_updater sync|finish|python <plugins dir>", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
