"""Installing plugins from the signed catalog or git: the site's side and the updater's planning step."""

import base64
import json

import httpx
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from conduit.notify.models import Notification
from conduit.plugins import catalog as cat
from conduit.plugins import installer, installs
from conduit.plugins.models import PluginInstaller

KEY = Ed25519PrivateKey.generate()
PUB = base64.b64encode(KEY.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)).decode()
SHA = "a" * 40
SHA2 = "b" * 40


def entry(pid="discord", package="conduit-discord", version="1.0.0", sha=SHA, **extra):
    return {
        "id": pid, "package": package, "name": pid.title(), "version": version,
        "description": f"The {pid} plugin", "author": "EvE Conduit", "icon": "message-circle",
        "requirement": f"{package} @ https://github.com/EvE-Conduit/plugins/archive/{sha}.tar.gz#subdirectory={package}",
        **extra,
    }


def catalog_bytes(*entries, serial=100) -> bytes:
    return json.dumps({"format": 1, "serial": serial, "generated_at": "2026-10-07T12:00:00Z", "plugins": list(entries)}).encode()


def sign(data: bytes, key=KEY) -> bytes:
    return base64.b64encode(key.sign(data))


@pytest.fixture(autouse=True)
def _env(monkeypatch, tmp_path, settings):
    monkeypatch.setattr("conduit.updates.verify.check_signature.__defaults__", ((PUB,),))
    settings.CONDUIT_INSTALL_KIND = "baremetal"
    settings.CONDUIT_UPDATES_DIR = str(tmp_path / "updates")
    settings.CONDUIT_PLUGIN_SITE_FILE = str(tmp_path / "plugins-site.txt")
    settings.CONDUIT_PLUGIN_CATALOG_URL = "https://github.com/EvE-Conduit/plugins/releases/download/catalog/catalog.json"
    settings.CONDUIT_PLUGIN_URLS = False


@pytest.fixture
def dists(monkeypatch):
    """Installed plugin packages, as installer.installed_dists() reports them."""
    found: dict[str, dict] = {}

    def add(name, version, source="", sub="", commit="", plugin="x"):
        found[cat.canonical(name)] = {"name": name, "version": version, "entry_points": [plugin],
                                      "targets": [f"{name.replace('-', '_')}.plugin:P"], "repo": source,
                                      "subdirectory": sub, "commit": commit}

    monkeypatch.setattr(installer, "installed_dists", lambda: {k: dict(v) for k, v in found.items()})
    monkeypatch.setattr(installs, "installed_dists", lambda: {k: dict(v) for k, v in found.items()})
    return add


@pytest.fixture
def remote(monkeypatch):
    """The published catalog and its signature."""
    state = {"data": catalog_bytes(entry(), entry("timers", "conduit-timers", "0.2.0", min_conduit="99.0.0"))}
    state["sig"] = sign(state["data"])

    def get(url, **kwargs):
        body = state["sig"] if url.endswith(".sig") else state["data"]
        return httpx.Response(200, content=body, request=httpx.Request("GET", url))

    monkeypatch.setattr(installs.httpx, "get", get)
    return state


# --- the catalog ----------------------------------------------------------------------------------------


def test_catalog_must_be_signed_and_well_formed():
    data = catalog_bytes(entry())
    assert cat.load_verified(data, sign(data))["plugins"][0]["package"] == "conduit-discord"
    with pytest.raises(cat.CatalogError, match="signature"):
        cat.load_verified(data, sign(data, Ed25519PrivateKey.generate()))
    with pytest.raises(cat.CatalogError, match="signature"):
        cat.load_verified(data + b" ", sign(data))
    for bad in (
        entry(requirement="conduit-discord @ https://github.com/EvE-Conduit/plugins/archive/main.tar.gz#subdirectory=x"),
        entry(requirement=f"conduit-other @ https://github.com/EvE-Conduit/plugins/archive/{SHA}.tar.gz#subdirectory=x"),
        entry(requirement=f"conduit-discord @ https://evil.example/a/b/archive/{SHA}.tar.gz#subdirectory=x"),
        entry(requirement="--index-url https://evil.example conduit-discord"),
        entry(pid="Bad Id"),
        entry(homepage="http://insecure.example"),
    ):
        with pytest.raises(cat.CatalogError):
            cat.parse(catalog_bytes(bad))
    with pytest.raises(cat.CatalogError, match="twice"):
        cat.parse(catalog_bytes(entry(), entry(package="conduit-discord2")))


