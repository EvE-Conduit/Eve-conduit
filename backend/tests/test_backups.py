"""Administration → Backups: the list the updater keeps, backup and restore requests, and restoring itself."""

import io
import json
import os
import stat
import sys
import tarfile
import zipfile
from datetime import timedelta
from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from django.core.management import call_command
from django.utils import timezone

from conduit import __version__
from conduit.audit.models import AuditEvent
from conduit.plugins.models import PluginInstaller
from conduit.updates import restore, services
from conduit.updates.models import UpdateState

OLD = "0.5.1"


def make_backup(folder: Path, name: str, version: str = OLD, files: dict | None = None) -> Path:
    """A backup like `conduit backup` writes: a zip on Windows, a tar.gz with ./ names on Linux."""
    files = files if files is not None else {
        "database.dump": b"PGDMP pretend",
        "conduit.env": b"CONDUIT_SECRET_KEY=old-secret\n",
        "plugins.txt": b"",
        "release.txt": f"/opt/conduit/releases/{version}\n".encode(),
    }
    path = folder / name
    if name.endswith(".zip"):
        with zipfile.ZipFile(path, "w") as zf:
            for member, data in files.items():
                zf.writestr(member, data)
    else:
        with tarfile.open(path, "w:gz") as tf:
            for member, data in files.items():
                info = tarfile.TarInfo(member if member.startswith(("/", "..")) else f"./{member}")
                info.size = len(data)
                tf.addfile(info, io.BytesIO(data))
    return path


@pytest.fixture
def dirs(tmp_path, settings):
    settings.CONDUIT_INSTALL_KIND = "baremetal"
    settings.CONDUIT_UPDATES_DIR = str(tmp_path / "updates")
    (tmp_path / "updates").mkdir()
    (tmp_path / "backups").mkdir()
    return tmp_path / "updates", tmp_path / "backups"


# --- the list ---------------------------------------------------------------------------------------------------


def test_index_lists_backups_newest_first_with_their_version(dirs):
    updates, backups = dirs
    old = make_backup(backups, "conduit-20261001-031500.tar.gz", "0.5.1")
    os.utime(old, (1_700_000_000, 1_700_000_000))
    make_backup(backups, "conduit-20261029-031500-before-restore.zip", "0.5.55")
    (backups / "notes.txt").write_text("not a backup")
    (backups / "restore-abc").mkdir()  # a restore's work folder
    (backups / "conduit-20261002-000000.zip").symlink_to(old)

    listed = restore.write_index(backups, updates)
    assert [b["name"] for b in listed] == ["conduit-20261029-031500-before-restore.zip", "conduit-20261001-031500.tar.gz"]
    assert [b["version"] for b in listed] == ["0.5.55", "0.5.1"]
    assert listed[0]["before_restore"] and not listed[1]["before_restore"]
    assert json.loads((updates / "backups.json").read_text())["backups"] == listed


def test_index_reuses_what_it_knows_about_unchanged_files(dirs, monkeypatch):
    updates, backups = dirs
    make_backup(backups, "conduit-20261001-031500.tar.gz")
    restore.write_index(backups, updates)
    opened = []
    monkeypatch.setattr(restore, "archive_version", lambda path: opened.append(path) or "9.9.9")
    assert restore.write_index(backups, updates)[0]["version"] == OLD and not opened


# --- requests ---------------------------------------------------------------------------------------------------


def write_request(updates: Path, **fields):
    data = {"id": "a" * 32, "action": "restore", "name": "conduit-20261001-031500.tar.gz", "requested_by": "Admin\tPilot\n"}
    data.update(fields)
    (updates / restore.REQUEST_FILE).write_text(json.dumps(data))


def test_request_is_read_once_and_checked_against_the_backups_folder(dirs):
    updates, backups = dirs
    make_backup(backups, "conduit-20261001-031500.tar.gz")
    write_request(updates)
    req = restore.take_request(updates, backups)
    assert req == {"action": "restore", "id": "a" * 32, "name": "conduit-20261001-031500.tar.gz", "requested_by": "Admin Pilot"}
    assert not (updates / restore.REQUEST_FILE).exists()
    assert restore.take_request(updates, backups) is None


@pytest.mark.parametrize("fields", [
    {"name": "../../etc/shadow"},
    {"name": "conduit-20261001-031500.tar.gz/../x"},
    {"name": "conduit-20261005-000000.zip"},  # well formed, but not there
    {"action": "drop-database"},
    {"id": "../x"},
])
def test_bad_requests_are_refused_and_removed(dirs, fields):
    updates, backups = dirs
    make_backup(backups, "conduit-20261001-031500.tar.gz")
    write_request(updates, **fields)
    with pytest.raises(restore.RestoreError):
        restore.take_request(updates, backups)
    assert not (updates / restore.REQUEST_FILE).exists()


