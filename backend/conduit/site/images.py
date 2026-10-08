"""Images admins upload for the site, stored in the database (see ``SiteImage``).

Only PNG, JPEG, WebP and GIF are taken, recognised by their first bytes rather than the name or the browser's word
for it; SVG is refused because it can carry scripts. An image nothing refers to any more is removed the next time
the landing page is saved, once it's an hour old (so one uploaded into an unsaved draft survives a while).
"""

import re
from datetime import timedelta

from django.utils import timezone

from .models import SiteImage, SiteSettings

MAX_SIZE = 5 * 1024 * 1024
URL_RE = re.compile(r"^/api/core/images/[0-9a-f]{32}$")


def sniff(head: bytes) -> str | None:
    """The image type from a file's first bytes, or None if it isn't one we take."""
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    return None


def is_image_url(v: str) -> bool:
    """A link to an uploaded image on this site."""
    return bool(URL_RE.match(v))


def prune(site: SiteSettings | None = None) -> int:
    """Remove uploaded images nothing refers to any more. Returns how many went."""
    site = site or SiteSettings.load()
    used = str(site.landing) + site.logo_url
    old = SiteImage.objects.filter(created_at__lt=timezone.now() - timedelta(hours=1)).values_list("id", flat=True)
    unused = [pk for pk in old if pk.hex not in used]
    if unused:
        SiteImage.objects.filter(pk__in=unused).delete()
    return len(unused)
