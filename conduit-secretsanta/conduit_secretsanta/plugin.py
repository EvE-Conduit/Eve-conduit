"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class SecretSantaPlugin(Plugin):
    id = "secretsanta"
    name = "Secret Santa"
    version = "1.0.1"
    description = "Members sign up with the character that should get the gift, a draw pairs everyone up, and each sees only who they give to."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-secretsanta"
    app = "conduit_secretsanta.apps.SecretSantaConfig"
    api = "conduit_secretsanta.api:router"
    frontend = "conduit_secretsanta/plugin.js"
    # Members sign up and give; running events needs secretsanta.organise_events.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"organise_events": "director"}
    nav = (NavItem("Secret Santa", "", "gift"),)
    # The reminder before the gift deadline, for everyone who hasn't marked their gift sent.
    periodic_tasks = {"remind-due": {"task": "conduit_secretsanta.tasks.remind_due", "schedule": 3600.0}}
