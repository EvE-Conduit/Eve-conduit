"""Mumble accounts, what the authenticator next to the Mumble server is told, and temporary access links.

The Mumble server doesn't hold any passwords: its authenticator (``authenticator/`` in this package) asks this site
on every login with an API key. A member's account answers with their Mumble groups, worked out right then from
their groups and state and the mapping under Setup, so nothing has to be pushed to the server. Guests get a login
through a temporary link that stops working when the link does.
"""

from __future__ import annotations

import logging
import re
import secrets
from datetime import timedelta
from urllib.parse import quote, urlencode

from django.conf import settings as django_settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.events import bus
from conduit.eve.models import portrait_url

from .models import GroupMapping, MumbleSettings, MumbleUser, TempLink, TempUser

log = logging.getLogger(__name__)

#: Mumble user ids: members get their site user id, guests this plus the temporary login's id. Mumble wants them in
#: a 32-bit int, and rejects everything below 0.
TEMP_ID_OFFSET = 1_000_000_000
PASSWORD_MIN, PASSWORD_MAX = 8, 100
#: Characters a login name may hold: a subset of Mumble's default ``username`` rule, so it fits a stricter one too.
USERNAME_CHARS = re.compile(r"[^A-Za-z0-9_.\-]+")
USERNAME_MAX = 60
#: Failed logins per name before further tries are refused for a while (Mumble itself hardly slows anyone down).
FAILS_LIMIT, FAILS_WINDOW = 10, 600
#: Guest logins are kept this long after they expired, so the link's owner can still see who used it.
TEMP_USER_KEEP, TEMP_LINK_KEEP = timedelta(days=7), timedelta(days=30)
#: Readable passwords without look-alike characters.
PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
PLACEHOLDERS = ("character", "corp_ticker", "corp", "alliance_ticker", "alliance")


class MumbleError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def has_access(user) -> bool:
    return user.is_active and user.has_perm("mumble.access_mumble")


def can_create_temp_links(user) -> bool:
    return user.is_active and user.has_perm("mumble.create_temp_links")


# --- names ---------------------------------------------------------------------------------------------------------


def _values(user) -> dict:
    char = user.main_character
    corp, alliance = (char.corporation, char.alliance) if char else (None, None)
    return {
        "character": char.name if char else user.display_name,
        "corp_ticker": corp.ticker if corp else "",
        "corp": corp.name if corp else "",
        "alliance_ticker": alliance.ticker if alliance else "",
        "alliance": alliance.name if alliance else "",
    }


def _format(fmt: str, values: dict, fallback: str) -> str:
    try:
        out = fmt.format(**values)
    except (KeyError, IndexError, ValueError):
        out = fallback
    return " ".join(out.replace("[]", "").split())


def check_format(fmt: str, *names: str) -> None:
    try:
        fmt.format(**{n: "" for n in names})
    except (KeyError, IndexError, ValueError) as exc:
        raise MumbleError(f"The format has an unknown placeholder: {exc}. Use " + ", ".join("{%s}" % n for n in names) + ".") from None


def sanitize_username(name: str) -> str:
    """A login name Mumble accepts: letters, digits, _ . and -; spaces become underscores."""
    name = USERNAME_CHARS.sub("_", name.strip().replace(" ", "_"))
    name = re.sub(r"_+", "_", name).strip("_.-")
    return name[:USERNAME_MAX]


def username_taken(name: str, exclude_user: MumbleUser | None = None) -> bool:
    members = MumbleUser.objects.filter(username__iexact=name)
    if exclude_user is not None:
        members = members.exclude(pk=exclude_user.pk)
    return members.exists() or TempUser.objects.filter(username__iexact=name).exists()


def unique_username(base: str) -> str:
    base = sanitize_username(base) or "pilot"
    name, n = base, 1
    while username_taken(name):
        n += 1
        name = f"{base[: USERNAME_MAX - len(str(n)) - 1]}_{n}"
    return name


