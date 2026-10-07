"""Plugin declaration. Keep this file free of Django model imports."""

from conduit.plugins import NavItem, Plugin


class MentorsPlugin(Plugin):
    id = "mentors"
    name = "Mentoring"
    version = "1.0.0"
    description = "New members ask for a mentor; mentors guide them through goals that tick themselves, with a thread, notes and graduation."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-mentors"
    app = "conduit_mentors.apps.MentorsConfig"
    api = "conduit_mentors.api:router"
    frontend = "conduit_mentors/plugin.js"
    # Every member sees it: new members ask for a mentor there, mentors (mentors.mentor) get their mentees.
    nav = (
        NavItem("Mentoring", "", "life-buoy"),
        NavItem("Mentoring program", "program", "wrench", permission="mentors.manage_program"),
    )
    # "Mentoring status" and "Is an active mentor", e.g. for a New bro role on Discord.
    group_rules = ("conduit_mentors.rules",)
    search = ("conduit_mentors.search:find",)
    # Mentors may read their active mentees' character sheets (a program setting, on by default).
    sheet_access = ("conduit_mentors.services:mentor_can_view",)
