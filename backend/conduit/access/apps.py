from django.apps import AppConfig


class AccessConfig(AppConfig):
    name = "conduit.access"
    label = "access"

    def ready(self):
        from . import listeners, signals  # noqa: F401
        from .rules import load_module_rules

        load_module_rules()
