"""Finding, downloading, verifying and requesting installs of new releases."""

import base64
import hashlib
import json

import httpx
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from django.test import override_settings

from conduit import __version__
from conduit.notify.models import Notification
from conduit.updates import services, verify
from conduit.updates.models import UpdateState

from .conftest import make_user

KEY = Ed25519PrivateKey.generate()
PUB = base64.b64encode(KEY.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)).decode()
NEXT = "99.0.0"
ZIP = f"eve-conduit-{NEXT}-windows.zip"
PAYLOAD = b"PK\x03\x04 pretend release " * 5000


def signed_sums(files: dict[str, bytes], key=KEY) -> tuple[bytes, bytes]:
    sums = "".join(f"{hashlib.sha256(data).hexdigest()}  {name}\n" for name, data in files.items()).encode()
    return sums, base64.b64encode(key.sign(sums))


def release_json(version=NEXT, **extra):
    base = "https://github.com/EvE-Conduit/Eve-conduit/releases/download/v" + version
    return {
        "tag_name": f"v{version}", "name": f"EvE Conduit {version}", "body": "## What's new\n- Things", "draft": False,
        "prerelease": False, "published_at": "2026-10-07T12:00:00Z", "html_url": "https://github.com/x",
        "assets": [{"name": n, "browser_download_url": f"{base}/{n}", "size": len(PAYLOAD) if n == ZIP else 10}
                   for n in (ZIP, f"eve-conduit-{version}.tar.gz", "SHA256SUMS", "SHA256SUMS.sig")],
        **extra,
    }


@pytest.fixture(autouse=True)
def _keys(monkeypatch, tmp_path, settings):
    monkeypatch.setattr(verify, "PUBLIC_KEYS", (PUB,))
    monkeypatch.setattr("conduit.updates.verify.check_signature.__defaults__", ((PUB,),))
    monkeypatch.setattr("conduit.updates.verify.verify_release.__defaults__", ((PUB,),))
    settings.CONDUIT_INSTALL_KIND = "windows"
    settings.CONDUIT_UPDATES_DIR = str(tmp_path)


@pytest.fixture
def github(monkeypatch):
    """Fake GitHub: the release list and the three downloads."""
    sums, sig = signed_sums({ZIP: PAYLOAD})
    files = {ZIP: PAYLOAD, "SHA256SUMS": sums, "SHA256SUMS.sig": sig}
    state = {"releases": [release_json(), release_json("0.0.1"), release_json("98.0.0", prerelease=True), release_json("97.0.0", draft=True)], "files": files}

    def get(url, **kwargs):
        if url.endswith("/releases"):
            return httpx.Response(200, json=state["releases"], request=httpx.Request("GET", url))
        name = url.rsplit("/", 1)[1]
        return httpx.Response(200, content=state["files"][name], request=httpx.Request("GET", url))

    class Stream:
        def __init__(self, method, url, **kwargs):
            self.resp = get(url)
            self.resp.url  # noqa: B018
        def __enter__(self):
            r = self.resp
            r.iter_bytes = lambda size: [r.content[i:i + size] for i in range(0, len(r.content), size)]
            return r
        def __exit__(self, *a):
            return False

    monkeypatch.setattr(services.httpx, "get", get)
    monkeypatch.setattr(services.httpx, "stream", Stream)
    return state


# --- verification ---------------------------------------------------------------------------------------


def test_verify_accepts_signed_and_rejects_tampered(tmp_path):
    f = tmp_path / ZIP
    f.write_bytes(PAYLOAD)
    sums, sig = signed_sums({ZIP: PAYLOAD})
    assert verify.verify_release(f, sums, sig, keys=(PUB,))
    f.write_bytes(PAYLOAD + b"x")
    with pytest.raises(verify.VerificationError, match="does not match"):
        verify.verify_release(f, sums, sig, keys=(PUB,))
    other = Ed25519PrivateKey.generate()
    sums2, sig2 = signed_sums({ZIP: PAYLOAD + b"x"}, key=other)
    with pytest.raises(verify.VerificationError, match="not signed"):
        verify.verify_release(f, sums2, sig2, keys=(PUB,))


def test_verify_cli(tmp_path, capsys):
    f = tmp_path / ZIP
    f.write_bytes(PAYLOAD)
    sums, sig = signed_sums({ZIP: PAYLOAD})
    (tmp_path / "S").write_bytes(sums)
    (tmp_path / "S.sig").write_bytes(sig)
    assert verify.main([str(f), str(tmp_path / "S"), str(tmp_path / "S.sig")]) == 0
    assert verify.main([str(f), str(tmp_path / "S"), str(tmp_path / "nope")]) == 1


