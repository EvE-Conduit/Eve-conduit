"""Starts EvE Conduit's processes on native Windows.

Windows can't run gunicorn (it needs fork) and Celery's default "prefork" pool,
so this launcher uses waitress for the web server and Celery's thread pool for
the worker. Everything else is the unchanged EvE Conduit backend.

    python evecsm_service.py web            # HTTP on EVECSM_BIND (default 127.0.0.1:8000)
    python evecsm_service.py worker         # Celery worker, thread pool
    python evecsm_service.py beat           # Celery beat scheduler
    python evecsm_service.py manage <args>  # any Django management command

Settings come from <EVECSM_ROOT>\\config\\evecsm.env. EVECSM_ROOT defaults to the
install root (three folders up from this file: <root>\\app\\windows\\service).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


def install_root() -> Path:
    if os.environ.get("EVECSM_ROOT"):
        return Path(os.environ["EVECSM_ROOT"])
    # Don't resolve links: <root>\app is a junction to releases\<version>, and we want <root>.
    return Path(os.path.abspath(__file__)).parents[3]


def read_env_file(path: Path) -> dict[str, str]:
    """KEY=VALUE lines; blank lines and # comments ignored; optional surrounding quotes removed."""
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def load_settings(root: Path) -> None:
    env_file = root / "config" / "evecsm.env"
    if not env_file.exists():
        sys.exit(f"Configuration not found: {env_file}")
    for key, value in read_env_file(env_file).items():
        os.environ.setdefault(key, value)  # real environment variables win
    os.environ.setdefault("EVECSM_STATIC_ROOT", str(root / "data" / "static"))
    os.environ.setdefault("EVECSM_LOG_DIR", str(root / "logs"))  # shown under Administration > Logs
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "evecsm.settings")


def run_web() -> None:
    from waitress import serve

    from evecsm.wsgi import application

    serve(
        application,
        listen=os.environ.get("EVECSM_BIND", "127.0.0.1:8000"),
        threads=int(os.environ.get("WEB_THREADS", "8")),
        # Caddy on the same machine terminates HTTPS and sets these headers.
        trusted_proxy="127.0.0.1",
        trusted_proxy_count=1,
        trusted_proxy_headers={"x-forwarded-for", "x-forwarded-proto", "x-forwarded-host"},
        clear_untrusted_proxy_headers=True,
        ident="EvE Conduit",
    )


def run_celery(root: Path, kind: str) -> None:
    from evecsm.celery import app

    if kind == "worker":
        argv = [
            "worker",
            "--pool=threads",  # prefork doesn't work on Windows
            f"--concurrency={os.environ.get('WORKER_CONCURRENCY', '4')}",
            "--loglevel=INFO",
            "--hostname=evecsm@%h",
        ]
    else:
        schedule = root / "data" / "celerybeat-schedule"
        argv = ["beat", "--loglevel=INFO", f"--schedule={schedule}"]
    app.start(argv=argv)


def run_manage(args: list[str]) -> None:
    from django.core.management import execute_from_command_line

    execute_from_command_line(["manage.py", *args])


def main(argv: list[str]) -> None:
    if not argv or argv[0] not in {"web", "worker", "beat", "manage"}:
        sys.exit(__doc__)
    root = install_root()
    load_settings(root)
    command, rest = argv[0], argv[1:]
    if command == "web":
        run_web()
    elif command in ("worker", "beat"):
        run_celery(root, command)
    else:
        run_manage(rest)


if __name__ == "__main__":
    main(sys.argv[1:])
