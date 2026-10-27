"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class StorePlugin(Plugin):
    id = "store"
    name = "Corp Store"
    version = "1.0.1"
    description = "Members earn points for referrals, fleets, mentoring and industry projects, and spend them in a store officers fill by hand."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-store"
    app = "conduit_store.apps.StoreConfig"
    api = "conduit_store.api:router"
    frontend = "conduit_store/plugin.js"
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_store": "director", "fulfil_orders": "director"}
    nav = (
        NavItem("Corp Store", "", "coins"),
        NavItem("My points", "me", "star"),
        NavItem("Orders", "orders", "package", permission="store.fulfil_orders"),
        NavItem("Manage", "manage", "wrench", permission="store.manage_store"),
    )
