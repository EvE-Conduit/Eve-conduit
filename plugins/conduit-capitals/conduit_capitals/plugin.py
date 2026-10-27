"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class CapitalsPlugin(Plugin):
    id = "capitals"
    name = "Capital Registry"
    version = "1.0.0"
    description = "Who can fly and who owns each capital class, where the hulls are parked, jump skills and clones."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-capitals"
    app = "conduit_capitals.apps.CapitalsConfig"
    api = "conduit_capitals.api:router"
    frontend = "conduit_capitals/plugin.js"
    # Every member sees their own characters; the registry of everyone needs capitals.view_registry, and then only
    # shows the characters the core sheet permissions let them read.
    # Where its permission shows in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"view_registry": "director"}
    nav = (
        NavItem("My capitals", "", "anchor"),
        NavItem("Registry", "registry", "radar", permission="capitals.view_registry"),
    )
    group_rules = ("conduit_capitals.rules",)
