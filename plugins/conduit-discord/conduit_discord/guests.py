"""Temporary access: links that let someone without an account here onto the Discord server for a while.

Whoever opens a link signs in with Discord, and the bot adds them to the server with two roles, the same way it
adds members: the guest role, which they keep for good, and the temporary role, which they have while the link
lasts. Each guest is recorded with the link they came through, so when the link runs out or is withdrawn (or its
maker may no longer hand out access) exactly those people lose what the link gave them: the temporary role and
their channels, and, when the site is set to remove guests, their place on the server. The guest role stays, so
it shows who has been a guest, and, hidden from every channel when channels are limited, leaves them seeing nothing.

A site set up before there were two roles has only the guest role; it is then the one taken away.

Rules that keep a link from doing harm: someone who was on the server before using a link is never removed from
it; a temporary role they already had by hand is left with them; a Discord account linked to a member here is
refused, since members have their own access; and a guest who becomes a member loses the guest role, which would
otherwise hide the members' channels from them.
"""

from __future__ import annotations

import logging
import math
import secrets
from datetime import timedelta

from django.conf import settings as django_settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.events import bus

from . import discord_api as api
from .models import DiscordAccount, DiscordSettings, Guest, GuestLink
from .services import LinkError, desired_roles, explain

log = logging.getLogger(__name__)

CREATE_PERM = "discord.create_guest_links"
MANAGE_PERM = "discord.manage_discord"
SESSION_KEY = "conduit_discord_guest"
MAX_USES = 1000
NICK_MAX = 32
END_ACTIONS = ("role", "kick")
#: The most an administrator can allow a link to last (30 days).
HOURS_CEILING = 720


def redirect_uri() -> str:
    """Where Discord sends guests back to. It has to be added to the Discord application next to the members' one."""
    return f"{django_settings.SITE_URL}/public/p/discord/guest"


def link_url(link: GuestLink) -> str:
    return f"{django_settings.SITE_URL}/public/p/discord/guest/{link.token}"


def may_create(user) -> bool:
    return user.is_active and user.has_perm(CREATE_PERM)


def status(link: GuestLink, now=None) -> str:
    """active, expired, revoked, used_up (still good for the guests it has) or creator_lost."""
    now = now or timezone.now()
    if link.revoked_at:
        return "revoked"
    if link.expires_at <= now:
        return "expired"
    if link.created_by is None or not may_create(link.created_by):
        return "creator_lost"
    if link.max_uses and link.guests.count() >= link.max_uses:
        return "used_up"
    return "active"


def _ended_reason(link: GuestLink, now) -> str:
    """Why the guests of this link have to go now, or "" while they may stay."""
    st = status(link, now)
    return "" if st in ("active", "used_up") else st


def _ready(s: DiscordSettings) -> None:
    if not s.configured:
        raise LinkError("Discord isn't set up on this site yet")
    if not s.guest_enabled:
        raise LinkError("Temporary access is switched off", 404)
    if not s.guest_role_id:
        raise LinkError("No guest role is chosen yet; a Discord manager picks one under Server setup")


# --- which channels guests see --------------------------------------------------------------------------------------
#
# Discord works out what someone sees in a channel from the server's permissions for @everyone and their roles, then
# the channel's own exceptions ("overwrites"): for @everyone, for their roles, and last for them personally. So the
# guest role is denied View Channel in every channel it could otherwise see, and each guest is allowed, personally,
# into the channels of their link. The personal exception wins over the role's.


def _bits(value) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _overwrite(channel: dict, target_id: str) -> tuple[int, int]:
    for o in channel.get("permission_overwrites") or []:
        if str(o.get("id")) == target_id:
            return _bits(o.get("allow")), _bits(o.get("deny"))
    return 0, 0


