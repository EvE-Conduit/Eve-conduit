"""tools/seat-import driven end to end against this API, with SeAT's database faked."""

import importlib.util
import io
import sys
import json
import urllib.error
from pathlib import Path

import pytest
from django.contrib.auth.models import Group

from conduit.accounts import tasks as account_tasks
from conduit.accounts.models import Character, Token, User

from .conftest import make_user
from .test_external import make_key, on

TOOL = Path(__file__).resolve().parents[2] / "tools" / "seat-import" / "seat_import.py"
sys.path.insert(0, str(TOOL.parent))  # the tool imports seat_dump from its own folder
spec = importlib.util.spec_from_file_location("seat_import_tool", TOOL)
tool = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = tool  # dataclasses look the module up
spec.loader.exec_module(tool)


def seat_rows(with_tokens=True):
    def row(tag, **data):
        return f"{tag}\t{json.dumps(data)}"

    def char(cid, user, name, deleted=False):
        data = {"id": cid, "user": user, "name": name, "hash": f"hash-{cid}", "scopes": '["publicData"]',
                "deleted": int(deleted)}
        if with_tokens:
            data["rt"] = f"rt-{cid}"
        return row("C", **data)

    return "\n".join([
        row("U", id=1, name="admin", main=0, active=1),  # SeAT's built-in admin: no characters
        row("U", id=2, name="Seat Pilot", main=91000001, active=1),
        row("U", id=3, name="Second Pilot", main=91000005, active=1),
        row("U", id=4, name="Gone Pilot", main=91000009, active=0),
        char(91000001, 2, "Seat Pilot"),
        char(91000002, 2, "Pilot Alt", deleted=True),  # SeAT dropped this token
        char(91000003, 2, "Taken Alt"),
        char(91000005, 3, "Second Pilot"),
        char(91000009, 4, "Gone Pilot"),
        row("S", id=1, name="Capitals", description="Cap pilots\nonly", type="hidden"),
        row("S", id=2, name="Everyone", description="", type="auto"),
        row("M", squad=1, user=2), row("M", squad=1, user=3), row("M", squad=2, user=2),
        row("O", squad=1, user=2),
    ]) + "\n"


class FakeDb:
    def __init__(self, with_tokens=True):
        self.with_tokens = with_tokens
        self.calls = []

    def __call__(self, argv, input, env, **kw):
        password, _, query = input.partition("\n")
        self.calls.append({"argv": argv, "input": query, "password": password})

        class Done:
            returncode = 0
            stdout = seat_rows(self.with_tokens)
            stderr = ""
        return Done()


def bridge(client):
    """urlopen for the tool, answered by Django's test client."""
    def opener(req, timeout=None):
        path = req.full_url.replace("http://testserver", "")
        resp = getattr(client, req.get_method().lower())(
            path, data=req.data or None, content_type="application/json",
            HTTP_AUTHORIZATION=req.get_header("Authorization"))
        if resp.status_code >= 400:
            raise urllib.error.HTTPError(req.full_url, resp.status_code, "error", {}, io.BytesIO(resp.content))
        return io.BytesIO(resp.content)
    return opener


@pytest.fixture
def key(db):
    on("import")
    return make_key(["import:seat"])[1]


@pytest.fixture
def instant_verify(monkeypatch):
    monkeypatch.setattr(tool, "POLL", 0)
    monkeypatch.setattr(account_tasks, "PARALLEL", 1)  # threads can't see the test database
    monkeypatch.setattr(account_tasks.verify_seat_tokens, "delay",
                        lambda run_id, ids: account_tasks.verify_seat_tokens(run_id, ids))
    monkeypatch.setattr("conduit.esi.tokens._token_request",
                        lambda data: {"access_token": "a", "refresh_token": "rotated", "expires_in": 1199})


def run_tool(client, key, tmp_path, *extra, db=None, answers=()):
    select = tmp_path / "select.txt"
    select.write_text("Seat Pilot\n3\nGone Pilot\n")
    report = tmp_path / "report.json"
    args = tool.parser().parse_args(["--conduit", "http://testserver", "--allow-http", "--seat-client-id",
                                     "test-client", "--select", str(select), "--report", str(report), "--yes",
                                     *extra])
    said = []
    answers = iter(answers)
    secrets = {"Conduit": key, "SeAT": "db-pass"}
    tool.run(args, ask=lambda q: next(answers), say=said.append, http=bridge(client), db=db or FakeDb(),
             secret=lambda prompt: secrets[prompt.split()[0]])
    return json.loads(report.read_text()) if report.exists() else None, report, said


