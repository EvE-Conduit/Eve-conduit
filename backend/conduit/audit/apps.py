from django.apps import AppConfig


class AuditConfig(AppConfig):
    name = "conduit.audit"
    label = "audit"
    verbose_name = "Audit and service logs"
