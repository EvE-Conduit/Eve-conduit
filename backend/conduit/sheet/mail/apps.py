from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class MailConfig(AppConfig):
    name = "conduit.sheet.mail"
    label = "sheet_mail"

    def ready(self):
        register(
            Section(
                key="mail",
                label="Mail",
                sync="conduit.sheet.mail.sync.sync",
                scopes=('esi-mail.read_mail.v1',),
                required_scopes=('esi-mail.read_mail.v1',),
                interval=900,
                order=60,
            )
        )
        from . import api  # noqa: F401