@pytest.mark.parametrize("url", [
    "git+https://github.com/someone/conduit-thing",
    "https://github.com/someone/conduit-thing.git@v1.0.0",
    "git+https://gitlab.example.com/a/b/c@main#subdirectory=plugins/thing",
])
def test_git_urls_accepted(url):
    assert cat.check_url(url).startswith("git+https://")


@pytest.mark.parametrize("url", [
    "git+http://github.com/a/b",
    "git+ssh://git@github.com/a/b",
    "git+https://user:pw@github.com/a/b",
    "git+https://github.com/a/b --index-url https://evil.example",
    "-e git+https://github.com/a/b",
    "git+https://github.com/a/../../b",
    "file:///etc/passwd",
    "conduit-thing",
])
def test_git_urls_refused(url):
    with pytest.raises(cat.CatalogError):
        cat.check_url(url)


# --- the updater's planning step --------------------------------------------------------------------------


def write_request(updates, *actions, rid="c" * 32):
    updates.mkdir(parents=True, exist_ok=True)
    (updates / installer.REQUEST_FILE).write_text(json.dumps({"id": rid, "actions": list(actions)}))


def put_catalog(updates, *entries, serial=100, key=KEY):
    updates.mkdir(parents=True, exist_ok=True)
    data = catalog_bytes(*entries, serial=serial)
    (updates / installer.CATALOG_FILE).write_bytes(data)
    (updates / installer.CATALOG_SIG).write_bytes(sign(data, key))


def test_prepare_installs_catalog_plugin_as_pinned(tmp_path, dists, capsys):
    updates, site, serial = tmp_path / "u", tmp_path / "plugins-site.txt", tmp_path / "serial"
    put_catalog(updates, entry())
    write_request(updates, {"op": "install", "package": "conduit-discord"})
    assert installer.main(["prepare", str(updates), str(site), str(serial)]) == 0
    out = capsys.readouterr().out
    assert f"id\t{'c' * 32}" in out and "Discord 1.0.0" in out
    assert installer.read_site_file(site.with_name("plugins-site.txt.new")) == [entry()["requirement"]]
    assert serial.read_text() == "100"
    assert not (updates / installer.REQUEST_FILE).exists()  # one attempt per request


def test_prepare_updates_replace_the_old_pin(tmp_path, dists):
    updates, site = tmp_path / "u", tmp_path / "plugins-site.txt"
    dists("conduit-discord", "1.0.0", "https://github.com/eve-conduit/plugins", "conduit-discord", SHA)
    site.write_text(entry()["requirement"] + "\ngit+https://github.com/x/y\n")
    put_catalog(updates, entry(version="1.1.0", sha=SHA2))
    write_request(updates, {"op": "install", "package": "conduit-discord"})
    out = installer.prepare(updates, site, tmp_path / "serial", None)
    assert out["lines"] == ["git+https://github.com/x/y", entry(sha=SHA2)["requirement"]]


