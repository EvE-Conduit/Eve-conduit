from django.apps import AppConfig


class SecretSantaConfig(AppConfig):
    name = "conduit_secretsanta"
    label = "secretsanta"
    verbose_name = "Secret Santa"

    def ready(self):
        from conduit.notify.services import register_category

        register_category("p.secretsanta", "Secret Santa")
