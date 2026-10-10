"""Mounted at /api/p/mumble/. Only reachable while the plugin is enabled."""

from pathlib import Path

from django.conf import settings as django_settings
from django.contrib.auth.models import Group
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from ninja import Router, Schema
from ninja.errors import HttpError
from ninja.security import django_auth

from conduit.access.models import State
from conduit.audit.services import record
from conduit.permissions import require_perm

from . import services
from .models import GroupMapping, MumbleSettings, MumbleUser, TempLink, TempUser

router = Router(tags=["mumble"], auth=django_auth)
AUTHENTICATOR_DIR = Path(__file__).parent / "authenticator"


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.MumbleError as exc:
        raise HttpError(exc.status, str(exc)) from None


def _server(s: MumbleSettings) -> dict:
    return {"name": s.server_name or s.host, "host": s.host, "port": s.port}


# --- members ---------------------------------------------------------------------------------------------------


@router.get("/me")
def me(request):
    s = MumbleSettings.load()
    user = request.user
    acct = MumbleUser.objects.filter(user=user).first()
    return {
        "configured": s.configured,
        "server": _server(s),
        "can_link": services.has_access(user),
        "can_temp": s.temp_enabled and services.can_create_temp_links(user),
        "cert_auth": s.allow_cert_auth,
        "account": services.account_out(acct, s) if acct else None,
        "groups_due": services.desired_groups(user),
        # What a new account would be called.
        "username_preview": services.username_for(user, s) if s.configured and acct is None else None,
        "display_preview": services.display_name_for(user, s) if s.configured else None,
    }


class PasswordIn(Schema):
    #: Empty: one is made up and shown once.
    password: str = ""


@router.post("/account")
def create_account(request, payload: PasswordIn):
    acct, password = _run(services.create_account, request.user, payload.password)
    record("mumble.account_created", f"created Mumble account {acct.username}", request=request, target_type="plugin", details={"plugin": "mumble"})
    s = MumbleSettings.load()
    return {**me(request), "password": password, "connect_url": services.connect_url(s, acct.username, password)}


def _my_account(request) -> MumbleUser:
    acct = MumbleUser.objects.filter(user=request.user).first()
    if acct is None:
        raise HttpError(404, "You don't have a Mumble account")
    return acct


@router.post("/account/password")
def change_password(request, payload: PasswordIn):
    acct = _my_account(request)
    password = _run(services.set_password, acct, payload.password)
    record("mumble.password", "changed their Mumble password", request=request, target_type="plugin", details={"plugin": "mumble"})
    s = MumbleSettings.load()
    return {**me(request), "password": password, "connect_url": services.connect_url(s, acct.username, password)}


@router.delete("/account/certificate")
def forget_certificate(request):
    acct = _my_account(request)
    acct.cert_hash = ""
    acct.save(update_fields=["cert_hash"])
    return me(request)


@router.delete("/account")
def delete_account(request):
    acct = _my_account(request)
    name = acct.username
    services.delete_account(acct)
    record("mumble.account_deleted", f"deleted their Mumble account {name}", request=request, target_type="plugin", details={"plugin": "mumble"})
    return me(request)


# --- temporary access ------------------------------------------------------------------------------------------


def _temp_out(request) -> dict:
    s = MumbleSettings.load()
    manage = request.user.has_perm("mumble.manage_mumble")
    links = TempLink.objects.select_related("created_by").prefetch_related("users")
    if not manage:
        links = links.filter(created_by=request.user)
    return {
        "enabled": s.configured and s.temp_enabled,
        "max_hours": s.temp_max_hours,
        "default_group": s.temp_group,
        "known_groups": services.known_groups(s) if manage else [],
        "can_manage": manage,
        "server": _server(s),
        "links": [services.temp_link_out(link) for link in links],
    }


@router.get("/temp")
@require_perm("mumble.create_temp_links")
def temp_links(request):
    return _temp_out(request)


class TempLinkIn(Schema):
    label: str
    hours: float
    max_uses: int = 0
    groups: list[str] | None = None


@router.post("/temp")
@require_perm("mumble.create_temp_links")
def create_temp_link(request, payload: TempLinkIn):
    link = _run(services.create_temp_link, request.user, payload.label, payload.hours, payload.max_uses, payload.groups)
    record("mumble.temp_link", f"made a temporary Mumble link: {link.label}", request=request, target_type="plugin",
           details={"plugin": "mumble", "hours": payload.hours, "max_uses": payload.max_uses, "groups": link.groups})
    return services.temp_link_out(link)


def _link(request, link_id: int) -> TempLink:
    link = TempLink.objects.filter(pk=link_id).select_related("created_by").first()
    if link is None or not (link.created_by_id == request.user.pk or request.user.has_perm("mumble.manage_mumble")):
        raise HttpError(404, "No such link")
    return link


