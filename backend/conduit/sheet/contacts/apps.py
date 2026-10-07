from django.apps import AppConfig

from conduit.sheet.registry import Section, register


class ContactsConfig(AppConfig):
    name = "conduit.sheet.contacts"
    label = "sheet_contacts"

    def ready(self):
        register(
            Section(
                key="contacts",
                label="Contacts",
                sync="conduit.sheet.contacts.sync.sync",
                scopes=('esi-characters.read_contacts.v1',),
                required_scopes=('esi-characters.read_contacts.v1',),
                interval=3600,
                order=63,
            )
        )
        from . import api  # noqa: F401