# --- checking -------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_check_lists_newer_stable_releases_and_notifies_admins_once(github, admin_user, user):
    state = services.check()
    assert [r["version"] for r in state.releases] == [NEXT]
    assert Notification.objects.filter(user=admin_user, link="/admin/updates").count() == 1
    assert not Notification.objects.filter(user=user).exists()
    services.check()
    assert Notification.objects.filter(user=admin_user, link="/admin/updates").count() == 1


@pytest.mark.django_db
def test_manual_check_has_a_cooldown(github):
    services.check(manual=True)
    with pytest.raises(services.UpdateError, match="less than a minute"):
        services.check(manual=True)


# --- download and install request -------------------------------------------------------------------------


@pytest.mark.django_db
def test_download_verify_and_request_install(github, admin_user, tmp_path):
    services.check()
    state = services.start_download(NEXT)
    state.refresh_from_db()
    assert state.download_state == UpdateState.Download.READY
    assert (tmp_path / ZIP).read_bytes() == PAYLOAD
    state = services.request_install(admin_user)
    request = json.loads((tmp_path / "install-request.json").read_text())
    assert request == {**request, "version": NEXT, "file": ZIP}
    assert state.install_state == UpdateState.Install.REQUESTED
    with pytest.raises(services.UpdateError, match="already in progress"):
        services.request_install(admin_user)

    # The updater reports back.
    (tmp_path / "install-result.json").write_text(json.dumps({"version": NEXT, "status": "running"}))
    assert services.state_out(UpdateState.load())["install"]["state"] == "running"
    (tmp_path / "install-result.json").write_text(json.dumps({"version": NEXT, "status": "succeeded", "message": "done"}))
    out = services.state_out(UpdateState.load())
    assert out["install"]["state"] == "succeeded" and out["download"]["state"] == "none"
    assert Notification.objects.filter(user=admin_user, title=f"EvE Conduit {NEXT} is installed").exists()


@pytest.mark.django_db
def test_tampered_download_is_refused(github, tmp_path):
    services.check()
    github["files"][ZIP] = PAYLOAD + b"evil"
    services.start_download(NEXT)
    state = UpdateState.load()
    assert state.download_state == UpdateState.Download.FAILED and "does not match" in state.download_error
    assert not (tmp_path / ZIP).exists()


@pytest.mark.django_db
def test_file_changed_after_download_is_not_requested(github, admin_user, tmp_path):
    services.check()
    services.start_download(NEXT)
    (tmp_path / ZIP).write_bytes(b"swapped")
    with pytest.raises(services.UpdateError, match="no longer checks out"):
        services.request_install(admin_user)
    assert not (tmp_path / "install-request.json").exists()


@pytest.mark.django_db
def test_failed_install_is_reported(github, admin_user, tmp_path):
    services.check()
    services.start_download(NEXT)
    services.request_install(admin_user)
    (tmp_path / "install-result.json").write_text(json.dumps({"version": NEXT, "status": "failed", "message": "pip broke"}))
    out = services.state_out(UpdateState.load())
    assert out["install"]["state"] == "failed" and out["install"]["message"] == "pip broke"
    assert out["download"]["state"] == "ready"  # can try again


@pytest.mark.django_db
def test_downloads_only_from_github(github):
    services.check()
    state = UpdateState.load()
    state.releases[0]["assets"]["SHA256SUMS"]["url"] = "https://evil.example/SHA256SUMS"
    state.save()
    services.start_download(NEXT)
    assert "refusing to download from evil.example" in UpdateState.load().download_error


@pytest.mark.django_db
@override_settings(CONDUIT_INSTALL_KIND="docker")
def test_docker_installs_get_instructions(github, admin_user):
    services.check()
    with pytest.raises(services.UpdateError, match="docker compose"):
        services.start_download(NEXT)
    assert services.state_out(UpdateState.load())["can_install"] is False


# --- API ------------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_api_needs_manage_site_and_bootstrap_badge(github, admin_user, user, api_client):
    api_client.force_login(user)
    assert api_client.call("get", "/api/admin/updates").status_code == 403
    assert "update_available" not in api_client.call("get", "/api/core/bootstrap").json()["site"] or \
        api_client.call("get", "/api/core/bootstrap").json()["site"]["update_available"] is None
    api_client.force_login(admin_user)
    out = api_client.call("post", "/api/admin/updates/check").json()
    assert out["latest"] == NEXT and out["current_version"] == __version__ and out["releases"][0]["notes"].startswith("##")
    assert api_client.call("get", "/api/core/bootstrap").json()["site"]["update_available"] == NEXT
    assert api_client.call("post", "/api/admin/updates/install").status_code == 400  # nothing downloaded
    assert api_client.call("post", "/api/admin/updates/download", {"version": NEXT}).json()["download"]["state"] == "ready"
    assert api_client.call("post", "/api/admin/updates/install").json()["install"]["state"] == "requested"
    assert api_client.call("post", "/api/admin/updates/cancel").json()["install"]["state"] == "none"


