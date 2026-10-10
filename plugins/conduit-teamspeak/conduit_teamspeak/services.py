"""Linking TeamSpeak identities and keeping each member's server groups in step with the site.

Linking: the site makes a one-time privilege key on the server that hands out the "registered" server group and
stamps a secret code on the identity that uses it (a custom client property). The member uses the key in their
TeamSpeak client (the connect link does it for them); the site then finds the identity by that code, so nobody can
link somebody else's identity by picking the same nickname.

Syncing: the site only touches server groups that are mapped to a group or state ("managed" groups), the
registered group, and the ones it gave a member before (so a group whose mapping was removed is taken away again).
Groups given by hand on the server stay as they are. A member gets the managed groups of every group they're in and
of their state, as long as they have ``teamspeak.access_teamspeak``; without it they lose the managed groups, or are
kicked off the server too when the admins chose that.
"""

from __future__ import annotations

import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.db import IntegrityError, transaction
from django.utils import timezone

from conduit.accounts.models import Character
from conduit.events import bus
from conduit.eve.models import portrait_url

from . import ts3
from .models import GroupMapping, TeamSpeakSettings, TeamSpeakUser

log = logging.getLogger(__name__)

#: The custom client property the privilege key stamps on an identity.
CUSTOM_IDENT = "conduit_link"
#: TeamSpeak's own limits.
NICK_MAX, DESCRIPTION_MAX = 30, 200
#: The server group linked members are put in when none exists yet.
REGISTERED_GROUP_NAME = "Registered"
#: Link attempts nobody finished are forgotten (and their keys deleted) after this.
PENDING_MAX_AGE = timedelta(hours=24)
PLACEHOLDERS = ("character", "corp_ticker", "corp", "alliance_ticker", "alliance")


class TeamSpeakError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def has_access(user) -> bool:
    return user.is_active and user.has_perm("teamspeak.access_teamspeak")


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


def check_format(fmt: str) -> None:
    try:
        fmt.format(**{n: "" for n in PLACEHOLDERS})
    except (KeyError, IndexError, ValueError) as exc:
        raise TeamSpeakError(f"The format has an unknown placeholder: {exc}. Use " + ", ".join("{%s}" % n for n in PLACEHOLDERS) + ".") from None


def nickname_for(user, s: TeamSpeakSettings | None = None) -> str:
    """The name the connect link fills in and the description the identity gets on the server."""
    s = s or TeamSpeakSettings.load()
    values = _values(user)
    return (_format(s.nickname_format, values, values["character"]) or values["character"])[:NICK_MAX]


def desired_groups(user, mappings: list[GroupMapping] | None = None) -> set[int]:
    """The mapped server groups this member should have (not counting the registered group)."""
    if not has_access(user):
        return set()
    if mappings is None:
        mappings = list(GroupMapping.objects.all())
    group_ids = set(user.groups.values_list("pk", flat=True))
    return {m.sgid for m in mappings if (m.group_id and m.group_id in group_ids) or (m.state_id and m.state_id == user.state_id)}


def group_names(s: TeamSpeakSettings, sgids) -> list[str]:
    return sorted(s.group_name(g) for g in sgids)


def connect_url(s: TeamSpeakSettings, nickname: str, token: str | None = None) -> str | None:
    """A ts3server:// link the TeamSpeak client opens; with the privilege key while the link is pending."""
    if not s.host:
        return None
    params = {"port": s.public_port, "nickname": nickname}
    if token:
        params["token"] = token
        params["addbookmark"] = s.display_name
    return f"ts3server://{s.host}?{urlencode(params)}"


# --- talking to the server -------------------------------------------------------------------------------------------


def connect(s: TeamSpeakSettings | None = None) -> ts3.Client:
    """A logged-in query session on the virtual server. Callers close it (``with connect() as c:``)."""
    s = s or TeamSpeakSettings.load()
    if not s.configured:
        raise TeamSpeakError("TeamSpeak isn't set up on this site yet")
    client = ts3.Client(s.query_host, s.query_port, throttle=0 if s.allowlisted else ts3.THROTTLE)
    client.connect()
    try:
        client.login(s.query_user, s.query_password)
        client.use(s.server_id)
        client.set_nickname()
    except ts3.QueryError:
        client.close()
        raise
    return client


