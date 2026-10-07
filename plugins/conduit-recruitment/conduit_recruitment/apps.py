from django.apps import AppConfig


class RecruitmentConfig(AppConfig):
    name = "conduit_recruitment"
    label = "recruit"
    verbose_name = "Recruitment"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.recruit", "Recruitment")
        bus.register("recruit.application_submitted", "Application submitted", "Someone applied to join", plugin="recruit")
        bus.register("recruit.application_decided", "Application decided", "An application was accepted or rejected", plugin="recruit")
