"""Finding, downloading and asking to install new EvE Conduit releases.

Nothing here installs anything. The site only downloads a release, checks its signature, and leaves a
request file for the privileged updater of the install (a Windows scheduled task or a root cron job),
which checks the signature again itself and runs the normal upgrade (backup, install, migrate, rollback
on failure). Docker and development installs update from git instead and only get the changelog.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from conduit import __version__

from . import versions
from .models import UpdateState
from .verify import VerificationError, verify_release

log = logging.getLogger(__name__)

API = "https://api.github.com"
SUMS = "SHA256SUMS"
SIG = "SHA256SUMS.sig"
REQUEST_FILE = "install-request.json"
RESULT_FILE = "install-result.json"
PROGRESS_FILE = "progress.json"
PROGRESS_STEPS = ("backup", "install", "migrate", "restart")
STALE_PROGRESS = timedelta(minutes=30)
ALLOWED_DOWNLOAD_HOSTS = {"github.com", "objects.githubusercontent.com", "release-assets.githubusercontent.com"}
CHECK_COOLDOWN_KEY = "conduit:updates:manual-check"
INSTRUCTIONS = {
    "docker": "This install runs in Docker. Update it from the folder with docker-compose.yml:\n"
              "git pull\ndocker compose up -d --build",
    "dev": "This is a development checkout. Update it with git pull, then migrate and rebuild the front end.",
}


class UpdateError(Exception):
    pass


def kind() -> str:
    return settings.CONDUIT_INSTALL_KIND


def can_install() -> bool:
    return kind() in ("windows", "baremetal")


def updates_dir() -> Path:
    path = Path(settings.CONDUIT_UPDATES_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def asset_name(version: str) -> str:
    return f"eve-conduit-{version}-windows.zip" if kind() == "windows" else f"eve-conduit-{version}.tar.gz"


def _headers() -> dict:
    return {"Accept": "application/vnd.github+json", "User-Agent": f"EvE-Conduit/{__version__} update check"}


# --- checking -------------------------------------------------------------------------------------------


def fetch_releases() -> list[dict]:
    """Published releases newer than this one, newest first."""
    url = f"{API}/repos/{settings.CONDUIT_UPDATE_REPO}/releases"
    try:
        resp = httpx.get(url, params={"per_page": 30}, headers=_headers(), timeout=20)
    except httpx.HTTPError as exc:
        raise UpdateError(f"couldn't reach GitHub ({exc.__class__.__name__})") from None
    if resp.status_code != 200:
        raise UpdateError(f"GitHub answered {resp.status_code}")
    out = []
    for r in resp.json():
        if r.get("draft") or (r.get("prerelease") and not settings.CONDUIT_UPDATE_PRERELEASES):
            continue
        version = r.get("tag_name", "")
        if not versions.parse(version) or not versions.is_newer(version, __version__):
            continue
        out.append({
            "version": versions.clean(version),
            "name": (r.get("name") or "")[:200],
            "notes": (r.get("body") or "")[:20000],
            "published_at": r.get("published_at"),
            "url": r.get("html_url", ""),
            "prerelease": bool(r.get("prerelease")),
            "assets": {a["name"]: {"url": a["browser_download_url"], "size": a.get("size", 0)} for a in r.get("assets", [])},
        })
    out.sort(key=lambda r: versions.parse(r["version"]), reverse=True)
    return out


def check(manual: bool = False) -> UpdateState:
    """Ask GitHub for newer releases; tells the admins once about each new version."""
    if manual and not cache.add(CHECK_COOLDOWN_KEY, 1, 60):
        raise UpdateError("Checked less than a minute ago; try again shortly")
    state = UpdateState.load()
    state.checked_at = timezone.now()
    try:
        state.releases = fetch_releases()
        state.check_error = ""
    except UpdateError as exc:
        state.check_error = str(exc)
        state.save(update_fields=["checked_at", "check_error"])
        raise
    newest = state.releases[0]["version"] if state.releases else ""
    if newest and newest != state.notified_version:
        from conduit.notify.services import notify_permission

        notify_permission("site.manage_site", f"EvE Conduit {newest} is available",
                          f"You're running {__version__}. See what's new and download it under Administration → Updates.",
                          link="/admin/updates", level="info", category="admin")
        state.notified_version = newest
    state.save()
    return state


def latest(state: UpdateState) -> dict | None:
    return state.releases[0] if state.releases else None


# --- downloading ----------------------------------------------------------------------------------------


def _check_url(url: str) -> None:
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.hostname not in ALLOWED_DOWNLOAD_HOSTS:
        raise UpdateError(f"refusing to download from {parts.hostname}")


def _get_small(url: str) -> bytes:
    _check_url(url)
    resp = httpx.get(url, headers=_headers(), timeout=30, follow_redirects=True)
    _check_url(str(resp.url))
    if resp.status_code != 200:
        raise UpdateError(f"download failed ({resp.status_code})")
    return resp.content


def start_download(version: str) -> UpdateState:
    if not can_install():
        raise UpdateError(INSTRUCTIONS.get(kind(), "This install can't update itself."))
    state = UpdateState.load()
    if state.download_state == UpdateState.Download.DOWNLOADING:
        raise UpdateError("A download is already running")
    if state.install_state in (UpdateState.Install.REQUESTED, UpdateState.Install.RUNNING):
        raise UpdateError("An install is in progress")
    release = next((r for r in state.releases if r["version"] == version), None)
    if release is None:
        raise UpdateError(f"{version} isn't a known newer release; check for updates first")
    name = asset_name(version)
    for needed in (name, SUMS, SIG):
        if needed not in release["assets"]:
            raise UpdateError(f"release {version} has no {needed}")
    state.download_state = UpdateState.Download.DOWNLOADING
    state.download_version = version
    state.download_file = name
    state.download_size = release["assets"][name]["size"]
    state.download_received = 0
    state.download_error = ""
    state.save()
    from .tasks import download_release

    download_release.delay(version)
    return state


def download(version: str) -> None:
    """Download the release file and its signed checksum list, and verify them. Runs as a task."""
    state = UpdateState.load()
    release = next((r for r in state.releases if r["version"] == version), None)
    folder = updates_dir()
    name = asset_name(version)
    target = folder / name
    partial = folder / (name + ".partial")
    try:
        if release is None:
            raise UpdateError("release disappeared from the list")
        sums = _get_small(release["assets"][SUMS]["url"])
        sig = _get_small(release["assets"][SIG]["url"])
        url = release["assets"][name]["url"]
        _check_url(url)
        received = 0
        last_saved = 0
        with httpx.stream("GET", url, headers=_headers(), timeout=60, follow_redirects=True) as resp:
            _check_url(str(resp.url))
            if resp.status_code != 200:
                raise UpdateError(f"download failed ({resp.status_code})")
            with open(partial, "wb") as f:
                for chunk in resp.iter_bytes(1024 * 256):
                    f.write(chunk)
                    received += len(chunk)
                    if received - last_saved >= 1024 * 1024:
                        UpdateState.objects.filter(pk=state.pk).update(download_received=received)
                        last_saved = received
        os.replace(partial, target)
        (folder / SUMS).write_bytes(sums)
        (folder / SIG).write_bytes(sig)
        verify_release(target, sums, sig)
    except (UpdateError, VerificationError, httpx.HTTPError, OSError) as exc:
        log.warning("Downloading EvE Conduit %s failed: %s", version, exc)
        for p in (partial, target):
            p.unlink(missing_ok=True)
        UpdateState.objects.filter(pk=state.pk).update(
            download_state=UpdateState.Download.FAILED, download_error=str(exc)[:300])
        return
    UpdateState.objects.filter(pk=state.pk).update(
        download_state=UpdateState.Download.READY, download_received=target.stat().st_size, download_size=target.stat().st_size)


# --- installing -----------------------------------------------------------------------------------------


def request_install(user) -> UpdateState:
    """Leave the request for the install's updater. It re-verifies the file before running anything."""
    state = UpdateState.load()
    if not can_install():
        raise UpdateError(INSTRUCTIONS.get(kind(), "This install can't update itself."))
    if state.download_state != UpdateState.Download.READY:
        raise UpdateError("Download and verify the release first")
    if state.install_state in (UpdateState.Install.REQUESTED, UpdateState.Install.RUNNING):
        raise UpdateError("An install is already in progress")
    folder = updates_dir()
    target = folder / state.download_file
    try:  # the file could have been removed or changed since it was verified
        verify_release(target, (folder / SUMS).read_bytes(), (folder / SIG).read_bytes())
    except (OSError, VerificationError) as exc:
        state.download_state = UpdateState.Download.FAILED
        state.download_error = f"The downloaded file no longer checks out: {exc}"[:300]
        state.save()
        raise UpdateError(state.download_error) from None
    (folder / RESULT_FILE).unlink(missing_ok=True)
    tmp = folder / (REQUEST_FILE + ".tmp")
    tmp.write_text(json.dumps({
        "version": state.download_version,
        "file": state.download_file,
        "requested_at": timezone.now().isoformat(),
        "requested_by": user.display_name,
    }))
    os.replace(tmp, folder / REQUEST_FILE)
    state.install_state = UpdateState.Install.REQUESTED
    state.install_version = state.download_version
    state.install_requested_at = timezone.now()
    state.install_requested_by = user
    state.install_message = ""
    state.save()
    from conduit.audit.services import record

    record("update.install_requested", f"asked to install EvE Conduit {state.download_version}", actor=user,
           target_type="update", details={"version": state.download_version, "from": __version__})
    return state


