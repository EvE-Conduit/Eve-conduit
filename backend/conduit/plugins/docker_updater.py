"""Plugins installed from Administration → Plugins on a Docker install.

The image holds EvE Conduit and the plugins in requirements-plugins.txt; those can't change without a rebuild.
Plugins an administrator installs from the website live on a volume shared by the web, worker and beat
containers (``CONDUIT_PLUGINS_DIR``, ``/srv/plugins``)::

    plugins-site.txt   the list, in pip requirement lines (the same file as /etc/conduit/plugins-site.txt on Linux)
    venv/              a virtualenv on top of the image's packages, holding exactly that list
    installed.txt      the list ``venv`` was built from
    generation         changes when ``venv`` does; the worker and beat watch it and restart
    updates/           the site's request, result and progress files and the signed catalog

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
import threading
import time
from datetime import UTC, datetime
from pathlib import Path

from . import installer

log = logging.getLogger(__name__)

SITE_FILE = "plugins-site.txt"
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


def restart_web(delay: float = 1.5) -> None:
    """Stop the web server shortly (after the current response is sent); Docker starts the container again and
    ``sync`` installs the new list. Under gunicorn the request runs in a worker whose parent is the master."""
    target = os.getppid() if os.getppid() > 1 else os.getpid()

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
    lines = installer.read_site_file(p.site_file)
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
            run([str(p.venv_new / "bin" / "python"), "-m", "pip", "install", "--quiet", "--no-input",
                 "--disable-pip-version-check", "-r", str(p.site_file)], p)
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
    lines = installer.read_site_file(p.site_file)
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
