"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class DoctrinesPlugin(Plugin):
    id = "doctrines"
    name = "Doctrines"
    version = "1.1.0"
    description = "Fleet doctrines and their fits, shown like the in-game fitting window, with who can fly each fit and the skills they're missing."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-doctrines"
    app = "conduit_doctrines.apps.DoctrinesConfig"
    api = "conduit_doctrines.api:router"
    frontend = "conduit_doctrines/plugin.js"
    # "Save to my fittings in EVE" writes the fit to a character's in-game fittings.
    esi_scopes = ("esi-fittings.write_fittings.v1",)
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_doctrines": "director", "view_readiness": "director"}
    nav = (NavItem("Doctrines", "", "swords"),)
    # "Can fly doctrine fit" for group requirements and smart groups.
    group_rules = ("conduit_doctrines.rules",)
    search = ("conduit_doctrines.services:search",)
