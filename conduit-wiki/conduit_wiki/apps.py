from django.apps import AppConfig


class WikiConfig(AppConfig):
    name = "conduit_wiki"
    label = "wiki"
    verbose_name = "Wiki"

    def ready(self):
        from conduit.events import bus

        # Webhooks often post to channels everyone can read, so pages for some states or groups only go out as their
        # own "_restricted" events. They're private: an "every event" webhook leaves them out, only one that picks
        # them gets them (a leadership channel, say).
        for suffix, who, private in (("", "", False), ("_restricted", " (for some states or groups only)", True)):
            bus.register(f"wiki.page_created{suffix}", f"Wiki page created{who}", f"A new page was written{who}", plugin="wiki", private=private)
            bus.register(f"wiki.page_updated{suffix}", f"Wiki page edited{who}", f"A page got a new revision{who}", plugin="wiki", private=private)