def roles_see(channel: dict, guild_id: str, role_ids: list[str], base: int) -> bool:
    """Whether someone with exactly these roles can see the channel. ``base`` is what @everyone and those roles
    are allowed server-wide."""
    if base & api.ADMINISTRATOR:
        return True
    allow, deny = _overwrite(channel, guild_id)  # @everyone's exception first
    perms = (base & ~deny) | allow
    allow = deny = 0
    for role_id in role_ids:  # then the roles' together, where one role's allow beats another's deny
        a, d = _overwrite(channel, role_id)
        allow, deny = allow | a, deny | d
    perms = (perms & ~deny) | allow
    return bool(perms & api.VIEW_CHANNEL)


def taken_role(link: GuestLink) -> str:
    """The role a stay through this link ends by taking away."""
    return link.temp_role_id or link.role_id


def channel_out(c: dict, names: dict | None = None) -> dict:
    out = {"id": str(c["id"]), "name": c.get("name", ""), "kind": api.OPENABLE.get(c.get("type"), "text")}
    if names is not None:
        out["category"] = names.get(str(c.get("parent_id") or ""), "")
    return out


def available_channels(s: DiscordSettings | None = None) -> list[dict]:
    """The server's channels that can be opened to guests, in the order Discord shows them."""
    s = s or DiscordSettings.load()
    try:
        rows = api.channels(s.bot_token, s.guild_id)
    except api.DiscordError as exc:
        raise LinkError(explain(exc), 502) from None
    cats = {str(c["id"]): c for c in rows if c.get("type") == api.CATEGORY}
    names = {cid: c.get("name", "") for cid, c in cats.items()}
    order = lambda c: (cats.get(str(c.get("parent_id") or ""), {}).get("position", -1), c.get("type") in (2, 13), c.get("position", 0))  # noqa: E731
    return [channel_out(c, names) for c in sorted(rows, key=order) if c.get("type") in api.OPENABLE]


def hide_other_channels(s: DiscordSettings, *, change: bool = True) -> list[str]:
    """Hide every channel from guests: deny the guest role View Channel wherever a guest (with the guest role, with
    or without the temporary one) could see a channel, and take away any exception that lets the temporary role
    in. Returns the names of channels guests can still see afterwards (the bot wasn't allowed to change them);
    with ``change`` off it only looks, and returns every channel that needs hiding. Nothing is written for
    channels that are hidden already, so once the server is in order this is a single question to Discord."""
    if not (s.guest_channels and s.guest_role_id):
        return []
    rows = api.channels(s.bot_token, s.guild_id)
    by_id = {r["id"]: r for r in api.roles(s.bot_token, s.guild_id)}
    guest, temp = s.guest_role_id, s.guest_temp_role_id
    everyone = _bits(by_id.get(s.guild_id, {}).get("permissions"))
    alone = everyone | _bits(by_id.get(guest, {}).get("permissions"))
    both = alone | _bits(by_id.get(temp, {}).get("permissions"))
    if both & api.ADMINISTRATOR:
        return ["every channel (a role guests get, or @everyone, has Administrator)"]
    left = []
    for c in rows:
        # During the stay they have both roles, afterwards the guest role alone.
        if not (roles_see(c, s.guild_id, [guest], alone) or (temp and roles_see(c, s.guild_id, [guest, temp], both))):
            continue
        name = ("" if c.get("type") == api.CATEGORY else "#") + c.get("name", str(c["id"]))
        if not change:
            left.append(name)
            continue
        try:
            allow, deny = _overwrite(c, guest)
            if allow & api.VIEW_CHANNEL or not deny & api.VIEW_CHANNEL:
                api.set_overwrite(s.bot_token, str(c["id"]), guest, member=False,
                                  allow=allow & ~api.VIEW_CHANNEL, deny=deny | api.VIEW_CHANNEL)
            allow, deny = _overwrite(c, temp) if temp else (0, 0)
            if allow & api.VIEW_CHANNEL:  # it would win over the guest role's denial
                api.set_overwrite(s.bot_token, str(c["id"]), temp, member=False, allow=allow & ~api.VIEW_CHANNEL, deny=deny)
        except api.DiscordError as exc:
            if exc.status == 429 or exc.status == 0:
                raise
            log.warning("Couldn't hide channel %s from guests: %s", c.get("name"), exc)
            left.append(name)
    return left


