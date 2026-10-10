"""TeamSpeak: the ServerQuery protocol, linking with a privilege key, syncing server groups, settings and mapping."""

from datetime import timedelta

import pytest
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

from conduit.access.groups import add_member
from conduit.plugins.services import set_enabled, sync_installed
from conduit_teamspeak import services, ts3
from conduit_teamspeak.models import GroupMapping, TeamSpeakSettings, TeamSpeakUser
from tests.conftest import make_user

REGISTERED, MEMBER, CAPS = 7, 8, 9


class FakeServer(ts3.Client):
    """A TeamSpeak server as far as the plugin can tell: the commands it sends, answered from memory."""

    def __init__(self):
        super().__init__("ts.example.com", 10011, throttle=0)
        self.groups = {REGISTERED: "Registered", MEMBER: "Member", CAPS: "Capitals", 6: "Server Admin"}
        self.clients: dict[int, dict] = {}  # cldbid -> {uid, nickname, description, groups, custom, lastconnected}
        self.keys: dict[str, dict] = {}  # token -> {sgid, custom}
        self.online: dict[int, int] = {}  # clid -> cldbid
        self.kicked: list[int] = []
        self.poked: list[int] = []
        self.sent: list[str] = []
        self.login_ok = True
        self.next_sgid = 10

    def add_client(self, cldbid, uid, nickname, groups=()):
        self.clients[cldbid] = {"uid": uid, "nickname": nickname, "description": "", "groups": set(groups), "custom": {}, "lastconnected": 1700000000}

    def use_key(self, token, cldbid):
        key = self.keys.pop(token)
        self.clients[cldbid]["groups"].add(key["sgid"])
        self.clients[cldbid]["custom"].update(key["custom"])

    # The wire, in memory.
    def connect(self):
        pass

    def close(self):
        pass

    def command(self, name, params=None, options=()):
        p = params or {}
        self.sent.append(ts3.build(name, p, options))
        if name == "login":
            if not self.login_ok:
                raise ts3.QueryError(520, "invalid loginname or password")
            return []
        if name in ("use", "clientupdate", "quit"):
            return []
        if name == "serverinfo":
            return [{"virtualserver_name": "Alliance TS", "virtualserver_version": "3.13.7", "virtualserver_platform": "Linux", "virtualserver_maxclients": "64", "virtualserver_port": "9987"}]
        if name == "servergrouplist":
            return [{"sgid": str(i), "name": n, "type": "1"} for i, n in self.groups.items()] + [{"sgid": "1", "name": "Guest Server Query", "type": "2"}]
        if name == "servergroupadd":
            sgid, self.next_sgid = self.next_sgid, self.next_sgid + 1
            self.groups[sgid] = p["name"]
            return [{"sgid": str(sgid)}]
        if name == "privilegekeyadd":
            token = f"KEY{len(self.keys) + len(self.sent)}"
            ident, value = [ts3.unescape(part.split("=", 1)[1]) for part in p["tokencustomset"].split(" ")]
            self.keys[token] = {"sgid": int(p["tokenid1"]), "custom": {ident: value}, "description": p["tokendescription"]}
            return [{"token": token}]
        if name == "privilegekeydelete":
            if p["token"] not in self.keys:
                raise ts3.QueryError(1281, "database empty result set")
            del self.keys[p["token"]]
            return []
        if name == "customsearch":
            rows = [{"cldbid": str(i), "ident": p["ident"], "value": c["custom"][p["ident"]]} for i, c in self.clients.items() if c["custom"].get(p["ident"]) == p["pattern"]]
            if not rows:
                raise ts3.QueryError(1281, "database empty result set")
            return rows
        if name == "customdelete":
            self.clients[int(p["cldbid"])]["custom"].pop(p["ident"], None)
            return []
        if name == "clientdbinfo":
            c = self.clients.get(int(p["cldbid"]))
            if c is None:
                raise ts3.QueryError(1281, "database empty result set")
            return [{"client_unique_identifier": c["uid"], "client_nickname": c["nickname"], "client_description": c["description"], "client_lastconnected": str(c["lastconnected"])}]
        if name == "clientdbedit":
            self.clients[int(p["cldbid"])]["description"] = p["client_description"]
            return []
        if name == "servergroupsbyclientid":
            c = self.clients[int(p["cldbid"])]
            if not c["groups"]:
                raise ts3.QueryError(1281, "database empty result set")
            return [{"sgid": str(g), "name": self.groups.get(g, "?"), "cldbid": p["cldbid"]} for g in sorted(c["groups"])]
        if name == "servergroupaddclient":
            c = self.clients[int(p["cldbid"])]
            if int(p["sgid"]) in c["groups"]:
                raise ts3.QueryError(2561, "duplicate entry")
            c["groups"].add(int(p["sgid"]))
            return []
        if name == "servergroupdelclient":
            self.clients[int(p["cldbid"])]["groups"].discard(int(p["sgid"]))
            return []
        if name == "clientlist":
            return [{"clid": str(clid), "client_database_id": str(cldbid), "client_nickname": self.clients[cldbid]["nickname"], "client_type": "0"} for clid, cldbid in self.online.items()] + [
                {"clid": "99", "client_database_id": "2", "client_nickname": "EvE Conduit", "client_type": "1"}]
        if name == "clientkick":
            self.kicked.append(self.online.pop(int(p["clid"])))
            return []
        if name == "clientpoke":
            self.poked.append(int(p["clid"]))
            return []
        raise AssertionError(f"unexpected command {name}")


