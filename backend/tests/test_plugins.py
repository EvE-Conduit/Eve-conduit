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
    assert plugins[0]["entry"] == "/static/sample/plugin.js"


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
