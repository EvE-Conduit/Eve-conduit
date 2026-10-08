"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class RecruitmentPlugin(Plugin):
    id = "recruit"
    name = "Recruitment"
    version = "1.1.3"
    description = "Application forms, a review queue with each applicant's characters, notes and messages, and accepting into groups."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-recruitment"
    app = "conduit_recruitment.apps.RecruitmentConfig"
    api = "conduit_recruitment.api:router"
    frontend = "conduit_recruitment/plugin.js"
    # Everyone sees it: applicants apply there, recruiters (recruit.review_applications) get the queue.
    nav = (
        NavItem("Recruitment", "", "users"),
        NavItem("Settings", "settings", "wrench", permission="recruit.manage_forms"),
    )
    members_only = False
    # Recruiters may read an applicant's character sheets while the application is open.
    sheet_access = ("conduit_recruitment.services:recruiter_can_view",)