def test_prepare_refuses_and_reports(tmp_path, dists):
    updates, site, serial = tmp_path / "u", tmp_path / "plugins-site.txt", tmp_path / "serial"

    def refused(match, *actions, env=None):
        write_request(updates, *actions)
        with pytest.raises(installer.RequestError, match=match):
            installer.prepare(updates, site, serial, env)
        result = json.loads((updates / installer.RESULT_FILE).read_text())
        assert result["status"] == "failed" and result["id"] == "c" * 32

    put_catalog(updates, entry(), key=Ed25519PrivateKey.generate())
    refused("signature", {"op": "install", "package": "conduit-discord"})
    put_catalog(updates, entry())
    refused("not in the plugin catalog", {"op": "install", "package": "conduit-evil"})
    refused("turned off", {"op": "install", "url": "git+https://github.com/x/y"})
    env = tmp_path / "conduit.env"
    env.write_text("CONDUIT_PLUGIN_URLS=true\n")
    refused("git URL over HTTPS", {"op": "install", "url": "git+https://github.com/x/y --pre"}, env=str(env))
    dists("conduit-manual", "1.0.0")
    refused("wasn't installed from Administration", {"op": "remove", "package": "conduit-manual"})
    refused("not an installed plugin", {"op": "remove", "package": "django"})
    serial.write_text("200")
    refused("older than one already used", {"op": "install", "package": "conduit-discord"})
    put_catalog(updates, entry(min_conduit="99.0.0"), serial=300)
    refused("needs EvE Conduit 99.0.0", {"op": "install", "package": "conduit-discord"})


def test_prepare_git_url_and_removal(tmp_path, dists, capsys):
    updates, site = tmp_path / "u", tmp_path / "plugins-site.txt"
    env = tmp_path / "conduit.env"
    env.write_text('CONDUIT_PLUGIN_URLS="yes"\n')
    dists("conduit-thing", "0.3.0", "https://github.com/someone/conduit-thing")
    site.write_text("git+https://github.com/someone/conduit-thing@main\n")
    write_request(updates, {"op": "install", "url": "https://github.com/someone/conduit-thing@main"},
                  {"op": "install", "url": "git+https://github.com/someone/other"})
    assert installer.main(["prepare", str(updates), str(site), str(tmp_path / "s"), "--env-file", str(env)]) == 0
    assert "reinstall\tgit+https://github.com/someone/conduit-thing@main" in capsys.readouterr().out
    write_request(updates, {"op": "remove", "package": "conduit-thing"})
    assert installer.main(["prepare", str(updates), str(site), str(tmp_path / "s")]) == 0
    assert "uninstall\tconduit-thing" in capsys.readouterr().out
    assert installer.read_site_file(site.with_name("plugins-site.txt.new")) == []


# --- the site ---------------------------------------------------------------------------------------------


@pytest.mark.django_db
def test_refresh_saves_verified_catalog_for_the_updater(remote, tmp_path):
    state = installs.refresh_catalog()
    assert [p["id"] for p in state.catalog["plugins"]] == ["discord", "timers"]
    assert (tmp_path / "updates" / installer.CATALOG_FILE).read_bytes() == remote["data"]
    remote["sig"] = sign(remote["data"], Ed25519PrivateKey.generate())
    with pytest.raises(installs.InstallError, match="signature"):
        installs.refresh_catalog()
    assert PluginInstaller.load().catalog["serial"] == 100  # the good copy stays


@pytest.mark.django_db
def test_install_request_and_result(remote, dists, admin_user, api_client, tmp_path):
    api_client.force_login(admin_user)
    assert api_client.call("post", "/api/admin/plugin-installs/refresh").status_code == 200
    overview = api_client.call("get", "/api/admin/plugin-installs").json()
    timers = next(p for p in overview["catalog"] if p["id"] == "timers")
    assert overview["can_install"] and not timers["compatible"]

    resp = api_client.call("post", "/api/admin/plugin-installs", {"actions": [{"op": "install", "package": "conduit-timers"}]})
    assert resp.status_code == 400 and "needs EvE Conduit" in resp.json()["detail"]
    resp = api_client.call("post", "/api/admin/plugin-installs", {"actions": [{"op": "install", "package": "conduit-discord"}]})
    assert resp.status_code == 200 and resp.json()["job"]["state"] == "requested"
    request = json.loads((tmp_path / "updates" / installer.REQUEST_FILE).read_text())
    assert request["actions"] == [{"op": "install", "package": "conduit-discord"}]
    assert PluginInstaller.load().auto_update == ["conduit-discord"]
    resp = api_client.call("post", "/api/admin/plugin-installs", {"actions": [{"op": "install", "package": "conduit-discord"}]})
    assert resp.status_code == 400 and "already working" in resp.json()["detail"]

    installer.write_result(tmp_path / "updates", request["id"], "succeeded", "Installed.")
    out = api_client.call("get", "/api/admin/plugin-installs").json()
    assert out["job"]["state"] == "succeeded"
    assert Notification.objects.filter(user=admin_user, link="/admin/plugins").exists()