def explain(exc: ts3.QueryError) -> str:
    return ts3.explain(exc)


def ensure_registered_group(client: ts3.Client, s: TeamSpeakSettings, groups: list[dict] | None = None) -> int:
    """The server group every linked member gets; made if the admins haven't picked one."""
    groups = groups if groups is not None else client.servergrouplist()
    by_id = {int(g["sgid"]): g for g in groups}
    if s.registered_sgid and s.registered_sgid in by_id:
        return s.registered_sgid
    existing = next((int(g["sgid"]) for g in groups if g.get("name") == REGISTERED_GROUP_NAME), None)
    s.registered_sgid = existing or client.servergroupadd(REGISTERED_GROUP_NAME)
    s.save(update_fields=["registered_sgid"])
    return s.registered_sgid


def server_check(s: TeamSpeakSettings | None = None) -> dict:
    """Connect, remember the server's name, version and groups, make sure the registered group exists, and say
    what will stop syncing."""
    s = s or TeamSpeakSettings.load()
    if not s.configured:
        raise TeamSpeakError("Enter the query address, login and password first")
    try:
        with connect(s) as client:
            info = client.serverinfo()
            groups = client.servergrouplist()
            registered = ensure_registered_group(client, s, groups)
            if registered not in {int(g["sgid"]) for g in groups}:
                groups = client.servergrouplist()
            online = len(client.clientlist())
    except ts3.QueryError as exc:
        raise TeamSpeakError(explain(exc), 502) from None
    s.server_groups = [{"sgid": int(g["sgid"]), "name": g.get("name", "")} for g in sorted(groups, key=lambda g: g.get("name", "").lower())]
    s.virtual_server_name = info.get("virtualserver_name", "")[:100]
    s.server_version = " ".join(p for p in (info.get("virtualserver_version", ""), info.get("virtualserver_platform", "")) if p)[:100]
    s.checked_at = timezone.now()
    s.save(update_fields=["server_groups", "virtual_server_name", "server_version", "checked_at"])
    known = {g["sgid"] for g in s.server_groups}
    problems = []
    for m in GroupMapping.objects.select_related("group", "state"):
        if m.sgid not in known:
            problems.append(f"The server group {m.sg_name or m.sgid} (for {m.group.name if m.group_id else m.state.name}) no longer exists; remove it from the group mapping.")
        elif m.sg_name != s.group_name(m.sgid):
            m.sg_name = s.group_name(m.sgid)[:100]
            m.save(update_fields=["sg_name"])
    return {
        "name": s.virtual_server_name,
        "version": s.server_version,
        "online": online,
        "max_clients": int(info.get("virtualserver_maxclients", 0) or 0),
        "voice_port": int(info.get("virtualserver_port", 0) or 0),
        "registered_group": s.group_name(registered),
        "groups": s.server_groups,
        "problems": problems,
    }


# --- syncing -------------------------------------------------------------------------------------------------------


def _set_status(acct: TeamSpeakUser, error: str = "", **fields) -> None:
    acct.sync_error = error[:300]
    acct.synced_at = timezone.now()
    for k, v in fields.items():
        setattr(acct, k, v)
    acct.save()


def recheck_compliance(user_id: int) -> None:
    """Being linked can count towards compliance; re-check the member now rather than at the next half hour."""
    if not TeamSpeakSettings.load().require_for_compliance:
        return
    try:
        from conduit.access.tasks import update_user_groups
    except ImportError:  # an EvE Conduit without it
        return
    transaction.on_commit(lambda: update_user_groups.delay(user_id))


def compliance_problems(user) -> list[str]:
    """Plugin.compliance: with "Must be linked" switched on, members who may use TeamSpeak have to have linked an
    identity. Reads stored data only; never asks the server (this runs for everyone)."""
    s = TeamSpeakSettings.load()
    if not (s.require_for_compliance and s.configured and has_access(user)):
        return []
    acct = TeamSpeakUser.objects.filter(user=user).first()
    if acct is None or acct.pending:
        return ["TeamSpeak: not linked (link it on the TeamSpeak page)"]
    return []