def display_name_for(user, s: MumbleSettings | None = None) -> str:
    s = s or MumbleSettings.load()
    values = _values(user)
    return (_format(s.display_format, values, values["character"]) or values["character"])[:100]


def username_for(user, s: MumbleSettings | None = None) -> str:
    """The login name a new account gets: the format, made unique."""
    s = s or MumbleSettings.load()
    values = _values(user)
    return unique_username(_format(s.username_format, values, values["character"]))


def temp_display_name(name: str, s: MumbleSettings) -> str:
    return (_format(s.temp_display_format, {"name": name}, name) or name)[:100]


def desired_groups(user, mappings: list[GroupMapping] | None = None) -> list[str]:
    """The Mumble groups this member is in, from their groups and state."""
    if not has_access(user):
        return []
    if mappings is None:
        mappings = list(GroupMapping.objects.all())
    group_ids = set(user.groups.values_list("pk", flat=True))
    return sorted({m.mumble_group for m in mappings if (m.group_id and m.group_id in group_ids) or (m.state_id and m.state_id == user.state_id)})


def generate_password() -> str:
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(14))


def check_new_password(password: str) -> str:
    password = password.strip()
    if len(password) < PASSWORD_MIN:
        raise MumbleError(f"Use at least {PASSWORD_MIN} characters")
    if len(password) > PASSWORD_MAX:
        raise MumbleError(f"Use at most {PASSWORD_MAX} characters")
    return password


def connect_url(s: MumbleSettings, username: str, password: str | None = None) -> str | None:
    """A mumble:// link the Mumble client opens; with the password only where it's shown once anyway."""
    if not s.host:
        return None
    auth = quote(username, safe="")
    if password:
        auth += ":" + quote(password, safe="")
    query = urlencode({"title": s.server_name or s.host, "version": "1.2.0"})
    return f"mumble://{auth}@{s.host}:{s.port}/?{query}"


# --- accounts ------------------------------------------------------------------------------------------------------


def create_account(user, password: str | None = None, s: MumbleSettings | None = None) -> tuple[MumbleUser, str]:
    s = s or MumbleSettings.load()
    if not s.configured:
        raise MumbleError("Mumble isn't set up on this site yet")
    if not has_access(user):
        raise MumbleError("You don't have access to Mumble", 403)
    if MumbleUser.objects.filter(user=user).exists():
        raise MumbleError("You already have a Mumble account", 409)
    password = check_new_password(password) if password else generate_password()
    try:
        with transaction.atomic():
            acct = MumbleUser.objects.create(
                user=user, username=username_for(user, s), display_name=display_name_for(user, s),
                password_hash=make_password(password), groups=desired_groups(user),
            )
    except IntegrityError:
        raise MumbleError("That Mumble name was just taken; try again", 409) from None
    bus.emit("mumble.account_created", user_id=user.pk, user=user.display_name, username=acct.username,
             summary=f"{user.display_name} created Mumble account {acct.username}", level="success")
    return acct, password


def set_password(acct: MumbleUser, password: str | None = None) -> str:
    password = check_new_password(password) if password else generate_password()
    acct.password_hash = make_password(password)
    acct.password_changed_at = timezone.now()
    acct.save(update_fields=["password_hash", "password_changed_at"])
    return password


def delete_account(acct: MumbleUser, *, reason: str = "", notify_user: bool = False) -> None:
    from conduit.notify.services import notify

    user, username = acct.user, acct.username
    acct.delete()
    bus.emit("mumble.account_deleted", user_id=user.pk, user=user.display_name, username=username,
             summary=f"{user.display_name}'s Mumble account {username} was deleted" + (f" ({reason})" if reason else ""), level="warning")
    if notify_user and reason:
        notify(user, "Your Mumble account was deleted", reason, link="/p/mumble", level="warning", category="p.mumble")


