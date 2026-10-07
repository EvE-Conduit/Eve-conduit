import pytest

from evecsm.modules import registry
from evecsm.modules.models import ModuleState
from evecsm.modules.services import ModuleError, is_enabled, required_scopes, set_enabled, sync_installed


def test_discovers_sample_module():
    found = registry.discover()
    assert found["sample"].ok
    assert "tests.sample_module.apps.SampleConfig" in registry.django_apps()


@pytest.mark.django_db
def test_enable_disable_and_scopes():
    sync_installed()
    assert ModuleState.objects.get(module_id="sample").enabled is False
    assert "esi-fleets.read_fleet.v1" not in required_scopes()
    set_enabled("sample", True)
    assert is_enabled("sample")
    assert "esi-fleets.read_fleet.v1" in required_scopes()


@pytest.mark.django_db
def test_unknown_module_cannot_be_enabled():
    with pytest.raises(ModuleError):
        set_enabled("nope", True)


@pytest.mark.django_db
def test_module_api_hidden_until_enabled(user, client):
    client.force_login(user)
    assert client.get("/api/m/sample/hello").status_code == 404
    set_enabled("sample", True)
    resp = client.get("/api/m/sample/hello")
    assert resp.status_code == 200
    assert resp.json() == {"hello": "Pilot One"}


@pytest.mark.django_db
def test_bootstrap_lists_enabled_module_for_signed_in_users(user, client):
    set_enabled("sample", True)
    assert client.get("/api/core/bootstrap").json()["modules"] == []
    client.force_login(user)
    modules = client.get("/api/core/bootstrap").json()["modules"]
    assert modules[0]["id"] == "sample"
    assert modules[0]["entry"] == "/static/sample/module.js"
