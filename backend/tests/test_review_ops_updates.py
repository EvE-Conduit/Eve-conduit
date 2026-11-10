"""Updates: what the site concludes from the updater's result, and the Windows side of safeio."""

import json

import pytest

from conduit import __version__
from conduit.updates import safeio, services
from conduit.updates.models import UpdateState


@pytest.fixture
def waiting(db, tmp_path, settings):
    """An install of the version that is running now, as the site sees it after the updater restarted it."""
    settings.CONDUIT_UPDATES_DIR = str(tmp_path)
    settings.CONDUIT_INSTALL_KIND = "baremetal"
    state = UpdateState.load()
    state.install_state = UpdateState.Install.REQUESTED
    state.install_version = __version__
    state.save()
    return tmp_path


def test_a_failed_result_is_a_failure_even_when_the_new_version_runs(waiting):
    """An upgrade that broke after the switch (a migration) and couldn't be undone leaves the new code running.
    The updater said it failed, so the site must not report it as installed."""
    (waiting / "install-result.json").write_text(
        json.dumps({"version": __version__, "status": "failed", "message": "migrate broke"}))
    out = services.state_out(UpdateState.load())
    assert out["install"]["state"] == "failed"
    assert out["install"]["message"] == "migrate broke"


def test_a_lost_result_with_the_new_version_running_still_counts_as_installed(waiting):
    assert services.state_out(UpdateState.load())["install"]["state"] == "succeeded"


def test_a_succeeded_result_is_a_success(waiting):
    (waiting / "install-result.json").write_text(
        json.dumps({"version": __version__, "status": "succeeded", "message": "done"}))
    assert services.state_out(UpdateState.load())["install"]["state"] == "succeeded"


def test_without_posix_flags_safeio_refuses_links(tmp_path, monkeypatch):
    """Windows has no O_NOFOLLOW: there safeio checks for links (junctions, symlinks) itself before it opens."""
    monkeypatch.setattr(safeio, "POSIX", False)
    real = tmp_path / "real"
    real.mkdir()
    secret = tmp_path / "secret.txt"
    secret.write_text("keep")

    # A plain folder and file still work.
    safeio.write_json(real / "result.json", {"ok": True})
    assert safeio.read_json(real / "result.json") == {"ok": True}
    safeio.append(real / "updater.log", b"line\n")
    assert (real / "updater.log").read_bytes() == b"line\n"

    # The folder swapped for a link: nothing is read or written through it.
    link_dir = tmp_path / "updates"
    link_dir.symlink_to(real, target_is_directory=True)
    with pytest.raises(safeio.UnsafePath):
        safeio.write_json(link_dir / "result.json", {"ok": False})
    with pytest.raises(safeio.UnsafePath):
        safeio.read_json(link_dir / "result.json")
    with pytest.raises(safeio.UnsafePath):
        safeio.append(link_dir / "updater.log", b"x\n")
    assert safeio.read_json(real / "result.json") == {"ok": True}

    # A file that is a link: not read, not appended to.
    (real / "request.json").symlink_to(secret)
    (real / "other.log").symlink_to(secret)
    with pytest.raises(safeio.UnsafePath):
        safeio.read_bytes(real / "request.json")
    with pytest.raises(safeio.UnsafePath):
        safeio.append(real / "other.log", b"x\n")
    with pytest.raises(safeio.UnsafePath):
        safeio.copy_regular(real / "request.json", real / "copy.json")
    assert secret.read_text() == "keep"


def test_is_link_knows_windows_reparse_points(tmp_path, monkeypatch):
    """A junction is no symlink to Python; its file attributes say it is a reparse point."""
    plain = tmp_path / "plain"
    plain.mkdir()
    assert not safeio._is_link(plain)
    assert not safeio._is_link(tmp_path / "missing")

    class Junction:
        st_mode = plain.stat().st_mode
        st_file_attributes = 0x10 | 0x400  # directory | reparse point

    monkeypatch.setattr(safeio.os, "lstat", lambda path: Junction())
    assert safeio._is_link(plain)


@pytest.mark.django_db
def test_after_restore_takes_a_name_starting_with_a_dash():
    """The updaters pass --requested-by=NAME as one argument, so a name like "-Bob" isn't read as an option."""
    from django.core.management import call_command

    from conduit.audit.models import AuditEvent

    call_command("after_restore", "conduit-20261029-031500.tar.gz", "--requested-by=-Bob")
    event = AuditEvent.objects.get(action="backup.restored")
    assert event.details["requested_by"] == "-Bob"
