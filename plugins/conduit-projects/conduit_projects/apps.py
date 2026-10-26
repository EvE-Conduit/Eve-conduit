from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    name = "conduit_projects"
    label = "projects"
    verbose_name = "Industry Projects"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.projects", "Industry projects")
        bus.register("projects.created", "Project started", "A new industry project was put on the board", plugin="projects")
        bus.register("projects.contribution_delivered", "Project delivery confirmed",
                     "A manager confirmed a member's delivery to an industry project (with the Corp Store points it earns)",
                     plugin="projects")
        bus.register("projects.completed", "Project completed", "An industry project got everything it needed, or was closed as done",
                     plugin="projects")
