"""Print one version's section of CHANGELOG.md (the release notes): python scripts/changelog-section.py 0.4.0"""

import re
import sys
from pathlib import Path

version = sys.argv[1].lstrip("v")
text = Path(__file__).resolve().parent.parent.joinpath("CHANGELOG.md").read_text(encoding="utf-8")
m = re.search(rf"^## {re.escape(version)}\b.*?$\n(.*?)(?=^## |\Z)", text, re.M | re.S)
if not m:
    sys.exit(f"CHANGELOG.md has no section for {version}")
print(m.group(1).strip())