def _sync(client: ts3.Client, acct: TeamSpeakUser, s: TeamSpeakSettings, mappings: list[GroupMapping]) -> str:
    """One member's groups and description, on an open session. Returns "" or what went wrong."""
    user = acct.user
    info = client.clientdbinfo(acct.cldbid)
    if info is None:
        _set_status(acct, "The identity is gone from the server's database; unlink and link again", groups=[])
        return acct.sync_error
    access = has_access(user)
    managed = {m.sgid for m in mappings} | set(acct.groups) | ({s.registered_sgid} if s.registered_sgid else set())
    wanted = (desired_groups(user, mappings) | ({s.registered_sgid} if s.registered_sgid else set())) if access else set()
    current = client.servergroups_of(acct.cldbid)
    for sgid in sorted(wanted - current):
        client.servergroupaddclient(sgid, acct.cldbid)
    for sgid in sorted((current & managed) - wanted):
        client.servergroupdelclient(sgid, acct.cldbid)
    description = nickname_for(user, s) if access else ""
    if access and info.get("client_description", "") != description:
        client.clientdbedit(acct.cldbid, client_description=description[:DESCRIPTION_MAX])
    if not access and s.kick_without_access:
        for c in client.clientlist():
            if c.get("client_database_id") == str(acct.cldbid):
                client.clientkick(int(c["clid"]), "No access to this server any more")
    _set_status(
        acct, "", groups=sorted(wanted - ({s.registered_sgid} if s.registered_sgid else set())),
        nickname=info.get("client_nickname", acct.nickname)[:100], uid=info.get("client_unique_identifier", acct.uid)[:64],
        last_connected_at=ts3.ts_time(info.get("client_lastconnected")),
    )
    return ""


def sync_user(user, s: TeamSpeakSettings | None = None, mappings: list[GroupMapping] | None = None, client: ts3.Client | None = None) -> str:
    """Bring one member's server groups up to date. Returns "" when it worked (or there's nothing to do), else what
    went wrong."""
    s = s or TeamSpeakSettings.load()
    acct = TeamSpeakUser.objects.filter(user=user).select_related("user").first()
    if acct is None or acct.pending or not s.configured:
        return ""
    if mappings is None:
        mappings = list(GroupMapping.objects.all())
    try:
        if client is not None:
            return _sync(client, acct, s, mappings)
        with connect(s) as session:
            return _sync(session, acct, s, mappings)
    except ts3.QueryError as exc:
        log.warning("TeamSpeak sync for %s failed: %s", user, exc)
        _set_status(acct, explain(exc))
        return acct.sync_error


def sync_all() -> dict:
    """Every linked member in one session, and forget link attempts nobody finished."""
    s = TeamSpeakSettings.load()
    if not s.configured:
        return {"synced": 0, "failed": 0, "expired": 0}
    mappings = list(GroupMapping.objects.all())
    linked = list(TeamSpeakUser.objects.filter(cldbid__isnull=False).select_related("user__main_character__corporation", "user__main_character__alliance", "user__state"))
    synced = failed = expired = 0
    try:
        with connect(s) as client:
            for acct in linked:
                if sync_user(acct.user, s, mappings, client):
                    failed += 1
                else:
                    synced += 1
            for acct in TeamSpeakUser.objects.filter(cldbid__isnull=True, created_at__lt=timezone.now() - PENDING_MAX_AGE):
                if acct.privilege_key:
                    client.privilegekeydelete(acct.privilege_key)
                acct.delete()
                expired += 1
    except ts3.QueryError as exc:
        # The session itself failed (sync_user keeps per-member errors to itself): the rest didn't get their turn.
        log.warning("TeamSpeak full sync stopped: %s", exc)
        failed = len(linked) - synced
    s.last_full_sync = timezone.now()
    s.save(update_fields=["last_full_sync"])
    return {"synced": synced, "failed": failed, "expired": expired}