def test_who_asked_is_reduced_to_plain_characters(dirs):
    updates, backups = dirs
    write_request(updates, action="backup", requested_by='Bad" --pythonpath C:\\evil')
    assert restore.take_request(updates, backups)["requested_by"] == "Bad --pythonpath Cevil"


def test_a_symlinked_backup_is_refused(dirs, tmp_path):
    updates, backups = dirs
    target = make_backup(tmp_path, "conduit-20261001-031500.tar.gz")
    (backups / "conduit-20261001-031500.tar.gz").symlink_to(target)
    write_request(updates)
    with pytest.raises(restore.RestoreError, match="plain file"):
        restore.take_request(updates, backups)


def test_command_line_request_and_result(dirs, capsys):
    updates, backups = dirs
    assert restore.main(["request", str(updates), str(backups)]) == 3
    write_request(updates, action="backup", name="ignored", requested_by="")
    assert restore.main(["request", str(updates), str(backups)]) == 0
    assert capsys.readouterr().out == f"backup\t{'a' * 32}\t-\t-\n"
    assert restore.main(["result", str(updates), "a" * 32, "restore", "failed", "it broke",
                         "--name", "conduit-20261001-031500.tar.gz"]) == 0
    result = json.loads((updates / restore.RESULT_FILE).read_text())
    assert (result["status"], result["name"], result["message"]) == ("failed", "conduit-20261001-031500.tar.gz", "it broke")


# --- unpacking ----------------------------------------------------------------------------------------------------


@pytest.mark.parametrize("name", ["conduit-20261001-031500.zip", "conduit-20261001-031500.tar.gz"])
def test_unpack_takes_only_the_files_a_backup_holds(tmp_path, name):
    files = {"database.dump": b"PGDMP", "release.txt": f"C:\\EvE-Conduit\\releases\\{OLD}".encode(),
             "conduit.env": b"X=1", "../evil.txt": b"no", "sub/database.sql": b"no", "other.bin": b"no"}
    archive = make_backup(tmp_path, name, files=files)
    out = tmp_path / "out"
    assert restore.unpack(archive, out) == OLD
    assert sorted(p.name for p in out.iterdir()) == ["conduit.env", "database.dump", "release.txt"]
    assert not (tmp_path / "evil.txt").exists()
    assert stat.S_IMODE(out.stat().st_mode) == 0o700


def test_unpack_refuses_a_backup_from_a_newer_version_or_without_a_database(tmp_path):
    with pytest.raises(restore.RestoreError, match="newer than the running"):
        restore.unpack(make_backup(tmp_path, "conduit-20261001-031500.zip", "99.0.0"), tmp_path / "a")
    with pytest.raises(restore.RestoreError, match="no database"):
        restore.unpack(make_backup(tmp_path, "conduit-20261002-031500.zip", files={"release.txt": b"0.5.1"}), tmp_path / "b")
    assert restore.unpack(make_backup(tmp_path, "conduit-20261003-031500.zip", __version__), tmp_path / "c") == __version__


# --- loading the database -----------------------------------------------------------------------------------------


def fake_tools(folder: Path, names: list[str], log: Path, stdout: str = "") -> str:
    """Stand-ins for pg_restore/psql/mariadb that write down how they were called."""
    folder.mkdir()
    for name in names:
        script = folder / name
        script.write_text(f"""#!{sys.executable}
import json, os, sys
stdin = "" if sys.stdin.isatty() else sys.stdin.read()
with open({str(log)!r}, "a") as f:
    f.write(json.dumps({{"tool": {name!r}, "args": sys.argv[1:], "PGPASSWORD": os.environ.get("PGPASSWORD"),
                        "MYSQL_PWD": os.environ.get("MYSQL_PWD"), "DATABASE_URL": os.environ.get("DATABASE_URL"),
                        "stdin": stdin[:50]}}) + "\\n")
if {name!r} == "pg_restore":
    open(sys.argv[sys.argv.index("-f") + 1], "w").write("-- restored")
if "-N" in sys.argv:
    print({stdout!r})
""")
        script.chmod(0o755)
    return str(folder)


def calls(log: Path) -> list[dict]:
    return [json.loads(line) for line in log.read_text().splitlines()]


