from django.apps import AppConfig


class OpsConfig(AppConfig):
    name = "conduit_ops"
    label = "ops"
    verbose_name = "Ops calendar"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.ops", "Ops")
        # Webhooks often post to channels everyone can read, so ops for some states or groups only go out as their
        # own "_restricted" events: admins send those to a leadership channel, or nowhere. They're private, so an
        # "every event" webhook leaves them out; only a webhook that picks them gets them.
        for suffix, who, private in (("", "", False), ("_restricted", " (for some states or groups only)", True)):
            bus.register(f"ops.created{suffix}", f"Op scheduled{who}", f"An op was put on the calendar{who}", plugin="ops", private=private)
            bus.register(f"ops.updated{suffix}", f"Op changed{who}", f"An op's time or details were changed{who}", plugin="ops", private=private)
            bus.register(f"ops.cancelled{suffix}", f"Op cancelled{who}", f"An op was called off{who}", plugin="ops", private=private)
            bus.register(f"ops.reminder{suffix}", f"Op reminder{who}", f"An op is about to start{who}", plugin="ops", private=private)
