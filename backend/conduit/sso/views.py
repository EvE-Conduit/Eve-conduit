"""EVE SSO login (OAuth2 authorization code + PKCE)."""

import base64
import hashlib
import logging
import secrets
from urllib.parse import urlencode

import jwt
from django.conf import settings
from django.contrib.auth import login as django_login
from django.http import HttpResponseBadRequest, HttpResponseRedirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_GET

from conduit.accounts.services import CharacterOwnedElsewhere, link_character
from conduit.audit.services import record
from conduit.esi.exceptions import TokenInvalid
from conduit.esi.scopes import ALL_SCOPES
from conduit.esi.tokens import (
    AUTHORIZE_URL,
    character_from_claims,
    exchange_code,
    sso_configured,
    verify_access_token,
)
from conduit.plugins.services import required_scopes

log = logging.getLogger(__name__)
SESSION_KEY = "conduit_sso"


def _safe_next(request, default="/") -> str:
    nxt = request.GET.get("next") or default
    return nxt if url_has_allowed_host_and_scheme(nxt, allowed_hosts=None) and nxt.startswith("/") else default


def _start(request, mode: str, scopes: list[str]):
    if not sso_configured():
        return HttpResponseRedirect("/setup?error=sso_not_configured")
    state = secrets.token_urlsafe(24)
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    request.session[SESSION_KEY] = {
        "state": state,
        "verifier": verifier,
        "mode": mode,
        "next": _safe_next(request),
    }
    query = urlencode(
        {
            "response_type": "code",
            "redirect_uri": settings.ESI_CALLBACK_URL,
            "client_id": settings.ESI_CLIENT_ID,
            "scope": " ".join(sorted(set(scopes))),
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }
    )
    return HttpResponseRedirect(f"{AUTHORIZE_URL}?{query}")


def _all_scopes() -> list[str]:
    """Every EVE SSO scope (or ESI_SCOPES), plus anything the sheet or an enabled plugin needs."""
    from conduit.corp.registry import all_scopes as corporation_scopes

    return [*settings.ESI_LOGIN_SCOPES, *(settings.ESI_SCOPES or ALL_SCOPES), *required_scopes(), *corporation_scopes()]


@require_GET
def login(request):
    """Sign in with a character, granting every scope up front so nothing has to ask again later."""
    return _start(request, "login", _all_scopes())


@require_GET
def add_character(request):
    """Link another character (or re-authorise one) with every scope."""
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/login")
    return _start(request, "add", _all_scopes())


def _back(flow: dict, **params) -> HttpResponseRedirect:
    target = flow.get("next", "/") if flow else "/"
    if params:
        target += ("&" if "?" in target else "?") + urlencode(params)
    return HttpResponseRedirect(target)


@require_GET
def callback(request):
    flow = request.session.pop(SESSION_KEY, None)
    if not flow or not secrets.compare_digest(flow["state"], request.GET.get("state", "")):
        return HttpResponseBadRequest("Login session expired or invalid. Please try again.")
    code = request.GET.get("code")
    if not code:
        return _back(flow, error="sso_cancelled")

    try:
        token_data = exchange_code(code, flow["verifier"])
        info = character_from_claims(verify_access_token(token_data["access_token"]))
    except (TokenInvalid, jwt.PyJWTError, KeyError) as exc:
        log.warning("EVE SSO callback failed: %s", exc)
        return _back(flow, error="sso_failed")

    adding = flow["mode"] == "add" and request.user.is_authenticated
    try:
        character = link_character(info, token_data, request.user if adding else None)
    except CharacterOwnedElsewhere:
        return _back(flow, error="character_owned_elsewhere")

    if adding:
        record("character.added", f"added character {character.name}", request=request, target=character,
               details={"scopes": len(info["scopes"])})
        return _back(flow, added=character.pk)
    django_login(request, character.user, backend=settings.AUTHENTICATION_BACKENDS[0])
    record("auth.login", f"signed in with {character.name}", request=request, target=character)
    return _back(flow)
