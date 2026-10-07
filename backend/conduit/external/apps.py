from django.apps import AppConfig


class ExternalConfig(AppConfig):
    name = "conduit.external"
    label = "external"
    verbose_name = "External API"
