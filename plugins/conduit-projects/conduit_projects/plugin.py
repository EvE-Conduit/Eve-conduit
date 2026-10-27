"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class ProjectsPlugin(Plugin):
    id = "projects"
    name = "Industry Projects"
    version = "1.0.2"
    description = "A corp build board: members claim parts of a project, deliver them and see their industry jobs against it."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-projects"
    app = "conduit_projects.apps.ProjectsConfig"
    api = "conduit_projects.api:router"
    frontend = "conduit_projects/plugin.js"
    # Where its permission shows in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_projects": "director"}
    nav = (
        NavItem("Projects", "", "factory"),
        NavItem("My contributions", "me", "package"),
        NavItem("Deliveries", "queue", "boxes", permission="projects.manage_projects"),
    )
