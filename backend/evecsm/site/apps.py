from django.apps import AppConfig


class SiteConfig(AppConfig):
    name = "evecsm.site"
    label = "site"

    def ready(self):
        from . import checks  # noqa: F401  (registers the security checks)
