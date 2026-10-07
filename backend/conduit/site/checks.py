"""Warnings about risky production settings. Shown when the server starts (``manage.py check``) and on
Administration > Health."""

from django.conf import settings
from django.core.checks import Warning, register

DOC = "See docs/security.md."


def security_warnings() -> list[dict]:
    out = []
    production = not settings.DEBUG

    def warn(code, msg, hint):
        out.append({"id": f"conduit.W{code:03d}", "message": msg, "hint": f"{hint} {DOC}"})

    if production and not settings.CONDUIT_TOKEN_KEY:
        warn(1, "CONDUIT_TOKEN_KEY is not set, so stored EVE logins are encrypted with a key derived from CONDUIT_SECRET_KEY.",
             "Set CONDUIT_TOKEN_KEY to its own Fernet key, then run `manage.py rotate_token_key`.")
    if settings.DEBUG and settings.SITE_URL.startswith("https://"):
        warn(2, "CONDUIT_DEBUG is on for a public (https) site: errors show source code and settings to visitors.",
             "Remove CONDUIT_DEBUG from the environment.")
    if production and len(settings.SECRET_KEY) < 40:
        warn(3, "CONDUIT_SECRET_KEY is shorter than 40 characters.", "Generate a long random value.")
    if production and not settings.SITE_URL.startswith("https://"):
        warn(4, "CONDUIT_SITE_URL isn't https://, so session cookies are sent without the Secure flag.",
             "Serve the site over HTTPS and set CONDUIT_SITE_URL to the https:// address.")
    if settings.CONDUIT_WEBHOOK_ALLOW_PRIVATE:
        warn(5, "CONDUIT_WEBHOOK_ALLOW_PRIVATE is on: webhooks may post to private and internal addresses.",
             "Leave it off unless webhooks really must reach internal services.")
    if production and settings.CONDUIT_DJANGO_ADMIN:
        warn(6, "The Django back-office is reachable at /django-admin/.",
             "Set CONDUIT_DJANGO_ADMIN=false, or allow it only from trusted addresses in nginx/Caddy.")
    if not settings.CONDUIT_RATE_LIMITS:
        warn(7, "Rate limiting is switched off (CONDUIT_RATE_LIMITS=false).", "Switch it back on unless the proxy limits requests.")
    return out


@register()
def check_security(app_configs, **kwargs):
    return [Warning(w["message"], hint=w["hint"], id=w["id"]) for w in security_warnings()]
