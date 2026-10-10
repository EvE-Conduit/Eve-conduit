#!/usr/bin/env python3
"""Move a SeAT install's users, characters, SSO tokens and squads into EvE Conduit.

It reads either a dump of SeAT's database (--dump, any machine) or the live database from its container (run on
the SeAT server; nothing is written to disk), lets you pick which users to bring over, then drives Conduit's
import API:

    preview -> import in batches -> squads -> token check

With --no-tokens it copies accounts, characters and squads only. Members then log in to Conduit once with any of
their characters; the owner check puts them back in their imported account with their groups, and their alts
show up asking to log in again.

Only the Python standard library is used (Python 3.8 or newer). See README.md next to this file.
"""

from __future__ import annotations

import argparse
import getpass
import gzip
import json
import os
import shlex
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime

import seat_dump

#: Kept equal to Conduit's version (a test checks), so a report or error says which build it came from.
VERSION = "0.5.37"
#: Users per request. With tokens and scopes this stays well under Conduit's request size limit.
BATCH = 25
#: Seconds between polls of the token check.
POLL = 3
HTTP_RETRIES = 3
#: Seconds to wait for Conduit's workers to pick up the token check.
START_TIMEOUT = 120


class ImportError_(Exception):
    """Stops the run with a message for the operator."""


# --- reading SeAT -----------------------------------------------------------------------------------------


@dataclass
class Character:
    id: int
    name: str
    owner_hash: str
    refresh_token: str = ""
    scopes: list = field(default_factory=list)
    deleted: bool = False


@dataclass
class User:
    seat_id: int
    name: str
    main_character_id: int
    active: bool
    characters: list = field(default_factory=list)

    def matches(self, text: str) -> bool:
        text = text.lower()
        return text in self.name.lower() or any(text in c.name.lower() for c in self.characters)

    def payload(self, with_tokens: bool) -> dict:
        return {
            "seat_id": self.seat_id,
            "name": self.name,
            "main_character_id": self.main_character_id,
            "characters": [
                {
                    "id": c.id,
                    "name": c.name,
                    "owner_hash": c.owner_hash,
                    "refresh_token": c.refresh_token if with_tokens and not c.deleted else "",
                    "scopes": c.scopes,
                }
                for c in self.characters
            ],
        }


@dataclass
class Squad:
    id: int
    name: str
    description: str
    type: str  # manual, auto or hidden
    members: list = field(default_factory=list)  # SeAT user ids
    moderators: list = field(default_factory=list)


def seat_query(with_tokens: bool) -> str:
    """One query per kind of row, each row a tag and a JSON object, so names and descriptions need no escaping."""
    token = ", 'rt', t.refresh_token" if with_tokens else ""
    return f"""
SELECT CONCAT('U\t', JSON_OBJECT('id', id, 'name', name, 'main', main_character_id, 'active', active)) FROM users;
SELECT CONCAT('C\t', JSON_OBJECT('id', t.character_id, 'user', t.user_id, 'name', COALESCE(ci.name, ''),
       'hash', t.character_owner_hash, 'scopes', t.scopes, 'deleted', t.deleted_at IS NOT NULL{token}))
  FROM refresh_tokens t LEFT JOIN character_infos ci ON ci.character_id = t.character_id;
SELECT CONCAT('S\t', JSON_OBJECT('id', id, 'name', name, 'description', description, 'type', type)) FROM squads;
SELECT CONCAT('M\t', JSON_OBJECT('squad', squad_id, 'user', user_id)) FROM squad_member;
SELECT CONCAT('O\t', JSON_OBJECT('squad', squad_id, 'user', user_id)) FROM squad_moderator;
"""


def parse_seat(output: str) -> tuple[list[User], list[Squad]]:
    """The output of ``seat_query``: one tag and one JSON object per line."""
    rows: dict[str, list] = {"U": [], "C": [], "S": [], "M": [], "O": []}
    for line in output.splitlines():
        tag, _, body = line.partition("\t")
        if tag in rows and body:
            rows[tag].append(json.loads(body))
    return assemble(rows)


