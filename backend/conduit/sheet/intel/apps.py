from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class IntelConfig(AppConfig):
    name = "conduit.sheet.intel"
    label = "sheet_intel"

    def ready(self):
        register(
            Section(
                key="intel",
                label="Intel",
                sync="",
                virtual=True,
                sources=("wallet", "mail", "contracts", "contacts"),
                order=90,
            )
        )
        from . import api  # noqa: F401
