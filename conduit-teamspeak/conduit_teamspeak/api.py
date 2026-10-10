"""Mounted at /api/p/teamspeak/. Only reachable while the plugin is enabled."""

from django.contrib.auth.models import Group
from django.core.cache import cache
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.access.models import State
from conduit.accounts.models import User
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services, tasks
from .models import GroupMapping, TeamSpeakSettings, TeamSpeakUser

router = Router(tags=["teamspeak"], auth=django_auth)

#: Seconds between "Fix my groups" presses per member, and between "Check now" presses while a link is pending.
SYNC_COOLDOWN, CHECK_COOLDOWN = 30, 3


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.TeamSpeakError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _server(s: TeamSpeakSettings) -> dict:
    return {"name": s.display_name, "host": s.host, "port": s.public_port}


# --- members ---------------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    s = TeamSpeakSettings.load()
    user = request.user
    acct = TeamSpeakUser.objects.filter(user=user).select_related("user").first()
    return {
        "configured": s.configured,
        "server": _server(s),
        "can_link": services.has_access(user),
        "account": services.account_out(acct, s) if acct else None,
        "groups_due": services.group_names(s, services.desired_groups(user)),
        "registered_group": s.group_name(s.registered_sgid) if s.registered_sgid else None,
        "nickname": services.nickname_for(user, s) if s.configured else None,
        "url": services.connect_url(s, services.nickname_for(user, s)) if s.configured else None,
    }


@router.post("/link")
def start_link(request):
    """A privilege key for the member (a new one if they lost the last)."""
    acct = _run(services.start_link, request.user)
    record("teamspeak.link_started", "started linking their TeamSpeak identity", request=request, target_type="plugin", details={"plugin": "teamspeak"})
    return {**me(request), "privilege_key": acct.privilege_key}


@router.post("/link/check")
def check_link(request):
    """Has the key been used yet? ``found`` says; the rest is ``me``."""
    if not cache.add(f"teamspeak:check:{request.user.pk}", True, timeout=CHECK_COOLDOWN):
        raise HttpError(429, "Checked a moment ago; wait a few seconds")
    found = _run(services.check_link, request.user)
    if found:
        acct = TeamSpeakUser.objects.get(user=request.user)
        record("teamspeak.linked", f"linked TeamSpeak identity {acct.nickname or acct.uid}", request=request, target_type="plugin",
               details={"plugin": "teamspeak", "uid": acct.uid, "cldbid": acct.cldbid})
    return {**me(request), "found": found}


@router.delete("/link")
def unlink(request):
    """Unlink the identity, or give up a pending link."""
    acct = TeamSpeakUser.objects.filter(user=request.user).first()
    pending = acct is not None and acct.pending
    _run(services.unlink, request.user)
    record("teamspeak.unlink", "gave up linking TeamSpeak" if pending else f"unlinked TeamSpeak identity {acct.nickname or acct.uid if acct else ''}".strip(),
           request=request, target_type="plugin", details={"plugin": "teamspeak"})
    return me(request)


@router.post("/sync")
def sync_me(request):
    """Fix my groups now."""
    if not cache.add(f"teamspeak:sync:{request.user.pk}", True, timeout=SYNC_COOLDOWN):
        raise HttpError(429, f"Your groups were just checked; try again in {SYNC_COOLDOWN} seconds")
    error = services.sync_user(request.user)
    if error:
        raise HttpError(400, error)
    return me(request)


# --- admin ---------------------------------------------------------------------------------------------------------


