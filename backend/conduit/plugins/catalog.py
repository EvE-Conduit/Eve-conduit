"""The official plugin catalog, and which plugin sources an install will accept.

The catalog is ``catalog.json``, built from the plugins repository (github.com/EvE-Conduit/plugins) by the main
repository's "Plugin catalog" workflow and published on its release tagged ``plugin-catalog`` together with
``catalog.json.sig``, an Ed25519 signature by the key that signs EvE Conduit releases. Every entry pins its package to a commit::

    conduit-discord @ https://github.com/EvE-Conduit/plugins/archive/<40-hex commit>.tar.gz#subdirectory=conduit-discord

(an archive of the commit rather than a git URL, so servers don't need git installed).

Free of Django on purpose: the privileged updater imports this to check what the website asked for.
"""

from __future__ import annotations

import json
import re

from packaging.version import InvalidVersion, Version

from conduit.updates.verify import VerificationError, check_signature

from .base import MODULE_ID_RE

FORMAT = 1
PACKAGE_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$")
VERSION_RE = re.compile(r"^[0-9][0-9A-Za-z.+-]{0,39}$")
CATALOG_REQUIREMENT_RE = re.compile(
    r"^(?P<name>[A-Za-z0-9][A-Za-z0-9._-]*) @ https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+"
    r"/archive/[0-9a-f]{40}\.tar\.gz#subdirectory=[A-Za-z0-9_.-]+$"
)
# A plugin from any git repository over HTTPS (only when the server owner allows it). Nothing that pip
# could read as an option, no credentials in the URL, no spaces.
URL_RE = re.compile(
    r"^git\+https://(?P<host>[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?::\d{1,5})?)/(?P<path>[A-Za-z0-9._~/-]+?)"
    r"(?:@(?P<ref>[A-Za-z0-9._/-]+))?(?:#subdirectory=(?P<sub>[A-Za-z0-9._/-]+))?$"
)
TEXT_LIMITS = {"name": 80, "description": 500, "author": 120, "icon": 40, "category": 40}


class CatalogError(Exception):
    pass


def canonical(name: str) -> str:
    """PEP 503 normalised package name, for comparing names."""
    return re.sub(r"[-_.]+", "-", name).lower()


def version_key(version: str):
    try:
        return Version(version)
    except InvalidVersion:
        return None


def is_newer(candidate: str, current: str) -> bool:
    a, b = version_key(candidate), version_key(current)
    return bool(a and b and a > b)


def check_url(url: str) -> str:
    """A git URL an admin typed, tidied; CatalogError if it isn't one we accept."""
    url = (url or "").strip()
    if url.startswith("https://"):
        url = "git+" + url
    m = URL_RE.match(url)
    if not m or ".." in m["path"].split("/") or (m["sub"] and ".." in m["sub"].split("/")):
        raise CatalogError("Use a git URL over HTTPS, e.g. git+https://github.com/someone/conduit-thing@v1.0.0")
    return url


def url_parts(url: str) -> tuple[str, str]:
    """(repository URL without git+ and ref, subdirectory) of a git URL, for matching installs."""
    m = URL_RE.match(url)
    if not m:
        return "", ""
    repo = f"https://{m['host']}/{m['path']}".lower().removesuffix(".git")
    return repo, (m["sub"] or "").strip("/")


def _text(entry: dict, key: str) -> str:
    value = entry.get(key) or ""
    if not isinstance(value, str):
        raise CatalogError(f"{key} must be text")
    return value.strip()[: TEXT_LIMITS.get(key, 300)]


def _entry(raw: dict) -> dict:
    if not isinstance(raw, dict):
        raise CatalogError("every plugin must be an object")
    pid = raw.get("id")
    if not isinstance(pid, str) or not MODULE_ID_RE.match(pid):
        raise CatalogError(f"bad plugin id {pid!r}")
    package = raw.get("package")
    if not isinstance(package, str) or not PACKAGE_RE.match(package):
        raise CatalogError(f"{pid}: bad package name")
    version = raw.get("version")
    if not isinstance(version, str) or not VERSION_RE.match(version) or version_key(version) is None:
        raise CatalogError(f"{pid}: bad version")
    requirement = raw.get("requirement")
    m = CATALOG_REQUIREMENT_RE.match(requirement) if isinstance(requirement, str) else None
    if not m or canonical(m["name"]) != canonical(package):
        raise CatalogError(f"{pid}: the requirement must pin {package} to a commit")
    min_conduit = raw.get("min_conduit") or ""
    if min_conduit and (not isinstance(min_conduit, str) or version_key(min_conduit) is None):
        raise CatalogError(f"{pid}: bad min_conduit")
    homepage = raw.get("homepage") or ""
    if homepage and (not isinstance(homepage, str) or not homepage.startswith("https://") or len(homepage) > 300):
        raise CatalogError(f"{pid}: homepage must be an https:// link")

    def strings(key: str) -> list[str]:
        value = raw.get(key) or []
        if not isinstance(value, list) or not all(isinstance(s, str) and len(s) <= 100 for s in value):
            raise CatalogError(f"{pid}: {key} must be a list of short strings")
        return value[:100]

    return {
        "id": pid,
        "package": package,
        "version": version,
        "requirement": requirement,
        "min_conduit": min_conduit,
        "homepage": homepage,
        "esi_scopes": strings("esi_scopes"),
        "requires": strings("requires"),
        **{key: _text(raw, key) for key in TEXT_LIMITS},
    }


def parse(data: bytes) -> dict:
    """The catalog as {serial, generated_at, plugins: [...]}, or CatalogError if it's malformed."""
    try:
        raw = json.loads(data)
    except ValueError:
        raise CatalogError("the catalog is not valid JSON") from None
    if not isinstance(raw, dict) or raw.get("format") != FORMAT:
        raise CatalogError("this version of EvE Conduit doesn't understand the catalog's format")
    serial = raw.get("serial")
    if not isinstance(serial, int) or serial < 0:
        raise CatalogError("the catalog has no serial number")
    plugins = raw.get("plugins")
    if not isinstance(plugins, list):
        raise CatalogError("the catalog lists no plugins")
    entries = [_entry(p) for p in plugins]
    seen: set[str] = set()
    for e in entries:
        for key in (e["id"], canonical(e["package"])):
            if key in seen:
                raise CatalogError(f"{key} is listed twice")
            seen.add(key)
    generated = raw.get("generated_at")
    return {"serial": serial, "generated_at": generated if isinstance(generated, str) else "", "plugins": entries}


def load_verified(data: bytes, signature: bytes) -> dict:
    """Parse a catalog after checking it carries a valid EvE Conduit signature."""
    try:
        check_signature(data, signature)
    except VerificationError as exc:
        raise CatalogError(f"the catalog's signature doesn't check out: {exc}") from None
    return parse(data)


def by_package(catalog: dict) -> dict[str, dict]:
    return {canonical(p["package"]): p for p in catalog["plugins"]}