def account_out(acct: MumbleUser, s: MumbleSettings | None = None, with_user: bool = False) -> dict:
    s = s or MumbleSettings.load()
    out = {
        "username": acct.username,
        "display_name": acct.display_name,
        "groups": acct.groups,
        "created_at": acct.created_at.isoformat(),
        "password_changed_at": acct.password_changed_at.isoformat(),
        "last_login_at": acct.last_login_at.isoformat() if acct.last_login_at else None,
        "certificate_remembered": bool(acct.cert_hash),
        "url": connect_url(s, acct.username),
    }
    if with_user:
        u = acct.user
        out["user"] = {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id or 1, 64)}
        out["has_access"] = has_access(u)
        out["groups_due"] = desired_groups(u)
    return out


# --- what the authenticator asks -----------------------------------------------------------------------------------


def _seen(s: MumbleSettings, version: str = "") -> None:
    """Note that the authenticator is alive (shown under Setup). Written at most once a minute."""
    now = timezone.now()
    if s.authenticator_seen_at and now - s.authenticator_seen_at < timedelta(minutes=1) and (not version or version == s.authenticator_version):
        return
    s.authenticator_seen_at = now
    fields = ["authenticator_seen_at"]
    if version:
        s.authenticator_version = version[:40]
        fields.append("authenticator_version")
    s.save(update_fields=fields)


def _too_many_failures(name: str) -> bool:
    return (cache.get(f"mumble:fails:{name.lower()}") or 0) >= FAILS_LIMIT


def _failed(name: str) -> dict:
    key = f"mumble:fails:{name.lower()}"
    cache.add(key, 0, timeout=FAILS_WINDOW)
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=FAILS_WINDOW)
    return {"result": "reject"}


def authenticate(name: str, password: str = "", certhash: str = "", strong: bool = False, version: str = "") -> dict:
    """Answer a Mumble login: ``ok`` with the id, the name to show and the groups; ``reject``; or ``fallthrough``
    for names this site doesn't know, so the server's own users (SuperUser) still work."""
    s = MumbleSettings.load()
    _seen(s, version)
    name = (name or "").strip()
    if not name:
        return {"result": "reject"}
    if _too_many_failures(name):
        return {"result": "reject", "reason": "too many failed logins; wait a few minutes"}
    certhash = (certhash or "").strip().lower()
    acct = (MumbleUser.objects.filter(username__iexact=name)
            .select_related("user__main_character__corporation", "user__main_character__alliance", "user__state").first())
    if acct is not None:
        user = acct.user
        if not has_access(user):
            return {"result": "reject", "reason": "no access"}
        by_password = bool(password) and check_password(password, acct.password_hash)
        by_cert = (not by_password and s.allow_cert_auth and bool(certhash) and bool(acct.cert_hash)
                   and secrets.compare_digest(acct.cert_hash, certhash))
        if not (by_password or by_cert):
            return _failed(name)
        acct.display_name = display_name_for(user, s)
        acct.groups = desired_groups(user)
        acct.last_login_at = timezone.now()
        fields = ["display_name", "groups", "last_login_at"]
        if by_password and s.allow_cert_auth and certhash and acct.cert_hash != certhash:
            acct.cert_hash = certhash[:40]
            fields.append("cert_hash")
        acct.save(update_fields=fields)
        return {"result": "ok", "id": user.pk, "name": acct.display_name, "groups": acct.groups, "kind": "member"}
    temp = TempUser.objects.filter(username__iexact=name).select_related("link").first()
    if temp is not None:
        if not temp.usable():
            return {"result": "reject", "reason": "temporary access has ended"}
        if not (password and check_password(password, temp.password_hash)):
            return _failed(name)
        temp.last_login_at = timezone.now()
        temp.save(update_fields=["last_login_at"])
        return {"result": "ok", "id": TEMP_ID_OFFSET + temp.pk, "name": temp.display_name, "groups": list(temp.link.groups), "kind": "temp"}
    return {"result": "fallthrough"}


