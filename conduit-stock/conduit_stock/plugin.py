"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class StockPlugin(Plugin):
    id = "stock"
    name = "Doctrine Stock"
    version = "1.0.1"
    description = "How many of each ship and item should be for sale at each staging location, what's short, and members claiming shortages to seed them."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-stock"
    app = "conduit_stock.apps.StockConfig"
    api = "conduit_stock.api:router"
    frontend = "conduit_stock/plugin.js"
    # Stock is counted from the market orders and contracts the core already syncs; no scopes of its own.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_stock": "director"}
    nav = (
        NavItem("Doctrine Stock", "", "boxes"),
        NavItem("Manage", "manage", "wrench", permission="stock.manage_stock"),
    )
    # Shortage alerts, and claims that ran out.
    periodic_tasks = {"check": {"task": "conduit_stock.tasks.check_stock", "schedule": 3600.0}}
