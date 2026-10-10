"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class WikiPlugin(Plugin):
    id = "wiki"
    name = "Wiki"
    version = "1.0.0"
    description = "Guides and reference pages in a tree, with Markdown, history, visibility by state or group, and public pages."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-wiki"
    app = "conduit_wiki.apps.WikiConfig"
    api = "conduit_wiki.api:router"
    # Pages marked public are readable by anyone at /public/p/wiki/<slug>.
    public_api = "conduit_wiki.public_api:router"
    public_pages = True
    frontend = "conduit_wiki/plugin.js"
    # Everyone reads what's meant for them; wiki.edit_pages writes; wiki.manage_wiki deletes, locks, moves and
    # decides who sees a page.
    permission_tiers = {"edit_pages": "member", "manage_wiki": "director"}
    nav = (NavItem("Wiki", "", "book-open"),)
    search = ("conduit_wiki.services:search",)
    default_enabled = True
