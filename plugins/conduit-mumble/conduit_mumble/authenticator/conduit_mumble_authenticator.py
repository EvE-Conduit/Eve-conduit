#!/usr/bin/env python3
"""EvE Conduit Mumble authenticator.

Runs next to the Mumble server (murmur / mumble-server) and answers its logins by asking your EvE Conduit site, so
members sign in to Mumble with the account they made on the site and guests with a temporary link. The Mumble server
never holds a password.

Needs Python 3.9+ and the ``zeroc-ice`` package (``pip install zeroc-ice``; on Debian/Ubuntu ``apt install
python3-zeroc-ice`` works too), plus Ice switched on in murmur.ini::

    ice="tcp -h 127.0.0.1 -p 6502"
    icesecretwrite=change-me

Run it with ``python conduit_mumble_authenticator.py -i authenticator.ini``. Administration → Mumble → Setup on the
site has a config file with the site filled in and a systemd unit.
"""

import argparse
import configparser
import json
import logging
import os
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

VERSION = "1.0.0"
SLICE_CANDIDATES = (
    "/usr/share/slice/Murmur.ice",
    "/usr/share/mumble-server/Murmur.ice",
    "/usr/share/murmur/Murmur.ice",
    "/usr/local/share/slice/Murmur.ice",
    "C:/Program Files/Mumble/server/Murmur.ice",
)
log = logging.getLogger("conduit-mumble")


# --- the site --------------------------------------------------------------------------------------------------------


class Site:
    """Calls to EvE Conduit's Mumble API (/api/v1/p/mumble/) with the API key."""

    def __init__(self, url, api_key, timeout=10.0):
        self.base = url.rstrip("/") + "/api/v1/p/mumble"
        self.api_key = api_key
        self.timeout = timeout

    def call(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method)
        req.add_header("Authorization", "Bearer " + self.api_key)
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "conduit-mumble-authenticator/" + VERSION)
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return resp.status, json.loads(resp.read().decode() or "null")
        except urllib.error.HTTPError as exc:
            try:
                detail = json.loads(exc.read().decode()).get("detail", "")
            except Exception:  # noqa: BLE001
                detail = ""
            if exc.code not in (404,):
                log.warning("site answered %s on %s %s: %s", exc.code, method, path, detail)
            return exc.code, {"detail": detail}
        except (urllib.error.URLError, OSError, ValueError) as exc:
            log.error("can't reach the site for %s %s: %s", method, path, exc)
            return 0, None

    def authenticate(self, name, password, certhash, strong):
        status, body = self.call("POST", "/authenticate", {"name": name, "password": password or "", "certhash": certhash or "",
                                                            "strong": bool(strong), "version": VERSION})
        return body if status == 200 else None

    def user(self, mumble_id):
        status, body = self.call("GET", "/users/%d" % mumble_id)
        return body if status == 200 else None

    def name_to_id(self, name):
        status, body = self.call("GET", "/users/by-name?name=" + urllib.parse.quote(name, safe=""))
        return body["id"] if status == 200 else None

    def ping(self):
        status, _ = self.call("POST", "/ping", {"version": VERSION})
        return status == 200


class Cache:
    """Keeps answers that Mumble asks for again and again (names of ids, avatars) for a few minutes."""

    def __init__(self, ttl=300):
        self.ttl = ttl
        self.lock = threading.Lock()
        self.items = {}

    def get(self, key):
        with self.lock:
            hit = self.items.get(key)
            if hit and hit[0] > time.monotonic():
                return hit[1]
            self.items.pop(key, None)
        return None

    def put(self, key, value):
        with self.lock:
            self.items[key] = (time.monotonic() + self.ttl, value)
            if len(self.items) > 5000:
                self.items.clear()
        return value


# --- Ice ---------------------------------------------------------------------------------------------------------------


def load_murmur(slice_path):
    import Ice

    path = slice_path or next((c for c in SLICE_CANDIDATES if Path(c).is_file()), None)
    if not path or not Path(path).is_file():
        sys.exit("Murmur.ice not found; set [ice] slice to the file that came with your Mumble server")
    slice_dir = Ice.getSliceDir()
    Ice.loadSlice("", ["-I" + slice_dir, path] if slice_dir else [path])
    import Murmur  # noqa: F401  (made by loadSlice)

    return Ice, sys.modules["Murmur"]


