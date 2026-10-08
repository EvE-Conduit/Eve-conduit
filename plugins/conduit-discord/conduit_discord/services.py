"""Linking Discord accounts and keeping each member's roles and nickname in step with the site.

The bot only touches roles that are mapped to a group or state ("managed" roles). Roles given by hand in Discord
stay as they are. A member gets the managed roles of every group they're in and of their state, as long as they
have ``discord.access_discord``; without it they lose the managed roles, or are removed from the server when the
admins chose that.
"""

from __future__ import annotations

import logging
import secrets

from django.conf import settings as django_settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.events import bus
from conduit.eve.models import portrait_url

from . import discord_api as api
from .models import DiscordAccount, DiscordSettings, RoleMapping

log = logging.getLogger(__name__)

SESSION_STATE = "conduit_discord_oauth_state"
NICK_MAX = 32


class LinkError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def redirect_uri() -> str:
    return f"{django_settings.SITE_URL}/p/discord/callback"


def has_access(user) -> bool:
    return user.is_active and user.has_perm("discord.access_discord")


def desired_roles(user, mappings: list[RoleMapping] | None = None) -> set[str]:
    """The managed roles this member should have."""
    if not has_access(user):
        return set()
    if mappings is None:
        mappings = list(RoleMapping.objects.all())
    group_ids = set(user.groups.values_list("pk", flat=True))
    return {m.role_id for m in mappings if (m.group_id and m.group_id in group_ids) or (m.state_id and m.state_id == user.state_id)}


def nickname_for(user, fmt: str) -> str | None:
    """The member's nickname from the format, cut to Discord's 32 characters; None when nicknames aren't managed."""
    char = user.main_character
    if not fmt or char is None:
        return None
    corp, alliance = char.corporation, char.alliance
    values = {
        "character": char.name,
        "corp_ticker": corp.ticker if corp else "",
        "corp": corp.name if corp else "",
        "alliance_ticker": alliance.ticker if alliance else "",
        "alliance": alliance.name if alliance else "",
    }
    try:
        nick = fmt.format(**values)
    except (KeyError, IndexError, ValueError):
        nick = char.name
    nick = " ".join(nick.replace("[]", "").split())
    return nick[:NICK_MAX] or None


def check_nickname_format(fmt: str) -> None:
    try:
        fmt.format(character="", corp_ticker="", corp="", alliance_ticker="", alliance="")
    except (KeyError, IndexError, ValueError) as exc:
        raise LinkError(f"The nickname format has an unknown placeholder: {exc}. Use {{character}}, {{corp_ticker}}, {{corp}}, {{alliance_ticker}} or {{alliance}}.") from None


# --- syncing -------------------------------------------------------------------------------------------------------


def _set_status(acct: DiscordAccount, error: str = "", **fields) -> None:
    acct.sync_error = error[:300]
    acct.synced_at = timezone.now()
    for k, v in fields.items():
        setattr(acct, k, v)
    acct.save()


def explain(exc: api.DiscordError) -> str:
    if exc.status == 401:
        return "The bot token was refused; check it under Discord → Setup"
    if exc.status == 403 or exc.code == 50013:
        return "The bot isn't allowed to do that: its role must be above every role it gives, and it needs Manage Roles and Manage Nicknames"
    return str(exc)


def sync_user(user, s: DiscordSettings | None = None, mappings: list[RoleMapping] | None = None) -> str:
    """Bring one member's roles and nickname up to date. Returns "" when it worked, else what went wrong."""
    s = s or DiscordSettings.load()
    acct = DiscordAccount.objects.filter(user=user).first()
    if acct is None or not s.configured:
        return ""
    if mappings is None:
        mappings = list(RoleMapping.objects.all())
    managed = {m.role_id for m in mappings}
    try:
        member = api.member(s.bot_token, s.guild_id, acct.discord_id)
        if member is None:
            _set_status(acct, "Not on the server; press Join the server to come back", roles=[])
            return acct.sync_error
        access = has_access(user)
        if not access and s.kick_without_access:
            api.kick(s.bot_token, s.guild_id, acct.discord_id)
            _forget(acct, f"{user.display_name} was removed from the Discord server (no access any more)")
            return ""
        wanted = desired_roles(user, mappings)
        current = set(member.get("roles", []))
        changes: dict = {}
        new_roles = (current - managed) | wanted
        if new_roles != current:
            changes["roles"] = sorted(new_roles)
        nick = nickname_for(user, s.nickname_format) if access else None
        if nick and member.get("nick") != nick:
            changes["nick"] = nick
        warning = ""
        if changes:
            try:
                api.modify_member(s.bot_token, s.guild_id, acct.discord_id, **changes)
            except api.DiscordError as exc:
                # The server owner's nickname can't be changed by anyone; still give the roles.
                if exc.status != 403 or "nick" not in changes or "roles" not in changes:
                    raise
                api.modify_member(s.bot_token, s.guild_id, acct.discord_id, roles=changes["roles"])
                warning = "Roles are up to date, but the bot can't change this member's nickname"
        _set_status(acct, warning, roles=sorted(wanted), nickname=nick or member.get("nick") or "")
        return warning
    except api.DiscordError as exc:
        log.warning("Discord sync for %s failed: %s", user, exc)
        _set_status(acct, explain(exc))
        return acct.sync_error


