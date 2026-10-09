"""SSO token exchange, refresh and verification."""

from __future__ import annotations

import base64
import logging
import time
from datetime import timedelta
from functools import cache

import httpx
import jwt
from django.conf import settings
from django.core.cache import cache as django_cache
from django.utils import timezone

from .exceptions import SsoRefused, TokenInvalid

log = logging.getLogger(__name__)

SSO_HOST = "https://login.eveonline.com"
AUTHORIZE_URL = f"{SSO_HOST}/v2/oauth/authorize"
TOKEN_URL = f"{SSO_HOST}/v2/oauth/token"
JWKS_URL = f"{SSO_HOST}/oauth/jwks"
VALID_ISSUERS = {"login.eveonline.com", SSO_HOST}


def sso_configured() -> bool:
    return bool(settings.ESI_CLIENT_ID and settings.ESI_SECRET_KEY)


def _basic_auth() -> str:
    raw = f"{settings.ESI_CLIENT_ID}:{settings.ESI_SECRET_KEY}".encode()
    return "Basic " + base64.b64encode(raw).decode()


def _token_request(data: dict) -> dict:
    resp = httpx.post(
        TOKEN_URL,
        data=data,
        headers={"Authorization": _basic_auth(), "Host": "login.eveonline.com"},
        timeout=20,
    )
    if resp.status_code in (400, 401):
        raise TokenInvalid(resp.text[:200], oauth_error=_oauth_error(resp))
    resp.raise_for_status()
    return resp.json()


def _oauth_error(resp: httpx.Response) -> str:
    """The OAuth ``error`` code of a refused token request, e.g. ``invalid_grant``."""
    try:
        return str(resp.json().get("error") or "")
    except (ValueError, AttributeError):
        return ""


def exchange_code(code: str, code_verifier: str) -> dict:
    return _token_request({"grant_type": "authorization_code", "code": code, "code_verifier": code_verifier})


@cache
def _jwks() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(JWKS_URL, cache_keys=True)


def verify_access_token(access_token: str) -> dict:
    """Validate the JWT from EVE SSO and return its claims."""
    key = _jwks().get_signing_key_from_jwt(access_token)
    claims = jwt.decode(
        access_token,
        key.key,
        algorithms=["RS256"],
        audience="EVE Online",
        options={"require": ["exp", "sub", "iss", "aud"]},
    )
    if claims["iss"] not in VALID_ISSUERS:
        raise jwt.InvalidIssuerError(claims["iss"])
    aud = claims["aud"] if isinstance(claims["aud"], list) else [claims["aud"]]
    if settings.ESI_CLIENT_ID not in aud:
        raise jwt.InvalidAudienceError("token was issued to another application")
    return claims


def character_from_claims(claims: dict) -> dict:
    # sub looks like "CHARACTER:EVE:2112345678"
    kind, _, char_id = claims["sub"].rpartition(":")
    if not kind.startswith("CHARACTER"):
        raise jwt.InvalidTokenError("not a character token")
    scopes = claims.get("scp", [])
    if isinstance(scopes, str):
        scopes = [scopes]
    return {
        "id": int(char_id),
        "name": claims["name"],
        "owner_hash": claims["owner"],
        "scopes": scopes,
    }


def save_token(character, token_data: dict, scopes: list[str]):
    from conduit.accounts.models import Token

    Token.objects.update_or_create(
        character=character,
        defaults={
            "access_token": token_data["access_token"],
            "refresh_token": token_data["refresh_token"],
            "expires_at": timezone.now() + timedelta(seconds=int(token_data.get("expires_in", 1199))),
            "scopes": " ".join(sorted(scopes)),
            "valid": True,
        },
    )


def get_access_token(character) -> str:
    """A valid access token for the character, refreshing it if it is about to expire."""
    from conduit.accounts.models import Token

    try:
        token = Token.objects.get(character=character)
    except Token.DoesNotExist as exc:
        raise TokenInvalid(f"{character} has no token") from exc
    if not token.valid:
        raise TokenInvalid(f"{character} needs to log in again")
    if token.expires_at - timezone.now() > timedelta(seconds=60):
        return token.access_token

    lock = f"esi:refresh-lock:{character.pk}"
    if not django_cache.add(lock, 1, 30):
        # Another worker is refreshing; wait for it instead of burning the refresh token.
        for _ in range(20):
            time.sleep(0.5)
            token.refresh_from_db()
            if token.expires_at - timezone.now() > timedelta(seconds=60):
                return token.access_token
    try:
        try:
            data = _token_request({"grant_type": "refresh_token", "refresh_token": token.refresh_token})
        except TokenInvalid as exc:
            if exc.oauth_error != "invalid_grant":
                # Only invalid_grant means this token is dead. Anything else (invalid_client after the EVE
                # application's id or secret changed, ...) would otherwise log out every character at once.
                log.error("EVE SSO refused refreshing %s's token (%s): %s", character, exc.oauth_error or "no error code", exc)
                raise SsoRefused(400, exc.oauth_error or str(exc)) from exc
            token.valid = False
            token.save(update_fields=["valid"])
            token_lost(character)
            raise
        token.access_token = data["access_token"]
        token.refresh_token = data.get("refresh_token", token.refresh_token)
        token.expires_at = timezone.now() + timedelta(seconds=int(data.get("expires_in", 1199)))
        token.save(update_fields=["access_token", "refresh_token", "expires_at"])
        return token.access_token
    finally:
        django_cache.delete(lock)


def token_lost(character):
    """A character's refresh token stopped working: tell its owner and anyone listening."""
    from conduit.events import bus
    from conduit.notify import notify

    bus.emit("token.invalid", user_id=character.user_id, character_id=character.pk, character=character.name,
             title="Character needs a new login", summary=f"{character.name}'s ESI access stopped working", level="warning")
    notify(character.user_id, f"{character.name} needs to log in again",
           "EVE stopped accepting this character's login, so its data is no longer updating. Log in with it again to fix it.",
           link="/characters", level="warning", category="tokens", data={"character_id": character.pk})
