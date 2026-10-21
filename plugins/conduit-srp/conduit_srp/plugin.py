"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class SrpPlugin(Plugin):
    id = "srp"
    name = "Ship Replacement"
    version = "1.0.3"
    description = "Members claim their losses from synced killmails; reviewers approve a payout and mark it paid."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-srp"
    app = "conduit_srp.apps.SrpConfig"
    api = "conduit_srp.api:router"
    frontend = "conduit_srp/plugin.js"
    # Losses are found in the killmails the character sheet syncs.
    esi_scopes = ("esi-killmails.read_killmails.v1",)
    # Everyone gets "My SRP"; the review queue needs srp.review_requests or srp.pay_requests.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"review_requests": "director", "pay_requests": "director", "manage_srp": "director"}
    nav = (NavItem("Ship replacement", "", "life-buoy"),)