@router.delete("/temp/{link_id}")
@require_perm("mumble.create_temp_links")
def revoke_temp_link(request, link_id: int):
    """Withdraw a link: it stops working, and so does every login it handed out."""
    link = _link(request, link_id)
    services.revoke_temp_link(link)
    record("mumble.temp_link_revoked", f"withdrew the temporary Mumble link {link.label}", request=request, target_type="plugin", details={"plugin": "mumble"})
    return services.temp_link_out(link)


@router.delete("/temp/users/{temp_id}")
@require_perm("mumble.create_temp_links")
def revoke_temp_user(request, temp_id: int):
    """Cut off one guest without withdrawing the whole link."""
    temp = TempUser.objects.filter(pk=temp_id).select_related("link__created_by").first()
    if temp is None:
        raise HttpError(404, "No such guest")
    _link(request, temp.link_id)
    if not temp.revoked_at:
        temp.revoked_at = timezone.now()
        temp.save(update_fields=["revoked_at"])
    record("mumble.temp_user_revoked", f"cut off Mumble guest {temp.display_name}", request=request, target_type="plugin", details={"plugin": "mumble"})
    return services.temp_link_out(temp.link)


# --- admin ---------------------------------------------------------------------------------------------------------


def admin_out() -> dict:
    s = MumbleSettings.load()
    mappings = GroupMapping.objects.select_related("group", "state")
    accounts = MumbleUser.objects.all()
    temp_active = TempUser.objects.filter(revoked_at__isnull=True, expires_at__gt=timezone.now(), link__revoked_at__isnull=True).count()
    return {
        "settings": {
            "host": s.host,
            "port": s.port,
            "server_name": s.server_name,
            "username_format": s.username_format,
            "display_format": s.display_format,
            "allow_cert_auth": s.allow_cert_auth,
            "temp_enabled": s.temp_enabled,
            "temp_group": s.temp_group,
            "temp_display_format": s.temp_display_format,
            "temp_max_hours": s.temp_max_hours,
            "configured": s.configured,
            "authenticator_seen_at": s.authenticator_seen_at.isoformat() if s.authenticator_seen_at else None,
            "authenticator_version": s.authenticator_version,
        },
        "site_url": django_settings.SITE_URL,
        "scope": "p.mumble:auth",
        "mappings": [
            {"id": m.pk, "kind": "group" if m.group_id else "state", "target_id": m.group_id or m.state_id,
             "target": m.group.name if m.group_id else m.state.name, "mumble_group": m.mumble_group}
            for m in mappings
        ],
        "known_groups": services.known_groups(s),
        "groups": [{"id": g.pk, "name": g.name} for g in Group.objects.order_by("name")],
        "states": [{"id": st.pk, "name": st.name, "color": st.color} for st in State.objects.all()],
        "stats": {"accounts": accounts.count(), "temp_active": temp_active, "temp_links": TempLink.objects.filter(revoked_at__isnull=True).count()},
    }


@router.get("/admin")
@require_perm("mumble.manage_mumble")
def admin(request):
    return admin_out()


class SettingsIn(Schema):
    host: str = ""
    port: int = 64738
    server_name: str = ""
    username_format: str = "{character}"
    display_format: str = "[{corp_ticker}] {character}"
    allow_cert_auth: bool = True
    temp_enabled: bool = True
    temp_group: str = "temp"
    temp_display_format: str = "[TEMP] {name}"
    temp_max_hours: int = 48


@router.put("/admin/settings")
@require_perm("mumble.manage_mumble")
def put_settings(request, payload: SettingsIn):
    s = MumbleSettings.load()
    host = payload.host.strip().lower().removeprefix("mumble://").rstrip("/")
    if host and (" " in host or "/" in host or "@" in host):
        raise HttpError(400, "The address is a host name or IP address, without mumble:// or a path")
    if not 1 <= payload.port <= 65535:
        raise HttpError(400, "The port is a number between 1 and 65535")
    if not 1 <= payload.temp_max_hours <= 24 * 30:
        raise HttpError(400, "Temporary links may last between 1 hour and 30 days")
    username_format, display_format = payload.username_format.strip()[:100], payload.display_format.strip()[:100]
    if not username_format or not display_format:
        raise HttpError(400, "Both name formats are needed")
    _run(services.check_format, username_format, *services.PLACEHOLDERS)
    _run(services.check_format, display_format, *services.PLACEHOLDERS)
    temp_display_format = payload.temp_display_format.strip()[:100] or "{name}"
    _run(services.check_format, temp_display_format, "name")
    temp_group = services.sanitize_group(payload.temp_group)
    if payload.temp_enabled and not temp_group:
        raise HttpError(400, "Give guests a Mumble group (lower-case letters, digits, - and _)")
    s.host, s.port, s.server_name = host[:200], payload.port, payload.server_name.strip()[:100]
    s.username_format, s.display_format, s.allow_cert_auth = username_format, display_format, payload.allow_cert_auth
    s.temp_enabled, s.temp_group, s.temp_display_format, s.temp_max_hours = payload.temp_enabled, temp_group, temp_display_format, payload.temp_max_hours
    s.save()
    if not s.allow_cert_auth:
        MumbleUser.objects.exclude(cert_hash="").update(cert_hash="")
    record("mumble.settings", "changed the Mumble settings", request=request, target_type="plugin", details={"plugin": "mumble"})
    return admin_out()