def sync_all() -> dict:
    s = DiscordSettings.load()
    if not s.configured:
        return {"synced": 0, "failed": 0}
    mappings = list(RoleMapping.objects.all())
    synced = failed = 0
    for acct in DiscordAccount.objects.select_related("user__main_character__corporation", "user__main_character__alliance"):
        if sync_user(acct.user, s, mappings):
            failed += 1
        else:
            synced += 1
    s.last_full_sync = timezone.now()
    s.save(update_fields=["last_full_sync"])
    return {"synced": synced, "failed": failed}


# --- linking -------------------------------------------------------------------------------------------------------


def start_link(request) -> str:
    """The Discord page to send the member to. The state ties the answer to this browser session."""
    s = DiscordSettings.load()
    if not s.configured:
        raise LinkError("Discord isn't set up on this site yet")
    if not has_access(request.user):
        raise LinkError("You don't have access to the Discord server", 403)
    state = secrets.token_urlsafe(24)
    request.session[SESSION_STATE] = state
    return api.authorize_url(s.client_id, redirect_uri(), state)


def finish_link(request, code: str, state: str) -> DiscordAccount:
    expected = request.session.pop(SESSION_STATE, None)
    if not expected or not secrets.compare_digest(expected, state or ""):
        raise LinkError("This sign-in with Discord has expired or came from another browser; please try again")
    s = DiscordSettings.load()
    user = request.user
    if not s.configured:
        raise LinkError("Discord isn't set up on this site yet")
    if not has_access(user):
        raise LinkError("You don't have access to the Discord server", 403)
    try:
        token = api.exchange_code(s.client_id, s.client_secret, code, redirect_uri())
        info = api.current_user(token)
    except api.DiscordError as exc:
        raise LinkError(f"Discord didn't accept the sign-in: {exc}") from None
    other = DiscordAccount.objects.filter(discord_id=info["id"]).exclude(user=user).first()
    if other is not None:
        raise LinkError("That Discord account is already linked to another member. Unlink it there first.", 409)
    old = DiscordAccount.objects.filter(user=user).exclude(discord_id=info["id"]).first()
    if old is not None:
        # Switching accounts: take the roles off the old one first.
        unlink(user, reason="switched to another Discord account", notify_user=False)
    username = info.get("global_name") or info.get("username") or info["id"]
    try:
        with transaction.atomic():
            acct, _ = DiscordAccount.objects.update_or_create(
                user=user, defaults={"discord_id": info["id"], "username": username[:100], "avatar_url": api.avatar_url(info)}
            )
    except IntegrityError:
        raise LinkError("That Discord account is already linked to another member", 409) from None
    nick = nickname_for(user, s.nickname_format)
    try:
        api.add_member(s.bot_token, s.guild_id, acct.discord_id, token, sorted(desired_roles(user)), nick)
    except api.DiscordError as exc:
        _set_status(acct, explain(exc))
        raise LinkError(f"Linked, but Discord wouldn't add you to the server: {explain(exc)}") from None
    sync_user(user, s)  # already a member: adding changes nothing, so set roles and nickname now
    bus.emit("discord.linked", user_id=user.pk, user=user.display_name, discord=acct.username,
             summary=f"{user.display_name} linked Discord account {acct.username}", level="success")
    return acct


def _forget(acct: DiscordAccount, summary: str) -> None:
    user = acct.user
    bus.emit("discord.unlinked", user_id=user.pk, user=user.display_name, discord=acct.username, summary=summary, level="warning")
    acct.delete()