@pytest.mark.django_db
def test_full_import_with_tokens(client, key, tmp_path, instant_verify):
    here = make_user(91000003, "Taken Alt")  # already signed in here with one of their alts
    db = FakeDb()
    report, path, said = run_tool(client, key, tmp_path, db=db)

    # The password went in as the first line of input, never on a command line.
    assert db.calls[0]["password"] == "db-pass" and "db-pass" not in " ".join(db.calls[0]["argv"])

    # Their SeAT characters join the account they already have; its main stays as it was.
    assert set(here.characters.values_list("pk", flat=True)) == {91000001, 91000002, 91000003}
    here.refresh_from_db()
    assert here.main_character_id == 91000003
    assert not Token.objects.filter(character_id=91000002).exists()  # SeAT had dropped it
    assert Token.objects.get(character_id=91000001).refresh_token == "rotated"  # checked, so refreshed
    assert User.objects.filter(main_character_id=91000005).exists()
    assert not Character.objects.filter(pk=91000009).exists()  # inactive in SeAT

    group = Group.objects.get(name="Capitals")
    assert group.user_set.count() == 2 and group.profile.hidden
    assert not Group.objects.filter(name="Everyone").exists()  # automatic squad
    assert report["tokens"]["live"] == 2 and report["tokens"]["finished"]
    assert "rt-" not in path.read_text()  # never any token in the report

    # Running it again changes nothing.
    again, _, _ = run_tool(client, key, tmp_path, db=FakeDb())
    assert all(c["status"] == "exists" for u in again["users"] for c in u["characters"])
    assert again["tokens"] == {"total": 0}


@pytest.mark.django_db
def test_no_tokens_copies_accounts_only(client, key, tmp_path):
    db = FakeDb(with_tokens=False)
    report, _, _ = run_tool(client, key, tmp_path, "--no-tokens", db=db)
    assert "t.refresh_token" not in db.calls[0]["input"]
    assert Character.objects.filter(pk__in=[91000001, 91000005]).count() == 2
    assert not Token.objects.exists()
    assert report["tokens"] is None and report["tokens_copied"] is False


@pytest.mark.django_db
def test_dry_run_changes_nothing(client, key, tmp_path):
    report, _, said = run_tool(client, key, tmp_path, "--dry-run")
    assert report is None and not Character.objects.exists()
    assert any("would create 2 accounts" in s for s in said)


@pytest.mark.django_db
def test_refuses_a_different_eve_application(client, key, tmp_path):
    with pytest.raises(tool.ImportError_, match="not Conduit's"):
        run_tool(client, key, tmp_path, "--seat-client-id", "other-app")
    assert not Character.objects.exists()


@pytest.mark.django_db
def test_needs_the_api_switched_on(client, tmp_path):
    _, secret = make_key(["import:seat"])
    with pytest.raises(tool.ImportError_, match="switched off"):
        run_tool(client, secret, tmp_path)


def test_refuses_plain_http_elsewhere():
    with pytest.raises(tool.ImportError_):
        tool.check_url("http://auth.example.com", allow_http=False)
    tool.check_url("http://localhost:8000", allow_http=False)


def test_picker_search_select_all_and_toggle():
    users, _ = tool.parse_seat(seat_rows())
    answers = iter(["/pilot", "a", "2", "l", "d"])
    said = []
    chosen = tool.pick(users, ask=lambda q: next(answers), say=said.append)
    # "/pilot" finds three users, "a" takes all, "2" unselects the second in the list.
    assert [u.name for u in chosen] == ["Gone Pilot", "Second Pilot"]


def test_parse_seat_puts_the_main_first_and_skips_empty_users():
    users, squads = tool.parse_seat(seat_rows())
    assert [u.name for u in users] == ["Gone Pilot", "Seat Pilot", "Second Pilot"]
    pilot = users[1]
    assert [c.id for c in pilot.characters] == [91000001, 91000002, 91000003]
    assert pilot.characters[1].deleted and pilot.payload(True)["characters"][1]["refresh_token"] == ""
    assert pilot.payload(False)["characters"][0]["refresh_token"] == ""
    assert squads[0].name == "Capitals" and squads[0].description == "Cap pilots\nonly"


