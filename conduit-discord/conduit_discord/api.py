"""Mounted at /api/p/discord/. Only reachable while the plugin is enabled."""

from django.contrib.auth.models import Group
from django.db import transaction
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.access.models import State
from conduit.accounts.models import User
from conduit.audit.services import record
from conduit.paging import page
from conduit.permissions import require_perm

from . import discord_api, guests, services, tasks
from .models import DiscordAccount, DiscordSettings, Guest, GuestLink, RoleMapping

router = Router(tags=["discord"], auth=django_auth)


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.LinkError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _role_names(acct: DiscordAccount | None) -> list[str]:
    if acct is None:
        return []
    names = dict(RoleMapping.objects.values_list("role_id", "role_name"))
    return sorted({names.get(r) or r for r in acct.roles})


# --- members ---------------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    s = DiscordSettings.load()
    acct = DiscordAccount.objects.filter(user=request.user).first()
    wanted = services.desired_roles(request.user)
    names = dict(RoleMapping.objects.values_list("role_id", "role_name"))
    return {
        "configured": s.configured,
        "server": s.guild_name,
        "server_url": f"https://discord.com/channels/{s.guild_id}" if s.guild_id else None,
        "can_link": services.has_access(request.user),
        # Whether to show Temporary access in the menu's page.
        "can_invite_guests": s.guest_enabled and guests.may_create(request.user),
        "account": services.account_out(acct) if acct else None,
        "roles": _role_names(acct),
        "roles_due": sorted({names.get(r) or r for r in wanted}),
        "nickname": services.nickname_for(request.user, s.nickname_format) if s.configured else None,
    }


@router.post("/link")
def start_link(request):
    return {"url": _run(services.start_link, request)}


class FinishIn(Schema):
    code: str
    state: str


@router.post("/link/finish")
def finish_link(request, payload: FinishIn):
    acct = _run(services.finish_link, request, payload.code, payload.state)
    record("discord.link", f"linked Discord account {acct.username}", request=request, target_type="plugin", details={"plugin": "discord", "discord_id": acct.discord_id})
    return me(request)


@router.post("/unlink")
def unlink(request):
    acct = DiscordAccount.objects.filter(user=request.user).first()
    _run(services.unlink, request.user)
    record("discord.unlink", f"unlinked Discord account {acct.username if acct else ''}".strip(), request=request, target_type="plugin", details={"plugin": "discord"})
    return me(request)


#: Seconds between "Fix my roles" presses per member.
SYNC_COOLDOWN = 30


@router.post("/sync")
def sync_me(request):
    """Fix my roles now (e.g. after rejoining the server)."""
    from django.core.cache import cache

    # Each press calls Discord with the bot's token; don't let anyone hammer it (and get the bot rate limited).
    if not cache.add(f"discord:sync:{request.user.pk}", True, timeout=SYNC_COOLDOWN):
        raise HttpError(429, f"Your roles were just checked; try again in {SYNC_COOLDOWN} seconds")
    error = services.sync_user(request.user)
    if error:
        raise HttpError(400, error)
    return me(request)


# --- admin ---------------------------------------------------------------------------------------------------------


def admin_out() -> dict:
    s = DiscordSettings.load()
    mappings = RoleMapping.objects.select_related("group", "state")
    accounts = DiscordAccount.objects.all()
    return {
        "settings": {
            "client_id": s.client_id,
            "client_secret_set": bool(s.client_secret),
            "bot_token_set": bool(s.bot_token),
            "guild_id": s.guild_id,
            "guild_name": s.guild_name,
            "nickname_format": s.nickname_format,
            "kick_without_access": s.kick_without_access,
            "require_for_compliance": s.require_for_compliance,
            "configured": s.configured,
            "last_full_sync": s.last_full_sync.isoformat() if s.last_full_sync else None,
            "guest_enabled": s.guest_enabled,
            "guest_role_id": s.guest_role_id,
            "guest_role_name": s.guest_role_name,
            "guest_temp_role_id": s.guest_temp_role_id,
            "guest_temp_role_name": s.guest_temp_role_name,
            "guest_max_hours": s.guest_max_hours,
            "guest_channels": s.guest_channels,
            "guest_end_action": s.guest_end_action,
            "guest_nickname_format": s.guest_nickname_format,
        },
        "redirect_uri": services.redirect_uri(),
        "guest_redirect_uri": guests.redirect_uri(),
        "guest_hours_ceiling": guests.HOURS_CEILING,
        "invite_url": discord_api.bot_invite_url(s.client_id, s.guild_id) if s.client_id else None,
        "mappings": [
            {"id": m.pk, "kind": "group" if m.group_id else "state", "target_id": m.group_id or m.state_id,
             "target": m.group.name if m.group_id else m.state.name, "role_id": m.role_id, "role_name": m.role_name}
            for m in mappings
        ],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "states": [{"id": st.pk, "name": st.name, "color": st.color} for st in State.objects.all()],
        "stats": {"linked": accounts.count(), "errors": accounts.exclude(sync_error="").count()},
    }


