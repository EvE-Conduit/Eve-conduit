import pytest

from conduit.plugins import registry
from conduit.plugins.models import PluginState
from conduit.plugins.services import PluginError, is_enabled, required_scopes, set_enabled, sync_installed


def test_discovers_sample_plugin():
    found = registry.discover()
    assert found["sample"].ok
    assert "tests.sample_plugin.apps.SampleConfig" in registry.django_apps()


@pytest.mark.django_db
def test_enable_disable_and_scopes():
    sync_installed()
    assert PluginState.objects.get(plugin_id="sample").enabled is False
    assert "esi-fleets.read_fleet.v1" not in required_scopes()
    set_enabled("sample", True)
    assert is_enabled("sample")
    assert "esi-fleets.read_fleet.v1" in required_scopes()


@pytest.mark.django_db
def test_unknown_module_cannot_be_enabled():
    with pytest.raises(PluginError):
        set_enabled("nope", True)


@pytest.mark.django_db
def test_module_api_hidden_until_enabled(user, client):
    client.force_login(user)
    assert client.get("/api/p/sample/hello").status_code == 404
    set_enabled("sample", True)
    resp = client.get("/api/p/sample/hello")
    assert resp.status_code == 200
    assert resp.json() == {"hello": "Pilot One"}


@pytest.mark.django_db
def test_bootstrap_lists_enabled_module_for_signed_in_users(user, client):
    set_enabled("sample", True)
    assert client.get("/api/core/bootstrap").json()["plugins"] == []
    client.force_login(user)
    plugins = client.get("/api/core/bootstrap").json()["plugins"]
    assert plugins[0]["id"] == "sample"
    assert plugins[0]["entry"] == "/static/sample/plugin.js?v=1.0.0"  # versioned, so updates aren't stuck in caches


@pytest.mark.django_db
def test_plugins_can_grant_sheet_access(client):
    from conduit.plugins.services import set_enabled, sync_installed
    from conduit.sheet.access import can_view

    from .conftest import make_user

    viewer = make_user(90000010, "Viewer")
    book = make_user(90000011, "Open Book").main_character
    other = make_user(90000012, "Closed Book").main_character
    sync_installed()
    set_enabled("sample", False)
    assert not can_view(viewer, book)
    set_enabled("sample", True)
    assert can_view(viewer, book) and not can_view(viewer, other)
    client.force_login(viewer)
    assert client.get(f"/api/characters/{book.pk}").status_code == 200
    assert client.get(f"/api/characters/{other.pk}").status_code == 403


@pytest.mark.django_db
def test_members_only_plugins_are_hidden_from_guests(client, monkeypatch):
    from conduit.access.models import State

    from .conftest import make_user

    set_enabled("sample", True)
    guest = make_user(90000020, "Guest Pilot", member=False)
    guest.state = State.objects.create(name="Guest", priority=0, public=True)
    guest.save()
    client.force_login(guest)
    assert client.get("/api/p/sample/hello").status_code == 403
    assert client.get("/api/core/bootstrap").json()["plugins"] == []
    assert "sample" not in [g["key"] for g in client.get("/api/search?q=widget").json()["groups"]]

    # Plugins guests need (applying, linking Discord) opt out with members_only = False.
    monkeypatch.setattr(registry.installed()["sample"], "members_only", False)
    assert client.get("/api/p/sample/hello").status_code == 200
    assert client.get("/api/core/bootstrap").json()["plugins"][0]["id"] == "sample"


@pytest.mark.django_db
def test_public_api_and_pages_are_for_everyone(client, monkeypatch):
    from conduit.access.models import State

    from .conftest import make_user

    assert client.get("/api/public/p/sample/ping").status_code == 404  # not enabled
    set_enabled("sample", True)
    assert client.get("/api/public/p/sample/ping").json() == {"signed_in": False}
    assert client.get("/api/p/sample/hello").status_code == 401  # the rest still needs signing in

    # Guests of a members-only plugin get its public API, not the rest.
    guest = make_user(90000022, "Guest Pilot", member=False)
    guest.state = State.objects.create(name="Guest", priority=0, public=True)
    guest.save()
    client.force_login(guest)
    assert client.get("/api/public/p/sample/ping").json() == {"signed_in": True}
    assert client.get("/api/p/sample/hello").status_code == 403

    # With public pages its bundle loads for them, marked public-only and without sidebar entries.
    assert client.get("/api/core/bootstrap").json()["plugins"] == []
    monkeypatch.setattr(registry.installed()["sample"], "public_pages", True)
    entry = client.get("/api/core/bootstrap").json()["plugins"][0]
    assert (entry["id"], entry["public_only"], entry["nav"]) == ("sample", True, [])
    client.logout()
    assert client.get("/api/core/bootstrap").json()["plugins"][0]["public_only"] is True
    client.force_login(make_user(90000023, "Member Pilot"))
    entry = client.get("/api/core/bootstrap").json()["plugins"][0]
    assert entry["public_only"] is False and entry["nav"]


@pytest.mark.django_db
def test_admins_use_members_only_plugins_whatever_their_state(client):
    from .conftest import make_user

    set_enabled("sample", True)
    admin = make_user(90000021, "Admin Pilot", member=False)
    admin.is_superuser = True
    admin.save()
    client.force_login(admin)
    assert client.get("/api/p/sample/hello").status_code == 200


@pytest.mark.django_db
def test_each_plugin_gets_its_own_log(admin_user, client):
    import logging

    from conduit.audit.models import ServiceLog

    sync_installed()
    set_enabled("sample", True)
    logging.getLogger("tests.sample_plugin.api").info("synced %d widgets", 3)  # plugins keep INFO and up
    logging.getLogger("tests.sample_plugin.api").debug("too chatty")
    logging.getLogger("conduit.esi").info("core info stays out")
    logging.getLogger("conduit.esi").warning("core warning")

    rows = list(ServiceLog.objects.filter(plugin__in=("sample", "")).order_by("id").values_list("plugin", "level", "message"))
    assert rows == [
        ("sample", "INFO", "Sample 1.0.0 installed"),
        ("sample", "INFO", "Sample switched on"),
        ("sample", "INFO", "synced 3 widgets"),
        ("", "WARNING", "core warning"),
    ]

    client.force_login(admin_user)
    logs = client.get("/api/admin/plugins/sample/logs").json()
    assert [e["message"] for e in logs["items"]] == ["synced 3 widgets", "Sample switched on", "Sample 1.0.0 installed"]
    assert client.get("/api/admin/logs/service?plugin=core").json()["items"][0]["message"] == "core warning"
    assert "sample" in client.get("/api/admin/logs/service/plugins").json()

    logging.getLogger("tests.sample_plugin").error("ESI said no")
    sample = next(m for m in client.get("/api/admin/plugins").json() if m["id"] == "sample")
    assert (sample["log_warnings"], sample["log_errors"]) == (0, 1)
