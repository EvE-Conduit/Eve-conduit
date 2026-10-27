"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class TaxPlugin(Plugin):
    id = "tax"
    name = "Corp Tax"
    version = "1.0.1"
    description = "The bounty, ESS and mission tax each member paid the corporation, an extra tax billed monthly, and payments matched from the wallet."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-tax"
    app = "conduit_tax.apps.TaxConfig"
    api = "conduit_tax.api:router"
    frontend = "conduit_tax/plugin.js"
    # Everyone gets "My tax"; the full ledger needs tax.view_ledger.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_ledger": "director", "manage_ledger": "director"}
    nav = (NavItem("Corp tax", "", "landmark"),)
    group_rules = ("conduit_tax.rules",)
    # Match payments from the corporation wallets and remind members who haven't paid, once a day.
    periodic_tasks = {"daily": {"task": "conduit_tax.tasks.daily", "schedule": crontab(hour=7, minute=40)}}