@router.get("/admin")
@require_perm("discord.manage_discord")
def admin(request):
    return admin_out()


class SettingsIn(Schema):
    client_id: str = ""
    guild_id: str = ""
    #: None keeps the stored secret; "" clears it.
    client_secret: str | None = None
    bot_token: str | None = None
    nickname_format: str = ""
    kick_without_access: bool = False
    require_for_compliance: bool = False


def _snowflake(value: str, label: str) -> str:
    value = value.strip()
    if value and not (value.isdigit() and 15 <= len(value) <= 22):
        raise HttpError(400, f"The {label} is a long number (Discord calls it an ID)")
    return value


@router.put("/admin/settings")
@require_perm("discord.manage_discord")
def put_settings(request, payload: SettingsIn):
    s = DiscordSettings.load()
    s.client_id = _snowflake(payload.client_id, "application id")
    new_guild = _snowflake(payload.guild_id, "server id")
    if new_guild != s.guild_id:
        s.guild_name = ""
    s.guild_id = new_guild
    if payload.client_secret is not None:
        s.client_secret = payload.client_secret.strip()
    if payload.bot_token is not None:
        s.bot_token = payload.bot_token.strip()
    fmt = payload.nickname_format.strip()[:100]
    _run(services.check_nickname_format, fmt)
    s.nickname_format = fmt
    s.kick_without_access = payload.kick_without_access
    compliance_changed = s.require_for_compliance != payload.require_for_compliance
    s.require_for_compliance = payload.require_for_compliance
    s.save()
    if compliance_changed:
        # Everyone's compliance may have changed; the core re-checks everyone every 30 minutes, so start it now.
        try:
            from conduit.access.tasks import update_compliance

            transaction.on_commit(update_compliance.delay)
        except ImportError:
            pass
    changed = [k for k in ("client_secret", "bot_token") if getattr(payload, k) is not None]
    record("discord.settings", "changed the Discord settings" + (f" (new {', '.join(c.replace('_', ' ') for c in changed)})" if changed else ""),
           request=request, target_type="plugin", details={"plugin": "discord"})
    return admin_out()


@router.post("/admin/check")
@require_perm("discord.manage_discord")
def check(request):
    return _run(services.server_check)


class MappingIn(Schema):
    kind: str  # group or state
    target_id: int
    role_id: str
    role_name: str = ""


class MappingsIn(Schema):
    mappings: list[MappingIn]


@router.put("/admin/mappings")
@require_perm("discord.manage_discord")
def put_mappings(request, payload: MappingsIn):
    rows, seen = [], set()
    for m in payload.mappings:
        if m.kind not in ("group", "state"):
            raise HttpError(400, "A mapping is for a group or a state")
        model = Group if m.kind == "group" else State
        if not model.objects.filter(pk=m.target_id).exists():
            raise HttpError(400, f"No such {m.kind}")
        role_id = _snowflake(m.role_id, "role id")
        if not role_id:
            raise HttpError(400, "Pick a role for every row")
        key = (m.kind, m.target_id, role_id)
        if key in seen:
            continue
        seen.add(key)
        rows.append(RoleMapping(group_id=m.target_id if m.kind == "group" else None, state_id=m.target_id if m.kind == "state" else None,
                                role_id=role_id, role_name=m.role_name.strip()[:100]))
    RoleMapping.objects.all().delete()
    RoleMapping.objects.bulk_create(rows)
    record("discord.mappings", f"set {len(rows)} Discord role mapping{'s' if len(rows) != 1 else ''}", request=request, target_type="plugin",
           details={"plugin": "discord"})
    tasks.sync_all.delay()
    return admin_out()


@router.get("/admin/members")
@require_perm("discord.manage_discord")
def members(request):
    names = dict(RoleMapping.objects.values_list("role_id", "role_name"))
    accounts = list(DiscordAccount.objects.select_related("user__main_character").order_by("user__main_character__name"))
    characters = services.linked_characters([a.user for a in accounts], request.user)
    return [{**services.account_out(a, with_user=True), "role_names": sorted({names.get(r) or r for r in a.roles}),
             "characters": characters.get(a.user_id, [])} for a in accounts]


@router.post("/admin/sync")
@require_perm("discord.manage_discord")
def sync_everyone(request):
    if not DiscordSettings.load().configured:
        raise HttpError(400, "Finish the setup first")
    tasks.sync_all.delay()
    record("discord.sync", "started a Discord sync for everyone", request=request, target_type="plugin", details={"plugin": "discord"})
    return {"queued": True}