# --- linking -------------------------------------------------------------------------------------------------------


def start_link(user, s: TeamSpeakSettings | None = None) -> TeamSpeakUser:
    """Make (or renew) the member's privilege key. The key gives the registered group and stamps the verify code on
    whoever uses it."""
    s = s or TeamSpeakSettings.load()
    if not s.configured:
        raise TeamSpeakError("TeamSpeak isn't set up on this site yet")
    if not has_access(user):
        raise TeamSpeakError("You don't have access to TeamSpeak", 403)
    acct = TeamSpeakUser.objects.filter(user=user).first()
    if acct is not None and not acct.pending:
        raise TeamSpeakError("Your TeamSpeak identity is already linked", 409)
    code = f"{user.pk}-{secrets.token_urlsafe(12)}"
    try:
        with connect(s) as client:
            registered = ensure_registered_group(client, s)
            if acct is not None and acct.privilege_key:
                client.privilegekeydelete(acct.privilege_key)
            key = client.privilegekeyadd(registered, f"EvE Conduit: {nickname_for(user, s)}", CUSTOM_IDENT, code)
    except ts3.QueryError as exc:
        raise TeamSpeakError(f"Couldn't make your key on the server: {explain(exc)}", 502) from None
    if acct is None:
        acct = TeamSpeakUser(user=user)
    acct.privilege_key, acct.verify_code, acct.created_at = key[:100], code, timezone.now()
    acct.save()
    return acct


def check_link(user, s: TeamSpeakSettings | None = None) -> bool:
    """Has the member used their key yet? If so, remember the identity, give it its groups and finish the link."""
    s = s or TeamSpeakSettings.load()
    acct = TeamSpeakUser.objects.filter(user=user).select_related("user").first()
    if acct is None or not acct.pending:
        raise TeamSpeakError("You haven't started linking", 404)
    if not has_access(user):
        raise TeamSpeakError("You don't have access to TeamSpeak", 403)
    try:
        with connect(s) as client:
            hits = [h for h in client.customsearch(CUSTOM_IDENT, acct.verify_code) if h.get("value") == acct.verify_code]
            if not hits:
                return False
            cldbid = int(hits[0]["cldbid"])
            other = TeamSpeakUser.objects.filter(cldbid=cldbid).exclude(user=user).select_related("user").first()
            if other is not None:
                client.customdelete(cldbid, CUSTOM_IDENT)
                raise TeamSpeakError("That TeamSpeak identity is already linked to another member. Unlink it there first.", 409)
            info = client.clientdbinfo(cldbid) or {}
            acct.cldbid, acct.verified_at = cldbid, timezone.now()
            acct.uid, acct.nickname = info.get("client_unique_identifier", "")[:64], info.get("client_nickname", "")[:100]
            acct.last_connected_at = ts3.ts_time(info.get("client_lastconnected"))
            key, acct.privilege_key, acct.verify_code = acct.privilege_key, "", ""
            try:
                acct.save()
            except IntegrityError:
                raise TeamSpeakError("That TeamSpeak identity is already linked to another member", 409) from None
            if key:
                client.privilegekeydelete(key)  # used keys are gone already; this covers a key used by a second client
            error = _sync(client, acct, s, list(GroupMapping.objects.all()))
            for c in client.clientlist():
                if c.get("client_database_id") == str(cldbid):
                    client.clientpoke(int(c["clid"]), "Linked to your account on EvE Conduit. Welcome!")
                    break
    except ts3.QueryError as exc:
        if acct.pending:
            raise TeamSpeakError(f"Couldn't ask the server: {explain(exc)}", 502) from None
        _set_status(acct, explain(exc))
        error = acct.sync_error
    recheck_compliance(user.pk)
    bus.emit("teamspeak.linked", user_id=user.pk, user=user.display_name, nickname=acct.nickname, uid=acct.uid,
             summary=f"{user.display_name} linked TeamSpeak identity {acct.nickname or acct.uid}", level="success")
    if error:
        log.warning("TeamSpeak link of %s finished, but the first sync failed: %s", user, error)
    return True


