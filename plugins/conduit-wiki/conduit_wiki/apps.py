from django.apps import AppConfig


class WikiConfig(AppConfig):
    name = "conduit_wiki"
    label = "wiki"
    verbose_name = "Wiki"

    def ready(self):
        from conduit.events import bus

        bus.register("wiki.page_created", "Wiki page created", "A new page was written", plugin="wiki")
        bus.register("wiki.page_updated", "Wiki page edited", "A page got a new revision", plugin="wiki")
