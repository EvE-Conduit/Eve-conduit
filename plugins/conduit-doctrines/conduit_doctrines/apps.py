from django.apps import AppConfig


class DoctrinesConfig(AppConfig):
    name = "conduit_doctrines"
    label = "doctrines"
    verbose_name = "Doctrines"

    def ready(self):
        from conduit.events import bus

        bus.register("doctrines.fit_saved", "Doctrine fit saved", "A doctrine fit was added or changed", plugin="doctrines")
