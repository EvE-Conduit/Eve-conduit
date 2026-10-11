"""Plugins installed from Administration on a Docker install (conduit.plugins.docker_updater)."""

import json
import subprocess
import uuid
from pathlib import Path

import pytest

from conduit.plugins import docker_updater, installer, installs
from conduit.plugins.models import PluginInstaller


def _request(root: Path, *actions) -> str:
    rid = uuid.uuid4().hex
    (root / "updates").mkdir(parents=True, exist_ok=True)
    (root / "updates" / installer.REQUEST_FILE).write_text(json.dumps({"id": rid, "actions": list(actions)}))
    return rid


def _result(root: Path) -> dict:
    return json.loads((root / "updates" / installer.RESULT_FILE).read_text())


class FakePip:
    """Stands in for `python -m venv` and `pip install`: records the calls, and builds a fake venv."""

    def __init__(self, fail: bool = False):
        self.calls: list[list[str]] = []
        self.fail = fail

    def __call__(self, cmd, p):
        self.calls.append(cmd)
        if "venv" in cmd:
            target = Path(cmd[-1])
            (target / "bin").mkdir(parents=True)
            (target / "bin" / "python").write_text("#!fake\n")
        elif self.fail:
            raise subprocess.CalledProcessError(1, cmd)


def test_apply_writes_the_list_and_tells_the_site(tmp_path, monkeypatch):
    monkeypatch.setattr("conduit.plugins.installer.installed_dists", lambda: {})
    monkeypatch.setattr("conduit.plugins.installer.read_env_flag", lambda env_file, key: True)
    root = tmp_path / "plugins"
    rid = _request(root, {"op": "install", "url": "git+https://github.com/someone/conduit-thing"})

    out = docker_updater.apply(root)

    assert out["id"] == rid
    assert installer.read_site_file(root / "plugins-site.txt") == ["git+https://github.com/someone/conduit-thing"]
    assert (root / "plugins-site.txt.bak").read_text() == ""  # nothing before
    assert _result(root)["status"] == "running"
    assert json.loads((root / "job.json").read_text())["id"] == rid
    assert json.loads((root / "updates" / "progress.json").read_text())["step"] == "install"
    assert not (root / "updates" / installer.REQUEST_FILE).exists()


def test_apply_refuses_bad_requests_before_changing_anything(tmp_path, monkeypatch):
    monkeypatch.setattr("conduit.plugins.installer.installed_dists", lambda: {})
    root = tmp_path / "plugins"
    (root).mkdir()
    (root / "plugins-site.txt").write_text("git+https://github.com/a/b\n")
    rid = _request(root, {"op": "remove", "package": "conduit-nothing"})
    with pytest.raises(installer.RequestError):
        docker_updater.apply(root)
    assert _result(root)["status"] == "failed" and _result(root)["id"] == rid
    assert installer.read_site_file(root / "plugins-site.txt") == ["git+https://github.com/a/b"]
    assert not (root / "job.json").exists()


def test_sync_builds_the_venv_once_and_finish_reports(tmp_path, monkeypatch):
    monkeypatch.setattr("conduit.plugins.installer.installed_dists", lambda: {})
    monkeypatch.setattr("conduit.plugins.installer.read_env_flag", lambda env_file, key: True)
    root = tmp_path / "plugins"
    rid = _request(root, {"op": "install", "url": "git+https://github.com/someone/conduit-thing"})
    docker_updater.apply(root)
    pip = FakePip()

    assert docker_updater.sync(root, python="py", run=pip) is True
    assert [c[:3] for c in pip.calls] == [["py", "-m", "venv"], [str(root / "venv.new" / "bin" / "python"), "-m", "pip"]]
    assert (root / "venv" / "bin" / "python").exists() and not (root / "venv.new").exists()
    assert (root / "installed.txt").read_text() == "git+https://github.com/someone/conduit-thing\n"
    first = docker_updater.generation(root)
    assert first and not (root / "plugins-site.txt.bak").exists()
    assert json.loads((root / "updates" / "progress.json").read_text())["step"] == "migrate"
    # The other containers find nothing to do.
    assert docker_updater.sync(root, python="py", run=pip) is True
    assert len(pip.calls) == 2
    # The web container, after migrating:
    docker_updater.finish(root)
    assert _result(root)["status"] == "succeeded" and _result(root)["id"] == rid
    assert not (root / "job.json").exists() and not (root / "updates" / "progress.json").exists()
    assert docker_updater.generation(root) == first


