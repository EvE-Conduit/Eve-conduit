"""Administration > Logs: the audit log, the snooper log, the service log and the server's log files."""

import os
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.db.models import Q
from ninja import Router
from ninja.errors import HttpError

from conduit.paging import page
from conduit.permissions import require_perm

from .models import AuditEvent, ServiceLog, SnoopEvent

router = Router(tags=["admin"])
LEVELS = ("WARNING", "ERROR", "CRITICAL")
MAX_TAIL_LINES = 5000


def audit_out(e: AuditEvent) -> dict:
    return {
        "id": e.pk,
        "at": e.at.isoformat(),
        "action": e.action,
        "summary": e.summary,
        "actor": {"type": e.actor_type, "id": e.actor_id, "name": e.actor_name},
        "target": {"type": e.target_type, "id": e.target_id, "name": e.target_name} if e.target_type else None,
        "details": e.details,
        "ip": e.ip,
    }


def service_out(s: ServiceLog) -> dict:
    return {"id": s.pk, "at": s.at.isoformat(), "level": s.level, "logger": s.logger, "message": s.message, "traceback": s.traceback}


def filter_audit(qs, action: str = "", actor: str = "", q: str = "", since: datetime | None = None):
    if action:
        qs = qs.filter(action__startswith=action) if action.endswith(".") else qs.filter(action=action)
    if actor:
        qs = qs.filter(actor_name__icontains=actor)
    if q:
        qs = qs.filter(Q(summary__icontains=q) | Q(target_name__icontains=q))
    if since:
        qs = qs.filter(at__gte=since)
    return qs


def snoop_out(e: SnoopEvent) -> dict:
    return {
        "id": e.pk,
        "at": e.at.isoformat(),
        "viewer": {"id": e.viewer_id, "name": e.viewer_name},
        "impersonating": e.impersonating or None,
        "character": {"id": e.character_id, "name": e.character_name},
        "owner": {"id": e.owner_id, "name": e.owner_name} if e.owner_id else None,
        "section": e.section,
        "ip": e.ip,
    }


def filter_snoop(qs, viewer: str = "", target: str = "", section: str = "", since: datetime | None = None):
    if viewer:
        qs = qs.filter(viewer_name__icontains=viewer)
    if target:
        qs = qs.filter(Q(character_name__icontains=target) | Q(owner_name__icontains=target))
    if section:
        qs = qs.filter(section=section)
    if since:
        qs = qs.filter(at__gte=since)
    return qs


def filter_service(qs, level: str = "", logger: str = "", q: str = ""):
    if level:
        level = level.upper()
        if level not in LEVELS:
            raise HttpError(400, f"level must be one of {', '.join(LEVELS)}")
        qs = qs.filter(level__in=LEVELS[LEVELS.index(level):])  # this level and worse
    if logger:
        qs = qs.filter(logger__startswith=logger)
    if q:
        qs = qs.filter(Q(message__icontains=q) | Q(traceback__icontains=q))
    return qs


@router.get("/audit")
@require_perm("site.view_logs")
def audit_log(request, action: str = "", actor: str = "", q: str = "", since: datetime | None = None, limit: int = 50, offset: int = 0):
    return page(filter_audit(AuditEvent.objects.all(), action, actor, q, since), audit_out, limit, offset)


@router.get("/audit/actions", response=list[str])
@require_perm("site.view_logs")
def audit_actions(request):
    return list(AuditEvent.objects.order_by("action").values_list("action", flat=True).distinct())


@router.get("/logs/snooper")
@require_perm("site.view_logs")
def snooper_log(request, viewer: str = "", target: str = "", section: str = "", since: datetime | None = None,
                limit: int = 50, offset: int = 0):
    """Who looked at whose characters. Owners looking at their own characters aren't listed."""
    return page(filter_snoop(SnoopEvent.objects.all(), viewer, target, section, since), snoop_out, limit, offset)


@router.get("/logs/snooper/sections", response=list[str])
@require_perm("site.view_logs")
def snooper_sections(request):
    return list(SnoopEvent.objects.order_by("section").values_list("section", flat=True).distinct())


@router.get("/logs/service")
@require_perm("site.view_logs")
def service_log(request, level: str = "", logger: str = "", q: str = "", limit: int = 50, offset: int = 0):
    return page(filter_service(ServiceLog.objects.all(), level, logger, q), service_out, limit, offset)


def _log_dir() -> Path | None:
    return Path(settings.CONDUIT_LOG_DIR) if settings.CONDUIT_LOG_DIR else None


def _log_files(directory: Path) -> dict[str, os.DirEntry]:
    try:
        return {e.name: e for e in os.scandir(directory) if e.is_file(follow_symlinks=False)}
    except OSError:
        return {}


@router.get("/logs/files")
@require_perm("site.view_logs")
def log_files(request):
    directory = _log_dir()
    if directory is None:
        return {"configured": False, "directory": None, "files": []}
    files = []
    for name, entry in sorted(_log_files(directory).items()):
        st = entry.stat(follow_symlinks=False)
        files.append({"name": name, "size": st.st_size, "modified": datetime.fromtimestamp(st.st_mtime).astimezone().isoformat()})
    return {"configured": True, "directory": str(directory), "files": files}


def tail(path: Path, lines: int) -> tuple[list[str], bool]:
    """The last ``lines`` lines, reading backwards in blocks so huge logs stay cheap."""
    with open(path, "rb") as f:
        f.seek(0, os.SEEK_END)
        end = pos = f.tell()
        data = b""
        while pos > 0 and data.count(b"\n") <= lines:
            step = min(65536, pos)
            pos -= step
            f.seek(pos)
            data = f.read(step) + data
            if end - pos > 64 * 1024 * 1024:  # never hold more than 64 MB
                break
    out = data.decode("utf-8", errors="replace").splitlines()
    truncated = pos > 0 or len(out) > lines
    return out[-lines:], truncated


@router.get("/logs/files/{name}")
@require_perm("site.view_logs")
def log_file(request, name: str, lines: int = 500):
    directory = _log_dir()
    # Only names that are actually in the folder: no paths, no "..", no links out of it.
    entry = _log_files(directory).get(name) if directory else None
    if entry is None:
        raise HttpError(404, "No such log file")
    out, truncated = tail(Path(entry.path), max(1, min(lines, MAX_TAIL_LINES)))
    return {"name": name, "lines": out, "truncated": truncated}