def _member(user_id: int) -> User:
    user = User.objects.filter(pk=user_id, discord__isnull=False).select_related("main_character").first()
    if user is None:
        raise HttpError(404, "That member hasn't linked Discord")
    return user


@router.post("/admin/members/{user_id}/sync")
@require_perm("discord.manage_discord")
def sync_member(request, user_id: int):
    user = _member(user_id)
    error = services.sync_user(user)
    acct = DiscordAccount.objects.filter(user=user).first()
    if acct is None:
        return {"removed": True}  # lost access and was removed from the server
    return {**services.account_out(acct, with_user=True), "error": error}


@router.delete("/admin/members/{user_id}")
@require_perm("discord.manage_discord")
def remove_member(request, user_id: int, kick: bool = False, force: bool = False):
    """``force``: forget the link even if Discord can't be reached to take the roles away (they stay on Discord then)."""
    user = _member(user_id)
    name = user.discord.username
    _run(services.unlink, user, kick=kick, force=force,
         reason="An administrator " + ("removed you from the Discord server." if kick else "unlinked your Discord account."))
    record("discord.unlink", f"{'kicked' if kick else 'unlinked'} {user.display_name}'s Discord account {name}", request=request, target=user,
           details={"plugin": "discord", "kick": kick})
    return {"ok": True}


# --- temporary access ----------------------------------------------------------------------------------------------


class GuestSettingsIn(Schema):
    enabled: bool = False
    #: The guest role: guests get it and keep it.
    role_id: str = ""
    role_name: str = ""
    #: The temporary role: guests have it while their link lasts. None leaves it as it is; "" is none, and the
    #: guest role is then the one taken away when a link ends.
    temp_role_id: str | None = None
    temp_role_name: str = ""
    max_hours: int = 72
    #: The channels guests may be let into. None leaves them as they are; [] stops limiting channels.
    channels: list[str] | None = None
    #: When a link ends: "role" takes the temporary role away and leaves them on the server, "kick" removes them.
    #: None leaves it as it is.
    end_action: str | None = None
    #: How guests appear, with {name}; "" leaves their name alone. None leaves the setting as it is.
    nickname_format: str | None = None


@router.get("/admin/channels")
@require_perm("discord.manage_discord")
def channels(request):
    """The server's channels, for choosing where guests may go."""
    if not DiscordSettings.load().configured:
        raise HttpError(400, "Finish the setup first")
    return _run(guests.available_channels)


@router.put("/admin/guests")
@require_perm("discord.manage_discord")
def put_guest_settings(request, payload: GuestSettingsIn):
    s = DiscordSettings.load()
    role_id = _snowflake(payload.role_id, "role id")
    if payload.enabled and not role_id:
        raise HttpError(400, "Choose the role guests get before switching temporary access on")
    if role_id and role_id == s.guild_id:
        raise HttpError(400, "Choose a role of its own for guests, not @everyone")
    temp_id = s.guest_temp_role_id if payload.temp_role_id is None else _snowflake(payload.temp_role_id, "role id")
    if temp_id and temp_id == s.guild_id:
        raise HttpError(400, "Choose a role of its own as the temporary role, not @everyone")
    if temp_id and temp_id == role_id:
        raise HttpError(400, "The temporary role and the guest role have to be two different roles")
    if not 1 <= payload.max_hours <= guests.HOURS_CEILING:
        raise HttpError(400, f"Links may last between 1 and {guests.HOURS_CEILING} hours")
    if payload.end_action is not None and payload.end_action not in guests.END_ACTIONS:
        raise HttpError(400, "When a link ends, guests either lose the role or are removed")
    if payload.nickname_format is not None:
        _run(guests.check_nickname_format, payload.nickname_format.strip())
    was_on = s.guest_enabled
    s.guest_enabled, s.guest_role_id, s.guest_role_name = payload.enabled, role_id, payload.role_name.strip()[:100]
    s.guest_max_hours = payload.max_hours
    if payload.temp_role_id is not None:
        s.guest_temp_role_id, s.guest_temp_role_name = temp_id, payload.temp_role_name.strip()[:100] if temp_id else ""
    if payload.end_action is not None:
        s.guest_end_action = payload.end_action
    if payload.nickname_format is not None:
        s.guest_nickname_format = payload.nickname_format.strip()[:60]
    s.save(update_fields=["guest_enabled", "guest_role_id", "guest_role_name", "guest_max_hours", "guest_end_action",
                          "guest_nickname_format", "guest_temp_role_id", "guest_temp_role_name"])
    record("discord.guest_settings", f"switched temporary Discord access {'on' if s.guest_enabled else 'off'}"
           if was_on != s.guest_enabled else "changed the temporary Discord access settings",
           request=request, target_type="plugin", details={"plugin": "discord", "role": s.guest_role_name, "temp_role": s.guest_temp_role_name, "max_hours": s.guest_max_hours})
    if payload.channels is not None:
        ids = [_snowflake(c, "channel id") for c in payload.channels if c.strip()]
        if len(ids) > 50:
            raise HttpError(400, "Choose at most 50 channels")
        _run(guests.set_channels, s, ids)
    # Nothing is changed on Discord for this. Only say what guests see through their roles besides those channels.
    seen: list[str] = []
    try:
        seen = guests.also_seen(s)
    except discord_api.DiscordError:
        pass
    if was_on and not s.guest_enabled:
        tasks.end_guest_stays.delay()  # switched off: the guests still on the server go
    return {**admin_out(), "guest_channels_seen": seen}