@pytest.mark.django_db
def test_token_check_gives_up_when_no_worker_picks_it_up(client, key, tmp_path, monkeypatch):
    monkeypatch.setattr(tool, "POLL", 0)
    monkeypatch.setattr(tool, "START_TIMEOUT", 0)
    monkeypatch.setattr(account_tasks.verify_seat_tokens, "delay", lambda run_id, ids: None)  # nobody runs it
    report, _, said = run_tool(client, key, tmp_path)
    assert report["tokens"]["started"] is False
    assert Token.objects.filter(character_id=91000001).exists()


# --- reading a dump ---------------------------------------------------------------

DUMP = r"""-- MariaDB dump 10.19  Distrib 10.11.19-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: seat
/*!40101 SET NAMES utf8mb4 */;
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `admin` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `last_login_source` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `main_character_id` bigint(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=489 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin',1,1,NULL,NULL,NULL,0,'2024-01-01 00:00:00',NULL),(2,'O\'Neil, \"Ace\"',1,0,'2026-10-01 10:00:00','eveonline','abc',91000001,NULL,NULL),(3,'Second Pilot',0,0,NULL,NULL,NULL,91000005,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
CREATE TABLE `refresh_tokens` (
  `character_id` bigint(20) NOT NULL,
  `version` smallint(5) unsigned NOT NULL DEFAULT 2,
  `user_id` int(11) NOT NULL,
  `scopes_profile` int(10) unsigned NOT NULL DEFAULT 0,
  `refresh_token` mediumtext NOT NULL,
  `scopes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`scopes`)),
  `expires_on` datetime NOT NULL,
  `token` text NOT NULL,
  `character_owner_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`character_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `refresh_tokens` VALUES (91000001,2,2,0,'rt-91000001','[\"publicData\",\"esi-skills.read_skills.v1\"]','2026-10-09 10:00:00','eyJhbGciOi.x.y','hash-1',NULL,NULL,NULL),(91000002,2,2,0,'rt-91000002','[]','2026-10-09 10:00:00','','hash-2',NULL,NULL,'2026-05-01 00:00:00'),(91000005,2,3,0,'rt-91000005','[]','2026-10-09 10:00:00','','hash-5',NULL,NULL,NULL);
CREATE TABLE `character_infos` (
  `character_id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `birthday` varchar(255) NOT NULL,
  `security_status` double(8,2) DEFAULT NULL,
  PRIMARY KEY (`character_id`)
) ENGINE=InnoDB;
INSERT INTO `character_infos` VALUES (91000001,'O\'Neil','<font size=\"12\">Hi,\r\nthere\\ (tab\there); ok</font>','2010-01-01',-1.5),(91000002,'Ünïcode Alt','','2011-01-01',5.00);
CREATE TABLE `squads` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `logo` mediumtext DEFAULT NULL,
  `type` enum('manual','auto','hidden') NOT NULL DEFAULT 'auto',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
INSERT INTO `squads` VALUES (1,'Capitals','Cap (pilots), only;\nreally','data:image/png;base64,AAA=','hidden'),(2,'Everyone','','','auto');
CREATE TABLE `squad_member` (
  `squad_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`squad_id`,`user_id`)
) ENGINE=InnoDB;
INSERT INTO `squad_member` VALUES (1,2),(1,3),(2,2);
CREATE TABLE `squad_moderator` (
  `squad_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`squad_id`,`user_id`)
) ENGINE=InnoDB;
INSERT INTO `squad_moderator` VALUES (1,2);
CREATE TABLE `corporation_wallet_journals` (
  `id` bigint(20) NOT NULL
) ENGINE=InnoDB;
INSERT INTO `corporation_wallet_journals` VALUES (this is not parsed at all;
"""


def test_reads_a_mariadb_dump(tmp_path):
    path = tmp_path / "seat.sql"
    path.write_text(DUMP.replace("\n", "\r\n"), encoding="utf-8")  # as copied to Windows
    users, squads = tool.read_dump(str(path), with_tokens=True)
    assert [u.name for u in users] == ['O\'Neil, "Ace"', "Second Pilot"]
    ace = users[0]
    assert ace.active and not users[1].active
    assert [(c.id, c.name, c.deleted) for c in ace.characters] == [
        (91000001, "O'Neil", False), (91000002, "Ünïcode Alt", True)]
    assert ace.characters[0].scopes == ["publicData", "esi-skills.read_skills.v1"]
    assert ace.characters[0].refresh_token == "rt-91000001" and ace.characters[0].owner_hash == "hash-1"
    assert users[1].characters[0].name == "Character 91000005"  # no character_infos row
    assert squads[0].name == "Capitals" and squads[0].description == "Cap (pilots), only;\nreally"
    assert squads[0].members == [2, 3] and squads[0].moderators == [2]

    without, _ = tool.read_dump(str(path), with_tokens=False)
    assert all(not c.refresh_token for u in without for c in u.characters)


