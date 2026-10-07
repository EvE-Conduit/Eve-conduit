"""EVE's in-game markup (mail bodies, bios, notifications) to plain text."""

import html
import re

BR_RE = re.compile(r"<br\s*/?>", re.I)
TAG_RE = re.compile(r"<[^>]+>")


def plain_text(value: str | None) -> str:
    if not value:
        return ""
    text = BR_RE.sub("\n", value)
    text = TAG_RE.sub("", text)
    return html.unescape(text).strip()


def parse_notification(text: str) -> dict:
    """Notification bodies are small YAML documents; read the top-level ``key: value`` lines."""
    out = {}
    for line in (text or "").splitlines():
        if line.startswith((" ", "-")) or ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.strip().strip("'\"")
        if key and value and not value.startswith("&"):
            out[key.strip()] = value
    return out