def seen_without_roles(s: DiscordSettings) -> list[str]:
    """The channels someone on the server with no role at all can see. On a site with no temporary role, where the
    guest role is taken away when a link ends, this is what former guests see from then on: more than as a guest,
    if channels are limited."""
    rows = api.channels(s.bot_token, s.guild_id)
    by_id = {r["id"]: r for r in api.roles(s.bot_token, s.guild_id)}
    base = _bits(by_id.get(s.guild_id, {}).get("permissions"))
    return [("#" if c.get("type") not in (2, 13) else "") + c.get("name", str(c["id"])) for c in rows
            if c.get("type") in api.OPENABLE and roles_see(c, s.guild_id, [], base)]


def _open_channels(s: DiscordSettings, link: GuestLink, discord_id: str) -> None:
    for c in link.channels:
        api.set_overwrite(s.bot_token, c["id"], discord_id, member=True, allow=api.VIEW_CHANNEL | api.CONNECT)


def _close_channels(s: DiscordSettings, link: GuestLink, discord_id: str) -> None:
    for c in link.channels:
        api.delete_overwrite(s.bot_token, c["id"], discord_id)


def set_channels(s: DiscordSettings, channel_ids: list[str]) -> None:
    """Choose the channels guests may be let into ([] stops limiting them). Hiding the rest is the caller's next
    step (``hide_other_channels``)."""
    wanted = list(dict.fromkeys(channel_ids))
    if wanted:
        known = {c["id"]: c for c in available_channels(s)}
        if any(cid not in known for cid in wanted):
            raise LinkError("One of the chosen channels isn't on the server any more; reload and choose again")
        wanted = [{k: known[cid][k] for k in ("id", "name", "kind")} for cid in wanted]
    s.guest_channels = wanted
    s.save(update_fields=["guest_channels"])


# --- making and withdrawing links ----------------------------------------------------------------------------------


def create_link(user, label: str, hours: float, max_uses: int = 0, channel_ids: list[str] | None = None) -> GuestLink:
    s = DiscordSettings.load()
    _ready(s)
    if not may_create(user):
        raise LinkError("You can't hand out temporary Discord access", 403)
    label = " ".join(label.split())[:100]
    if not label:
        raise LinkError("Say what the link is for")
    if not hours or not math.isfinite(hours) or hours <= 0:
        raise LinkError("Say how long the link lasts")
    if hours > s.guest_max_hours:
        raise LinkError(f"Links may last at most {s.guest_max_hours} hours")
    if not 0 <= max_uses <= MAX_USES:
        raise LinkError(f"A link can be used by at most {MAX_USES} people")
    channels = []
    if s.guest_channels:
        allowed = {c["id"]: c for c in s.guest_channels}
        # Not saying which means all of them.
        picked = list(dict.fromkeys(channel_ids)) if channel_ids else list(allowed)
        if any(cid not in allowed for cid in picked):
            raise LinkError("Guests can't be let into one of those channels; choose from the ones offered")
        channels = [allowed[cid] for cid in picked]
    link = GuestLink.objects.create(
        token=secrets.token_urlsafe(24), label=label, created_by=user, max_uses=max_uses, channels=channels,
        expires_at=timezone.now() + timedelta(hours=hours), role_id=s.guest_role_id, role_name=s.guest_role_name,
        temp_role_id=s.guest_temp_role_id, temp_role_name=s.guest_temp_role_name,
    )
    bus.emit("discord.guest_link_created", user_id=user.pk, user=user.display_name, label=label,
             summary=f"{user.display_name} made a temporary Discord link \"{label}\" ({hours:g} h)")
    return link