@router.post("/admin/guests/undo-channels")
@require_perm("discord.manage_discord")
def undo_guest_channels(request):
    """Stop limiting channels and put every channel's settings back to what they were before the bot changed them."""
    s = DiscordSettings.load()
    if not s.configured:
        raise HttpError(400, "Finish the setup first")
    record("discord.guest_channels_undone", "put the Discord channel settings back as they were before temporary access changed them",
           request=request, target_type="plugin", details={"plugin": "discord"})
    try:
        done = _run(guests.undo_channel_changes, s)
    except discord_api.DiscordError:
        # Rate limited part-way: channels are no longer limited, and the rest is finished in the background.
        tasks.undo_guest_channels.delay()
        return {**admin_out(), "undo": {"restored": 0, "failed": [], "running": True}}
    return {**admin_out(), "undo": {**done, "running": False}}


@router.get("/guests")
@require_perm(guests.CREATE_PERM)
def guest_overview(request):
    """The viewer's links and who came through them; Discord managers see everyone's."""
    return guests.overview(request.user)


class GuestLinkIn(Schema):
    label: str
    hours: float
    max_uses: int = 0
    #: Which of the channels offered this link opens; left out, all of them.
    channels: list[str] | None = None


@router.post("/guests")
@require_perm(guests.CREATE_PERM)
def create_guest_link(request, payload: GuestLinkIn):
    link = _run(guests.create_link, request.user, payload.label, payload.hours, payload.max_uses, payload.channels)
    record("discord.guest_link", f"made the temporary Discord link \"{link.label}\" ({payload.hours:g} h)", request=request,
           target_type="plugin", details={"plugin": "discord", "link_id": link.pk, "max_uses": link.max_uses})
    return guests.link_out(link)


def _guest_link(request, link_id: int) -> GuestLink:
    link = GuestLink.objects.filter(pk=link_id).select_related("created_by").first()
    # Someone else's link looks the same as none, to people who aren't managers.
    if link is None or not guests.can_handle(request.user, link):
        raise HttpError(404, "No such link")
    return link


@router.get("/guests/history")
@require_perm(guests.CREATE_PERM)
def guest_history(request, q: str = "", limit: int = 50, offset: int = 0):
    """Everyone who came through a link, newest first (your own links' guests; Discord managers see everyone's)."""
    return page(guests.history(request.user, q), guests.history_out, limit, offset)


class ExtendIn(Schema):
    hours: float


@router.post("/guests/{link_id}/extend")
@require_perm(guests.CREATE_PERM)
def extend_guest_link(request, link_id: int, payload: ExtendIn):
    """Give a running link more time; its guests stay."""
    link = _run(guests.extend_link, _guest_link(request, link_id), payload.hours)
    record("discord.guest_link_extended", f"gave the temporary Discord link \"{link.label}\" {payload.hours:g} more hours",
           request=request, target_type="plugin", details={"plugin": "discord", "link_id": link.pk, "expires_at": link.expires_at.isoformat()})
    return guests.link_out(link)


@router.delete("/guests/{link_id}")
@require_perm(guests.CREATE_PERM)
def revoke_guest_link(request, link_id: int):
    """Withdraw a link: it stops working and its guests' stay ends."""
    link = _guest_link(request, link_id)
    waiting = guests.revoke_link(link)
    record("discord.guest_link_revoked", f"withdrew the temporary Discord link \"{link.label}\"", request=request,
           target_type="plugin", details={"plugin": "discord", "link_id": link.pk})
    return {**guests.link_out(link), "waiting": waiting}


@router.delete("/guests/users/{guest_id}")
@require_perm(guests.CREATE_PERM)
def remove_guest(request, guest_id: int):
    """End one guest's stay; the link keeps working for the others."""
    guest = Guest.objects.filter(pk=guest_id).select_related("link__created_by").first()
    if guest is None or not guests.can_handle(request.user, guest.link):
        raise HttpError(404, "No such guest")
    _run(guests.remove_guest, guest)
    record("discord.guest_removed", f"ended the temporary Discord access of {guest.username}", request=request,
           target_type="plugin", details={"plugin": "discord", "link_id": guest.link_id, "discord_id": guest.discord_id})
    return guests.link_out(guest.link)
