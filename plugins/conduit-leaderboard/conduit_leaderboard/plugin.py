"""Plugin declaration. Keep this file free of Django model imports."""

from celery.schedules import crontab

from conduit.plugins import NavItem, Plugin


class LeaderboardPlugin(Plugin):
    id = "leaderboard"
    name = "Leaderboard"
    version = "1.0.0"
    description = "Who tops the corporation in kills, ISK destroyed, fleets, mining, ratting, industry and skillpoints, with monthly medals."
    author = "EvE Conduit"
    url = "https://github.com/EvE-Conduit/plugins/tree/main/conduit-leaderboard"
    app = "conduit_leaderboard.apps.LeaderboardConfig"
    api = "conduit_leaderboard.api:router"
    frontend = "conduit_leaderboard/plugin.js"
    # Everyone sees the boards; choosing the categories and corporations needs leaderboard.manage_leaderboard.
    # Where its permissions show in Administration's permission picker (EvE Conduit 0.5.19+).
    permission_tiers = {"manage_leaderboard": "director"}
    nav = (NavItem("Leaderboard", "", "trophy"),)
    # Hand out the medals for a finished month once a day (the day after it ends, so the last syncs are in).
    periodic_tasks = {"awards": {"task": "conduit_leaderboard.tasks.award_finished_months", "schedule": crontab(hour=6, minute=20)}}