def test_version_compare():
    from conduit.updates.versions import is_downgrade, is_newer, parse

    assert is_newer("v0.10.0", "0.9.9") and not is_newer("0.4.0", "0.4.0") and parse("1.2") is None
    assert is_downgrade("0.0.1", __version__) and is_downgrade("garbage", __version__)
    assert not is_downgrade(__version__, __version__) and not is_downgrade("99.0.0", __version__)


def test_updaters_can_ask_whether_a_version_is_a_downgrade(capsys):
    """The bash and PowerShell updaters run this before installing a signed release."""
    from conduit.updates import versions

    assert versions.main(["check-upgrade", NEXT]) == 0
    assert versions.main(["check-upgrade", __version__]) == 0  # a reinstall
    assert versions.main(["check-upgrade", "0.0.1"]) == 1
    assert capsys.readouterr().out.split() == [__version__] * 3
    assert versions.main(["check-upgrade", "1.0; rm -rf"]) == 2
    assert versions.main(["bogus"]) == 2


@pytest.mark.django_db
def test_an_older_release_is_not_requested(github, admin_user, tmp_path):
    services.check()
    services.start_download(NEXT)
    state = UpdateState.load()
    state.download_version = "0.0.1"  # a signed, verified, but older release
    state.save()
    with pytest.raises(services.UpdateError, match=f"0.0.1 is older than the running {__version__}"):
        services.request_install(admin_user)
    assert not (tmp_path / "install-request.json").exists()


# --- the root updater's file access --------------------------------------------------------------------------


def test_safeio_never_follows_symlinks(tmp_path):
    """The updater writes as root into folders the service user owns: a planted symlink must be replaced, never
    followed, and nothing but a plain file is read or appended to."""
    from conduit.updates import safeio

    secret = tmp_path / "secret"
    secret.write_text("keep")
    folder = tmp_path / "updates"
    folder.mkdir()
    link = folder / "install-result.json"
    link.symlink_to(secret)

    safeio.write_json(link, {"status": "running"})
    assert not link.is_symlink() and json.loads(link.read_text()) == {"status": "running"}
    assert secret.read_text() == "keep"
    assert link.stat().st_mode & 0o777 == 0o644 and not list(folder.glob(".*.tmp"))

    log = folder / "updater.log"
    log.symlink_to(secret)
    with pytest.raises(OSError):
        safeio.append(log, b"owned\n")
    assert secret.read_text() == "keep"
    log.unlink()
    safeio.append(log, b"one\n")
    safeio.append(log, b"two\n")
    assert log.read_text() == "one\ntwo\n"
    (folder / "hardlink.log").hardlink_to(log)
    with pytest.raises(safeio.UnsafePath, match="more than one link"):
        safeio.append(log, b"three\n")  # a hard link to someone else's file would collect our lines
    (folder / "hardlink.log").unlink()
    with pytest.raises(OSError):
        safeio.append(folder, b"x")  # a directory

    request = folder / "install-request.json"
    request.symlink_to(secret)
    with pytest.raises(OSError):
        safeio.read_json(request)
    request.unlink()
    request.write_text(json.dumps({"version": NEXT}))
    assert safeio.read_json(request) == {"version": NEXT}
    (folder / "hardlink.json").hardlink_to(request)
    with pytest.raises(safeio.UnsafePath, match="more than one link"):
        safeio.read_json(request)
    (folder / "hardlink.json").unlink()
    request.write_text("[1, 2]")
    with pytest.raises(safeio.UnsafePath):
        safeio.read_json(request)

    release = folder / "release.tar.gz"
    release.symlink_to(secret)
    with pytest.raises(OSError):
        safeio.copy_regular(release, tmp_path / "work.tar.gz")
    assert not (tmp_path / "work.tar.gz").exists()
    (tmp_path / "work").mkdir()
    safeio.copy_regular(request, tmp_path / "work" / "copy.json")
    assert (tmp_path / "work" / "copy.json").read_text() == "[1, 2]"

    # The folder itself may be the symlink.
    (tmp_path / "dirlink").symlink_to(folder)
    with pytest.raises(OSError):
        safeio.write_json(tmp_path / "dirlink" / "progress.json", {})
    assert not (folder / "progress.json").exists()


