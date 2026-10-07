"""Release version numbers: "1.2.3" (a leading "v" in tags is ignored)."""

import re

VERSION_RE = re.compile(r"^v?(\d+)\.(\d+)\.(\d+)$")


def parse(version: str) -> tuple[int, int, int] | None:
    m = VERSION_RE.match((version or "").strip())
    return (int(m[1]), int(m[2]), int(m[3])) if m else None


def is_newer(candidate: str, current: str) -> bool:
    a, b = parse(candidate), parse(current)
    return bool(a and b and a > b)


def clean(version: str) -> str:
    parsed = parse(version)
    if parsed is None:
        raise ValueError(f"not a release version: {version!r}")
    return "%d.%d.%d" % parsed