def test_postgres_restore_runs_in_one_transaction(tmp_path, monkeypatch):
    log = tmp_path / "log"
    tools = fake_tools(tmp_path / "bin", ["pg_restore", "psql"], log)
    backup = tmp_path / "backup"
    backup.mkdir()
    (backup / "database.dump").write_bytes(b"PGDMP")
    monkeypatch.setenv("DATABASE_URL", "postgres://conduit:p%40ss@db:5433/conduit")
    restore.load_db(backup, os.environ["DATABASE_URL"], tools)
    reading, loading = calls(log)
    assert reading["tool"] == "pg_restore" and "--no-owner" in reading["args"]
    args = loading["args"]
    assert loading["tool"] == "psql" and "--single-transaction" in args and "ON_ERROR_STOP=1" in args
    assert args[args.index("-h") + 1] == "db" and args[args.index("-p") + 1] == "5433" and args[args.index("-d") + 1] == "conduit"
    # Clear first, then the backup; the password only in the environment.
    files = [args[i + 1] for i, a in enumerate(args) if a == "-f"]
    assert [Path(f).name for f in files] == ["database.clear.sql", "database.restore.sql"]
    assert loading["PGPASSWORD"] == "p@ss" and loading["DATABASE_URL"] is None
    assert all("p@ss" not in a and "p%40ss" not in a for a in args)


def test_mariadb_restore_clears_the_tables_then_loads_the_dump(tmp_path):
    log = tmp_path / "log"
    tools = fake_tools(tmp_path / "bin", ["mariadb"], log, stdout="auth_user\nsheet_skill")
    backup = tmp_path / "backup"
    backup.mkdir()
    (backup / "database.sql").write_text("CREATE TABLE x (id int);")
    restore.load_db(backup, "mysql://conduit:secret@127.0.0.1/conduit", tools)
    listing, clearing, loading = calls(log)
    assert "-N" in listing["args"]
    assert "DROP TABLE IF EXISTS `auth_user`, `sheet_skill`" in clearing["args"][clearing["args"].index("-e") + 1]
    assert loading["stdin"].startswith("CREATE TABLE x") and loading["MYSQL_PWD"] == "secret"


def test_the_backup_must_match_the_database_kind(tmp_path):
    backup = tmp_path / "backup"
    backup.mkdir()
    (backup / "database.sql").write_text("")
    with pytest.raises(restore.RestoreError, match="MariaDB database"):
        restore.load_db(backup, "postgres://c:p@localhost/conduit", str(tmp_path))


# --- EVE login keys -----------------------------------------------------------------------------------------------


def test_derived_key_matches_the_one_the_site_uses(settings):
    from conduit.accounts import crypto

    assert restore.derived_token_key(settings.SECRET_KEY) == crypto._derived_key().decode()


def test_carry_keys_lets_this_install_decrypt_the_backups_logins(tmp_path, settings):
    from conduit.accounts import crypto

    backup_key = Fernet.generate_key().decode()
    old_secret = "old-secret-key"
    current = tmp_path / "conduit.env"
    current.write_text("# config\r\nCONDUIT_SECRET_KEY=new-secret\r\nCONDUIT_TOKEN_KEY_PREVIOUS=\r\n")
    current.chmod(0o640)
    backup_env = tmp_path / "backup.env"
    backup_env.write_text(f"CONDUIT_SECRET_KEY={old_secret}\nCONDUIT_TOKEN_KEY=\"{backup_key}\"\n")

    assert restore.carry_keys(current, backup_env) == 2
    assert restore.carry_keys(current, backup_env) == 0  # nothing left to add
    text = current.read_bytes().decode()
    assert text.startswith("# config\r\n") and text.count("CONDUIT_TOKEN_KEY_PREVIOUS=") == 1
    assert stat.S_IMODE(current.stat().st_mode) == 0o640

    previous = restore.read_env(current)["CONDUIT_TOKEN_KEY_PREVIOUS"].split(",")
    settings.SECRET_KEY = "new-secret"
    settings.CONDUIT_TOKEN_KEY = ""
    settings.CONDUIT_TOKEN_KEY_PREVIOUS = previous
    crypto._fernet.cache_clear()
    try:
        assert crypto.decrypt(Fernet(backup_key.encode()).encrypt(b"refresh").decode()) == "refresh"
        derived = restore.derived_token_key(old_secret).encode()
        assert crypto.decrypt(Fernet(derived).encrypt(b"older").decode()) == "older"
    finally:
        crypto._fernet.cache_clear()


# --- the website --------------------------------------------------------------------------------------------------


def index(updates: Path, *names: str):
    (updates / restore.INDEX_FILE).write_text(json.dumps({
        "backups": [{"name": n, "size": 10, "created_at": "2026-10-01T03:15:00+00:00", "version": OLD} for n in names],
        "at": timezone.now().isoformat(),
    }))


