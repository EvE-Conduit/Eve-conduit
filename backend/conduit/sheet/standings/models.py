from django.db import models


class Standing(models.Model):
    character = models.ForeignKey("accounts.Character", on_delete=models.CASCADE, related_name="standings")
    from_id = models.IntegerField()
    from_type = models.CharField(max_length=20)  # agent, npc_corp, faction
    standing = models.FloatField()

    class Meta:
        unique_together = [("character", "from_id")]