@pytest.fixture
def server(monkeypatch):
    fake = FakeServer()

    def connect(s=None):
        s = s or TeamSpeakSettings.load()
        if not s.configured:
            raise services.TeamSpeakError("TeamSpeak isn't set up on this site yet")
        fake.login(s.query_user, s.query_password)
        return fake

    monkeypatch.setattr(services, "connect", connect)
    return fake


@pytest.fixture
def setup(db, corp, server):
    sync_installed()
    set_enabled("teamspeak", True)
    TeamSpeakSettings.objects.update_or_create(pk=1, defaults={
        "query_host": "ts.example.com", "query_user": "conduit", "query_password": "secret", "server_name": "Alliance comms",
        "registered_sgid": REGISTERED, "server_groups": [{"sgid": i, "name": n} for i, n in server.groups.items()],
    })
    caps = Group.objects.create(name="Capitals")
    GroupMapping.objects.create(group=caps, sgid=CAPS, sg_name="Capitals")
    pilot = make_user(90000001, "Pilot One", corporation=corp)
    pilot.user_permissions.add(Permission.objects.get(codename="access_teamspeak"))
    GroupMapping.objects.create(state=pilot.state, sgid=MEMBER, sg_name="Member")
    return pilot, caps


def link(api_client, server, pilot, cldbid=100, uid="abc=", nickname="Pilot One"):
    """The whole flow: get a key, use it in the client, the site finds the identity."""
    api_client.force_login(pilot)
    body = api_client.call("post", "/api/p/teamspeak/link").json()
    server.add_client(cldbid, uid, nickname)
    server.use_key(body["privilege_key"], cldbid)
    resp = api_client.call("post", "/api/p/teamspeak/link/check")
    assert resp.status_code == 200, resp.content
    return resp.json()


# --- the protocol -------------------------------------------------------------------------------------------------------


def test_escaping_and_parsing():
    assert ts3.escape("a b|c/d\\e") == "a\\sb\\pc\\/d\\\\e"
    assert ts3.unescape(ts3.escape("a b|c/d\\e\n")) == "a b|c/d\\e\n"
    assert ts3.parse("clid=1 client_nickname=Pilot\\sOne|clid=2 client_nickname=Two flag") == [
        {"clid": "1", "client_nickname": "Pilot One"}, {"clid": "2", "client_nickname": "Two", "flag": ""}]
    assert ts3.build("clientkick", {"clid": 3, "reasonmsg": "bye now", "skip": None}, ("uid",)) == "clientkick clid=3 reasonmsg=bye\\snow -uid"
    assert ts3.build("x", {"flag": True}) == "x flag=1"