class MappingIn(Schema):
    kind: str  # group or state
    target_id: int
    mumble_group: str


class MappingsIn(Schema):
    mappings: list[MappingIn]


@router.put("/admin/mappings")
@require_perm("mumble.manage_mumble")
def put_mappings(request, payload: MappingsIn):
    rows, seen = [], set()
    for m in payload.mappings:
        if m.kind not in ("group", "state"):
            raise HttpError(400, "A mapping is for a group or a state")
        model = Group if m.kind == "group" else State
        if not model.objects.filter(pk=m.target_id).exists():
            raise HttpError(400, f"No such {m.kind}")
        name = services.sanitize_group(m.mumble_group)
        if not name:
            raise HttpError(400, "Name the Mumble group for every row (lower-case letters, digits, - and _)")
        key = (m.kind, m.target_id, name)
        if key in seen:
            continue
        seen.add(key)
        rows.append(GroupMapping(group_id=m.target_id if m.kind == "group" else None, state_id=m.target_id if m.kind == "state" else None, mumble_group=name))
    GroupMapping.objects.all().delete()
    GroupMapping.objects.bulk_create(rows)
    record("mumble.mappings", f"set {len(rows)} Mumble group mapping{'s' if len(rows) != 1 else ''}", request=request, target_type="plugin",
           details={"plugin": "mumble"})
    return admin_out()


@router.get("/admin/members")
@require_perm("mumble.manage_mumble")
def members(request):
    s = MumbleSettings.load()
    accounts = list(MumbleUser.objects.select_related("user__main_character", "user__state").prefetch_related("user__groups")
                    .order_by("user__main_character__name"))
    characters = services.linked_characters([a.user for a in accounts], request.user)
    return [{**services.account_out(a, s, with_user=True), "characters": characters.get(a.user_id, [])} for a in accounts]


def _member(user_id: int) -> MumbleUser:
    acct = MumbleUser.objects.filter(user_id=user_id).select_related("user").first()
    if acct is None:
        raise HttpError(404, "That member has no Mumble account")
    return acct


@router.post("/admin/members/{user_id}/password")
@require_perm("mumble.manage_mumble")
def reset_member_password(request, user_id: int):
    """A new password for a member who lost theirs; shown once to the manager, who passes it on."""
    from conduit.notify.services import notify

    acct = _member(user_id)
    password = services.set_password(acct)
    record("mumble.password_reset", f"reset {acct.user.display_name}'s Mumble password", request=request, target=acct.user, details={"plugin": "mumble"})
    notify(acct.user, "Your Mumble password was reset", f"{request.user.display_name} gave you a new Mumble password; ask them for it.",
           link="/p/mumble", category="p.mumble")
    return {"username": acct.username, "password": password}


@router.delete("/admin/members/{user_id}")
@require_perm("mumble.manage_mumble")
def delete_member(request, user_id: int):
    acct = _member(user_id)
    name, user = acct.username, acct.user
    services.delete_account(acct, reason="An administrator deleted your Mumble account.", notify_user=True)
    record("mumble.account_deleted", f"deleted {user.display_name}'s Mumble account {name}", request=request, target=user, details={"plugin": "mumble"})
    return {"ok": True}


@router.get("/admin/temp")
@require_perm("mumble.manage_mumble")
def all_temp_links(request):
    links = TempLink.objects.select_related("created_by").prefetch_related("users").annotate(n=Count("users"))
    return [services.temp_link_out(link) for link in links]


def _download(name: str, body: str) -> HttpResponse:
    resp = HttpResponse(body, content_type="text/plain; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="{name}"'
    return resp


@router.get("/admin/authenticator/{name}")
@require_perm("mumble.manage_mumble")
def authenticator_file(request, name: str):
    """The files to put next to the Mumble server: the authenticator, its config (with this site filled in) and a
    systemd unit."""
    files = {
        "conduit_mumble_authenticator.py": AUTHENTICATOR_DIR / "conduit_mumble_authenticator.py",
        "authenticator.ini": AUTHENTICATOR_DIR / "authenticator.ini.example",
        "conduit-mumble-authenticator.service": AUTHENTICATOR_DIR / "conduit-mumble-authenticator.service",
    }
    path = files.get(name)
    if path is None:
        raise HttpError(404, "No such file")
    body = path.read_text(encoding="utf-8")
    if name == "authenticator.ini":
        body = body.replace("https://auth.example.com", django_settings.SITE_URL)
    return _download(name, body)
