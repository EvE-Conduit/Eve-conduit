from django.conf import settings
from django.db import models


class LeaderboardSettings(models.Model):
    """How the leaderboard is set up on this site. One row."""

    #: Category keys that are shown (see ``services.CATEGORIES``); empty means every category.
    categories = models.JSONField(default=list, blank=True)
    #: Corporation ids whose members compete; empty means every member, whatever their corporation.
    corporations = models.JSONField(default=list, blank=True)
    #: Show which of a member's characters earned the score (otherwise only the member's total).
    show_characters = models.BooleanField(default=True)
    #: How many places a board shows.
    places = models.PositiveSmallIntegerField(default=25)
    #: Hand out medals to the top three of each category when a month ends.
    medals = models.BooleanField(default=True)

    class Meta:
        permissions = [("manage_leaderboard", "Can choose the leaderboard's categories, corporations and medals")]

    @classmethod
    def load(cls) -> "LeaderboardSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Award(models.Model):
    """A medal: a member finished in the top three of a category for a month."""

    month = models.DateField(db_index=True)  # first day of the month
    category = models.CharField(max_length=30)
    rank = models.PositiveSmallIntegerField()  # 1, 2 or 3
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leaderboard_awards")
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("month", "category", "user")]
        ordering = ["-month", "category", "rank"]
