"""Installing plugins from Administration → Plugins: the catalog, install requests and automatic updates.

Like EvE Conduit updates, the site never changes its own code. It fetches and verifies the signed catalog,
leaves a request for the install's privileged updater (see ``conduit.plugins.installer``), and picks up the
result. Docker and development installs can't do that; they get the lines to add to requirements-plugins.txt.
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from conduit import __version__
from conduit.updates.services import INSTRUCTIONS, can_install, kind, updates_dir

from . import catalog as cat
from . import registry
from .installer import CATALOG_FILE, CATALOG_SIG, REQUEST_FILE, RESULT_FILE, installed_dists, line_package, read_site_file
from .models import PluginInstaller

log = logging.getLogger(__name__)

CHECK_COOLDOWN_KEY = "conduit:plugins:catalog-check"
STALE_REQUEST = timedelta(minutes=10)
BUSY = (PluginInstaller.Job.REQUESTED, PluginInstaller.Job.RUNNING)
PLUGIN_INSTRUCTIONS = {
    "docker": "Add these lines to requirements-plugins.txt, then run: docker compose up -d --build",
    "dev": "Install them into your virtualenv: pip install <line>, then restart the server.",
}


class InstallError(Exception):
    pass


# --- the catalog ----------------------------------------------------------------------------------------


def _get(url: str) -> bytes:
    if urlsplit(url).scheme != "https":
        raise InstallError("the plugin catalog must be fetched over HTTPS")
    try:
        resp = httpx.get(url, headers={"User-Agent": f"EvE-Conduit/{__version__} plugin catalog"}, timeout=20,
                         follow_redirects=True)
    except httpx.HTTPError as exc:
        raise InstallError(f"couldn't reach the plugin catalog ({exc.__class__.__name__})") from None
    if urlsplit(str(resp.url)).scheme != "https":
        raise InstallError("the plugin catalog redirected away from HTTPS")
    if resp.status_code != 200:
        raise InstallError(f"the plugin catalog answered {resp.status_code}")
    if len(resp.content) > 2 * 1024 * 1024:
        raise InstallError("the plugin catalog is too large")
    return resp.content


def _save(name: str, data: bytes) -> None:
    folder = updates_dir()
    tmp = folder / (name + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, folder / name)


def refresh_catalog(manual: bool = False) -> PluginInstaller:
    """Fetch and verify the catalog; keeps the copy the updater checks again in the updates folder."""
    if manual and not cache.add(CHECK_COOLDOWN_KEY, 1, 30):
        raise InstallError("Checked moments ago; try again shortly")
    state = PluginInstaller.load()
    state.catalog_checked_at = timezone.now()
    try:
        data = _get(settings.CONDUIT_PLUGIN_CATALOG_URL)
        sig = _get(settings.CONDUIT_PLUGIN_CATALOG_URL + ".sig")
        parsed = cat.load_verified(data, sig)
        if parsed["serial"] < (state.catalog or {}).get("serial", 0):
            raise InstallError("the plugin catalog went back to an older version; keeping the newer one")
    except (InstallError, cat.CatalogError) as exc:
        state.catalog_error = str(exc)[:300]
        state.save(update_fields=["catalog_checked_at", "catalog_error"])
        raise InstallError(state.catalog_error) from None
    if can_install():
        _save(CATALOG_FILE, data)
        _save(CATALOG_SIG, sig)
    state.catalog = parsed
    state.catalog_error = ""
    state.save()
    return state


def catalog_entries(state: PluginInstaller) -> dict[str, dict]:
    return cat.by_package(state.catalog) if state.catalog.get("plugins") else {}


# --- what's installed and where it came from ------------------------------------------------------------


def site_lines() -> list[str]:
    path = settings.CONDUIT_PLUGIN_SITE_FILE
    return read_site_file(Path(path)) if path else []


def packages() -> dict[str, dict]:
    """Installed plugin packages with where they came from: catalog, git (an admin's URL) or server."""
    dists = installed_dists()
    managed = {line_package(line, dists): line for line in site_lines()}
    for name, d in dists.items():
        line = managed.get(name)
        d["source"] = "server" if line is None else ("catalog" if cat.CATALOG_REQUIREMENT_RE.match(line) else "git")
        d["line"] = line
    return dists


def package_of(plugin_source: str, dists: dict[str, dict]) -> str | None:
    """The package providing a discovered plugin (its entry point target)."""
    return next((name for name, d in dists.items() if plugin_source in d["targets"]), None)


# --- requests to the updater ----------------------------------------------------------------------------


def _clean_actions(actions: list[dict], state: PluginInstaller) -> tuple[list[dict], list[str], list[str]]:
    """Check what an admin asked for before bothering the updater. Returns (actions, summary, plugin ids)."""
    entries = catalog_entries(state)
    dists = packages()
    out, summary, plugin_ids = [], [], []
    for a in actions:
        if a.get("op") == "install" and a.get("package"):
            entry = entries.get(cat.canonical(a["package"]))
            if entry is None:
                raise InstallError(f"{a['package']} isn't in the plugin catalog; refresh it and try again")
            if entry["min_conduit"] and cat.is_newer(entry["min_conduit"], __version__):
                raise InstallError(f"{entry['name']} needs EvE Conduit {entry['min_conduit']} or newer")
            current = dists.get(cat.canonical(entry["package"]))
            if current and current["source"] == "server":
                raise InstallError(f"{entry['name']} was installed on the server; update it there")
            if current and current["version"] == entry["version"]:
                raise InstallError(f"{entry['name']} {entry['version']} is already installed")
            out.append({"op": "install", "package": entry["package"]})
            summary.append(f"{entry['name']} {entry['version']}")
            plugin_ids.append(entry["id"])
        elif a.get("op") == "install" and a.get("url"):
            if not settings.CONDUIT_PLUGIN_URLS:
                raise InstallError("Installing plugins from git URLs is turned off. The server owner can allow it "
                                   "with CONDUIT_PLUGIN_URLS=true in the config file.")
            try:
                url = cat.check_url(a["url"])
            except cat.CatalogError as exc:
                raise InstallError(str(exc)) from None
            out.append({"op": "install", "url": url})
            summary.append(url.removeprefix("git+"))
        elif a.get("op") == "remove" and a.get("package"):
            current = dists.get(cat.canonical(a["package"]))
            if current is None:
                raise InstallError(f"{a['package']} isn't installed")
            if current["source"] == "server":
                raise InstallError(f"{current['name']} was installed on the server; remove it there")
            out.append({"op": "remove", "package": current["name"]})
            summary.append(f"remove {current['name']}")
        else:
            raise InstallError("unknown action")
    if not out:
        raise InstallError("Nothing to do")
    return out, summary, plugin_ids


def _switch_off(packages_to_remove: list[str]) -> None:
    """Plugins about to be removed are switched off first (their dependents must be off already)."""
    from .services import PluginError, enabled_ids, set_enabled

    dists = installed_dists()
    on = enabled_ids()
    for mid, entry in registry.discover().items():
        name = package_of(entry.source, dists)
        if name in packages_to_remove and mid in on:
            try:
                set_enabled(mid, False)
            except PluginError as exc:
                raise InstallError(str(exc)) from None


@transaction.atomic
def request(user, actions: list[dict], *, enable: bool = False, automatic: bool = False) -> PluginInstaller:
    """Ask the updater to install or remove plugins. ``enable`` switches new catalog plugins on afterwards."""
    if not can_install():
        raise InstallError(INSTRUCTIONS.get(kind(), "This install can't install plugins by itself."))
    state = PluginInstaller.objects.select_for_update().get(pk=PluginInstaller.load().pk)
    if state.job_state in BUSY:
        raise InstallError("The updater is already working on plugins; wait for it to finish")
    actions, summary, plugin_ids = _clean_actions(actions, state)
    if any(a["op"] == "install" and "package" in a for a in actions) and not (updates_dir() / CATALOG_SIG).exists():
        raise InstallError("Refresh the plugin catalog first")
    _switch_off([cat.canonical(a["package"]) for a in actions if a["op"] == "remove"])
    folder = updates_dir()
    (folder / RESULT_FILE).unlink(missing_ok=True)
    job_id = uuid.uuid4().hex
    tmp = folder / (REQUEST_FILE + ".tmp")
    tmp.write_text(json.dumps({"id": job_id, "actions": actions,
                               "requested_by": user.display_name if user else "automatic update",
                               "requested_at": timezone.now().isoformat()}))
    os.replace(tmp, folder / REQUEST_FILE)
    state.job_id = job_id
    state.job_state = PluginInstaller.Job.REQUESTED
    state.job_actions = [*actions, *({"op": "enable", "plugin": pid} for pid in (plugin_ids if enable else []))]
    state.job_summary = ", ".join(summary)[:500]
    state.job_automatic = automatic
    state.job_requested_at = timezone.now()
    state.job_requested_by = user
    state.job_message = ""
    state.save()
    from conduit.audit.services import record

    record("plugin.install_requested", f"asked the updater for: {state.job_summary}", actor=user,
           target_type="plugin", details={"actions": actions, "automatic": automatic})
    return state


def cancel(state: PluginInstaller | None = None) -> PluginInstaller:
    state = state or PluginInstaller.load()
    if state.job_state != PluginInstaller.Job.REQUESTED:
        raise InstallError("There's no waiting plugin install to cancel")
    (updates_dir() / REQUEST_FILE).unlink(missing_ok=True)
    state.job_state = PluginInstaller.Job.NONE
    state.save(update_fields=["job_state"])
    return state


def sync_result(state: PluginInstaller) -> PluginInstaller:
    """Pick up what the updater reported, and notice when it never ran."""
    if state.job_state not in BUSY:
        return state
    try:
        result = json.loads((updates_dir() / RESULT_FILE).read_text())
    except (OSError, ValueError):
        result = {}
    status = result.get("status")
    if result.get("id") == state.job_id and status in ("running", "succeeded", "failed"):
        if status == "running":
            state.job_state = PluginInstaller.Job.RUNNING
            state.save(update_fields=["job_state"])
        else:
            _finish(state, status == "succeeded", str(result.get("message") or ""))
    elif (state.job_state == PluginInstaller.Job.REQUESTED and state.job_requested_at
          and timezone.now() - state.job_requested_at > STALE_REQUEST
          and not state.job_message):
        state.job_message = ("The updater hasn't picked up the request yet. On Windows, check that the "
                             "\"EvE Conduit updater\" scheduled task exists (reinstall to add it); on Linux, "
                             "that /etc/cron.d/conduit-update is in place.")
        state.save(update_fields=["job_message"])
    return state


def _finish(state: PluginInstaller, ok: bool, message: str) -> None:
    from conduit.notify.services import notify, notify_permission

    from .services import PluginError, set_enabled, sync_installed

    state.job_state = PluginInstaller.Job.SUCCEEDED if ok else PluginInstaller.Job.FAILED
    state.job_message = message[:4000]
    if ok:
        sync_installed()
        for a in state.job_actions:
            if a.get("op") == "enable":
                try:
                    set_enabled(a["plugin"], True)
                except PluginError as exc:
                    state.job_message += f"\n{a['plugin']} couldn't be switched on: {exc}"
    state.save()
    title = f"Plugins {'installed' if ok else 'not installed'}: {state.job_summary}"[:200]
    body = (message[:500] or "Everything is in place.") if ok else (message[:500] or "See Administration → Plugins.")
    kwargs = {"link": "/admin/plugins", "level": "success" if ok else "danger", "category": "admin"}
    if state.job_requested_by_id:
        notify(state.job_requested_by_id, title, body, force=True, **kwargs)
    else:
        notify_permission("site.manage_plugins", title, body, **kwargs)


# --- automatic updates ----------------------------------------------------------------------------------


def available_updates(state: PluginInstaller, dists: dict[str, dict] | None = None) -> dict[str, dict]:
    """Catalog plugins installed from Administration that have a newer version in the catalog."""
    dists = packages() if dists is None else dists
    out = {}
    for name, entry in catalog_entries(state).items():
        d = dists.get(name)
        if d and d["source"] == "catalog" and cat.is_newer(entry["version"], d["version"]):
            if not entry["min_conduit"] or not cat.is_newer(entry["min_conduit"], __version__):
                out[name] = entry
    return out


def set_auto_update(package: str, on: bool) -> PluginInstaller:
    state = PluginInstaller.load()
    name = cat.canonical(package)
    current = set(state.auto_update)
    current.add(name) if on else current.discard(name)
    state.auto_update = sorted(current)
    state.save(update_fields=["auto_update"])
    return state


def check_for_updates() -> str:
    """Daily: refresh the catalog, install updates for plugins set to update themselves, tell admins about the rest."""
    state = refresh_catalog()
    updates = available_updates(state)
    auto = [e for name, e in updates.items() if name in state.auto_update]
    started = ""
    if auto and can_install() and state.job_state not in BUSY:
        try:
            request(None, [{"op": "install", "package": e["package"]} for e in auto], automatic=True)
            started = ", ".join(e["name"] for e in auto)
        except InstallError as exc:
            log.warning("Automatic plugin update failed to start: %s", exc)
    state = PluginInstaller.load()
    fresh = [e for name, e in updates.items() if state.notified.get(name) != e["version"] and e not in auto]
    if fresh:
        from conduit.notify.services import notify_permission

        names = ", ".join(f"{e['name']} {e['version']}" for e in fresh)
        notify_permission("site.manage_plugins", "Plugin updates are available", names,
                          link="/admin/plugins", level="info", category="admin")
        state.notified = {**state.notified, **{cat.canonical(e["package"]): e["version"] for e in fresh}}
        state.save(update_fields=["notified"])
    return f"auto-updating {started}" if started else f"{len(updates)} update(s) available"


# --- for the admin page ---------------------------------------------------------------------------------


def overview() -> dict:
    state = sync_result(PluginInstaller.load())
    dists = packages()
    updates = available_updates(state, dists)
    catalog = []
    for name, e in catalog_entries(state).items():
        d = dists.get(name)
        catalog.append({
            **{k: e[k] for k in ("id", "package", "name", "version", "description", "author", "homepage", "icon",
                                 "category", "esi_scopes", "requires", "min_conduit")},
            "requirement": e["requirement"],
            "installed_version": d["version"] if d else None,
            "installed_from": d["source"] if d else None,
            "update_available": name in updates,
            "compatible": not e["min_conduit"] or not cat.is_newer(e["min_conduit"], __version__),
            "auto_update": name in state.auto_update,
        })
    catalog.sort(key=lambda e: e["name"].lower())
    return {
        "kind": kind(),
        "can_install": can_install(),
        "instructions": PLUGIN_INSTRUCTIONS.get(kind(), ""),
        "allow_urls": bool(settings.CONDUIT_PLUGIN_URLS),
        "catalog": catalog,
        "catalog_checked_at": state.catalog_checked_at.isoformat() if state.catalog_checked_at else None,
        "catalog_error": state.catalog_error,
        "packages": [
            {"package": d["name"], "version": d["version"], "source": d["source"], "plugins": d["entry_points"],
             "url": d["line"].removeprefix("git+") if d["source"] == "git" else "",
             "update": updates[name]["version"] if name in updates else None,
             "auto_update": name in state.auto_update}
            for name, d in sorted(dists.items())
        ],
        "job": {
            "state": state.job_state,
            "summary": state.job_summary,
            "automatic": state.job_automatic,
            "requested_at": state.job_requested_at.isoformat() if state.job_requested_at else None,
            "requested_by": state.job_requested_by.display_name if state.job_requested_by else None,
            "message": state.job_message,
        },
    }