def user_info(mumble_id: int) -> dict | None:
    """Who a Mumble user id is (for the server's user list and avatars), or None."""
    if mumble_id >= TEMP_ID_OFFSET:
        temp = TempUser.objects.filter(pk=mumble_id - TEMP_ID_OFFSET).first()
        if temp is None:
            return None
        return {"id": mumble_id, "username": temp.username, "name": temp.display_name, "kind": "temp", "texture_url": None}
    acct = MumbleUser.objects.filter(user_id=mumble_id).select_related("user").first()
    if acct is None:
        return None
    main = acct.user.main_character_id
    return {"id": mumble_id, "username": acct.username, "name": acct.display_name, "kind": "member",
            "texture_url": portrait_url(main, 128) if main else None}


def name_to_id(name: str) -> int | None:
    name = (name or "").strip()
    if not name:
        return None
    acct = MumbleUser.objects.filter(username__iexact=name).first()
    if acct is not None:
        return acct.user_id
    temp = TempUser.objects.filter(username__iexact=name).first()
    return TEMP_ID_OFFSET + temp.pk if temp is not None else None


# --- temporary access ----------------------------------------------------------------------------------------------


def temp_link_url(link: TempLink) -> str:
    return f"{django_settings.SITE_URL}/public/p/mumble/temp/{link.token}"


def create_temp_link(user, label: str, hours: float, max_uses: int = 0, groups: list[str] | None = None,
                     s: MumbleSettings | None = None) -> TempLink:
    s = s or MumbleSettings.load()
    if not s.configured:
        raise MumbleError("Mumble isn't set up on this site yet")
    if not s.temp_enabled:
        raise MumbleError("Temporary access is switched off", 403)
    if not can_create_temp_links(user):
        raise MumbleError("You may not hand out temporary access", 403)
    label = " ".join(label.split())[:100]
    if not label:
        raise MumbleError("Say what the link is for")
    if not hours or hours <= 0:
        raise MumbleError("Pick how long it lasts")
    if hours > s.temp_max_hours:
        raise MumbleError(f"Links may last at most {s.temp_max_hours} hours")
    if max_uses < 0:
        raise MumbleError("The number of uses can't be negative")
    # Only managers decide which groups guests get; everyone else hands out the guest group.
    wanted = [g for g in {sanitize_group(g) for g in (groups or [])} if g]
    if wanted and wanted != [s.temp_group] and not user.has_perm("mumble.manage_mumble"):
        raise MumbleError("Only Mumble managers can give guests other groups", 403)
    link = TempLink.objects.create(
        token=secrets.token_urlsafe(24), label=label, created_by=user, max_uses=max_uses,
        expires_at=timezone.now() + timedelta(hours=hours), groups=sorted(wanted) or ([s.temp_group] if s.temp_group else []),
    )
    bus.emit("mumble.temp_link_created", user_id=user.pk, user=user.display_name, label=label, expires_at=link.expires_at.isoformat(),
             summary=f"{user.display_name} made a temporary Mumble link: {label}")
    return link


def sanitize_group(name: str) -> str:
    """Mumble group names: lower-case letters, digits and a few signs; they match the server's ACL groups by name."""
    return re.sub(r"[^a-z0-9_\-]+", "", (name or "").strip().lower())[:50]


def revoke_temp_link(link: TempLink) -> None:
    if not link.revoked_at:
        link.revoked_at = timezone.now()
        link.save(update_fields=["revoked_at"])