def guest_nickname(fmt: str, name: str) -> str | None:
    """How a guest appears on the server, cut to Discord's 32 characters; None when names are left alone."""
    if not fmt:
        return None
    try:
        nick = fmt.format(name=name)
    except (KeyError, IndexError, ValueError):
        return None
    return " ".join(nick.split())[:NICK_MAX] or None


def check_nickname_format(fmt: str) -> None:
    try:
        fmt.format(name="")
    except (KeyError, IndexError, ValueError):
        raise LinkError("The guest name has an unknown placeholder; use {name}") from None


def extend_link(link: GuestLink, hours: float) -> GuestLink:
    """Give a running link more time. It never ends later than the longest a new link could last from now."""
    s = DiscordSettings.load()
    _ready(s)
    if not hours or not math.isfinite(hours) or hours <= 0:
        raise LinkError("Say how much longer")
    now = timezone.now()
    with transaction.atomic():
        link = GuestLink.objects.select_for_update().select_related("created_by").get(pk=link.pk)
        if status(link, now) not in ("active", "used_up"):
            raise LinkError("This link has ended; make a new one")
        until = link.expires_at + timedelta(hours=hours)
        if until > now + timedelta(hours=s.guest_max_hours):
            raise LinkError(f"Links may run at most {s.guest_max_hours} hours from now")
        link.expires_at = until
        link.save(update_fields=["expires_at"])
    return link


def can_handle(user, link: GuestLink) -> bool:
    """Its maker, or a Discord manager."""
    return user.has_perm(MANAGE_PERM) or (link.created_by_id == user.pk and may_create(user))


def revoke_link(link: GuestLink) -> int:
    """Withdraw the link and remove its guests. Returns how many are still on the server (Discord couldn't be
    reached for them; they are tried again every couple of minutes)."""
    if not link.revoked_at:
        link.revoked_at = timezone.now()
        link.save(update_fields=["revoked_at"])
    return _end_guests(list(link.guests.filter(ended_at__isnull=True)), "revoked")


def remove_guest(guest: Guest) -> None:
    """Take one guest off the server now. Raises LinkError when Discord couldn't be reached."""
    if guest.ended_at is None and not _end(guest, "removed", DiscordSettings.load()):
        raise LinkError(f"Couldn't remove them on Discord ({guest.error}); try again in a minute", 502)


# --- a guest using a link -------------------------------------------------------------------------------------------


def get_link(token: str) -> GuestLink:
    link = GuestLink.objects.filter(token=token).select_related("created_by").first() if token else None
    if link is None or not DiscordSettings.load().guest_enabled:
        raise LinkError("No such link", 404)
    return link


def start(request, link: GuestLink) -> str:
    """The Discord page to send the guest to. The state ties the answer to this browser and this link."""
    s = DiscordSettings.load()
    _ready(s)
    if status(link) != "active":
        raise LinkError("This link is closed", 410)
    state = secrets.token_urlsafe(24)
    request.session[SESSION_KEY] = {"state": state, "token": link.token}
    return api.authorize_url(s.client_id, redirect_uri(), state)