def unlink(user, *, kick: bool | None = None, reason: str = "", notify_user: bool = True, force: bool = False) -> None:
    """Take the managed roles away (or remove them from the server) and forget the link.

    If Discord can't be reached to do that, the link is kept and LinkError raised: once forgotten, nothing would ever
    take those roles away again (the periodic sync only knows linked accounts). Only an administrator's ``force``
    forgets it anyway.
    """
    from conduit.notify.services import notify

    acct = DiscordAccount.objects.filter(user=user).first()
    if acct is None:
        raise LinkError("No Discord account is linked", 404)
    s = DiscordSettings.load()
    if kick is None:
        kick = s.kick_without_access
    if s.configured:
        try:
            if kick:
                api.kick(s.bot_token, s.guild_id, acct.discord_id)
            else:
                member = api.member(s.bot_token, s.guild_id, acct.discord_id)
                managed = set(RoleMapping.objects.values_list("role_id", flat=True))
                if member is not None and managed & set(member.get("roles", [])):
                    api.modify_member(s.bot_token, s.guild_id, acct.discord_id, roles=sorted(set(member["roles"]) - managed))
        except api.DiscordError as exc:
            log.warning("Couldn't clean up Discord account %s of %s: %s", acct.discord_id, user, exc)
            if not force:
                raise LinkError(f"Couldn't take the roles off on Discord ({explain(exc)}), so the account stays linked; "
                                "try again in a minute", 502) from None
    _forget(acct, f"{user.display_name} unlinked Discord account {acct.username}" + (f" ({reason})" if reason else ""))
    if notify_user and reason:
        notify(user, "Your Discord account was unlinked", reason, link="/p/discord", level="warning", category="p.discord")


# --- admin ---------------------------------------------------------------------------------------------------------


def _bits(value) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def server_check(s: DiscordSettings | None = None) -> dict:
    """Ask Discord about the server: its roles, where the bot stands, and anything that will stop syncing."""
    s = s or DiscordSettings.load()
    if not (s.bot_token and s.guild_id):
        raise LinkError("Enter the bot token and the server id first")
    try:
        g = api.guild(s.bot_token, s.guild_id)
        role_list = api.roles(s.bot_token, s.guild_id)
        bot = api.bot_user(s.bot_token)
        bot_member = api.member(s.bot_token, s.guild_id, bot["id"])
    except api.DiscordError as exc:
        if exc.status in (403, 404):
            raise LinkError("The bot can't see that server. Invite it with the link under step 2, and check the server id.") from None
        raise LinkError(explain(exc)) from None
    by_id = {r["id"]: r for r in role_list}
    bot_roles = [by_id[r] for r in (bot_member or {}).get("roles", []) if r in by_id]
    everyone = by_id.get(s.guild_id, {})
    perms = _bits(everyone.get("permissions"))
    for r in bot_roles:
        perms |= _bits(r.get("permissions"))
    top = max((r["position"] for r in bot_roles), default=0)
    problems = []
    if bot_member is None:
        problems.append("The bot isn't on the server. Invite it with the link under step 2.")
    elif not perms & api.ADMINISTRATOR:
        for bit, label in ((api.MANAGE_ROLES, "Manage Roles"), (api.MANAGE_NICKNAMES, "Manage Nicknames"),
                           (api.CREATE_INSTANT_INVITE, "Create Invite"), (api.KICK_MEMBERS, "Kick Members")):
            if not perms & bit:
                problems.append(f"The bot's role is missing the {label} permission.")
    mapped = set(RoleMapping.objects.values_list("role_id", flat=True))
    for rid in sorted(mapped):
        r = by_id.get(rid)
        if r is None:
            problems.append("A mapped role no longer exists on the server; remove it from the role mapping.")
        elif r["position"] >= top:
            problems.append(f"The role {r['name']} is above the bot's own role, so the bot can't give it. Drag the bot's role above it in Server Settings → Roles.")
    s.guild_name = g.get("name", "")[:100]
    s.save(update_fields=["guild_name"])
    # Refresh stored role names, which members see.
    for m in RoleMapping.objects.all():
        if m.role_id in by_id and m.role_name != by_id[m.role_id]["name"]:
            m.role_name = by_id[m.role_id]["name"][:100]
            m.save(update_fields=["role_name"])
    return {
        "guild": {"id": g["id"], "name": g.get("name", ""), "icon": f"https://cdn.discordapp.com/icons/{g['id']}/{g['icon']}.png?size=128" if g.get("icon") else None,
                  "members": g.get("approximate_member_count")},
        "bot": {"id": bot["id"], "name": bot.get("username", ""), "on_server": bot_member is not None},
        "roles": [
            {"id": r["id"], "name": r["name"], "color": f"#{r['color']:06x}" if r.get("color") else None, "position": r["position"],
             "assignable": r["position"] < top and not r.get("managed") and r["id"] != s.guild_id}
            for r in sorted(role_list, key=lambda r: -r["position"]) if r["id"] != s.guild_id
        ],
        "problems": problems,
    }


def account_out(acct: DiscordAccount, with_user: bool = False) -> dict:
    out = {
        "discord_id": acct.discord_id,
        "username": acct.username,
        "avatar": acct.avatar_url,
        "linked_at": acct.linked_at.isoformat(),
        "synced_at": acct.synced_at.isoformat() if acct.synced_at else None,
        "error": acct.sync_error,
        "nickname": acct.nickname,
        "roles": acct.roles,
    }
    if with_user:
        u = acct.user
        out["user"] = {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id or 1, 64)}
        out["has_access"] = has_access(u)
    return out
