"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class FreightPlugin(Plugin):
    id = "freight"
    name = "Freight"
    version = "1.0.0"
    description = "Routes with your rates, a calculator that gives the exact courier contract to make, and every courier contract checked against its route."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-freight"
    app = "conduit_freight.apps.FreightConfig"
    api = "conduit_freight.api:router"
    # Services marked public have a calculator anyone can use, without an account.
    public_api = "conduit_freight.public_api:router"
    public_pages = True
    frontend = "conduit_freight/plugin.js"
    # Courier contracts are read with the service owner's login.
    esi_scopes = ("esi-contracts.read_character_contracts.v1", "esi-contracts.read_corporation_contracts.v1")
    permission_tiers = {"view_contracts": "member", "manage_freight": "director"}
    nav = (NavItem("Freight", "", "truck"),)
    periodic_tasks = {
        "contracts": {"task": "conduit_freight.tasks.sync_all_contracts", "schedule": 900.0},
    }
