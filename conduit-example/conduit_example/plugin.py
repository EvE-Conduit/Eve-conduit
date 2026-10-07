"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import Plugin, NavItem


class ExamplePlugin(Plugin):
    id = "example"
    name = "Server Status"
    version = "0.1.0"
    description = "Live Tranquility status on the dashboard. Also the starting point for new plugins."
    author = "EvE Conduit"
    app = "conduit_example.apps.ExampleConfig"
    api = "conduit_example.api:router"
    frontend = "conduit_example/plugin.js"
    nav = (NavItem("Server status", "", "activity"),)
    default_enabled = True
