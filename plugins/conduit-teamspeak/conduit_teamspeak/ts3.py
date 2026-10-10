"""A small TeamSpeak ServerQuery client: the raw text protocol on port 10011, which TeamSpeak 3 and TeamSpeak 6
servers speak. Only the handful of commands the plugin needs.

A command is one line, ``name key=value key=value -option``; the answer is zero or more data lines (items separated
by ``|``) followed by ``error id=0 msg=ok``. Values are escaped (spaces become ``\\s`` and so on).
"""

from __future__ import annotations

import socket
import time
from datetime import UTC, datetime

#: Socket timeout for connecting and for every answer.
TIMEOUT = 10.0
#: Seconds between commands unless the site is on the server's query allow list: the default flood limit is 10
#: commands per 3 seconds, and going over it bans the site's address for ten minutes.
THROTTLE = 0.35
#: Nickname the site's query connection shows in the server's client list.
QUERY_NICKNAME = "EvE Conduit"

#: ``error id`` values the plugin reacts to.
ERR_OK = 0
ERR_NICKNAME_IN_USE = 513
ERR_BAD_LOGIN = 520
ERR_EMPTY_RESULT = 1281
ERR_NO_PERMISSION = 2568
ERR_DUPLICATE = 2561
ERR_FLOOD = 3329

_ESCAPES = (("\\", "\\\\"), ("/", "\\/"), (" ", "\\s"), ("|", "\\p"), ("\a", "\\a"), ("\b", "\\b"), ("\f", "\\f"),
            ("\n", "\\n"), ("\r", "\\r"), ("\t", "\\t"), ("\v", "\\v"))
_UNESCAPES = {"\\": "\\", "/": "/", "s": " ", "p": "|", "a": "\a", "b": "\b", "f": "\f", "n": "\n", "r": "\r", "t": "\t", "v": "\v"}


def escape(value) -> str:
    text = str(value)
    for raw, esc in _ESCAPES:
        text = text.replace(raw, esc)
    return text


def unescape(value: str) -> str:
    out, i = [], 0
    while i < len(value):
        c = value[i]
        if c == "\\" and i + 1 < len(value):
            out.append(_UNESCAPES.get(value[i + 1], value[i + 1]))
            i += 2
        else:
            out.append(c)
            i += 1
    return "".join(out)


def parse(line: str) -> list[dict[str, str]]:
    """``a=1 b=x\\sy|a=2`` → ``[{"a": "1", "b": "x y"}, {"a": "2"}]``. A key without ``=`` gets an empty value."""
    items = []
    for item in line.split("|"):
        row: dict[str, str] = {}
        for pair in item.split(" "):
            if not pair:
                continue
            key, _, value = pair.partition("=")
            row[unescape(key)] = unescape(value)
        items.append(row)
    return items


def build(name: str, params: dict | None = None, options: tuple[str, ...] = ()) -> str:
    parts = [name]
    for key, value in (params or {}).items():
        if value is None:
            continue
        if isinstance(value, bool):
            value = int(value)
        parts.append(f"{key}={escape(value)}")
    parts.extend(f"-{o}" for o in options)
    return " ".join(parts)


def ts_time(value: str | None) -> datetime | None:
    """A unix time from the server, or None for 0/empty."""
    try:
        n = int(value or 0)
    except ValueError:
        return None
    return datetime.fromtimestamp(n, UTC) if n > 0 else None


class QueryError(Exception):
    def __init__(self, id: int, msg: str, extra: str = ""):
        super().__init__(msg)
        self.id = id
        self.msg = msg
        self.extra = extra

    def __str__(self):
        return f"{self.msg} ({self.extra})" if self.extra else self.msg


class ConnectionFailed(QueryError):
    """Couldn't reach the query port, or it didn't speak ServerQuery."""

    def __init__(self, msg: str):
        super().__init__(-1, msg)