def _forget(acct: TeamSpeakUser, summary: str) -> None:
    user = acct.user
    bus.emit("teamspeak.unlinked", user_id=user.pk, user=user.display_name, nickname=acct.nickname, uid=acct.uid, summary=summary, level="warning")
    acct.delete()
    recheck_compliance(user.pk)


def unlink(user, *, reason: str = "", notify_user: bool = True, force: bool = False) -> None:
    """Take the managed groups away (and the stamp the key left), then forget the link. A pending link just has its
    key deleted.

    If the server can't be reached to do that, the link is kept and TeamSpeakError raised: once forgotten, nothing
    would ever take those groups away again. Only an administrator's ``force`` forgets it anyway.
    """
    from conduit.notify.services import notify

    acct = TeamSpeakUser.objects.filter(user=user).select_related("user").first()
    if acct is None:
        raise TeamSpeakError("No TeamSpeak identity is linked", 404)
    s = TeamSpeakSettings.load()
    if s.configured:
        try:
            with connect(s) as client:
                if acct.pending:
                    if acct.privilege_key:
                        client.privilegekeydelete(acct.privilege_key)
                else:
                    managed = set(GroupMapping.objects.values_list("sgid", flat=True)) | set(acct.groups) | ({s.registered_sgid} if s.registered_sgid else set())
                    for sgid in sorted(client.servergroups_of(acct.cldbid) & managed):
                        client.servergroupdelclient(sgid, acct.cldbid)
                    client.customdelete(acct.cldbid, CUSTOM_IDENT)
                    if s.kick_without_access:
                        for c in client.clientlist():
                            if c.get("client_database_id") == str(acct.cldbid):
                                client.clientkick(int(c["clid"]), "Unlinked from EvE Conduit")
        except ts3.QueryError as exc:
            log.warning("Couldn't clean up TeamSpeak identity %s of %s: %s", acct.cldbid, user, exc)
            if not force and not acct.pending:
                raise TeamSpeakError(f"Couldn't take the groups away on the server ({explain(exc)}), so the identity stays linked; "
                                     "try again in a minute", 502) from None
    if acct.pending:
        acct.delete()
        return
    _forget(acct, f"{user.display_name} unlinked TeamSpeak identity {acct.nickname or acct.uid}" + (f" ({reason})" if reason else ""))
    if notify_user and reason:
        notify(user, "Your TeamSpeak identity was unlinked", reason, link="/p/teamspeak", level="warning", category="p.teamspeak")


# --- output ----------------------------------------------------------------------------------------------------------


def account_out(acct: TeamSpeakUser, s: TeamSpeakSettings | None = None, with_user: bool = False) -> dict:
    s = s or TeamSpeakSettings.load()
    if acct.pending:
        out = {
            "status": "pending",
            "privilege_key": acct.privilege_key,
            "started_at": acct.created_at.isoformat(),
            "connect_url": connect_url(s, nickname_for(acct.user, s), acct.privilege_key),
        }
    else:
        out = {
            "status": "linked",
            "cldbid": acct.cldbid,
            "uid": acct.uid,
            "nickname": acct.nickname,
            "linked_at": acct.verified_at.isoformat() if acct.verified_at else acct.created_at.isoformat(),
            "synced_at": acct.synced_at.isoformat() if acct.synced_at else None,
            "last_connected_at": acct.last_connected_at.isoformat() if acct.last_connected_at else None,
            "error": acct.sync_error,
            "groups": group_names(s, acct.groups),
        }
    if with_user:
        u = acct.user
        out["user"] = {"id": u.pk, "name": u.display_name, "portrait": portrait_url(u.main_character_id or 1, 64)}
        out["has_access"] = has_access(u)
        out["groups_due"] = group_names(s, desired_groups(u))
    return out


def linked_characters(users, viewer) -> dict[int, list[dict]]:
    """Each linked member's characters, main first, for the admin list. Alts only for people allowed to open their
    character sheets (the core sheet permissions), so managing TeamSpeak doesn't reveal whose alt is whose."""
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