def cancel_install() -> UpdateState:
    state = UpdateState.load()
    if state.install_state != UpdateState.Install.REQUESTED:
        raise UpdateError("There's no waiting install to cancel")
    (updates_dir() / REQUEST_FILE).unlink(missing_ok=True)
    state.install_state = UpdateState.Install.NONE
    state.save(update_fields=["install_state"])
    return state


STALE_REQUEST = timedelta(minutes=10)


def sync_install_result(state: UpdateState) -> UpdateState:
    """Pick up what the updater reported (it writes install-result.json), and notice when it never ran."""
    if state.install_state not in (UpdateState.Install.REQUESTED, UpdateState.Install.RUNNING):
        return state
    folder = updates_dir()
    result = {}
    try:
        result = json.loads((folder / RESULT_FILE).read_text())
    except (OSError, ValueError):
        pass
    status = result.get("status")
    if result.get("version") == state.install_version and status in ("running", "succeeded", "failed"):
        if status == "running":
            state.install_state = UpdateState.Install.RUNNING
        elif status == "succeeded" or __version__ == state.install_version:
            _finish(state, True, result.get("message") or "")
        else:
            _finish(state, False, result.get("message") or "The upgrade failed; the previous version was put back.")
        state.save()
    elif __version__ == state.install_version:  # the result file was lost, but the new version is running
        _finish(state, True, "")
        state.save()
    elif (state.install_state == UpdateState.Install.REQUESTED and state.install_requested_at
          and timezone.now() - state.install_requested_at > STALE_REQUEST):
        state.install_message = ("The updater hasn't picked up the request yet. On Windows, check that the "
                                 "\"EvE Conduit updater\" scheduled task exists (reinstall to add it); on Linux, "
                                 "that /etc/cron.d/conduit-update is in place.")
        state.save(update_fields=["install_message"])
    return state


