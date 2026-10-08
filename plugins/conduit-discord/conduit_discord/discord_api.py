"""The few Discord REST API calls the plugin makes (https://discord.com/developers/docs/reference)."""

from __future__ import annotations

import contextlib
import contextvars
import logging
import time
from urllib.parse import urlencode

import httpx

log = logging.getLogger(__name__)

API = "https://discord.com/api/v10"
AUTHORIZE_URL = "https://discord.com/oauth2/authorize"
USER_AGENT = "DiscordBot (https://github.com/EvE-Conduit/Eve-conduit, 1.0)"
#: identify: who they are; guilds.join: lets the bot add them to the server.
OAUTH_SCOPES = "identify guilds.join"

# Permission bits the bot needs.
CREATE_INSTANT_INVITE = 1 << 0  # adding members with guilds.join
KICK_MEMBERS = 1 << 1
ADMINISTRATOR = 1 << 3
MANAGE_NICKNAMES = 1 << 27
MANAGE_ROLES = 1 << 28
BOT_PERMISSIONS = CREATE_INSTANT_INVITE | KICK_MEMBERS | MANAGE_NICKNAMES | MANAGE_ROLES

#: Longest wait for a rate limit before giving up on a call.
MAX_WAIT = 10.0
#: Whether a rate-limited call may sleep and retry. Only background tasks do (see ``allow_waiting``): sleeping in a web
#: request would let anyone tie up the site's web workers by making Discord rate limit us.
_may_wait = contextvars.ContextVar("discord_may_wait", default=False)


@contextlib.contextmanager
def allow_waiting():
    """Let calls inside wait out Discord's rate limits (for Celery tasks, never for web requests)."""
    token = _may_wait.set(True)
    try:
        yield
    finally:
        _may_wait.reset(token)


class DiscordError(Exception):
    def __init__(self, status: int, message: str, code: int | None = None):
        super().__init__(message)
        self.status = status
        self.code = code


def _client() -> httpx.Client:
    return httpx.Client(timeout=15, headers={"User-Agent": USER_AGENT}, follow_redirects=False)


def call(method: str, path: str, *, bot_token: str | None = None, bearer: str | None = None, json=None, data=None):
    """Call the API. Returns the JSON body, or None for 204. Rate limits are waited out a few times inside
    ``allow_waiting()`` (background tasks); elsewhere they fail straight away."""
    headers = {}
    if bot_token:
        headers["Authorization"] = f"Bot {bot_token}"
    elif bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    with _client() as client:
        for _attempt in range(4):
            try:
                resp = client.request(method, f"{API}{path}", headers=headers, json=json, data=data)
            except httpx.HTTPError as exc:
                raise DiscordError(0, f"Couldn't reach Discord: {exc.__class__.__name__}") from None
            if resp.status_code == 429:
                wait = _retry_after(resp)
                if not _may_wait.get():
                    raise DiscordError(429, "Discord is rate limiting this site right now; try again in a minute")
                if wait > MAX_WAIT:
                    raise DiscordError(429, f"Discord asked us to wait {wait:.0f} s; try again later")
                time.sleep(wait)
                continue
            if resp.status_code >= 400:
                body = resp.json() if resp.content and resp.headers.get("content-type", "").startswith("application/json") else {}
                raise DiscordError(resp.status_code, body.get("message") or body.get("error_description") or body.get("error") or f"HTTP {resp.status_code}", body.get("code"))
            return resp.json() if resp.status_code != 204 and resp.content else None
    raise DiscordError(429, "Discord kept rate limiting us; try again later")


def _retry_after(resp: httpx.Response) -> float:
    try:
        return float(resp.json().get("retry_after", 1))
    except ValueError:
        return float(resp.headers.get("retry-after", 1))


# --- OAuth2 ------------------------------------------------------------------------------------------------------


def authorize_url(client_id: str, redirect_uri: str, state: str) -> str:
    return AUTHORIZE_URL + "?" + urlencode({
        "response_type": "code", "client_id": client_id, "scope": OAUTH_SCOPES, "state": state,
        "redirect_uri": redirect_uri, "prompt": "consent",
    })


def bot_invite_url(client_id: str, guild_id: str = "") -> str:
    params = {"client_id": client_id, "scope": "bot", "permissions": str(BOT_PERMISSIONS)}
    if guild_id:
        params |= {"guild_id": guild_id, "disable_guild_select": "true"}
    return AUTHORIZE_URL + "?" + urlencode(params)


def exchange_code(client_id: str, client_secret: str, code: str, redirect_uri: str) -> str:
    """Trade the code from the redirect for the member's access token."""
    body = call("POST", "/oauth2/token", data={
        "client_id": client_id, "client_secret": client_secret, "grant_type": "authorization_code",
        "code": code, "redirect_uri": redirect_uri,
    })
    return body["access_token"]


def current_user(access_token: str) -> dict:
    return call("GET", "/users/@me", bearer=access_token)


def avatar_url(user: dict) -> str:
    if user.get("avatar"):
        return f"https://cdn.discordapp.com/avatars/{user['id']}/{user['avatar']}.png?size=128"
    index = (int(user["id"]) >> 22) % 6
    return f"https://cdn.discordapp.com/embed/avatars/{index}.png"


# --- the server --------------------------------------------------------------------------------------------------


def guild(bot_token: str, guild_id: str) -> dict:
    return call("GET", f"/guilds/{guild_id}", bot_token=bot_token)


def roles(bot_token: str, guild_id: str) -> list[dict]:
    return call("GET", f"/guilds/{guild_id}/roles", bot_token=bot_token)


def bot_user(bot_token: str) -> dict:
    return call("GET", "/users/@me", bot_token=bot_token)


def member(bot_token: str, guild_id: str, user_id: str) -> dict | None:
    """The member, or None if they aren't on the server."""
    try:
        return call("GET", f"/guilds/{guild_id}/members/{user_id}", bot_token=bot_token)
    except DiscordError as exc:
        if exc.status == 404:
            return None
        raise


def add_member(bot_token: str, guild_id: str, user_id: str, access_token: str, role_ids: list[str], nick: str | None) -> bool:
    """Put someone on the server. True if they were added, False if they were already there (nothing changes then)."""
    body: dict = {"access_token": access_token, "roles": role_ids}
    if nick:
        body["nick"] = nick
    return call("PUT", f"/guilds/{guild_id}/members/{user_id}", bot_token=bot_token, json=body) is not None


def modify_member(bot_token: str, guild_id: str, user_id: str, **changes) -> None:
    call("PATCH", f"/guilds/{guild_id}/members/{user_id}", bot_token=bot_token, json=changes)


def kick(bot_token: str, guild_id: str, user_id: str) -> None:
    try:
        call("DELETE", f"/guilds/{guild_id}/members/{user_id}", bot_token=bot_token)
    except DiscordError as exc:
        if exc.status != 404:
            raise