def finish(request, code: str, state: str) -> Guest:
    flow = request.session.pop(SESSION_KEY, None)
    if not flow or not secrets.compare_digest(flow.get("state", ""), state or ""):
        raise LinkError("This sign-in with Discord has expired or came from another browser; open the link again")
    s = DiscordSettings.load()
    _ready(s)
    link = get_link(flow.get("token", ""))
    try:
        token = api.exchange_code(s.client_id, s.client_secret, code, redirect_uri())
        info = api.current_user(token)
    except api.DiscordError as exc:
        raise LinkError(f"Discord didn't accept the sign-in: {exc}") from None
    discord_id = str(info["id"])
    username = (info.get("global_name") or info.get("username") or discord_id)[:100]
    if DiscordAccount.objects.filter(discord_id=discord_id).exists():
        raise LinkError("This Discord account is linked to a member here, who has their own access to the server", 409)
    staying = Guest.objects.filter(discord_id=discord_id, ended_at__isnull=True).select_related("link").first()
    if staying is not None:
        if staying.link_id == link.pk:
            return staying  # opened the same link twice
        raise LinkError("You're already on the server through another link", 409)
    try:
        with transaction.atomic():
            link = GuestLink.objects.select_for_update().select_related("created_by").get(pk=link.pk)
            if status(link) != "active":
                raise LinkError("This link is closed", 410)
            # Recorded before asking Discord, inside the lock, so the uses limit holds when several arrive at once.
            guest = Guest.objects.create(link=link, discord_id=discord_id, username=username, avatar_url=api.avatar_url(info))
            try:
                # Before they are on the server: nobody is let in while a channel can't be hidden from guests.
                seen = hide_other_channels(s)
                if seen:
                    log.warning("Guests could see %s; refusing to add a guest", ", ".join(seen[:10]))
                    raise LinkError("Guests can't be let in right now: the server isn't ready for them. Tell whoever gave "
                                    "you the link that a Discord manager needs to look at Server setup.", 503)
                member = api.member(s.bot_token, s.guild_id, discord_id)
                nick = guest_nickname(s.guest_nickname_format, username)
                roles = list(dict.fromkeys([link.role_id, taken_role(link)]))
                if member is None:
                    api.add_member(s.bot_token, s.guild_id, discord_id, token, roles, nick)
                    guest.nick_set = bool(nick)
                else:
                    # On the server already (often a guest from an earlier link, still with the guest role): they
                    # get the roles for now and are never removed from the server because of this link.
                    guest.was_on_server = True
                    guest.had_role = taken_role(link) in member.get("roles", [])
                    for role in roles:
                        if role not in member.get("roles", []):
                            api.add_role(s.bot_token, s.guild_id, discord_id, role)
                    if nick and member.get("nick") != nick:
                        try:
                            api.modify_member(s.bot_token, s.guild_id, discord_id, nick=nick)
                            guest.nick_set, guest.previous_nick = True, (member.get("nick") or "")[:NICK_MAX]
                        except api.DiscordError as exc:
                            if exc.status != 403:  # the server owner's name can't be changed by anyone
                                raise
                guest.save(update_fields=["was_on_server", "had_role", "nick_set", "previous_nick"])
                try:
                    _open_channels(s, link, discord_id)
                except api.DiscordError:
                    # With the role but seeing nothing: undo it rather than leave them stranded. Each step is
                    # tried whatever the one before did.
                    for undo in (lambda: _take_back(s, guest),
                                 *(lambda c=c: api.delete_overwrite(s.bot_token, c["id"], discord_id) for c in link.channels)):
                        try:
                            undo()
                        except api.DiscordError as failed:
                            log.warning("Tidying up after guest %s couldn't be let in: %s", discord_id, failed)
                    raise
            except api.DiscordError as exc:
                log.warning("Couldn't add guest %s through link %s: %s", discord_id, link.pk, exc)
                raise LinkError(f"Discord wouldn't add you to the server: {explain(exc)}", 502) from None
    except IntegrityError:
        raise LinkError("You're already on the server through another link", 409) from None
    bus.emit("discord.guest_joined", user_id=link.created_by_id, user=link.created_by.display_name if link.created_by else "",
             discord=username, label=link.label, summary=f"{username} joined Discord through the temporary link \"{link.label}\"")
    return guest


# --- ending stays ---------------------------------------------------------------------------------------------------


