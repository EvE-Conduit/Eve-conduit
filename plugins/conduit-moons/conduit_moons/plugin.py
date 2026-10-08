"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class MoonsPlugin(Plugin):
    id = "moons"
    name = "Moon Mining Ledger"
    version = "1.1.1"
    description = "Who mined what from your moons each month, what it's worth, and moon tax with payments."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-moons"
    app = "conduit_moons.apps.MoonsConfig"
    api = "conduit_moons.api:router"
    frontend = "conduit_moons/plugin.js"
    # Everyone gets "My moon mining"; the full ledger needs moons.view_ledger.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_ledger": "director", "manage_ledger": "director"}
    nav = (NavItem("Moon mining", "", "pickaxe"),)