def assemble(rows: dict) -> tuple[list[User], list[Squad]]:
    """Users with their characters, and squads, from rows shaped like ``seat_query``'s (whatever they came from)."""
    users = {r["id"]: User(r["id"], r["name"], int(r["main"] or 0), bool(r["active"])) for r in rows["U"]}
    squads = {r["id"]: Squad(r["id"], r["name"], r["description"] or "", r["type"]) for r in rows["S"]}
    chars, members, mods = rows["C"], rows["M"], rows["O"]

    for row in chars:
        user = users.get(row["user"])
        if user is None:
            continue
        scopes = row.get("scopes") or []
        if isinstance(scopes, str):  # MariaDB hands JSON columns over as text
            scopes = json.loads(scopes or "[]")
        user.characters.append(Character(
            id=int(row["id"]),
            name=row["name"] or f"Character {row['id']}",
            owner_hash=row["hash"] or "",
            refresh_token=row.get("rt") or "",
            scopes=[s for s in scopes if isinstance(s, str)],
            deleted=bool(row["deleted"]),
        ))
    for row in members:
        if row["squad"] in squads:
            squads[row["squad"]].members.append(row["user"])
    for row in mods:
        if row["squad"] in squads:
            squads[row["squad"]].moderators.append(row["user"])

    out = []
    for user in users.values():
        if not user.characters:
            continue  # SeAT's built-in admin and anyone who never linked a character
        ids = {c.id for c in user.characters}
        if user.main_character_id not in ids:
            user.main_character_id = user.characters[0].id
        user.characters.sort(key=lambda c: (c.id != user.main_character_id, c.name.lower()))
        out.append(user)
    out.sort(key=lambda u: u.name.lower())
    return out, sorted(squads.values(), key=lambda s: s.name.lower())


# --- reading a SeAT database dump ---------------------------------------------------------------------------

#: The tables the import needs; the rest of a dump is skipped without being parsed.
DUMP_TABLES = ("users", "refresh_tokens", "character_infos", "squads", "squad_member", "squad_moderator")


def read_dump_tables(path: str, tables=DUMP_TABLES) -> dict[str, list[dict]]:
    try:
        return seat_dump.read_tables(path, tables)
    except seat_dump.DumpError as exc:
        raise ImportError_(str(exc)) from None


def read_dump(path: str, with_tokens: bool) -> tuple[list[User], list[Squad]]:
    t = read_dump_tables(path)
    names = {r["character_id"]: r["name"] for r in t["character_infos"]}
    rows = {
        "U": [{"id": r["id"], "name": r["name"], "main": r["main_character_id"], "active": r["active"]}
              for r in t["users"]],
        "C": [{"id": r["character_id"], "user": r["user_id"], "name": names.get(r["character_id"], ""),
               "hash": r["character_owner_hash"], "scopes": r["scopes"], "deleted": r["deleted_at"] is not None,
               "rt": r["refresh_token"] if with_tokens else ""}
              for r in t["refresh_tokens"]],
        "S": [{"id": r["id"], "name": r["name"], "description": r["description"], "type": r["type"]}
              for r in t["squads"]],
        "M": [{"squad": r["squad_id"], "user": r["user_id"]} for r in t["squad_member"]],
        "O": [{"squad": r["squad_id"], "user": r["user_id"]} for r in t["squad_moderator"]],
    }
    return assemble(rows)


def db_command(args) -> list[str]:
    if args.db_command:
        return shlex.split(args.db_command)
    client = " ".join(shlex.quote(a) for a in ["mariadb", "--batch", "--raw", "--skip-column-names",
                                                "--default-character-set=utf8mb4", "-u", args.db_user, args.db_name])
    # The password arrives as the first line of input, so it is on no command line, here or in the container.
    return ["docker", "compose", "exec", "-T", args.db_service, "sh", "-c",
            f'IFS= read -r MYSQL_PWD; export MYSQL_PWD; exec {client}']


def read_seat(args, password: str, run=subprocess.run) -> tuple[list[User], list[Squad]]:
    if "\n" in password:
        raise ImportError_("The database password can't contain a line break.")
    query = seat_query(not args.no_tokens)
    if args.db_command:  # a local client reads MYSQL_PWD from its environment
        env, stdin = dict(os.environ, MYSQL_PWD=password), query
    else:
        env, stdin = dict(os.environ), password + "\n" + query
    try:
        proc = run(db_command(args), input=stdin, capture_output=True, text=True,
                   encoding="utf-8", env=env, cwd=None if args.db_command else args.seat_dir)
    except FileNotFoundError as exc:
        raise ImportError_(f"Could not run {exc.filename!r}. Is Docker installed here, or pass --db-command.") from None
    if proc.returncode != 0:
        raise ImportError_("Reading SeAT's database failed:\n" + proc.stderr.strip())
    return parse_seat(proc.stdout)


