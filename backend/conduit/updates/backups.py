"""Administration → Backups: the list of backups, "Back up now" and restoring one.

Like installing an update, the site does none of this itself. It reads the list the updater keeps in the updates
folder (the backups folder holds secrets and only the updater can read it), and leaves backup-request.json for the
updater, which checks the request again and runs ``conduit backup`` or ``conduit restore`` (see
``conduit.updates.restore``). Everything about a job lives in files, not the database: a restore replaces the
database, and the page still has to show how it went.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timedelta

from django.utils import timezone

from conduit.plugins.models import PluginInstaller

from .models import UpdateState
from .restore import INDEX_FILE, REQUEST_FILE, RESULT_FILE, is_backup_name
from .services import UpdateError, kind, progress, updates_dir

STALE_REQUEST = timedelta(minutes=10)
#: A "running" result this old belongs to an updater that died; don't let it block the page forever.
STALE_RUNNING = timedelta(hours=6)
CONFIRM_WORD = "restore"
INSTRUCTIONS = {
    "docker": "This install runs in Docker. Back up and restore from the folder with docker-compose.yml:\n"
              "docker compose exec -T db pg_dump -U conduit -Fc conduit > conduit.dump\n"
              "See \"Backups\" in docs/install-docker.md for restoring.",
    "dev": "This is a development checkout. Back up its database with your database's own tools.",
}


def can_manage() -> bool:
    return kind() in ("windows", "baremetal")


def _read(name: str) -> dict:
    try:
        data = json.loads((updates_dir() / name).read_text())
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def _when(value) -> datetime | None:
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def backups() -> tuple[list[dict], str | None]:
    """What the updater last listed, and when."""
    index = _read(INDEX_FILE)
    out = []
    for b in index.get("backups") or []:
        if isinstance(b, dict) and is_backup_name(str(b.get("name", ""))):
            out.append({
                "name": b["name"],
                "size": int(b.get("size") or 0),
                "created_at": str(b.get("created_at") or "")[:40],
                "version": str(b.get("version") or "")[:20],
                "before_restore": bool(b.get("before_restore")),
            })
    return out, (str(index["at"])[:40] if index.get("at") else None)


def job() -> dict | None:
    """The backup or restore asked for last: waiting for the updater, running, or how it ended."""
    request = _read(REQUEST_FILE)
    if request:
        asked = _when(request.get("requested_at"))
        stale = asked is not None and timezone.now() - asked > STALE_REQUEST
        return {
            "id": request.get("id", ""), "action": request.get("action", ""), "name": request.get("name", ""),
            "status": "requested", "requested_by": request.get("requested_by", ""),
            "requested_at": request.get("requested_at"),
            "message": ("The updater hasn't picked up the request yet. On Windows, check that the \"EvE Conduit "
                        "updater\" scheduled task exists (reinstall to add it); on Linux, that /etc/cron.d/conduit-update "
                        "is in place.") if stale else "",
        }
    result = _read(RESULT_FILE)
    if result.get("status") not in ("running", "succeeded", "failed"):
        return None
    status = result["status"]
    at = _when(result.get("at"))
    if status == "running" and at is not None and timezone.now() - at > STALE_RUNNING:
        status = "failed"
        result["message"] = "The updater stopped without saying how it went. See the updater log on the server."
    return {"id": result.get("id", ""), "action": result.get("action", ""), "name": result.get("name", ""),
            "status": status, "message": str(result.get("message", ""))[:2000], "at": result.get("at")}


def _busy() -> str | None:
    current = job()
    if current and current["status"] in ("requested", "running"):
        return "A backup or restore is already in progress"
    if progress():
        return "An update or plugin install is running; try again when it's done"
    state = UpdateState.objects.filter(pk=1).first()
    if state and state.install_state in (UpdateState.Install.REQUESTED, UpdateState.Install.RUNNING):
        return "An update is waiting to be installed; try again when it's done"
    installer = PluginInstaller.objects.filter(pk=1).first()
    if installer and installer.job_state in (PluginInstaller.Job.REQUESTED, PluginInstaller.Job.RUNNING):
        return "A plugin install is waiting; try again when it's done"
    return None


def _request(user, action: str, name: str = "") -> None:
    if not can_manage():
        raise UpdateError(INSTRUCTIONS.get(kind(), "This install can't make backups from the website."))
    problem = _busy()
    if problem:
        raise UpdateError(problem)
    folder = updates_dir()
    (folder / RESULT_FILE).unlink(missing_ok=True)
    tmp = folder / (REQUEST_FILE + ".tmp")
    tmp.write_text(json.dumps({
        "id": uuid.uuid4().hex, "action": action, "name": name,
        "requested_at": timezone.now().isoformat(), "requested_by": user.display_name,
    }))
    os.replace(tmp, folder / REQUEST_FILE)


def request_backup(user) -> None:
    from conduit.audit.services import record

    _request(user, "backup")
    record("backup.requested", "asked for a backup of the database", actor=user, target_type="backup")


def request_restore(user, name: str, confirm: str) -> None:
    from conduit.audit.services import record

    if (confirm or "").strip().lower() != CONFIRM_WORD:
        raise UpdateError(f'Type "{CONFIRM_WORD}" to confirm')
    if not is_backup_name(name) or name not in {b["name"] for b in backups()[0]}:
        raise UpdateError("There's no such backup; refresh the page")
    _request(user, "restore", name)
    record("backup.restore_requested", f"asked to restore the backup {name}", actor=user, target_type="backup",
           details={"backup": name})


def cancel() -> None:
    current = job()
    if not current or current["status"] != "requested":
        raise UpdateError("There's nothing waiting to cancel")
    (updates_dir() / REQUEST_FILE).unlink(missing_ok=True)


def status_out() -> dict:
    items, indexed_at = backups()
    return {
        "kind": kind(),
        "can_manage": can_manage(),
        "instructions": INSTRUCTIONS.get(kind(), ""),
        "backups": items,
        "indexed_at": indexed_at,
        "job": job(),
        "progress": progress(),
        "confirm_word": CONFIRM_WORD,
    }
