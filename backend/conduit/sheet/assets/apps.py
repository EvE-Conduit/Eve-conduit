from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class AssetsConfig(AppConfig):
    name = "conduit.sheet.assets"
    label = "assets"

    def ready(self):
        register(
            Section(
                key="assets",
                label="Assets",
                sync="conduit.sheet.assets.sync.sync",
                scopes=("esi-assets.read_assets.v1", "esi-universe.read_structures.v1"),
                required_scopes=("esi-assets.read_assets.v1",),
                interval=3600,
                order=30,
            )
        )
        from . import api  # noqa: F401