def test_client_reads_rows_until_the_error_line():
    """The wire format: rows, then error id=0; anything else is a QueryError."""
    import socket

    class Sock:
        def __init__(self, script):
            self.script, self.sent = script, b""

        def sendall(self, data):
            self.sent += data

        def recv(self, n):
            if not self.script:
                return b""
            return self.script.pop(0)

        def close(self):
            pass

    c = ts3.Client("h", 1, throttle=0)
    c._sock = Sock([b"a=1 b=x\\sy|a=2\n\rerror id=0 msg=ok\n\r", b"error id=520 msg=invalid\\sloginname\\sor\\spassword\n\r"])
    assert c.command("list") == [{"a": "1", "b": "x y"}, {"a": "2"}]
    with pytest.raises(ts3.QueryError) as exc:
        c.command("login", {"client_login_name": "a b"})
    assert exc.value.id == 520 and "password" in str(exc.value)
    assert c._sock.sent == b"list\nlogin client_login_name=a\\sb\n"
    # A closed socket is a connection failure, not a hang.
    with pytest.raises(ts3.ConnectionFailed):
        c.command("serverinfo")

    def refuse(*a, **k):
        raise ConnectionRefusedError("refused")

    real = socket.create_connection
    socket.create_connection = refuse
    try:
        with pytest.raises(ts3.ConnectionFailed) as exc:
            ts3.Client("ts.example.com", 10011).connect()
    finally:
        socket.create_connection = real
    assert "ts.example.com:10011" in str(exc.value)


# --- linking -------------------------------------------------------------------------------------------------------------


def test_member_links_with_a_privilege_key(setup, server, api_client):
    pilot, caps = setup
    add_member(pilot, caps, "admin")
    api_client.force_login(pilot)
    me = api_client.call("get", "/api/p/teamspeak/me").json()
    assert me["configured"] and me["can_link"] and me["account"] is None
    assert me["nickname"] == "[TCORP] Pilot One" and me["groups_due"] == ["Capitals", "Member"] and me["registered_group"] == "Registered"
    assert me["server"] == {"name": "Alliance comms", "host": "ts.example.com", "port": 9987}
    assert me["url"] == "ts3server://ts.example.com?port=9987&nickname=%5BTCORP%5D+Pilot+One"

    body = api_client.call("post", "/api/p/teamspeak/link").json()
    key = body["privilege_key"]
    assert body["account"]["status"] == "pending" and body["account"]["privilege_key"] == key
    assert f"token={key}" in body["account"]["connect_url"] and "addbookmark=Alliance+comms" in body["account"]["connect_url"]
    assert server.keys[key]["sgid"] == REGISTERED and server.keys[key]["description"] == "EvE Conduit: [TCORP] Pilot One"
    code = server.keys[key]["custom"]["conduit_link"]
    assert code.startswith(f"{pilot.pk}-") and TeamSpeakUser.objects.get(user=pilot).verify_code == code

    # Not used yet: still pending.
    resp = api_client.call("post", "/api/p/teamspeak/link/check")
    assert resp.status_code == 200 and resp.json()["found"] is False and resp.json()["account"]["status"] == "pending"
    assert api_client.call("post", "/api/p/teamspeak/link/check").status_code == 429  # don't hammer the server

    from django.core.cache import cache
    cache.clear()
    server.add_client(100, "abc=", "Pilot One")
    server.online[5] = 100
    server.use_key(key, 100)
    body = api_client.call("post", "/api/p/teamspeak/link/check").json()
    assert body["found"] is True
    acct = body["account"]
    assert acct["status"] == "linked" and acct["uid"] == "abc=" and acct["nickname"] == "Pilot One" and acct["groups"] == ["Capitals", "Member"]
    assert acct["error"] == "" and acct["last_connected_at"].startswith("2023-11-14")
    # The identity got its groups and description straight away, and a hello.
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER, CAPS} and server.clients[100]["description"] == "[TCORP] Pilot One"
    assert server.poked == [5] and key not in server.keys
    row = TeamSpeakUser.objects.get(user=pilot)
    assert row.cldbid == 100 and row.privilege_key == "" and row.verify_code == "" and row.groups == [MEMBER, CAPS]
    # Only once.
    assert api_client.call("post", "/api/p/teamspeak/link").status_code == 409