def admin_out() -> dict:
    s = TeamSpeakSettings.load()
    mappings = GroupMapping.objects.select_related("group", "state")
    linked = TeamSpeakUser.objects.filter(cldbid__isnull=False)
    return {
        "settings": {
            "query_host": s.query_host,
            "query_port": s.query_port,
            "query_user": s.query_user,
            "query_password_set": bool(s.query_password),
            "server_id": s.server_id,
            "public_host": s.public_host,
            "public_port": s.public_port,
            "server_name": s.server_name,
            "nickname_format": s.nickname_format,
            "registered_sgid": s.registered_sgid,
            "kick_without_access": s.kick_without_access,
            "require_for_compliance": s.require_for_compliance,
            "allowlisted": s.allowlisted,
            "configured": s.configured,
            "virtual_server_name": s.virtual_server_name,
            "server_version": s.server_version,
            "checked_at": s.checked_at.isoformat() if s.checked_at else None,
            "last_full_sync": s.last_full_sync.isoformat() if s.last_full_sync else None,
        },
        "server_groups": s.server_groups,
        "mappings": [
            {"id": m.pk, "kind": "group" if m.group_id else "state", "target_id": m.group_id or m.state_id,
             "target": m.group.name if m.group_id else m.state.name, "sgid": m.sgid, "sg_name": m.sg_name or s.group_name(m.sgid)}
            for m in mappings
        ],
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "states": [{"id": st.pk, "name": st.name, "color": st.color} for st in State.objects.all()],
        "stats": {"linked": linked.count(), "pending": TeamSpeakUser.objects.filter(cldbid__isnull=True).count(), "errors": linked.exclude(sync_error="").count()},
    }


@router.get("/admin")
@require_perm("teamspeak.manage_teamspeak")
def admin(request):
    return admin_out()


class SettingsIn(Schema):
    query_host: str = ""
    query_port: int = 10011
    query_user: str = ""
    #: Empty keeps the stored password.
    query_password: str = ""
    server_id: int = 1
    public_host: str = ""
    public_port: int = 9987
    server_name: str = ""
    nickname_format: str = "[{corp_ticker}] {character}"
    registered_sgid: int = 0
    kick_without_access: bool = False
    require_for_compliance: bool = False
    allowlisted: bool = False


def _host(value: str, label: str) -> str:
    host = value.strip().lower().removeprefix("ts3server://").rstrip("/")
    if host and (" " in host or "/" in host or "@" in host or "?" in host):
        raise HttpError(400, f"{label} is a host name or IP address, without ts3server:// or a path")
    return host[:200]


@router.put("/admin/settings")
@require_perm("teamspeak.manage_teamspeak")
def put_settings(request, payload: SettingsIn):
    s = TeamSpeakSettings.load()
    query_host, public_host = _host(payload.query_host, "The query address"), _host(payload.public_host, "The address members connect to")
    for port in (payload.query_port, payload.public_port):
        if not 1 <= port <= 65535:
            raise HttpError(400, "Ports are numbers between 1 and 65535")
    if payload.server_id < 1:
        raise HttpError(400, "The virtual server id is 1 or higher")
    nickname_format = payload.nickname_format.strip()[:100] or "{character}"
    _run(services.check_format, nickname_format)
    if payload.registered_sgid and s.server_groups and payload.registered_sgid not in {g["sgid"] for g in s.server_groups}:
        raise HttpError(400, "Pick the registered group from the server's groups")
    s.query_host, s.query_port, s.query_user, s.server_id = query_host, payload.query_port, payload.query_user.strip()[:100], payload.server_id
    if payload.query_password:
        s.query_password = payload.query_password
    s.public_host, s.public_port, s.server_name = public_host, payload.public_port, payload.server_name.strip()[:100]
    s.nickname_format, s.registered_sgid = nickname_format, max(0, payload.registered_sgid)
    s.kick_without_access, s.require_for_compliance, s.allowlisted = payload.kick_without_access, payload.require_for_compliance, payload.allowlisted
    s.save()
    record("teamspeak.settings", "changed the TeamSpeak settings", request=request, target_type="plugin", details={"plugin": "teamspeak"})
    return admin_out()


@router.post("/admin/check")
@require_perm("teamspeak.manage_teamspeak")
def check(request):
    """Connect to the server and refresh what's known about it."""
    result = _run(services.server_check)
    return {"check": result, "admin": admin_out()}