def redeem_temp_link(link: TempLink, name: str, ip: str | None, s: MumbleSettings | None = None) -> tuple[TempUser, str]:
    """A guest opened the link and chose a name: give them a login that lasts as long as the link."""
    s = s or MumbleSettings.load()
    if not (s.configured and s.temp_enabled):
        raise MumbleError("Temporary access isn't available", 404)
    status = link.status()
    if status != "active":
        raise MumbleError({"revoked": "This link was withdrawn", "expired": "This link has expired", "used_up": "This link has been used up"}[status], 410)
    name = " ".join((name or "").split())[:60]
    if len(name) < 2:
        raise MumbleError("Enter the name you want to use (at least 2 characters)")
    if not sanitize_username(name):
        raise MumbleError("Use letters or digits in the name")
    password = generate_password()
    try:
        with transaction.atomic():
            # Serialise the count against the limit; the link row is the lock.
            link = TempLink.objects.select_for_update().get(pk=link.pk)
            if link.max_uses and link.users.count() >= link.max_uses:
                raise MumbleError("This link has been used up", 410)
            temp = TempUser.objects.create(
                link=link, username=unique_username(name), display_name=temp_display_name(name, s), password_hash=make_password(password),
                created_ip=ip, expires_at=link.expires_at,
            )
    except IntegrityError:
        raise MumbleError("That name was just taken; try another", 409) from None
    bus.emit("mumble.temp_access_used", link=link.label, username=temp.username, user_id=link.created_by_id,
             summary=f"{temp.display_name} got temporary Mumble access through {link.label}")
    return temp, password


def temp_user_out(temp: TempUser) -> dict:
    return {
        "id": temp.pk,
        "username": temp.username,
        "display_name": temp.display_name,
        "created_at": temp.created_at.isoformat(),
        "expires_at": temp.expires_at.isoformat(),
        "last_login_at": temp.last_login_at.isoformat() if temp.last_login_at else None,
        "revoked": bool(temp.revoked_at),
        "active": temp.usable(),
    }


def temp_link_out(link: TempLink, with_users: bool = True) -> dict:
    out = {
        "id": link.pk,
        "label": link.label,
        "url": temp_link_url(link),
        "created_at": link.created_at.isoformat(),
        "created_by": {"id": link.created_by.pk, "name": link.created_by.display_name} if link.created_by else None,
        "expires_at": link.expires_at.isoformat(),
        "max_uses": link.max_uses,
        "groups": link.groups,
        "status": link.status(),
    }
    users = list(link.users.all())
    out["uses"] = len(users)
    if with_users:
        out["users"] = [temp_user_out(t) for t in users]
    return out


def cleanup() -> dict:
    """Forget guest logins a week after they ended, and links a month after."""
    now = timezone.now()
    users, _ = TempUser.objects.filter(expires_at__lt=now - TEMP_USER_KEEP).delete()
    links, _ = TempLink.objects.filter(expires_at__lt=now - TEMP_LINK_KEEP).delete()
    return {"temp_users": users, "temp_links": links}


# --- admin ---------------------------------------------------------------------------------------------------------


def linked_characters(users, viewer) -> dict[int, list[dict]]:
    """Each account holder's characters, main first, for the admin list. Alts only for people allowed to open their
    character sheets (the core sheet permissions), so managing Mumble doesn't reveal whose alt is whose."""
    from conduit.sheet.access import can_view

    see_all = viewer.has_perm("sheet.view_all_characters")
    out: dict[int, list[dict]] = {}
    mains = {u.pk: u.main_character_id for u in users}
    for c in Character.objects.filter(user_id__in=mains).select_related("corporation").order_by("name"):
        main = c.pk == mains[c.user_id]
        viewable = see_all or can_view(viewer, c)
        if not (main or viewable):
            continue
        out.setdefault(c.user_id, []).append({
            "id": c.pk, "name": c.name, "portrait": portrait_url(c.pk, 64), "main": main,
            "corporation": (c.corporation.ticker or c.corporation.name) if c.corporation else None, "viewable": viewable,
        })
    for rows in out.values():
        rows.sort(key=lambda r: (not r["main"], r["name"].lower()))
    return out


def known_groups(s: MumbleSettings | None = None) -> list[str]:
    s = s or MumbleSettings.load()
    names = set(GroupMapping.objects.values_list("mumble_group", flat=True))
    if s.temp_group:
        names.add(s.temp_group)
    return sorted(names)
