from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    name = "conduit_projects"
    label = "projects"
    verbose_name = "Industry Projects"

    def ready(self):
        from conduit.events import bus
        from conduit.notify.services import register_category

        register_category("p.projects", "Industry projects")
        bus.register("projects.created", "Project started", "A new industry project was put on the board", plugin="projects",
                     alert=True, manage="projects.manage_projects")
        bus.register("projects.contribution_delivered", "Project delivery confirmed",
                     "A manager confirmed a member's delivery to an industry project (with the Corp Store points it earns)",
                     plugin="projects")
        bus.register("projects.completed", "Project completed", "An industry project got everything it needed, or was closed as done",
                     plugin="projects")
        # Webhooks often post to channels everyone can read, so projects for some states or groups only go out as
        # their own "_restricted" events. They're private: an "every event" webhook leaves them out.
        who = " (for some states or groups only)"
        bus.register("projects.created_restricted", f"Project started{who}", f"A new industry project was put on the board{who}",
                     plugin="projects", private=True)
        bus.register("projects.contribution_delivered_restricted", f"Project delivery confirmed{who}",
                     f"A manager confirmed a member's delivery to an industry project{who}", plugin="projects", private=True)
        bus.register("projects.completed_restricted", f"Project completed{who}",
                     f"An industry project got everything it needed, or was closed as done{who}", plugin="projects", private=True)
