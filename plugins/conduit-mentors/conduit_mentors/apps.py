from django.apps import AppConfig


class MentorsConfig(AppConfig):
    name = "conduit_mentors"
    label = "mentors"
    verbose_name = "Mentoring"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.mentors", "Mentoring")
        bus.register("mentors.requested", "Mentor requested", "A new member asked for a mentor", plugin="mentors")
        bus.register("mentors.assigned", "Mentor assigned", "A mentor took on a new member", plugin="mentors")
        bus.register("mentors.graduated", "Mentee graduated", "A new member finished their mentorship", plugin="mentors")