def test_a_lost_key_is_replaced_and_giving_up_deletes_it(setup, server, api_client):
    pilot, _ = setup
    api_client.force_login(pilot)
    first = api_client.call("post", "/api/p/teamspeak/link").json()["privilege_key"]
    second = api_client.call("post", "/api/p/teamspeak/link").json()["privilege_key"]
    assert first != second and first not in server.keys and second in server.keys
    assert api_client.call("delete", "/api/p/teamspeak/link").json()["account"] is None
    assert second not in server.keys and not TeamSpeakUser.objects.filter(user=pilot).exists()


def test_an_identity_links_to_one_member_only(setup, server, api_client, corp):
    pilot, _ = setup
    link(api_client, server, pilot, cldbid=100)
    other = make_user(90000002, "Pilot Two", corporation=corp)
    other.user_permissions.add(Permission.objects.get(codename="access_teamspeak"))
    api_client.force_login(other)
    key = api_client.call("post", "/api/p/teamspeak/link").json()["privilege_key"]
    server.use_key(key, 100)  # the same TeamSpeak client
    resp = api_client.call("post", "/api/p/teamspeak/link/check")
    assert resp.status_code == 409 and "another member" in resp.json()["detail"]
    assert TeamSpeakUser.objects.get(user=other).pending and "conduit_link" not in server.clients[100]["custom"]


def test_no_access_no_link(setup, server, api_client):
    pilot, _ = setup
    pilot.user_permissions.clear()
    api_client.force_login(pilot)
    assert api_client.call("post", "/api/p/teamspeak/link").status_code == 403
    assert not api_client.call("get", "/api/p/teamspeak/me").json()["can_link"]


def test_server_trouble_is_explained(setup, server, api_client):
    pilot, _ = setup
    server.login_ok = False
    api_client.force_login(pilot)
    resp = api_client.call("post", "/api/p/teamspeak/link")
    assert resp.status_code == 502 and "ServerQuery login or password was refused" in resp.json()["detail"]


# --- syncing -------------------------------------------------------------------------------------------------------------


def test_groups_follow_the_site(setup, server, api_client, django_capture_on_commit_callbacks):
    pilot, caps = setup
    link(api_client, server, pilot)
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER}
    # Given by hand on the server: left alone.
    server.clients[100]["groups"].add(6)

    with django_capture_on_commit_callbacks(execute=True):
        add_member(pilot, caps, "admin")  # group.joined runs the sync (Celery is eager in tests)
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER, CAPS, 6}
    from conduit.access.groups import remove_member

    with django_capture_on_commit_callbacks(execute=True):
        remove_member(pilot, caps, "admin")
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER, 6}

    # A mapping removed: the group is taken away at the next sync, because it was given before.
    add_member(pilot, caps, "admin")
    GroupMapping.objects.filter(sgid=CAPS).delete()
    assert services.sync_user(pilot) == ""
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER, 6}
    assert TeamSpeakUser.objects.get(user=pilot).groups == [MEMBER]


def test_losing_access_takes_everything_managed_away(setup, server, api_client):
    pilot, _ = setup
    link(api_client, server, pilot)
    server.online[5] = 100
    pilot.user_permissions.clear()
    pilot = type(pilot).objects.get(pk=pilot.pk)
    assert services.sync_user(pilot) == ""
    assert server.clients[100]["groups"] == set() and server.kicked == []
    s = TeamSpeakSettings.load()
    s.kick_without_access = True
    s.save()
    services.sync_user(pilot)
    assert server.kicked == [100]