def seat_client_id(seat_dir: str) -> str:
    """EVE_CLIENT_ID from seat-docker's .env (only that line is read)."""
    path = os.path.join(seat_dir, ".env")
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                key, sep, value = line.strip().partition("=")
                if sep and key.strip() == "EVE_CLIENT_ID":
                    return value.strip().strip("'\"")
    except OSError:
        pass
    return ""


# --- talking to Conduit -----------------------------------------------------------------------------------


class Conduit:
    def __init__(self, base: str, key: str, opener=urllib.request.urlopen):
        self.base = base.rstrip("/") + "/api/v1"
        self.key = key
        self.opener = opener

    def call(self, method: str, path: str, data=None, retry: bool = True, gzipped: bool = False):
        body = None if data is None else json.dumps(data, separators=(",", ":")).encode()
        headers = {
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "conduit-seat-import",
        }
        if gzipped and body is not None:
            body = gzip.compress(body, compresslevel=6)
            headers["Content-Encoding"] = "gzip"
        attempts = HTTP_RETRIES if retry else 1
        for attempt in range(1, attempts + 1):
            req = urllib.request.Request(self.base + path, data=body, method=method, headers=headers)
            try:
                with self.opener(req, timeout=120) as resp:
                    return json.loads(resp.read() or b"null")
            except urllib.error.HTTPError as exc:
                if exc.code >= 500 and attempt < attempts:
                    time.sleep(2 * attempt)
                    continue
                raise ImportError_(f"{method} {path} failed: HTTP {exc.code} {_detail(exc)}") from None
            except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
                if attempt < attempts:
                    time.sleep(2 * attempt)
                    continue
                raise ImportError_(f"{method} {path} failed: {getattr(exc, 'reason', exc)}") from None


def _detail(exc: urllib.error.HTTPError) -> str:
    """The error message only. Validation errors are reduced to field and message, so nothing sent comes back."""
    try:
        detail = json.loads(exc.read()).get("detail")
    except Exception:
        return ""
    if isinstance(detail, list):
        return "; ".join(f"{'.'.join(map(str, d.get('loc', [])))}: {d.get('msg', '')}" for d in detail[:5])
    return str(detail or "")


def check_url(url: str, allow_http: bool):
    parts = urllib.parse.urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise ImportError_(f"{url!r} is not a web address; use e.g. https://auth.example.com")
    if parts.scheme == "http" and parts.hostname not in ("localhost", "127.0.0.1", "::1") and not allow_http:
        raise ImportError_("The API key and the tokens would travel unencrypted. Use https://, or --allow-http "
                           "if you really mean it.")


# --- choosing users ---------------------------------------------------------------------------------------

PICK_HELP = """Commands:
  /TEXT     search users and characters (just / shows everyone)
  a         select every user in the current search      n   unselect them
  1 4 7-9   select or unselect users by their number in the list
  l         list selected users                          d   done, continue with the selection
  q         quit without importing"""
PAGE = 40


def pick(users: list[User], ask=input, say=print) -> list[User]:
    selected: set[int] = set()
    shown = users

    def show():
        for i, u in enumerate(shown[:PAGE], 1):
            mark = "x" if u.seat_id in selected else " "
            alts = len(u.characters) - 1
            note = "" if u.active else "  (inactive in SeAT)"
            say(f"  [{mark}] {i:>3}. {u.name}  +{alts} alt{'s' * (alts != 1)}{note}")
        if len(shown) > PAGE:
            say(f"  ... and {len(shown) - PAGE} more; narrow the search to number them, or 'a' takes all {len(shown)}")

    say(f"{len(users)} SeAT users with characters.\n{PICK_HELP}")
    while True:
        say(f"-- {len(selected)} selected, {len(shown)} in this list --")
        line = ask("> ").strip()
        if line.startswith("/"):
            text = line[1:].strip()
            shown = [u for u in users if u.matches(text)] if text else users
            show()
        elif line == "a":
            selected.update(u.seat_id for u in shown)
        elif line == "n":
            selected.difference_update(u.seat_id for u in shown)
        elif line == "l":
            for u in users:
                if u.seat_id in selected:
                    say(f"  {u.name}")
        elif line == "d":
            if selected:
                return [u for u in users if u.seat_id in selected]
            say("Nothing selected yet.")
        elif line == "q":
            raise ImportError_("Stopped; nothing was imported.")
        elif line and all(p.replace("-", "").isdigit() for p in line.split()):
            for n in _numbers(line):
                if 1 <= n <= min(len(shown), PAGE):
                    selected ^= {shown[n - 1].seat_id}
            show()
        else:
            say(PICK_HELP)


