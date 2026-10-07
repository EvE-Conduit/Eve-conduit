"""Installing and removing plugins at an administrator's request, for the privileged updater.

The website (running as the unprivileged service account) can't change the code it runs. When an admin
installs or removes plugins under Administration → Plugins, it leaves ``plugins-request.json`` in the
updates folder, next to the signed catalog it showed them. The install's updater (root cron job on Linux,
SYSTEM scheduled task on Windows) runs this module with the install's own Python::

    python -I -m conduit.plugins.installer prepare <updates dir> <plugins-site.txt> <serial file> [--env-file F]
    python -I -m conduit.plugins.installer dists
    python -I -m conduit.plugins.installer result <updates dir> <request id> <status> <message>

``prepare`` trusts nothing in the updates folder: it checks the catalog's signature (and that it isn't older
than one already used), takes catalog plugins only as the catalog pins them, accepts other git URLs only when
the server's own config file allows them, and only removes plugins that were installed this way. It writes the
new list to ``<plugins-site.txt>.new`` and prints the plan for the updater script, one ``kind<TAB>value`` per
line: ``id``, ``summary``, ``uninstall`` (package names) and ``reinstall`` (git URLs to fetch again). The
updater then runs pip, migrates and restarts, and puts the old list back if anything fails.

Free of Django on purpose.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import UTC, datetime
from importlib.metadata import distributions
from pathlib import Path

from conduit import __version__

from . import catalog as cat

REQUEST_FILE = "plugins-request.json"
RESULT_FILE = "plugins-result.json"
CATALOG_FILE = "plugin-catalog.json"
CATALOG_SIG = "plugin-catalog.json.sig"
ID_RE = re.compile(r"^[0-9a-f]{32}$")
SITE_FILE_HEADER = (
    "# Plugins installed from Administration -> Plugins. Written by the updater; don't edit by hand.\n"
    "# Plugins you install yourself go in plugins.txt.\n"
)
MAX_ACTIONS = 50


class RequestError(Exception):
    pass


# --- what's installed -----------------------------------------------------------------------------------


def installed_dists() -> dict[str, dict]:
    """Installed packages that provide EvE Conduit plugins, by canonical name.

    ``source`` is where pip got them from (PEP 610 direct_url.json): (repository URL, subdirectory, commit).
    """
    out: dict[str, dict] = {}
    for dist in distributions():
        eps = [ep for ep in dist.entry_points if ep.group == "conduit.plugins"]
        name = dist.metadata["Name"] if dist.metadata else None
        if not eps or not name:
            continue
        repo = sub = commit = ""
        try:
            direct = json.loads(dist.read_text("direct_url.json") or "{}")
        except ValueError:
            direct = {}
        if direct.get("vcs_info"):
            repo = str(direct.get("url", "")).lower().removeprefix("git+").removesuffix(".git")
            sub = str(direct.get("subdirectory", "")).strip("/")
            commit = str(direct["vcs_info"].get("commit_id", ""))
        elif "archive_info" in direct or "dir_info" in direct:
            repo = str(direct.get("url", ""))
            sub = str(direct.get("subdirectory", "")).strip("/")
        out[cat.canonical(name)] = {
            "name": name,
            "version": dist.version,
            "entry_points": sorted(ep.name for ep in eps),
            "targets": sorted(ep.value for ep in eps),
            "repo": repo,
            "subdirectory": sub,
            "commit": commit,
        }
    return out


def read_site_file(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return []
    return [line.strip() for line in text.splitlines() if line.strip() and not line.lstrip().startswith("#")]


def line_package(line: str, dists: dict[str, dict]) -> str | None:
    """Canonical package name a plugins-site.txt line installs, if it's installed (or named in the line)."""
    m = cat.CATALOG_REQUIREMENT_RE.match(line)
    if m:
        return cat.canonical(m["name"])
    repo, sub = cat.url_parts(line)
    for name, d in dists.items():
        if repo and d["repo"] == repo and d["subdirectory"] == sub:
            return name
    return None


# --- planning a request ---------------------------------------------------------------------------------


def read_env_flag(env_file: str | None, key: str) -> bool:
    value = os.environ.get(key, "")
    if env_file:
        try:
            for line in Path(env_file).read_text(encoding="utf-8-sig").splitlines():
                k, sep, v = line.strip().partition("=")
                if sep and k.strip() == key:
                    value = v.strip().strip("\"'")
        except OSError:
            pass
    return value.lower() in ("1", "true", "yes", "on")


def load_request(updates: Path) -> dict:
    path = updates / REQUEST_FILE
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RequestError(f"unreadable request ({exc.__class__.__name__})") from None
    finally:
        path.unlink(missing_ok=True)  # one attempt per request
    if not isinstance(raw, dict) or not ID_RE.match(str(raw.get("id", ""))):
        raise RequestError("the request has no valid id")
    actions = raw.get("actions")
    if not isinstance(actions, list) or not 0 < len(actions) <= MAX_ACTIONS:
        raise RequestError("the request has no actions")
    return raw