def test_complete_insert_dumps_name_their_columns(tmp_path):
    path = tmp_path / "seat.sql"
    path.write_text(DUMP.replace(
        "INSERT INTO `squad_member` VALUES (1,2),(1,3),(2,2);",
        "INSERT INTO `squad_member` (`user_id`, `squad_id`) VALUES (2,1),(3,1),(2,2);"))
    _, squads = tool.read_dump(str(path), with_tokens=False)
    assert squads[0].members == [2, 3]


def test_a_dump_without_seat_tables_is_refused(tmp_path):
    path = tmp_path / "other.sql"
    path.write_text("CREATE TABLE `x` (\n  `id` int\n);\n")
    with pytest.raises(tool.ImportError_, match="SeAT's database"):
        tool.read_dump(str(path), with_tokens=True)


@pytest.mark.django_db
def test_imports_from_a_dump(client, key, tmp_path, instant_verify):
    dump = tmp_path / "seat.sql"
    dump.write_text(DUMP, encoding="utf-8")
    select = tmp_path / "select.txt"
    select.write_text("2\n")
    args = tool.parser().parse_args(["--conduit", "http://testserver", "--allow-http", "--dump", str(dump),
                                     "--seat-client-id", "test-client", "--select", str(select),
                                     "--report", str(tmp_path / "r.json"), "--yes"])
    said = []
    tool.run(args, ask=lambda q: "", say=said.append, http=bridge(client), secret=lambda p: key,
             db=lambda *a, **k: pytest.fail("the dump needs no database"))
    user = User.objects.get(main_character_id=91000001)
    assert user.characters.count() == 2
    assert Token.objects.get(character_id=91000001).refresh_token == "rotated"
    assert not Token.objects.filter(character_id=91000002).exists()  # deleted in SeAT
    assert Group.objects.get(name="Capitals").user_set.count() == 1
    assert any("Delete" in s and "seat.sql" in s for s in said)


# --- the window ---------------------------------------------------------------------


@pytest.fixture
def gui(monkeypatch):
    tk = pytest.importorskip("tkinter")
    import os

    if not os.environ.get("DISPLAY") and os.name != "nt":
        pytest.skip("no display")
    sys.path.insert(0, str(TOOL.parent))
    sys.modules["seat_import"] = tool  # the window imports the tool under its own name
    gui_spec = importlib.util.spec_from_file_location("seat_import_gui", TOOL.parent / "seat_import_gui.py")
    module = importlib.util.module_from_spec(gui_spec)
    gui_spec.loader.exec_module(module)
    sys.path.remove(str(TOOL.parent))

    class Inline:  # jobs run straight away: the test database belongs to this thread
        def __init__(self, target, daemon=None):
            self.target = target

        def start(self):
            self.target()
    monkeypatch.setattr(module.threading, "Thread", Inline)
    answers = []
    monkeypatch.setattr(module.messagebox, "askyesno", lambda *a, **k: answers.pop(0))
    monkeypatch.setattr(module.messagebox, "showerror", lambda *a, **k: pytest.fail(f"error shown: {a}"))
    root = tk.Tk()
    app = module.App(root)
    yield module, app, answers
    root.destroy()


def drain(app):
    app.pump()
    return app.log.get("1.0", "end")


