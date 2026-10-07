from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class SkillsConfig(AppConfig):
    name = "evecsm.sheet.skills"
    label = "skills"

    def ready(self):
        register(
            Section(
                key="skills",
                label="Skills",
                sync="evecsm.sheet.skills.sync.sync",
                scopes=("esi-skills.read_skills.v1", "esi-skills.read_skillqueue.v1"),
                required_scopes=("esi-skills.read_skills.v1",),
                interval=1800,
                order=10,
            )
        )
        from . import api  # noqa: F401
