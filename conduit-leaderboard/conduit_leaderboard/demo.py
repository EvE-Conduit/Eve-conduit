"""Example medals for demo mode (see conduit.demo.seed): the top three of every category for the last six months.

The boards themselves are worked out from the character sheet's data (and the Fleets plugin's FATs), which the
demo's other example data fills in; the medals only need members, so they show even where that data is thin."""

from datetime import timedelta

from django.apps import apps

from .models import Award, LeaderboardSettings

# category -> the range of a month's winning score
SCORES = {
    "kills": (25, 140), "isk_destroyed": (2e9, 45e9), "fats": (10, 32), "mining": (6e8, 7e9),
    "bounties": (3e8, 4.5e9), "industry": (20, 180), "losses": (4, 22),
}
COUNTS = {"kills", "fats", "industry", "losses"}


def seed(demo):
    LeaderboardSettings.load()  # every category, every member corporation, medals on: the defaults
    members = [u for u in demo.users if u.state_id == demo.states["member"].pk and u.main_character_id]
    # A few regulars win more often than the rest.
    stars = demo.sample(members, 6)
    categories = [k for k in SCORES if k != "fats" or apps.is_installed("conduit_fleets")]

    rows = []
    month = demo.now.date().replace(day=1)
    for _ in range(6):
        month = (month - timedelta(days=1)).replace(day=1)
        for key in categories:
            lo, hi = SCORES[key]
            pool = stars * 2 + [u for u in members if u not in stars]
            podium = []
            while len(podium) < 3:
                u = demo.pick(pool)
                if u not in podium:
                    podium.append(u)
            top = demo.rng.uniform(lo + (hi - lo) * 0.4, hi)
            scores = sorted([top, top * demo.rng.uniform(0.6, 0.95), top * demo.rng.uniform(0.3, 0.6)], reverse=True)
            for rank, (user, score) in enumerate(zip(podium, scores), start=1):
                rows.append(Award(month=month, category=key, rank=rank, user=user, score=float(round(score)) if key in COUNTS else round(score, 2)))
    Award.objects.bulk_create(rows)