def _finish(state: UpdateState, ok: bool, message: str):
    from conduit.notify.services import notify

    version = state.install_version
    state.install_state = UpdateState.Install.SUCCEEDED if ok else UpdateState.Install.FAILED
    state.install_message = message[:4000]
    if ok:
        state.download_state = UpdateState.Download.NONE
        state.download_file = state.download_version = ""
        state.releases = [r for r in state.releases if versions.is_newer(r["version"], version)]
    if state.install_requested_by_id:
        notify(state.install_requested_by_id,
               f"EvE Conduit {version} is installed" if ok else f"Installing EvE Conduit {version} failed",
               message[:500] or ("Everything is up to date." if ok else "See Administration → Updates."),
               link="/admin/updates", level="success" if ok else "danger", category="admin", force=True)


def progress() -> dict | None:
    """What the updater is doing right now (it writes progress.json at each step and removes it when done):
    {kind: release|plugins, target, step, steps, started_at}. None when nothing is running."""
    try:
        path = Path(settings.CONDUIT_UPDATES_DIR) / PROGRESS_FILE
        raw = json.loads(path.read_text())
        at = datetime.fromisoformat(str(raw["at"]).replace("Z", "+00:00"))
    except (OSError, ValueError, KeyError, TypeError):
        return None
    if timezone.now() - at > STALE_PROGRESS or raw.get("kind") not in ("release", "plugins") or raw.get("step") not in PROGRESS_STEPS:
        return None
    target = str(raw.get("target", ""))
    return {"kind": raw["kind"], "target": target if versions.parse(target) else "", "step": raw["step"],
            "steps": list(PROGRESS_STEPS), "started_at": str(raw.get("started_at", ""))[:40]}