def test_sync_puts_the_old_list_back_when_pip_fails(tmp_path, monkeypatch):
    monkeypatch.setattr("conduit.plugins.installer.installed_dists", lambda: {})
    monkeypatch.setattr("conduit.plugins.installer.read_env_flag", lambda env_file, key: True)
    root = tmp_path / "plugins"
    root.mkdir()
    # A working venv for one plugin already...
    (root / "plugins-site.txt").write_text("git+https://github.com/a/old\n")
    assert docker_updater.sync(root, python="py", run=FakePip()) is True
    before = docker_updater.generation(root)
    # ...then a request for a second that pip can't install.
    rid = _request(root, {"op": "install", "url": "git+https://github.com/a/broken"})
    docker_updater.apply(root)

    assert docker_updater.sync(root, python="py", run=FakePip(fail=True)) is False
    assert installer.read_site_file(root / "plugins-site.txt") == ["git+https://github.com/a/old"]
    assert (root / "venv" / "bin" / "python").exists() and not (root / "venv.new").exists()
    assert docker_updater.generation(root) == before  # the worker and beat stay up
    result = _result(root)
    assert result["status"] == "failed" and result["id"] == rid and "previous plugins" in result["message"]
    assert not (root / "job.json").exists() and not (root / "updates" / "progress.json").exists()
    # Nothing left to do on the next start.
    pip = FakePip()
    assert docker_updater.sync(root, python="py", run=pip) is True and pip.calls == []


def test_sync_never_raises(tmp_path):
    def boom(cmd, p):
        raise RuntimeError("no python here")

    root = tmp_path / "plugins"
    root.mkdir()
    (root / "plugins-site.txt").write_text("git+https://github.com/a/b\n")
    assert docker_updater.sync(root, run=boom) is False
    assert "plugin sync skipped" in (root / "updater.log").read_text() or "pip failed" in (root / "updater.log").read_text()


def test_watcher_stops_the_process_when_the_generation_changes(tmp_path):
    root = tmp_path / "plugins"
    root.mkdir()
    (root / "generation").write_text("aaaa\n")
    stopped = []
    import threading

    t = threading.Thread(target=docker_updater.watch, args=(root, 0.05), kwargs={"stop": lambda: stopped.append(1)})
    t.start()
    t.join(0.3)
    assert t.is_alive() and not stopped  # unchanged: keeps waiting
    (root / "generation").write_text("bbbb\n")
    t.join(2)
    assert not t.is_alive() and stopped == [1]


@pytest.mark.django_db
def test_docker_installs_apply_and_restart(admin_user, settings, tmp_path, monkeypatch, django_capture_on_commit_callbacks):
    """The site's request on Docker: planned in the web container, then the web server restarts."""
    settings.CONDUIT_INSTALL_KIND = "docker"
    settings.CONDUIT_PLUGINS_DIR = str(tmp_path / "plugins")
    settings.CONDUIT_UPDATES_DIR = str(tmp_path / "plugins" / "updates")
    settings.CONDUIT_PLUGIN_SITE_FILE = str(tmp_path / "plugins" / "plugins-site.txt")
    settings.CONDUIT_PLUGIN_URLS = True
    monkeypatch.setattr("conduit.plugins.installer.installed_dists", lambda: {})
    monkeypatch.setattr("conduit.plugins.installs.installed_dists", lambda: {})
    monkeypatch.setattr("conduit.plugins.installer.read_env_flag", lambda env_file, key: True)
    restarted = []
    monkeypatch.setattr(docker_updater, "restart_web", lambda: restarted.append(1))

    assert installs.can_install() is True
    with django_capture_on_commit_callbacks(execute=True):
        state = installs.request(admin_user, [{"op": "install", "url": "https://github.com/someone/conduit-thing"}])
    assert state.job_state == PluginInstaller.Job.REQUESTED
    assert installer.read_site_file(tmp_path / "plugins" / "plugins-site.txt") == ["git+https://github.com/someone/conduit-thing"]
    assert restarted == [1]
    # A request the site refuses changes nothing and doesn't restart anything.
    installs.cancel()
    with pytest.raises(installs.InstallError, match="isn't installed"), django_capture_on_commit_callbacks(execute=True):
        installs.request(admin_user, [{"op": "remove", "package": "conduit-nothing"}])
    assert restarted == [1]