@pytest.mark.django_db
def test_git_urls_need_the_server_switch(remote, admin_user, settings):
    installs.refresh_catalog()
    with pytest.raises(installs.InstallError, match="CONDUIT_PLUGIN_URLS"):
        installs.request(admin_user, [{"op": "install", "url": "git+https://github.com/x/y"}])
    settings.CONDUIT_PLUGIN_URLS = True
    assert installs.request(admin_user, [{"op": "install", "url": "https://github.com/x/y"}]).job_state == "requested"


@pytest.mark.django_db
def test_server_installed_plugins_stay_out_of_reach(remote, dists, admin_user):
    installs.refresh_catalog()
    dists("conduit-discord", "0.9.0")
    with pytest.raises(installs.InstallError, match="installed on the server"):
        installs.request(admin_user, [{"op": "install", "package": "conduit-discord"}])
    with pytest.raises(installs.InstallError, match="installed on the server"):
        installs.request(admin_user, [{"op": "remove", "package": "conduit-discord"}])


@pytest.mark.django_db
def test_daily_check_auto_updates_and_notifies(remote, dists, admin_user, tmp_path):
    site = tmp_path / "plugins-site.txt"
    site.write_text(entry()["requirement"] + "\n" + entry("fleets", "conduit-fleets")["requirement"] + "\n")
    dists("conduit-discord", "1.0.0")
    dists("conduit-fleets", "1.0.0")
    remote["data"] = catalog_bytes(entry(version="1.1.0", sha=SHA2), entry("fleets", "conduit-fleets", "2.0.0", sha=SHA2), serial=101)
    remote["sig"] = sign(remote["data"])
    installs.set_auto_update("conduit-discord", True)
    assert installs.check_for_updates() == "auto-updating Discord"
    request = json.loads((tmp_path / "updates" / installer.REQUEST_FILE).read_text())
    assert request["actions"] == [{"op": "install", "package": "conduit-discord"}]
    assert PluginInstaller.load().job_automatic
    note = Notification.objects.get(user=admin_user, title="Plugin updates are available")
    assert note.body == "Fleets 2.0.0"
    installs.check_for_updates()
    assert Notification.objects.filter(user=admin_user, title="Plugin updates are available").count() == 1


@pytest.mark.django_db
def test_docker_gets_instructions(remote, admin_user, settings):
    settings.CONDUIT_INSTALL_KIND = "docker"
    installs.refresh_catalog()
    out = installs.overview()
    assert not out["can_install"] and "requirements-plugins.txt" in out["instructions"]
    assert out["catalog"][0]["requirement"].startswith("conduit-discord @ https://github.com/")
    with pytest.raises(installs.InstallError, match="docker compose"):
        installs.request(admin_user, [{"op": "install", "package": "conduit-discord"}])



@pytest.mark.django_db
def test_opening_the_page_loads_the_catalog(remote):
    out = installs.overview()
    assert [p["id"] for p in out["catalog"]] == ["discord", "timers"]
    assert out["catalog_checked_at"]


@pytest.mark.django_db
def test_an_unreachable_catalog_is_reported_not_raised(monkeypatch):
    def down(url, **kwargs):
        raise httpx.ConnectError("no route")

    monkeypatch.setattr(installs.httpx, "get", down)
    out = installs.overview()
    assert out["catalog"] == [] and "couldn't reach" in out["catalog_error"]
