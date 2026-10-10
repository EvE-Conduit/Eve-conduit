"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class BuybackPlugin(Plugin):
    id = "buyback"
    name = "Buyback"
    version = "1.2.2"
    description = "Members paste their items for an instant quote and contract them to you; every contract is checked against its quote."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-buyback"
    app = "conduit_buyback.apps.BuybackConfig"
    api = "conduit_buyback.api:router"
    # Programs marked public can be used without an account.
    public_api = "conduit_buyback.public_api:router"
    public_pages = True
    frontend = "conduit_buyback/plugin.js"
    # Contracts are read with the program owner's login.
    esi_scopes = ("esi-contracts.read_character_contracts.v1", "esi-contracts.read_corporation_contracts.v1")
    permission_tiers = {
        "view_leaderboard": "member",
        "manage_programs": "director",
        "view_all_statistics": "director",
        "manage_all_programs": "director",
    }
    nav = (NavItem("Buyback", "", "shopping-cart"),)
    periodic_tasks = {
        "contracts": {"task": "conduit_buyback.tasks.sync_all_contracts", "schedule": 900.0},
        # Refreshes prices older than the settings' maximum age.
        "prices": {"task": "conduit_buyback.tasks.update_prices", "schedule": 3600.0},
        "cleanup": {"task": "conduit_buyback.tasks.cleanup", "schedule": 6 * 3600.0},
        # ESI source: the whole order book; the manipulation guard's history.
        "market": {"task": "conduit_buyback.tasks.pull_market", "schedule": 1800.0},
        "history": {"task": "conduit_buyback.tasks.refresh_history", "schedule": 3600.0},
    }
