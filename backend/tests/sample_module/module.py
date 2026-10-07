from evecsm.modules import Module, NavItem


class SampleModule(Module):
    id = "sample"
    name = "Sample"
    version = "1.0.0"
    app = "tests.sample_module.apps.SampleConfig"
    api = "tests.sample_module.api:router"
    external_api = "tests.sample_module.api:external_router"
    external_scopes = {"read": "Read sample data"}
    frontend = "sample/module.js"
    esi_scopes = ("esi-fleets.read_fleet.v1",)
    nav = (NavItem("Sample", "", "flask-conical"),)
    search = ("tests.sample_module.api:search",)