def _numbers(text: str):
    for part in text.split():
        lo, _, hi = part.partition("-")
        if lo.isdigit() and (not hi or hi.isdigit()):
            yield from range(int(lo), int(hi or lo) + 1)


def select_from_file(users: list[User], path: str) -> list[User]:
    """One SeAT user id, user name or character name per line."""
    with open(path, encoding="utf-8") as fh:
        wanted = {line.strip().lower() for line in fh if line.strip() and not line.startswith("#")}
    chosen = [u for u in users if str(u.seat_id) in wanted or u.name.lower() in wanted
              or any(c.name.lower() in wanted for c in u.characters)]
    if not chosen:
        raise ImportError_(f"No SeAT user in {path} was found.")
    return chosen


# --- the run ----------------------------------------------------------------------------------------------


def batches(items: list, size: int = BATCH):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def confirm(question: str, args, ask=input) -> bool:
    if args.yes:
        return True
    return ask(f"{question} [y/N] ").strip().lower() in ("y", "yes")


def summarise_preview(results: list[dict]) -> dict:
    counts = {"users": len(results), "new_accounts": 0, "existing_accounts": 0}
    for r in results:
        counts["new_accounts" if r["account"] is None else "existing_accounts"] += 1
        for c in r["characters"]:
            counts[c["status"]] = counts.get(c["status"], 0) + 1
            if c["missing_scopes"]:
                counts["characters_missing_scopes"] = counts.get("characters_missing_scopes", 0) + 1
    return counts


STATUS_TEXT = {
    "new": "characters new to Conduit",
    "exists": "characters already here (kept as they are)",
    "token_replaced": "characters here with a lost token (they get SeAT's)",
    "other_account": "characters on a different Conduit account (left there)",
    "owner_changed": "characters sold since (left alone)",
    "characters_missing_scopes": "characters whose token lacks scopes Conduit wants",
}


def connect(url: str, key: str, allow_http: bool = False, http=urllib.request.urlopen) -> tuple[Conduit, dict]:
    """Check the address and key, and return the API client and what Conduit says about itself."""
    check_url(url, allow_http)
    if not key.strip():
        raise ImportError_("Enter the Conduit API key.")
    conduit = Conduit(url, key.strip(), http)
    me = conduit.call("GET", "/me")
    if "import:seat" not in me.get("scopes", []):
        raise ImportError_("This API key lacks the import:seat scope.")
    if not me.get("apis", {}).get("import"):
        raise ImportError_("The SeAT import API is switched off. Turn it on under Administration -> API.")
    return conduit, conduit.call("GET", "/import/seat/info")


def client_id_problem(info: dict, seat_id: str) -> str:
    """Why imported tokens couldn't work with this Conduit, or "" when they can (as far as we know)."""
    if not info["sso_configured"]:
        return "Conduit has no EVE application set up yet, so imported tokens could not be used."
    if seat_id and seat_id != info["client_id"]:
        return (f"SeAT's EVE application ({seat_id}) is not Conduit's ({info['client_id']}). EVE only refreshes a "
                "token for the application it was issued to. Give Conduit SeAT's client id and secret, or import "
                "without tokens.")
    return ""


def preview_users(conduit: Conduit, chosen: list[User]) -> dict:
    """Counts of what importing would do. Preview never carries tokens."""
    results = []
    for batch in batches(chosen):
        results += conduit.call("POST", "/import/seat/preview", {"users": [u.payload(False) for u in batch]})["users"]
    return summarise_preview(results)


def preview_lines(counts: dict, with_tokens: bool) -> list[str]:
    lines = [f"Importing would create {counts['new_accounts']} accounts and add to {counts['existing_accounts']}:"]
    for status, text in STATUS_TEXT.items():
        if counts.get(status) and (with_tokens or status not in ("token_replaced", "characters_missing_scopes")):
            lines.append(f"  {counts[status]:>5}  {text}")
    if not with_tokens:
        lines.append("  No tokens are copied: members log in to Conduit once to bring their characters back.")
    return lines


