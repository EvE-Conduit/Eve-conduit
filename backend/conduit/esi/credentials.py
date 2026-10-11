"""Where the EVE application's Client ID and Secret Key come from.

The config file (``ESI_CLIENT_ID`` / ``ESI_SECRET_KEY``) wins when it is set. Otherwise they come from the site
settings, where the setup wizard and Administration -> Settings put them, so nobody has to edit a file on the
server and restart. The secret is stored encrypted with the token key, like members' SSO tokens.
"""

from __future__ import annotations

import base64

import httpx
from django.conf import settings

ENV = "env"
SITE = "site"


def source() -> str:
    """``"env"`` (config file), ``"site"`` (set on the website) or ``""`` (not configured)."""
    if settings.ESI_CLIENT_ID and settings.ESI_SECRET_KEY:
        return ENV
    from conduit.site.models import SiteSettings

    site = SiteSettings.load()
    return SITE if site.esi_client_id and site.esi_secret_key else ""


def credentials() -> tuple[str, str]:
    """The (client id, secret key) in use, or two empty strings."""
    if settings.ESI_CLIENT_ID and settings.ESI_SECRET_KEY:
        return settings.ESI_CLIENT_ID, settings.ESI_SECRET_KEY
    from conduit.site.models import SiteSettings

    site = SiteSettings.load()
    if site.esi_client_id and site.esi_secret_key:
        return site.esi_client_id, site.esi_secret_key
    return "", ""


def client_id() -> str:
    return credentials()[0]


def check(client_id: str, secret_key: str) -> str:
    """Ask EVE's login server whether these credentials belong to a real application.

    EVE SSO has no "who am I" call for applications, so this asks it to refresh a token that doesn't exist: with
    the right credentials it answers ``invalid_grant`` (bad token), with the wrong ones ``invalid_client``.
    Returns an empty string when they're accepted, otherwise a sentence for the person who typed them.
    """
    from .tokens import TOKEN_URL

    raw = f"{client_id}:{secret_key}".encode()
    try:
        resp = httpx.post(
            TOKEN_URL,
            data={"grant_type": "refresh_token", "refresh_token": "conduit-credential-check"},
            headers={"Authorization": "Basic " + base64.b64encode(raw).decode(), "Host": "login.eveonline.com"},
            timeout=15,
        )
    except httpx.HTTPError:
        return "Couldn't reach login.eveonline.com to check them. Make sure the server has internet access and try again."
    try:
        error = str(resp.json().get("error") or "")
    except ValueError:
        error = ""
    if resp.status_code == 401 or error == "invalid_client":
        return "EVE's login server doesn't know this Client ID and Secret Key. Check both against the application page."
    if resp.status_code >= 500:
        return "EVE's login server isn't answering right now. Try again in a few minutes."
    return ""
