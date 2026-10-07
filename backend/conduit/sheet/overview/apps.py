from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class OverviewConfig(AppConfig):
    name = "conduit.sheet.overview"
    label = "overview"

    def ready(self):
        register(
            Section(
                key="overview",
                label="Overview",
                sync="conduit.sheet.overview.sync.sync",
                scopes=(
                    "esi-location.read_location.v1",
                    "esi-location.read_ship_type.v1",
                    "esi-location.read_online.v1",
                    "esi-clones.read_clones.v1",
                    "esi-clones.read_implants.v1",
                    "esi-characters.read_fatigue.v1",
                    "esi-characters.read_titles.v1",
                    "esi-characters.read_corporation_roles.v1",
                    "esi-universe.read_structures.v1",
                ),
                interval=600,
                order=0,
            )
        )
        from . import api  # noqa: F401