def state_out(state: UpdateState) -> dict:
    state = sync_install_result(state)
    newest = latest(state)
    return {
        "current_version": __version__,
        "kind": kind(),
        "can_install": can_install(),
        "instructions": INSTRUCTIONS.get(kind(), ""),
        "repository": f"https://github.com/{settings.CONDUIT_UPDATE_REPO}",
        "checked_at": state.checked_at.isoformat() if state.checked_at else None,
        "check_error": state.check_error,
        "latest": newest["version"] if newest else None,
        "releases": [{k: v for k, v in r.items() if k != "assets"} | {"size": (r["assets"].get(asset_name(r["version"])) or {}).get("size")}
                     for r in state.releases],
        "download": {
            "state": state.download_state,
            "version": state.download_version or None,
            "size": state.download_size,
            "received": state.download_received,
            "error": state.download_error,
        },
        "progress": progress(),
        "install": {
            "state": state.install_state,
            "version": state.install_version or None,
            "requested_at": state.install_requested_at.isoformat() if state.install_requested_at else None,
            "requested_by": state.install_requested_by.display_name if state.install_requested_by else None,
            "message": state.install_message,
        },
    }


def pending_for_bootstrap() -> dict | None:
    """An install an admin asked for that the updater hasn't started yet (it looks every two minutes)."""
    from conduit.plugins.models import PluginInstaller

    from conduit.plugins.installs import sync_result as sync_plugin_result

    if progress():
        return None
    # Read the updater's result first: right after it restarted the site, the request may already be done.
    state = UpdateState.objects.filter(pk=1, install_state=UpdateState.Install.REQUESTED).first()
    if state and sync_install_result(state).install_state == UpdateState.Install.REQUESTED:
        return {"kind": "release", "target": state.install_version,
                "requested_at": state.install_requested_at.isoformat() if state.install_requested_at else None}
    job = PluginInstaller.objects.filter(pk=1, job_state=PluginInstaller.Job.REQUESTED).first()
    if job and sync_plugin_result(job).job_state == PluginInstaller.Job.REQUESTED:
        return {"kind": "plugins", "target": "", "summary": job.job_summary,
                "requested_at": job.job_requested_at.isoformat() if job.job_requested_at else None}
    return None


def newest_for_bootstrap() -> str | None:
    """Cheap: the newest known version, for the Updates badge in the admin menu."""
    row = UpdateState.objects.filter(pk=1).values_list("releases", flat=True).first()
    return row[0]["version"] if row else None