@pytest.mark.django_db
def test_window_loads_selects_previews_and_imports(client, key, tmp_path, instant_verify, gui, monkeypatch):
    module, app, answers = gui
    app.http = bridge(client)
    dump = tmp_path / "seat.sql"
    dump.write_text(DUMP, encoding="utf-8")
    app.dump.set(str(dump))
    app.url.set("http://testserver")
    app.key.set(key)
    answers.append(True)  # "plain http, continue?"
    app.load()
    log = drain(app)
    assert "2 users with characters" in log and "client id test-client" in log
    assert len(app.tree.get_children()) == 1  # Second Pilot is disabled in SeAT
    assert str(app.import_button["state"]) == "disabled"

    app.inactive.set(True)
    app.refilter()
    app.search.set("neil")
    assert app.tree.get_children() == ("2",)
    app.mark(True)
    app.search.set("")
    assert app.selected == {2} and str(app.import_button["state"]) == "disabled"  # same EVE app not confirmed
    app.same_app.set(True)
    app.refresh()
    assert str(app.import_button["state"]) == "normal"

    app.preview()
    assert "Importing would create 1 accounts" in drain(app)
    answers += [True, False]  # import? yes; delete the dump? no
    app.do_import()
    log = drain(app)
    assert "Done. Report" in log and "Remember to delete" in log
    assert User.objects.get(main_character_id=91000001).characters.count() == 2
    assert Token.objects.get(character_id=91000001).refresh_token == "rotated"
    assert dump.exists()


def export_style(dump: str, heidi: bool) -> str:
    """DUMP as phpMyAdmin (or HeidiSQL) exports it: column names in each insert, one row per line after VALUES."""
    import re

    columns, current, out = {}, None, []
    for line in dump.split("\n"):
        m = re.match(r"CREATE TABLE `([^`]+)`", line)
        if m:
            current = m.group(1)
            columns[current] = []
            line = line.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS") if heidi else line
        elif current and line.startswith("  `"):
            columns[current].append(line.split("`")[1])
            line = "\t" + line.lstrip() if heidi else line
        elif line.startswith(")"):
            current = None
        m = re.match(r"INSERT INTO `([^`]+)` VALUES \((.*)\);$", line)
        if m and m.group(1) in columns:
            names = ", ".join(f"`{c}`" for c in columns[m.group(1)])
            rows = m.group(2).split("),(")
            indent = "\t" if heidi else ""
            line = (f"INSERT INTO `{m.group(1)}` ({names}) VALUES\n"
                    + ",\n".join(f"{indent}({r})" for r in rows) + ";")
        out.append(line)
    return "\n".join(out)


@pytest.mark.parametrize("heidi", [False, True], ids=["phpmyadmin", "heidisql"])
def test_reads_exports_with_statements_over_several_lines(tmp_path, heidi):
    path = tmp_path / "seat.sql"
    text = export_style(DUMP, heidi)
    assert "VALUES\n" in text
    path.write_text(text.replace("\n", "\r\n"), encoding="utf-8")
    users, squads = tool.read_dump(str(path), with_tokens=True)
    assert [u.name for u in users] == ['O\'Neil, "Ace"', "Second Pilot"]
    assert users[0].characters[0].refresh_token == "rt-91000001"
    assert squads[0].members == [2, 3] and squads[0].moderators == [2]


def test_reads_a_utf16_dump_with_spaces_between_values(tmp_path):
    # What PowerShell's "mariadb-dump ... > seat.sql" writes, with a hand-written insert's spacing.
    text = DUMP.replace("INSERT INTO `squad_member` VALUES (1,2),(1,3),(2,2);",
                        "INSERT INTO `squad_member` VALUES ( 1 , 2 ) , (1, 3),\n  (2,2) ;")
    path = tmp_path / "seat.sql"
    path.write_text(text.replace("\n", "\r\n"), encoding="utf-16")
    users, squads = tool.read_dump(str(path), with_tokens=True)
    assert len(users) == 2 and squads[0].members == [2, 3]


def test_a_broken_dump_says_where(tmp_path):
    path = tmp_path / "seat.sql"
    path.write_text(DUMP.replace("(2,'O\\'Neil", "(2,'O\\'Neil'oops"))
    with pytest.raises(tool.ImportError_, match=r"Line \d+: could not read the users rows"):
        tool.read_dump(str(path), with_tokens=True)


def test_tool_version_matches_conduit():
    from conduit import __version__

    assert tool.VERSION == __version__, "bump VERSION in tools/seat-import/seat_import.py with each release"


def test_both_copies_of_the_dump_reader_are_identical():
    backend = Path(__file__).resolve().parents[1] / "conduit" / "sheet" / "seat" / "dump.py"
    assert (TOOL.parent / "seat_dump.py").read_text() == backend.read_text(), \
        "tools/seat-import/seat_dump.py and conduit/sheet/seat/dump.py must stay identical"