def load_catalog(updates: Path, serial_file: Path) -> dict:
    try:
        data = (updates / CATALOG_FILE).read_bytes()
        sig = (updates / CATALOG_SIG).read_bytes()
    except OSError:
        raise RequestError("the plugin catalog is missing from the updates folder") from None
    try:
        catalog = cat.load_verified(data, sig)
    except cat.CatalogError as exc:
        raise RequestError(str(exc)) from None
    try:
        seen = int(serial_file.read_text().strip() or 0)
    except (OSError, ValueError):
        seen = 0
    if catalog["serial"] < seen:
        raise RequestError("the plugin catalog is older than one already used; refresh it and try again")
    serial_file.write_text(str(catalog["serial"]))
    return catalog


def plan(request: dict, lines: list[str], catalog: dict | None, dists: dict[str, dict], allow_urls: bool) -> dict:
    """The new plugins-site.txt lines plus what to uninstall and fetch again. RequestError if anything is off."""
    lines = list(lines)
    uninstall: list[str] = []
    reinstall: list[str] = []
    summary: list[str] = []
    listed = cat.by_package(catalog) if catalog else {}
    for action in request["actions"]:
        if not isinstance(action, dict):
            raise RequestError("bad action")
        op = action.get("op")
        if op == "install" and "package" in action:
            name = cat.canonical(str(action["package"]))
            entry = listed.get(name)
            if entry is None:
                raise RequestError(f"{action['package']} is not in the plugin catalog")
            if entry["min_conduit"] and cat.is_newer(entry["min_conduit"], __version__):
                raise RequestError(f"{entry['name']} needs EvE Conduit {entry['min_conduit']} or newer")
            lines = [ln for ln in lines if line_package(ln, dists) != name]
            lines.append(entry["requirement"])
            summary.append(f"{entry['name']} {entry['version']}")
        elif op == "install" and "url" in action:
            if not allow_urls:
                raise RequestError("installing plugins from git URLs is turned off (CONDUIT_PLUGIN_URLS)")
            try:
                url = cat.check_url(str(action["url"]))
            except cat.CatalogError as exc:
                raise RequestError(str(exc)) from None
            if url in lines:
                reinstall.append(url)
            else:
                lines.append(url)
            summary.append(url.removeprefix("git+"))
        elif op == "remove":
            package = str(action.get("package", ""))
            if not cat.PACKAGE_RE.match(package):
                raise RequestError("bad package name")
            name = cat.canonical(package)
            if name not in dists:
                raise RequestError(f"{package} is not an installed plugin")
            kept = [ln for ln in lines if line_package(ln, dists) != name]
            if len(kept) == len(lines):
                raise RequestError(f"{package} wasn't installed from Administration; remove it on the server")
            lines = kept
            uninstall.append(dists[name]["name"])
            summary.append(f"remove {dists[name]['name']}")
        else:
            raise RequestError(f"unknown action {op!r}")
    return {"lines": lines, "uninstall": uninstall, "reinstall": reinstall, "summary": ", ".join(summary)}


def prepare(updates: Path, site_file: Path, serial_file: Path, env_file: str | None) -> dict:
    request = load_request(updates)
    needs_catalog = any(isinstance(a, dict) and a.get("op") == "install" and "package" in a for a in request["actions"])
    try:
        catalog = load_catalog(updates, serial_file) if needs_catalog else None
        result = plan(request, read_site_file(site_file), catalog, installed_dists(),
                      read_env_flag(env_file, "CONDUIT_PLUGIN_URLS"))
    except RequestError as exc:  # tell the admin who asked
        write_result(updates, request["id"], "failed", str(exc))
        raise
    new = site_file.with_name(site_file.name + ".new")
    new.write_text(SITE_FILE_HEADER + "".join(f"{ln}\n" for ln in result["lines"]), encoding="utf-8")
    return {"id": request["id"], **result}


def write_result(updates: Path, request_id: str, status: str, message: str) -> None:
    path = updates / RESULT_FILE
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps({"id": request_id, "status": status, "message": message[:4000],
                               "at": datetime.now(UTC).isoformat()}))
    os.replace(tmp, path)


def main(argv: list[str]) -> int:
    cmd = argv[0] if argv else ""
    if cmd == "prepare" and len(argv) in (4, 6):
        env_file = argv[5] if len(argv) == 6 and argv[4] == "--env-file" else None
        try:
            out = prepare(Path(argv[1]), Path(argv[2]), Path(argv[3]), env_file)
        except RequestError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        print(f"id\t{out['id']}")
        print(f"summary\t{out['summary']}")
        for name in out["uninstall"]:
            print(f"uninstall\t{name}")
        for url in out["reinstall"]:
            print(f"reinstall\t{url}")
        return 0
    if cmd == "dists" and len(argv) == 1:
        for d in installed_dists().values():
            print(d["name"])
        return 0
    if cmd == "result" and len(argv) == 5 and ID_RE.match(argv[2]) and argv[3] in ("running", "succeeded", "failed"):
        write_result(Path(argv[1]), argv[2], argv[3], argv[4])
        return 0
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