def _take_back(s: DiscordSettings, guest: Guest, *, keep_role: bool = False, drop_guest_role: bool = False) -> None:
    """Undo what the link gave on the server itself: the temporary role and the guest name, or their place on the
    server when guests are removed and they weren't there before. The guest role stays with them, unless
    ``drop_guest_role``."""
    link = guest.link
    if not guest.was_on_server and s.guest_end_action == "kick" and not keep_role:
        api.kick(s.bot_token, s.guild_id, guest.discord_id)  # already gone counts as done
        return
    if not guest.had_role and not keep_role:
        api.remove_role(s.bot_token, s.guild_id, guest.discord_id, taken_role(link))
    if drop_guest_role and link.temp_role_id:
        api.remove_role(s.bot_token, s.guild_id, guest.discord_id, link.role_id)
    if guest.nick_set:
        try:
            api.modify_member(s.bot_token, s.guild_id, guest.discord_id, nick=guest.previous_nick or None)
        except api.DiscordError as exc:
            if exc.status not in (403, 404):  # can't be changed, or they have left: nothing to put back
                raise


def _end(guest: Guest, reason: str, s: DiscordSettings) -> bool:
    """End a guest's stay: their channels close and the temporary role goes (or they are removed from the server,
    when the site is set to do that and they weren't on it before). A guest who became a member here keeps a role
    their groups give them anyway, and loses the guest role, which would hide the members' channels from them. False when Discord couldn't be reached: they stay recorded and are tried
    again."""
    if not s.configured:
        return False
    acct = DiscordAccount.objects.filter(discord_id=guest.discord_id).select_related("user").first()
    try:
        # Their personal access to the link's channels goes in every case: it would outlive the role, and a kick.
        _close_channels(s, guest.link, guest.discord_id)
        if acct is None:
            _take_back(s, guest)
        else:
            reason = "member"
            guest.was_on_server = True  # a member here is never removed because a link ended
            # Their name is the members' one by now; leave it.
            guest.nick_set = False
            wanted = desired_roles(acct.user)
            _take_back(s, guest, keep_role=taken_role(guest.link) in wanted, drop_guest_role=guest.link.role_id not in wanted)
    except api.DiscordError as exc:
        log.warning("Couldn't end the stay of guest %s: %s", guest.discord_id, exc)
        guest.error = explain(exc)[:300]
        guest.save(update_fields=["error"])
        return False
    guest.ended_at, guest.ended_reason, guest.error = timezone.now(), reason, ""
    guest.save(update_fields=["ended_at", "ended_reason", "error"])
    bus.emit("discord.guest_removed", discord=guest.username, label=guest.link.label, reason=reason,
             summary=f"{guest.username}'s temporary Discord access through \"{guest.link.label}\" ended ({reason.replace('_', ' ')})")
    return True


def became_member(acct: DiscordAccount, s: DiscordSettings) -> None:
    """A Discord account was linked to a member here. If they are or were a guest, that is over: a stay still
    running ends, and the guest role they kept goes, since it would hide the members' channels from them."""
    for guest in Guest.objects.filter(discord_id=acct.discord_id, ended_at__isnull=True).select_related("link__created_by"):
        _end(guest, "member", s)
    kept = set(GuestLink.objects.filter(guests__discord_id=acct.discord_id).exclude(temp_role_id="").values_list("role_id", flat=True))
    for role in kept - desired_roles(acct.user):
        try:
            api.remove_role(s.bot_token, s.guild_id, acct.discord_id, role)
        except api.DiscordError as exc:
            log.warning("Couldn't take the guest role from new member %s: %s", acct.discord_id, exc)


def _end_guests(guests: list[Guest], reason: str) -> int:
    s = DiscordSettings.load()
    return sum(0 if _end(g, reason, s) else 1 for g in guests)


def end_due() -> dict:
    """Remove the guests of every link that has run out, was withdrawn, or whose maker may no longer hand out
    access. Runs every couple of minutes; asks Discord only when there is someone to remove."""
    now = timezone.now()
    s = DiscordSettings.load()
    ended = waiting = 0
    reasons: dict[int, str] = {}
    staying = list(Guest.objects.filter(ended_at__isnull=True).select_related("link__created_by"))
    if staying and s.configured and s.guest_enabled and s.guest_channels:
        # A channel made since the last look would be open to the guests who are here: hide it.
        try:
            seen = hide_other_channels(s)
            if seen:
                log.warning("Guests can see channels the bot can't hide: %s", ", ".join(seen[:10]))
        except api.DiscordError as exc:
            log.warning("Couldn't check which channels guests see: %s", exc)
    for guest in staying:
        if guest.link_id not in reasons:
            # Switched off for the whole site: everyone still here on a link goes.
            reasons[guest.link_id] = _ended_reason(guest.link, now) if s.guest_enabled else "revoked"
        reason = reasons[guest.link_id]
        if not reason:
            continue
        if _end(guest, reason, s):
            ended += 1
        else:
            waiting += 1
    return {"ended": ended, "waiting": waiting}