def test_safeio_cli(tmp_path, capsys):
    from conduit.updates import safeio

    secret = tmp_path / "secret"
    secret.write_text("keep")
    result = tmp_path / "install-result.json"
    assert safeio.main(["write-json", str(result), "--owner", "no-such-user-here", "status=x"]) == 1  # nothing written
    assert not result.exists() and "no such user" in capsys.readouterr().err
    assert safeio.main(["write-json", str(result), "--stamp", "version=1.2.3", "status=failed", "message=a=b --stamp"]) == 0
    data = json.loads(result.read_text())
    assert data == {**data, "version": "1.2.3", "status": "failed", "message": "a=b --stamp"} and data["at"]
    assert safeio.main(["write-json", str(result), "not a field"]) == 2
    assert safeio.main(["read-json", str(result)]) == 0
    assert json.loads(capsys.readouterr().out) == data

    log = tmp_path / "updater.log"
    log.symlink_to(secret)
    assert safeio.main(["append", str(log), "2026 hello"]) == 1
    assert secret.read_text() == "keep"
    log.unlink()
    assert safeio.main(["append", str(log), "2026 hello"]) == 0
    assert log.read_text() == "2026 hello\n"
    assert safeio.main(["copy-regular", str(result), str(tmp_path / "copy.json")]) == 0
    assert json.loads((tmp_path / "copy.json").read_text()) == data
    assert safeio.main(["copy-regular", str(log.with_name("missing")), str(tmp_path / "x")]) == 1
    assert safeio.main([]) == 2


# --- progress while the updater works ----------------------------------------------------------------------


def write_progress(tmp_path, **fields):
    from datetime import UTC, datetime

    data = {"kind": "release", "target": NEXT, "step": "install", "started_at": "2026-10-07T12:00:00Z",
            "at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"), **fields}
    (tmp_path / "progress.json").write_text(json.dumps(data))


@pytest.mark.django_db
def test_progress_is_shown_to_admins_and_everyone(tmp_path, client, admin_user):
    assert services.progress() is None
    write_progress(tmp_path)
    assert services.progress() == {"kind": "release", "target": NEXT, "step": "install",
                                   "steps": ["backup", "install", "migrate", "restart"], "started_at": "2026-10-07T12:00:00Z"}
    assert services.state_out(UpdateState.load())["progress"]["step"] == "install"
    # Everyone gets it with the bootstrap, signed in or not.
    assert client.get("/api/core/bootstrap").json()["site"]["updating"]["target"] == NEXT


@pytest.mark.django_db
def test_stale_or_odd_progress_is_ignored(tmp_path):
    write_progress(tmp_path, at="2020-01-01T00:00:00Z")
    assert services.progress() is None
    write_progress(tmp_path, step="rm -rf")
    assert services.progress() is None
    write_progress(tmp_path, kind="plugins", target="<script>")
    assert services.progress()["target"] == ""
    (tmp_path / "progress.json").write_text("{not json")
    assert services.progress() is None


@pytest.mark.django_db
def test_admins_see_a_waiting_install_in_the_bootstrap(github, admin_user, user, client, tmp_path):
    services.check()
    services.start_download(NEXT)
    services.request_install(admin_user)
    client.force_login(admin_user)
    pending = client.get("/api/core/bootstrap").json()["site"]["update_pending"]
    assert pending["kind"] == "release" and pending["target"] == NEXT
    client.force_login(user)
    assert client.get("/api/core/bootstrap").json()["site"].get("update_pending") is None
    # Once the updater is at work, the progress takes over.
    write_progress(tmp_path)
    client.force_login(admin_user)
    site = client.get("/api/core/bootstrap").json()["site"]
    assert site["update_pending"] is None and site["updating"]["step"] == "install"


@pytest.mark.django_db
def test_a_finished_install_is_not_shown_as_waiting(github, admin_user, client, tmp_path):
    services.check()
    services.start_download(NEXT)
    services.request_install(admin_user)
    # The updater did its work and restarted the site before anything read its result.
    (tmp_path / "install-result.json").write_text(json.dumps({"version": NEXT, "status": "succeeded"}))
    client.force_login(admin_user)
    assert client.get("/api/core/bootstrap").json()["site"]["update_pending"] is None
    assert UpdateState.load().install_state == UpdateState.Install.SUCCEEDED
