"""Module declaration. Keep this file free of Django model imports."""

from evecsm.modules import Module, NavItem


class ExampleModule(Module):
    id = "example"
    name = "Server Status"
    version = "0.1.0"
    description = "Live Tranquility status on the dashboard. Also the starting point for new modules."
    author = "EVECSM"
    app = "evecsm_example.apps.ExampleConfig"
    api = "evecsm_example.api:router"
    frontend = "evecsm_example/module.js"
    nav = (NavItem("Server status", "", "activity"),)
    default_enabled = True