class Client:
    """One ServerQuery session. Use it as a context manager so it logs out and closes the socket."""

    def __init__(self, host: str, port: int = 10011, *, timeout: float = TIMEOUT, throttle: float = THROTTLE):
        self.host, self.port, self.timeout, self.throttle = host, port, timeout, throttle
        self._sock: socket.socket | None = None
        self._buffer = b""
        self._last = 0.0

    # --- the wire --------------------------------------------------------------------------------------------

    def connect(self) -> None:
        try:
            self._sock = socket.create_connection((self.host, self.port), timeout=self.timeout)
        except OSError as exc:
            raise ConnectionFailed(f"Couldn't connect to {self.host}:{self.port} ({exc.__class__.__name__}: {exc})") from None
        # The banner: "TS3" and a "Welcome to the TeamSpeak ... ServerQuery interface" line.
        first = self._readline()
        if first.strip() != "TS3":
            self.close()
            raise ConnectionFailed(f"{self.host}:{self.port} isn't a ServerQuery port (it said {first.strip()[:40]!r})")
        for _ in range(3):
            if self._readline().startswith("Welcome"):
                break

    def close(self) -> None:
        if self._sock is not None:
            try:
                self._sock.sendall(b"quit\n")
            except OSError:
                pass
            try:
                self._sock.close()
            finally:
                self._sock = None

    def __enter__(self) -> "Client":
        if self._sock is None:
            self.connect()
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def _readline(self) -> str:
        assert self._sock is not None
        while b"\n" not in self._buffer:
            try:
                chunk = self._sock.recv(4096)
            except TimeoutError:
                raise ConnectionFailed("The server didn't answer in time") from None
            except OSError as exc:
                raise ConnectionFailed(f"The connection dropped ({exc.__class__.__name__})") from None
            if not chunk:
                raise ConnectionFailed("The server closed the connection")
            self._buffer += chunk
        line, _, self._buffer = self._buffer.partition(b"\n")
        # Answers end with "\n\r", so the "\r" of the previous line leads this one.
        return line.decode("utf-8", "replace").strip("\r")

    def command(self, name: str, params: dict | None = None, options: tuple[str, ...] = ()) -> list[dict[str, str]]:
        """Send one command and return its data rows. Raises QueryError for any ``error id`` but 0."""
        if self._sock is None:
            self.connect()
        assert self._sock is not None
        wait = self.throttle - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        try:
            self._sock.sendall((build(name, params, options) + "\n").encode("utf-8"))
        except OSError as exc:
            raise ConnectionFailed(f"Couldn't send to the server ({exc.__class__.__name__})") from None
        self._last = time.monotonic()
        rows: list[dict[str, str]] = []
        while True:
            line = self._readline()
            if not line:
                continue
            if line.startswith("error "):
                err = parse(line[6:])[0]
                code = int(err.get("id", "0") or 0)
                if code != ERR_OK:
                    raise QueryError(code, err.get("msg", "unknown error"), err.get("extra_msg", ""))
                return rows
            if line.startswith("notify"):
                continue  # not subscribed to any, but be safe
            rows.extend(parse(line))

    # --- commands ------------------------------------------------------------------------------------------------

    def login(self, user: str, password: str) -> None:
        self.command("login", {"client_login_name": user, "client_login_password": password})

    def use(self, sid: int) -> None:
        self.command("use", {"sid": sid})

    def set_nickname(self, nickname: str = QUERY_NICKNAME) -> None:
        """Name the query connection; a second connection from the site gets a numbered name."""
        for n in range(1, 6):
            try:
                self.command("clientupdate", {"client_nickname": nickname if n == 1 else f"{nickname} {n}"})
                return
            except QueryError as exc:
                if exc.id != ERR_NICKNAME_IN_USE:
                    raise

    def serverinfo(self) -> dict:
        return self.command("serverinfo")[0]

    def servergrouplist(self) -> list[dict]:
        """Regular server groups (type 1), not templates or query groups."""
        return [g for g in self.command("servergrouplist") if g.get("type", "1") == "1"]

    def servergroupadd(self, name: str) -> int:
        return int(self.command("servergroupadd", {"name": name, "type": 1})[0]["sgid"])

    def servergroups_of(self, cldbid: int) -> set[int]:
        try:
            return {int(r["sgid"]) for r in self.command("servergroupsbyclientid", {"cldbid": cldbid})}
        except QueryError as exc:
            if exc.id == ERR_EMPTY_RESULT:
                return set()
            raise

    def servergroupaddclient(self, sgid: int, cldbid: int) -> None:
        try:
            self.command("servergroupaddclient", {"sgid": sgid, "cldbid": cldbid})
        except QueryError as exc:
            if exc.id != ERR_DUPLICATE:
                raise

    def servergroupdelclient(self, sgid: int, cldbid: int) -> None:
        try:
            self.command("servergroupdelclient", {"sgid": sgid, "cldbid": cldbid})
        except QueryError as exc:
            if exc.id != ERR_EMPTY_RESULT:
                raise

    def privilegekeyadd(self, sgid: int, description: str, custom_ident: str, custom_value: str) -> str:
        """A one-time key for a server group that also stamps a custom property on whoever uses it."""
        # The custom set is one parameter: "ident=x value=y" (several joined with "|"), escaped as a whole like any
        # other value, so its spaces go out as \s.
        row = self.command("privilegekeyadd", {
            "tokentype": 0, "tokenid1": sgid, "tokenid2": 0, "tokendescription": description,
            "tokencustomset": f"ident={custom_ident} value={custom_value}",
        })[0]
        return row["token"]

    def privilegekeydelete(self, token: str) -> None:
        try:
            self.command("privilegekeydelete", {"token": token})
        except QueryError as exc:
            if exc.id != ERR_EMPTY_RESULT:
                raise

    def customsearch(self, ident: str, pattern: str) -> list[dict]:
        """Identities with that custom property; ``cldbid`` and ``value`` per row."""
        try:
            return self.command("customsearch", {"ident": ident, "pattern": pattern})
        except QueryError as exc:
            if exc.id == ERR_EMPTY_RESULT:
                return []
            raise

    def customdelete(self, cldbid: int, ident: str) -> None:
        try:
            self.command("customdelete", {"cldbid": cldbid, "ident": ident})
        except QueryError as exc:
            if exc.id != ERR_EMPTY_RESULT:
                raise

    def clientdbinfo(self, cldbid: int) -> dict | None:
        """What the server remembers about an identity, or None if it's gone from the database."""
        try:
            return self.command("clientdbinfo", {"cldbid": cldbid})[0]
        except QueryError as exc:
            if exc.id == ERR_EMPTY_RESULT:
                return None
            raise

    def clientdbedit(self, cldbid: int, **props) -> None:
        self.command("clientdbedit", {"cldbid": cldbid, **props})

    def clientlist(self) -> list[dict]:
        """Everyone connected right now (voice clients only), with ``clid`` and ``client_database_id``."""
        return [c for c in self.command("clientlist", options=("uid",)) if c.get("client_type", "0") == "0"]

    def clientkick(self, clid: int, reason: str) -> None:
        self.command("clientkick", {"clid": clid, "reasonid": 5, "reasonmsg": reason[:40]})

    def clientpoke(self, clid: int, msg: str) -> None:
        self.command("clientpoke", {"clid": clid, "msg": msg[:100]})


def explain(exc: QueryError) -> str:
    """What went wrong, for members and admins."""
    if isinstance(exc, ConnectionFailed):
        return str(exc)
    if exc.id == ERR_BAD_LOGIN:
        return "The ServerQuery login or password was refused; check them under TeamSpeak → Setup"
    if exc.id == ERR_NO_PERMISSION:
        return f"The ServerQuery login isn't allowed to do that ({exc.msg}); give it server admin query rights"
    if exc.id == ERR_FLOOD:
        return "The server has banned this site for sending commands too fast; add its address to query_ip_allowlist.txt and wait ten minutes"
    if exc.id == 1024 or exc.msg == "invalid serverID":
        return "There's no virtual server with that id; check the server id under Setup"
    return str(exc)