# --- output ---------------------------------------------------------------------------------------------------------


def _role_label(link: GuestLink) -> str:
    """The role its guests have for the time."""
    return link.temp_role_name or link.temp_role_id or link.role_name or link.role_id


def guest_out(g: Guest) -> dict:
    return {
        "id": g.pk, "discord_id": g.discord_id, "username": g.username, "avatar": g.avatar_url,
        "joined_at": g.joined_at.isoformat(), "ended_at": g.ended_at.isoformat() if g.ended_at else None,
        "ended_reason": g.ended_reason, "error": g.error, "was_on_server": g.was_on_server,
    }


def link_out(link: GuestLink) -> dict:
    guests = list(link.guests.all())
    return {
        "id": link.pk, "label": link.label, "url": link_url(link), "status": status(link),
        "created_at": link.created_at.isoformat(), "expires_at": link.expires_at.isoformat(),
        # When it stopped working, for the ones that have.
        "ended_at": min(link.revoked_at or link.expires_at, link.expires_at).isoformat(),
        "max_uses": link.max_uses, "uses": len(guests), "role": _role_label(link),
        "channels": link.channels,
        "created_by": {"id": link.created_by_id, "name": link.created_by.display_name} if link.created_by else None,
        "guests": [guest_out(g) for g in guests],
    }


def history(user, q: str = ""):
    """Everyone who came through a link, newest first; a link maker sees their own links' guests, a Discord manager
    everyone's. ``q`` matches the Discord name or id, the link's label, or who made it."""
    from django.db.models import Q

    rows = Guest.objects.select_related("link__created_by__main_character").order_by("-joined_at", "-pk")
    if not user.has_perm(MANAGE_PERM):
        rows = rows.filter(link__created_by=user)
    q = " ".join(q.split())[:100]
    if q:
        rows = rows.filter(Q(username__icontains=q) | Q(discord_id=q) | Q(link__label__icontains=q)
                           | Q(link__created_by__main_character__name__icontains=q))
    return rows


def history_out(g: Guest) -> dict:
    link = g.link
    return {**guest_out(g), "link": {"id": link.pk, "label": link.label, "role": _role_label(link),
                                     "channels": link.channels, "expires_at": link.expires_at.isoformat()},
            "invited_by": link.created_by.display_name if link.created_by else None}


def overview(user) -> dict:
    s = DiscordSettings.load()
    manage = user.has_perm(MANAGE_PERM)
    links = GuestLink.objects.select_related("created_by__main_character").prefetch_related("guests")
    if not manage:
        links = links.filter(created_by=user)
    return {
        "enabled": s.guest_enabled and s.configured and bool(s.guest_role_id),
        "can_manage": manage,
        "max_hours": s.guest_max_hours,
        # The role guests have for the time, and the one they keep (None on a site with only a guest role).
        "role": s.guest_temp_role_name or s.guest_temp_role_id or s.guest_role_name or s.guest_role_id,
        "kept_role": (s.guest_role_name or s.guest_role_id) if s.guest_temp_role_id else None,
        # Whether guests are removed from the server when a link ends, or only lose the role.
        "end_action": s.guest_end_action,
        # The channels a link can open; empty when guests simply see what the guest role sees.
        "channels": s.guest_channels,
        "server": s.guild_name,
        "links": [link_out(link) for link in links[:200]],
    }
