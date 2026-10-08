"""Mounted at /api/p/discord/. Only reachable while the plugin is enabled."""

from django.contrib.auth.models import Group
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.access.models import State
from conduit.accounts.models import User
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import discord_api, services, tasks
from .models import DiscordAccount, DiscordSettings, RoleMapping

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
            "configured": s.configured,
            "last_full_sync": s.last_full_sync.isoformat() if s.last_full_sync else None,
        },
        "redirect_uri": services.redirect_uri(),
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
    s.save()
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
    accounts = DiscordAccount.objects.select_related("user__main_character").order_by("user__main_character__name")
    return [{**services.account_out(a, with_user=True), "role_names": sorted({names.get(r) or r for r in a.roles})} for a in accounts]


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