def import_users(conduit: Conduit, chosen: list[User], with_tokens: bool, say) -> list[dict]:
    results = []
    for n, batch in enumerate(batches(chosen), 1):
        results += conduit.call("POST", "/import/seat/users",
                                {"users": [u.payload(with_tokens) for u in batch]})["users"]
        say(f"  imported {min(n * BATCH, len(chosen))}/{len(chosen)} users")
    return results


def write_report(path: str, report: dict) -> str:
    path = path or f"seat-import-report-{datetime.now():%Y%m%d-%H%M%S}.json"
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)
    return path


def run(args, ask=input, say=print, secret=getpass.getpass, http=urllib.request.urlopen, db=subprocess.run) -> int:
    with_tokens = not args.no_tokens
    check_url(args.conduit, args.allow_http)
    key = os.environ.get("CONDUIT_API_KEY") or secret("Conduit API key (scope import:seat): ")
    conduit, info = connect(args.conduit, key, args.allow_http, http)
    say(f"Conduit {info['version']}, {info['users']} users so far.")
    if (args.history or args.history_only) and not args.dump:
        raise ImportError_("Importing character data needs a full dump of SeAT's database: pass --dump FILE.")

    if args.history_only:
        ids = None
        if args.select:
            users, _ = read_dump(args.dump, False)
            ids = [c.id for u in select_from_file(users, args.select) for c in u.characters]
        for line in history_lines(upload_history(conduit, args.dump, say, ids)):
            say(line)
        say(f"Delete {args.dump} when you're done: it holds working logins for every character in it.")
        return 0

    if with_tokens:
        seat_id = args.seat_client_id or ("" if args.dump else seat_client_id(args.seat_dir))
        problem = client_id_problem(info, seat_id)
        if problem:
            raise ImportError_(problem)
        if not seat_id and (args.yes or ask(f"Does SeAT use EVE client id {info['client_id']}? "
                                            "[y/N] ").strip().lower() not in ("y", "yes")):
            raise ImportError_("Stopped. Pass --seat-client-id, or run with --no-tokens.")

    if args.dump:
        users, squads = read_dump(args.dump, with_tokens)
    else:
        password = os.environ.get("SEAT_DB_PASSWORD")
        if password is None:
            password = secret("SeAT database password (DB_PASSWORD in seat-docker's .env): ")
        users, squads = read_seat(args, password, db)
    if not args.include_inactive:
        users = [u for u in users if u.active]
    if not users:
        raise ImportError_("SeAT has no users with characters to import.")

    chosen = select_from_file(users, args.select) if args.select else pick(users, ask, say)
    say(f"\n{len(chosen)} users, {sum(len(u.characters) for u in chosen)} characters selected.")

    counts = preview_users(conduit, chosen)
    for line in preview_lines(counts, with_tokens):
        say(line)
    if args.dry_run:
        say("Dry run: nothing imported.")
        return 0
    if not confirm("Import now?", args, ask):
        raise ImportError_("Stopped; nothing was imported.")

    results = import_users(conduit, chosen, with_tokens, say)
    report = {"started": datetime.now().isoformat(timespec="seconds"), "conduit": args.conduit,
              "tokens_copied": with_tokens, "preview": counts, "users": results, "squads": [], "tokens": None}
    report["squads"] = import_squads(conduit, squads, chosen, args.include_auto_squads, say)
    if with_tokens:
        report["tokens"] = verify(conduit, chosen, results, say)

    if args.history:
        report["history"] = upload_history(conduit, args.dump, say, [c.id for u in chosen for c in u.characters])
        for line in history_lines(report["history"]):
            say(line)

    say(f"\nDone. Report (no tokens in it): {write_report(args.report, report)}")
    if args.dump:
        say(f"Delete {args.dump} when you're done: it holds working logins for every character in it.")
    return 0


