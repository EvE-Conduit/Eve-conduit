"""Build catalog.json: every plugin in this repository, pinned to the commit being published.

    python scripts/build_catalog.py --repo EvE-Conduit/plugins --commit <sha> --serial <unix time> > catalog.json

A plugin is a top-level folder with a pyproject.toml that declares a ``conduit.plugins`` entry point. What the
catalog shows comes from that file: ``[project]`` name, version, description, authors and urls.Homepage, plus an
optional ``[tool.conduit]`` table::

    [tool.conduit]
    name = "Discord"                  # display name (default: the package name)
    icon = "message-circle"           # lucide icon name
    category = "Communication"
    min_conduit = "0.5.0"             # oldest EvE Conduit it works with
    esi_scopes = ["esi-..."]          # shown before installing
    requires = ["other_plugin_id"]
    catalog = false                   # leave it out of the catalog

Installs check the catalog's signature (catalog.json.sig, see sign_catalog.py), so only the workflow publishes it.
Needs Python 3.11+ and nothing else.
"""

import argparse
import json
import sys
import tomllib
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def entry(folder: Path, repo: str, commit: str) -> dict | None:
    project_file = folder / "pyproject.toml"
    if not project_file.is_file():
        return None
    data = tomllib.loads(project_file.read_text(encoding="utf-8"))
    project = data.get("project", {})
    eps = project.get("entry-points", {}).get("conduit.plugins", {})
    tool = data.get("tool", {}).get("conduit", {})
    if not eps or tool.get("catalog", True) is False:
        return None
    if len(eps) != 1:
        sys.exit(f"{folder.name}: one plugin per package, please (found {', '.join(eps)})")
    if (folder / "frontend").is_dir() and not list(folder.glob("*/static/**/*.js")):
        sys.exit(f"{folder.name}: has a frontend/ but no built bundle under <package>/static; build and commit it")
    package = project["name"]
    authors = project.get("authors") or [{}]
    return {
        "id": next(iter(eps)),
        "package": package,
        "name": tool.get("name", package),
        "version": project["version"],
        "description": project.get("description", ""),
        "author": tool.get("author") or authors[0].get("name", ""),
        "homepage": tool.get("homepage") or project.get("urls", {}).get("Homepage", f"https://github.com/{repo}/tree/{commit}/{folder.name}"),
        "icon": tool.get("icon", "puzzle"),
        "category": tool.get("category", ""),
        "min_conduit": tool.get("min_conduit", ""),
        "esi_scopes": list(tool.get("esi_scopes", [])),
        "requires": list(tool.get("requires", [])),
        "requirement": f"{package} @ https://github.com/{repo}/archive/{commit}.tar.gz#subdirectory={folder.name}",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--repo", required=True, help="owner/name on GitHub")
    parser.add_argument("--commit", required=True, help="full commit SHA the catalog pins every plugin to")
    parser.add_argument("--serial", required=True, type=int, help="increases with every catalog (the commit time)")
    args = parser.parse_args()
    if len(args.commit) != 40:
        sys.exit("--commit must be a full 40-character SHA")
    plugins = [e for folder in sorted(ROOT.iterdir()) if folder.is_dir() and (e := entry(folder, args.repo, args.commit))]
    json.dump({
        "format": 1,
        "serial": args.serial,
        "generated_at": datetime.now(UTC).replace(microsecond=0).isoformat(),
        "repository": args.repo,
        "commit": args.commit,
        "plugins": plugins,
    }, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
