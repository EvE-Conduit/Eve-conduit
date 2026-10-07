from django.db import models


class LoyaltyPoints(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="loyalty_points")
    corporation_id = models.IntegerField()
    points = models.IntegerField()

    class Meta:
        unique_together = [("character", "corporation_id")]