def test_sync_all_counts_and_forgets_stale_attempts(setup, server, api_client, corp):
    pilot, _ = setup
    link(api_client, server, pilot)
    other = make_user(90000002, "Pilot Two", corporation=corp)
    other.user_permissions.add(Permission.objects.get(codename="access_teamspeak"))
    api_client.force_login(other)
    key = api_client.call("post", "/api/p/teamspeak/link").json()["privilege_key"]
    TeamSpeakUser.objects.filter(user=other).update(created_at=timezone.now() - timedelta(days=2))
    gone = make_user(90000003, "Pilot Three", corporation=corp)
    gone.user_permissions.add(Permission.objects.get(codename="access_teamspeak"))
    link(api_client, server, gone, cldbid=101, uid="def=")
    del server.clients[101]  # the server forgot that identity

    result = services.sync_all()
    assert result == {"synced": 1, "failed": 1, "expired": 1}
    assert key not in server.keys and not TeamSpeakUser.objects.filter(user=other).exists()
    assert "gone from the server" in TeamSpeakUser.objects.get(user=gone).sync_error
    assert TeamSpeakSettings.load().last_full_sync is not None


def test_fix_my_groups_has_a_cooldown(setup, server, api_client):
    pilot, _ = setup
    link(api_client, server, pilot)
    server.clients[100]["groups"].discard(MEMBER)
    assert api_client.call("post", "/api/p/teamspeak/sync").status_code == 200
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER}
    assert api_client.call("post", "/api/p/teamspeak/sync").status_code == 429


def test_unlink_takes_the_groups_away_first(setup, server, api_client):
    pilot, _ = setup
    link(api_client, server, pilot)
    server.clients[100]["groups"].add(6)
    assert api_client.call("delete", "/api/p/teamspeak/link").json()["account"] is None
    assert server.clients[100]["groups"] == {6} and server.clients[100]["custom"] == {}
    assert not TeamSpeakUser.objects.filter(user=pilot).exists()


def test_unlink_keeps_the_link_when_the_server_is_down(setup, server, api_client):
    pilot, _ = setup
    link(api_client, server, pilot)
    server.login_ok = False
    resp = api_client.call("delete", "/api/p/teamspeak/link")
    assert resp.status_code == 502 and TeamSpeakUser.objects.filter(user=pilot).exists()


def test_compliance(setup, server, api_client):
    pilot, _ = setup
    assert services.compliance_problems(pilot) == []
    s = TeamSpeakSettings.load()
    s.require_for_compliance = True
    s.save()
    assert services.compliance_problems(pilot) == ["TeamSpeak: not linked (link it on the TeamSpeak page)"]
    link(api_client, server, pilot)
    assert services.compliance_problems(pilot) == []


def test_merge_moves_the_link(setup, server, api_client, corp, django_capture_on_commit_callbacks):
    from conduit.events import bus

    pilot, _ = setup
    link(api_client, server, pilot)
    main = make_user(90000002, "Main Pilot", corporation=corp)
    main.user_permissions.add(Permission.objects.get(codename="access_teamspeak"))
    with django_capture_on_commit_callbacks(execute=True):
        bus.emit("user.merged", from_user_id=pilot.pk, to_user_id=main.pk, records_moved=True)
    acct = TeamSpeakUser.objects.get(cldbid=100)
    assert acct.user_id == main.pk and server.clients[100]["description"] == "[TCORP] Main Pilot"


# --- admin -----------------------------------------------------------------------------------------------------------------


