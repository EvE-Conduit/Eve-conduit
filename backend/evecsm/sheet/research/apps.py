from django.apps import AppConfig

from evecsm.sheet.registry import Section, register


class ResearchConfig(AppConfig):
    name = "evecsm.sheet.research"
    label = "research"

    def ready(self):
        register(
            Section(
                key="research",
                label="Research",
                sync="evecsm.sheet.research.sync.sync",
                scopes=('esi-characters.read_agents_research.v1',),
                required_scopes=('esi-characters.read_agents_research.v1',),
                interval=3600,
                order=42,
            )
        )
        from . import api  # noqa: F401