def test_backup_and_restore_requests(dirs, admin_user, user, api_client):
    updates, _ = dirs
    index(updates, "conduit-20261001-031500.tar.gz", "../../etc/passwd")
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/backups").status_code == 403
    api_client.force_login(admin_user)
    out = api_client.call("get", "/api/admin/backups").json()
    assert out["can_manage"] and [b["name"] for b in out["backups"]] == ["conduit-20261001-031500.tar.gz"]

    out = api_client.call("post", "/api/admin/backups/backup").json()
    assert out["job"]["action"] == "backup" and out["job"]["status"] == "requested"
    request = json.loads((updates / restore.REQUEST_FILE).read_text())
    assert request["requested_by"] == admin_user.display_name and restore.ID_RE.match(request["id"])
    assert api_client.call("post", "/api/admin/backups/backup").status_code == 400  # one at a time
    assert api_client.call("post", "/api/admin/backups/cancel").json()["job"] is None

    name = "conduit-20261001-031500.tar.gz"
    assert api_client.call("post", "/api/admin/backups/restore", {"name": name, "confirm": "yes"}).status_code == 400
    assert api_client.call("post", "/api/admin/backups/restore", {"name": "conduit-20261009-000000.zip", "confirm": "restore"}).status_code == 400
    out = api_client.call("post", "/api/admin/backups/restore", {"name": name, "confirm": " Restore "}).json()
    assert out["job"]["action"] == "restore" and out["job"]["name"] == name
    assert AuditEvent.objects.filter(action="backup.restore_requested", details__backup=name).exists()
    assert AuditEvent.objects.filter(action="backup.requested").exists()


def test_job_follows_the_updaters_result(dirs, admin_user, api_client):
    updates, _ = dirs
    api_client.force_login(admin_user)
    restore.write_result(updates, "b" * 32, "restore", "running", "Restoring", "conduit-20261001-031500.tar.gz")
    assert api_client.call("get", "/api/admin/backups").json()["job"]["status"] == "running"
    assert api_client.call("post", "/api/admin/backups/backup").status_code == 400
    old = (timezone.now() - timedelta(hours=7)).isoformat()
    data = json.loads((updates / restore.RESULT_FILE).read_text()) | {"at": old}
    (updates / restore.RESULT_FILE).write_text(json.dumps(data))
    job = api_client.call("get", "/api/admin/backups").json()["job"]
    assert job["status"] == "failed" and "stopped" in job["message"]
    assert api_client.call("post", "/api/admin/backups/backup").status_code == 200


def test_not_while_an_update_or_plugin_install_waits(dirs, admin_user, api_client):
    api_client.force_login(admin_user)
    UpdateState.objects.create(pk=1, install_state=UpdateState.Install.REQUESTED)
    assert "update" in api_client.call("post", "/api/admin/backups/backup").json()["detail"]
    UpdateState.objects.filter(pk=1).update(install_state=UpdateState.Install.NONE)
    PluginInstaller.objects.update_or_create(pk=1, defaults={"job_state": PluginInstaller.Job.RUNNING})
    assert "plugin" in api_client.call("post", "/api/admin/backups/backup").json()["detail"]


def test_docker_installs_get_instructions(dirs, admin_user, api_client, settings):
    settings.CONDUIT_INSTALL_KIND = "docker"
    api_client.force_login(admin_user)
    out = api_client.call("get", "/api/admin/backups").json()
    assert not out["can_manage"] and "pg_dump" in out["instructions"]
    assert api_client.call("post", "/api/admin/backups/backup").status_code == 400


def test_restore_progress_has_its_own_steps(dirs):
    updates, _ = dirs
    now = timezone.now().isoformat()
    (updates / "progress.json").write_text(json.dumps({"kind": "restore", "target": "", "step": "restore", "at": now, "started_at": now}))
    assert services.progress()["steps"] == ["backup", "restore", "migrate", "restart"]
    (updates / "progress.json").write_text(json.dumps({"kind": "release", "target": "", "step": "restore", "at": now}))
    assert services.progress() is None


def test_after_restore_notes_it_in_the_restored_audit_log(db):
    from django.core.cache import cache

    cache.set("stale", 1)
    call_command("after_restore", "conduit-20261001-031500.tar.gz", "--requested-by", "Admin Pilot")
    event = AuditEvent.objects.get(action="backup.restored")
    assert "conduit-20261001-031500.tar.gz" in event.summary and "Admin Pilot" in event.summary
    assert cache.get("stale") is None