def make_authenticator(Murmur, site, avatars):
    cache = Cache()

    class Authenticator(Murmur.ServerUpdatingAuthenticator):
        def __init__(self, server):
            self.server = server

        # Mumble calls these for every login and whenever it needs to know who an id is.

        def authenticate(self, name, pw, certlist, certhash, strong, current=None):
            """Returns (id, name to show, groups). id -1 refuses, -2 lets the server decide (SuperUser)."""
            if name == "SuperUser":
                return (-2, None, None)
            answer = site.authenticate(name, pw, certhash, strong)
            if answer is None:
                log.warning("refusing %s: the site didn't answer", name)
                return (-1, None, None)
            result = answer.get("result")
            if result == "ok":
                log.info("%s signed in as %s (%s) with groups %s", name, answer["name"], answer.get("kind", ""), ", ".join(answer.get("groups", [])) or "-")
                cache.put(("name", answer["id"]), answer["name"])
                return (int(answer["id"]), answer["name"], list(answer.get("groups", [])))
            if result == "fallthrough":
                return (-2, None, None)
            log.info("refused %s%s", name, ": " + answer["reason"] if answer.get("reason") else "")
            return (-1, None, None)

        def getInfo(self, id, current=None):
            name = self.idToName(id)
            if not name:
                return (False, None)
            return (True, {Murmur.UserInfo.UserName: name})

        def nameToId(self, name, current=None):
            hit = cache.get(("id", name.lower()))
            if hit is not None:
                return hit
            mumble_id = site.name_to_id(name)
            return cache.put(("id", name.lower()), -2 if mumble_id is None else int(mumble_id))

        def idToName(self, id, current=None):
            if id < 0:
                return ""
            hit = cache.get(("name", id))
            if hit is not None:
                return hit
            info = site.user(id)
            return cache.put(("name", id), info["name"] if info else "")

        def idToTexture(self, id, current=None):
            if not avatars or id < 0:
                return b""
            hit = cache.get(("texture", id))
            if hit is not None:
                return hit
            info = site.user(id)
            url = (info or {}).get("texture_url")
            data = b""
            if url:
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": "conduit-mumble-authenticator/" + VERSION})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        data = resp.read()
                except (urllib.error.URLError, OSError) as exc:
                    log.debug("no portrait for %s: %s", id, exc)
            return cache.put(("texture", id), data)

        # Registration happens on the site, not in Mumble: let the server's own database handle whatever these ask.

        def registerUser(self, name, current=None):
            return -2

        def unregisterUser(self, id, current=None):
            return -2

        def getRegisteredUsers(self, filter, current=None):
            return {}

        def setInfo(self, id, info, current=None):
            return -2

        def setTexture(self, id, texture, current=None):
            return -2

    return Authenticator


def attach(Murmur, adapter, server, Authenticator, attached):
    sid = server.id()
    if sid in attached:
        return
    prx = Murmur.ServerUpdatingAuthenticatorPrx.uncheckedCast(adapter.addWithUUID(Authenticator(server)))
    server.setAuthenticator(prx)
    attached[sid] = prx
    log.info("attached to virtual server %s", sid)


def main():
    parser = argparse.ArgumentParser(description="EvE Conduit Mumble authenticator")
    parser.add_argument("-i", "--ini", default=str(Path(__file__).with_name("authenticator.ini")), help="config file")
    args = parser.parse_args()
    cfg = configparser.ConfigParser()
    if not cfg.read(args.ini, encoding="utf-8"):
        sys.exit("config file not found: %s (download it from Administration → Mumble → Setup)" % args.ini)
    logging.basicConfig(level=getattr(logging, cfg.get("log", "level", fallback="info").upper(), logging.INFO),
                        format="%(asctime)s %(levelname)s %(message)s")
    url, api_key = cfg.get("conduit", "url", fallback=""), cfg.get("conduit", "api_key", fallback="")
    if not url or not api_key or api_key == "evk_...":
        sys.exit("set [conduit] url and api_key in %s" % args.ini)
    site = Site(url, api_key, cfg.getfloat("conduit", "timeout", fallback=10.0))
    if not site.ping():
        log.warning("the site didn't accept the API key yet (is the Mumble API switched on under Administration → API?); trying anyway")

    Ice, Murmur = load_murmur(cfg.get("ice", "slice", fallback=""))
    props = Ice.createProperties()
    props.setProperty("Ice.ImplicitContext", "Shared")
    props.setProperty("Ice.MessageSizeMax", "65535")
    props.setProperty("Ice.Default.EncodingVersion", "1.0")
    idata = Ice.InitializationData()
    idata.properties = props
    ice = Ice.initialize(idata)
    secret = cfg.get("ice", "secret", fallback="")
    if secret:
        ice.getImplicitContext().put("secret", secret)
    host, port = cfg.get("ice", "host", fallback="127.0.0.1"), cfg.getint("ice", "port", fallback=6502)
    wanted = {int(s) for s in cfg.get("murmur", "servers", fallback="").replace(" ", "").split(",") if s}
    avatars = cfg.getboolean("user", "avatars", fallback=True)
    watchdog = cfg.getint("ice", "watchdog", fallback=30)
    Authenticator = make_authenticator(Murmur, site, avatars)

    adapter = ice.createObjectAdapterWithEndpoints("Callback.Client", "tcp -h %s" % host)
    adapter.activate()
    meta = Murmur.MetaPrx.uncheckedCast(ice.stringToProxy("Meta:tcp -h %s -p %d" % (host, port)))
    attached = {}
    last_ping = 0.0
    log.info("conduit-mumble-authenticator %s for %s", VERSION, url)
    try:
        while True:
            try:
                servers = meta.getBootedServers()
                for server in servers:
                    if not wanted or server.id() in wanted:
                        attach(Murmur, adapter, server, Authenticator, attached)
                # Servers that went away (restarted) need attaching again when they come back.
                running = {s.id() for s in servers}
                for sid in [s for s in attached if s not in running]:
                    attached.pop(sid)
                    log.warning("virtual server %s stopped; will attach again when it's back", sid)
            except Ice.Exception as exc:  # the Mumble server is down or Ice refused us
                if attached:
                    log.warning("lost the Mumble server (%s); waiting for it", exc.__class__.__name__)
                    attached.clear()
                else:
                    log.debug("Mumble server not reachable yet: %s", exc)
            if time.monotonic() - last_ping > 300:
                site.ping()
                last_ping = time.monotonic()
            time.sleep(watchdog)
    except KeyboardInterrupt:
        pass
    finally:
        ice.destroy()


if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parent)
    main()
