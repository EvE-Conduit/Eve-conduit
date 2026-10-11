"""Release version numbers: "1.2.3" (a leading "v" in tags is ignored).

Also the downgrade check the privileged updaters run before installing a signed release::

    python -I -m conduit.updates.versions check-upgrade <version>

prints the running version and exits 0 when ``<version>`` is the running version or newer, 1 when it is older
(a downgrade: refuse it) and 2 when it isn't a version at all. Free of Django on purpose.
"""

import re
import sys

from packaging.version import InvalidVersion, Version

VERSION_RE = re.compile(r"^v?(\d+)\.(\d+)\.(\d+)$")


def parse(version: str) -> tuple[int, int, int] | None:
    m = VERSION_RE.match((version or "").strip())
    return (int(m[1]), int(m[2]), int(m[3])) if m else None


def is_newer(candidate: str, current: str) -> bool:
    a, b = parse(candidate), parse(current)
    return bool(a and b and a > b)


def is_downgrade(candidate: str, current: str) -> bool:
    """True when installing ``candidate`` over ``current`` would go backwards (equal is a reinstall, allowed).
    Compared as PEP 440 versions; anything unparseable counts as a downgrade, since it can't be shown to be newer."""
    try:
        return Version((candidate or "").strip()) < Version(current)
    except InvalidVersion:
        return True


def clean(version: str) -> str:
    parsed = parse(version)
    if parsed is None:
        raise ValueError(f"not a release version: {version!r}")
    return "%d.%d.%d" % parsed


def main(argv: list[str]) -> int:
    from conduit import __version__

    if len(argv) != 2 or argv[0] != "check-upgrade":
        print("usage: python -I -m conduit.updates.versions check-upgrade <version>", file=sys.stderr)
        return 2
    print(__version__)
    try:
        Version(argv[1].strip())
    except InvalidVersion:
        return 2
    return 1 if is_downgrade(argv[1], __version__) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
