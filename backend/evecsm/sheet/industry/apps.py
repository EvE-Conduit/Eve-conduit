from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class IndustryConfig(AppConfig):
    name = "evecsm.sheet.industry"
    label = "industry"

    def ready(self):
        register(
            Section(
                key="industry",
                label="Industry",
                sync="evecsm.sheet.industry.sync.sync",
                scopes=('esi-industry.read_character_jobs.v1',),
                required_scopes=('esi-industry.read_character_jobs.v1',),
                interval=900,
                order=41,
            )
        )
        from . import api  # noqa: F401