def test_admin_settings_check_and_mapping(setup, server, api_client, admin_user, corp):
    pilot, caps = setup
    api_client.force_login(admin_user)
    admin = api_client.call("get", "/api/p/teamspeak/admin").json()
    assert admin["settings"]["query_password_set"] and admin["settings"]["query_host"] == "ts.example.com"
    assert admin["stats"] == {"linked": 0, "pending": 0, "errors": 0}

    resp = api_client.call("put", "/api/p/teamspeak/admin/settings", {
        "query_host": "ts3server://TS.example.com/", "query_port": 10011, "query_user": "conduit", "query_password": "",
        "server_id": 1, "public_host": "voice.example.com", "public_port": 9987, "server_name": "", "nickname_format": "{character}",
        "registered_sgid": REGISTERED, "kick_without_access": True, "require_for_compliance": False, "allowlisted": True,
    })
    assert resp.status_code == 200, resp.content
    s = TeamSpeakSettings.load()
    assert s.query_host == "ts.example.com" and s.query_password == "secret" and s.public_host == "voice.example.com" and s.allowlisted
    bad = api_client.call("put", "/api/p/teamspeak/admin/settings", {"query_host": "ts.example.com", "query_user": "x", "nickname_format": "{nope}"})
    assert bad.status_code == 400 and "placeholder" in bad.json()["detail"]

    # Checking the connection remembers the server's name, version and groups, and makes the registered group if needed.
    s.registered_sgid = 0
    s.save()
    body = api_client.call("post", "/api/p/teamspeak/admin/check").json()
    assert body["check"]["name"] == "Alliance TS" and body["check"]["version"] == "3.13.7 Linux" and body["check"]["problems"] == []
    assert body["check"]["registered_group"] == "Registered" and TeamSpeakSettings.load().registered_sgid == REGISTERED
    assert {g["name"] for g in body["admin"]["server_groups"]} == {"Registered", "Member", "Capitals", "Server Admin"}
    assert body["admin"]["settings"]["virtual_server_name"] == "Alliance TS"
    # A mapped group that vanished is reported.
    del server.groups[CAPS]
    body = api_client.call("post", "/api/p/teamspeak/admin/check").json()
    assert body["check"]["problems"] and "Capitals" in body["check"]["problems"][0]

    # Mapping: only groups the server has.
    server.groups[CAPS] = "Capitals"
    api_client.call("post", "/api/p/teamspeak/admin/check")
    resp = api_client.call("put", "/api/p/teamspeak/admin/mappings", {"mappings": [
        {"kind": "group", "target_id": caps.pk, "sgid": CAPS}, {"kind": "state", "target_id": pilot.state_id, "sgid": MEMBER},
        {"kind": "state", "target_id": pilot.state_id, "sgid": MEMBER},  # duplicates collapse
    ]})
    assert resp.status_code == 200 and len(resp.json()["mappings"]) == 2 and resp.json()["mappings"][0]["sg_name"] == "Capitals"
    assert api_client.call("put", "/api/p/teamspeak/admin/mappings", {"mappings": [{"kind": "group", "target_id": caps.pk, "sgid": 4242}]}).status_code == 400

    # Members list, resync and unlink.
    link(api_client, server, pilot)
    api_client.force_login(admin_user)
    rows = api_client.call("get", "/api/p/teamspeak/admin/members").json()
    assert len(rows) == 1 and rows[0]["user"]["name"] == "Pilot One" and rows[0]["groups_due"] == ["Member"] and rows[0]["characters"][0]["main"]
    server.clients[100]["groups"].discard(MEMBER)
    assert api_client.call("post", f"/api/p/teamspeak/admin/members/{pilot.pk}/sync").json()["groups"] == ["Member"]
    assert server.clients[100]["groups"] == {REGISTERED, MEMBER}
    assert api_client.call("delete", f"/api/p/teamspeak/admin/members/{pilot.pk}").status_code == 200
    assert server.clients[100]["groups"] == set() and not TeamSpeakUser.objects.filter(user=pilot).exists()
    assert api_client.call("delete", f"/api/p/teamspeak/admin/members/{pilot.pk}").status_code == 404

    # Not for everyone.
    api_client.force_login(pilot)
    assert api_client.call("get", "/api/p/teamspeak/admin").status_code == 403


def test_new_states_get_access_by_default(db, django_capture_on_commit_callbacks):
    from conduit.access.models import State

    sync_installed()
    with django_capture_on_commit_callbacks(execute=True):
        st = State.objects.create(name="Blue", priority=5)
        guest = State.objects.create(name="Guest", priority=-5, public=True)
    assert st.permissions.filter(codename="access_teamspeak").exists()
    assert not guest.permissions.filter(codename="access_teamspeak").exists()
