"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class MumblePlugin(Plugin):
    id = "mumble"
    name = "Mumble"
    version = "1.0.0"
    description = "Members get a Mumble account whose groups follow their groups and state; temporary access links let guests in for a while."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-mumble"
    app = "conduit_mumble.apps.MumbleConfig"
    api = "conduit_mumble.api:router"
    # The authenticator next to the Mumble server asks here whether a login is good (API key with p.mumble:auth).
    external_api = "conduit_mumble.external:router"
    external_scopes = {"auth": "Check Mumble logins and look up Mumble users (for the authenticator next to the Mumble server)"}
    # Temporary access links are opened by people without an account.
    public_api = "conduit_mumble.public_api:router"
    public_pages = True
    frontend = "conduit_mumble/plugin.js"
    # Where its permissions show in Administration's permission picker.
    permission_tiers = {"access_mumble": "member", "create_temp_links": "member", "manage_mumble": "director"}
    nav = (
        NavItem("Mumble", "", "mic"),
        NavItem("Temporary access", "temp", "clock", permission="mumble.create_temp_links"),
    )
    # Guests are let in through temporary links, not accounts.
    members_only = True
    periodic_tasks = {"cleanup": {"task": "conduit_mumble.tasks.cleanup", "schedule": 3600.0}}
