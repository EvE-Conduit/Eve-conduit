from django.apps import AppConfig


class AuditConfig(AppConfig):
    name = "evecsm.audit"
    label = "audit"
    verbose_name = "Audit and service logs"
