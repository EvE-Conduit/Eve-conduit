"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class FinancePlugin(Plugin):
    id = "finance"
    name = "Corp Finance"
    version = "1.0.1"
    description = "Income and spending per month by category, wallet balance history, internal transfers kept apart, and a monthly report."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-finance"
    app = "conduit_finance.apps.FinanceConfig"
    api = "conduit_finance.api:router"
    frontend = "conduit_finance/plugin.js"
    # Reads the wallet journals the core already syncs (corporation sheet -> Wallets); no scopes of its own.
    # Everything needs finance.view_finance, and then only shows corporations whose wallets the person may see on the
    # corporation sheet. Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_finance": "director", "manage_finance": "director"}
    nav = (
        NavItem("Corp finance", "", "wallet", permission="finance.view_finance"),
        NavItem("Monthly report", "report", "file-text", permission="finance.view_finance"),
        NavItem("Balances", "balances", "activity", permission="finance.view_finance"),
        NavItem("Journal", "journal", "scroll", permission="finance.view_finance"),
        NavItem("Settings", "settings", "wrench", permission="finance.manage_finance"),
    )
    # Report the month that just ended, once the wallets have synced past it.
    periodic_tasks = {"month": {"task": "conduit_finance.tasks.check_month", "schedule": crontab(minute=50)}}
