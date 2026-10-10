"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class TeamSpeakPlugin(Plugin):
    id = "teamspeak"
    name = "TeamSpeak"
    version = "1.0.0"
    description = "Members link their TeamSpeak identity with a one-time privilege key; their server groups follow their groups and state."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-teamspeak"
    app = "conduit_teamspeak.apps.TeamSpeakConfig"
    api = "conduit_teamspeak.api:router"
    frontend = "conduit_teamspeak/plugin.js"
    # "Must be linked to TeamSpeak" (a setting) as part of compliance.
    compliance = ("conduit_teamspeak.services:compliance_problems",)
    # Where its permissions show in Administration's permission picker.
    permission_tiers = {"access_teamspeak": "member", "manage_teamspeak": "director"}
    nav = (NavItem("TeamSpeak", "", "headphones"),)
    # Every members' state gets access_teamspeak by default (defaults.py); guests have no business on comms.
    members_only = True
    # Group and state changes sync straight away; this catches anything missed (groups changed by hand on the server,
    # permissions changed on a state) and forgets link attempts nobody finished.
    periodic_tasks = {"sync-all": {"task": "conduit_teamspeak.tasks.sync_all", "schedule": 6 * 3600.0}}
