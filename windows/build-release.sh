#!/usr/bin/env bash
# Builds dist/eve-conduit-X.Y.Z-windows.zip: the normal release (scripts/build-release.sh, unchanged)
# plus this windows/ folder, packed as a zip with a single top-level folder.
# Run on Linux, macOS or WSL (needs Node.js for the front-end build and Python 3).
set -euo pipefail
cd "$(dirname "$0")/.."
tarball=$(./scripts/build-release.sh | tail -1)
python3 - "$tarball" <<'PY'
import sys, tarfile, time, zipfile
from pathlib import Path

tarball = Path(sys.argv[1])
base = tarball.name.removesuffix(".tar.gz")            # eve-conduit-X.Y.Z
out = tarball.with_name(f"{base}-windows.zip")
top = f"{base}-windows"
skip = {"__pycache__", "tests", ".pytest_cache", ".ipynb_checkpoints"}  # also Jupyter autosave copies

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    with tarfile.open(tarball) as tf:
        for member in tf.getmembers():
            if not member.isfile() or ".ipynb_checkpoints" in member.name.split("/"):
                continue
            name = top + member.name[len(base):]
            # Keep each file's real date: Caddy's ETag is date + size, so a fixed date would make a new
            # index.html (same size, new bundle names) look unchanged and browsers keep the old front end.
            stamp = time.localtime(max(member.mtime, 315532800))[:6]  # zip dates start in 1980
            zf.writestr(zipfile.ZipInfo(name, date_time=stamp), tf.extractfile(member).read(), zipfile.ZIP_DEFLATED)
    for path in sorted(Path("windows").rglob("*")):
        if path.is_file() and not (set(path.parts) & skip) and path.name != "build-release.sh":
            zf.write(path, f"{top}/{path.as_posix()}")
print(out)
PY
