"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class SkillPlansPlugin(Plugin):
    id = "skillplans"
    name = "Skill Plans"
    version = "1.0.2"
    description = "Shared and personal skill plans with each character's progress and training time, copied straight into the game."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-skillplans"
    app = "conduit_skillplans.apps.SkillPlansConfig"
    api = "conduit_skillplans.api:router"
    frontend = "conduit_skillplans/plugin.js"
    # Skills, attributes and the queue come from the character sheet, which asks for the skill scopes itself.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_plans": "director", "view_progress": "director"}
    nav = (NavItem("Skill Plans", "", "graduation-cap"),)
    search = ("conduit_skillplans.services:search",)
    # "Completed skill plan" for group requirements and smart groups.
    group_rules = ("conduit_skillplans.rules",)