def import_squads(conduit: Conduit, squads: list[Squad], chosen: list[User], include_auto: bool, say) -> list[dict]:
    mains = {u.seat_id: u.main_character_id for u in chosen}
    out = []
    for squad in squads:
        if squad.type == "auto" and not include_auto:
            out.append({"squad": squad.name, "skipped": "automatic squad (SeAT filters); set up a smart group"})
            continue
        members = [mains[u] for u in squad.members if u in mains]
        moderators = [mains[u] for u in squad.moderators if u in mains]
        if not members and not moderators:
            out.append({"squad": squad.name, "skipped": "none of its members were imported"})
            continue
        try:
            result = conduit.call("POST", "/import/seat/squads", {
                "name": squad.name, "description": squad.description, "hidden": squad.type == "hidden",
                "member_mains": members, "moderator_mains": moderators,
            })
            say(f"  squad {squad.name}: {result['added']} added, {result['leaders']} leaders")
            out.append({"squad": squad.name, **result})
        except ImportError_ as exc:  # e.g. a same-named admin or smart group here: report and carry on
            say(f"  squad {squad.name}: skipped ({exc})")
            out.append({"squad": squad.name, "skipped": str(exc)})
    return out


def verify(conduit: Conduit, chosen: list[User], results: list[dict], say) -> dict:
    """Have Conduit refresh each token it just stored, once, and wait for the outcome."""
    sent = {c.id for u in chosen for c in u.characters if c.refresh_token and not c.deleted}
    stored = [c["id"] for r in results for c in r["characters"]
              if c["status"] in ("added", "token_replaced") and c["id"] in sent]
    if not stored:
        say("No new tokens to check.")
        return {"total": 0}
    started = conduit.call("POST", "/import/seat/verify", {"character_ids": stored}, retry=False)
    say(f"Checking {started['total']} tokens with EVE...")
    waited = 0
    while True:
        time.sleep(POLL)
        waited += POLL
        state = conduit.call("GET", f"/import/seat/verify/{started['run_id']}")
        if state.get("started"):
            say(f"  {state['done']}/{state['total']} checked, {state['live']} working")
            if state["finished"]:
                break
        elif waited >= START_TIMEOUT:
            say("The check hasn't started: are Conduit's background workers running? The tokens are imported "
                "and are checked on first use anyway.")
            return {"total": started["total"], "started": False, "run_id": started["run_id"]}
    if state["dead"]:
        say(f"{len(state['dead'])} tokens were refused by EVE; those characters will be asked to log in again.")
    if state["errors"]:
        say(f"{len(state['errors'])} could not be checked (network trouble); they are checked again on first use.")
    return state


# --- character data (SeAT's history) ----------------------------------------------------------------------

#: Rows per upload piece, and the most raw JSON bytes per piece (gzipped, it's a fraction of that).
PIECE_ROWS = 5000
PIECE_BYTES = 4 * 1024 * 1024
#: Seconds between progress polls while Conduit imports.
HISTORY_POLL = 3


def _pieces(dump_path: str, tables):
    """(table, columns, rows) pieces of the dump's rows for these tables, in file order."""
    columns: dict = {}
    table, rows, size = None, [], 0
    try:
        for name, row in seat_dump.iter_rows(dump_path, tables, columns):
            if name != table or len(rows) >= PIECE_ROWS or size >= PIECE_BYTES:
                if rows:
                    yield table, cols, rows
                table, cols, rows, size = name, list(row), [], 0
            values = [row.get(c) for c in cols]
            rows.append(values)
            size += sum(len(v) if isinstance(v, str) else 8 for v in values) + 4 * len(values)
    except seat_dump.DumpError as exc:
        raise ImportError_(str(exc)) from None
    if rows:
        yield table, cols, rows


