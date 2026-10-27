"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class StructuresPlugin(Plugin):
    id = "structures"
    name = "Structures & Fuel"
    version = "1.0.0"
    description = "Every structure your corporations own on one board, fuel blocks burned and needed, warnings at the thresholds you choose, and members claiming refuels."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-structures"
    app = "conduit_structures.apps.StructuresConfig"
    api = "conduit_structures.api:router"
    frontend = "conduit_structures/plugin.js"
    # Structures come from the core's corporation sync (its Structures section and scope); no scopes of its own.
    # Who sees which structures follows the corporation sheet's permissions. Where its permission shows in
    # Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_structures": "director"}
    nav = (
        NavItem("Structures", "", "building"),
        NavItem("Fuel plan", "plan", "truck"),
        NavItem("Settings", "settings", "wrench", permission="structures.manage_structures"),
    )
    # Fuel warnings at the thresholds, refuels, and claims that are done or ran out. Fuel left is worked out from the
    # stored fuel_expires, so this needn't wait for the next corporation sync.
    periodic_tasks = {"check": {"task": "conduit_structures.tasks.check_fuel", "schedule": 900.0}}