class MappingIn(Schema):
    kind: str  # group or state
    target_id: int
    sgid: int


class MappingsIn(Schema):
    mappings: list[MappingIn]


@router.put("/admin/mappings")
@require_perm("teamspeak.manage_teamspeak")
def put_mappings(request, payload: MappingsIn):
    s = TeamSpeakSettings.load()
    known = {g["sgid"] for g in s.server_groups}
    rows, seen = [], set()
    for m in payload.mappings:
        if m.kind not in ("group", "state"):
            raise HttpError(400, "A mapping is for a group or a state")
        model = Group if m.kind == "group" else State
        if not model.objects.filter(pk=m.target_id).exists():
            raise HttpError(400, f"No such {m.kind}")
        if m.sgid < 1 or (known and m.sgid not in known):
            raise HttpError(400, "Pick a server group from the server's groups (check the connection under Setup to refresh them)")
        key = (m.kind, m.target_id, m.sgid)
        if key in seen:
            continue
        seen.add(key)
        rows.append(GroupMapping(group_id=m.target_id if m.kind == "group" else None, state_id=m.target_id if m.kind == "state" else None,
                                 sgid=m.sgid, sg_name=s.group_name(m.sgid)[:100]))
    GroupMapping.objects.all().delete()
    GroupMapping.objects.bulk_create(rows)
    record("teamspeak.mappings", f"set {len(rows)} TeamSpeak group mapping{'s' if len(rows) != 1 else ''}", request=request, target_type="plugin",
           details={"plugin": "teamspeak"})
    tasks.sync_all.delay()
    return admin_out()


@router.get("/admin/members")
@require_perm("teamspeak.manage_teamspeak")
def members(request):
    s = TeamSpeakSettings.load()
    accounts = list(TeamSpeakUser.objects.select_related("user__main_character", "user__state").prefetch_related("user__groups")
                    .order_by("user__main_character__name"))
    characters = services.linked_characters([a.user for a in accounts], request.user)
    return [{**services.account_out(a, s, with_user=True), "characters": characters.get(a.user_id, [])} for a in accounts]


@router.post("/admin/sync")
@require_perm("teamspeak.manage_teamspeak")
def sync_everyone(request):
    if not cache.add("teamspeak:sync-all", True, timeout=60):
        raise HttpError(429, "A sync for everyone was started less than a minute ago")
    tasks.sync_all.delay()
    record("teamspeak.sync", "started a TeamSpeak sync for everyone", request=request, target_type="plugin", details={"plugin": "teamspeak"})
    return {"ok": True}


def _member(user_id: int) -> User:
    user = User.objects.filter(pk=user_id).select_related("main_character__corporation", "main_character__alliance", "state").first()
    if user is None or not TeamSpeakUser.objects.filter(user=user).exists():
        raise HttpError(404, "That member hasn't linked TeamSpeak")
    return user


@router.post("/admin/members/{user_id}/sync")
@require_perm("teamspeak.manage_teamspeak")
def sync_member(request, user_id: int):
    user = _member(user_id)
    error = services.sync_user(user)
    if error:
        raise HttpError(400, error)
    s = TeamSpeakSettings.load()
    return services.account_out(TeamSpeakUser.objects.get(user=user), s, with_user=True)


@router.delete("/admin/members/{user_id}")
@require_perm("teamspeak.manage_teamspeak")
def remove_member(request, user_id: int, force: bool = False):
    """Unlink a member. ``force`` forgets the link even if the server can't be reached to take the groups away."""
    user = _member(user_id)
    acct = TeamSpeakUser.objects.get(user=user)
    name = acct.nickname or acct.uid
    _run(services.unlink, user, reason="An administrator unlinked your TeamSpeak identity.", force=force)
    record("teamspeak.unlink", f"unlinked {user.display_name}'s TeamSpeak identity {name}".rstrip(), request=request, target=user,
           details={"plugin": "teamspeak", "force": force})
    return {"ok": True}