def upload_history(conduit: Conduit, dump_path: str, say, character_ids=None, sections=None) -> dict:
    """Send the character data tables of a SeAT dump to Conduit and have it import them. Returns the summary."""
    wanted = conduit.call("GET", "/import/seat/history/tables")["tables"]
    run_id = conduit.call("POST", "/import/seat/history", {})["run_id"]
    say("Sending SeAT's character data to Conduit (only the tables it needs, compressed)...")
    sent: dict[str, int] = {}
    total = 0
    try:
        for seq, (table, cols, rows) in enumerate(_pieces(dump_path, wanted)):
            conduit.call("POST", f"/import/seat/history/{run_id}/rows",
                         {"table": table, "columns": cols, "rows": rows, "seq": seq}, gzipped=True)
            sent[table] = sent.get(table, 0) + len(rows)
            total += len(rows)
            if seq % 20 == 0:
                say(f"  {total:,} rows sent ({table})")
        # Tables beyond the account ones and shared lookups: is there any character data at all?
        history_tables = set(sent) - set(DUMP_TABLES) - {"universe_names", "universe_stations", "universe_structures"}
        if "refresh_tokens" not in sent:
            raise ImportError_("The dump has no refresh_tokens rows, so it can't say which characters SeAT had.")
        if not history_tables:
            raise ImportError_("This dump has no character data in it (wallets, mail, assets and so on). Make a "
                               "full dump of SeAT's database for this step; see the README.")
        say(f"  {total:,} rows from {len(sent)} tables sent. Conduit is importing them now...")
        conduit.call("POST", f"/import/seat/history/{run_id}/start",
                     {"character_ids": list(character_ids or []), "sections": list(sections or [])}, retry=False)
    except BaseException:
        try:  # don't leave a half upload behind
            conduit.call("DELETE", f"/import/seat/history/{run_id}", retry=False)
        except ImportError_:
            pass
        raise
    last = None
    while True:
        time.sleep(HISTORY_POLL)
        state = conduit.call("GET", f"/import/seat/history/{run_id}")
        summary = state.get("summary") or {}
        line = f"  {state['status']}: {summary.get('done', 0)}/{summary.get('characters', '?')} characters"
        if line != last:
            say(line)
            last = line
        if state["status"] == "finished":
            return summary
        if state["status"] == "failed":
            raise ImportError_("Conduit stopped importing the character data: " + state.get("error", "unknown error"))


def history_lines(summary: dict) -> list[str]:
    lines = [f"Character data imported for {summary['characters']} characters."]
    if summary.get("not_here"):
        lines.append(f"  {summary['not_here']} characters in SeAT aren't in Conduit (their accounts weren't imported).")
    for key, c in sorted(summary.get("sections", {}).items()):
        lines.append(f"  {key:14} {c['imported']:>6} imported  {c['skipped']:>6} already from EVE  {c['errors']:>4} errors")
    for err in summary.get("errors", [])[:20]:
        lines.append(f"  ! {err.get('name', err['character'])}: {err['section']}: {err['error']}")
    return lines


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Import SeAT users, characters, tokens and squads into EvE Conduit.")
    p.add_argument("--conduit", required=True, help="Conduit's address, e.g. https://auth.example.com")
    p.add_argument("--dump", metavar="FILE", help="read this SeAT database dump instead of the live database")
    p.add_argument("--seat-dir", default="/opt/seat-docker", help="seat-docker folder (default %(default)s)")
    p.add_argument("--db-service", default="mariadb", help="database service in SeAT's compose file")
    p.add_argument("--db-user", default="seat")
    p.add_argument("--db-name", default="seat")
    p.add_argument("--db-command", help="command that reads SQL on stdin and prints batch output, instead of "
                                        "docker compose (e.g. 'mariadb -h db -u seat seat --batch --raw "
                                        "--skip-column-names'); the password goes in MYSQL_PWD")
    p.add_argument("--seat-client-id", help="SeAT's EVE client id, if it is not in --seat-dir/.env")
    p.add_argument("--no-tokens", action="store_true", help="copy accounts, characters and squads only")
    p.add_argument("--include-inactive", action="store_true", help="also users disabled in SeAT")
    p.add_argument("--include-auto-squads", action="store_true",
                   help="also SeAT's automatic squads, as closed groups with today's members")
    p.add_argument("--select", metavar="FILE", help="users to import, one SeAT id or name per line (no picker)")
    p.add_argument("--history", action="store_true",
                   help="after the accounts, bring over the chosen users' character data too (needs a full --dump)")
    p.add_argument("--history-only", action="store_true",
                   help="only bring over character data (everyone in Conduit, or --select's users); needs --dump")
    p.add_argument("--dry-run", action="store_true", help="show what would happen and stop")
    p.add_argument("--yes", action="store_true", help="don't ask before importing")
    p.add_argument("--report", help="where to write the report (default seat-import-report-<time>.json)")
    p.add_argument("--allow-http", action="store_true", help="allow a plain http:// address")
    return p


def main(argv=None) -> int:
    try:
        return run(parser().parse_args(argv))
    except ImportError_ as exc:
        print(f"\n{exc}", file=sys.stderr)
        return 1
    except EOFError:
        print("\nNo more input. Run it in a terminal, or use --select FILE and --yes.", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nInterrupted. Importing again later is safe: it skips what is already there.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
