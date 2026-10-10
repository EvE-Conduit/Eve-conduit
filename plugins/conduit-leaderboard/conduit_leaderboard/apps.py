from django.apps import AppConfig


class LeaderboardConfig(AppConfig):
    name = "conduit_leaderboard"
    label = "leaderboard"
    verbose_name = "Leaderboard"

    def ready(self):
        from conduit.notify.services import register_category

        register_category("p.leaderboard", "Leaderboard medals")
