from conduit.plugins import Plugin, NavItem


class SamplePlugin(Plugin):
    id = "sample"
    name = "Sample"
    version = "1.0.0"
    app = "tests.sample_plugin.apps.SampleConfig"
    api = "tests.sample_plugin.api:router"
    external_api = "tests.sample_plugin.api:external_router"
    external_scopes = {"read": "Read sample data"}
    frontend = "sample/plugin.js"
    esi_scopes = ("esi-fleets.read_fleet.v1",)
    nav = (NavItem("Sample", "", "flask-conical"),)
    search = ("tests.sample_plugin.api:search",)
