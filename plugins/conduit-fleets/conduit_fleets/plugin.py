"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class FleetsPlugin(Plugin):
    id = "fleets"
    name = "Fleets & FATs"
    version = "1.2.0"
    description = "Track who flew in each fleet, from the FC's in-game fleet or a FAT link, with attendance stats and a FAT group rule."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-fleets"
    app = "conduit_fleets.apps.FleetsConfig"
    api = "conduit_fleets.api:router"
    frontend = "conduit_fleets/plugin.js"
    # The FC's character reads its in-game fleet's members, and adds the FAT lines to its MOTD.
    esi_scopes = ("esi-fleets.read_fleet.v1", "esi-fleets.write_fleet.v1")
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"run_fleets": "director", "manage_fleets": "director"}
    nav = (NavItem("Fleets", "", "rocket"),)
    # "Attended fleets" for group requirements and smart groups.
    group_rules = ("conduit_fleets.rules",)
    # Fleets being tracked are read every minute (ESI caches fleet members for a few seconds, so that's well within).
    periodic_tasks = {"track": {"task": "conduit_fleets.tasks.track_fleets", "schedule": 60.0}}
